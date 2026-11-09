/**
 * TUS protocol steps (https://tus.io) over an Axios instance: create the upload session, then
 * send the file in chunks with retry and offset re-sync. Kept free of app imports so the
 * retry/rejection behaviour has a unit test (`tusProtocol.test.ts`); `uploads.ts` picks the
 * client/server instance and wires the callbacks.
 *
 * Error recovery. After ANY failed PATCH (409, 500, timeout, …) the client HEADs the upload to
 * read the server's Upload-Offset, syncs to it and continues from there, so a lost response or
 * a proxy replay never produces a stale PATCH and a 409 loop. A 401 is refreshed and retried
 * by the Axios interceptor before it ever reaches this loop.
 *
 * Terminal rejection. Temporary uploads are owner-bound on the server: HEAD/PATCH on an id the
 * current user does not own, a legacy id created before ownership existed, or an id the server
 * no longer has, answers 403 (404/410 for a missing or expired upload). Retrying such an id
 * can never succeed, so the loop stops at once and throws `TusUploadRejectedError`; the UI
 * drops the id and offers a fresh upload (new POST, same file name and content type).
 */

import type { AxiosInstance } from "axios";

/** HEAD/PATCH statuses that mean "this upload id is gone for this user": never retried. */
export const TUS_TERMINAL_STATUSES: ReadonlySet<number> = new Set([
  403, 404, 410,
]);

/** The server rejected the upload id itself (not a transient failure). */
export class TusUploadRejectedError extends Error {
  override readonly name = "TusUploadRejectedError";
  readonly uploadPath: string;
  readonly status: number;

  constructor(uploadPath: string, status: number, cause: unknown) {
    super(`Upload ${uploadPath} rejected by the server (${status})`, {
      cause,
    });
    this.uploadPath = uploadPath;
    this.status = status;
  }
}

export const isTusUploadRejected = (
  error: unknown,
): error is TusUploadRejectedError => error instanceof TusUploadRejectedError;

/** The HTTP status of a failed Axios request, if the server answered at all. */
const responseStatus = (error: unknown): number | undefined => {
  if (typeof error !== "object" || error === null || !("response" in error))
    return undefined;
  const response = error.response;
  if (
    typeof response !== "object" ||
    response === null ||
    !("status" in response)
  )
    return undefined;
  return typeof response.status === "number" ? response.status : undefined;
};

/**
 * Rethrows `error` as `TusUploadRejectedError` when it is a terminal rejection of
 * `uploadPath`; returns otherwise so the caller continues on its recoverable path.
 */
const throwIfRejected = (uploadPath: string, error: unknown): void => {
  const status = responseStatus(error);
  if (status !== undefined && TUS_TERMINAL_STATUSES.has(status)) {
    throw new TusUploadRejectedError(uploadPath, status, error);
  }
};

/**
 * Step 1: create a TUS upload session (POST /uploads). Returns the upload URL from the
 * Location header, or null when the browser could not read it (CORS).
 */
export async function createTusUpload(
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

interface ServerState {
  offset: number;
  length: number;
}

/** HEAD the upload for the server's current offset/length; terminal statuses throw. */
async function queryServerState(
  axiosInstance: AxiosInstance,
  uploadPath: string,
): Promise<ServerState> {
  try {
    const { headers } = await axiosInstance.head(uploadPath, {
      headers: {
        "Tus-Resumable": "1.0.0",
      },
    });
    return {
      offset: parseInt(
        headers["upload-offset"] || headers["Upload-Offset"] || "0",
        10,
      ),
      length: parseInt(
        headers["upload-length"] || headers["Upload-Length"] || "0",
        10,
      ),
    };
  } catch (error) {
    throwIfRejected(uploadPath, error);
    throw error;
  }
}

/**
 * Step 2: upload the file data in chunks (PATCH) with retry and offset re-sync.
 * Throws `TusUploadRejectedError` as soon as the server rejects the upload id; other
 * failures retry per `retryDelays`, and the last error is thrown when they run out.
 */
export async function uploadFileInChunks(
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
      const server = await queryServerState(axiosInstance, uploadPath);

      // Check if upload is already complete on server
      if (server.offset === server.length && server.length > 0) {
        console.log("Upload already complete on server. Finishing...");
        uploadOffset = server.offset;

        // Report final progress
        if (onProgress) {
          onProgress(uploadOffset, totalSize);
        }
        break;
      }

      // Sync client offset with server's current state
      if (server.offset !== uploadOffset) {
        console.log(
          `Offset sync before PATCH: Client was at ${uploadOffset}, server at ${server.offset}. Syncing...`,
        );
        uploadOffset = server.offset;

        // Report progress with corrected offset
        if (onProgress) {
          onProgress(uploadOffset, totalSize);
        }
      }
    } catch (headError) {
      if (isTusUploadRejected(headError)) throw headError;
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

        // The server rejected this upload id: retrying cannot succeed
        throwIfRejected(uploadPath, error);

        // Log the error details
        console.error(
          `Chunk upload failed (attempt ${attempt + 1}/${retryDelays.length + 1}):`,
          {
            status: responseStatus(error),
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
          const server = await queryServerState(axiosInstance, uploadPath);

          console.log(
            `Server state: offset=${server.offset}/${server.length}, Client was at: ${uploadOffset}`,
          );

          // Check if upload is already complete on server
          if (server.offset === server.length && server.length > 0) {
            console.log("Upload already complete on server. Finishing...");
            uploadOffset = server.offset;
            uploaded = true;

            // Report final progress
            if (onProgress) {
              onProgress(uploadOffset, totalSize);
            }
            break;
          }

          // Update our offset to match the server's actual state
          if (server.offset !== uploadOffset) {
            console.log(
              `Offset mismatch detected. Syncing from ${uploadOffset} to ${server.offset}`,
            );
            uploadOffset = server.offset;

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
          if (isTusUploadRejected(headError)) throw headError;
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
