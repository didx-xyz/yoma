import { type ReactElement, useRef, useState } from "react";
import Image from "next/image";
import { IoMdClose } from "react-icons/io";
import iconCertificate from "public/images/icon-certificate.svg";
import iconUpload from "public/images/icon-upload.svg";

export interface InputProps {
  [id: string]: any;
  files: any[] | undefined;
  fileTypes: string;
  fileTypesLabels: string;
  allowMultiple: boolean;
  label?: string;
  icon?: any;
  children: ReactElement | undefined;
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
  children,
  onUploadComplete,
}) => {
  const [data, setFiles] = useState<any[]>(files ?? []);

  const inputRef = useRef<HTMLInputElement>(null);

  const onFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const result = allowMultiple
        ? [...data, event.target.files[0]]
        : [event.target.files[0]];
      setFiles(result);
      if (onUploadComplete) onUploadComplete(result);
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
      className="flex w-full flex-col rounded-lg border-dotted bg-gray-light"
    >
      <div className="flex w-full flex-row">
        <div className="flex items-center p-8">
          <Image
            src={icon ?? iconCertificate}
            alt="Icon Certificate"
            width={28}
            height={28}
            sizes="100vw"
            priority={true}
            style={{ width: "28px", height: "28px" }}
          />
        </div>
        <div className="flex flex-grow flex-col items-start justify-center">
          <div>{label}</div>
          <div className="text-sm text-gray-dark">{fileTypesLabels}</div>
        </div>
        <div className="flex items-center justify-center p-4">
          <button
            className="btn btn-sm mr-2 rounded-md border-green bg-transparent normal-case text-green hover:border-green"
            onClick={fileUpload}
          >
            <Image
              src={iconUpload}
              alt="Icon Upload"
              width={14}
              height={14}
              sizes="100vw"
              priority={true}
              style={{ width: "14px", height: "14px" }}
            />
            Upload
          </button>
          <input
            hidden
            ref={inputRef}
            type="file"
            accept={fileTypes}
            onChange={onFileInputChange}
          />
        </div>
      </div>
      {/* render each file with remove button */}
      {data && data.length > 0 && (
        <div className="flex w-full flex-col p-4 pt-0">
          {data.map((file, index) => (
            <div
              key={`OpportunityFileUpload_${id}_${index}`}
              className="flex flex-row"
            >
              <div className="flex flex-grow flex-col items-start justify-center">
                <div>{file.name}</div>
                <div className="text-sm text-gray-dark">{file.size}</div>
              </div>
              <div className="flex w-[100px] items-center justify-center">
                <button
                  className="btn rounded-full border-green-dark bg-green-dark p-3 text-white"
                  onClick={() => {
                    const newData = data.filter((_, i) => i !== index);
                    setFiles(newData);
                    if (onUploadComplete) {
                      onUploadComplete(newData);
                    }
                  }}
                >
                  <IoMdClose className="h-6 w-6"></IoMdClose>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="px-8">{children && children}</div>
    </div>
  );
};
