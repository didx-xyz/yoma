import type { SettingType } from "./common";
import type { PayoutCountryAvailability, PayoutCurrency } from "./payout";

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

/**
 * The youth wallet ledger, in the fixed order it is rendered:
 * `balance` → −`pendingPayout` → `available` → +`pendingRewards` → `total`.
 *
 * **Nullability is the offline contract** (API `08cb6c10a`). The three provider-derived figures go
 * `null` together when the reward provider cannot be reached; the two Yoma-owned figures always
 * carry a value. Branch on `null`, not on `zltoOffline` — two signals for one state drift, and
 * `zltoOffline` survives only as the explanatory flag behind the notice. Neither arithmetic nor
 * truthiness is a safe test: `null + 5` is `5`, and `0` is a legitimate balance.
 */
export interface UserProfileZlto {
  walletCreationStatus: WalletCreationStatus;
  /**
   * Wallet balance before payout reservations are excluded. Server-derived as
   * `available + pendingPayout`, so the ledger always reconciles on screen even when `available`
   * is stale — a summing ledger is not a correctness signal.
   */
  balance: number | null;
  /**
   * ZLTO the reward provider has reserved for an in-flight payout, taken from **Yoma's own
   * record**, which is authoritative. Already deducted from `available`, and **not** deducted
   * again from `total` — so a youth mid-payout can show `available: 0`, `total: 0` and a non-zero
   * figure here. Treat it as real, committed ZLTO.
   *
   * The API returns this positive; the ledger renders it negative. The provider's own reserved
   * balance is a server-side cross-check only — the UI must never reconcile or surface a mismatch.
   */
  pendingPayout: number;
  /**
   * What the youth can spend right now. The reward provider removes reserved payout amounts from
   * this figure the moment a payout is reserved, so it **already excludes** `pendingPayout` —
   * never subtract it twice. This is the figure a payout amount is checked against.
   */
  available: number | null;
  /**
   * Rewards earned but not yet pushed to the reward provider — awaiting the background service.
   * Counts opportunity and referral rewards only; payout-sourced transactions are excluded
   * (`RewardService.QueryPendingTransactionSchedule`).
   *
   * ⚠️ Renamed twice: `pending` → `pendingAwards` (API `e5209d6c`) → `pendingRewards`
   * (API `08cb6c10a`). Same value throughout.
   */
  pendingRewards: number;
  /** `available + pendingRewards`, server-derived. Excludes `pendingPayout` — see above. */
  total: number | null;
  /**
   * true when the reward provider could not be reached. Explains *why* the three figures above are
   * `null`; it is not the test for whether they are.
   */
  zltoOffline: boolean | null;
}

/**
 * Whether the youth may start a cash out, and whether one is already in flight.
 *
 * ⚠️ Was `{ pending, info }`. The API replaced it with the shape below (`UserProfilePayout`):
 * `active` is derived server-side from `amount`, and the payout's value now sits directly on this
 * object rather than in a nested `info`. Old field names would have arrived as `undefined` at
 * runtime rather than failing to compile — see the epic's Cross-Area Notes.
 */
export interface UserProfilePayout {
  countryAvailability: PayoutCountryAvailability;
  /**
   * true while a non-terminal payout exists. **One active payout per user** — block a second Cash
   * Out and offer a way back into the hosted journey instead.
   */
  active: boolean;
  /**
   * The active payout's value **in `currency`** — `PayoutTransaction.Amount`, which is USD. It is
   * **not** the ZLTO that was reserved for it; that is `zlto.pendingPayout`. Null when none is
   * active, which is what `active` is derived from server-side.
   */
  amount: number | null;
  currency: PayoutCurrency | null;
  /**
   * ⚠️ There is **no payout status here**, so the UI cannot tell a payout waiting on the youth from
   * one being processed, and cannot report a terminal outcome at all. See YOM-1074's feature doc:
   * Flows C and D are built to what this object actually says.
   */
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
