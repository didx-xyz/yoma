/**
 * Treasury — the top of the reward hierarchy (Treasury → Organisation → Opportunity, and
 * Treasury → Referral Program → Referral Link).
 *
 * Typed to match `Yoma.Core.Domain.Treasury.Models.TreasuryInfo` / `TreasuryRequestUpdate` exactly,
 * including the `InUsd` suffixes — the payout figures are USD while the reward figures are ZLTO,
 * and the suffix is the only thing that says so.
 *
 * All pool / cumulative / balance values here are the **current financial year** and reset when the
 * financial year rolls over. `zltoRewardCumulative` and `payoutCumulativeInUsd` (no suffix) are the
 * **lifetime** totals and never reset.
 */
export interface TreasuryInfo {
  /** 1-based month the financial year starts in */
  financialYearStartMonth: number;
  financialYearStartDay: number;
  /**
   * Server-derived start date of the current financial year, as "YYYY-MM-DD".
   *
   * This is the operand the server compares a submitted configuration against when deciding whether
   * to roll the financial year forward — so the admin form compares against this value and nothing
   * else. See `lib/treasury/financialYear.ts`.
   */
  financialYearStartDate: string;

  zltoRewardPoolCurrentFinancialYear: number | null;
  zltoRewardCumulativeCurrentFinancialYear: number | null;
  /** lifetime total awarded — never reset by a financial-year rollover */
  zltoRewardCumulative: number | null;
  /** server-derived: pool − cumulative for the current financial year; null when no pool is set */
  zltoRewardBalanceCurrentFinancialYear: number | null;

  payoutPoolCurrentFinancialYearInUsd: number | null;
  payoutCumulativeCurrentFinancialYearInUsd: number | null;
  /** lifetime total paid out — never reset by a financial-year rollover */
  payoutCumulativeInUsd: number | null;
  /** server-derived: pool − cumulative for the current financial year; null when no pool is set */
  payoutBalanceCurrentFinancialYearInUsd: number | null;

  /**
   * Number of ZLTO equal to `conversionRateUsdAmount` USD. The raw internal rate (the USD value of
   * one ZLTO) is `[JsonIgnore]` server-side and is never available client-side.
   */
  conversionRateZltoPerUsd: number;
  /** always 1 — the conversion is expressed as "N ZLTO = 1 USD" */
  conversionRateUsdAmount: number;
}

/**
 * PATCH payload. Only the configuration and the pools are settable — cumulatives and balances are
 * read-only everywhere, derived server-side.
 *
 * ⚠️ Every field is assigned unconditionally by `TreasuryService.Update` (:87-96), so this is a full
 * replacement and not a partial patch: omitting `zltoRewardPoolCurrentFinancialYear` (or sending
 * null) clears the ZLTO pool, after which no ZLTO can be awarded anywhere. Always send the current
 * values for the fields you are not changing.
 */
export interface TreasuryRequestUpdate {
  financialYearStartMonth: number;
  financialYearStartDay: number;
  /** optional; null clears the allocation */
  zltoRewardPoolCurrentFinancialYear: number | null;
  /** required by the server validator */
  payoutPoolCurrentFinancialYearInUsd: number | null;
  conversionRateZltoPerUsd: number;
}

/** Field names shared by the form, the zod schema and the server-error mapper. */
export type TreasuryFormField =
  | "financialYearStartMonth"
  | "financialYearStartDay"
  | "zltoRewardPoolCurrentFinancialYear"
  | "payoutPoolCurrentFinancialYearInUsd"
  | "conversionRateZltoPerUsd";

/**
 * Validation limits, mirrored from `TreasuryRequestUpdateValidator`. Kept next to the model so the
 * form and its copy cannot drift from the server.
 *
 * NB: the caps differ from the neighbouring surfaces on purpose (Organisation pools cap at 10
 * million, referral programs at 10 million) — never copy a limit across.
 */
export const TREASURY_LIMITS = {
  /** whole numbers, > 0, ≤ 100,000,000 */
  zltoPoolMax: 100_000_000,
  /** ≤ 2 decimals, > 0, ≤ 50,000 */
  payoutPoolMaxUsd: 50_000,
  /** ≤ 4 decimals, > 0, ≤ 1,000 */
  conversionRateMax: 1_000,
  conversionRateDecimals: 4,
  payoutPoolDecimals: 2,
} as const;

/** Result of the indicative ZLTO-to-USD conversion. */
export interface ConversionResponse {
  amount: number;
  currency: "USD";
  /** Whether the Treasury currently has sufficient uncommitted payout funds. */
  treasuryFundsAvailable: boolean;
}
