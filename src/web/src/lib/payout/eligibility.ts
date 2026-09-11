import type { UserProfile } from "~/api/models/user";
import { WalletCreationStatus } from "~/api/models/user";

/**
 * Whether a youth may start a cash out — decided client-side so nobody reaches a form that the
 * server will reject after they have typed an amount.
 *
 * **This mirrors the server; the server decides.** Every rule below is enforced in
 * `PayoutService.PayoutRewards` before a payout record or a ZLTO reservation exists, and the order
 * here is the order there, so the reason shown is the reason the API would have given. If the two
 * ever disagree, the server is right and this file is stale.
 *
 * Read from `PayoutService.PayoutRewards` / `ValidateUserProfileForPayout` /
 * `ValidateUserCountryForPayout` on `feature/custom-fields-framework`:
 *
 *   1. amount is positive and whole      → belongs to the amount step, not the gate
 *   2. six profile fields are present
 *   3. country is known, online, supported
 *   4. the reward wallet is Created
 *   5. available >= amount
 *
 * "Cash Out" is the user-facing wording. The provider is never named.
 */

/**
 * The six fields the hosted journey needs before Yoma will reserve anything, with the server's own
 * wording — a client list that reads differently from the server's fallback message would look
 * like two different problems.
 *
 * `gender` is checked here as `genderId` because that is what the profile exposes; the server
 * checks the resolved name. A set id implies a resolved name, so the two agree.
 */
const REQUIRED_PROFILE_FIELDS: {
  label: string;
  present: (profile: UserProfile) => boolean;
}[] = [
  { label: "email address", present: (p) => !!p.email?.trim() },
  { label: "first name", present: (p) => !!p.firstName?.trim() },
  { label: "surname", present: (p) => !!p.surname?.trim() },
  { label: "country", present: (p) => !!p.countryId },
  { label: "gender", present: (p) => !!p.genderId },
  { label: "date of birth", present: (p) => !!p.dateOfBirth },
];

export type CashOutBlockReason =
  /** one active payout per user — the answer is to finish that one, not to start another */
  | "activePayout"
  /** the hosted journey needs profile fields the youth has not filled in */
  | "profileIncomplete"
  /** the provider's live corridor list could not be read — not an error, and not "unsupported" */
  | "providerOffline"
  | "countryUnsupported"
  /** the reward wallet has not finished being created */
  | "walletNotReady"
  /** the reward provider is offline, so `available` is null and we cannot check an amount */
  | "balanceUnknown"
  | "nothingAvailable";

export type CashOutEligibility =
  | { allowed: true; available: number }
  | { allowed: false; reason: "profileIncomplete"; missingFields: string[] }
  | {
      allowed: false;
      reason: Exclude<CashOutBlockReason, "profileIncomplete">;
    };

export const cashOutEligibility = (
  profile: UserProfile,
): CashOutEligibility => {
  // First, because it overrides everything else: a payout already in flight is resumable whatever
  // the corridor list now says, and the server never re-validates availability for it.
  if (profile.payout?.active) return { allowed: false, reason: "activePayout" };

  const missingFields = REQUIRED_PROFILE_FIELDS.filter(
    (field) => !field.present(profile),
  ).map((field) => field.label);
  if (missingFields.length > 0)
    return { allowed: false, reason: "profileIncomplete", missingFields };

  // Offline is checked before `supported`, as the server does. While offline, `supported` carries
  // no information — telling someone their country is unsupported on the strength of a list we
  // could not read is the one wrong answer here.
  const availability = profile.payout?.countryAvailability;
  if (availability?.offline)
    return { allowed: false, reason: "providerOffline" };
  if (!availability?.supported)
    return { allowed: false, reason: "countryUnsupported" };

  if (profile.zlto?.walletCreationStatus !== WalletCreationStatus.Created)
    return { allowed: false, reason: "walletNotReady" };

  // `null` is "we cannot see your balance", which is not zero. Truthiness and arithmetic are both
  // unsafe here — see `UserProfileZlto`.
  const available = profile.zlto.available;
  if (available == null) return { allowed: false, reason: "balanceUnknown" };
  if (available <= 0) return { allowed: false, reason: "nothingAvailable" };

  return { allowed: true, available };
};
