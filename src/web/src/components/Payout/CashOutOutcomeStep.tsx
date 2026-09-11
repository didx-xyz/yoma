import { IoIosCheckmark, IoIosTimer } from "react-icons/io";
import {
  IoAlertCircleOutline,
  IoCloseCircleOutline,
  IoHourglassOutline,
} from "react-icons/io5";
import type { PayoutTransactionInfo } from "~/api/models/payout";
import { formatUsd } from "~/lib/format/rewards";
import { OUTCOME_COPY } from "~/lib/payout/copy";
import type { CashOutOutcomeKind } from "~/lib/payout/outcome";
import { describeOutcome, formatPayoutStarted } from "~/lib/payout/outcome";
import { CashOutMessageStep } from "./CashOutMessageStep";
import { CashOutSummaryRow } from "./CashOutSummary";

/**
 * Flow D — how the cash out actually went, read from `GET /user/payout/latest`.
 *
 * The presentation rules live in `lib/payout/outcome.ts`; this renders them. Two things worth
 * keeping in view when changing it:
 *
 * - **Only `completed` gets the success treatment.** Cancelled, expired and failed are neutral:
 *   the Zlto came back, the youth did nothing wrong, and red would say otherwise.
 * - **The figures are the payout's own**, in USD, with the initiation time. There is no historical
 *   ZLTO amount here on purpose — the API does not carry one, and recomputing it at today's rate
 *   would put an invented number on a money screen. The wallet behind the dialog has the truth.
 */

const ICONS: Record<CashOutOutcomeKind, React.ReactNode> = {
  inProgress: <IoIosTimer className="h-6 w-6" />,
  settingUp: <IoHourglassOutline className="h-6 w-6" />,
  completed: <IoIosCheckmark className="h-8 w-8" />,
  cancelled: <IoCloseCircleOutline className="h-6 w-6" />,
  expired: <IoHourglassOutline className="h-6 w-6" />,
  failed: <IoAlertCircleOutline className="h-6 w-6" />,
  unknown: <IoAlertCircleOutline className="h-6 w-6" />,
};

const TONES: Record<
  CashOutOutcomeKind,
  "neutral" | "info" | "warning" | "success"
> = {
  inProgress: "info",
  settingUp: "info",
  completed: "success",
  cancelled: "neutral",
  expired: "neutral",
  failed: "warning",
  unknown: "warning",
};

export const CashOutOutcomeStep: React.FC<{
  /** null when the outcome could not be read, or the youth has no payout at all */
  payout: PayoutTransactionInfo | null;
  onResume: () => void;
  onStartAgain: () => void;
  onClose: () => void;
}> = ({ payout, onResume, onStartAgain, onClose }) => {
  const view = describeOutcome(payout);
  const started = formatPayoutStarted(payout?.dateCreated);

  const primary = view.canResume
    ? { label: OUTCOME_COPY.continueAction, onClick: onResume }
    : view.canStartAgain
      ? { label: OUTCOME_COPY.startAgainAction, onClick: onStartAgain }
      : { label: OUTCOME_COPY.doneAction, onClick: onClose };

  return (
    <CashOutMessageStep
      icon={ICONS[view.kind]}
      tone={TONES[view.kind]}
      title={view.title}
      body={view.body}
      primary={primary}
      // Once the primary action is something other than "leave", the youth still needs a way out.
      secondary={
        view.canResume || view.canStartAgain
          ? { label: OUTCOME_COPY.doneAction, onClick: onClose }
          : undefined
      }
    >
      {view.showDetails && payout && (
        <div className="flex w-full flex-col text-left">
          <CashOutSummaryRow label={OUTCOME_COPY.amountLabel} divided={false}>
            {formatUsd(payout.amount)}
          </CashOutSummaryRow>

          {started && (
            <CashOutSummaryRow label={OUTCOME_COPY.startedLabel}>
              {started}
            </CashOutSummaryRow>
          )}
        </div>
      )}
    </CashOutMessageStep>
  );
};
