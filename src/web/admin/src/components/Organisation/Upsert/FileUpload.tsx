/* eslint-disable */
import { useState } from "react";
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
  files: any[];
  fileTypes: string[];
  allowMultiple: boolean;
  onUploadComplete?: (data: any[]) => void;
}

export const FileUploader: React.FC<InputProps> = ({
  files,
  fileTypes,
  allowMultiple,
  onUploadComplete,
}) => {
  const [data, setFiles] = useState<any[]>(files);

  return (
    <div>
      <FilePond
        files={data}
        onupdatefiles={(data) => {
          setFiles(data);
          onUploadComplete && onUploadComplete(data);
        }}
        allowMultiple={allowMultiple}
        dropOnPage
        name="files"
        dropValidation
        acceptedFileTypes={fileTypes}
        labelIdle='Drag & Drop your files or <span class="filepond--label-action">Browse</span>'
        allowImageExifOrientation={true}
      />
    </div>
  );
};
/* eslint-enable */
