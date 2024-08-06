import type {
  ErrorResponseItem,
  FormFile,
  Geometry,
  PaginationFilter,
} from "./common";
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
  None,
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
  verificationStatuses: VerificationStatus[] | null | string[]; //NB: string
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
  userEducation: string | null;
  userPhotoId: string | null;
  userPhotoURL: string | null;
  opportunityId: string;
  opportunityTitle: string;
  opportunityDescription: string;
  opportunitySummary: string | null;
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
  verificationStatus: VerificationStatus | null | string; //NB: string
  commentVerification: string | null;
  dateStart: string | null;
  dateEnd: string | null;
  dateCompleted: string | null;
  zltoReward: number | null;
  yomaReward: number | null;
  dateModified: string;
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

export interface MyOpportunityResponseVerifyFinalizeBatch {
  items: MyOpportunityResponseVerifyFinalizeBatchItem[];
  status: VerificationStatus | string;
}

export interface MyOpportunityResponseVerifyFinalizeBatchItem {
  opportunityId: string;
  opportunityTitle: string;
  userId: string;
  userDisplayName: string | null;
  success: boolean;
  failure: ErrorResponseItem | null;
}

export interface MyOpportunityResponseVerify {
  status: VerificationStatus | string; //NB
  comment: string | null;
}

export interface MyOpportunitySearchCriteriaOpportunity {
  id: string;
  title: string;
}
