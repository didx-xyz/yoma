/* eslint-disable */
import { registerPlugin } from "react-filepond";
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
import Link from "next/link";
import { OrganizationDocument } from "~/api/models/organisation";
import { useCallback, useState } from "react";

registerPlugin(
  FilePondPluginFileValidateType,
  FilePondPluginImageExifOrientation,
  FilePondPluginImagePreview,
);

export interface InputProps {
  doc: OrganizationDocument;
  onRemove?: (doc: OrganizationDocument) => void;
}

export const Document: React.FC<InputProps> = ({ doc, onRemove }) => {
  const [isRemoved, setIsRemoved] = useState(false);

  const onRemoveSubmit = useCallback(() => {
    if (onRemove) onRemove(doc);
    setIsRemoved(true);
  }, [setIsRemoved]);

  if (isRemoved) return null;

  return (
    <div className="flex flex-row items-center gap-4 rounded-lg bg-emerald-400 p-2">
      {onRemove && (
        <button
          className="filepond--file-action-button filepond--action-remove-item"
          type="button"
          data-align="left"
          onClick={onRemoveSubmit}
        >
          <svg
            width="26"
            height="26"
            viewBox="0 0 26 26"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M11.586 13l-2.293 2.293a1 1 0 0 0 1.414 1.414L13 14.414l2.293 2.293a1 1 0 0 0 1.414-1.414L14.414 13l2.293-2.293a1 1 0 0 0-1.414-1.414L13 11.586l-2.293-2.293a1 1 0 0 0-1.414 1.414L11.586 13z"
              fill="currentColor"
              fillRule="nonzero"
            ></path>
          </svg>
          <span>Remove</span>
        </button>
      )}

      <div className="flex flex-col">
        <Link
          key={doc.fileId}
          href={doc.url}
          target="_blank"
          className="text-xs font-bold text-white underline"
        >
          {doc.originalFileName}
        </Link>

        <span className="text-xs text-white">{doc.contentType}</span>
      </div>
    </div>
  );
};
/* eslint-enable */
