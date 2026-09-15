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
  zltoRewardPoolCurrentFinancialYear: number | null;
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
  zltoRewardPoolCurrentFinancialYear: number | null;
  zltoRewardCumulative: number | null;
  zltoRewardCumulativeCurrentFinancialYear: number | null;
  zltoRewardBalanceCurrentFinancialYear: number | null;
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
  statuses: OrganizationStatus[] | null | string[];
  organizations: string[] | null;
}

export enum Status {
  Active,
  Deleted,
  Expired,
  Inactive,
}

export interface OrganizationSearchResults {
  totalCount: number | null;
  /** `POST /organization/search` returns the admin variant — reward figures included. */
  items: OrganizationInfoAdmin[];
}

export interface OrganizationInfo {
  id: string;
  name: string;
  tagline: string | null;
  status: OrganizationStatus | string; //NB
  logoURL: string | null;
}

/**
 * The four ZLTO reward figures an organisation carries, on both `Organization` and
 * `OrganizationInfoAdmin`. Declared on its own so a component can accept either payload without
 * caring which one it got.
 *
 * ZLTO is the only reward asset — the Yoma reward capability was removed server-side
 * (API `f051dfd8`). Do not reintroduce a second asset here without an API contract for it.
 *
 * Pool / cumulative / balance suffixed `CurrentFinancialYear` reset when the financial year rolls
 * over; `…Cumulative` (no suffix) is the lifetime total and never resets. The balance is derived by
 * the server (`Organization.cs:83`) and is `null` when no pool is set — never computed here.
 */
export interface OrganizationRewardFigures {
  zltoRewardPoolCurrentFinancialYear: number | null;
  zltoRewardCumulativeCurrentFinancialYear: number | null;
  zltoRewardCumulative: number | null;
  zltoRewardBalanceCurrentFinancialYear: number | null;
}

/**
 * `OrganizationInfoAdmin` — `OrganizationInfo` plus the reward figures
 * (`OrganizationInfoAdmin.cs`). Returned by `POST /organization/search`
 * (`Role_Admin, Role_OrganizationAdmin`; org admins are scoped to their own organisations
 * server-side, `OrganizationService.cs:229-235`).
 */
export interface OrganizationInfoAdmin
  extends OrganizationInfo, OrganizationRewardFigures {}

/** The settable pool — everything else about rewards is derived and read-only. */
export interface OrganizationRewardPools {
  zltoRewardPoolCurrentFinancialYear: number | null;
}

export type OrganizationRewardPoolField = keyof OrganizationRewardPools;

/**
 * Validation limits, mirrored from `OrganizationRequestValidatorBase.cs:72-76`.
 *
 * NB: the cap is 10 million, not the Treasury's 100 million; never copy a limit across surfaces.
 */
export const ORGANIZATION_REWARD_LIMITS = {
  poolMax: 10_000_000,
} as const;

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
