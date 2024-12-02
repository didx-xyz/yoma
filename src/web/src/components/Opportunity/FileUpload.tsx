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
      <div className="flex w-full flex-col md:flex-row">
        <div className="hidden items-center p-8 md:flex">
          <Image
            src={icon ?? iconCertificate}
            alt="Icon Certificate"
            width={28}
            className="h-auto"
            sizes="100vw"
            priority={true}
          />
        </div>
        <div className="flex flex-grow flex-col items-start justify-center p-4 pb-0 md:p-0">
          <div>{label}</div>
          <div className="text-sm text-gray-dark">{fileTypesLabels}</div>
        </div>
        <div className="flex justify-end p-4 md:items-center md:justify-center">
          <button
            className="btn btn-circle btn-sm -mt-[54px] scale-[1.15] border-green bg-transparent normal-case text-green hover:border-green md:mr-2 md:mt-0 md:w-[95px] md:scale-100"
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
            <span className="hidden md:inline">Upload</span>
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
        <div className="flex w-full flex-col p-2 pt-0 md:p-6">
          {data.map((file, index) => (
            <div
              key={`OpportunityFileUpload_${id}_${index}`}
              className="flex flex-row"
            >
              <div className="flex flex-grow flex-col items-start justify-center pl-2 md:pl-0">
                <div>{file.name}</div>
                <div className="text-sm text-gray-dark">{file.size}</div>
              </div>
              <div className="flex w-[100px] items-center justify-end">
                <button
                  className="btn scale-75 rounded-full border-green-dark bg-green-dark p-3 text-white md:scale-100"
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
