import type { PaginationFilter } from "./common";
import type { Skill, TimeInterval } from "./lookups";
import type { OpportunityInfo } from "./opportunity";

export interface OrganizationSearchFilterBase extends PaginationFilter {
  organization: string;
  opportunities: string[] | null;
  categories: string[] | null;
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
  dateStamp: string;
}

export interface OrganizationOpportunity {
  viewedCompleted: TimeIntervalSummary;
  completion: OpportunityCompletion;
  conversionRate: OpportunityConversionRatio;
  reward: OpportunityReward;
  selected: OpportunitySelected;
}

export interface OpportunitySelected {
  legend: string;
  count: number;
}

export interface OpportunityCompletion {
  legend: string;
  averageTimeInDays: number;
}

export interface OpportunityConversionRatio {
  legend: string;
  completedCount: number;
  viewedCount: number;
  percentage: number;
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
  topCompleted: Skill[];
}
export interface TimeIntervalSummary {
  legend: string[];
  data: TimeValueEntry[];
  count: number[];
}

export interface TimeValueEntry {
  date: string;
  values: any[];
}

export interface OrganizationDemographic {
  countries: Demographic;
  genders: Demographic;
  ages: Demographic;
}

export interface Demographic {
  legend: string;
  items: { [key: string]: number };
}

// export interface OrganizationSearchFilterQueryTerm
//   extends OrganizationSearchFilterBase {
//   ageRanges: string[] | null;
//   genders: string[] | null;
//   countries: string[] | null;
// }

// export interface OrganizationSearchResultsQueryTerm {
//   items: { item1: string; item2: number };
//   dateStamp: string;
// }

// export interface OrganizationSearchFilterOpportunity
//   extends OrganizationSearchFilterBase {
//   ageRanges: string[] | null;
//   genders: string[] | null;
//   countries: string[] | null;
// }

export interface OrganizationSearchResultsOpportunity {
  items: OpportunityInfoAnalytics[];
  totalCount: number;
  dateStamp: string;
}

export interface OpportunityInfoAnalytics {
  id: string;
  title: string;
  organizationLogoId: string | null;
  organizationLogoURL: string | null;
  viewedCount: number;
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
export interface YouthInfo {
  userId: string;
  userDisplayName: string;
  opportunityId: string;
  opportunityTitle: string;
  organizationLogoId: string | null;
  organizationLogoURL: string | null;
  dateCompleted: string | null;
  verified: boolean;
}

export interface OrganizationSearchFilterEngagement {
  organization: string;
  opportunities: string[] | null;
  categories: string[] | null;
  startDate: string | null;
  endDate: string | null;
}

export interface OrganizationSearchResultsYouth {
  items: YouthInfo[];
  totalCount: number;
  dateStamp: string;
}
