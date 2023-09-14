export interface User {
  id: string | null;
  email: string;
  emailConfirmed: boolean;
  firstName: string;
  surname: string;
  displayName: string | null;
  phoneNumber: string | null;
  countryId: string | null;
  countryOfResidenceId: string | null;
  genderId: string | null;
  dateOfBirth: string | null;
  photoId: string | null;
  photoURL: string | null;
  dateLastLogin: string | null;
  externalId: string | null;
  zltoWalletId: string | null;
  zltoWalletCountryId: string | null;
  zltoWalletCountryCodeAlpha2: string | null;
  tenantId: string | null;
  dateCreated: string;
  dateModified: string;
}

export interface UserProfileRequest {
  email: string;
  firstName: string;
  surname: string;
  displayName: string | null;
  phoneNumber: string | null;
  countryId: string | null;
  countryOfResidenceId: string | null;
  genderId: string | null;
  dateOfBirth: string | null;
  resetPassword: boolean;
}

export interface UserProfile {
  id: string;
  email: string;
  emailConfirmed: boolean;
  firstName: string;
  surname: string;
  displayName: string | null;
  phoneNumber: string | null;
  countryId: string | null;
  countryOfResidenceId: string | null;
  genderId: string | null;
  dateOfBirth: string | null;
  photoId: string | null;
  photoURL: string | null;
  dateLastLogin: string | null;
  adminsOf: OrganizationInfo[];
  zltoBalance: number;
  opportunityCountSaved: number;
  opportunityCountPending: number;
  opportunityCountCompleted: number;
}

export interface OrganizationInfo {
  id: string;
  name: string;
  tagline: string | null;
  status: OrganizationStatus;
  logoURL: string | null;
}

export enum OrganizationStatus {
  Inactive,
  Active,
  Declined,
  Deleted,
}

export enum OrganizationDocumentType {
  Registration,
  EducationProvider,
  Business,
}

export enum OrganizationProviderType {
  Education,
  Marketplace,
}

export interface UserProfile {
  id: string;
  email: string;
  emailConfirmed: boolean;
  firstName: string;
  surname: string;
  displayName: string | null;
  phoneNumber: string | null;
  countryId: string | null;
  countryOfResidenceId: string | null;
  genderId: string | null;
  dateOfBirth: string | null;
  photoId: string | null;
  photoURL: string | null;
  dateLastLogin: string | null;
  skills: Skill[] | null;
  adminsOf: OrganizationInfo[];
  zltoBalance: number;
  opportunityCountSaved: number;
  opportunityCountPending: number;
  opportunityCountCompleted: number;
}

export interface Skill {
  id: string;
  name: string;
  infoURL: string | null;
}
