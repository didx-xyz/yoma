import type { FormFile, Geometry, PaginationFilter } from "./common";
import type { VerificationType } from "./opportunity";

export interface MyOpportunityRequestVerify {
  certificate: FormFile | null;
  voiceNote: FormFile | null;
  picture: FormFile | null;
  geometry: Geometry | null;
  dateStart: string | null;
  dateEnd: string | null;
}

export enum VerificationStatus {
  Pending,
  Rejected,
  Completed,
}

export enum Action {
  Viewed,
  Saved,
  Verification,
}

export interface MyOpportunitySearchFilter
  extends MyOpportunitySearchFilterBase {}

export interface MyOpportunitySearchFilterBase extends PaginationFilter {
  action: Action;
  verificationStatuses: VerificationStatus[] | null;
}

export interface MyOpportunitySearchFilterAdmin
  extends MyOpportunitySearchFilterBase {
  userId: string | null;
  opportunity: string | null;
  organizations: string[] | null;
  valueContains: string | null;
}

export interface MyOpportunitySearchResults {
  totalCount: number | null;
  items: MyOpportunityInfo[];
}

export interface MyOpportunityInfo {
  id: string;
  userId: string;
  userEmail: string;
  userDisplayName: string | null;
  userCountry: string | null;
  userCountryOfResidence: string | null;
  userPhotoId: string | null;
  userPhotoURL: string | null;
  opportunityId: string;
  opportunityTitle: string;
  opportunityDescription: string;
  opportunityType: string;
  opportunityCommitmentIntervalDescription: string;
  opportunityParticipantCountTotal: number;
  opportunityDateStart: string;
  opportunityDateEnd: string | null;
  organizationId: string;
  organizationName: string;
  organizationLogoURL: string | null;
  actionId: string;
  action: Action;
  verificationStatusId: string | null;
  verificationStatus: VerificationStatus | null | string; //NB
  commentVerification: string | null;
  dateStart: string | null;
  dateEnd: string | null;
  dateCompleted: string | null;
  zltoReward: number | null;
  yomaReward: number | null;
  verifications: MyOpportunityInfoVerification[] | null;
  skills: Skill[] | null;
}

export interface Skill {
  id: string;
  name: string;
  infoURL: string | null;
}

export interface MyOpportunityInfoVerification {
  verificationType: VerificationType | string; //NB
  geometry: Geometry | null;
  fileId: string | null;
  fileURL: string | null;
}

export interface MyOpportunityRequestVerifyFinalize {
  opportunityId: string;
  userId: string;
  status: VerificationStatus;
  comment: string;
}
export interface MyOpportunityRequestVerifyFinalizeBatch {
  status: VerificationStatus;
  comment: string;
  items: MyOpportunityRequestVerifyFinalizeBatchItem[];
}

export interface MyOpportunityRequestVerifyFinalizeBatchItem {
  opportunityId: string;
  userId: string;
}

export interface MyOpportunityResponseVerify {
  status: VerificationStatus | string; //NB
  comment: string | null;
}

export interface MyOpportunitySearchCriteriaOpportunity {
  id: string;
  title: string;
}
