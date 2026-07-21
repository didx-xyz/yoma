import type {
  EngagementTypeOption,
  PaginationFilter,
  TimeIntervalOption,
} from "./common";
import type { Country, Language, Skill } from "./lookups";

export interface OpportunitySearchFilterAdmin extends OpportunitySearchFilterBase {
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
  organizationZltoRewardPoolCurrentFinancialYear?: number | null;
  organizationZltoRewardCumulativeCurrentFinancialYear?: number | null;
  organizationZltoRewardBalanceCurrentFinancialYear?: number | null;
  yomaReward: number | null;
  yomaRewardPool: number | null;
  yomaRewardCumulative: number | null;
  organizationYomaRewardPoolCurrentFinancialYear?: number | null;
  organizationYomaRewardCumulativeCurrentFinancialYear?: number | null;
  organizationYomaRewardBalanceCurrentFinancialYear?: number | null;
  verificationEnabled: boolean;
  verificationMethod: VerificationMethod | null;
  difficultyId: string | null;
  difficulty: string | null;
  commitmentIntervalId: string | null;
  commitmentInterval: string | null;
  commitmentIntervalCount: number | null;
  commitmentIntervalDescription: string | null;
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
  isCompletable: boolean;
  nonCompletableReason: string | null;
  categories: OpportunityCategory[] | null;
  countries: Country[] | null;
  languages: Language[] | null;
  skills: Skill[] | null;
  verificationTypes: OpportunityVerificationType[] | null;
  hidden: boolean;
  syncedInfo?: SyncInfoEntity | null;
  externalId: string | null;
  customFields?: CustomFieldValueItem[] | null;
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
  zltoRewardEstimate: number | null;
  zltoRewardCumulative: number | null;
  yomaReward: number | null;
  yomaRewardEstimate: number | null;
  yomaRewardCumulative: number | null;
  verificationEnabled: boolean;
  verificationMethod: VerificationMethod | null | string; // NB: string
  difficulty: string | null;
  commitmentInterval: TimeIntervalOption | null | string; // NB: string
  commitmentIntervalCount: number | null;
  commitmentIntervalDescription: string | null;
  participantLimit: number | null;
  participantCountCompleted: number;
  participantCountPending: number;
  participantCountTotal: number;
  participantLimitReached: boolean;
  countViewed: number;
  countNavigatedExternalLink: number;
  statusId: string;
  status: Status | string; // NB: string
  keywords: string[] | null;
  dateStart: string;
  dateEnd: string | null;
  featured: boolean;
  engagementType: EngagementTypeOption | null | string; // NB: string
  shareWithPartners: boolean;
  hidden: boolean;
  published: boolean;
  yomaInfoURL: string;
  isCompletable: boolean;
  nonCompletableReason: string | null;
  syncedInfo: SyncInfoEntity | null;
  categories: OpportunityCategory[] | null;
  countries: Country[] | null;
  languages: Language[] | null;
  skills: Skill[] | null;
  verificationTypes: OpportunityVerificationType[] | null;
  externalId: string | null;
  customFields?: CustomFieldValueItem[] | null;
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

export interface OpportunitySearchResultsInfo extends OpportunitySearchResultsBase {
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

export interface SyncInfoEntity {
  syncType: SyncType | string; // NB: string
  partners: SyncInfoEntityPartner[];
  locked: boolean;
}
export interface SyncInfoEntityPartner {
  partner: SyncPartner | string; // NB: string
  externalId: string | null;
  url: string | null;
}
export enum SyncType {
  Push,
  Pull,
}
export enum SyncPartner {
  SAYouth,
  Jobberman,
  Alison,
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
  difficultyId: string | null;
  commitmentIntervalId: string | null;
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
  externalId: string | null;
  // Definition-driven custom fields. Replacement semantics on the API:
  // the full collection must be resubmitted on every save (omitted keys are cleared).
  customFields?: CustomFieldValueRequest[] | null;
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
  types: string[] | null;
  organizations: string[] | null;
  titleContains: string | null;
  opportunities: string[] | null;
  countries: string[] | null;
  published: boolean | null;
  verificationEnabled: boolean | null;
  verificationMethod: VerificationMethod | null;
  onlyCompletable: boolean;
}

export interface CSVImportResult {
  imported: boolean;
  headerErrors: boolean;
  recordsTotal: number;
  recordsSucceeded: number;
  recordsFailed: number;
  errors: CSVImportErrorRow[] | null;
}

export interface CSVImportErrorRow {
  number: number | null;
  alias: string;
  items: CSVImportErrorItem[];
}

export interface CSVImportErrorItem {
  type: CSVImportErrorType | string; //NB: string for compatibility
  typeDescription: string;
  message: string;
  field: string | null;
  value: string | null;
}

export enum CSVImportErrorType {
  HeaderMissing,
  HeaderColumnMissing,
  HeaderUnexpectedColumn,
  HeaderDuplicateColumn,
  RequiredFieldMissing,
  InvalidFieldValue,
  ProcessingError,
}

export interface OpportunityItem {
  id: string;
  title: string;
  organizationName: string;
  organizationLogoURL: string | null;
}

//#region Custom Fields (YOM-1244 / YOM-1255)
// Definition-driven custom fields. The UI must render, validate and submit
// purely from these definitions — no hardcoded field keys or types.
// Mirrors the API domain model returned by GET /opportunity/custom/field/definition
// (Yoma.Core.Domain.Core.Models.CustomFieldDefinition).
export enum CustomFieldDataType {
  String = "String",
  Integer = "Integer",
  Decimal = "Decimal",
  Boolean = "Boolean",
  DateTime = "DateTime",
  Option = "Option",
}

export interface CustomFieldOption {
  id: string;
  customFieldDefinitionId: string;
  key: string;
  name: string;
  sortOrder: number;
  isActive: boolean;
  dateCreated: string;
  dateModified: string;
}

export interface CustomFieldDefinition {
  id: string;
  /** Opportunity | MyOpportunity */
  entityType: string;
  /** Optional fall-through context (Opportunity type name). Null applies to all types. */
  entityContext: string | null;
  /** Stable technical key used to join definitions with values. */
  key: string;
  title: string;
  description: string | null;
  /** Primary UI grouping (wizard step / grouped section). */
  group: string;
  /** Optional secondary grouping within the primary group. */
  subGroup: string | null;
  dataType: CustomFieldDataType | string; // NB: string from API
  defaultValue: string | null;
  validationRegex: string | null;
  validationErrorMessage: string | null;
  isRequired: boolean;
  /** Applies to Option fields only; null for non-option fields. */
  supportsMultiple: boolean | null;
  sortOrder: number;
  isActive: boolean;
  isSystem: boolean;
  dateCreated: string;
  dateModified: string;
  options: CustomFieldOption[] | null;
}

// Submitted on opportunity create/update. Non-option fields use `value`;
// all Option fields (single- and multi-select) use `values`.
export interface CustomFieldValueRequest {
  key: string;
  value?: string | null;
  values?: string[] | null;
}

// Hydrated value returned on opportunity/completion projections.
export interface CustomFieldValueItem {
  key: string;
  value?: string | null;
  values?: string[] | null;
}
//#endregion Custom Fields
