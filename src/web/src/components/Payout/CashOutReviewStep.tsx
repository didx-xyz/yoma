import { IoIosLock } from "react-icons/io";
import { IoChevronBackOutline } from "react-icons/io5";
import { conversionRateLine } from "~/lib/payout/conversion";
import { REVIEW_COPY } from "~/lib/payout/copy";
import { formatUsd } from "~/lib/format/rewards";
import { CashOutSummaryRow, CashOutZltoAmount } from "./CashOutSummary";

/**
 * Step 2 — what is about to happen, before anything is reserved.
 *
 * The figures are the ones the preview returned for this exact amount, not recomputed here: the
 * review must agree with the number the youth was shown a moment ago, and the client does no
 * conversion arithmetic of its own anywhere in this flow.
 *
 * The note says what the youth is about to be handed to ("our secure payout partner" — the
 * provider is never named), that their Zlto is *held* rather than gone, and that the estimate may
 * move. Nothing here promises a completion time.
 */

export const CashOutReviewStep: React.FC<{
  amount: number;
  estimateUsd: number;
  /** null when it could not be established from the rounded preview — the row drops out */
  rate: number | null;
  busy: boolean;
  onConfirm: () => void;
  onBack: () => void;
}> = ({ amount, estimateUsd, rate, busy, onConfirm, onBack }) => {
  const rateLine = conversionRateLine(rate);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col">
        <CashOutSummaryRow label={REVIEW_COPY.amountLabel} divided={false}>
          <CashOutZltoAmount amount={amount} />
        </CashOutSummaryRow>

        <CashOutSummaryRow label={REVIEW_COPY.estimateLabel}>
          {formatUsd(estimateUsd)}
        </CashOutSummaryRow>

        {rateLine && (
          <CashOutSummaryRow label={REVIEW_COPY.rateLabel}>
            {rateLine}
          </CashOutSummaryRow>
        )}
      </div>

      <div className="bg-blue-light flex flex-col gap-2 rounded-lg px-4 py-3">
        <p className="text-sm leading-6">{REVIEW_COPY.handoffNote}</p>
        <p className="text-gray-dark text-xs">{REVIEW_COPY.estimateNote}</p>
      </div>

      <div className="flex flex-col items-center gap-2">
        <button
          type="button"
          onClick={onConfirm}
          disabled={busy}
          className={`w-full rounded-full normal-case ${
            busy
              ? "btn btn-disabled"
              : "btn bg-purple hover:bg-purple text-white hover:text-white"
          }`}
        >
          {busy ? (
            <span
              className="loading loading-spinner loading-xs"
              aria-hidden="true"
            />
          ) : (
            <IoIosLock className="h-4 w-4" aria-hidden="true" />
          )}
          {REVIEW_COPY.confirmAction}
        </button>

        <button
          type="button"
          onClick={onBack}
          disabled={busy}
          className="btn btn-ghost text-gray-dark rounded-full normal-case"
        >
          <IoChevronBackOutline className="h-4 w-4" aria-hidden="true" />
          {REVIEW_COPY.backAction}
        </button>
      </div>
    </div>
  );
};
