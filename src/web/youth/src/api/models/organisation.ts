export interface OrganizationCreateRequest {
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
  providerTypes: string[];
  logo: FormFile | null;
  addCurrentUserAsAdmin: boolean;
  adminAdditionalEmails: string[] | null;
  registrationDocuments: FormFile[];
  educationProviderDocuments: FormFile[] | null;
  businessDocuments: FormFile[] | null;
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
  streetAddress: string | null;
  province: string | null;
  postalCode: string | null;
  tagline: string | null;
  biography: string | null;
  statusId: string;
  status: OrganizationStatus;
  dateStatusModified: string;
  logoId: string | null;
  logoURL: string | null;
  documents: OrganizationDocument[] | null;
  dateCreated: string;
  dateModified: string;
  providerTypes: OrganizationProviderType[] | null;
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
export interface FormFile {
  contentType: string;
  contentDisposition: string;
  headers: [];
  length: number;
  name: string;
  fileName: string;
}
