import Image from "next/image";
import { IoMdClose } from "react-icons/io";
import iconPassport from "../../../public/images/passport.webp";
import CustomModal from "../Common/CustomModal";

export const YoIdModal = ({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) => {
  return (
    <CustomModal
      isOpen={isOpen}
      shouldCloseOnOverlayClick={false}
      onRequestClose={onClose}
      className={`md:max-h-[700px] md:max-w-[600px]`}
    >
      <div className="flex h-full flex-col gap-2 overflow-y-auto pb-12">
        <div className="flex flex-row p-4">
          <h1 className="grow"></h1>
          <button
            type="button"
            className="btn btn-circle text-gray-dark hover:bg-gray"
            onClick={onClose}
          >
            <IoMdClose className="h-6 w-6"></IoMdClose>
          </button>
        </div>
        <div className="flex flex-col items-center justify-center gap-4 p-4 md:p-0">
          <div className="border-green-dark bg-purple -mt-8 flex h-16 w-16 items-center justify-center rounded-full shadow-lg">
            <Image
              src={iconPassport}
              alt="Icon Zlto"
              width={40}
              className="h-auto"
              sizes="100vw"
              priority={true}
            />
          </div>
          <h3>Welcome to your Yo-ID!</h3>
          <p className="bg-gray-light rounded-lg p-2 text-center md:w-[450px] md:p-4">
            Yo-ID is your Yoma ID - and Yoma is an app that connects to many
            other apps; therefore you can see Yo-ID as your connection into the
            Yoma ecosystem!
          </p>

          <h3 className="mt-4">What can you do with Yo-ID?</h3>
          <ul className="bg-gray-light flex list-disc flex-col gap-4 rounded-lg p-2 text-left md:w-[450px] md:p-4">
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
          <ul className="bg-gray-light flex list-disc flex-col gap-4 rounded-lg p-2 text-left md:w-[450px] md:p-4">
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

          <div className="mt-4 flex w-full grow justify-center gap-4">
            <button
              type="button"
              className="btn border-purple text-purple hover:bg-purple w-3/4 max-w-[300px] rounded-full bg-white normal-case hover:text-white"
              onClick={onClose}
            >
              Got it
            </button>
          </div>
        </div>
      </div>
    </CustomModal>
  );
};
