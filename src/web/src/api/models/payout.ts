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
  status: PayoutTransactionStatus;
  /** in `currency` — USD, not ZLTO */
  amount: number;
  currency: PayoutCurrency;
  /** ISO 8601 — **initiation** time, not confirmation or completion */
  dateCreated: string;
  /** true only while active *and* the provider has a reference to request a session against */
  canResume: boolean;
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
  /** the settled value in `currency`, not the ZLTO amount it came from */
  amount: number;
  currency: PayoutCurrency;
  paymentUrl: string;
  /** ISO 8601 */
  expiresAt: string;
}
