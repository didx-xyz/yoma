import type { FormFile, PaginationFilter } from "./common";
import type { SettingsInfo } from "./user";

export interface OrganizationRequestBase {
  id: string;
  name: string;
  websiteURL: string | null;
  primaryContactName: string | null;
  primaryContactEmail: string | null;
  primaryContactPhone: string | null;
  vATIN: string | null;
  taxNumber: string | null;
  registrationNumber: string | null;
  city: string | null;
  countryId: string | null;
  streetAddress: string | null;
  province: string | null;
  postalCode: string | null;
  tagline: string | null;
  biography: string | null;
  //logo: FormFile | null; // NB: optional due to FormData upload issue
  providerTypes: string[];
  registrationDocuments: FormFile[] | null;
  educationProviderDocuments: FormFile[] | null;
  businessDocuments: FormFile[] | null;
  addCurrentUserAsAdmin: boolean;
  admins: string[];
  registrationDocumentsDelete: string[] | null;
  educationProviderDocumentsDelete: string[] | null;
  businessDocumentsDelete: string[] | null;
  ssoClientIdInbound: string | null;
  ssoClientIdOutbound: string | null;
}

export interface OrganizationProviderType {
  id: string;
  name: string;
}

export interface Organization {
  id: string;
  name: string;
  nameHashValue: string;
  websiteURL: string | null;
  primaryContactName: string | null;
  primaryContactEmail: string | null;
  primaryContactPhone: string | null;
  vATIN: string | null;
  taxNumber: string | null;
  registrationNumber: string | null;
  city: string | null;
  countryId: string | null;
  country: string | null;
  streetAddress: string | null;
  province: string | null;
  postalCode: string | null;
  tagline: string | null;
  biography: string | null;
  statusId: string;
  status: OrganizationStatus | string; //NB;
  commentApproval: string | null;
  dateStatusModified: string | null;
  logoId: string | null;
  logoURL: string | null;
  ssoClientIdOutbound: string | null;
  ssoClientIdInbound: string | null;
  settings: SettingsInfo | null;
  zltoRewardPool: number | null;
  zltoRewardCumulative: number | null;
  zltoRewardBalance: number | null;
  yomaRewardPool: number | null;
  yomaRewardCumulative: number | null;
  yomaRewardBalance: number | null;
  dateCreated: string;
  createdByUserId: string;
  dateModified: string;
  modifiedByUserId: string;
  documents: OrganizationDocument[] | null;
  providerTypes: OrganizationProviderType[] | null;
  administrators: UserInfo[] | null;
}

export interface OrganizationDocument {
  fileId: string;
  type: string;
  contentType: string;
  originalFileName: string;
  url: string;
  dateCreated: string;
}

export enum OrganizationStatus {
  Inactive,
  Active,
  Declined,
  Deleted,
}

export interface OrganizationSearchFilter extends PaginationFilter {
  valueContains: string | null;
  statuses: OrganizationStatus[] | null | string[]; //NB: string[] is a workaround for the API
}

export enum Status {
  Active,
  Deleted,
  Expired,
  Inactive,
}

export interface OrganizationSearchResults {
  totalCount: number | null;
  items: OrganizationInfo[];
}

export interface OrganizationInfo {
  id: string;
  name: string;
  tagline: string | null;
  status: OrganizationStatus | string; //NB
  logoURL: string | null;
}

export interface OrganizationRequestUpdateStatus {
  status: OrganizationStatus;
  comment: string | null;
}

export interface UserInfo {
  id: string;
  username: string;
  email: string | null;
  firstName: string;
  surname: string;
  displayName: string | null;
  phoneNumber: string | null;
  countryId: string | null;
}
