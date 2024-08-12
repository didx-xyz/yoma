import ReactModal from "react-modal";
import Image from "next/image";
import iconPassport from "../../../public/images/passport.webp";
import { IoMdClose } from "react-icons/io";
import { useDisableBodyScroll } from "~/hooks/useDisableBodyScroll";

export const YoIdModal = ({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) => {
  // 👇 prevent scrolling on the page when the dialogs are open
  useDisableBodyScroll(isOpen);

  return (
    <>
      <ReactModal
        isOpen={isOpen}
        shouldCloseOnOverlayClick={false}
        onRequestClose={onClose}
        className={`fixed bottom-0 left-0 right-0 top-0 flex-grow overflow-hidden bg-white animate-in fade-in md:m-auto md:max-h-[700px] md:max-w-[600px] md:rounded-3xl`}
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
            <div className="-mt-8 flex h-16 w-16 items-center justify-center rounded-full border-green-dark bg-purple shadow-lg">
              <Image
                src={iconPassport}
                alt="Icon Zlto"
                width={40}
                height={40}
                sizes="100vw"
                priority={true}
                style={{ width: "40px", height: "40px" }}
              />
            </div>
            <h3>Welcome to your Yo-ID!</h3>
            <p className="rounded-lg bg-gray-light p-2 text-center md:w-[450px] md:p-4">
              Yo-ID is your Yoma ID - and Yoma is an app that connects to many
              other apps; therefore you can see Yo-ID as your connection into
              the Yoma ecosystem!
            </p>

            <h3 className="mt-4">What can you do with Yo-ID?</h3>
            <ul className="flex list-disc flex-col gap-4 rounded-lg bg-gray-light p-2 text-left md:w-[450px] md:p-4">
              <li className="ml-6">Complete opportunities on Yoma!</li>
              <li className="ml-6">
                Collect digital blockchain credentials, in your passport.
              </li>
              <li className="ml-6">
                Earn ZLTO, and spend on the awesome marketplace.
              </li>
              <li className="ml-6">Build up your verifiable skills!</li>
              <li className="ml-6">Digital CV coming soon!</li>
            </ul>

            <h3 className="mt-4">What&apos;s more?</h3>
            <ul className="flex list-disc flex-col gap-4 rounded-lg bg-gray-light p-2 text-left md:w-[450px] md:p-4">
              <li className="ml-6">
                Digital credentials in your passport are blockchain verifiable,
                private and 100% secure.
              </li>
              <li className="ml-6">
                Goodwall and Atingi will let you Login with Yoma!
              </li>
            </ul>

            <a
              href="https://docs.yoma.world/technology/what-is-yoid"
              target="_blank"
              className="mt-2 tracking-wide underline"
            >
              Learn more
            </a>

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
