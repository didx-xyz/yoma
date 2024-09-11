import {
  type GetServerSidePropsContext,
  type GetStaticPropsContext,
} from "next";
import ApiClient from "~/lib/axiosClient";
import ApiServer from "~/lib/axiosServer";
import type { Country } from "../models/lookups";
import type {
  StoreAccessControlRuleInfo,
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
import { OrganizationInfo } from "../models/organisation";

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
  // const { data } = await instance.post<StoreItemCategorySearchResults>(
  //   `/marketplace/store/item/category/search`,
  //   filter,
  // );
  //return data;

  // TODO: return MOCK data for now
  return {
    items: [
      {
        id: "category1",
        storeId: "store1",
        name: "Electronics",
        description: "All kinds of electronic items",
        summary: "Latest and greatest in electronics",
        imageURL: "https://example.com/electronics.jpg",
        amount: 100,
        count: 10,
      },
      {
        id: "category2",
        storeId: "store1",
        name: "Clothing",
        description: "Fashionable clothing items",
        summary: "Trendy and stylish clothing",
        imageURL: "https://example.com/clothing.jpg",
        amount: 50,
        count: 20,
      },
    ],
  };
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

// ListSearchCriteriaOrganizations
export const listSearchCriteriaOrganizations = async (
  context?: GetServerSidePropsContext | GetStaticPropsContext,
): Promise<OrganizationInfo[]> => {
  const instance = context ? ApiServer(context) : await ApiClient;
  // const { data } = await instance.get<OrganizationInfo[]>(
  //   "/marketplace/store/rule/search/filter/organizations",
  // );
  // return data;

  //TODO: return MOCK data for now
  return [
    {
      id: "773def1a-e6e6-44b3-9f92-dd97dff86027",
      name: "Yoma (Youth Agency Marketplace)",
      tagline: "Tagline 1",
      status: "Active",
      logoURL: "https://via.placeholder.com/150",
    },
  ];
};

// ListSearchCriteriaStores
export const listSearchCriteriaStores = async (
  organizationId?: string,
  context?: GetServerSidePropsContext | GetStaticPropsContext,
): Promise<StoreInfo[]> => {
  const instance = context ? ApiServer(context) : await ApiClient;
  // const { data } = await instance.get<StoreInfo[]>(
  //   "/marketplace/store/rule/search/filter/stores",
  //   { params: { organizationId } },
  // );
  // return data;

  //TODO: return MOCK data for now
  return [
    {
      id: "store1",
      name: "Store 1",
      codeAlpha2: "12345",
      countryName: "USA",
    },
  ];
};

// GetStoreAccessControlRuleById
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

// SearchStoreAccessControlRule
export const searchStoreAccessControlRule = async (
  filter: StoreAccessControlRuleSearchFilter,
  context?: GetServerSidePropsContext | GetStaticPropsContext,
): Promise<StoreAccessControlRuleSearchResults> => {
  const instance = context ? ApiServer(context) : await ApiClient;
  // const { data } = await instance.post<StoreAccessControlRuleSearchResults>(
  //   "/marketplace/store/rule/search",
  //   filter,
  // );

  //return data;

  // TODO: return MOCK data for now
  return {
    totalCount: 1,
    items: [
      {
        id: "rule1",
        name: "Rule 1",
        description: "This is a description for Rule 1",
        organizationId: "org1",
        organizationName: "Organization 1",
        store: {
          id: "store1",
          name: "Store 1",
          codeAlpha2: "12345",
          countryName: "USA",
        },
        storeItemCategories: [
          {
            id: "category1",
            name: "Electronics",
          },
          {
            id: "category2",
            name: "Clothing",
          },
        ],
        ageMin: 18,
        ageMax: 65,
        genderId: "gender1",
        gender: "Male",
        opportunityOption: "All",
        statusId: "status1",
        status: "Active",
        dateCreated: "2023-01-01T00:00:00Z",
        dateModified: "2023-01-02T00:00:00Z",
        opportunities: [
          {
            id: "opportunityItem1",
            title: "Opportunity Item 1",
          },
        ],
      },
    ],
  };
};

// CreateStoreAccessControlRule
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

// UpdateStoreAccessControlRule
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

// UpdateStatusStoreAccessControlRule
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
