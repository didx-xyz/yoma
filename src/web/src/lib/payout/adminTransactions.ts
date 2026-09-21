import moment from "moment";
import {
  PayoutTransactionStatus,
  PayoutType,
  RewardTransactionStatus,
  type PayoutTransactionSearchFilter,
} from "~/api/models/payout";
import { amountOrNull } from "~/lib/format/amountInput";
import { EMPTY_VALUE } from "~/lib/format/rewards";
import { dateInputToUTC, dateInputToUTCEndOfDay } from "~/lib/utils";

/**
 * The **admin** vocabulary for a payout audit record — Treasury → Payouts.
 *
 * Deliberately separate from `lib/payout/copy.ts` and `lib/payout/outcome.ts`, which are the
 * youth's words. Those are reassuring, collapse the three active statuses into one neutral "in
 * progress", and never say anything the youth cannot act on. An admin investigating a payout needs
 * the opposite: the recorded status by its real name, and what it means for the ZLTO. The two must
 * not be shared — softening an admin label hides the state, and leaking an admin label into the
 * youth flow breaks the epic's copy rules.
 *
 * What stays true on both sides: **the payout provider is never named** (epic rule), and the
 * payout's `amount` is USD while the reward transaction's is ZLTO.
 */

export type PayoutStatusTone = "active" | "attention" | "success" | "closed";

const TONE_BADGE_CLASSES: Record<PayoutStatusTone, string> = {
  active: "border border-blue-200 bg-blue-100 text-blue-800",
  attention: "border border-amber-200 bg-amber-100 text-amber-900",
  success: "border border-green-200 bg-green-100 text-green-800",
  closed: "border border-gray-300 bg-gray-100 text-gray-700",
};

export const payoutStatusBadgeClasses = (tone: PayoutStatusTone): string =>
  TONE_BADGE_CLASSES[tone];

/**
 * One entry per recorded status. `description` is what an admin needs to know about the **money**:
 * whether the ZLTO is still held, burned, or back in the wallet — the question this surface exists
 * to answer.
 *
 * `Failed` is amber rather than red on purpose: a failed payout released the reservation, so the
 * youth's ZLTO is safe and nothing needs rescuing. The one status that genuinely wants attention is
 * `ReconciliationRequired`, where the outcome is unknown and the ZLTO is still held.
 */
export const PAYOUT_STATUS_META: Record<
  PayoutTransactionStatus,
  { label: string; tone: PayoutStatusTone; description: string }
> = {
  [PayoutTransactionStatus.Initiated]: {
    label: "Initiated",
    tone: "active",
    description:
      "Recorded by Yoma; the payout provider has not accepted it yet. The ZLTO is reserved.",
  },
  [PayoutTransactionStatus.Processing]: {
    label: "Processing",
    tone: "active",
    description:
      "Accepted by the provider and awaiting an outcome. This starts when the hosted payout is created, so it does not mean the youth has confirmed it. The ZLTO is reserved.",
  },
  [PayoutTransactionStatus.ReconciliationRequired]: {
    label: "Reconciliation required",
    tone: "attention",
    description:
      "The processing window elapsed, or a status check could not establish an outcome. Still active, and the reservation is deliberately held until it resolves — the five-minute reconciler keeps trying.",
  },
  [PayoutTransactionStatus.Completed]: {
    label: "Completed",
    tone: "success",
    description:
      "The provider confirmed the payout. Final: the reserved ZLTO was burned and the amount counts against the Treasury's payout pool for the financial year it completed in.",
  },
  [PayoutTransactionStatus.Failed]: {
    label: "Failed",
    tone: "attention",
    description:
      "Could not be initiated, or the provider confirmed an unsuccessful outcome. Final, and the reservation was released — the ZLTO is back in the youth's wallet.",
  },
  [PayoutTransactionStatus.Cancelled]: {
    label: "Cancelled",
    tone: "closed",
    description:
      "Stopped before completion. Final, and the reservation was released — the ZLTO is back in the youth's wallet.",
  },
  [PayoutTransactionStatus.Expired]: {
    label: "Expired",
    tone: "closed",
    description:
      "The provider's permitted processing window elapsed. Final, and the reservation was released — the ZLTO is back in the youth's wallet.",
  },
};

/** Tab/filter order: active first (what needs watching), then terminal. */
export const PAYOUT_STATUS_ORDER: PayoutTransactionStatus[] = [
  PayoutTransactionStatus.Initiated,
  PayoutTransactionStatus.Processing,
  PayoutTransactionStatus.ReconciliationRequired,
  PayoutTransactionStatus.Completed,
  PayoutTransactionStatus.Failed,
  PayoutTransactionStatus.Cancelled,
  PayoutTransactionStatus.Expired,
];

/**
 * ⚠️ The label is **not** the wire value. The API filters on the enum name, so a label can be
 * changed freely but `PayoutTransactionStatus` values can never be.
 */
export const payoutStatusLabel = (
  status: PayoutTransactionStatus | null | undefined,
): string => (status ? (PAYOUT_STATUS_META[status]?.label ?? status) : "—");

/**
 * What funded the payout. "Cash out" is the product word for the ZLTO journey, so it is what an
 * admin sees too; the direct type has no youth-facing name because no endpoint creates one.
 */
export const PAYOUT_TYPE_META: Record<
  PayoutType,
  { label: string; description: string }
> = {
  [PayoutType.PayoutRewards]: {
    label: "ZLTO cash out",
    description:
      "Funded by a ZLTO reservation, converted at the Treasury rate in force when it was initiated.",
  },
  [PayoutType.Payout]: {
    label: "Direct payout",
    description:
      "A USD payout with no ZLTO behind it. No endpoint creates one today, so a row of this type is unexpected.",
  },
};

export const payoutTypeLabel = (type: PayoutType | string): string =>
  PAYOUT_TYPE_META[type as PayoutType]?.label ?? type;

/**
 * The ZLTO side, as it matters to a payout. Only Reserved / Processed / Released occur here; the
 * award statuses are mapped anyway so an unexpected row is still legible rather than blank.
 */
export const REWARD_TRANSACTION_STATUS_META: Record<
  RewardTransactionStatus,
  { label: string; description: string }
> = {
  [RewardTransactionStatus.Reserved]: {
    label: "Reserved",
    description: "Held by the reward provider and unavailable, but not burned.",
  },
  [RewardTransactionStatus.Processed]: {
    label: "Burned",
    description: "The reserved ZLTO was burned — the payout completed.",
  },
  [RewardTransactionStatus.Released]: {
    label: "Released",
    description:
      "The reservation was given back without burning — the ZLTO is in the youth's wallet.",
  },
  [RewardTransactionStatus.Pending]: {
    label: "Pending",
    description: "Awaiting processing by the reward background service.",
  },
  [RewardTransactionStatus.ProcessedInitialBalance]: {
    label: "Initial balance",
    description:
      "Included in the balance assigned when the wallet was created; no provider transaction.",
  },
  [RewardTransactionStatus.Error]: {
    label: "Error",
    description: "Processing failed; it may be retried by the retry policy.",
  },
};

export const rewardTransactionStatusLabel = (
  status: RewardTransactionStatus | null | undefined,
): string =>
  status
    ? (REWARD_TRANSACTION_STATUS_META[status]?.label ?? status)
    : EMPTY_VALUE;

/**
 * "8 Sep 2026, 09:41" in the admin's own timezone. Absolute and unambiguous, unlike the youth
 * flow's "Today, 14:02" — an audit trail is read against provider timestamps and support tickets,
 * so a relative label is worse than useless.
 */
export const formatPayoutTimestamp = (
  value: string | null | undefined,
  empty: string = EMPTY_VALUE,
): string => {
  if (!value) return empty;
  const parsed = moment(value);
  return parsed.isValid() ? parsed.format("D MMM YYYY, HH:mm") : empty;
};

/** Date only, for the row summary where the time adds noise. */
export const formatPayoutDate = (
  value: string | null | undefined,
  empty: string = EMPTY_VALUE,
): string => {
  if (!value) return empty;
  const parsed = moment(value);
  return parsed.isValid() ? parsed.format("D MMM YYYY") : empty;
};

/**
 * What the filter dialog and the applied badges bind to: dates as the `YYYY-MM-DD` a date input
 * produces, amounts as typed text (so "1e5" and a third decimal can be rejected on what was
 * actually typed — see `lib/format/amountInput.ts`), everything else as the API's own values.
 *
 * Kept apart from the API filter because the two disagree about dates: a date input cannot hold
 * the UTC instant the API wants, and the badge has to show back the day the admin picked.
 */
export interface PayoutTransactionDisplayFilter {
  valueContains: string | null;
  statuses: PayoutTransactionStatus[] | null;
  types: PayoutType[] | null;
  /** typed text, not a number — validated on submit */
  amountFrom: string | null;
  amountTo: string | null;
  /** `YYYY-MM-DD` */
  dateStart: string | null;
  dateEnd: string | null;
}

export const EMPTY_PAYOUT_FILTER: PayoutTransactionDisplayFilter = {
  valueContains: null,
  statuses: null,
  types: null,
  amountFrom: null,
  amountTo: null,
  dateStart: null,
  dateEnd: null,
};

/** Drives the "Filters (n)" count — every applied value, with a multi-select counting per value. */
export const countAppliedPayoutFilters = (
  filter: PayoutTransactionDisplayFilter,
): number =>
  Object.entries(filter).reduce((count, [, value]) => {
    if (Array.isArray(value)) return count + value.length;
    return count + (value ? 1 : 0);
  }, 0);

const trimmedOrNull = (value: string | null | undefined): string | null => {
  const trimmed = value?.trim() ?? "";
  return trimmed.length > 0 ? trimmed : null;
};

const listOrNull = <T>(values: T[] | null | undefined): T[] | null =>
  values && values.length > 0 ? values : null;

/**
 * Display filter → `POST /treasury/payout/transaction/search` payload.
 *
 * - Dates become whole-day UTC bounds. The server widens them again (`RemoveTime` / `ToEndOfDay`),
 *   so this only has to avoid the timezone shift that `new Date("YYYY-MM-DD")` would introduce.
 * - Amounts are parsed leniently here and validated in the dialog: an unparseable amount that
 *   reached this point is dropped rather than sent as `NaN`, which axios would serialise as `null`
 *   and silently widen the search.
 * - `providers` is always null — one provider exists and naming it would break the epic's
 *   provider-neutrality rule. See YOM-1072's feature doc.
 * - Pagination is always sent: the server rejects a filter without it.
 */
export const toPayoutTransactionSearchFilter = (
  filter: PayoutTransactionDisplayFilter,
  pageNumber: number,
  pageSize: number,
): PayoutTransactionSearchFilter => {
  const amountFrom = amountOrNull(filter.amountFrom ?? "");
  const amountTo = amountOrNull(filter.amountTo ?? "");
  const dateStart = trimmedOrNull(filter.dateStart);
  const dateEnd = trimmedOrNull(filter.dateEnd);

  return {
    pageNumber,
    pageSize,
    id: null,
    userId: null,
    types: listOrNull(filter.types),
    providers: null,
    statuses: listOrNull(filter.statuses),
    // the server rejects a non-positive bound, so an unusable one is dropped rather than sent
    amountFrom: amountFrom !== null && amountFrom > 0 ? amountFrom : null,
    amountTo: amountTo !== null && amountTo > 0 ? amountTo : null,
    dateStart: dateStart ? dateInputToUTC(dateStart) : null,
    dateEnd: dateEnd ? dateInputToUTCEndOfDay(dateEnd) : null,
    valueContains: trimmedOrNull(filter.valueContains),
  };
};

/** Stable cache-key fragment for a display filter — every value that changes the result set. */
export const payoutFilterCacheKey = (
  filter: PayoutTransactionDisplayFilter,
  pageNumber: number,
): string =>
  [
    filter.valueContains ?? "",
    filter.statuses?.join(",") ?? "",
    filter.types?.join(",") ?? "",
    filter.amountFrom ?? "",
    filter.amountTo ?? "",
    filter.dateStart ?? "",
    filter.dateEnd ?? "",
    pageNumber,
  ].join("_");
