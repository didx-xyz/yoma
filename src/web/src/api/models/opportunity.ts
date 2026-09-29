import type {
  EngagementTypeOption,
  PaginationFilter,
  TimeIntervalOption,
} from "./common";
import type {
  Accessibility,
  Country,
  Language,
  Skill,
  SustainableDevelopmentGoal,
  TargetedGroup,
} from "./lookups";

/**
 * An opportunity's country with its optional place — one per country (API 2026-09-28).
 * `id` is the COUNTRY lookup id (map it to `countryId` when editing), not the mapping id.
 */
export interface OpportunityCountryInfo extends Country {
  region: string | null;
  city: string | null;
  /** City centre as `[longitude, latitude]` — see `~/api/models/location` for conversions. */
  coordinates: number[] | null;
}

/** One country on an opportunity create / update (or `PATCH /opportunity/{id}/assign/countries`). */
export interface OpportunityRequestCountry {
  countryId: string;
  region: string | null;
  city: string | null;
  /** `[longitude, latitude]`; requires a city; never on Worldwide. */
  coordinates: number[] | null;
}

/**
 * One country entry in an opportunity search. Entries are alternatives (OR); region AND city
 * must match that same country's mapping, case-insensitive "contains", and an opportunity with
 * no region / city stays IN. Alternatively `coordinates` + `radiusKm` — never with region / city
 * — which EXCLUDES opportunities without coordinates. Duplicate countries are rejected.
 */
export interface OpportunitySearchFilterCountry {
  countryId: string;
  region?: string | null;
  city?: string | null;
  coordinates?: number[] | null;
  radiusKm?: number | null;
}

/** Enum names on the wire. Jobs never take `ZLTO`. */
export enum RewardType {
  None = "None",
  ZLTO = "ZLTO",
  PartnerIncentive = "PartnerIncentive",
}

export const REWARD_TYPE_LABELS: Record<RewardType, string> = {
  [RewardType.None]: "None",
  [RewardType.ZLTO]: "ZLTO",
  [RewardType.PartnerIncentive]: "Partner incentive",
};

/** Enum names on the wire. `Yes` needs at least one accommodation; `No` / null carry none. */
export enum AccessibilitySupport {
  Yes = "Yes",
  No = "No",
  AvailableOnRequest = "AvailableOnRequest",
}

export const ACCESSIBILITY_SUPPORT_LABELS: Record<
  AccessibilitySupport,
  string
> = {
  [AccessibilitySupport.Yes]: "Yes",
  [AccessibilitySupport.No]: "No",
  [AccessibilitySupport.AvailableOnRequest]: "Available on request",
};

/**
 * Core opportunity metadata added 2026-09-28 (Provider through SDGs). Core fields — not custom
 * fields — shared by the read models; writes send the three collections as id arrays instead.
 */
export interface OpportunityCoreMetadata {
  /** Informational text (e.g. "KFC"), not the owning organisation. */
  provider: string | null;
  /** Null = unspecified (imports / partners) — never read it as "unpaid". */
  incentivized: boolean | null;
  rewardType: RewardType | string;
  partnerIncentiveAmount: number | null;
  /** ISO 4217 code. */
  partnerIncentiveCurrency: string | null;
  accessibilitySupport: AccessibilitySupport | string | null;
  accommodationOtherDescription: string | null;
  ageFrom: number | null;
  ageTo: number | null;
  accommodations: Accessibility[] | null;
  targetedGroups: TargetedGroup[] | null;
  sustainableDevelopmentGoals: SustainableDevelopmentGoal[] | null;
}

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

export interface Opportunity extends OpportunityCoreMetadata {
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
  verificationEnabled: boolean;
  verificationMethod: VerificationMethod | null;
  commitmentIntervalId: string | null;
  commitmentInterval: string | null;
  commitmentIntervalCount: number | null;
  commitmentIntervalTotalHours: number | null;
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
  countries: OpportunityCountryInfo[] | null;
  languages: Language[] | null;
  skills: Skill[] | null;
  verificationTypes: OpportunityVerificationType[] | null;
  hidden: boolean;
  syncedInfo?: SyncInfoEntity | null;
  externalId: string | null;
  customFields?: CustomFieldValueItem[] | null;
}

export interface OpportunityInfo extends OpportunityCoreMetadata {
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
  verificationEnabled: boolean;
  verificationMethod: VerificationMethod | null | string; // NB: string
  commitmentInterval: TimeIntervalOption | null | string; // NB: string
  commitmentIntervalCount: number | null;
  commitmentIntervalTotalHours: number | null;
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
  countries: OpportunityCountryInfo[] | null;
  languages: Language[] | null;
  skills: Skill[] | null;
  verificationTypes: OpportunityVerificationType[] | null;
  externalId: string | null;
  customFields?: CustomFieldValueItem[] | null;
}

export interface OpportunitySearchFilter extends OpportunitySearchFilterBase {
  /**
   * Count only (API 2026-09-29): the same predicates, `totalCount` back and NO `items`;
   * pagination is optional. Public search only — the admin search has no such flag.
   */
  totalCountOnly?: boolean;
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
  /**
   * Country ids. The API takes `OpportunitySearchFilterCountry[]`; the search services wrap each
   * id as `{ countryId }` (`toSearchFilterPayload`), so callers keep passing ids.
   */
  countries: string[] | null;
  /**
   * Web-only: country entries with a region / city or a point + radius. When set it REPLACES
   * `countries` on the wire; it is never sent as its own property.
   */
  countryLocations?: OpportunitySearchFilterCountry[] | null;
  organizations: string[] | null;
  engagementTypes: string[] | null;
  featured: boolean | null;
  valueContains: string | null;
  customFields?: CustomFieldFilter[] | null;
  /** Case-insensitive contains on the Provider text; opportunities with no provider stay in. */
  provider?: string | null;
  /** Exact true / false, plus opportunities that have not said. */
  incentivized?: boolean | null;
  /** ANY of these. `None` is an explicit classification, not "unspecified". */
  rewardTypes?: RewardType[] | null;
  /** This status, plus opportunities that have not said. */
  accessibilitySupport?: AccessibilitySupport | null;
  /** Requires the Other accommodation in `accommodations`. */
  accommodationOtherDescription?: string | null;
  /** ALL of these must be listed — opportunities that list none are EXCLUDED. */
  accommodations?: string[] | null;
  /** ANY of these, or no targeting specified. */
  targetedGroups?: string[] | null;
  /** ANY of these, or no goals specified. */
  sustainableDevelopmentGoals?: string[] | null;
  /** Whole years, within both inclusive bounds; an unset bound is unrestricted. */
  age?: number | null;
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
  zltoRewardPool: number | null;
  verificationEnabled: boolean | null;
  verificationMethod: VerificationMethod | null | string;
  commitmentIntervalId: string | null;
  commitmentIntervalCount: number | null;
  participantLimit: number | null;
  keywords: string[] | null;
  dateStart: string | null;
  dateEnd: string | null;
  credentialIssuanceEnabled: boolean;
  ssiSchemaName: string | null;
  engagementTypeId: string | null;
  provider: string | null;
  /** Required (true / false) on manual capture. */
  incentivized: boolean | null;
  rewardType: RewardType;
  partnerIncentiveAmount: number | null;
  /** ISO 4217 `code` — not the lookup id. */
  partnerIncentiveCurrency: string | null;
  accessibilitySupport: AccessibilitySupport | null;
  accommodationOtherDescription: string | null;
  ageFrom: number | null;
  ageTo: number | null;
  accommodations: string[] | null;
  targetedGroups: string[] | null;
  sustainableDevelopmentGoals: string[] | null;
  categories: string[];
  /** Full update REPLACES the selection — resubmit loaded places for untouched countries. */
  countries: OpportunityRequestCountry[];
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

export interface OpportunityType {
  id: string;
  /** Stable identifier. Credential schema type contexts resolve against this, never displayName. */
  name: string;
  displayName: string;
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
  /** Date only, `yyyy-MM-dd` on the wire — never converted to UTC (API 2026-09-29). */
  Date = "Date",
  DateTime = "DateTime",
  Option = "Option",
}

// Existing Yoma lookup used to supply/validate Option values. When set, values
// are the lookup record IDs (GUIDs). Null = use the definition's inline options.
export enum CustomFieldLookupType {
  Country = "Country",
  Language = "Language",
  Skill = "Skill",
  /** `GET /lookup/education` — display `name`, submit `id`. */
  Education = "Education",
  /** `GET /lookup/currency` — display the code / name, submit `id` (never the code). */
  Currency = "Currency",
}

// Valid filter operators per data type (mirrors server-side validation):
//   String  → Equals | Contains | AnyOf | Exists
//   Integer/Decimal/Date/DateTime → Equals | AnyOf | Exists | GreaterThan | GreaterThanOrEqual | LessThan | LessThanOrEqual | Between
//   Boolean → Equals | AnyOf | Exists
//   Option  → Equals | AnyOf | AllOf | Exists
export enum CustomFieldFilterOperator {
  Equals = "Equals",
  Contains = "Contains",
  AnyOf = "AnyOf",
  AllOf = "AllOf",
  Exists = "Exists",
  GreaterThan = "GreaterThan",
  GreaterThanOrEqual = "GreaterThanOrEqual",
  LessThan = "LessThan",
  LessThanOrEqual = "LessThanOrEqual",
  Between = "Between",
}

/** One custom-field filter clause sent in OpportunitySearchFilter.customFields. */
export interface CustomFieldFilter {
  /** Matches CustomFieldDefinition.key (case-insensitive, server-side). */
  key: string;
  operator: CustomFieldFilterOperator;
  /** Single scalar value (Equals / Contains / GreaterThan* / LessThan* / lower bound of Between). */
  value?: string | null;
  /** Upper bound — used only with Between. */
  valueTo?: string | null;
  /** Multi-value operators: AnyOf / AllOf. */
  values?: string[] | null;
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
  /**
   * Option fields only. When set (Country/Language/Skill), the UI loads choices from the
   * lookup endpoints and submits lookup GUIDs. Null = use `options` (inline controlled options).
   */
  lookupType: CustomFieldLookupType | string | null;
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
