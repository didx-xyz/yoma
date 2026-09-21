import type { GetServerSidePropsContext, GetStaticPropsContext } from "next";
import ApiClient from "~/lib/axiosClient";
import ApiServer from "~/lib/axiosServer";
import type {
  PayoutTransactionAdminInfo,
  PayoutTransactionSearchFilter,
  PayoutTransactionSearchResults,
} from "../models/payout";
import type {
  ConversionResponse,
  TreasuryInfo,
  TreasuryRequestUpdate,
} from "../models/treasury";

/** `GET /treasury` — Admin role. The configuration plus the top-level reward and payout figures. */
export const getTreasury = async (
  context?: GetServerSidePropsContext | GetStaticPropsContext,
): Promise<TreasuryInfo> => {
  const instance = context ? ApiServer(context) : await ApiClient;
  const { data } = await instance.get<TreasuryInfo>("/treasury");
  return data;
};

/**
 * `PATCH /treasury` — Admin role.
 *
 * ⚠️ May reset the Treasury's and every organisation's current-financial-year cumulatives: the
 * server rolls the financial year forward when the submitted configuration moves the calculated
 * start date past the persisted one. Warn before calling — see `lib/treasury/financialYear.ts`.
 */
export const updateTreasury = async (
  request: TreasuryRequestUpdate,
  context?: GetServerSidePropsContext | GetStaticPropsContext,
): Promise<TreasuryInfo> => {
  const instance = context ? ApiServer(context) : await ApiClient;
  const { data } = await instance.patch<TreasuryInfo>("/treasury", request);
  return data;
};

/**
 * `GET /treasury/conversion/zlto-usd` — **User** role, deliberately: this is the youth-facing
 * payout preview. Returns the indicative USD amount, currency and whether the Treasury currently
 * has sufficient uncommitted payout funds. The API rejects zero, negative and fractional amounts.
 *
 * Indicative only — the final conversion is determined at payout.
 */
export const convertZltoToUsd = async (
  amount: number,
  context?: GetServerSidePropsContext | GetStaticPropsContext,
): Promise<ConversionResponse> => {
  const instance = context ? ApiServer(context) : await ApiClient;
  const { data } = await instance.get<ConversionResponse>(
    "/treasury/conversion/zlto-usd",
    { params: { amount } },
  );
  return data;
};

/**
 * `POST /treasury/payout/transaction/search` — **Admin** role. Yoma's payout audit records,
 * newest first.
 *
 * ⚠️ **Pagination is mandatory**: the server validator rejects a filter without `pageNumber` and
 * `pageSize` ("Pagination required"), so there is no "fetch everything" call to make by accident.
 * Sorting is fixed server-side (`dateCreated` then `id`, both descending).
 *
 * Lives here rather than in `services/payout.ts` because the route and the Admin role are the
 * Treasury controller's; the *models* stay in `models/payout.ts` with the rest of the domain.
 */
export const searchPayoutTransactions = async (
  filter: PayoutTransactionSearchFilter,
  context?: GetServerSidePropsContext | GetStaticPropsContext,
): Promise<PayoutTransactionSearchResults> => {
  const instance = context ? ApiServer(context) : await ApiClient;
  const { data } = await instance.post<PayoutTransactionSearchResults>(
    "/treasury/payout/transaction/search",
    filter,
  );
  return data;
};

/**
 * `GET /treasury/payout/transaction/{id}` — **Admin** role. One payout with the youth it belongs
 * to and the reward transaction that funded it.
 *
 * Query-only: there is no endpoint to act on a payout from here, and the reward transaction is
 * context, never something to reconcile by hand.
 */
export const getPayoutTransaction = async (
  id: string,
  context?: GetServerSidePropsContext | GetStaticPropsContext,
): Promise<PayoutTransactionAdminInfo> => {
  const instance = context ? ApiServer(context) : await ApiClient;
  const { data } = await instance.get<PayoutTransactionAdminInfo>(
    `/treasury/payout/transaction/${id}`,
  );
  return data;
};
