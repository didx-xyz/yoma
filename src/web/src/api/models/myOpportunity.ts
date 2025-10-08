import type {
  ErrorResponseItem,
  FormFile,
  Geometry,
  PaginationFilter,
} from "./common";
import type { VerificationType } from "./opportunity";

export interface MyOpportunityRequestVerify {
  certificate?: FormFile | null;
  certificateUploadId?: string | null;
  voiceNote?: FormFile | null;
  voiceNoteUploadId?: string | null;
  picture?: FormFile | null;
  pictureUploadId?: string | null;
  video?: FormFile | null;
  videoUploadId?: string | null;
  geometry: Geometry | null;
  dateStart: string | null;
  dateEnd: string | null;
  commitmentInterval: MyOpportunityRequestVerifyCommitmentInterval | null;
  recommendable: boolean | null;
  starRating: number | null;
  feedback: string | null;
}

export interface MyOpportunityRequestVerifyCommitmentInterval {
  id: string;
  count: number;
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
  username: string;
  userEmail: string | null;
  userPhoneNumer: string | null;
  userDisplayName: string;
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
  commitmentInterval: TimeIntervalOption | null | string; //NB: string
  commitmentIntervalCount: number | null;
  dateStart: string | null;
  dateEnd: string | null;
  dateCompleted: string | null;
  zltoReward: number | null;
  yomaReward: number | null;
  recommendable: boolean | null;
  starRating: number | null;
  feedback: string | null;
  dateModified: string;
  verifications: MyOpportunityInfoVerification[] | null;
  skills: Skill[] | null;
}

export enum TimeIntervalOption {
  Minute,
  Hour,
  Day,
  Week,
  Month,
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

export interface MyOpportunityRequestVerifyImportCsv {
  file: FormFile;
  organizationId: string;
  comment: string | null;
  validateOnly?: boolean | null;
}

export interface MyOpportunitySearchFilterVerificationFiles {
  opportunity: string;
  verificationTypes: VerificationType[] | null;
}
