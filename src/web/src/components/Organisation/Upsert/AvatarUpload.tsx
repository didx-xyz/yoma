import React, { useState, useRef, useCallback } from "react";
import AvatarEditor from "react-avatar-editor";
import ReactModal from "react-modal";
import { IoMdClose, IoMdCrop } from "react-icons/io";
import { AvatarImage } from "~/components/AvatarImage";
import styles from "./AvatarUpload.module.css";

interface AvatarUploadProps {
  onUploadComplete?: (data: any[]) => void;
  onRemoveImageExisting?: () => void;
  showExisting: boolean;
  existingImage?: string;
}

const AvatarUpload: React.FC<AvatarUploadProps> = ({
  onUploadComplete,
  onRemoveImageExisting,
  showExisting,
  existingImage,
}) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [croppedImage, setCroppedImage] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<AvatarEditor>(null);
  const [cropModalVisible, setCropModalVisible] = useState(false);

  const handleImageUpload = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = () => {
          setSelectedImage(reader.result as string);
        };
        reader.readAsDataURL(file);
        setCropModalVisible(true);
      }
    },
    [setSelectedImage, setCropModalVisible],
  );

  const handleCropComplete = useCallback(() => {
    if (editorRef.current) {
      const croppedImageUrl = editorRef.current
        .getImageScaledToCanvas()
        .toDataURL();
      setCroppedImage(croppedImageUrl);

      // Convert base64 image to file
      fetch(croppedImageUrl)
        .then((res) => res.blob())
        .then((blob) => {
          const file = new File([blob], "avatar.png", { type: "image/png" });
          onUploadComplete?.([file]);
        });

      setCropModalVisible(false);
    }
  }, [editorRef, setCroppedImage, onUploadComplete, setCropModalVisible]);

  const clearFile = useCallback(() => {
    if (inputRef.current) {
      inputRef.current.value = "";
    }
    editorRef.current?.clear();
    setSelectedImage(null);
    setCroppedImage(null);
    onUploadComplete?.([null]);
    onRemoveImageExisting?.();
  }, [
    inputRef,
    setSelectedImage,
    setCroppedImage,
    editorRef,
    onUploadComplete,
    onRemoveImageExisting,
  ]);

  return (
    <div className="form-control flex flex-col items-center justify-center rounded-lg bg-gray-light p-4">
      {/* CROPPING MODAL */}

      <ReactModal
        isOpen={cropModalVisible}
        shouldCloseOnOverlayClick={false}
        onRequestClose={() => {
          setCropModalVisible(false);
        }}
        className={`fixed bottom-0 left-0 right-0 top-0 flex-grow overflow-hidden bg-white animate-in fade-in md:m-auto md:h-fit md:max-h-[650px] md:w-[600px] md:rounded-3xl`}
        portalClassName={"fixed z-40"}
        overlayClassName="fixed inset-0 bg-overlay"
      >
        <div className="flex flex-col gap-2">
          <div className="bg-theme flex flex-row items-center p-4 shadow-lg">
            <h3 className="flex-grow text-white">Edit</h3>
            <button
              type="button"
              className="btn rounded-full border-0 bg-gray p-3 text-gray-dark hover:bg-gray-light"
              onClick={() => {
                setCropModalVisible(false);
              }}
            >
              <IoMdClose className="h-6 w-6"></IoMdClose>
            </button>
          </div>
          {selectedImage && (
            <div className="my-12 flex flex-col items-center gap-6">
              <AvatarEditor
                name="logo"
                ref={editorRef}
                image={selectedImage}
                width={200}
                height={200}
                border={50}
                color={[169, 169, 169, 0.3]}
                scale={zoom}
                rotate={0}
                borderRadius={100}
                style={{ borderRadius: ".5rem", border: "2px solid #f1f1f1" }}
              />
              <div className="flex w-full items-center justify-center">
                <label htmlFor="zoom" className="mr-2">
                  Zoom:
                </label>
                <input
                  id="zoom"
                  type="range"
                  min={1}
                  max={2}
                  step={0.01}
                  value={zoom}
                  onChange={(e) => setZoom(parseFloat(e.target.value))}
                  className="h-12 w-60 accent-green"
                />
              </div>
              <div className="flex gap-4">
                <button
                  onClick={() => {
                    setCropModalVisible(false);
                  }}
                  className="btn btn-warning rounded-full px-12 py-2 text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCropComplete}
                  className="btn btn-primary rounded-full px-14 py-2 text-white"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      </ReactModal>

      {/* IMAGE UPLOAD */}

      <div className="flex w-full">
        <input
          name="logo"
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          ref={inputRef}
          className={styles.upload}
        />

        {selectedImage && (
          <div className="flex flex-grow justify-end gap-4">
            <button
              className="btn btn-secondary rounded-full text-white"
              onClick={() => {
                setCropModalVisible(true);
              }}
            >
              <IoMdCrop className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* LOGO PREVIEW */}

      {showExisting ? (
        <div className="mt-4 flex w-full justify-center rounded-lg bg-white py-8">
          {" "}
          <AvatarImage icon={existingImage} alt="Existing Avatar" size={150} />
        </div>
      ) : (
        <div className="mt-4 flex w-full justify-center rounded-lg bg-white py-8">
          <div className="indicator">
            <button
              className="filepond--file-action-button filepond--action-remove-item indicator-item !cursor-pointer rounded-full bg-gray-light hover:bg-error"
              type="button"
              data-align="left"
              onClick={clearFile}
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
            </button>
            <AvatarImage icon={croppedImage} alt="Cropped Avatar" size={150} />
          </div>
        </div>
      )}
    </div>
  );
};

export default AvatarUpload;
