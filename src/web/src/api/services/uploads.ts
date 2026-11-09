/**
 * TUS Resumable Upload Service
 *
 * Resumable file uploads (https://tus.io) through the app's Axios instances, so the existing
 * interceptors supply authentication (including the 401 token refresh), error handling and
 * analytics. The protocol steps, retry policy and terminal-rejection rules live in
 * `tusProtocol.ts`; this module picks the client/server instance and wires the callbacks.
 *
 * Flow: POST /uploads creates the session, PATCH /uploads/{id} sends the chunks, and the file
 * id is returned for the API request that attaches it. The server rejecting the id (403 for
 * an upload the user does not own or a legacy unowned id, 404/410 when it is gone) throws
 * `TusUploadRejectedError` without retrying; the UI then offers a fresh upload.
 */

import type { GetServerSidePropsContext } from "next/types";
import ApiClient from "~/lib/axiosClient";
import ApiServer from "~/lib/axiosServer";
import { TUS_CHUNK_SIZE } from "~/lib/constants";
import { createTusUpload, uploadFileInChunks } from "./tusProtocol";

export interface TusUploadOptions {
  file: File;
  onProgress?: (bytesUploaded: number, bytesTotal: number) => void;
  onSuccess?: (fileId: string) => void;
  onError?: (error: Error) => void;
  context?: GetServerSidePropsContext;
  chunkSize?: number; // Optional chunk size in bytes (default: TUS_CHUNK_SIZE)
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
