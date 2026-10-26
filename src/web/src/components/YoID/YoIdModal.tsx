import {
  IoClose,
  IoFlashOutline,
  IoIdCardOutline,
  IoLogInOutline,
  IoShieldCheckmarkOutline,
  IoTrophyOutline,
  IoWalletOutline,
} from "react-icons/io5";
import CustomModal from "../Common/CustomModal";
import { DialogStep } from "../Common/DialogStep";
import {
  DIALOG_BODY,
  DIALOG_CLOSE,
  DIALOG_EYEBROW,
  DIALOG_HEADING,
  DIALOG_ICON_CIRCLE,
  DIALOG_PRIMARY,
} from "../Opportunity/dialog";
import { TONE } from "../Opportunity/TabbedDetails/DetailDisclosure";

/**
 * "Welcome to your Yo-ID!" — the hero's and the drawer's info button — in the completion
 * dialogs' chrome (Jason, 2026-10-22): the Passport section's lilac behind an io5 icon, a Nunito
 * heading, one line of what Yo-ID is, then the four sections as tinted rows.
 */
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
      className="md:max-h-[700px] md:w-[600px]"
      animationStyle="rise"
    >
      <div className={DIALOG_BODY}>
        <div className="flex justify-end p-3">
          <button
            type="button"
            aria-label="Close"
            className={DIALOG_CLOSE}
            onClick={onClose}
          >
            <IoClose className="h-5 w-5" />
          </button>
        </div>
        <div className="flex flex-col items-center gap-5 px-6 pb-8 text-center md:px-12">
          <div className={`${DIALOG_ICON_CIRCLE} ${TONE.lilac}`}>
            <IoIdCardOutline aria-hidden className="h-10 w-10" />
          </div>
          <div className="flex flex-col gap-2">
            <h3 className={DIALOG_HEADING}>Welcome to your Yo-ID!</h3>
            <p className="text-gray-dark text-sm md:text-base">
              Yo-ID is your Yoma identity: one place for everything you earn
              here, and your way into the apps Yoma connects to.
            </p>
          </div>

          <div className="w-full text-left">
            <h4 className={DIALOG_EYEBROW}>What you can do with it</h4>
            <ul className="mt-2 flex flex-col gap-3">
              <DialogStep
                icon={<IoTrophyOutline className="h-5 w-5" />}
                toneClass={TONE.blue}
                title="Complete opportunities"
                note="Learning, jobs, events and more — each one you finish is recorded on your Yo-ID."
              />
              <DialogStep
                icon={<IoIdCardOutline className="h-5 w-5" />}
                toneClass={TONE.lilac}
                title="Collect credentials in your Passport"
                note="Every verified completion becomes a credential: blockchain-verifiable, private and yours to share."
              />
              <DialogStep
                icon={<IoWalletOutline className="h-5 w-5" />}
                toneClass={TONE.gold}
                title="Earn ZLTO in your Wallet"
                note="Spend your rewards in the marketplace."
              />
              <DialogStep
                icon={<IoFlashOutline className="h-5 w-5" />}
                toneClass={TONE.green}
                title="Build verifiable Skills"
                note="Skills from your completions add up here — and a digital CV is coming soon."
              />
            </ul>
          </div>

          <div className="w-full text-left">
            <h4 className={DIALOG_EYEBROW}>What&apos;s more</h4>
            <ul className="mt-2 flex flex-col gap-3">
              <DialogStep
                icon={<IoShieldCheckmarkOutline className="h-5 w-5" />}
                toneClass={TONE.green}
                title="Private and secure"
                note="Your credentials are verifiable on the blockchain and stay 100% yours."
              />
              <DialogStep
                icon={<IoLogInOutline className="h-5 w-5" />}
                toneClass={TONE.blue}
                title="Login with Yoma"
                note={
                  <>
                    Goodwall and Atingi let you sign in with your Yo-ID.{" "}
                    <a
                      href="https://docs.yoma.world/technology/what-is-yoid"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-green font-semibold underline"
                    >
                      Learn more
                    </a>
                  </>
                }
              />
            </ul>
          </div>

          <button type="button" className={DIALOG_PRIMARY} onClick={onClose}>
            Got it
          </button>
        </div>
      </div>
    </CustomModal>
  );
};
