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
  id: number;
  storeId: string;
  name: string;
  description: string;
  summary: string;
  imageURL: string;
  amount: number;
}

export interface StoreItemSearchFilter extends PaginationFilter {
  storeId: string;
  itemCategoryId: number;
}

export interface StoreItemSearchResults {
  items: StoreItem[];
}

export interface StoreSearchFilter extends PaginationFilter {
  countryCodeAlpha2: string;
  categoryId: string | null;
}

export interface StoreSearchResults {
  items: Store[];
}

export interface WalletVoucher {
  id: string;
  category: string;
  name: string;
  code: string;
  instructions: string;
  amount: number;
 // status: VoucherStatus;
}
