/**
 * Shared formatting and label vocabulary for every reward, pool, cumulative and balance value
 * in the UI — Treasury, Organisation, Opportunity, Referral and Payout.
 *
 * Why one module: the same figures are shown on five surfaces, and the current-financial-year
 * values sit next to the lifetime ones. If each surface formats and labels them itself, the two
 * drift and an admin reads a lifetime total as a financial-year total. Every reward value goes
 * through the helpers here, and every label uses the vocabulary here — verbatim.
 *
 * Rounding rules follow the API (Treasury/Organization validators):
 *   ZLTO  — whole numbers, thousands separated
 *   USD   — 2 decimals, "$" prefixed
 *
 * ZLTO is the only reward asset; the Yoma reward capability (and its 2-decimal `formatYoma`) was
 * removed server-side, API `f051dfd8`.
 */

/** Shown for a value the API does not have (null/undefined) — never a blank cell, never "0". */
export const EMPTY_VALUE = "—";

/**
 * Canonical FY-vs-lifetime wording. Treasury and Organisation pool/cumulative/balance values are
 * current-financial-year and reset on rollover; Opportunity's own and Referral program values are
 * lifetime and never reset. The suffix is what tells the two apart on screen, so it is a constant
 * rather than typed-out copy.
 *
 * NB: never label a value a bare "Cumulative" — say what it is ("Awarded", "Paid out") and add
 * the scope.
 */
export const LABEL_SUFFIX_FY = "(this financial year)";
export const LABEL_SUFFIX_LIFETIME = "(lifetime)";

/** Section headings for the same distinction. */
export const HEADING_FY = "Current financial year";
export const HEADING_LIFETIME = "All-time";

/**
 * The two payout balances, which render side by side and mean different things (frozen 2026-08-06).
 *
 * "Remaining balance" alone stopped disambiguating them once the API gained the available figure, so
 * the wording — and the tooltip that explains it — is a constant. Every surface uses these verbatim;
 * rewards keep the plain "Remaining balance" label because they have only one balance.
 */
export const LABEL_PAYOUT_BALANCE_COMPLETED = "Remaining balance";
export const TOOLTIP_PAYOUT_BALANCE_COMPLETED =
  "The pool minus payouts completed this financial year. It does not account for payouts already in flight, so it is not what is available to pay out.";
export const LABEL_PAYOUT_BALANCE_AVAILABLE = "Available to pay out now";
export const TOOLTIP_PAYOUT_BALANCE_AVAILABLE =
  "The remaining balance minus payouts already in flight. This is the capacity a new payout is checked against.";

/**
 * A balance under this share of its pool reads as "running low", so an admin sees capacity
 * trouble before allocations start failing rather than after.
 */
export const REWARD_BALANCE_LOW_RATIO = 0.1;

type Amount = number | null | undefined;

const ZLTO_FORMAT = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const RATE_FORMAT = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 4,
});

const USD_FORMAT = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const isMissing = (value: Amount): value is null | undefined =>
  value === null || value === undefined || Number.isNaN(value);

/** ZLTO: whole number, thousands separated (e.g. `1,000,000`). */
export function formatZlto(value: Amount, empty: string = EMPTY_VALUE): string {
  return isMissing(value) ? empty : ZLTO_FORMAT.format(value);
}

/** USD: 2 decimals, "$" prefixed (e.g. `$1,000.50`). The unit word belongs in the heading. */
export function formatUsd(value: Amount, empty: string = EMPTY_VALUE): string {
  return isMissing(value) ? empty : USD_FORMAT.format(value);
}

/**
 * Conversion rate: up to 4 decimals, trailing zeros dropped (e.g. `45`, `45.5`, `45.1234`) — the
 * server caps the rate at 4 decimal places.
 */
export function formatConversionRate(
  value: Amount,
  empty: string = EMPTY_VALUE,
): string {
  return isMissing(value) ? empty : RATE_FORMAT.format(value);
}

/**
 * ZLTO min–max, for the reward estimates that arrive as a range. Collapses to a single value when
 * the ends match or only one end is known.
 */
export function formatZltoRange(
  min: Amount,
  max: Amount,
  empty: string = EMPTY_VALUE,
): string {
  if (isMissing(min) && isMissing(max)) return empty;
  if (isMissing(min)) return formatZlto(max, empty);
  if (isMissing(max) || min === max) return formatZlto(min, empty);
  return `${formatZlto(min)} – ${formatZlto(max)}`;
}

export type RewardBalanceTone = "unset" | "depleted" | "low" | "healthy";

/**
 * How a balance should read: nothing allocated, exhausted, running low, or fine.
 *
 * The API derives the balance (pool − cumulative for the current financial year) and returns
 * `null` when no pool is set — the UI never computes it, it only decides how to show it.
 */
export function rewardBalanceTone(
  balance: Amount,
  pool: Amount,
): RewardBalanceTone {
  if (isMissing(pool) || pool <= 0 || isMissing(balance)) return "unset";
  if (balance <= 0) return "depleted";
  if (balance / pool < REWARD_BALANCE_LOW_RATIO) return "low";
  return "healthy";
}
