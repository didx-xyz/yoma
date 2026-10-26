import { type ReactElement, useRef, useState } from "react";
import Image from "next/image";
import { IoArrowUp, IoClose } from "react-icons/io5";
import { uploadFileWithTus } from "~/api/services/uploads";
import { toast } from "react-toastify";
import { MAX_FILE_SIZE, MAX_FILE_SIZE_LABEL } from "~/lib/constants";
import { BTN_OUTLINE_GREEN } from "../Common/buttonStyles";

const formatFileSize = (bytes: number, decimals = 1): string => {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["B", "KB", "MB", "GB", "TB", "PB"];
  const i = Math.min(
    sizes.length - 1,
    Math.floor(Math.log(bytes) / Math.log(k)),
  );
  const size = parseFloat((bytes / Math.pow(k, i)).toFixed(dm));
  return `${size} ${sizes[i]}`;
};

export interface FileUploadData {
  file: File;
  uploadId?: string;
  progress?: number;
  isUploading?: boolean;
  abortController?: AbortController; // For cancelling uploads
}

export interface InputProps {
  [id: string]: any;
  files: any[] | undefined;
  fileTypes: string;
  fileTypesLabels: string;
  allowMultiple: boolean;
  label?: string;
  icon?: any;
  iconAlt?: ReactElement | undefined;
  children?: ReactElement | undefined;
  onUploadComplete?: (data: any[]) => void;
  inlineUpload?: boolean; // New prop to enable TUS uploads
  maxFileSize?: number; // Custom max file size in bytes (defaults to MAX_FILE_SIZE)
  maxFileSizeLabel?: string; // Custom max file size label (defaults to MAX_FILE_SIZE_LABEL)
  onUploadProgress?: (fileIndex: number, progress: number) => void;
  onUploadError?: (fileIndex: number, error: Error) => void;
  /**
   * No grey card and no icon column: a label, one hint line and the outline-green Upload
   * button, for an item inside the completion form's "Proof of completion" section
   * (2026-10-21). The default keeps the card for the admin imports.
   */
  plain?: boolean;
  /** Plain mode: the required-status mark beside the label (`RequiredMark`). */
  mark?: React.ReactNode;
}

export const FileUpload: React.FC<InputProps> = ({
  id,
  files,
  fileTypes,
  fileTypesLabels,
  allowMultiple,
  label = "Upload file",
  icon,
  iconAlt,
  children,
  onUploadComplete,
  inlineUpload = false,
  maxFileSize = MAX_FILE_SIZE,
  maxFileSizeLabel = MAX_FILE_SIZE_LABEL,
  onUploadProgress,
  onUploadError,
  plain = false,
  mark,
}) => {
  const [data, setFiles] = useState<FileUploadData[]>(
    files?.map((file) => ({
      file,
      progress: 100,
      isUploading: false,
      uploadId: undefined,
    })) ?? [],
  );
  // The list as of the last render, for the upload callbacks that finish long after the
  // closure that started them: the TUS progress events already moved the list on by then.
  const dataRef = useRef(data);
  dataRef.current = data;
  const inputRef = useRef<HTMLInputElement>(null);

  // reset the native input so selecting the same file again triggers onChange
  const resetNativeInput = () => {
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleTusUpload = async (file: File, index: number) => {
    // Create AbortController for this upload
    const abortController = new AbortController();

    try {
      // Update the file state to show uploading and store abort controller
      setFiles((prevFiles) =>
        prevFiles.map((f, i) =>
          i === index
            ? { ...f, isUploading: true, progress: 0, abortController }
            : f,
        ),
      );

      const fileId = await uploadFileWithTus({
        file,
        signal: abortController.signal, // Pass abort signal
        onProgress: (bytesUploaded, bytesTotal) => {
          const progress = Math.round((bytesUploaded / bytesTotal) * 100);

          // Update progress in state
          setFiles((prevFiles) =>
            prevFiles.map((f, i) => (i === index ? { ...f, progress } : f)),
          );

          if (onUploadProgress) {
            onUploadProgress(index, progress);
          }
        },
        onError: (error) => {
          // Check if this was a user-initiated cancellation
          if (error.name === "AbortError" || error.name === "CanceledError") {
            console.log(`Upload cancelled for ${file.name}`);
          } else {
            console.error(`Upload failed for ${file.name}:`, error);

            // Extract error message from API response if available
            let errorMessage = error.message;

            // Check if error has response data (Axios error)
            if (
              "response" in error &&
              error.response &&
              typeof error.response === "object"
            ) {
              const response = error.response as any;

              // Try to extract message from response body
              if (response.data) {
                if (typeof response.data === "string") {
                  errorMessage = response.data;
                } else if (response.data.message) {
                  errorMessage = response.data.message;
                } else if (response.data.error) {
                  errorMessage = response.data.error;
                } else if (response.data.title) {
                  errorMessage = response.data.title;
                }
              }
            }

            toast.error(`Upload failed for ${file.name}: ${errorMessage}`);
          }

          if (onUploadError) {
            onUploadError(index, error);
          }

          // Remove the failed file from the list
          const updatedFiles = dataRef.current.filter((_, i) => i !== index);
          setFiles(updatedFiles);
          if (onUploadComplete) {
            onUploadComplete(updatedFiles);
          }
        },
      });

      // Update the file with upload ID and mark as complete. The parent's callback runs here,
      // after the state update is queued — never inside the updater: React runs updater
      // functions while rendering this component (twice in StrictMode, and again whenever it
      // rebases a queue), so a parent setState from inside one is a render-phase update of
      // another component, which React rejects and which cascades into "Maximum update depth
      // exceeded" once the parent's re-render re-runs the queue (2026-10-21).
      const updatedFiles = dataRef.current.map((f, i) =>
        i === index
          ? {
              ...f,
              uploadId: fileId,
              isUploading: false,
              progress: 100,
              abortController: undefined, // Clear abort controller
            }
          : f,
      );
      setFiles(updatedFiles);
      if (onUploadComplete) {
        onUploadComplete(updatedFiles);
      }
    } catch (error) {
      // Check if this was a cancellation - if so, it's already handled by onError callback
      const err = error as Error;
      if (err.name === "AbortError" || err.name === "CanceledError") {
        console.log("Upload was cancelled by user");
        return; // Exit gracefully, onError already handled UI updates
      }

      // Log other unexpected errors
      console.error("TUS upload error:", error);
    }
  };

  const onFileInputChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    if (event.target.files && event.target.files[0]) {
      const picked = event.target.files[0];

      // Validate file size before upload
      if (picked.size > maxFileSize) {
        toast.error(
          `File size exceeds the maximum allowed size of ${maxFileSizeLabel}. Please select a smaller file.`,
        );
        resetNativeInput();
        return;
      }

      if (inlineUpload) {
        // Inline upload mode: upload immediately using TUS
        const newFile: FileUploadData = {
          file: picked,
          progress: 0,
          isUploading: true,
          uploadId: undefined,
        };

        const newFiles = allowMultiple ? [...data, newFile] : [newFile];
        setFiles(newFiles);

        // Start the TUS upload
        const fileIndex = allowMultiple ? data.length : 0;
        await handleTusUpload(picked, fileIndex);
      } else {
        // Legacy mode: just store the file locally
        const newFile: FileUploadData = {
          file: picked,
          progress: 100,
          isUploading: false,
          uploadId: undefined,
        };

        const result = allowMultiple ? [...data, newFile] : [newFile];
        setFiles(result);

        if (onUploadComplete) {
          onUploadComplete(result);
        }
      }

      // allow re-selecting the same file after this selection
      resetNativeInput();
    }
  };

  const fileUpload = () => {
    if (inputRef.current) {
      inputRef.current.click();
    }
  };

  const uploadButton = (
    <button
      type="button"
      className={
        plain
          ? `${BTN_OUTLINE_GREEN} h-10 w-fit px-4`
          : "md:mr-2x md:scale-100x btn btn-circle border-green text-green btn-sm hover:border-green w-[95px] scale-[1.15x] bg-transparent normal-case"
      }
      // plain: several of these sit in one section, so each says which it is
      aria-label={plain && label ? `Upload ${label}` : undefined}
      onClick={fileUpload}
    >
      <IoArrowUp className="mr-1 h-4 w-4" />
      <span className="inline">Upload</span>
    </button>
  );

  return (
    <div
      key={`OpportunityFileUpload_${id}`}
      className={
        plain
          ? "flex w-full flex-col"
          : "bg-gray-light flex w-full flex-col rounded-lg border-dotted"
      }
    >
      <div className="flex w-full flex-row">
        {!plain && (
          <div className="ml-2 p-4 md:p-6">
            {icon && (
              <Image
                src={icon}
                alt="Icon Certificate"
                width={28}
                className="h-auto"
                sizes="100vw"
                priority={true}
              />
            )}
            {iconAlt && <div>{iconAlt}</div>}
          </div>
        )}
        <div className={`flex grow flex-col ${plain ? "" : "p-4"}`}>
          {plain ? (
            <>
              <div className="flex items-center gap-1.5 text-sm font-semibold text-black">
                {mark}
                <span>{label}</span>
              </div>
              <div className="text-gray-dark text-[13px]">
                {fileTypesLabels} · up to {maxFileSizeLabel}
              </div>
            </>
          ) : (
            <>
              <div className="font-semibold">{label}</div>
              <div className="text-gray-dark text-sm">
                Allowed file types:{" "}
                <span className="font-bold italic">{fileTypesLabels}</span>
              </div>
              <div className="text-gray-dark text-sm">
                Max file size:{" "}
                <span className="font-bold italic">{maxFileSizeLabel}</span>
              </div>
            </>
          )}

          <div className={`flex flex-col gap-4 ${plain ? "mt-3" : "mt-4"}`}>
            {uploadButton}
            <input
              hidden
              ref={inputRef}
              type="file"
              accept={fileTypes}
              multiple={allowMultiple}
              onChange={onFileInputChange}
            />

            {/* render each file with remove button and progress */}
            {data && data.length > 0 && (
              <div className="flex flex-col gap-2">
                {data.map((fileData, index) => (
                  <div
                    key={`OpportunityFileUpload_${id}_${index}`}
                    className="flex flex-col gap-1"
                  >
                    <div className="flex flex-row items-center justify-between">
                      <div className="flex grow flex-col">
                        <div className="text-xs font-bold">
                          {fileData.file.name}
                          {fileData.isUploading && (
                            <span className="text-gray-dark ml-2">
                              Uploading...
                            </span>
                          )}
                        </div>
                        <div className="text-gray-dark text-xs italic">
                          {formatFileSize(fileData.file.size)}
                        </div>
                      </div>
                      <button
                        type="button"
                        className="btn text-gray-dark btn-sm hover:bg-gray !rounded-full border-none shadow-md"
                        onClick={() => {
                          // Cancel upload if in progress
                          if (
                            fileData.isUploading &&
                            fileData.abortController
                          ) {
                            // Abort doesn't throw synchronously, it signals the ongoing request
                            fileData.abortController.abort();
                            return;
                          }

                          // File is not uploading, so we can safely remove it
                          const newData = data.filter((_, i) => i !== index);
                          setFiles(newData);
                          if (onUploadComplete) {
                            onUploadComplete(newData);
                          }
                          // ensure selecting the same file again fires onChange
                          resetNativeInput();
                        }}
                        title={
                          fileData.isUploading ? "Cancel upload" : "Remove file"
                        }
                      >
                        <IoClose className="h-6 w-6" />
                      </button>
                    </div>

                    {/* Progress bar for inline uploads */}
                    {inlineUpload &&
                      fileData.progress !== undefined &&
                      fileData.progress < 100 && (
                        <div className="h-2 w-full rounded-full bg-gray-200">
                          <div
                            className="bg-green h-2 rounded-full transition-all duration-300"
                            style={{ width: `${fileData.progress}%` }}
                          />
                        </div>
                      )}
                  </div>
                ))}
              </div>
            )}

            {children && <div className={plain ? "-mt-2" : ""}>{children}</div>}
          </div>
        </div>
      </div>
    </div>
  );
};
