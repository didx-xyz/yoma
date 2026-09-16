import type { ReactNode } from "react";
import { IoMdClose } from "react-icons/io";
import { BTN_DIALOG_CLOSE } from "~/components/Common/buttonStyles";
import CustomModal from "~/components/Common/CustomModal";
import { CashOutStepper, type CashOutStep } from "./CashOutStepper";

/**
 * The chrome every Cash Out screen sits in: the modal box, the centred title, the ✕, and the
 * stepper when the screen is part of the three-step flow.
 *
 * Its own component so the state machine is not also a layout, and so anything that renders these
 * screens outside the flow — the dev-only state gallery, most obviously — gets the real chrome by
 * construction rather than a copy of it that drifts.
 *
 * Two shapes, and the difference is not cosmetic:
 *
 * - **Short steps hug their content.** `CustomModal`'s box is `fixed inset-0`, so without
 *   `md:h-fit` a dialog is as tall as its max-height whatever it contains, and the amount step sat
 *   above 250px of empty white (the design review's dead-space note).
 * - **The hosted journey fills the window instead.** It is someone else's page, with its own forms
 *   and identity checks, so it gets a tall frame that scales with the viewport rather than hugging
 *   content it cannot measure — and the body stops scrolling, because the frame scrolls its own
 *   document and needs a definite height to fill.
 *
 * Mobile keeps the product's full-screen modal throughout, which is also the right shape for an
 * embedded journey.
 */

export const CashOutDialog: React.FC<{
  isOpen: boolean;
  title: string;
  /** omitted for the screens outside the three-step flow — the gate and the active-payout panel */
  step?: CashOutStep;
  /** step 3 only: the outcome is in, so the last step reads as done */
  stepResolved?: boolean;
  /** the hosted journey's shape: tall, window-scaled, no body scrolling */
  hosted?: boolean;
  /**
   * What the ✕ does, for a screen reader. On most screens it closes; on the hosted journey it also
   * reads the outcome, and saying so is the difference between dismissing a dialog and finishing a
   * step (copy review 2026-09-14).
   */
  closeLabel?: string;
  onClose: () => void;
  children: ReactNode;
}> = ({
  isOpen,
  title,
  step,
  stepResolved = false,
  hosted = false,
  closeLabel = "Close",
  onClose,
  children,
}) => (
  <CustomModal
    isOpen={isOpen}
    shouldCloseOnOverlayClick={false}
    onRequestClose={onClose}
    className={
      hosted
        ? // Capped so a wide monitor gets a dialog rather than a narrow hosted layout stretched
          // across 2,000px.
          "md:h-[90vh] md:w-11/12 md:max-w-[1040px]"
        : "md:h-fit md:max-h-[680px] md:w-[520px]"
    }
  >
    <div
      className={
        hosted
          ? "gap-3x flex h-full min-h-0 flex-col overflow-hidden p-4 text-black"
          : "flex h-full flex-col gap-4 overflow-y-auto p-4 pb-8 text-black"
      }
    >
      <div className="flex flex-row justify-end gap-2">
        <h4 className="font-family-nunito grow pl-2 text-center text-xl font-semibold">
          {title}
        </h4>

        <button
          type="button"
          className={BTN_DIALOG_CLOSE}
          onClick={onClose}
          aria-label={closeLabel}
        >
          <IoMdClose className="h-5 w-5" />
        </button>
      </div>

      {step && <CashOutStepper current={step} resolved={stepResolved} />}

      {children}
    </div>
  </CustomModal>
);
