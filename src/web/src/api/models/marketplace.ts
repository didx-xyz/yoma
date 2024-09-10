import type { PaginationFilter } from "./common";

export interface StoreCategory {
  id: string;
  name: string;
  storeImageURLs: string[];
}

export interface Store {
  id: string;
  name: string;
  description: string;
  imageURL: string;
}

export interface StoreItem {
  id: number;
  name: string;
  description: string;
  summary: string;
  code: string;
  imageURL: string;
  amount: number;
}

export interface StoreItemCategory {
  id: string;
  storeId: string;
  name: string;
  description: string;
  summary: string;
  imageURL: string | null;
  amount: number;
  count: number;
}

export interface StoreSearchFilter extends PaginationFilter {
  countryCodeAlpha2: string;
  categoryId: string | null;
}

export interface StoreSearchResults {
  items: Store[];
}

export interface StoreItemCategorySearchFilter extends PaginationFilter {
  storeId: string;
}

export interface StoreItemCategorySearchResults {
  items: StoreItemCategory[];
}

export interface StoreItemSearchFilter extends PaginationFilter {
  storeId: string;
  itemCategoryId: string;
}

export interface StoreItemSearchResults {
  items: StoreItem[];
}

export interface WalletVoucher {
  id: string;
  category: string;
  name: string;
  code: string;
  instructions: string;
  amount: number;
  status: VoucherStatus | string; //NB: string for API compatibility
  dateStamp: string | null;
}

export enum VoucherStatus {
  New,
  Viewed,
}

export interface WalletVoucherSearchResults {
  items: WalletVoucher[];
}

export interface WalletVoucherSearchFilter extends PaginationFilter {}

// administrative models
export interface StoreInfo {
  id: string;
  name: string;
  codeAlpha2: string;
  countryName: string;
}

export interface StoreAccessControlRuleInfo {
  id: string;
  name: string;
  description: string | null;
  organizationId: string;
  organizationName: string;
  store: StoreInfo;
  storeItemCategories: StoreItemCategoryInfo[] | null;
  ageMin: number | null;
  ageMax: number | null;
  genderId: string | null;
  gender: string | null;
  opportunityOption: StoreAccessControlRuleOpportunityCondition | null | string; //NB: string for API compatibility
  statusId: string;
  status: StoreAccessControlRuleStatus | string; //NB: string for API compatibility
  dateCreated: string;
  dateModified: string;
  opportunities: OpportunityItem[] | null;
}

export interface StoreItemCategoryInfo {
  id: string;
  name: string;
}

export enum StoreAccessControlRuleOpportunityCondition {
  All,
  Any,
}

export enum StoreAccessControlRuleStatus {
  Active,
  Inactive,
  Deleted,
}

export interface OpportunityItem {
  id: string;
  title: string;
}
export interface StoreAccessControlRuleSearchFilter extends PaginationFilter {
  nameContains: string | null;
  stores: string[] | null;
  organizations: string[] | null;
  statuses: StoreAccessControlRuleStatus[] | null | string[]; //NB: string[] for API compatibility
}

export interface StoreAccessControlRuleSearchResults {
  totalCount: number | null;
  items: StoreAccessControlRuleInfo[];
}

export interface StoreAccessControlRuleRequestBase {
  name: string;
  description: string | null;
  organizationId: string;
  storeId: string;
  storeItemCategories: string[] | null;
  ageMin: number | null;
  ageMax: number | null;
  genderId: string | null;
  opportunities: string[] | null;
  opportunityOption: StoreAccessControlRuleOpportunityCondition | null;
}

export interface StoreAccessControlRuleRequestCreate
  extends StoreAccessControlRuleRequestBase {}

export interface StoreAccessControlRuleRequestUpdate
  extends StoreAccessControlRuleRequestBase {
  id: string;
}
