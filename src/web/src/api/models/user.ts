import type { SettingType } from "./common";

export interface User {
  id: string | null;
  email: string;
  emailConfirmed: boolean;
  firstName: string;
  surname: string;
  displayName: string | null;
  phoneNumber: string | null;
  phoneNumberConfirmed: boolean;
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

export interface UserRequestProfile extends UserRequestBase {
  updatePhoneNumber: boolean;
  resetPassword: boolean;
}

export interface UserRequestBase {
  email: string;
  firstName: string;
  surname: string;
  displayName: string | null;
  phoneNumber: string | null;
  countryId: string | null;
  educationId: string | null;
  genderId: string | null;
  dateOfBirth: string | null;
}

export interface UserProfile {
  id: string;
  email: string;
  emailConfirmed: boolean;
  firstName: string;
  surname: string;
  displayName: string | null;
  phoneNumber: string | null;
  phoneNumberConfirmed: boolean;
  countryId: string | null;
  educationId: string | null;
  genderId: string | null;
  dateOfBirth: string | null;
  photoId: string | null;
  photoURL: string | null;
  dateLastLogin: string | null;
  yoIDOnboarded: boolean | null;
  dateYoIDOnboarded: string | null;
  adminsOf: OrganizationInfo[];
  zlto: UserProfileZlto;
  opportunityCountSaved: number;
  opportunityCountPending: number;
  opportunityCountCompleted: number;
  opportunityCountRejected: number;
  settings?: SettingsInfo;
}

export interface UserProfileZlto {
  walletCreationStatus: WalletCreationStatus;
  available: number;
  pending: number;
  total: number;
  zltoOffline: boolean | null;
}

export interface SettingsInfo {
  items: SettingsInfoItem[];
}

export interface SettingsInfoItem {
  key: string;
  type: SettingType;
  value: any;
}

export enum WalletCreationStatus {
  Unscheduled,
  Pending,
  Created,
  Error,
}

export interface UserSkillInfo extends Skill {
  organizations: UserSkillOrganizationInfo[];
}

export interface Skill {
  id: string;
  name: string;
  infoURL: string | null;
}

export interface UserSkillOrganizationInfo {
  id: string;
  name: string;
  logoId: string | null;
  logoURL: string | null;
}

export interface OrganizationInfo {
  id: string;
  name: string;
  tagline: string | null;
  status: OrganizationStatus | string; //NB: string
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
