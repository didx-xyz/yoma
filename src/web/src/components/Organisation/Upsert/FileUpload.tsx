import { useState, useEffect } from "react";
import { FilePond, registerPlugin } from "react-filepond";
import FilePondPluginFileValidateType from "filepond-plugin-file-validate-type";
import "filepond/dist/filepond.min.css";
import FilePondPluginImageExifOrientation from "filepond-plugin-image-exif-orientation";
import FilePondPluginImagePreview from "filepond-plugin-image-preview";
import "filepond-plugin-image-preview/dist/filepond-plugin-image-preview.css";

registerPlugin(
  FilePondPluginFileValidateType,
  FilePondPluginImageExifOrientation,
  FilePondPluginImagePreview,
);

export interface InputProps {
  name: string;
  files: any[];
  fileTypes: string[];
  allowMultiple: boolean;
  onUploadComplete?: (data: any[]) => void;
}

export const FileUploader: React.FC<InputProps> = ({
  name,
  files,
  fileTypes,
  allowMultiple,
  onUploadComplete,
}) => {
  const [data, setFiles] = useState<any[]>(files);

  // Update local state when the files prop changes
  useEffect(() => {
    setFiles(files);
  }, [files]);

  return (
    <FilePond
      files={data}
      onupdatefiles={(updatedFiles) => {
        setFiles(updatedFiles);
        onUploadComplete && onUploadComplete(updatedFiles);
      }}
      allowMultiple={allowMultiple}
      dropOnPage
      name={name}
      dropValidation
      acceptedFileTypes={fileTypes}
      labelIdle='<span class="btn btn-sm rounded-full normal-case font-normal bg-white text-black">Choose File</span>'
      allowImageExifOrientation={true}
      credits={false}
    />
  );
};
