import { type ReactElement, useRef, useState } from "react";
import Image from "next/image";
import { IoMdClose } from "react-icons/io";
import iconUpload from "public/images/icon-upload.svg";
import { uploadFileWithTus } from "~/api/services/uploads";
import { toast } from "react-toastify";
import { MAX_FILE_SIZE, MAX_FILE_SIZE_LABEL } from "~/lib/constants";

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
  onUploadProgress?: (fileIndex: number, progress: number) => void;
  onUploadError?: (fileIndex: number, error: Error) => void;
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
  onUploadProgress,
  onUploadError,
}) => {
  const [data, setFiles] = useState<FileUploadData[]>(
    files?.map((file) => ({
      file,
      progress: 100,
      isUploading: false,
      uploadId: undefined,
    })) ?? [],
  );
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
          setFiles((prevFiles) => prevFiles.filter((_, i) => i !== index));

          // Trigger onUploadComplete with updated file list
          const updatedFiles = data.filter((_, i) => i !== index);
          if (onUploadComplete) {
            onUploadComplete(updatedFiles);
          }
        },
      });

      // Update the file with upload ID and mark as complete
      setFiles((prevFiles) => {
        const updatedFiles = prevFiles.map((f, i) =>
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

        // Trigger onUploadComplete callback with updated files
        if (onUploadComplete) {
          onUploadComplete(updatedFiles);
        }

        return updatedFiles;
      });
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
      if (picked.size > MAX_FILE_SIZE) {
        toast.error(
          `File size exceeds the maximum allowed size of ${MAX_FILE_SIZE_LABEL}. Please select a smaller file.`,
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

  return (
    <div
      key={`OpportunityFileUpload_${id}`}
      className="bg-gray-light flex w-full flex-col rounded-lg border-dotted"
    >
      <div className="flex w-full flex-row">
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
        <div className="flex grow flex-col p-4">
          <div className="font-semibold">{label}</div>
          <div className="text-gray-dark text-sm">
            Allowed file types:{" "}
            <span className="font-bold italic">{fileTypesLabels}</span>
          </div>

          <div className="mt-4 flex flex-col gap-4">
            <button
              type="button"
              className="md:mr-2x md:scale-100x btn btn-circle btn-sm border-green text-green hover:border-green w-[95px] scale-[1.15x] bg-transparent normal-case"
              onClick={fileUpload}
            >
              <Image
                src={iconUpload}
                alt="Icon Upload"
                width={14}
                className="h-auto"
                sizes="100vw"
                priority={true}
              />
              <span className="inline">Upload</span>
            </button>
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
                        className="btn btn-sm text-gray-dark hover:bg-gray !rounded-full border-none shadow-md"
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
                        <IoMdClose className="h-6 w-6" />
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

            {children && <div>{children}</div>}
          </div>
        </div>
      </div>
    </div>
  );
};
