export interface OrganizationRequest {
  id: string | null;
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
  companyRegistrationDocumentId: string | null;
  companyRegistrationDocumentURL: string | null;
  dateCreated: string;
  dateModified: string;
  providerTypes: OrganizationProviderType[] | null;
}

export enum OrganizationStatus {
  Inactive,
  Active,
  Declined,
  Deleted,
}
