import { useState } from "react";
import { FilePond, registerPlugin } from "react-filepond";
//import FilePondPluginFileValidateSize from "filepond-plugin-file-validate-size";
import FilePondPluginFileValidateType from "filepond-plugin-file-validate-type";
// Import FilePond styles
import "filepond/dist/filepond.min.css";

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

//import "filepond/dist/filepond.min.css";

export interface InputProps {
  //organisation: OrganizationCreateRequest | null;
  // onSubmit: (fieldValues: FieldValues) => void;
  // onCancel: (fieldValues: FieldValues) => void;
  files: any[];
  fileTypes: string[];
  allowMultiple: boolean;
  onUploadComplete?: (data: any[]) => void;
}

// export const FileUploader = (props: FileUploaderProps) => {
export const FileUploader: React.FC<InputProps> = ({
  files,
  fileTypes,
  allowMultiple,
  onUploadComplete,
}) => {
  const [data, setFiles] = useState<any[]>(files);

  return (
    <div
    //className={styles.wrapper}
    >
      files: {files?.length}
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
