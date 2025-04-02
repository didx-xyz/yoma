import Image from "next/image";
import { IoMdClose } from "react-icons/io";
import iconPassport from "../../../public/images/passport.webp";
import CustomModal from "../Common/CustomModal";

export const InfoModal = ({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) => {
  return (
    <>
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
            <h3>How Store Access Rules Work</h3>
            <p className="bg-gray-light rounded-lg p-2 text-center md:w-[450px] md:p-4">
              The access to stores and specific items within a store is
              controlled by a set of rules. These rules determine who can access
              certain items based on various conditions like gender, age, and
              completed activities (opportunities).
            </p>
            <h3 className="mt-4">Example:</h3>
            <div className="bg-gray-light rounded-lg p-2 md:w-[450px] md:p-4">
              <p>
                In the <strong>Airtime Yoma SA</strong> store, there are two
                rules:
              </p>
              <ul className="flex list-disc flex-col gap-4 text-left">
                <li className="mt-2 ml-6">
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
            <div className="bg-gray-light rounded-lg p-2 md:w-[450px] md:p-4">
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
            <div className="bg-gray-light flex flex-col gap-4 rounded-lg p-2 md:w-[450px] md:p-4">
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
    </>
  );
};
