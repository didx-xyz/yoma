import type { GetServerSidePropsContext, GetStaticPropsContext } from "next";
import ApiClient from "~/lib/axiosClient";
import ApiServer from "~/lib/axiosServer";
import type { TreasuryInfo, TreasuryRequestUpdate } from "../models/treasury";

/** `GET /treasury` — Admin role. The configuration plus the top-level reward and cash-out figures. */
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
 * cash-out preview. Returns a bare USD decimal for a whole, positive ZLTO amount; the API rejects
 * zero, negative and fractional amounts.
 *
 * Indicative only — the final conversion is determined at payout.
 */
export const convertZltoToUsd = async (
  amount: number,
  context?: GetServerSidePropsContext | GetStaticPropsContext,
): Promise<number> => {
  const instance = context ? ApiServer(context) : await ApiClient;
  const { data } = await instance.get<number>("/treasury/conversion/zlto-usd", {
    params: { amount },
  });
  return data;
};
