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
 * The hosted session a youth is sent to in order to finish a cash out. Returned by both
 * `POST /user/payout/zlto` (initiation) and `GET /user/payout/zlto` (refresh for an active payout).
 *
 * ⚠️ **Receiving one of these is not a completed payout.** It means a session exists; the terminal
 * outcome is read back from Yoma's own payout record.
 *
 * `paymentUrl` is HTTPS-enforced server-side and short-lived (`expiresAt`, ≈30 minutes). Navigate
 * to it and never persist it — fetch a fresh session instead.
 */
export interface PayoutSession {
  /** the settled value in `currency`, not the ZLTO amount it came from */
  amount: number;
  currency: PayoutCurrency;
  paymentUrl: string;
  /** ISO 8601 */
  expiresAt: string;
}
