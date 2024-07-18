import type { PaginationFilter } from "./common";

export interface LinkRequestCreateBase {
  name: string | null;
  description: string | null;
  entityType: LinkEntityType | string | null; // NB: string | null is not in the original model
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
  entityType: LinkEntityType | string; //NB: string is not in the original model
  action: LinkAction;
  statusId: string;
  status: LinkStatus | string; //NB: string is not in the original model
  entityId: string;
  entityTitle: string;
  entityOrganizationId: string | null;
  uRL: string;
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

export enum LinkEntityType {
  Opportunity,
}

export enum LinkAction {
  Share,
  Verify,
}

export enum LinkStatus {
  Active,
  Inactive,
  Expired,
  LimitReached,
  Declined,
  Deleted,
}

export interface LinkSearchFilter extends PaginationFilter {
  entityType: LinkEntityType | string | null; // NB: string | null is not in the original model
  action: LinkAction | string | null; // NB: string | null is not in the original model
  statuses: LinkStatus[] | null | string[]; // NB: string[] null is not in the original model
  entities: string[] | null;
  organizations: string[] | null;
}

export interface LinkSearchResult {
  totalCount: number | null;
  items: LinkInfo[];
}

export interface LinkRequestUpdateStatus {
  status: LinkStatus;
  comment: string | null;
}
