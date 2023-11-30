import type { FormFile, PaginationFilter } from "./common";

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
  logo: FormFile | null;
  providerTypes: string[];
  registrationDocuments: FormFile[] | null;
  educationProviderDocuments: FormFile[] | null;
  businessDocuments: FormFile[] | null;
  addCurrentUserAsAdmin: boolean;
  adminEmails: string[];
  registrationDocumentsDelete: string[] | null;
  educationProviderDocumentsDelete: string[] | null;
  businessDocumentsDelete: string[] | null;
}

export interface OrganizationProviderType {
  id: string;
  name: string;
}

export interface Organization {
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
  country: string | null;
  streetAddress: string | null;
  province: string | null;
  postalCode: string | null;
  tagline: string | null;
  biography: string | null;
  statusId: string;
  status: OrganizationStatus;
  commentApproval: string | null;
  dateStatusModified: string | null;
  logoId: string | null;
  logoURL: string | null;
  dateCreated: string;
  dateModified: string;
  documents: OrganizationDocument[] | null;
  providerTypes: OrganizationProviderType[] | null;
  administrators: UserInfo[] | null;
}

export interface UserInfo {
  id: string;
  email: string;
  firstName: string;
  surname: string;
  displayName: string | null;
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
  statuses: Status[] | null;
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
  status: OrganizationStatus;
  logoURL: string | null;
}

export interface OrganizationRequestUpdateStatus {
  status: OrganizationStatus;
  comment: string | null;
}

export interface UserInfo {
  id: string;
  email: string;
  firstName: string;
  surname: string;
  displayName: string | null;
}
