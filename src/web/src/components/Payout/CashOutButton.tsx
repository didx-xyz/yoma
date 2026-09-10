import { useId } from "react";
import type { ZltoLedgerVariant } from "../Rewards/ZltoLedger";

/**
 * The Cash Out entry point, as it appears on the ledger.
 *
 * It lives in `ZltoLedger`'s `actions` slot rather than in either host surface, so the Marketplace
 * hero and the Yo-ID wallet card get the same button in the same place and neither can drift.
 *
 * Two looks for the two surfaces, both taken from the boards:
 *
 * - `compact` (sky-blue hero): a **white-filled** `rounded-full` pill with the `blue-dark` border.
 *   Amber was tried and rejected — it is the ZLTO *asset* colour, and spending it on an action
 *   blurs asset and action (design review 2026-09-09). White-filled also reads as the primary
 *   action next to the hero's two transparent pills, which is what it is.
 * - `expanded` (white card): the purple filled pill the product uses for a primary action.
 *
 * Disabled is daisyUI's own disabled look — grey fill, grey text — deliberately **not** a muted
 * purple, because a muted primary reads as "working" and the flow has a real loading state that
 * must not be confusable with it.
 */

const STYLES: Record<
  ZltoLedgerVariant,
  { enabled: string; disabled: string; helper: string }
> = {
  compact: {
    enabled:
      "btn !border-blue-dark text-blue-dark rounded-full !border-2 !border-solid bg-white shadow-none hover:!border-white hover:bg-white",
    /**
     * Not daisyUI's `btn-disabled` here: its neutral fill and low-opacity content are calibrated
     * for a white page, and on the sky-blue band they came out as pale-grey-on-blue with the label
     * barely readable (measured in a browser). A translucent white fill with dark grey text stays
     * legible and still reads as inactive.
     */
    disabled:
      "btn rounded-full border-none bg-white/70 text-gray-dark normal-case shadow-none hover:bg-white/70",
    helper: "text-[11px] text-white",
  },
  expanded: {
    enabled:
      "btn bg-purple hover:bg-purple rounded-full text-white normal-case hover:text-white",
    /** On a white card daisyUI's own disabled look is exactly the one the board draws. */
    disabled: "btn btn-disabled rounded-full normal-case",
    helper: "text-[11px] text-gray-dark",
  },
};

export const CashOutButton: React.FC<{
  label: string;
  variant: ZltoLedgerVariant;
  /**
   * Set only for the two states the ledger already shows on screen — an unknown balance and a
   * known zero. Every other reason a cash out cannot start is invisible there, so the button stays
   * enabled and the gate dialog explains it; offering an action the visible figure contradicts is
   * what a disabled button is for, and nothing else.
   */
  disabledHelper?: string;
  /** the session fetch or initiation is in flight — the button is the only thing that moves */
  busy?: boolean;
  onClick: () => void;
  className?: string;
}> = ({ label, variant, disabledHelper, busy = false, onClick, className }) => {
  const style = STYLES[variant];
  const isDisabled = !!disabledHelper || busy;
  // Per instance: the ledger has two homes and a page could one day show both.
  const helperId = useId();

  return (
    <div className={`flex flex-col items-center gap-1 ${className ?? ""}`}>
      <button
        type="button"
        onClick={onClick}
        disabled={isDisabled}
        aria-describedby={disabledHelper ? helperId : undefined}
        className={`whitespace-nowrap ${
          isDisabled ? style.disabled : style.enabled
        }`}
      >
        {busy && (
          <span
            className="loading loading-spinner loading-xs"
            aria-hidden="true"
          />
        )}
        {label}
      </button>

      {/* Why the button cannot be pressed, next to the button, rather than in a dialog the youth
          has to open to be told what the figure above already says. */}
      {disabledHelper && (
        <p id={helperId} className={style.helper}>
          {disabledHelper}
        </p>
      )}
    </div>
  );
};
