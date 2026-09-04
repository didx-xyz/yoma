import Image from "next/image";
import { IoMdCheckmark } from "react-icons/io";
import { IoInformationCircleOutline } from "react-icons/io5";
import iconPassport from "../../../public/images/passport.webp";
import { BTN_PRIMARY } from "../Common/buttonStyles";
import CustomModal from "../Common/CustomModal";
import {
  MODAL_ACTION_WIDTH,
  ModalActions,
  ModalBody,
  ModalHeader,
} from "../Common/ModalChrome";

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
        <div className="flex h-full flex-col overflow-y-auto">
          <ModalHeader
            title="How Store Access Rules Work"
            icon={<IoInformationCircleOutline className="h-5 w-5" />}
            onClose={onClose}
          />
          <ModalBody className="bg-white">
            <div className="border-green-dark bg-purple flex h-16 w-16 items-center justify-center rounded-full shadow-lg">
              <Image
                src={iconPassport}
                alt="Icon Zlto"
                width={40}
                className="h-auto"
                sizes="100vw"
                priority={true}
              />
            </div>
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
          </ModalBody>

          <ModalActions>
            <button
              type="button"
              className={`${BTN_PRIMARY} ${MODAL_ACTION_WIDTH}`}
              onClick={onClose}
            >
              <IoMdCheckmark className="h-5 w-5" />
              Got it
            </button>
          </ModalActions>
        </div>
      </CustomModal>
    </>
  );
};
