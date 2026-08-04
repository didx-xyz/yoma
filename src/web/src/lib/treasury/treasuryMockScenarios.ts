import type { TreasuryInfo } from "~/api/models/treasury";

/**
 * ⚠️⚠️ TEMPORARY DEV AID — DELETE THIS FILE (and the block it feeds in
 * `pages/admin/treasury/index.tsx`, marked "MOCK SCENARIOS") BEFORE MERGING. ⚠️⚠️
 *
 * Canned `GET /treasury` payloads so the capacity warnings, empty states and rollover guard can be
 * seen in the browser without touching the database. Drive them from the url:
 *
 *   /admin/treasury?mock=zltoLow
 *   /admin/treasury?tab=manage&mock=staleFinancialYear
 *
 * Only honoured outside production builds. `healthy` matches the seeded local row, so every scenario
 * reads as a plausible variation of real data.
 *
 * NB: the mock only replaces what is *displayed*. Saving on the Manage tab still PATCHes the real
 * API, and the response will not be shown while a mock is active.
 */

/** The seeded local Treasury row: 72% of the ZLTO pool left, full payout pool, 26 ZLTO = $1. */
const healthy: TreasuryInfo = {
  financialYearStartMonth: 2,
  financialYearStartDay: 1,
  financialYearStartDate: "2026-02-01",
  zltoRewardPoolCurrentFinancialYear: 100_000,
  zltoRewardCumulativeCurrentFinancialYear: 27_730,
  zltoRewardCumulative: 27_730,
  zltoRewardBalanceCurrentFinancialYear: 72_270,
  payoutPoolCurrentFinancialYearInUsd: 50_000,
  payoutCumulativeCurrentFinancialYearInUsd: null,
  payoutCumulativeInUsd: null,
  payoutBalanceCurrentFinancialYearInUsd: 50_000,
  conversionRateZltoPerUsd: 26,
  conversionRateUsdAmount: 1,
};

/** Balances are server-derived, so a scenario sets the cumulative and the balance together. */
const withZltoAwarded = (
  base: TreasuryInfo,
  awardedThisYear: number,
): TreasuryInfo => ({
  ...base,
  zltoRewardCumulativeCurrentFinancialYear: awardedThisYear,
  zltoRewardCumulative: Math.max(
    base.zltoRewardCumulative ?? 0,
    awardedThisYear,
  ),
  zltoRewardBalanceCurrentFinancialYear:
    (base.zltoRewardPoolCurrentFinancialYear ?? 0) - awardedThisYear,
});

const withPaidOut = (
  base: TreasuryInfo,
  paidOutThisYear: number,
): TreasuryInfo => ({
  ...base,
  payoutCumulativeCurrentFinancialYearInUsd: paidOutThisYear,
  payoutCumulativeInUsd: Math.max(
    base.payoutCumulativeInUsd ?? 0,
    paidOutThisYear,
  ),
  payoutBalanceCurrentFinancialYearInUsd:
    (base.payoutPoolCurrentFinancialYearInUsd ?? 0) - paidOutThisYear,
});

export const TREASURY_MOCK_SCENARIOS = {
  /** No banners — the healthy baseline. */
  healthy,

  /** ZLTO 5% left → amber "running low". */
  zltoLow: withZltoAwarded(healthy, 95_000),

  /** ZLTO balance exactly 0 → red "exhausted". */
  zltoDepleted: withZltoAwarded(healthy, 100_000),

  /** Awarded past the pool (reachable in the DB, not through the API) → red, negative balance. */
  zltoOverspent: withZltoAwarded(healthy, 112_500),

  /** Payout 4% left → amber. */
  payoutLow: withPaidOut(healthy, 48_000),

  /** Payout balance 0 → red. */
  payoutDepleted: withPaidOut(healthy, 50_000),

  /** Both banners at once — ZLTO exhausted, payout running low. */
  bothCritical: withPaidOut(withZltoAwarded(healthy, 100_000), 49_000),

  /** Nothing allocated → "Not set" notes on the overview, no banners, empty pool fields. */
  noPools: {
    ...healthy,
    zltoRewardPoolCurrentFinancialYear: null,
    zltoRewardBalanceCurrentFinancialYear: null,
    payoutPoolCurrentFinancialYearInUsd: null,
    payoutBalanceCurrentFinancialYearInUsd: null,
  },

  /** Rate 0 → the conversion warning replaces the "N ZLTO = $1.00" line. */
  noRate: { ...healthy, conversionRateZltoPerUsd: 0 },

  /**
   * A persisted financial-year start a year behind the configuration. Arms the rollover guard on the
   * Manage tab without changing the pickers — the inline warning shows immediately, and saving opens
   * the confirm dialog.
   */
  staleFinancialYear: { ...healthy, financialYearStartDate: "2025-02-01" },

  /** Fresh Treasury with nothing configured at all. */
  unconfigured: {
    ...healthy,
    zltoRewardPoolCurrentFinancialYear: null,
    zltoRewardCumulativeCurrentFinancialYear: null,
    zltoRewardCumulative: null,
    zltoRewardBalanceCurrentFinancialYear: null,
    payoutPoolCurrentFinancialYearInUsd: null,
    payoutCumulativeCurrentFinancialYearInUsd: null,
    payoutCumulativeInUsd: null,
    payoutBalanceCurrentFinancialYearInUsd: null,
    conversionRateZltoPerUsd: 0,
  },
} satisfies Record<string, TreasuryInfo>;

export type TreasuryMockScenario = keyof typeof TREASURY_MOCK_SCENARIOS;

export const TREASURY_MOCK_SCENARIO_KEYS = Object.keys(
  TREASURY_MOCK_SCENARIOS,
) as TreasuryMockScenario[];

/** The scenario named by `?mock=`, or null. Never honoured in a production build. */
export const resolveTreasuryMockScenario = (
  value: string | null,
): TreasuryMockScenario | null => {
  if (process.env.NODE_ENV === "production") return null;
  if (!value) return null;

  return TREASURY_MOCK_SCENARIO_KEYS.includes(value as TreasuryMockScenario)
    ? (value as TreasuryMockScenario)
    : null;
};
