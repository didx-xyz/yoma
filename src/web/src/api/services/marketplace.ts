import {
  type GetServerSidePropsContext,
  type GetStaticPropsContext,
} from "next";
import ApiClient from "~/lib/axiosClient";
import ApiServer from "~/lib/axiosServer";
import type { Country } from "../models/lookups";
import type {
  StoreAccessControlRuleInfo,
  StoreAccessControlRulePreviewInfo,
  StoreAccessControlRuleRequestCreate,
  StoreAccessControlRuleRequestUpdate,
  StoreAccessControlRuleSearchFilter,
  StoreAccessControlRuleSearchResults,
  StoreAccessControlRuleStatus,
  StoreCategory,
  StoreInfo,
  StoreItemCategorySearchFilter,
  StoreItemCategorySearchResults,
  StoreItemSearchFilter,
  StoreItemSearchResults,
  StoreSearchFilter,
  StoreSearchResults,
  WalletVoucherSearchFilter,
  WalletVoucherSearchResults,
} from "../models/marketplace";
import type { OrganizationInfo } from "../models/organisation";

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

//# administrative actions

export const listSearchCriteriaOrganizations = async (
  context?: GetServerSidePropsContext | GetStaticPropsContext,
): Promise<OrganizationInfo[]> => {
  const instance = context ? ApiServer(context) : await ApiClient;
  const { data } = await instance.get<OrganizationInfo[]>(
    "/marketplace/store/rule/search/filter/organizations",
  );
  return data;
};

export const listSearchCriteriaStores = async (
  organizationId?: string,
  context?: GetServerSidePropsContext | GetStaticPropsContext,
): Promise<StoreInfo[]> => {
  const instance = context ? ApiServer(context) : await ApiClient;
  const { data } = await instance.get<StoreInfo[]>(
    "/marketplace/store/rule/search/filter/stores",
    { params: { organizationId } },
  );
  return data;
};

export const getStoreAccessControlRuleById = async (
  id: string,
  context?: GetServerSidePropsContext | GetStaticPropsContext,
): Promise<StoreAccessControlRuleInfo> => {
  const instance = context ? ApiServer(context) : await ApiClient;
  const { data } = await instance.get<StoreAccessControlRuleInfo>(
    `/marketplace/store/rule/${id}`,
  );
  return data;
};

export const searchStoreAccessControlRule = async (
  filter: StoreAccessControlRuleSearchFilter,
  context?: GetServerSidePropsContext | GetStaticPropsContext,
): Promise<StoreAccessControlRuleSearchResults> => {
  const instance = context ? ApiServer(context) : await ApiClient;
  const { data } = await instance.post<StoreAccessControlRuleSearchResults>(
    "/marketplace/store/rule/search",
    filter,
  );

  return data;
};

export const createStoreAccessControlRule = async (
  request: StoreAccessControlRuleRequestCreate,
  context?: GetServerSidePropsContext | GetStaticPropsContext,
): Promise<StoreAccessControlRuleInfo> => {
  const instance = context ? ApiServer(context) : await ApiClient;
  const { data } = await instance.post<StoreAccessControlRuleInfo>(
    "/marketplace/store/rule",
    request,
  );
  return data;
};

export const updateStoreAccessControlRule = async (
  request: StoreAccessControlRuleRequestUpdate,
  context?: GetServerSidePropsContext | GetStaticPropsContext,
): Promise<StoreAccessControlRuleInfo> => {
  const instance = context ? ApiServer(context) : await ApiClient;
  const { data } = await instance.patch<StoreAccessControlRuleInfo>(
    "/marketplace/store/rule",
    request,
  );
  return data;
};

export const updateStatusStoreAccessControlRule = async (
  id: string,
  status: StoreAccessControlRuleStatus,
  context?: GetServerSidePropsContext | GetStaticPropsContext,
): Promise<StoreAccessControlRuleInfo> => {
  const instance = context ? ApiServer(context) : await ApiClient;
  const { data } = await instance.patch<StoreAccessControlRuleInfo>(
    `/marketplace/store/rule/${id}/${status}`,
  );
  return data;
};

export const createStoreAccessControlRulePreview = async (
  request: StoreAccessControlRuleRequestCreate,
  context?: GetServerSidePropsContext | GetStaticPropsContext,
): Promise<StoreAccessControlRulePreviewInfo> => {
  const instance = context ? ApiServer(context) : await ApiClient;
  const { data } = await instance.post<StoreAccessControlRulePreviewInfo>(
    "/marketplace/store/rule/preview",
    request,
  );
  return data;
};

export const updateStoreAccessControlRulePreview = async (
  request: StoreAccessControlRuleRequestUpdate,
  context?: GetServerSidePropsContext | GetStaticPropsContext,
): Promise<StoreAccessControlRulePreviewInfo> => {
  const instance = context ? ApiServer(context) : await ApiClient;
  const { data } = await instance.patch<StoreAccessControlRulePreviewInfo>(
    "/marketplace/store/rule/preview",
    request,
  );
  return data;
};
