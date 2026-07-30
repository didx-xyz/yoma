import type { ReactNode } from "react";
import { IoMdClose } from "react-icons/io";
import { BTN_DIALOG_CLOSE } from "~/components/Common/buttonStyles";

/**
 * Shared chrome for the dialogs rendered inside CustomModal, so every popup on the admin
 * list pages reads the same: a titled header with an icon and a ✕, then the body, then a
 * centred row of actions.
 *
 * The filter popup (ListPageFilterDialog) is the reference; everything else — export,
 * import, QR code, info, verify — is built from these same pieces.
 */

/**
 * Width for the footer action buttons, so the actions line up from dialog to dialog
 * regardless of how many there are.
 */
export const MODAL_ACTION_WIDTH = "w-36";

/**
 * Titled header. `icon` sits inline with the title (h-5 w-5 to match), and the ✕ dismisses.
 */
export const ModalHeader: React.FC<{
  title: string;
  icon?: ReactNode;
  onClose?: () => void;
}> = ({ title, icon, onClose }) => (
  <div className="flex flex-row items-center px-4 py-3">
    <h1 className="my-auto flex grow items-center gap-2 text-lg font-bold">
      {icon}
      {title}
    </h1>
    <button
      type="button"
      className={BTN_DIALOG_CLOSE}
      onClick={onClose}
      aria-label="Close"
    >
      <IoMdClose className="h-5 w-5" />
    </button>
  </div>
);

/**
 * Footer action row. Buttons take MODAL_ACTION_WIDTH and follow the button vocabulary in
 * buttonStyles.ts: BTN_PRIMARY for the action that proceeds or acknowledges, BTN_SECONDARY
 * for the one that dismisses without acting, BTN_DANGER for a destructive one.
 */
export const ModalActions: React.FC<{ children: ReactNode }> = ({
  children,
}) => (
  <div className="flex flex-row flex-wrap items-center justify-center gap-3 px-4 py-4">
    {children}
  </div>
);

/** Body padding for the simpler dialogs (the filter popup supplies its own accordions). */
export const ModalBody: React.FC<{
  className?: string;
  children: ReactNode;
}> = ({ className = "", children }) => (
  <div
    className={`bg-gray-light flex grow flex-col items-center gap-4 px-4 py-6 ${className}`}
  >
    {children}
  </div>
);
