import ReactModal from "react-modal";
import Image from "next/image";
import { IoMdClose } from "react-icons/io";
import iconZlto from "public/images/icon-zlto.svg";

export const ZltoModal = ({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) => {
  return (
    <>
      {/* WHAT IS ZLTO DIALOG */}
      <ReactModal
        isOpen={isOpen}
        shouldCloseOnOverlayClick={false}
        onRequestClose={onClose}
        className={`fixed bottom-0 left-0 right-0 top-0 flex-grow overflow-hidden bg-white animate-in fade-in md:m-auto md:max-h-[450px] md:max-w-[600px] md:rounded-3xl`}
        portalClassName={"fixed z-40"}
        overlayClassName="fixed inset-0 bg-overlay"
      >
        <div className="flex h-full flex-col gap-2 overflow-y-auto pb-12">
          <div className="flex flex-row p-4">
            <h1 className="flex-grow"></h1>
            <button
              type="button"
              className="btn rounded-full border-0 bg-gray-light p-3 text-gray-dark hover:bg-gray"
              onClick={onClose}
            >
              <IoMdClose className="h-6 w-6"></IoMdClose>
            </button>
          </div>
          <div className="flex flex-col items-center justify-center gap-4 p-4 md:p-0">
            <div className="-mt-8 flex h-14 w-14 items-center justify-center rounded-full border-green-dark bg-white shadow-lg">
              <Image
                src={iconZlto}
                alt="Icon Zlto"
                width={40}
                height={40}
                sizes="100vw"
                priority={true}
                style={{ width: "40px", height: "40px" }}
              />
            </div>
            <h3>What is Zlto?</h3>
            <p className="rounded-lg bg-gray-light p-4 text-center md:w-[450px]">
              Introducing Zlto, Yoma&apos;s fantastic reward system. Earn Zlto
              by completing tasks and opportunities. Redeem your well-deserved
              rewards in the marketplace and enjoy the amazing benefits that
              await you!
            </p>

            <div className="mt-4 flex w-full flex-grow justify-center gap-4">
              <button
                type="button"
                className="btn w-3/4 max-w-[300px] rounded-full border-purple bg-white normal-case text-purple hover:bg-purple hover:text-white"
                onClick={onClose}
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      </ReactModal>
    </>
  );
};
