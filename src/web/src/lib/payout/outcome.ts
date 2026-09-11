import moment from "moment";
import type { PayoutTransactionInfo } from "~/api/models/payout";
import { PayoutTransactionStatus } from "~/api/models/payout";
import { OUTCOME_COPY } from "./copy";

/**
 * How a payout's recorded state reads to the youth — Flow D, plus the "Started" label shared with
 * the active-payout panel.
 *
 * The status comes from `GET /user/payout/latest` and **nowhere else**. It is never inferred from
 * the wallet: committing a reservation and releasing one both leave `pendingPayout` at zero, so the
 * wallet cannot distinguish "your money was sent" from "your Zlto came back" — the two outcomes a
 * youth most needs told apart.
 *
 * ⚠️ `Processing` starts when the hosted payout is created, **before** the youth confirms anything.
 * So the active statuses all collapse to one neutral "in progress" here, and `canResume` decides
 * only what is *offered*, never what is *claimed*.
 */

export type CashOutOutcomeKind =
  | "inProgress"
  /** active, but Yoma has not placed it with the provider yet — reconciliation is still working */
  | "settingUp"
  | "completed"
  | "cancelled"
  | "expired"
  | "failed"
  /** the read failed, or there is no payout to report — say so, never guess an outcome */
  | "unknown";

export interface CashOutOutcomeView {
  kind: CashOutOutcomeKind;
  title: string;
  body: string;
  /** terminal states carry the payout's recorded figures; the others have nothing settled to show */
  showDetails: boolean;
  /** offer the way back into the hosted journey */
  canResume: boolean;
  /** offer a fresh cash out — only once nothing is in flight and the Zlto is back */
  canStartAgain: boolean;
}

export const describeOutcome = (
  info: PayoutTransactionInfo | null,
): CashOutOutcomeView => {
  if (!info)
    return {
      kind: "unknown",
      title: OUTCOME_COPY.unknownTitle,
      body: OUTCOME_COPY.unknownBody,
      showDetails: false,
      canResume: false,
      canStartAgain: false,
    };

  switch (info.status) {
    case PayoutTransactionStatus.Completed:
      return {
        kind: "completed",
        title: OUTCOME_COPY.completedTitle,
        body: OUTCOME_COPY.completedBody,
        showDetails: true,
        canResume: false,
        // A completed payout is final — the provider may still retry fiat delivery behind the
        // scenes, but nothing about that is the youth's to restart.
        canStartAgain: false,
      };

    case PayoutTransactionStatus.Cancelled:
      return {
        kind: "cancelled",
        title: OUTCOME_COPY.cancelledTitle,
        body: OUTCOME_COPY.cancelledBody,
        showDetails: true,
        canResume: false,
        canStartAgain: true,
      };

    case PayoutTransactionStatus.Expired:
      return {
        kind: "expired",
        title: OUTCOME_COPY.expiredTitle,
        body: OUTCOME_COPY.expiredBody,
        showDetails: true,
        canResume: false,
        canStartAgain: true,
      };

    case PayoutTransactionStatus.Failed:
      return {
        kind: "failed",
        title: OUTCOME_COPY.failedTitle,
        body: OUTCOME_COPY.failedBody,
        showDetails: true,
        canResume: false,
        canStartAgain: true,
      };

    default:
      // Initiated / Processing / ReconciliationRequired. `canResume` is the only thing that
      // separates them in a way the youth can act on: with a provider reference there is a session
      // to go back into, without one there is only a short wait.
      return info.canResume
        ? {
            kind: "inProgress",
            title: OUTCOME_COPY.inProgressTitle,
            body: OUTCOME_COPY.inProgressBody,
            showDetails: true,
            canResume: true,
            canStartAgain: false,
          }
        : {
            kind: "settingUp",
            title: OUTCOME_COPY.settingUpTitle,
            body: OUTCOME_COPY.settingUpBody,
            showDetails: false,
            canResume: false,
            canStartAgain: false,
          };
  }
};

/**
 * "Today, 14:02" / "8 Sep, 09:41" — the initiation time, which is what `dateCreated` is. Not the
 * confirmation or completion time, so it never reads as "paid at".
 */
export const formatPayoutStarted = (
  dateCreated: string | null | undefined,
): string | null => {
  if (!dateCreated) return null;
  const started = moment(dateCreated);
  if (!started.isValid()) return null;
  return started.isSame(moment(), "day")
    ? `Today, ${started.format("HH:mm")}`
    : started.format("D MMM, HH:mm");
};
