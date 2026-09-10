import { parseApiError } from "~/lib/apiErrorUtils";
import type { CashOutBlockReason } from "./eligibility";

/**
 * Maps a payout request failure onto the state the flow should show.
 *
 * Same constraint as `lib/treasury/serverErrors.ts`, for the same reason: `ExceptionResponseMiddleware`
 * projects every failure to `{ type, message }` and keeps no field or code, so **message-text
 * matching is the only mapping available**. Every pattern below was read off the branch rather than
 * guessed — the verbatim strings are quoted against each one, all from
 * `PayoutService` (`PayoutRewards`, `CreatePayout`, `ValidateUserProfileForPayout`,
 * `ValidateUserCountryForPayout`, `GetSession`) and `TreasuryService.ConvertZltoToUsd`.
 *
 * Unmatched failures land on `failed`, which renders as "We couldn't start your cash out. Nothing
 * has been taken from your wallet." — the safe reading, and the true one for every 400 the server
 * throws before a payout record exists.
 *
 * ⚠️ Two of the amount rules are **not** 400s. `ArgumentOutOfRangeException` (amount ≤ 0) and
 * `ArgumentException` (fractional amount) are unmapped by the middleware and arrive as 500 with an
 * internal message, so they are guarded client-side (`amount.ts`) and are not matched here — a 500
 * is never shown verbatim to a youth.
 */

export type PayoutFailure =
  /** the wallet refused the amount — the only per-field error in the flow */
  | { kind: "amountRejected" }
  /**
   * Treasury capacity, not the youth's amount: "There are insufficient funds available to complete
   * this payout" (`CreatePayout`, checked under the Treasury lock). The same condition the preview
   * reports as `treasuryFundsAvailable: false`, arriving a moment later — so it must render as the
   * paused panel, never as a field error.
   */
  | { kind: "paused" }
  /** one of the gate's own conditions, changed since the profile was fetched */
  | { kind: "gate"; reason: CashOutBlockReason }
  /** 404 from `GET /user/payout/zlto` — the profile said active, the API says otherwise */
  | { kind: "noActivePayout" }
  /** an active payout with no provider session to return to yet */
  | { kind: "sessionNotReady" }
  | { kind: "failed" };

interface Matcher {
  failure: PayoutFailure;
  pattern: RegExp;
}

/** Ordered: first match wins, so the more specific patterns come first. */
const MATCHERS: Matcher[] = [
  {
    // "A payout is already in progress" — CreatePayout, under the Treasury lock. The initiation
    // race: eligibility passed on a profile fetched before the other tab started a payout.
    pattern: /payout is already in progress/i,
    failure: { kind: "gate", reason: "activePayout" },
  },
  {
    // "There are insufficient funds available to complete this payout" — Treasury capacity.
    // Matched before the wallet's own "Insufficient reward balance", which is a different fact.
    pattern: /insufficient funds available/i,
    failure: { kind: "paused" },
  },
  {
    // "Insufficient reward balance for payout. Current available balance 'N'" — the wallet.
    pattern: /insufficient reward balance/i,
    failure: { kind: "amountRejected" },
  },
  {
    // "Complete the following profile information before cashing out: …" and
    // "Cash-out is unavailable because your country is not specified" — both are missing profile
    // data, and the gate lists the fields itself rather than parsing them out of the message.
    pattern: /profile information before cashing out|country is not specified/i,
    failure: { kind: "gate", reason: "profileIncomplete" },
  },
  {
    // "Cash-out is currently unavailable; please try again later" — provider availability unknown.
    // Must be matched before the country variant: while offline, support carries no information.
    pattern: /currently unavailable;\s*please try again later/i,
    failure: { kind: "gate", reason: "providerOffline" },
  },
  {
    // "Cash-out is currently unavailable in {country}"
    pattern: /currently unavailable in /i,
    failure: { kind: "gate", reason: "countryUnsupported" },
  },
  {
    // "The reward wallet is not ready for payout"
    pattern: /reward wallet is not ready/i,
    failure: { kind: "gate", reason: "walletNotReady" },
  },
  {
    // "The payout provider session is not yet available" — GetSession, for a payout Yoma has
    // recorded but has not yet placed with the provider. Nothing to resume, nothing wrong.
    pattern: /provider session is not yet available/i,
    failure: { kind: "sessionNotReady" },
  },
  {
    // "No active payout exists for the current user" — EntityNotFoundException, i.e. the 404.
    pattern: /no active payout exists/i,
    failure: { kind: "noActivePayout" },
  },
];

export const mapPayoutFailure = (error: unknown): PayoutFailure => {
  const { status, errors, message } = parseApiError(error);

  // The session route answers 404 by contract; the message is a bonus, not a requirement.
  if (status === 404) return { kind: "noActivePayout" };

  const texts = errors.map((item) => item.message).filter(Boolean);
  if (message) texts.push(message);

  for (const text of texts) {
    const matched = MATCHERS.find((matcher) => matcher.pattern.test(text));
    if (matched) return matched.failure;
  }

  return { kind: "failed" };
};
