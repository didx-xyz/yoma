import type { TreasuryInfo } from "~/api/models/treasury";

/**
 * What the Treasury has already committed to payouts — completed *and* in flight.
 *
 * The API does not return the pending total on its own, but it returns both balances, and the
 * available one is defined as `completedBalance − totalPending`
 * (`TreasuryExtension.CalculatePayoutBalanceAvailableCurrentFinancialYearInUsd`). So the pending total
 * is recoverable by subtraction — which is worth doing rather than guessing, because the server's
 * pool floor is `currentFYCumulative + totalPending` and a form that mirrors a different floor either
 * blocks a legal save or waves through one the server will reject.
 *
 * ⚠️ Recoverable **only when a pool is set.** With no pool both balances are null, so the pending
 * total is unknown and callers must fall back to the server as the authority.
 */

/** `null` when it cannot be derived (no pool set), never a substituted `0`. */
export const derivePayoutTotalPending = (
  treasury: Pick<
    TreasuryInfo,
    | "payoutBalanceCurrentFinancialYearInUsd"
    | "payoutBalanceAvailableCurrentFinancialYearInUsd"
  >,
): number | null => {
  const completed = treasury.payoutBalanceCurrentFinancialYearInUsd;
  const available = treasury.payoutBalanceAvailableCurrentFinancialYearInUsd;

  if (completed === null || available === null) return null;

  // Guard against float dust from the subtraction: the column is 2dp.
  const pending = Math.round((completed - available) * 100) / 100;
  return pending > 0 ? pending : 0;
};

/**
 * The lowest payout pool the server will accept — `TreasuryService.Update`:
 * `currentFYCumulative + totalPending`.
 *
 * `cumulativeHolds` is false when the submitted configuration moves the financial year forward: the
 * server zeroes the cumulative *before* comparing, so the floor drops to the pending total alone.
 * Pending payouts survive a rollover and stay funded, which is why they are never dropped from the
 * floor the way the cumulative is.
 */
export const payoutPoolFloor = ({
  cumulative,
  totalPending,
  cumulativeHolds,
}: {
  cumulative: number | null;
  /** `null` when it could not be derived — the floor then covers the cumulative only */
  totalPending: number | null;
  cumulativeHolds: boolean;
}): number => (cumulativeHolds ? (cumulative ?? 0) : 0) + (totalPending ?? 0);
