/**
 * Client-side ZLTO → USD preview, for the "1,000 ZLTO ≈ $2.00" example line on the Treasury
 * conversion editor.
 *
 * ⚠️ Indicative only, and only for a rate the admin is *currently typing* — which no endpoint can
 * price, because the rate has not been saved yet. Anything showing a conversion of a real amount
 * (the youth payout preview) must call `GET /treasury/conversion/zlto-usd`, which is authoritative.
 *
 * Mirrors the server's arithmetic (TreasuryService.cs:96 and :191): the stored raw rate is
 * 1 USD ÷ (ZLTO per USD) rounded to 10 places, and the USD amount is the ZLTO amount times that,
 * rounded to 2 places away from zero. Double-precision rounding can differ from the server's decimal
 * arithmetic in the last cent, which is exactly why the copy next to it says "approximately".
 */

const roundTo = (value: number, decimals: number): number => {
  const factor = 10 ** decimals;
  // Math.round is half-up, which equals MidpointRounding.AwayFromZero for positive amounts —
  // and amounts here are always positive (the API rejects zero and negatives).
  return Math.round(value * factor) / factor;
};

/** The stored rate: the USD value of one ZLTO, derived from "N ZLTO = 1 USD". */
export const zltoUsdRateFromZltoPerUsd = (
  zltoPerUsd: number,
): number | null => {
  if (!Number.isFinite(zltoPerUsd) || zltoPerUsd <= 0) return null;
  return roundTo(1 / zltoPerUsd, 10);
};

/** Indicative USD value of a whole-ZLTO amount at the given "N ZLTO = 1 USD" rate. */
export const previewZltoToUsd = (
  amountZlto: number,
  zltoPerUsd: number,
): number | null => {
  const rate = zltoUsdRateFromZltoPerUsd(zltoPerUsd);
  if (rate === null) return null;
  if (!Number.isFinite(amountZlto) || amountZlto <= 0) return null;

  return roundTo(amountZlto * rate, 2);
};

/** The ZLTO amount the example line prices. */
export const CONVERSION_EXAMPLE_ZLTO = 1000;
