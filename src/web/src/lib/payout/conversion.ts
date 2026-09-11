import { formatConversionRate } from "~/lib/format/rewards";

/**
 * The conversion rate line, "N ZLTO = 1 USD".
 *
 * The rate arrives on `ConversionResponse.conversionRateZltoPerUsd` (API 2026-09-10), at the
 * Treasury's own 4-decimal display precision — the same figure the admin surface shows, so the two
 * cannot disagree.
 *
 * **This module used to infer the rate** by dividing the ZLTO amount by the USD estimate, because
 * the rate was `[JsonIgnore]` and admin-only. That estimate is rounded to two decimals, so the
 * inferred rate wobbled with the amount typed (at 45 ZLTO = 1 USD, 1,000 ZLTO → $22.22 → 45.0045)
 * and had to be suppressed below about a dollar, where it could not be established at all. All of
 * that is gone: the rate is now exact for every amount, including the small ones.
 *
 * Still indicative, for a different reason — initiation recalculates at the current Treasury rate,
 * so the USD figure beside it stays labelled an estimate.
 */
export const conversionRateLine = (
  rate: number | null | undefined,
): string | null =>
  rate == null || rate <= 0
    ? null
    : `${formatConversionRate(rate)} ZLTO = 1 USD`;
