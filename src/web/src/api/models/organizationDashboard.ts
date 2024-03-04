import { PaginationFilter } from "./common";
import { Skill, TimeInterval } from "./lookups";
import { OpportunityInfo } from "./opportunity";

export interface OrganizationSearchFilterSummary
  extends OrganizationSearchFilterBase {}

export interface OrganizationSearchFilterBase extends PaginationFilter {
  organization: string | null;
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
  viewed: TimeIntervalSummary;
  completed: TimeIntervalSummary;
  completion: OpporunityCompletion;
  conversionRate: OpportunityConversionRate;
  reward: OpportunityReward;
  published: TimeIntervalSummary;
  unpublished: TimeIntervalSummary;
  expired: TimeIntervalSummary;
  pending: TimeIntervalSummary;
}

export interface OpporunityCompletion {
  averageTimeInDays: number;
  percentage: number | null;
}

export interface OpportunityConversionRate {
  completedCount: number;
  viewedCount: number;
}

export interface OpportunityReward {
  totalAmount: number;
  percentage: number | null;
}

export interface OrganizationOpportunitySkill {
  items: TimeIntervalSummary;
  topCompleted: Skill[];
}

export interface TimeIntervalSummary {
  timeInterval: TimeInterval;
  data: { item1: number; item2: number }[];
  count: number;
}

export interface OrganizationDemographic {
  countries: { item1: string; item2: number }[];
  genders: { item1: string; item2: number }[];
  ages: { item1: string; item2: number }[];
}

export interface OrganizationSearchFilterQueryTerm
  extends OrganizationSearchFilterBase {
  ageRanges: string[] | null;
  genders: string[] | null;
  countries: string[] | null;
}

export interface OrganizationSearchResultsQueryTerm {
  items: { item1: string; item2: number };
  dateStamp: string;
}

export interface OrganizationSearchFilterOpportunity
  extends OrganizationSearchFilterBase {
  ageRanges: string[] | null;
  genders: string[] | null;
  countries: string[] | null;
}

export interface OrganizationSearchResultsOpportunity {
  items: OpportunityInfo[];
  totalCount: number;
  dateStamp: string;
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
