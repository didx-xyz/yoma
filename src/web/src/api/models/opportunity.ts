import type { PaginationFilter } from "./common";
import type { Country, Language, Skill } from "./lookups";

export interface OpportunitySearchFilterAdmin
  extends OpportunitySearchFilterBase {
  startDate: string | null;
  endDate: string | null;
  statuses: Status[] | null | string[]; //NB
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
  zltoRewardBalance: number | null;
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
  featured: boolean | null;
  engagementTypeId: string | null;
  engagementType: string | null;
  shareWithPartners: boolean | null;
  dateCreated: string;
  createdByUserId: string;
  dateModified: string;
  modifiedByUserId: string;
  published: boolean;
  categories: OpportunityCategory[] | null;
  countries: Country[] | null;
  languages: Language[] | null;
  skills: Skill[] | null;
  verificationTypes: OpportunityVerificationType[] | null;
  hidden: boolean;
}

export interface OpportunityInfo {
  id: string;
  title: string;
  description: string;
  type: string;
  organizationId: string;
  organizationName: string;
  organizationLogoURL: string | null;
  summary: string | null;
  instructions: string | null;
  url: string | null;
  zltoReward: number | null;
  zltoRewardCumulative: number | null;
  yomaReward: number | null;
  yomaRewardCumulative: number | null;
  verificationEnabled: boolean;
  verificationMethod: VerificationMethod | null | string; //NB: comes back as string
  difficulty: string;
  commitmentInterval: string;
  commitmentIntervalCount: number;
  commitmentIntervalDescription: string;
  participantLimit: number | null;
  participantCountCompleted: number;
  participantCountPending: number;
  participantCountTotal: number;
  participantLimitReached: boolean;
  countViewed: number;
  countNavigatedExternalLink: number;
  statusId: string;
  status: Status | string; // HACK: string
  keywords: string[] | null;
  dateStart: string;
  dateEnd: string | null;
  featured: boolean;
  engagementType: string | null;
  published: boolean;
  yomaInfoURL: string;
  categories: OpportunityCategory[] | null;
  countries: Country[] | null;
  languages: Language[] | null;
  skills: Skill[] | null;
  verificationTypes: OpportunityVerificationType[] | null;
  hidden: boolean;
}

export interface OpportunitySearchFilter extends OpportunitySearchFilterBase {
  publishedStates: PublishedState[] | null | string[]; //NB
  commitmentInterval: OpportunitySearchFilterCommitmentInterval | null;
  zltoReward: OpportunitySearchFilterZltoReward | null;
  mostViewed: boolean | null;
  mostCompleted: boolean | null;
}

export interface OpportunitySearchFilterBase extends PaginationFilter {
  types: string[] | null;
  categories: string[] | null;
  languages: string[] | null;
  countries: string[] | null;
  organizations: string[] | null;
  engagementTypes: string[] | null;
  featured: boolean | null;
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
  Video,
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

export enum PublishedState {
  NotStarted,
  Active,
  Expired,
}

export interface OpportunityVerificationType {
  id: string;
  type?: VerificationType | string; //NB: hack comes back as string
  displayName: string;
  description: string;
}

export enum OpportunityFilterOptions {
  CATEGORIES = "categories",
  TYPES = "types",
  ENGAGEMENT_TYPES = "engagementTypes",
  COUNTRIES = "countries",
  LANGUAGES = "languages",
  COMMITMENTINTERVALS = "commitmentIntervals",
  ZLTOREWARDRANGES = "zltoRewardRanges",
  PUBLISHEDSTATES = "publishedStates",
  ORGANIZATIONS = "organizations",
  DATE_START = "dateStart",
  DATE_END = "dateEnd",
  STATUSES = "statuses",
  VIEWALLFILTERSBUTTON = "viewAllFiltersButton",
}

export interface OpportunityRequestBase {
  id: string | null;
  title: string;
  description: string;
  typeId: string;
  organizationId: string;
  summary: string | null;
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
  engagementTypeId: string | null;
  categories: string[];
  countries: string[];
  languages: string[];
  skills: string[];
  verificationTypes: OpportunityVerificationType[] | null;
  postAsActive: boolean;
  shareWithPartners: boolean;
  hidden: boolean | null;
}

export interface OpportunityRequestVerificationType {
  type: VerificationType;
  description: string | null;
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
  opportunityDateStart: string;
  organizationId: string;
  organizationStatusId: string;
  countryId: string;
  countryName: string;
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
  options: string[] | null;
  interval: OpportunitySearchFilterCommitmentIntervalItem | null;
}

export interface OpportunitySearchFilterCommitmentIntervalItem {
  id: string;
  count: number;
}

export interface OpportunitySearchFilterZltoReward {
  ranges: string[] | null;
  hasReward: boolean | null;
}

export interface OpportunitySearchFilterZltoRewardRange {
  from: number;
  to: number;
}

export interface OpportunitySearchCriteriaZltoRewardRange {
  id: string;
  name: string;
}

export interface OpportunitySearchCriteriaCommitmentIntervalOption {
  id: string;
  name: string;
}

export interface OpportunitySearchFilterCriteria extends PaginationFilter {
  organizations: string[] | null;
  titleContains: string | null;
  opportunities: string[] | null;
  countries: string[] | null;
  published: boolean | null;
  verificationEnabled: boolean | null;
  verificationMethod: VerificationMethod | null;
}
