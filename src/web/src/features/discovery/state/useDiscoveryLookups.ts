import { useQuery } from "@tanstack/react-query";
import type {
  Country,
  EngagementType,
  Language,
  TimeInterval,
} from "~/api/models/lookups";
import type {
  OpportunityCategory,
  OpportunitySearchCriteriaZltoRewardRange,
  OpportunityType,
} from "~/api/models/opportunity";
import type { OrganizationInfo } from "~/api/models/organisation";
import { getEngagementTypes, getTimeIntervals } from "~/api/services/lookups";
import {
  getOpportunityCategories,
  getOpportunityCountries,
  getOpportunityLanguages,
  getOpportunityOrganizations,
  getOpportunityTypes,
  getZltoRewardRanges,
} from "~/api/services/opportunities";

/**
 * The lookups the discovery surface renders options and labels from. All static-ish reference
 * data, cached for the session. Providers (organisations) and skills are searched on demand by
 * their `lookupSearch` controls rather than loaded up front.
 */
export interface DiscoveryLookups {
  types: OpportunityType[];
  categories: OpportunityCategory[];
  countries: Country[];
  languages: Language[];
  engagementTypes: EngagementType[];
  timeIntervals: TimeInterval[];
  organizations: OrganizationInfo[];
  zltoRanges: OpportunitySearchCriteriaZltoRewardRange[];
  /** Opportunity Type enum name → GUID, for the search request. */
  typeIdByName: Record<string, string>;
}

const STALE_TIME = 5 * 60 * 1000;

export function useDiscoveryLookups(): DiscoveryLookups {
  const options = { staleTime: STALE_TIME };
  const { data: types } = useQuery({
    queryKey: ["discovery", "lookup", "types"],
    queryFn: () => getOpportunityTypes(),
    ...options,
  });
  const { data: categories } = useQuery({
    queryKey: ["discovery", "lookup", "categories"],
    queryFn: () => getOpportunityCategories(),
    ...options,
  });
  const { data: countries } = useQuery({
    queryKey: ["discovery", "lookup", "countries"],
    queryFn: () => getOpportunityCountries(),
    ...options,
  });
  const { data: languages } = useQuery({
    queryKey: ["discovery", "lookup", "languages"],
    queryFn: () => getOpportunityLanguages(),
    ...options,
  });
  const { data: engagementTypes } = useQuery({
    queryKey: ["discovery", "lookup", "engagementTypes"],
    queryFn: () => getEngagementTypes(),
    ...options,
  });
  const { data: timeIntervals } = useQuery({
    queryKey: ["discovery", "lookup", "timeIntervals"],
    queryFn: () => getTimeIntervals(),
    ...options,
  });
  const { data: organizations } = useQuery({
    queryKey: ["discovery", "lookup", "organizations"],
    queryFn: () => getOpportunityOrganizations(),
    ...options,
  });
  const { data: zltoRanges } = useQuery({
    queryKey: ["discovery", "lookup", "zltoRanges"],
    queryFn: () => getZltoRewardRanges(),
    ...options,
  });

  return {
    types: types ?? [],
    categories: categories ?? [],
    countries: countries ?? [],
    languages: languages ?? [],
    engagementTypes: engagementTypes ?? [],
    timeIntervals: timeIntervals ?? [],
    organizations: organizations ?? [],
    zltoRanges: zltoRanges ?? [],
    typeIdByName: Object.fromEntries((types ?? []).map((t) => [t.name, t.id])),
  };
}
