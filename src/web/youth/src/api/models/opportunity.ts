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
  uRL: string | null;
  zltoReward: number | null;
  zltoRewardPool: number | null;
  zltoRewardCumulative: number | null;
  yomaReward: number | null;
  yomaRewardPool: number | null;
  yomaRewardCumulative: number | null;
  verificationSupported: boolean;
  sSIIntegrated: boolean;
  difficultyId: string;
  difficulty: string;
  commitmentIntervalId: string;
  commitmentInterval: string;
  commitmentIntervalCount: number | null;
  participantLimit: number | null;
  participantCount: number | null;
  statusId: string;
  status: Status;
  keywords: string | null;
  dateStart: string;
  dateEnd: string | null;
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
  type: VerificationType;
  displayName: string;
  description: string;
}
