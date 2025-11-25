import { PaginationFilter } from "./common";
import { OpportunityItem } from "./marketplace";

// Enums
export enum ProgramStatus {
  Active,
  Inactive,
  Expired,
  LimitReached,
  UnCompletable,
  Deleted,
}

export enum PathwayCompletionRule {
  All = "All",
  Any = "Any",
}

export enum PathwayOrderMode {
  Sequential = "Sequential",
  AnyOrder = "AnyOrder",
}

export enum PathwayTaskEntityType {
  Opportunity = "Opportunity",
}

// Legacy aliases for backward compatibility
export const PathwayStepRule = PathwayCompletionRule;
export type PathwayStepRule = PathwayCompletionRule;

export const CompletionOrder = PathwayOrderMode;
export type CompletionOrder = PathwayOrderMode;

export enum ProofOfPersonhoodMethod {
  OTP = "OTP",
  SocialLogin = "SocialLogin",
}

export enum ReferralLinkStatus {
  Active = "Active",
  Cancelled = "Cancelled",
  LimitReached = "LimitReached",
  Expired = "Expired",
}

export enum ReferralLinkUsageStatus {
  Pending = "Pending",
  Completed = "Completed",
  Expired = "Expired",
}

export enum ReferralParticipationRole {
  Referrer = 0,
  Referee = 1,
}

// Lookups
export interface ProgramStatusLookup {
  id: string;
  name: string;
}

// Models
export interface Program {
  id: string;
  name: string;
  description: string | null;
  imageId: string | null;
  imageURL: string | null;
  completionWindowInDays: number | null;
  completionLimitReferee: number | null;
  completionLimit: number | null;
  completionTotal: number | null;
  completionBalance: number | null;
  zltoRewardReferrer: number | null;
  zltoRewardReferee: number | null;
  zltoRewardPool: number | null;
  zltoRewardCumulative: number | null;
  zltoRewardBalance: number | null;
  proofOfPersonhoodRequired: boolean;
  pathwayRequired: boolean;
  multipleLinksAllowed: boolean;
  statusId: string;
  status: ProgramStatus | string;
  isDefault: boolean;
  dateStart: string;
  dateEnd: string | null;
  dateCreated: string;
  createdByUserId: string;
  dateModified: string;
  modifiedByUserId: string;
  pathway: ProgramPathway | null;
}

export interface ProgramInfo {
  id: string;
  name: string;
  description: string | null;
  imageURL: string | null;
  completionWindowInDays: number | null;
  completionLimitReferee: number | null;
  completionLimit: number | null;
  completionTotal: number | null;
  completionBalance: number | null;
  zltoRewardReferrer: number | null;
  zltoRewardReferee: number | null;
  zltoRewardCumulative: number | null;
  proofOfPersonhoodRequired: boolean;
  pathwayRequired: boolean;
  status: ProgramStatus | string;
  isDefault: boolean;
  dateStart: string;
  dateEnd: string | null;
  pathway: ProgramPathwayInfo | null;
}

export interface ProgramItem {
  id: string;
  name: string;
  description: string | null;
  imageURL: string | null;
  completionLimit: number | null;
  completionTotal: number | null;
  completionBalance: number | null;
  zltoRewardPool: number | null;
  zltoRewardCumulative: number | null;
  zltoRewardBalance: number | null;
  proofOfPersonhoodRequired: boolean;
  pathwayRequired: boolean;
  status: ProgramStatus | string;
  isDefault: boolean;
  dateStart: string;
  dateEnd: string | null;
}

export interface ProgramPathway {
  id: string;
  programId: string;
  name: string;
  description: string | null;
  rule: PathwayCompletionRule | string;
  orderMode: PathwayOrderMode | string;
  dateCreated: string;
  dateModified: string;
  steps: ProgramPathwayStep[] | null;
  isCompletable: boolean;
}

export interface ProgramPathwayInfo {
  id: string;
  name: string;
  description: string | null;
  rule: PathwayCompletionRule | string;
  orderMode: PathwayOrderMode | string;
  steps: ProgramPathwayStepInfo[] | null;
  isCompletable: boolean;
}

export interface ProgramPathwayStep {
  id: string;
  pathwayId: string;
  name: string;
  description: string | null;
  rule: PathwayCompletionRule | string;
  orderMode: PathwayOrderMode | string;
  order: number | null;
  orderDisplay: number;
  tasks: ProgramPathwayTask[] | null;
  dateCreated: string;
  dateModified: string;
}

export interface ProgramPathwayStepInfo {
  id: string;
  name: string;
  description: string | null;
  rule: PathwayCompletionRule | string;
  orderMode: PathwayOrderMode | string;
  order: number | null;
  orderDisplay: number;
  tasks: ProgramPathwayTaskInfo[] | null;
  completed: boolean | null;
  isCompletable: boolean;
}

export interface ProgramPathwayTask {
  id: string;
  stepId: string;
  entityType: PathwayTaskEntityType | string;
  opportunity: OpportunityItem | null;
  order: number | null;
  orderDisplay: number;
  dateCreated: string;
  dateModified: string;
}

export interface ProgramPathwayTaskInfo {
  id: string;
  entityType: PathwayTaskEntityType | string;
  opportunity: OpportunityItem | null;
  order: number | null;
  orderDisplay: number;
  completed: boolean | null;
  isCompletable: boolean;
  nonCompletableReason: string | null;
}

// Request Models
export interface ProgramRequestBase {
  name: string;
  description: string | null;
  image: File | null;
  completionWindowInDays: number | null;
  completionLimitReferee: number | null;
  completionLimit: number | null;
  zltoRewardReferrer: number | null;
  zltoRewardReferee: number | null;
  zltoRewardPool: number | null;
  proofOfPersonhoodRequired: boolean;
  pathwayRequired: boolean;
  multipleLinksAllowed: boolean;
  isDefault: boolean;
  dateStart: string;
  dateEnd: string | null;
  pathway: ProgramPathwayRequestUpsert | null;
}

export interface ProgramRequestCreate extends ProgramRequestBase {}

export interface ProgramRequestUpdate extends ProgramRequestBase {
  id: string;
}

export interface ProgramPathwayRequestUpsert {
  id?: string | null;
  name: string;
  description: string | null;
  rule?: PathwayCompletionRule | string;
  orderMode?: PathwayOrderMode | string | null;
  steps: ProgramPathwayStepRequestUpsert[];
}

export interface ProgramPathwayStepRequestUpsert {
  id?: string | null;
  name: string;
  description: string | null;
  rule: PathwayCompletionRule | string;
  orderMode?: PathwayOrderMode | string | null;
  tasks: ProgramPathwayTaskRequestUpsert[];
}

export interface ProgramPathwayTaskRequestUpsert {
  id?: string | null;
  entityType: PathwayTaskEntityType;
  entityId: string;
}

// Search Models
export interface ProgramSearchFilterBase extends PaginationFilter {
  valueContains: string | null;
}

export interface ProgramSearchFilter extends ProgramSearchFilterBase {
  includeExpired?: boolean | null;
}

export interface ProgramSearchFilterAdmin extends ProgramSearchFilterBase {
  statuses: ProgramStatus[] | null | string[];
  dateStart: string | null;
  dateEnd: string | null;
}

export interface ProgramSearchResults {
  items: Program[];
  totalCount: number;
}

export interface ProgramSearchResultsInfo {
  items: ProgramInfo[];
  totalCount: number;
}

// Link Models
export interface Link {
  id: string;
  name: string;
  description: string | null;
  programId: string;
  userId: string;
  statusId: string;
  status: ReferralLinkStatus;
  uRL: string;
  shortURL: string;
  completionTotal: number | null;
  dateCreated: string;
  dateModified: string;
}

export interface LinkUsage {
  id: string;
  programId: string;
  linkId: string;
  userId: string;
  statusId: string;
  status: ReferralLinkUsageStatus;
  dateCreated: string;
  dateModified: string;
}

// Referral Link Models
export interface ReferralLink {
  id: string;
  name: string;
  description: string | null;
  programId: string;
  programName: string;
  programCompletionLimitReferee: number | null;
  userId: string;
  userDisplayName: string | null;
  userEmail: string | null;
  userPhoneNumber: string | null;
  blocked: boolean;
  blockedDate: string | null;
  statusId: string;
  status: ReferralLinkStatus;
  url: string;
  shortURL: string;
  qrCodeBase64: string | null;
  completionTotal: number | null;
  completionBalance: number | null;
  pendingTotal: number | null;
  expiredTotal: number | null;
  zltoRewardCumulative: number | null;
  dateCreated: string;
  dateModified: string;
}

export interface ReferralLinkUsageCount {
  statusId: string;
  count: number;
}

export interface ReferralLinkRequestBase {
  name: string;
  description: string | null;
  includeQRCode?: boolean | null;
}

export interface ReferralLinkRequestCreate extends ReferralLinkRequestBase {
  programId: string;
}

export interface ReferralLinkRequestUpdate extends ReferralLinkRequestBase {
  id: string;
}

export interface AdminReferralLinkSearchFilter extends PaginationFilter {
  programId: string | null;
  valueContains: string | null;
  statuses: ReferralLinkStatus[] | null;
}

export interface ReferralLinkSearchFilterAdmin
  extends AdminReferralLinkSearchFilter {
  userId: string | null;
}

export interface ReferralLinkSearchResults {
  totalCount: number | null;
  items: ReferralLink[];
}

export interface ReferralLinkUsage {
  id: string;
  programId: string;
  programName: string;
  programDescription: string | null;
  programCompletionWindowInDays: number | null;
  linkId: string;
  linkName: string;
  userIdReferrer: string;
  usernameReferrer: string;
  userDisplayNameReferrer: string;
  userEmailReferrer: string | null;
  userEmailConfirmedReferrer: boolean | null;
  userPhoneNumberReferrer: string | null;
  userPhoneNumberConfirmedReferrer: boolean | null;
  userId: string;
  username: string;
  userDisplayName: string;
  userEmail: string | null;
  userEmailConfirmed: boolean | null;
  userPhoneNumber: string | null;
  userPhoneNumberConfirmed: boolean | null;
  userYoIDOnboarded: boolean | null;
  statusId: string;
  status: ReferralLinkUsageStatus | string;
  zltoRewardReferrer: number | null;
  zltoRewardReferee: number | null;
  dateClaimed: string;
  dateCompleted: string | null;
  dateExpired: string | null;
  dateCreated: string;
  dateModified: string;
}

// Link Usage Models
export interface AdminReferralLinkUsageSearchFilter extends PaginationFilter {
  linkId: string | null;
  programId: string | null;
  statuses: ReferralLinkUsageStatus[] | null;
  dateStart: string | null;
  dateEnd: string | null;
}

export interface ReferralLinkUsageSearchFilterAdmin
  extends AdminReferralLinkUsageSearchFilter {
  userIdReferee: string | null;
  userIdReferrer: string | null;
}

export interface ReferralLinkUsageInfo {
  id: string;
  programId: string;
  programName: string;
  programDescription: string | null;
  linkId: string;
  linkName: string;
  // Referrer Info (from link)
  userIdReferrer: string;
  userDisplayNameReferrer: string | null;
  userEmailReferrer: string | null;
  userPhoneNumberReferrer: string | null;
  // Referee Info (from usage)
  userId: string;
  userDisplayName: string | null;
  userEmail: string | null;
  userPhoneNumber: string | null;
  statusId: string;
  status: ReferralLinkUsageStatus;
  dateClaimed: string;
  dateCompleted: string | null;
  dateExpired: string | null;
  proofOfPersonhoodCompleted: boolean | null;
  proofOfPersonhoodMethod: ProofOfPersonhoodMethod | null;
  pathwayCompleted: boolean | null;
  percentComplete: number | null;
  pathway: ProgramPathwayProgress | null;
  // Computed property (matches C# model logic)
  completed: boolean;
}

export interface ProgramPathwayProgress {
  id: string;
  name: string;
  description?: string | null;
  rule: PathwayCompletionRule | string;
  orderMode: PathwayOrderMode | string;
  completed: boolean;
  dateCompleted: string | null;
  stepsTotal: number;
  stepsCompleted: number;
  percentComplete: number;
  steps: ProgramPathwayStepProgress[];
  isCompletable: boolean;
}

export interface ProgramPathwayStepProgress {
  id: string;
  name: string;
  description?: string | null;
  rule: PathwayCompletionRule | string;
  orderMode: PathwayOrderMode | string;
  order: number | null;
  orderDisplay: number;
  completed: boolean;
  dateCompleted: string | null;
  tasksTotal: number;
  tasksCompleted: number;
  percentComplete: number;
  tasks: ProgramPathwayTaskProgress[];
  isCompletable: boolean;
}

export interface ProgramPathwayTaskProgress {
  id: string;
  entityType: PathwayTaskEntityType;
  opportunity: OpportunityItem | null;
  order: number | null;
  orderDisplay: number;
  completed: boolean;
  dateCompleted: string | null;
  isCompletable: boolean;
  nonCompletableReason: string | null;
}

export interface ReferralLinkUsageSearchResults {
  totalCount: number | null;
  items: ReferralLinkUsage[];
}

// Block/Unblock Models
export interface BlockReason {
  id: string;
  name: string;
  description: string;
}

export interface BlockRequest {
  userId: string;
  reasonId: string;
  comment: string | null;
  cancelLinks: boolean | null;
}

export interface UnblockRequest {
  userId: string;
  comment: string | null;
}

// Analytics Models
export interface ReferralAnalyticsUserInfo {
  userDisplayName: string;
  linkCount: number | null;
  linkCountActive: number | null;
  usageCountTotal: number;
  usageCountCompleted: number;
  usageCountPending: number;
  usageCountExpired: number;
  zltoRewardTotal: number; //***NB: API TODO */
}

export interface ReferralAnalyticsUser extends ReferralAnalyticsUserInfo {
  userId: string;
  zltoRewardTotal: number;
}

export interface ReferralAnalyticsSearchFilter extends PaginationFilter {
  role: ReferralParticipationRole | string;
}

export interface ReferralAnalyticsSearchFilterAdmin
  extends ReferralAnalyticsSearchFilter {
  programId: string | null;
  startDate: string | null;
  endDate: string | null;
}

export interface ReferralAnalyticsSearchResultsInfo {
  totalCount: number;
  role: ReferralParticipationRole;
  linkCount: number | null;
  linkCountActive: number | null;
  usageCountTotal: number;
  usageCountCompleted: number;
  items: ReferralAnalyticsUserInfo[];
}

export interface ReferralAnalyticsSearchResults
  extends ReferralAnalyticsSearchResultsInfo {
  zltoRewardTotal: number;
  items: ReferralAnalyticsUser[];
}
