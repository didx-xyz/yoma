import {
  type GetStaticPropsContext,
  type GetServerSidePropsContext,
} from "next";
import ApiClient from "~/lib/axiosClient";
import ApiServer from "~/lib/axiosServer";
import type {
  StoreCategory,
  StoreSearchFilter,
  StoreSearchResults,
  StoreItemCategorySearchFilter,
  StoreItemCategorySearchResults,
  StoreItemSearchFilter,
  StoreItemSearchResults,
} from "../models/marketplace";
import type {
  WalletVoucherSearchFilter,
  WalletVoucherSearchResults,
} from "../models/reward";
import type { Country } from "../models/lookups";

export const listSearchCriteriaCountries = async (
  context?: GetServerSidePropsContext | GetStaticPropsContext,
): Promise<Country[]> => {
  const instance = context ? ApiServer(context) : await ApiClient;
  const { data } = await instance.get<Country[]>(
    "/marketplace/store/search/filter/country",
  );
  return data;
};

export const listStoreCategories = async (
  countryCodeAlpha2: string,
  context?: GetServerSidePropsContext | GetStaticPropsContext,
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
  context?: GetServerSidePropsContext | GetStaticPropsContext,
): Promise<StoreSearchResults> => {
  const instance = context ? ApiServer(context) : await ApiClient;

  const { data } = await instance.post<StoreSearchResults>(
    `/marketplace/store/search`,
    filter,
  );
  return data;
};

export const searchStoreItemCategories = async (
  filter: StoreItemCategorySearchFilter,
  context?: GetServerSidePropsContext | GetStaticPropsContext,
): Promise<StoreItemCategorySearchResults> => {
  const instance = context ? ApiServer(context) : await ApiClient;
  const { data } = await instance.post<StoreItemCategorySearchResults>(
    `/marketplace/store/item/category/search`,
    filter,
  );
  return data;

  // TODO: hardcoded data based on the filter.pageNumber
  // const { pageNumber } = filter;
  // const items = Array.from({ length: 4 }, (_, index) => {
  //   return {
  //     id: `id-${pageNumber}-${index}`,
  //     name: `Item ${pageNumber}-${index}`,
  //     description: `Description ${pageNumber}-${index}`,
  //     amount: 100,
  //     count: 100,
  //     imageURL:
  //       "https://s3-eu-west-1.amazonaws.com/media.zlto.cloud/store/store_front/50a0338879e04c619ade3d989b727e9f_sfd/Electricity.png",
  //     storeId: filter.storeId,
  //     summary: `summary ${pageNumber}-${index}`,
  //   };
  // });
  // return {
  //   items: items,
  // };
};

export const searchStoreItems = async (
  filter: StoreItemSearchFilter,
  context?: GetServerSidePropsContext | GetStaticPropsContext,
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
  context?: GetServerSidePropsContext | GetStaticPropsContext,
): Promise<WalletVoucherSearchResults> => {
  const instance = context ? ApiServer(context) : await ApiClient;

  const { data } = await instance.post<WalletVoucherSearchResults>(
    `/marketplace/voucher/search`,
    filter,
  );
  return data;
};

export const buyItem = async (
  storeId: string,
  itemCategoryId: string,
  context?: GetServerSidePropsContext | GetStaticPropsContext,
): Promise<void> => {
  const instance = context ? ApiServer(context) : await ApiClient;
  await instance.post(
    `marketplace/store/${storeId}/item/category/${itemCategoryId}/buy`,
  );
};
