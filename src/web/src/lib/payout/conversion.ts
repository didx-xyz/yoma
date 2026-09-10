import { formatConversionRate } from "~/lib/format/rewards";

/**
 * The conversion rate, for the "N ZLTO = 1 USD" line on the amount and review steps.
 *
 * ⚠️ **The rate is not on the youth-facing contract.** `Treasury.ConversionRateZltoUsd` is
 * `[JsonIgnore]` and the derived `conversionRateZltoPerUsd` lives on `TreasuryInfo`, which is
 * `GET /treasury` — Admin role. All a youth can see is `GET /treasury/conversion/zlto-usd`, which
 * answers `{ amount, currency, treasuryFundsAvailable }`: one USD figure, **rounded to 2 decimals**
 * (`Math.Round(amount * rate, 2, MidpointRounding.AwayFromZero)`).
 *
 * So the rate here is *inferred* from that pair, and the rounding is the whole problem. Dividing
 * naively produces a rate that wobbles as the youth types — at 45 ZLTO = 1 USD, 1,000 ZLTO
 * converts to $22.22 and divides back to 45.0045 — and a rate that changes while a money figure is
 * being entered reads as an error in the product, not as rounding.
 *
 * Instead: the true USD value lies within half a cent of the figure returned, so the true rate lies
 * in a known interval. Show the rate only at a precision **both ends of that interval agree on**,
 * and show nothing at all when even a whole number cannot be established — which is the honest
 * answer for the small amounts where it genuinely cannot ($0.02 could be anything from 40 to 67
 * ZLTO per USD).
 *
 * The precision ceiling is 4 decimals because that is the server's own cap on the rate
 * (`TreasuryRequestUpdateValidator`).
 *
 * **This is a workaround for a gap, not a design.** If `ConversionResponse` gains the rate the line
 * becomes exact for every amount and this module goes away.
 */

/** `Math.Round(…, 2, MidpointRounding.AwayFromZero)` puts the true value within half a cent. */
const USD_ROUNDING_HALF_STEP = 0.005;
const MAX_RATE_DECIMALS = 4;

export const inferConversionRateZltoPerUsd = (
  zltoAmount: number,
  usdAmount: number,
): number | null => {
  if (!Number.isFinite(zltoAmount) || zltoAmount <= 0) return null;
  if (!Number.isFinite(usdAmount) || usdAmount <= 0) return null;

  const smallestUsd = usdAmount - USD_ROUNDING_HALF_STEP;
  if (smallestUsd <= 0) return null;

  // A smaller USD value for the same Zlto means more Zlto per dollar, so the interval inverts.
  const highestRate = zltoAmount / smallestUsd;
  const lowestRate = zltoAmount / (usdAmount + USD_ROUNDING_HALF_STEP);

  // Finest agreeing precision first: 45.0000 and 45.0000 agree at 4dp, 44.99 and 45.01 do not.
  for (let decimals = MAX_RATE_DECIMALS; decimals >= 0; decimals--) {
    const factor = 10 ** decimals;
    const low = Math.round(lowestRate * factor) / factor;
    const high = Math.round(highestRate * factor) / factor;
    if (low === high) return low;
  }

  return null;
};

/**
 * "45 ZLTO = 1 USD", or `null` when the rate cannot be established from the preview. Callers drop
 * the line entirely in that case rather than rendering an em dash — a rate is context, and absent
 * context is better left unsaid than shown as missing.
 *
 * The epic fixes this direction: the conversion is always expressed as N ZLTO = 1 USD.
 */
export const conversionRateLine = (rate: number | null): string | null =>
  rate == null ? null : `${formatConversionRate(rate)} ZLTO = 1 USD`;
