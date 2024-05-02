import { PaginationFilter } from "./common";

export interface LinkRequestCreate {
  name: string | null;
  description: string | null;
  entityType: LinkEntityType | string | null; // NB: string | null is not in the original model
  entityId: string | null; // NB: string | null is not in the original model
  usagesLimit: number | null;
  dateEnd: string | null;
  distributionList: string[] | null;
  includeQRCode: boolean | null;
  lockToDistributionList: boolean | null; //TODO: check on api
}

export interface LinkInfo {
  id: string;
  name: string;
  description: string | null;
  entityType: LinkEntityType;
  action: LinkAction;
  statusId: string;
  status: LinkStatus;
  entityId: string;
  entityTitle: string;
  uRL: string;
  shortURL: string;
  qRCodeBase64: string | null;
  usagesLimit: number | null;
  usagesTotal: number | null;
  usagesAvailable: number | null;
  dateEnd: string | null;
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
}

export interface LinkSearchFilter extends PaginationFilter {
  entityType: LinkEntityType | string | null; // NB: string | null is not in the original model
  action: LinkAction | string | null; // NB: string | null is not in the original model
  statuses: LinkStatus[] | null;
  entities: string[] | null;
  organizations: string[] | null;
}

export interface LinkSearchResult {
  totalCount: number | null;
  items: LinkInfo[];
}
