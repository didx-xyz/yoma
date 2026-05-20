import React, { useCallback, useEffect, useRef, useState } from "react";
import AvatarEditor, { type AvatarEditorRef } from "react-avatar-editor";
import { IoMdClose } from "react-icons/io";
import { FaPencilAlt, FaTimes, FaUpload } from "react-icons/fa";
import CustomModal from "~/components/Common/CustomModal";
import { AvatarImage } from "~/components/AvatarImage";
import { NoImage } from "~/components/Common/NoImage";

const Editor = AvatarEditor as any;

interface AvatarUploadProps {
  onUploadComplete?: (data: any[]) => void;
  onRemoveImageExisting?: () => void;
  onRemovePicture?: () => void;
  showExisting: boolean;
  existingImage?: string | File | null;
}

const AvatarUpload: React.FC<AvatarUploadProps> = ({
  onUploadComplete,
  onRemoveImageExisting,
  onRemovePicture,
  showExisting,
  existingImage,
}) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [croppedImage, setCroppedImage] = useState<string | null>(null);
  const [computedImageUrl, setComputedImageUrl] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<AvatarEditorRef>(null);
  const [cropModalVisible, setCropModalVisible] = useState(false);

  // Compute display image URL based on croppedImage or existingImage:
  useEffect(() => {
    if (croppedImage) {
      setComputedImageUrl(croppedImage);
    } else if (showExisting && existingImage) {
      if (typeof existingImage === "string") {
        setComputedImageUrl(existingImage);
      } else {
        // it's a File, create an object URL
        const objectUrl = URL.createObjectURL(existingImage);
        setComputedImageUrl(objectUrl);
        return () => URL.revokeObjectURL(objectUrl);
      }
    } else {
      setComputedImageUrl(null);
    }
  }, [croppedImage, existingImage, showExisting]);

  const handleImageUpload = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = () => {
          setSelectedImage(reader.result as string);
          setZoom(1);
        };
        reader.readAsDataURL(file);
        setCropModalVisible(true);
      }
    },
    [],
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
  }, [onUploadComplete]);

  const clearFile = useCallback(() => {
    if (inputRef.current) {
      inputRef.current.value = "";
    }
    setSelectedImage(null);
    setCroppedImage(null);
    onUploadComplete?.([null]);
    onRemoveImageExisting?.();
  }, [onUploadComplete, onRemoveImageExisting]);

  return (
    <fieldset className="fieldset bg-gray-light flex flex-col items-center justify-center rounded-lg p-4">
      {/* CROPPING MODAL */}
      <CustomModal
        isOpen={cropModalVisible}
        shouldCloseOnOverlayClick={false}
        onRequestClose={() => {
          setCropModalVisible(false);
        }}
        className={`md:max-h-[580px] md:w-[480px]`}
      >
        <div className="flex h-full flex-col gap-2 overflow-y-auto">
          <div className="bg-theme flex flex-row items-center p-4 shadow-lg">
            <h3 className="grow text-white">Edit</h3>
            <button
              type="button"
              className="btn bg-gray text-gray-dark hover:bg-gray-light rounded-full border-0 p-3"
              onClick={() => setCropModalVisible(false)}
            >
              <IoMdClose className="h-6 w-6" />
            </button>
          </div>
          {selectedImage && (
            <div className="my-4 flex flex-col items-center gap-2">
              <Editor
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
                  className="accent-green h-12 w-60"
                />
              </div>
              <div className="flex gap-4">
                <button
                  onClick={() => setCropModalVisible(false)}
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
      </CustomModal>

      {/* IMAGE UPLOAD */}
      <div className="flex w-full flex-col">
        <input
          name="logo"
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          ref={inputRef}
          className="hidden"
        />
        <button
          type="button"
          className="btn border-gray text-gray-dark btn-outline btn-sm hover:bg-gray-light max-w-40 normal-case"
          onClick={() => inputRef.current?.click()}
        >
          <FaUpload className="h-3 w-3" />
          Choose picture
        </button>
      </div>

      {/* LOGO PREVIEW */}
      {showExisting ? (
        <div className="mt-4 flex w-full flex-col items-center gap-3 rounded-lg bg-white py-8">
          {computedImageUrl ? (
            <AvatarImage
              icon={computedImageUrl}
              alt="Existing Avatar"
              size={150}
            />
          ) : (
            <div className="h-37.5 w-37.5 overflow-hidden rounded-full">
              <NoImage />
            </div>
          )}
          {computedImageUrl && onRemovePicture && (
            <button
              type="button"
              className="btn border-gray text-gray-dark btn-outline btn-sm hover:bg-gray-light normal-case"
              onClick={() => {
                onRemovePicture();
                setComputedImageUrl(null);
                if (inputRef.current) inputRef.current.value = "";
                setSelectedImage(null);
                setCroppedImage(null);
              }}
            >
              <FaTimes className="h-3 w-3" />
              Remove
            </button>
          )}
        </div>
      ) : (
        <div className="mt-4 flex w-full flex-col items-center gap-3 rounded-lg bg-white py-8">
          {computedImageUrl ? (
            <AvatarImage
              icon={computedImageUrl}
              alt="Cropped Avatar"
              size={150}
            />
          ) : (
            <div className="h-37.5 w-37.5 overflow-hidden rounded-full">
              <NoImage />
            </div>
          )}
          {croppedImage && (
            <div className="flex gap-2">
              <button
                type="button"
                className="btn border-gray text-gray-dark btn-outline btn-sm hover:bg-gray-light normal-case"
                onClick={() => setCropModalVisible(true)}
              >
                <FaPencilAlt className="h-3 w-3" />
                Edit
              </button>
              <button
                type="button"
                className="btn border-gray text-gray-dark btn-outline btn-sm hover:bg-gray-light normal-case"
                onClick={clearFile}
              >
                <FaTimes className="h-3 w-3" />
                Remove
              </button>
            </div>
          )}
        </div>
      )}
    </fieldset>
  );
};

export default AvatarUpload;
