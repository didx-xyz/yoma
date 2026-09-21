import type { Country } from "./lookups";

/**
 * Payout — moving a youth's ZLTO out of the platform as real money.
 *
 * Typed to match `Yoma.Core.Domain.Payout.Models.*`. Deliberately provider-neutral: the payout
 * provider is an API-side implementation detail and must never appear in a label, a type name or a
 * comment on this side.
 *
 * "Cash Out" is the user-facing action wording; `payout` is the contract term. Never name the
 * provider in copy.
 */

/**
 * The settlement currency. USD is fixed server-side rather than caller-selectable (see the note on
 * `Yoma.Core.Domain.Payout.Currency`), and serialises as a string — `Startup.cs` registers a
 * strict string enum converter. Widen this union only when the API adds a currency.
 */
export type PayoutCurrency = "USD";

/**
 * The provider-neutral lifecycle of a payout inside Yoma, mirroring
 * `Yoma.Core.Domain.Payout.PayoutTransactionStatus`. **A string enum** — every enum on the wire is
 * its PascalCase name (`Startup.cs`, and `"type": "string"` in the Swagger schema).
 *
 * `Initiated`, `Processing` and `ReconciliationRequired` are the **active** trio; the other four
 * are terminal and never resumable.
 *
 * ⚠️ **`Processing` starts when the hosted payout is created, not when the youth confirms it.** It
 * does not mean money is on its way, so copy for it stays neutral — "in progress", never "your
 * payment is being sent". Nothing on this contract distinguishes "awaiting confirmation" from
 * "confirmed and being delivered".
 */
export enum PayoutTransactionStatus {
  Initiated = "Initiated",
  Processing = "Processing",
  /** window elapsed or an ambiguous outcome; still active, reservation still held */
  ReconciliationRequired = "ReconciliationRequired",
  Completed = "Completed",
  Failed = "Failed",
  Cancelled = "Cancelled",
  Expired = "Expired",
}

/** The active trio, as one test. Terminal is simply the complement. */
export const isPayoutActive = (
  status: PayoutTransactionStatus | null | undefined,
): boolean =>
  status === PayoutTransactionStatus.Initiated ||
  status === PayoutTransactionStatus.Processing ||
  status === PayoutTransactionStatus.ReconciliationRequired;

/**
 * `GET /user/payout/latest` — the youth's active payout, or their most recently initiated terminal
 * one. **This is the only place an outcome can be read**; the profile carries active payouts only.
 *
 * Deliberately carries no id, no provider reference, no error text and **no ZLTO amount**: `amount`
 * is USD. The ZLTO that was reserved is gone from the wallet's `pendingPayout` once the payout
 * closes, and it must not be reconstructed at today's rate — Flow D shows the outcome and the
 * updated wallet, not a historical ZLTO figure.
 *
 * Ask for it **inside the cash-out journey** (on closing the hosted modal, or when checking how it
 * went). It is a latest-state read, not a history feed and not an unread-notification mechanism, so
 * do not announce an old outcome on every visit to the wallet.
 */
export interface PayoutTransactionInfo {
  /**
   * The Yoma payout transaction id (API 2026-09-21). **The same id as `PayoutSession.payoutId`**,
   * and the one to POST to the cancel endpoint.
   *
   * ⚠️ It exists so eligibility can be *matched to a payout*, not so it can be stored. Apply a
   * `canCancel` read only when this id equals the id of the session on screen — a mismatch means
   * the screen is stale and belongs to a payout that is no longer the active one, and acting on it
   * would cancel the wrong thing.
   */
  id: string;
  status: PayoutTransactionStatus;
  /** in `currency` — USD, not ZLTO */
  amount: number;
  currency: PayoutCurrency;
  /** ISO 8601 — **initiation** time, not confirmation or completion */
  dateCreated: string;
  /** true only while active *and* the provider has a reference to request a session against */
  canResume: boolean;
  /**
   * Whether the provider will currently accept a cancellation (API 2026-09-21). **Three-valued, and
   * all three matter:**
   *
   * - `true` — offer Cancel.
   * - `false` — do not. Terminal payouts are always false, and so is one the youth has already
   *   submitted at the provider.
   * - `null` / absent — **unknown**, not "no". The provider reference is missing, or the status
   *   call failed. Do not offer Cancel, and do not tell the youth it is unavailable either; offer
   *   another look.
   *
   * ⚠️ **Not derivable locally, which is why it is not on the profile.** Yoma's `Processing` covers
   * both "the provider has it and has not been told to go" and "the youth has submitted it", and
   * only the provider can separate them. It is a snapshot: the provider re-checks atomically on
   * cancel and may still refuse. Reading it costs a provider round-trip, so it is fetched on
   * demand next to the interaction, never on profile load.
   */
  canCancel?: boolean | null;
}

/**
 * Whether a new payout may be started from the youth's profile country.
 *
 * Two independent booleans, not one tri-state: `offline` means the provider's live corridor list
 * could not be read, so `supported` carries no information and must not be shown as "unsupported".
 * The corridor list is provider-owned and changes — never hardcode it.
 *
 * Mirrors `PayoutCountryAvailability`. Gates **new initiation only**: an active payout stays
 * resumable even if its corridor is withdrawn.
 */
export interface PayoutCountryAvailability {
  supported: boolean;
  offline: boolean;
  /**
   * The smallest **USD** payout this country will accept (API 2026-09-21), or null.
   *
   * ⚠️ **Null means "no minimum enforced by Yoma" — never "any amount is fine".** It is also what
   * an unsupported, unspecified or offline country returns, and those are blocked by `supported` /
   * `offline` regardless. Null must never be read as permission to cash out, and a missing minimum
   * must never be replaced with an invented one.
   *
   * It is a *country* floor, not a corridor floor: the hosted provider is still the authority once
   * the youth picks where the money goes, so nothing here may promise the payout will be accepted.
   *
   * ⚠️ Compare it against the **conversion preview's USD figure**, never against the ZLTO the youth
   * typed, and never against a threshold reverse-calculated from the displayed rate. Optional
   * because a rolling deployment can serve an API that predates it.
   */
  minimumAmount?: number | null;
  /**
   * The currency `minimumAmount` is expressed in — USD today, and **separate from the active
   * payout's `currency` on purpose**. Changing country changes this; it must never relabel a payout
   * already in flight.
   *
   * ⚠️ **This is metadata, not multi-currency support.** If it is ever anything but USD, that is
   * unusable contract data: do not convert, do not compare it numerically against the USD preview,
   * and do not infer a payout currency from it. A supported country sends USD even when
   * `minimumAmount` is null.
   */
  currency?: PayoutCurrency | null;
}

/**
 * `GET /user/payout/countries` — a supported country, with its payout limits (API 2026-09-21).
 *
 * The limits belong to *payout* countries only; the general `Country` lookup is unchanged and must
 * stay that way.
 */
export interface PayoutCountry extends Country {
  /** see `PayoutCountryAvailability.minimumAmount` — same figure, same caveats */
  minimumAmount?: number | null;
  currency?: PayoutCurrency | null;
}

/**
 * The hosted session the youth finishes the cash out in. Returned by both
 * `POST /user/payout/zlto` (initiation) and `GET /user/payout/zlto` (a fresh session for the payout
 * already active).
 *
 * ⚠️ **Receiving one of these is not a completed payout.** It means a session exists; the outcome
 * is read from `GET /user/payout/latest`.
 *
 * `paymentUrl` is HTTPS-enforced server-side and short-lived (`expiresAt`, ≈30 minutes). It is the
 * **iframe source, complete with its fragment token** — use it verbatim, never persist it, and
 * never `POST` again to refresh it: `GET` issues a new session for the same payout, and the
 * session expiring does not expire the payout.
 *
 * Typed non-null although the schema marks it nullable (the C# uses `null!`), because a session
 * without a URL is useless to the caller — `isSafePaymentUrl` is what actually guards it.
 */
export interface PayoutSession {
  /**
   * The Yoma payout transaction this session belongs to (API 2026-09-21) — the same id as
   * `PayoutTransactionInfo.id`, and the one the cancel endpoint takes.
   *
   * ⚠️ Cancel **this** id, the one on screen. Never re-resolve "the user's active payout" at the
   * moment of cancelling: if the screen is stale, that resolves to a *different* payout and cancels
   * something the youth never looked at. Optional for rolling deployment; without it, Cancel cannot
   * be offered at all, because there is nothing safe to address.
   */
  payoutId?: string;
  /**
   * Whether the provider would accept a cancellation, as of this session response. `true` is the
   * only value that may enable Cancel — see `PayoutTransactionInfo.canCancel` for why absent is
   * "unknown" rather than "no", and why this is a snapshot the provider may still overrule.
   */
  canCancel?: boolean;
  /** the settled value in `currency`, not the ZLTO amount it came from */
  amount: number;
  currency: PayoutCurrency;
  paymentUrl: string;
  /** ISO 8601 */
  expiresAt: string;
}
