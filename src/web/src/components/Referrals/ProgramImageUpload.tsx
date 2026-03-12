import Image from "next/image";
import React, { useCallback, useEffect, useRef, useState } from "react";
import AvatarEditor from "react-avatar-editor";
import { FaPencilAlt, FaTimes } from "react-icons/fa";
import { IoMdClose } from "react-icons/io";
import CustomModal from "~/components/Common/CustomModal";

const Editor = AvatarEditor as any;
const DEFAULT_ZOOM = 1;

interface ProgramImageUploadProps {
  onUploadComplete?: (data: any[]) => void;
  onRemoveImageExisting?: () => void;
  showExisting: boolean;
  existingImage?: string | File | null;
}

const ProgramImageUpload: React.FC<ProgramImageUploadProps> = ({
  onUploadComplete,
  onRemoveImageExisting,
  showExisting,
  existingImage,
}) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);
  const [croppedImage, setCroppedImage] = useState<string | null>(null);
  const [computedImageUrl, setComputedImageUrl] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<AvatarEditor>(null);
  const [cropModalVisible, setCropModalVisible] = useState(false);

  useEffect(() => {
    if (croppedImage) {
      setComputedImageUrl(croppedImage);
      return;
    }

    if (!existingImage) {
      setComputedImageUrl(null);
      return;
    }

    if (typeof existingImage === "string") {
      setComputedImageUrl(existingImage);
      return;
    }

    const objectUrl = URL.createObjectURL(existingImage);
    setComputedImageUrl(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [croppedImage, existingImage]);

  const handleImageUpload = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = () => {
        setSelectedImage(reader.result as string);
        setZoom(DEFAULT_ZOOM);
      };
      reader.readAsDataURL(file);
      setCropModalVisible(true);
    },
    [],
  );

  const handleCropComplete = useCallback(() => {
    if (!editorRef.current) return;

    const croppedImageUrl = editorRef.current
      .getImageScaledToCanvas()
      .toDataURL("image/png");

    setCroppedImage(croppedImageUrl);

    fetch(croppedImageUrl)
      .then((res) => res.blob())
      .then((blob) => {
        const file = new File([blob], "program-image.png", {
          type: "image/png",
        });
        onUploadComplete?.([file]);
      });

    setCropModalVisible(false);
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

  const openEditor = useCallback(() => {
    if (!computedImageUrl) return;
    setSelectedImage(computedImageUrl);
    setZoom(DEFAULT_ZOOM);
    setCropModalVisible(true);
  }, [computedImageUrl]);

  return (
    <fieldset className="fieldset bg-gray-light flex flex-col items-center justify-center rounded-lg p-4">
      <CustomModal
        isOpen={cropModalVisible}
        shouldCloseOnOverlayClick={false}
        onRequestClose={() => {
          setCropModalVisible(false);
        }}
        className={`md:max-h-[680px] md:w-[760px]`}
      >
        <div className="flex h-full flex-col gap-2 overflow-y-auto">
          <div className="bg-theme flex flex-row items-center p-4 shadow-lg">
            <h3 className="text-whit font-family-nunito grow text-lg">
              Edit program image
            </h3>
            <button
              type="button"
              className="btn bg-gray text-gray-dark hover:bg-gray-light rounded-full border-0 p-2"
              onClick={() => setCropModalVisible(false)}
            >
              <IoMdClose className="h-6 w-6" />
            </button>
          </div>

          {selectedImage && (
            <div className="my-12 flex flex-col items-center gap-6">
              <Editor
                ref={editorRef}
                image={selectedImage}
                width={360}
                height={160}
                border={40}
                color={[169, 169, 169, 0.3]}
                scale={zoom}
                rotate={0}
                borderRadius={0}
                style={{ borderRadius: ".75rem", border: "2px solid #f1f1f1" }}
              />

              <div className="flex w-full items-center justify-center">
                <label htmlFor="zoom_program_image" className="mr-2">
                  Zoom:
                </label>
                <input
                  id="zoom_program_image"
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

      <div className="flex w-full flex-col gap-3">
        <input
          name="programImage"
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          ref={inputRef}
          className="hidden"
          id="program-image-upload"
        />

        <div className="flex items-center gap-2">
          <label
            htmlFor="program-image-upload"
            className="btn btn-sm rounded-full border border-black bg-white normal-case"
          >
            {computedImageUrl ? "Change image" : "Upload image"}
          </label>

          {computedImageUrl && (
            <button
              type="button"
              className="btn btn-sm btn-ghost rounded-full normal-case"
              onClick={clearFile}
            >
              Remove image
            </button>
          )}
        </div>
      </div>

      <div className="mt-4 flex w-full justify-center rounded-lg bg-white py-6">
        <div className="relative w-full max-w-[18rem]">
          <div className="relative aspect-[9/4] w-full overflow-hidden rounded-t-2xl bg-gray-200">
            {computedImageUrl ? (
              <Image
                src={computedImageUrl}
                alt="Program preview"
                fill
                className="object-cover"
              />
            ) : (
              <div className="from-gray-light to-gray flex h-full w-full items-center justify-center bg-gradient-to-br">
                <span className="text-gray-dark rounded-full border border-white/70 bg-white/80 px-3 py-1 text-xs font-semibold tracking-wide uppercase">
                  No image selected
                </span>
              </div>
            )}
          </div>

          {!showExisting && computedImageUrl && (
            <>
              <button
                className="filepond--file-action-button filepond--action-revert-item-processing bg-secondary tooltip tooltip-top absolute top-2 right-10 z-10 flex size-6 cursor-pointer items-center justify-center rounded-full text-white"
                type="button"
                data-tip="Edit crop"
                onClick={openEditor}
              >
                <FaPencilAlt className="h-3 w-3" />
              </button>
              <button
                className="filepond--file-action-button filepond--action-remove-item bg-error tooltip tooltip-top absolute top-2 right-2 z-10 flex size-6 cursor-pointer items-center justify-center rounded-full text-white"
                type="button"
                data-tip="Remove image"
                onClick={clearFile}
              >
                <FaTimes className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
      </div>
    </fieldset>
  );
};

export default ProgramImageUpload;
