import type { PaginationFilter } from "./common";

export interface StoreCategory {
  id: string;
  name: string;
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
  itemCount: number;
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
  categoryId: string | null;
}

export interface StoreSearchResults {
  items: Store[];
}
