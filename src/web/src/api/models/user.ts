import type { SettingType } from "./common";
import type {
  PayoutCountryAvailability,
  PayoutCurrency,
  PayoutTransactionStatus,
} from "./payout";

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
 * Whether the youth may start a cash out, and what is already in flight.
 *
 * **Active payouts only.** When nothing is in flight, `status`, `amount`, `currency` and
 * `dateCreated` are null and `active`/`canResume` are false — a finished payout disappears from
 * here rather than lingering on every wallet view. The outcome of one is read on demand from
 * `GET /user/payout/latest` (`PayoutTransactionInfo`), inside the cash-out journey.
 *
 * ⚠️ Renamed and reshaped twice already: `{ pending, info }` → `{ countryAvailability, active,
 * amount, currency }` → the shape below (API 2026-09-10). Field drift here arrives as `undefined`
 * at runtime rather than failing to compile — see the epic's Cross-Area Notes.
 */
export interface UserProfilePayout {
  countryAvailability: PayoutCountryAvailability;
  /**
   * true while a non-terminal payout exists — server-derived from `status` being one of
   * `Initiated` / `Processing` / `ReconciliationRequired`. **One active payout per user**: block a
   * second Cash Out and offer the way back into this one instead.
   */
  active: boolean;
  /**
   * The active payout's status; null when none is active. ⚠️ `Processing` begins when the hosted
   * payout is created, **not** when the youth confirms it — keep the wording neutral.
   */
  status: PayoutTransactionStatus | null;
  /**
   * Whether a hosted session can be *requested*: active **and** the provider holds a reference.
   * `active && !canResume` is the setup/recovery window — reconciliation fills the reference in, so
   * that state is a wait with a retry, not a dead end. It is **not** a live availability guarantee,
   * and not proof that confirmation is still outstanding.
   */
  canResume: boolean;
  /**
   * The active payout's value **in `currency`** — `PayoutTransaction.Amount`, which is USD. It is
   * **not** the ZLTO reserved for it; that is `zlto.pendingPayout`. The separation is deliberate:
   * do not duplicate ZLTO accounting here or reconstruct it from this at today's rate.
   */
  amount: number | null;
  currency: PayoutCurrency | null;
  /** ISO 8601 — when the payout was **initiated**, for the "Started" label. Null when none. */
  dateCreated: string | null;
}

export interface SettingsInfo {
  items: SettingsInfoItem[];
}

export interface SettingsInfoItem {
  key: string;
  type: SettingType;
  value: any;
}

/**
 * ⚠️ **A string enum, because the API sends the enum _name_.** `Startup.cs` registers a strict
 * string enum converter with no naming strategy, so every enum on the wire is its PascalCase name —
 * confirmed in the Swagger schema (`"type": "string"`) and in how the rest of the app reads these
 * fields (`item.status === "Active"`).
 *
 * This was declared as a **numeric** enum with four members, and `WalletCreationStatus.Created`
 * was therefore `2`: `"Created" !== 2` is always true, so the Cash Out gate refused every youth
 * with "Your wallet is still being set up". It also omitted `PendingUsernameUpdate`, so even the
 * ordinals were wrong. Mirror `Yoma.Core.Domain.Reward.WalletCreationStatus` exactly.
 */
export enum WalletCreationStatus {
  Unscheduled = "Unscheduled",
  Pending = "Pending",
  PendingUsernameUpdate = "PendingUsernameUpdate",
  Created = "Created",
  Error = "Error",
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
