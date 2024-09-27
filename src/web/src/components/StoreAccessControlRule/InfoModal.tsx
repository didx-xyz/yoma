import ReactModal from "react-modal";
import Image from "next/image";
import iconPassport from "../../../public/images/passport.webp";
import { IoMdClose } from "react-icons/io";
import { useDisableBodyScroll } from "~/hooks/useDisableBodyScroll";

export const InfoModal = ({
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
            <h3>How Store Access Rules Work</h3>
            <p className="rounded-lg bg-gray-light p-2 text-center md:w-[450px] md:p-4">
              The access to stores and specific items within a store is
              controlled by a set of rules. These rules determine who can access
              certain items based on various conditions like gender, age, and
              completed activities (opportunities).
            </p>
            <h3 className="mt-4">Example:</h3>
            <div className="rounded-lg bg-gray-light p-2 md:w-[450px] md:p-4">
              <p>
                In the <strong>Airtime Yoma SA</strong> store, there are two
                rules:
              </p>
              <ul className="flex list-disc flex-col gap-4 text-left">
                <li className="ml-6 mt-2">
                  <strong>Rule A:</strong> Allows <strong>males</strong> to
                  access the general store and all item categories, except where
                  other rules apply stricter conditions.
                </li>
                <li className="ml-6">
                  <strong>Rule B:</strong> Allows <strong>females</strong> to
                  access the specific item category called{" "}
                  <strong>R10 Airtime</strong>.
                </li>
              </ul>
            </div>
            <h3 className="mt-4">What does this mean?</h3>
            <div className="rounded-lg bg-gray-light p-2 md:w-[450px] md:p-4">
              <ul className="flex list-disc flex-col gap-4 text-left">
                <li className="ml-6">
                  <strong>Males</strong> can access the entire{" "}
                  <strong>Airtime Yoma SA</strong> store,{" "}
                  <strong>except</strong> for the <strong>R10 Airtime</strong>{" "}
                  category, which is restricted to females.
                </li>
                <li className="ml-6">
                  <strong>Females</strong> can access only the{" "}
                  <strong>R10 Airtime</strong> category but not the rest of the
                  store.
                </li>
              </ul>
            </div>
            <h3 className="mt-4">Important to Note:</h3>
            <div className="flex flex-col gap-4 rounded-lg bg-gray-light p-2 md:w-[450px] md:p-4">
              <ul className="list-disc text-left">
                <li className="ml-6">
                  The system always follows the{" "}
                  <strong>most restrictive rule</strong>. Even if a general rule
                  grants access, a more specific rule (like the one restricting
                  access to <strong>R10 Airtime</strong>) will take precedence
                  and block access when conditions are not met.
                </li>
              </ul>
              <p>
                This ensures that all access is carefully controlled based on
                the rules defined for each store and item category.
              </p>
            </div>

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