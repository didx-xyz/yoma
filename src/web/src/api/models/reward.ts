import type { PaginationFilter } from "./common";

export interface WalletVoucher {
  id: string;
  category: string;
  name: string;
  code: string;
  instructions: string;
  amount: number;
}

export interface WalletVoucherSearchResults {
  items: WalletVoucher[];
}

export interface WalletVoucherSearchFilter extends PaginationFilter {}
