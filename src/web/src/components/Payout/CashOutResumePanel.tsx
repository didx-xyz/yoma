import { IoOpenOutline, IoRefreshOutline } from "react-icons/io5";
import { RESUME_COPY } from "~/lib/payout/copy";
import { formatUsd } from "~/lib/format/rewards";
import { CashOutSummaryRow, CashOutZltoAmount } from "./CashOutSummary";

/**
 * The payout already in flight, and the way back into it.
 *
 * **One active payout per user**, so this is what a youth gets instead of the amount form. The
 * hosted session is fetched **on tap, every time** — sessions last ≈30 minutes and the provider
 * issues a fresh one on request, so there is nothing here to store and a stored URL must never be
 * reused.
 *
 * What it shows, and why it shows no more than this:
 *
 * - **Amount** is the wallet's `pendingPayout` — the Zlto Yoma has reserved for this payout.
 * - **Estimated** is `profile.payout.amount`, the payout's value **in USD**, not Zlto.
 * - **Started** is `profile.payout.dateCreated`, which is the *initiation* time — not confirmation,
 *   not completion.
 * - **Still no status line**, although `status` now exists. `Processing` begins when the hosted
 *   payout is created, before the youth confirms anything, so neither it nor `canResume` separates
 *   "still needs you" from "confirmed and on its way". `canResume` decides what is offered; naming
 *   a status would make a claim the contract cannot support.
 */

export const CashOutResumePanel: React.FC<{
  /** reserved Zlto — `zlto.pendingPayout`; null while the reward provider is offline */
  zltoAmount: number | null;
  /** the payout's value in `currency` — `payout.amount`; null when the API sent none */
  estimateUsd: number | null;
  /** `payout.dateCreated`, pre-formatted by `formatPayoutStarted`; the row drops out when null */
  started?: string | null;
  busy: boolean;
  /** set when the session fetch failed, or when there is nothing to continue */
  notice?: string;
  onContinue: () => void;
  onClose: () => void;
  /** hidden once continuing is pointless — a payout past the youth's part of the journey */
  canContinue?: boolean;
  /**
   * Whether to invite the youth to pick up where they left off. Separate from `canContinue`
   * because the two come apart: a payout Yoma has not yet placed with the provider is worth
   * retrying (`canContinue`) but there is nothing to pick up yet, so the invitation would be
   * telling them to finish something that has not started.
   */
  invitation?: boolean;
}> = ({
  zltoAmount,
  estimateUsd,
  started,
  busy,
  notice,
  onContinue,
  onClose,
  canContinue = true,
  invitation = true,
}) => (
  <div className="flex flex-col gap-4">
    <div className="flex flex-col">
      <CashOutSummaryRow label={RESUME_COPY.amountLabel} divided={false}>
        <CashOutZltoAmount amount={zltoAmount} />
      </CashOutSummaryRow>

      <CashOutSummaryRow label={RESUME_COPY.estimateLabel}>
        {formatUsd(estimateUsd)}
      </CashOutSummaryRow>

      {started && (
        <CashOutSummaryRow label={RESUME_COPY.startedLabel}>
          {started}
        </CashOutSummaryRow>
      )}
    </div>

    {/* "Pick up where you left off" is an invitation, so it goes when the invitation does —
        otherwise the panel asks the youth to continue directly above a notice telling them there
        is nothing to continue, with no button between the two. */}
    {canContinue && invitation && (
      <div className="bg-blue-light flex flex-col gap-1 rounded-lg px-4 py-3">
        <span className="text-sm font-bold">{RESUME_COPY.title}</span>
        <span className="text-sm leading-6">{RESUME_COPY.body}</span>
      </div>
    )}

    {/* Neutral, not red: whatever went wrong, the payout is untouched and the youth did nothing. */}
    {notice && (
      <p
        role="alert"
        className="bg-orange-light rounded-lg px-4 py-3 text-sm leading-6"
      >
        {notice}
      </p>
    )}

    <div className="flex flex-col items-center gap-2">
      {canContinue && (
        <button
          type="button"
          onClick={onContinue}
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
          ) : notice ? (
            <IoRefreshOutline className="h-4 w-4" aria-hidden="true" />
          ) : (
            <IoOpenOutline className="h-4 w-4" aria-hidden="true" />
          )}
          {notice ? RESUME_COPY.retryAction : RESUME_COPY.continueAction}
        </button>
      )}

      <button
        type="button"
        onClick={onClose}
        className="btn btn-ghost text-gray-dark rounded-full normal-case"
      >
        {RESUME_COPY.closeAction}
      </button>
    </div>
  </div>
);
