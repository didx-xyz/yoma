/**
 * Payout — moving a youth's ZLTO out of the platform as real money.
 *
 * Typed to match `Yoma.Core.Domain.Payout.Models.*`. Deliberately provider-neutral: the payout
 * provider is an API-side implementation detail and must never appear in a label, a type name or a
 * comment on this side.
 *
 * Returned by `POST /user/payout/zlto` and embedded in `GET /user/profile` as `payout.info`, so it
 * lives here rather than in `user.ts` — both endpoints hand back the same shape.
 */

/**
 * The settlement currency. USD is fixed server-side rather than caller-selectable (see the note on
 * `Yoma.Core.Domain.Payout.Currency`), and serialises as a string — `Startup.cs` registers a
 * strict string enum converter. Widen this union only when the API adds a currency.
 */
export type PayoutCurrency = "USD";

/** A single payout, as the youth-facing surfaces see it. */
export interface PayoutInfo {
  /** the settled value in `currency`, not the ZLTO amount it came from */
  amount: number;
  currency: PayoutCurrency;
  /** where the youth completes or tracks the payout; null until the provider supplies one */
  paymentUrl: string | null;
}
