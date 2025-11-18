import type { PaginationFilter } from "./common";

export interface LinkRequestCreateBase {
  name: string | null;
  description: string | null;
  entityType: ActionLinkEntityType | string | null; // NB: string | null is not in the original model
  entityId: string | null; // NB: null is not in the original model
  includeQRCode: boolean | null;
}

export interface LinkRequestCreateShare extends LinkRequestCreateBase {}

export interface LinkRequestCreateVerify extends LinkRequestCreateBase {
  usagesLimit: number | null;
  dateEnd: string | null;
  distributionList: string[] | null;
  lockToDistributionList: boolean | null;
}

export interface LinkInfo {
  id: string;
  name: string;
  description: string | null;
  entityType: ActionLinkEntityType | string; //NB: string is not in the original model
  action: LinkAction | string; //NB:
  statusId: string;
  status: ActionLinkStatus | string; //NB:
  entityId: string;
  entityTitle: string;
  entityOrganizationId: string | null;
  entityOrganizationName: string | null;
  url: string;
  shortURL: string;
  qrCodeBase64: string | null; // NB: casing not the same as api
  usagesLimit: number | null;
  usagesTotal: number | null;
  usagesAvailable: number | null;
  dateEnd: string | null;
  distributionList: string[] | null;
  lockToDistributionList: boolean | null;
  dateCreated: string;
  dateModified: string;
}

export enum ActionLinkEntityType {
  Opportunity = "Opportunity",
}

export enum LinkAction {
  Share = "Share",
  Verify = "Verify",
}

export enum ActionLinkStatus {
  Active = "Active",
  Inactive = "Inactive",
  Expired = "Expired",
  LimitReached = "LimitReached",
  Deleted = "Deleted",
}

export interface LinkSearchFilter extends PaginationFilter {
  entityType: ActionLinkEntityType | string | null; // NB: string | null is not in the original model
  action: LinkAction | string | null; // NB: string | null is not in the original model
  statuses: ActionLinkStatus[] | null | string[]; // NB: string[] null is not in the original model
  entities: string[] | null;
  organizations: string[] | null;
  valueContains: string | null;
}

export interface LinkSearchResult {
  totalCount: number | null;
  items: LinkInfo[];
}

export interface LinkSearchFilterUsage extends PaginationFilter {
  id: string;
  usage: ActionLinkUsageStatus | string | null; // NB: string | null is not in the original model
  valueContains: string | null;
}

export enum ActionLinkUsageStatus {
  All = "All",
  Claimed = "Claimed",
  Unclaimed = "Unclaimed",
}

export interface LinkSearchResultsUsage {
  link: LinkInfo;
  totalCount: number | null;
  items: LinkSearchResultsUsageItem[];
}

export interface LinkSearchResultsUsageItem {
  userId: string | null;
  username: string;
  email: string | null;
  phoneNumber: string | null;
  displayName: string | null;
  country: string | null;
  age: number | null;
  claimed: boolean;
  dateClaimed: string | null;
}
