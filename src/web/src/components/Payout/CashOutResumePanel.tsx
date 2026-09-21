import { IoIosTimer } from "react-icons/io";
import {
  IoAlertCircleOutline,
  IoHourglassOutline,
  IoRefreshOutline,
} from "react-icons/io5";
import { CANCEL_COPY, RESUME_COPY } from "~/lib/payout/copy";
import { formatUsd } from "~/lib/format/rewards";
import { CashOutMessage } from "./CashOutMessage";
import { CashOutNote } from "./CashOutNote";
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

/**
 * Which of the three things this panel is. **A discriminator rather than a handful of independent
 * flags**: the mapping from state to heading, icon, tone and button label used to live in the
 * caller, so every caller had to repeat it — and the dev gallery got it wrong twice, showing a
 * headless message and the wrong verb on a screen the flow renders correctly. Derived here, that
 * cannot happen.
 */
export type CashOutResumeState =
  /**
   * Fetching the session, which carries both the Continue URL and cancellation eligibility. Since
   * API 2026-09-21 that happens when the panel *opens* rather than when Continue is tapped, because
   * Cancel has to be offered beside Continue — and offering it means knowing `canCancel` first.
   */
  | "loading"
  /** a session can be requested: invite them back in */
  | "resumable"
  /** active, but Yoma has not placed it with the provider yet — a wait, not a failure */
  | "settingUp"
  /** nothing left to continue; the panel only reports and closes */
  | "ended";

export const CashOutResumePanel: React.FC<{
  /** reserved Zlto — `zlto.pendingPayout`; null while the reward provider is offline */
  zltoAmount: number | null;
  /** the payout's value in `currency` — `payout.amount`; null when the API sent none */
  estimateUsd: number | null;
  /** `payout.dateCreated`, pre-formatted by `formatPayoutStarted`; the row drops out when null */
  started?: string | null;
  state?: CashOutResumeState;
  busy: boolean;
  /**
   * A transient problem to show *beneath* the invitation — a failed session fetch, or the race
   * where another tab started the payout first. Only meaningful while `resumable`; the other two
   * states are already saying the whole story in the message.
   */
  notice?: string;
  /**
   * The provider's cancellation eligibility for **this** payout (`PayoutSession.canCancel`, or a
   * `latest` read whose id matched). Three-valued and each value means something different:
   * `true` offers Cancel, `false` does not, and `null`/absent is *unknown* — which is not "no", so
   * it gets a quiet note and another look rather than a missing button and no explanation.
   *
   * Only ever consulted while `resumable`. A payout Yoma has not placed with the provider yet has
   * nothing to cancel there, so the setup state never offers it.
   */
  canCancel?: boolean | null;
  /** opens the confirmation; omitted where cancellation is not on offer at all */
  onCancel?: () => void;
  /** re-reads eligibility after an unknown answer — the estimate-retry pattern, not a button */
  onCheckCancel?: () => void;
  onContinue: () => void;
  onClose: () => void;
}> = ({
  zltoAmount,
  estimateUsd,
  started,
  state = "resumable",
  busy,
  notice,
  canCancel,
  onCancel,
  onCheckCancel,
  onContinue,
  onClose,
}) => {
  /*
    The same shape as the result screens — badge, heading, body, then the figures — because this is
    the same object seen a moment earlier, and drawing it as a tinted panel instead made a youth
    work out twice that it was their cash out (design review 2026-09-14).
  */
  const message = {
    loading: {
      icon: <IoIosTimer className="h-6 w-6" />,
      tone: "info" as const,
      title: RESUME_COPY.title as string | undefined,
      body: RESUME_COPY.loadingBody,
    },
    resumable: {
      icon: <IoIosTimer className="h-6 w-6" />,
      tone: "info" as const,
      title: RESUME_COPY.title as string | undefined,
      body: RESUME_COPY.body,
    },
    settingUp: {
      icon: <IoHourglassOutline className="h-6 w-6" />,
      tone: "info" as const,
      title: RESUME_COPY.notResumableTitle as string | undefined,
      body: RESUME_COPY.notResumable,
    },
    ended: {
      icon: <IoAlertCircleOutline className="h-6 w-6" />,
      // Never red: whatever happened, the payout is untouched and the youth did nothing wrong.
      tone: "warning" as const,
      title: undefined,
      body: RESUME_COPY.noLongerActive,
    },
  }[state];

  /** Nothing to continue once it has ended; a wait is checked on, a failure is retried. */
  const canContinue = state !== "ended";
  const actionLabel =
    state === "settingUp"
      ? RESUME_COPY.checkAgainAction
      : notice
        ? RESUME_COPY.retryAction
        : RESUME_COPY.continueAction;

  /** Only a transient failure sits below the message; the other states *are* the message. */
  const inlineNotice = state === "resumable" ? notice : undefined;

  /*
    Cancellation belongs to one state only. `settingUp` means Yoma has the payout and the provider
    does not yet, so there is nothing there to cancel; `ended` has nothing left; `loading` does not
    know yet. And `=== true` rather than truthiness, because `null` is "we could not tell" — a
    missing button would say "no" on evidence we do not have.
  */
  const offerCancel = state === "resumable" && canCancel === true && !!onCancel;
  const eligibilityUnknown =
    state === "resumable" && canCancel == null && !!onCheckCancel;

  return (
    <div className="flex grow flex-col gap-4">
      <CashOutMessage
        icon={message.icon}
        tone={message.tone}
        title={message.title}
        body={message.body}
      />

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

      {inlineNotice && (
        <CashOutNote
          icon={<IoAlertCircleOutline className="h-5 w-5" />}
          tone="warning"
          role="alert"
        >
          {inlineNotice}
        </CashOutNote>
      )}

      {/* Eligibility could not be read. A note with a link rather than a disabled Cancel button:
          a greyed-out control asserts "not allowed", and we do not know that. Same shape as the
          amount step's failed-estimate retry. */}
      {eligibilityUnknown && (
        <p className="text-gray-dark flex flex-row flex-wrap items-center justify-center gap-2 text-xs">
          {CANCEL_COPY.unknown}
          <button
            type="button"
            onClick={onCheckCancel}
            className="text-purple font-bold underline-offset-2 hover:underline"
          >
            {CANCEL_COPY.checkAgainAction}
          </button>
        </p>
      )}

      <div className="mt-auto flex flex-col items-center gap-2 pt-2">
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
            ) : actionLabel === RESUME_COPY.continueAction ? null : (
              <IoRefreshOutline className="h-4 w-4" aria-hidden="true" />
            )}
            {busy ? RESUME_COPY.continueBusyAction : actionLabel}
          </button>
        )}

        {/* Between Continue and Close, because it acts on the payout rather than dismissing the
            dialog — and outlined rather than red: cancelling is a legitimate choice a youth is
            entitled to make, not a destructive mistake to be warned away from. The confirmation
            step is where the consequence is spelled out. */}
        {offerCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className={`w-full rounded-full normal-case ${
              busy
                ? "btn btn-disabled"
                : "btn border-gray text-gray-dark hover:bg-gray-light border bg-white"
            }`}
          >
            {CANCEL_COPY.action}
          </button>
        )}

        <button
          type="button"
          onClick={onClose}
          className="btn border-gray text-gray-dark hover:bg-gray-light w-full rounded-full border bg-white normal-case"
        >
          {RESUME_COPY.closeAction}
        </button>
      </div>
    </div>
  );
};
