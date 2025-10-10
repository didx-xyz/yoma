/**
 * TUS Resumable Upload Service
 *
 * Implements the TUS protocol (https://tus.io) for resumable file uploads using Axios.
 * Leverages existing Axios interceptors for authentication, error handling, and analytics.
 *
 * Features:
 * - Chunked uploads (configurable, default: 5MB)
 * - Automatic retry with exponential backoff
 * - Progress tracking callbacks
 * - Works with both client and server-side contexts
 * - Automatic authentication via Axios interceptors
 * - Intelligent offset synchronization to prevent stale PATCH requests
 *
 * The TUS protocol flow:
 * 1. POST /uploads - Create upload session, get upload URL
 * 2. PATCH /uploads/{id} - Upload file data in chunks
 * 3. Return file ID for use in API requests
 *
 * Error Recovery:
 * After ANY failed PATCH request (409, 500, timeout, etc.), the client:
 * 1. Performs a HEAD request to query the server's current Upload-Offset
 * 2. Syncs the client offset to match the server's state
 * 3. Continues from the correct offset, preventing 409 conflicts
 *
 * This prevents "stale offset" issues where:
 * - Network retries cause duplicate requests
 * - Server processes data but client thinks it failed
 * - Proxy/load balancer replays cause offset mismatches
 */

import type { GetServerSidePropsContext } from "next/types";
import ApiClient from "~/lib/axiosClient";
import ApiServer from "~/lib/axiosServer";
import type { AxiosInstance } from "axios";
import { TUS_CHUNK_SIZE } from "~/lib/constants";

export interface TusUploadOptions {
  file: File;
  onProgress?: (bytesUploaded: number, bytesTotal: number) => void;
  onSuccess?: (fileId: string) => void;
  onError?: (error: Error) => void;
  context?: GetServerSidePropsContext;
  chunkSize?: number; // Optional chunk size in bytes (default: 1MB)
  retryDelays?: number[]; // Optional retry delays in ms
  signal?: AbortSignal; // Optional AbortSignal for cancellation
}

export interface TusUploadStatus {
  uploadOffset: number;
  uploadLength: number;
  uploadMetadata: string;
}

// Retry delays for upload failures - increased for better reliability
const DEFAULT_RETRY_DELAYS = [0, 2000, 5000, 10000];

/**
 * Creates and uploads a file using the TUS protocol for resumable uploads.
 * Uses Axios for all requests to leverage existing interceptors.
 * @param options - Upload configuration options
 * @returns Promise that resolves with the file ID when upload is complete
 */
export const uploadFileWithTus = async (
  options: TusUploadOptions,
): Promise<string> => {
  const {
    file,
    onProgress,
    onSuccess,
    onError,
    context,
    chunkSize = TUS_CHUNK_SIZE,
    retryDelays = DEFAULT_RETRY_DELAYS,
    signal,
  } = options;

  const instance = context ? ApiServer(context) : await ApiClient;

  try {
    // Check if already aborted
    if (signal?.aborted) {
      throw new DOMException("Upload cancelled", "AbortError");
    }

    // Step 1: Create the upload (POST)
    const uploadUrl = await createTusUpload(instance, file, signal);

    if (!uploadUrl) {
      throw new Error("Failed to create upload - no URL returned");
    }

    console.log("TUS Upload URL:", uploadUrl);

    // Extract file ID from upload URL
    const fileId = uploadUrl.split("/").pop();
    if (!fileId) {
      throw new Error("Failed to extract file ID from upload URL");
    }

    console.log("TUS Upload created:", fileId);

    // Step 2: Upload file data in chunks (PATCH)
    // Use the file ID as a relative path, not the full URL
    await uploadFileInChunks(
      instance,
      `/uploads/${fileId}`,
      file,
      chunkSize,
      retryDelays,
      onProgress,
      signal,
    );

    console.log("TUS Upload completed successfully:", fileId);

    if (onSuccess) {
      onSuccess(fileId);
    }

    return fileId;
  } catch (error) {
    const err = error as Error;

    // Don't re-throw cancellation errors - they're handled by the onError callback
    if (err.name === "AbortError" || err.name === "CanceledError") {
      console.log("Upload cancelled:", err.message);
      if (onError) {
        onError(err);
      }
      // Return empty string to indicate cancellation (not an error)
      return "";
    }

    console.error("TUS Upload failed:", error);
    if (onError && error instanceof Error) {
      onError(error);
    }
    throw error;
  }
};

/**
 * Step 1: Create a TUS upload session using Axios
 */
async function createTusUpload(
  axiosInstance: AxiosInstance,
  file: File,
  signal?: AbortSignal,
): Promise<string | null> {
  // Encode metadata as base64
  const encodedFilename = btoa(
    encodeURIComponent(file.name).replace(/%([0-9A-F]{2})/g, (_, p1) =>
      String.fromCharCode(parseInt(p1, 16)),
    ),
  );
  const encodedFiletype = btoa(file.type);

  console.log("Creating TUS upload:", {
    fileName: file.name,
    fileSize: file.size,
    fileSizeFormatted: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
    uploadLength: file.size.toString(),
  });

  const response = await axiosInstance.post(
    "/uploads",
    null, // No body for TUS create request
    {
      headers: {
        "Tus-Resumable": "1.0.0",
        "Upload-Length": file.size.toString(),
        "Upload-Metadata": `filename ${encodedFilename},filetype ${encodedFiletype}`,
      },
      signal, // Pass AbortSignal to Axios
    },
  );

  // The upload URL is returned in the Location header
  const locationHeader =
    response.headers["location"] ||
    response.headers["Location"] ||
    response.headers.location;

  console.log("TUS upload created:", {
    location: locationHeader,
    uploadLength:
      response.headers["upload-length"] || response.headers["Upload-Length"],
    tusResumable:
      response.headers["tus-resumable"] || response.headers["Tus-Resumable"],
  });

  if (!locationHeader) {
    console.error(
      "TUS Location header not found. This is likely a CORS issue.",
      "The server returned it, but the browser is blocking access to it.",
      "Check that 'Location' is in the Access-Control-Expose-Headers response header.",
    );
  }

  return locationHeader;
}

/**
 * Step 2: Upload file data in chunks with retry logic using Axios
 */
async function uploadFileInChunks(
  axiosInstance: AxiosInstance,
  uploadPath: string,
  file: File,
  chunkSize: number,
  retryDelays: number[],
  onProgress?: (bytesUploaded: number, bytesTotal: number) => void,
  signal?: AbortSignal,
): Promise<void> {
  let uploadOffset = 0;
  const totalSize = file.size;

  while (uploadOffset < totalSize) {
    // Check if upload was cancelled
    if (signal?.aborted) {
      throw new DOMException("Upload cancelled", "AbortError");
    }

    // CRITICAL: Before each PATCH, verify the server's current offset
    // This ensures we always have the correct offset, even if previous
    // PATCH succeeded on server but response was lost
    try {
      const headResponse = await axiosInstance.head(uploadPath, {
        headers: {
          "Tus-Resumable": "1.0.0",
        },
      });

      const serverOffset = parseInt(
        headResponse.headers["upload-offset"] ||
          headResponse.headers["Upload-Offset"] ||
          "0",
        10,
      );

      const serverLength = parseInt(
        headResponse.headers["upload-length"] ||
          headResponse.headers["Upload-Length"] ||
          "0",
        10,
      );

      // Check if upload is already complete on server
      if (serverOffset === serverLength && serverLength > 0) {
        console.log("Upload already complete on server. Finishing...");
        uploadOffset = serverOffset;

        // Report final progress
        if (onProgress) {
          onProgress(uploadOffset, totalSize);
        }
        break;
      }

      // Sync client offset with server's current state
      if (serverOffset !== uploadOffset) {
        console.log(
          `Offset sync before PATCH: Client was at ${uploadOffset}, server at ${serverOffset}. Syncing...`,
        );
        uploadOffset = serverOffset;

        // Report progress with corrected offset
        if (onProgress) {
          onProgress(uploadOffset, totalSize);
        }
      }
    } catch (headError) {
      console.warn("Failed to query upload offset before PATCH:", headError);
      // Continue with current offset if HEAD fails
    }

    const chunk = file.slice(uploadOffset, uploadOffset + chunkSize);
    const chunkData = await chunk.arrayBuffer();

    // Upload chunk with retry logic
    let uploaded = false;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= retryDelays.length; attempt++) {
      try {
        const response = await axiosInstance.patch(uploadPath, chunkData, {
          headers: {
            "Tus-Resumable": "1.0.0",
            "Upload-Offset": uploadOffset.toString(),
            "Content-Type": "application/offset+octet-stream",
          },
          // Disable default transformations for binary data
          transformRequest: [(data) => data],
          signal, // Pass AbortSignal to Axios
        });

        // Get the new offset from response
        const newOffset = parseInt(
          response.headers["upload-offset"] ||
            response.headers["Upload-Offset"] ||
            "0",
          10,
        );
        uploadOffset = newOffset;
        uploaded = true;

        // Report progress
        if (onProgress) {
          onProgress(uploadOffset, totalSize);
        }

        const percentage = ((uploadOffset / totalSize) * 100).toFixed(2);
        console.log(
          `Upload progress: ${percentage}% (${uploadOffset}/${totalSize})`,
        );

        break; // Success, exit retry loop
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // Don't retry if this was a cancellation
        if (
          lastError.name === "AbortError" ||
          lastError.name === "CanceledError"
        ) {
          throw lastError;
        }

        // Log the error details
        const axiosError = error as any;
        console.error(
          `Chunk upload failed (attempt ${attempt + 1}/${retryDelays.length + 1}):`,
          {
            status: axiosError.response?.status,
            statusText: axiosError.response?.statusText,
            data: axiosError.response?.data,
            message: lastError.message,
          },
        );

        // If we've exhausted retries, throw the error
        if (attempt >= retryDelays.length) {
          console.error("All retry attempts exhausted. Upload failed.");
          throw lastError;
        }

        // CRITICAL: After ANY error, we must re-sync the offset with the server
        // to avoid stale PATCH requests that cause 409 conflicts.
        // This prevents issues where:
        // - Server already processed some data but client thinks it failed
        // - Network/proxy retries caused duplicate requests
        // - Multiple retries with stale offsets
        console.log("Re-syncing offset with server before retry...");

        try {
          // Query the server for the current upload offset
          const headResponse = await axiosInstance.head(uploadPath, {
            headers: {
              "Tus-Resumable": "1.0.0",
            },
          });

          const serverOffset = parseInt(
            headResponse.headers["upload-offset"] ||
              headResponse.headers["Upload-Offset"] ||
              "0",
            10,
          );

          const serverLength = parseInt(
            headResponse.headers["upload-length"] ||
              headResponse.headers["Upload-Length"] ||
              "0",
            10,
          );

          console.log(
            `Server state: offset=${serverOffset}/${serverLength}, Client was at: ${uploadOffset}`,
          );

          // Check if upload is already complete on server
          if (serverOffset === serverLength && serverLength > 0) {
            console.log("Upload already complete on server. Finishing...");
            uploadOffset = serverOffset;
            uploaded = true;

            // Report final progress
            if (onProgress) {
              onProgress(uploadOffset, totalSize);
            }
            break;
          }

          // Update our offset to match the server's actual state
          if (serverOffset !== uploadOffset) {
            console.log(
              `Offset mismatch detected. Syncing from ${uploadOffset} to ${serverOffset}`,
            );
            uploadOffset = serverOffset;

            // Report progress with corrected offset
            if (onProgress) {
              onProgress(uploadOffset, totalSize);
            }

            // Continue to next chunk with correct offset
            uploaded = true;
            break;
          }

          // If offset matches but we still got an error, it means the server
          // rejected the upload for another reason (e.g., validation, S3 error)
          // Don't mark as uploaded, fall through to retry with delay
          console.warn(
            "Offset matches server but upload failed. Will retry after delay.",
          );
        } catch (headError) {
          console.error("Failed to query upload offset:", headError);
          // If HEAD request fails, the upload session might be corrupted
          // Don't mark as uploaded, fall through to retry
        }

        // Wait before retrying
        const delay = retryDelays[attempt];
        console.log(`Waiting ${delay}ms before retry...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    if (!uploaded && lastError) {
      throw lastError;
    }
  }
}

/**
 * Checks the status of an upload.
 * @param fileId - The ID of the uploaded file
 * @param context - Optional server-side context
 * @returns Promise with upload status information
 */
export const getUploadStatus = async (
  fileId: string,
  context?: GetServerSidePropsContext,
): Promise<TusUploadStatus> => {
  const instance = context ? ApiServer(context) : await ApiClient;

  const { headers } = await instance.head(`/uploads/${fileId}`, {
    headers: {
      "Tus-Resumable": "1.0.0",
    },
  });

  return {
    uploadOffset: parseInt(headers["upload-offset"] || "0", 10),
    uploadLength: parseInt(headers["upload-length"] || "0", 10),
    uploadMetadata: headers["upload-metadata"] || "",
  };
};

/**
 * Verifies if an upload is complete.
 * @param fileId - The ID of the uploaded file
 * @param context - Optional server-side context
 * @returns Promise<boolean> - True if upload is complete
 */
export const isUploadComplete = async (
  fileId: string,
  context?: GetServerSidePropsContext,
): Promise<boolean> => {
  try {
    const status = await getUploadStatus(fileId, context);
    return (
      status.uploadOffset === status.uploadLength && status.uploadLength > 0
    );
  } catch (error) {
    console.error("Error checking upload status:", error);
    return false;
  }
};
