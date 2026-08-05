import type { SettingType } from "./common";
import type { PayoutInfo } from "./payout";

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
  payout: UserProfilePayout;
  referral: UserProfileReferral | null;
  opportunityCountSaved: number;
  opportunityCountPending: number;
  opportunityCountCompleted: number;
  opportunityCountRejected: number;
  settings?: SettingsInfo;
}

export interface UserProfileReferral {
  blocked: boolean;
  blockedDate: string | null;
  roles: ReferralParticipationRole[] | string[] | null;
}

export enum ReferralParticipationRole {
  Referrer,
  Referee,
}

export interface ReferralLinkUsageItem {
  id: string;
  status: ReferralLinkUsageStatus | string;
  programId: string;
  programName: string;
  dateClaimed: string;
}

export enum ReferralLinkUsageStatus {
  Pending,
  Completed,
  Expired,
}

export interface UserProfileZlto {
  walletCreationStatus: WalletCreationStatus;
  /**
   * What the youth can spend right now. The reward provider removes reserved payout amounts from
   * this figure the moment a payout is reserved, so it drops as soon as a payout is in flight.
   */
  available: number;
  /**
   * Rewards earned but not yet pushed to the reward provider — awaiting the background service.
   * Counts opportunity and referral rewards only; payout-sourced transactions are excluded
   * (`RewardService.QueryPendingTransactionSchedule`).
   *
   * ⚠️ Was `pending` until the payout refactor (API commit e5209d6c renamed
   * `UserProfileZlto.Pending`). Same value, new name.
   */
  pendingAwards: number;
  /**
   * ZLTO the reward provider has reserved for an in-flight payout. Already deducted from
   * `available`, and **not** deducted again from `total` — so a youth mid-payout can show
   * `available: 0`, `total: 0` and a non-zero figure here. Treat it as real, committed ZLTO.
   */
  pendingPayout: number;
  /** `available + pendingAwards`, server-derived. Excludes `pendingPayout` — see above. */
  total: number;
  /** true when the reward provider could not be reached, so `available` and `total` are unreliable */
  zltoOffline: boolean | null;
}

/** Whether the youth has a payout in flight, and what it is. */
export interface UserProfilePayout {
  /** true while a payout is active (not yet completed, failed, cancelled or expired) */
  pending: boolean;
  /** the active payout; null when `pending` is false */
  info: PayoutInfo | null;
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
