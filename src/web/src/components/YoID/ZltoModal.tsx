import Link from "next/link";
import {
  IoBagHandleOutline,
  IoCheckmarkCircleOutline,
  IoClose,
  IoTimeOutline,
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
 * "What is ZLTO?" — the wallet card's and the marketplace's link — in the completion dialogs'
 * chrome (Jason, 2026-10-22): the Wallet section's gold behind an io5 icon, a Nunito heading, one
 * line of what ZLTO is, then the ledger's three figures as tinted rows.
 */
export const ZltoModal = ({
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
      className="md:max-h-[600px] md:w-[600px]"
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
          <div className={`${DIALOG_ICON_CIRCLE} ${TONE.gold}`}>
            <IoWalletOutline aria-hidden className="h-10 w-10" />
          </div>
          <div className="flex flex-col gap-2">
            <h3 className={DIALOG_HEADING}>What is ZLTO?</h3>
            <p className="text-gray-dark text-sm md:text-base">
              ZLTO is Yoma&apos;s reward. Complete an opportunity, get it
              verified, and the ZLTO lands in your wallet — then spend it in the{" "}
              <Link
                href="/marketplace"
                className="text-green font-semibold underline"
              >
                marketplace
              </Link>
              .
            </p>
          </div>

          <div className="w-full text-left">
            <h4 className={DIALOG_EYEBROW}>How your balance works</h4>
            <ul className="mt-2 flex flex-col gap-3">
              <DialogStep
                icon={<IoTimeOutline className="h-5 w-5" />}
                toneClass={TONE.blue}
                title="Pending"
                note="ZLTO on its way to your wallet. Allow up to 24 hours."
              />
              <DialogStep
                icon={<IoCheckmarkCircleOutline className="h-5 w-5" />}
                toneClass={TONE.green}
                title="Available"
                note="ZLTO you can spend in the marketplace right now."
              />
              <DialogStep
                icon={<IoBagHandleOutline className="h-5 w-5" />}
                toneClass={TONE.gold}
                title="Total"
                note="Available plus pending: everything you have earned so far."
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
