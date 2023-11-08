import type { PaginationFilter } from "./common";
import type { Country, Language, Skill } from "./lookups";

export interface OpportunitySearchFilterAdmin
  extends OpportunitySearchFilterBase {
  startDate: string | null;
  endDate: string | null;
  organizations: string[] | null;
  statuses: Status[] | null;
}

export interface OpportunitySearchResults extends OpportunitySearchResultsBase {
  items: OpportunityInfo[];
}

export interface OpportunitySearchResultsBase {
  totalCount: number | null;
}

export interface Opportunity {
  id: string;
  title: string;
  description: string;
  typeId: string;
  type: string;
  organizationId: string;
  organizationName: string;
  organizationLogoId: string | null;
  organizationLogoURL: string | null;
  organizationStatusId: string;
  organizationStatus: OrganizationStatus;
  summary: string | null;
  instructions: string | null;
  url: string | null;
  zltoReward: number | null;
  zltoRewardPool: number | null;
  zltoRewardCumulative: number | null;
  yomaReward: number | null;
  yomaRewardPool: number | null;
  yomaRewardCumulative: number | null;
  verificationEnabled: boolean;
  verificationMethod: VerificationMethod | null;
  difficultyId: string;
  difficulty: string;
  commitmentIntervalId: string;
  commitmentInterval: string;
  commitmentIntervalCount: number;
  commitmentIntervalDescription: string;
  participantLimit: number | null;
  participantCount: number | null;
  statusId: string;
  status: Status;
  keywords: string[] | null;
  dateStart: string;
  dateEnd: string | null;
  credentialIssuanceEnabled: boolean;
  ssiSchemaName: string | null;
  dateCreated: string;
  createdBy: string;
  dateModified: string;
  modifiedBy: string;
  published: boolean;
  categories: OpportunityCategory[] | null;
  countries: Country[] | null;
  languages: Language[] | null;
  skills: Skill[] | null;
  verificationTypes: OpportunityVerificationType[] | null;
}

export interface OpportunityInfo {
  id: string;
  title: string;
  description: string;
  type: string;
  organizationName: string;
  organizationLogoURL: string | null;
  instructions: string | null;
  url: string | null; //NB:
  zltoReward: number | null;
  yomaReward: number | null;
  difficulty: string;
  commitmentInterval: string;
  commitmentIntervalCount: number;
  commitmentIntervalDescription: string;
  participantLimit: number | null;
  participantCountVerificationCompleted: number;
  participantCountVerificationPending: number;
  participantCountTotal: number;
  keywords: string[] | null;
  dateStart: string;
  dateEnd: string | null;
  published: boolean;
  categories: OpportunityCategory[] | null;
  countries: Country[] | null;
  languages: Language[] | null;
  skills: Skill[] | null;
  verificationEnabled: boolean;
  verificationMethod: /*VerificationMethod*/ string | null; //ISSUE: comes back as string
  verificationTypes: OpportunityVerificationType[] | null;
}

export interface OpportunitySearchFilter extends OpportunitySearchFilterBase {
  includeExpired: boolean | null;
  mostViewed: boolean | null;
}

export interface OpportunitySearchFilterAdmin
  extends OpportunitySearchFilterBase {
  startDate: string | null;
  endDate: string | null;
  statuses: Status[] | null;
}

export interface OpportunitySearchFilterBase extends PaginationFilter {
  types: string[] | null;
  categories: string[] | null;
  languages: string[] | null;
  countries: string[] | null;
  organizations: string[] | null;
  commitmentIntervals: string[] | null;
  zltoRewardRanges: string[] | null;
  valueContains: string | null;
}

export interface OpportunitySearchResultsInfo
  extends OpportunitySearchResultsBase {
  items: OpportunityInfo[];
}

export interface OpportunitySearchResultsBase {
  totalCount: number | null;
}
export enum Status {
  Active,
  Deleted,
  Expired,
  Inactive,
}

export enum VerificationType {
  FileUpload,
  Picture,
  Location,
  VoiceNote,
}

export enum VerificationMethod {
  Manual,
  Automatic,
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

export interface OpportunityVerificationType {
  id: string;
  type?: VerificationType | string; //NB: hack comes back as string
  displayName: string;
  description: string;
}

export interface OpportunityRequestBase {
  id: string | null;
  title: string;
  description: string;
  typeId: string;
  organizationId: string;
  instructions: string | null;
  uRL: string | null;
  zltoReward: number | null;
  yomaReward: number | null;
  zltoRewardPool: number | null;
  yomaRewardPool: number | null;
  verificationEnabled: boolean | null;
  verificationMethod: VerificationMethod | null | string;
  difficultyId: string;
  commitmentIntervalId: string;
  commitmentIntervalCount: number | null;
  participantLimit: number | null;
  keywords: string[] | null;
  dateStart: string | null;
  dateEnd: string | null;
  credentialIssuanceEnabled: boolean;
  ssiSchemaName: string | null;
  categories: string[];
  countries: string[];
  languages: string[];
  skills: string[];
  verificationTypes: OpportunityVerificationType[] | null;
  postAsActive: boolean;
}

export interface OpportunityCategory {
  id: string;
  name: string;
  imageURL: string;
  count: number | null;
}

export interface OpportunityCountry {
  id: string;
  opportunityId: string;
  opportunityStatusId: string;
  organizationStatusId: string;
  countryId: string;
  dateCreated: string;
}

export interface OpportunityLanguage {
  id: string;
  opportunityId: string;
  opportunityStatusId: string;
  organizationStatusId: string;
  languageId: string;
  dateCreated: string;
}

export interface OpportunityDifficulty {
  id: string;
  name: string;
}

export interface OpportunityType {
  id: string;
  name: string;
}

export interface OpportunitySearchFilterCommitmentInterval {
  id: string;
  count: number;
}

export interface OpportunitySearchFilterZltoReward {
  from: number;
  to: number;
}

export interface OpportunitySearchCriteriaZltoReward {
  id: string;
  name: string;
}

export interface OpportunitySearchCriteriaCommitmentInterval {
  id: string;
  name: string;
}
