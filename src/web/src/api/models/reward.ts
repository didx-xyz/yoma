import type { PaginationFilter } from "./common";

export interface WalletVoucher {
  id: string;
  category: string;
  name: string;
  code: string;
  instructions: string;
  amount: number;
  status: VoucherStatus | string; //NB: string
}

export enum VoucherStatus {
  New,
  Viewed,
}
export interface WalletVoucherSearchResults {
  items: WalletVoucher[];
}

export interface WalletVoucherSearchFilter extends PaginationFilter {}
