import { type ReactElement, useRef, useState } from "react";
import Image from "next/image";
import { IoMdClose } from "react-icons/io";
import iconUpload from "public/images/icon-upload.svg";

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
}) => {
  const [data, setFiles] = useState<any[]>(files ?? []);
  const inputRef = useRef<HTMLInputElement>(null);

  // reset the native input so selecting the same file again triggers onChange
  const resetNativeInput = () => {
    if (inputRef.current) inputRef.current.value = "";
  };

  const onFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const picked = event.target.files[0];
      const result = allowMultiple ? [...data, picked] : [picked];
      setFiles(result);
      if (onUploadComplete) onUploadComplete(result);
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

            {/* render each file with remove button */}
            {data && data.length > 0 && (
              <div className="flex flex-col">
                {data.map((file, index) => (
                  <div
                    key={`OpportunityFileUpload_${id}_${index}`}
                    className="flex flex-row items-center justify-between"
                  >
                    <div className="flex grow flex-col">
                      <div className="text-xs font-bold">{file.name}</div>
                      <div className="text-gray-dark text-xs italic">
                        {formatFileSize(file.size)}
                      </div>
                    </div>
                    <button
                      type="button"
                      className="btn btn-sm text-gray-dark hover:bg-gray !rounded-full border-none shadow-md"
                      onClick={() => {
                        const newData = data.filter((_, i) => i !== index);
                        setFiles(newData);
                        if (onUploadComplete) {
                          onUploadComplete(newData);
                        }
                        // ensure selecting the same file again fires onChange
                        resetNativeInput();
                      }}
                    >
                      <IoMdClose className="h-6 w-6" />
                    </button>
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
