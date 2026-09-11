import type { GetServerSidePropsContext, GetStaticPropsContext } from "next";
import ApiClient from "~/lib/axiosClient";
import ApiServer from "~/lib/axiosServer";
import type { Country } from "../models/lookups";
import type { PayoutSession, PayoutTransactionInfo } from "../models/payout";

/**
 * `GET /user/payout/countries` — **User** role. The countries whose payout provider currently has
 * at least one active channel.
 *
 * The list is provider-owned and changes (18 corridors at the 2026-09-01 probe) — **never
 * hardcode it**.
 *
 * ⚠️ The API answers **HTTP 503** when live provider availability cannot be determined. That is
 * "we don't know", not "your country is unsupported", and the two must not read the same way — so
 * this resolves to `null` for offline rather than throwing or returning `[]`. An empty array is a
 * different, meaningful answer: the provider is reachable and supports nothing.
 */
export const listPayoutCountries = async (
  context?: GetServerSidePropsContext | GetStaticPropsContext,
): Promise<Country[] | null> => {
  const instance = context ? ApiServer(context) : await ApiClient;
  const { data, status } = await instance.get<Country[]>(
    "/user/payout/countries",
    // 503 is a documented outcome of this endpoint, not a failure — take it as data.
    { validateStatus: (s) => (s >= 200 && s < 300) || s === 503 },
  );
  return status === 503 ? null : data;
};

/**
 * `POST /user/payout/zlto?amount=` — **User** role. Reserves the Zlto and initiates the payout,
 * returning the hosted session to send the youth to.
 *
 * ⚠️ **The amount is a query parameter and there is no body** (`PayoutZlto([FromQuery] decimal
 * amount)`), and there is no request validator class — `PayoutService.PayoutRewards` throws
 * directly. Its rules and their HTTP status are mirrored in `lib/payout/amount.ts`.
 *
 * ⚠️ **A session is not a completed payout.** It means the provider has accepted the request and
 * the youth still has to finish the hosted journey. The terminal outcome is Yoma's to report later.
 *
 * Idempotency is by Yoma payout id on the provider side, and only one payout may be active per
 * user: a second call while one is in flight is refused with "A payout is already in progress".
 */
export const initiateZltoPayout = async (
  amount: number,
  context?: GetServerSidePropsContext | GetStaticPropsContext,
): Promise<PayoutSession> => {
  const instance = context ? ApiServer(context) : await ApiClient;
  const { data } = await instance.post<PayoutSession>(
    "/user/payout/zlto",
    // No body: the endpoint takes the amount from the query string, and axios needs to be told
    // that explicitly or it sends the amount as JSON and the server binds nothing.
    undefined,
    { params: { amount } },
  );
  return data;
};

/**
 * `GET /user/payout/zlto` — **User** role. A **freshly refreshed** hosted session for the active
 * payout, or `null` when the API answers **404**.
 *
 * Call this on tap, every time: sessions last ≈30 minutes, the provider issues a new one on
 * request, and **`POST` must never be used to refresh** — that would start a second payout.
 *
 * ⚠️ **A 404 here does not prove the payout closed.** The refusal can originate at the provider and
 * can be transient. Read `getLatestPayout` before telling a youth anything terminal.
 */
export const getZltoPayoutSession = async (
  context?: GetServerSidePropsContext | GetStaticPropsContext,
): Promise<PayoutSession | null> => {
  const instance = context ? ApiServer(context) : await ApiClient;
  const { data, status } = await instance.get<PayoutSession>(
    "/user/payout/zlto",
    // 404 is the documented "no active payout" answer, not a failure — take it as data.
    { validateStatus: (s) => (s >= 200 && s < 300) || s === 404 },
  );
  return status === 404 ? null : data;
};

/**
 * `GET /user/payout/latest` — **User** role. The youth's active payout, or their most recently
 * initiated terminal one; `null` when they have never cashed out (**404**).
 *
 * **The only way to read an outcome.** The profile carries active payouts only, and an outcome can
 * never be inferred from the wallet: a committed reservation and a released one both leave
 * `pendingPayout` at zero.
 *
 * Read-only and cheap — no provider call, no session creation, no mutation. But it is a
 * *latest-state* read, not a history feed: ask for it **inside the cash-out journey** (on closing
 * the hosted modal, or when the youth asks how it went), never as an unread-notification banner
 * that re-announces an old outcome on every visit.
 */
export const getLatestPayout = async (
  context?: GetServerSidePropsContext | GetStaticPropsContext,
): Promise<PayoutTransactionInfo | null> => {
  const instance = context ? ApiServer(context) : await ApiClient;
  const { data, status } = await instance.get<PayoutTransactionInfo>(
    "/user/payout/latest",
    // 404 means "this youth has no payout at all", which is an answer, not a failure.
    { validateStatus: (s) => (s >= 200 && s < 300) || s === 404 },
  );
  return status === 404 ? null : data;
};
