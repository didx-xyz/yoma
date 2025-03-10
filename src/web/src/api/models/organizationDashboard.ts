import type { PaginationFilter } from "./common";
import type { Status } from "./opportunity";

export interface OrganizationSearchFilterBase extends PaginationFilter {
  organizations: string[] | null;
  opportunities: string[] | null;
  categories: string[] | null;
  startDate: string | null;
  endDate: string | null;
}

export interface OrganizationSearchFilterYouth
  extends OrganizationSearchFilterBase {
  countries: string[] | null;
}

export interface OrganizationSearchFilterOpportunity
  extends OrganizationSearchFilterBase {}

export interface OrganizationSearchFilterEngagement {
  organizations: string[] | null;
  opportunities: string[] | null;
  categories: string[] | null;
  countries: string[] | null;
  startDate: string | null;
  endDate: string | null;
}

export interface OrganizationSearchFilterSSO extends PaginationFilter {
  organizations: string[] | null;
  startDate: string | null;
  endDate: string | null;
}

export interface OrganizationSearchFilterSummary {
  organization: string;
  opportunities: string[] | null;
  categories: string[] | null;
  startDate: string | null;
  endDate: string | null;
}

export interface OrganizationSearchResultsSummary {
  opportunities: OrganizationOpportunity;
  skills: OrganizationOpportunitySkill;
  demographics: OrganizationDemographic;
  cumulative: OrganizationCumulative;
  dateStamp: string;
}

export interface OrganizationOpportunity {
  engagements: TimeIntervalSummary;
  completion: OpportunityCompletion;
  conversionRate: OpportunityConversionRatio;
  reward: OpportunityReward;
  engaged: OpportunityEngaged;
}

export interface OpportunityEngaged {
  legend: string;
  count: number;
}

export interface OpportunityCompletion {
  legend: string;
  averageTimeInDays: number;
}

export interface OpportunityConversionRatio {
  viewedCount: number;
  viewedCountFromNavigatedExternalLinkTracking: number;
  navigatedExternalLinkCount: number;
  completedCount: number;
  completedCountFromNavigatedExternalLinkTracking: number;
  viewedToNavigatedExternalLinkPercentage: number;
  navigatedExternalLinkToCompletedPercentage: number;
}

export interface OpportunityReward {
  legend: string;
  totalAmount: number;
}

export interface OrganizationOpportunitySkill {
  items: TimeIntervalSummary;
  topCompleted: OpportunitySkillTopCompleted;
}

export interface OpportunitySkillTopCompleted {
  legend: string;
  topCompleted: OpportunitySkillCompleted[];
}

export interface OpportunitySkillCompleted {
  id: string;
  name: string;
  infoURL: string | null;
  countCompleted: number;
}

export interface TimeIntervalSummary {
  legend: string[];
  data: TimeValueEntry[];
  count: number[];
}

export interface TimeValueEntry {
  date: string | Date;
  values: any[];
}

export interface OrganizationDemographic {
  countries: Demographic;
  genders: Demographic;
  ages: Demographic;
  education: Demographic;
}

export interface OrganizationCumulative {
  completions: TimeIntervalSummary;
}
export interface Demographic {
  legend: string;
  items: Record<string, number>;
}

export interface OrganizationSearchResultsOpportunity {
  items: OpportunityInfoAnalytics[];
  totalCount: number;
  dateStamp: string;
}

export interface OpportunityInfoAnalytics {
  id: string;
  title: string;
  status: Status;
  organizationId: string;
  organizationLogoId: string | null;
  organizationLogoURL: string | null;
  viewedCount: number;
  navigatedExternalLinkCount: number;
  completedCount: number;
  conversionRatioPercentage: number;
}

export enum OrganisationDashboardFilterOptions {
  CATEGORIES = "categories",
  OPPORTUNITIES = "opportunities",
  DATE_START = "dateStart",
  DATE_END = "dateEnd",
  AGES = "age",
  GENDERS = "genders",
  COUNTRIES = "countries",
  VIEWALLFILTERSBUTTON = "viewAllFiltersButton",
}

export interface OrganizationSearchResultsYouth {
  items: YouthInfo[];
  totalCount: number;
  dateStamp: string;
}

export interface YouthInfo {
  id: string;
  displayName: string;
  country: string | null;
  age: number | null;
  zltoRewardTotal: number;
  yomaRewardTotal: number;
  opporunityCount: number;
  opportunities: YouthInfoOpportunity[];
}

export interface YouthInfoOpportunity {
  id: string;
  title: string;
  status: Status;
  organizationId: string;
  organizationLogoId: string | null;
  organizationLogoURL: string | null;
  dateCompleted: string | null;
  verified: boolean;
}

export interface YouthInfoOpportunity {
  id: string;
  title: string;
  status: Status;
  organizationLogoId: string | null;
  organizationLogoURL: string | null;
  dateCompleted: string | null;
  verified: boolean;
}

export interface OrganizationSearchResultsSSO {
  items: OrganizationSSOInfo[];
  outboundLoginCount: number | null;
  inboundLoginCount: number | null;
  totalCount: number | null;
  dateStamp: string;
}

export interface OrganizationSSOInfo {
  id: string;
  name: string;
  logoId: string | null;
  logoURL: string | null;
  outbound: OrganizationSSO;
  inbound: OrganizationSSO;
}

export interface OrganizationSSO {
  legend: string;
  enabled: boolean;
  clientId: string | null;
  logins: TimeIntervalSummary | null;
}
