import { KeyValuePair } from "tailwindcss/types/config";
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
  items: Opportunity[];
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
  organization: string;
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
  commitmentIntervalCount: number | null;
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

export interface OpportunitySearchFilterBase extends PaginationFilter {
  types: string[] | null;
  categories: string[] | null;
  languages: string[] | null;
  countries: string[] | null;
  valueContains: string | null;
}

export interface OpportunityInfo {
  id: string;
  title: string;
  description: string;
  type: string;
  organization: string;
  instructions: string | null;
  uRL: string | null;
  zltoReward: number | null;
  yomaReward: number | null;
  difficulty: string;
  commitmentInterval: string;
  commitmentIntervalCount: number | null;
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
export interface OpportunityCategory {
  id: string;
  name: string;
}

export interface OpportunityVerificationType {
  id: string;
  type?: VerificationType;
  displayName: string;
  description: string;
}

// export interface OpportunityRequestBase {
//   id: string;
//   title: string;
//   description: string;
//   typeId: string;
//   organizationId: string;
//   instructions: string | null;
//   url: string | null;
//   zltoReward: number | null;
//   yomaReward: number | null;
//   zltoRewardPool: number | null;
//   yomaRewardPool: number | null;
//   sSIIntegrated: boolean;
//   difficultyId: string;
//   commitmentIntervalId: string;
//   commitmentIntervalCount: number | null;
//   participantLimit: number | null;
//   keywords: string[] | null;
//   dateStart: string | null;
//   dateEnd: string | null;
//   categories: string[];
//   countries: string[];
//   languages: string[];
//   skills: string[];
//   verificationEnabled: boolean;
//   verificationMethod: boolean;
//   verificationTypes: OpportunityVerificationType[] | null;
//   postAsActive: boolean;
// }

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
}
export interface OpportunityDifficulty {
  id: string;
  name: string;
}

export interface OpportunityType {
  id: string;
  name: string;
}
