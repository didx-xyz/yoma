/* eslint-disable */
import { useState } from "react";
import { FilePond, registerPlugin } from "react-filepond";
//import FilePondPluginFileValidateSize from "filepond-plugin-file-validate-size";
import FilePondPluginFileValidateType from "filepond-plugin-file-validate-type";
// Import FilePond styles
import "filepond/dist/filepond.min.css";
//import "./FileUpload.module.css";

// Import the Image EXIF Orientation and Image Preview plugins
// Note: These need to be installed separately
// `npm i filepond-plugin-image-preview filepond-plugin-image-exif-orientation --save`
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
      //labelIdle='Drag & Drop your files or <span class="filepond--label-action">Browse</span>'
      // labelIdle='<span class="btn btn-sm btn-primary normal-case">Choose File</span>'
      labelIdle='<span class="btn btn-sm rounded-full normal-case font-normal bg-white text-black">Choose File</span>'
      //={"-p-4 -m-4"}
      allowImageExifOrientation={true}
      credits={false}
    />
  );
};
/* eslint-enable */
