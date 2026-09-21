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

import type { PaginationFilter } from "./common";
import type { Country } from "./lookups";
import type { UserInfo } from "./organisation";

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
 * Carries no provider reference, no error text and **no ZLTO amount**: `amount` is USD. The ZLTO
 * that was reserved is gone from the wallet's `pendingPayout` once the payout closes, and it must
 * not be reconstructed at today's rate — Flow D shows the outcome and the updated wallet, not a
 * historical ZLTO figure.
 *
 * ⚠️ It *did* carry no id either, until API 2026-09-21 added one for cancellation. That is the only
 * reason it exists — see `id` below — and it remains something to match against, never to store.
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

//#region Treasury admin — payout transaction audit
/*
 * Everything below is the **Admin** audit contract behind `/admin/treasury?tab=payouts`:
 * `POST /treasury/payout/transaction/search` and `GET /treasury/payout/transaction/{id}`.
 *
 * It is query-only by design (Adrian, 2026-08-27). There is no endpoint to retry, cancel or
 * re-reconcile a payout, and none is coming — the background reconciler and the provider webhooks
 * own every state change.
 *
 * ⚠️ **Two amounts, two units, both called "amount".** `PayoutTransaction.amount` is the settled
 * **USD** figure; the linked `RewardTransaction.amount` is the **ZLTO** that was reserved to fund
 * it. Never show one with the other's formatter — `formatUsd` and `formatZlto` respectively.
 */

/**
 * What funded the payout, mirroring `Yoma.Core.Domain.Payout.PayoutType`.
 *
 * `PayoutRewards` is the youth ZLTO cash out and is currently the **only** type any endpoint
 * creates — `PayoutService.Payout` (a direct USD payout, no ZLTO conversion) exists in the domain
 * but nothing calls it. The filter still offers both, because the search contract does.
 */
export enum PayoutType {
  /** a direct USD payout, not funded by a ZLTO reservation */
  Payout = "Payout",
  /** the youth cash out: ZLTO reserved, converted at the Treasury rate, then burned on completion */
  PayoutRewards = "PayoutRewards",
}

/**
 * One row of Yoma's authoritative payout audit record — the search result item and the payout half
 * of the detail response (`Yoma.Core.Domain.Payout.Models.PayoutTransaction`).
 *
 * The user identity fields are denormalised onto the row by the repository projection, so a list
 * needs no second lookup: `username` falls back email → phone, `userDisplayName` display name →
 * email → phone. Both are `string.Empty` rather than null when the user has none of the three.
 */
export interface PayoutTransaction {
  id: string;
  userId: string;
  /** email, or phone number when there is no email */
  username: string;
  userEmail: string | null;
  userPhoneNumber: string | null;
  /** display name, falling back to email then phone */
  userDisplayName: string;
  /**
   * ⚠️ A plain string column carrying the `PayoutType` **name**, not a serialised enum — it is
   * written with `.ToString()` and read back untouched. Compare against `PayoutType` values.
   */
  type: PayoutType;
  /**
   * The payout provider's name, as persisted. **Never rendered.** Provider neutrality is an epic
   * rule for copy, and with a single provider there is nothing here an admin can act on — see the
   * decision in YOM-1072's feature doc before adding it to a column or a filter.
   */
  provider: string;
  statusId: string;
  status: PayoutTransactionStatus;
  /** ⚠️ the settled amount in `currency` — **USD**, never the ZLTO that funded it */
  amount: number;
  currency: PayoutCurrency;
  /** the provider's own reference; null until the provider accepts the payout */
  transactionId: string | null;
  errorReason: string | null;
  /** ISO 8601 — expiry of the hosted session, **not** of the payout itself */
  expiresAt: string | null;
  /** ISO 8601 — expiry of the ZLTO reservation funding this payout (30h), the last-resort release */
  rewardReservationExpiresAt: string | null;
  /** ISO 8601 — last deliberate provider status check, including ones that changed nothing */
  dateLastReconciled: string | null;
  /** reconciliation retries after the initial processing attempt */
  retryCount: number | null;
  /** ISO 8601 — **initiation** time */
  dateCreated: string;
  dateModified: string;
}

/**
 * `POST /treasury/payout/transaction/search` filter
 * (`Yoma.Core.Domain.Payout.Models.PayoutTransactionSearchFilter`).
 *
 * ⚠️ **Pagination is required** — `PayoutTransactionSearchFilterValidator` rejects a filter whose
 * `pageNumber`/`pageSize` are absent ("Pagination required"). Results are always newest first;
 * there is no sort parameter.
 */
export interface PayoutTransactionSearchFilter extends PaginationFilter {
  /** a specific payout; the generic `valueContains` also matches a pasted id */
  id: string | null;
  userId: string | null;
  types: PayoutType[] | null;
  /** provider names; not offered by the UI — see `PayoutTransaction.provider` */
  providers: string[] | null;
  statuses: PayoutTransactionStatus[] | null;
  /** USD, matched inclusively (`>=` / `<=`) against the settled amount */
  amountFrom: number | null;
  amountTo: number | null;
  /** ISO 8601 — matched against `dateCreated`; the server widens these to whole days */
  dateStart: string | null;
  dateEnd: string | null;
  /**
   * Case-insensitive `contains` over the user's email, phone number and display name, the
   * provider's transaction reference and the error reason. A value that parses as a GUID
   * additionally matches the payout id and the user id exactly
   * (`PayoutTransactionRepository.MatchingIds`).
   */
  valueContains: string | null;
}

export interface PayoutTransactionSearchResults {
  totalCount: number | null;
  items: PayoutTransaction[] | null;
}

/**
 * The ZLTO side of a payout, mirroring `Yoma.Core.Domain.Reward.RewardTransactionStatus`.
 *
 * Only `Reserved`, `Processed` and `Released` occur on a payout: the ZLTO is held, then either
 * burned (`Processed`, the payout completed) or given back (`Released`, it did not). The other
 * three belong to reward *awards* and are here only because the enum is shared.
 */
export enum RewardTransactionStatus {
  Pending = "Pending",
  /** for a payout: the reserved ZLTO was burned */
  Processed = "Processed",
  ProcessedInitialBalance = "ProcessedInitialBalance",
  Error = "Error",
  /** the ZLTO is held by the reward provider and unavailable, but not yet burned */
  Reserved = "Reserved",
  /** the reservation was given back without burning */
  Released = "Released",
}

/**
 * The reward-provider transaction that funds a payout
 * (`Yoma.Core.Domain.Reward.Models.RewardTransaction`), as returned by the detail endpoint.
 *
 * ⚠️ `amount` is **ZLTO** — the reserved figure, at the rate that applied when the payout was
 * initiated. `transactionId` is the reward provider's reservation id, not the payout provider's
 * reference.
 */
export interface RewardTransaction {
  id: string;
  provider: string;
  userId: string;
  statusId: string;
  status: RewardTransactionStatus;
  /** `RewardTransactionEntityType` — "Payout" for everything this surface shows */
  sourceEntityType: string;
  myOpportunityId: string | null;
  referralLinkUsageId: string | null;
  payoutTransactionId: string | null;
  /** ⚠️ **ZLTO**, not the payout's USD */
  amount: number;
  /** the reward provider's reservation id */
  transactionId: string | null;
  errorReason: string | null;
  retryCount: number | null;
  /** ISO 8601 */
  reservationExpiresAt: string | null;
  dateCreated: string;
  dateModified: string;
}

/**
 * `GET /treasury/payout/transaction/{id}` — the payout audit record with the youth it belongs to
 * and the reward transaction funding it (`PayoutTransactionAdminInfo`).
 *
 * `rewardTransaction` is null when there is none to link: a direct (non-ZLTO) payout, or a
 * reservation that failed before Yoma could record it — which is itself worth seeing on this
 * surface, so it is shown as an explicit absence rather than hidden.
 */
export interface PayoutTransactionAdminInfo {
  transaction: PayoutTransaction;
  /** `Yoma.Core.Domain.Entity.Models.UserInfo`, declared once in `models/organisation.ts` */
  user: UserInfo;
  rewardTransaction: RewardTransaction | null;
}
//#endregion Treasury admin — payout transaction audit
