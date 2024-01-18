import { type GetServerSidePropsContext } from "next";
import ApiClient from "~/lib/axiosClient";
import ApiServer from "~/lib/axiosServer";
import type {
  StoreCategory,
  StoreSearchFilter,
  StoreSearchResults,
  StoreItemCategory,
  StoreItemSearchFilter,
  StoreItemSearchResults,
} from "../models/marketplace";
import type {
  WalletVoucherSearchFilter,
  WalletVoucherSearchResults,
} from "../models/reward";
import { Country } from "../models/lookups";

export const listSearchCriteriaCountries = async (
  context?: GetServerSidePropsContext,
): Promise<Country[]> => {
  const instance = context ? ApiServer(context) : await ApiClient;
  const { data } = await instance.get<Country[]>(
    "/marketplace/store/search/filter/country",
  );
  return data;
};

export const listStoreCategories = async (
  countryCodeAlpha2: string,
  context?: GetServerSidePropsContext,
): Promise<StoreCategory[]> => {
  const instance = context ? ApiServer(context) : await ApiClient;
  const { data } = await instance.get<StoreCategory[]>(
    `/marketplace/store/${countryCodeAlpha2}/category`,
  );
  return data;
};

//NB: paging doesn't work (zlto issue)
export const searchStores = async (
  filter: StoreSearchFilter,
  context?: GetServerSidePropsContext,
): Promise<StoreSearchResults> => {
  const instance = context ? ApiServer(context) : await ApiClient;

  const { data } = await instance.post<StoreSearchResults>(
    `/marketplace/store/search`,
    filter,
  );
  return data;
};

export const listStoreItemCategories = async (
  storeId: string,
  context?: GetServerSidePropsContext,
): Promise<StoreItemCategory[]> => {
  const instance = context ? ApiServer(context) : await ApiClient;
  const { data } = await instance.get<StoreItemCategory[]>(
    `/marketplace/store/${storeId}/category/item`,
  );
  return data;
};

export const searchStoreItems = async (
  filter: StoreItemSearchFilter,
  context?: GetServerSidePropsContext,
): Promise<StoreItemSearchResults> => {
  const instance = context ? ApiServer(context) : await ApiClient;

  const { data } = await instance.post<StoreItemSearchResults>(
    `/marketplace/store/item/search`,
    filter,
  );
  return data;
};

export const searchVouchers = async (
  filter: WalletVoucherSearchFilter,
  context?: GetServerSidePropsContext,
): Promise<WalletVoucherSearchResults> => {
  const instance = context ? ApiServer(context) : await ApiClient;

  const { data } = await instance.post<WalletVoucherSearchResults>(
    `/marketplace/voucher/search`,
    filter,
  );
  return data;
};
