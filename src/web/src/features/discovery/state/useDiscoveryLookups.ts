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
import type { FacetStatus } from "../lib/apiStatus";
import { facetStatus } from "../lib/apiStatus";

/**
 * The lookups the discovery surface renders options and labels from. All static-ish reference
 * data, cached for the session. Providers (organisations) and skills are searched on demand by
 * their `lookupSearch` controls rather than loaded up front.
 *
 * A lookup that does not load is REPORTED, never papered over: an empty option list that looks
 * like "no countries exist" is indistinguishable from a broken page. It is reported IN THE
 * SECTION IT FEEDS rather than as a banner over the results — one dead facet behind the "More
 * filters" disclosure should not put a red bar across a working page — and it distinguishes
 * `unavailable` (404: this API build does not serve the facet) from `failed` (a real fault, with
 * a Retry). See `lib/apiStatus.ts` for why those two must not read the same.
 */
export type LookupKey =
  | "types"
  | "categories"
  | "countries"
  | "languages"
  | "engagementTypes"
  | "timeIntervals"
  | "organizations"
  | "zltoRanges";

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
  /** Per lookup: `ok`, `unavailable` (404) or `failed`. Consumed by the section it feeds. */
  status: Record<LookupKey, FacetStatus>;
  /** The Opportunity Types lookup specifically: the type row and block 5 cannot render without it. */
  typesFailed: boolean;
  /** Refetch every lookup that did not load (the Retry action). */
  retry: () => void;
}

const STALE_TIME = 5 * 60 * 1000;

export function useDiscoveryLookups(): DiscoveryLookups {
  const options = { staleTime: STALE_TIME };
  const typesQuery = useQuery({
    queryKey: ["discovery", "lookup", "types"],
    queryFn: () => getOpportunityTypes(),
    ...options,
  });
  const categoriesQuery = useQuery({
    queryKey: ["discovery", "lookup", "categories"],
    queryFn: () => getOpportunityCategories(),
    ...options,
  });
  const countriesQuery = useQuery({
    queryKey: ["discovery", "lookup", "countries"],
    queryFn: () => getOpportunityCountries(),
    ...options,
  });
  const languagesQuery = useQuery({
    queryKey: ["discovery", "lookup", "languages"],
    queryFn: () => getOpportunityLanguages(),
    ...options,
  });
  const engagementTypesQuery = useQuery({
    queryKey: ["discovery", "lookup", "engagementTypes"],
    queryFn: () => getEngagementTypes(),
    ...options,
  });
  const timeIntervalsQuery = useQuery({
    queryKey: ["discovery", "lookup", "timeIntervals"],
    queryFn: () => getTimeIntervals(),
    ...options,
  });
  const organizationsQuery = useQuery({
    queryKey: ["discovery", "lookup", "organizations"],
    queryFn: () => getOpportunityOrganizations(),
    ...options,
  });
  const zltoRangesQuery = useQuery({
    queryKey: ["discovery", "lookup", "zltoRanges"],
    queryFn: () => getZltoRewardRanges(),
    ...options,
  });

  const queries = [
    typesQuery,
    categoriesQuery,
    countriesQuery,
    languagesQuery,
    engagementTypesQuery,
    timeIntervalsQuery,
    organizationsQuery,
    zltoRangesQuery,
  ];
  const types = typesQuery.data;

  return {
    types: types ?? [],
    categories: categoriesQuery.data ?? [],
    countries: countriesQuery.data ?? [],
    languages: languagesQuery.data ?? [],
    engagementTypes: engagementTypesQuery.data ?? [],
    timeIntervals: timeIntervalsQuery.data ?? [],
    organizations: organizationsQuery.data ?? [],
    zltoRanges: zltoRangesQuery.data ?? [],
    typeIdByName: Object.fromEntries((types ?? []).map((t) => [t.name, t.id])),
    status: {
      types: facetStatus(typesQuery.isError, typesQuery.error),
      categories: facetStatus(categoriesQuery.isError, categoriesQuery.error),
      countries: facetStatus(countriesQuery.isError, countriesQuery.error),
      languages: facetStatus(languagesQuery.isError, languagesQuery.error),
      engagementTypes: facetStatus(
        engagementTypesQuery.isError,
        engagementTypesQuery.error,
      ),
      timeIntervals: facetStatus(
        timeIntervalsQuery.isError,
        timeIntervalsQuery.error,
      ),
      organizations: facetStatus(
        organizationsQuery.isError,
        organizationsQuery.error,
      ),
      zltoRanges: facetStatus(zltoRangesQuery.isError, zltoRangesQuery.error),
    },
    typesFailed: typesQuery.isError,
    retry: () => {
      for (const query of queries) if (query.isError) void query.refetch();
    },
  };
}
