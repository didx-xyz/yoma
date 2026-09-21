import type { PayoutCountryAvailability } from "~/api/models/payout";

/**
 * The country's minimum cash out, and whether an amount clears it.
 *
 * Its own module because the comparison has three ways to be silently wrong, and each of them puts
 * a false figure on a money screen:
 *
 * 1. **Comparing the wrong units.** The minimum is USD; the youth types ZLTO. The only honest
 *    comparison is against the conversion preview's own USD figure — the server checks the same
 *    thing, at the rate it locks at initiation.
 * 2. **Reverse-calculating a ZLTO threshold** from the displayed rate. That rate is rounded for
 *    display, so a threshold derived from it is wrong near the boundary — exactly where it matters.
 * 3. **Comparing unlike currencies.** If the API ever sends a non-USD minimum, that is unusable
 *    contract data, not an instruction to convert. Nothing here converts anything.
 *
 * ⚠️ **Null is not zero and not permission.** A null minimum means Yoma enforces no floor; the
 * country may still be unsupported or offline, and those gates are elsewhere and still apply. It is
 * also a *country* floor rather than a corridor floor — the hosted provider is the authority once
 * the youth chooses a destination, so nothing here may promise the payout will be accepted.
 */

export interface CashOutMinimum {
  /**
   * The floor to show and compare against, in USD. Null when there is none to enforce — either
   * because the API sent none, or because what it sent cannot be trusted (see `unusable`).
   */
  amount: number | null;
  /**
   * The API supplied a minimum that cannot be used: a currency other than USD, or a negative
   * figure. **Deliberately does not block the youth** — the server enforces the real rule and will
   * refuse initiation if one applies, whereas blocking here on data we cannot read would lock
   * someone out of their own money over a contract bug. It suppresses the *claim* instead: no
   * figure is shown, because any figure we showed would be invented.
   */
  unusable: boolean;
}

const USABLE: CashOutMinimum = { amount: null, unusable: false };

export const cashOutMinimum = (
  availability: PayoutCountryAvailability | null | undefined,
): CashOutMinimum => {
  const amount = availability?.minimumAmount;
  // Absent, null, or an API too old to carry it: nothing to enforce, nothing to say.
  if (amount == null) return USABLE;

  // Mirrors the server's own refusal to treat malformed limits as unrestricted
  // (`PayoutCountryAvailabilityExtensions.ValidateMinimumAmount`).
  if (amount < 0) return { amount: null, unusable: true };

  // A supported country sends USD even when the minimum is null, so a minimum arriving with any
  // other currency — or none — is contract data we must not compare numerically against a USD
  // preview. Converting it would be inventing an exchange rate.
  if (availability?.currency !== "USD") return { amount: null, unusable: true };

  return { amount, unusable: false };
};

/**
 * Whether the priced amount falls short of the floor. **Equality passes**, as it does server-side.
 *
 * `previewUsd` must belong to the amount currently in the field — a stale or pending preview must
 * never be allowed to qualify a new, smaller input. The caller owns that; here, a null preview is
 * simply "not yet known", which is never a reason to block on its own: with no preview there is no
 * Continue either.
 */
export const isBelowCashOutMinimum = (
  minimum: CashOutMinimum,
  previewUsd: number | null | undefined,
): boolean =>
  minimum.amount != null && previewUsd != null && previewUsd < minimum.amount;
