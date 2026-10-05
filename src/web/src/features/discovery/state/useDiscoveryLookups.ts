import { useQuery } from "@tanstack/react-query";
import type {
  Accessibility,
  Country,
  Currency,
  EngagementType,
  Language,
  SustainableDevelopmentGoal,
  TimeInterval,
} from "~/api/models/lookups";
import { ACCESSIBILITY_NAME_OTHER } from "~/api/models/lookups";
import type {
  OpportunityCategory,
  OpportunitySearchCriteriaZltoRewardRange,
  OpportunityType,
} from "~/api/models/opportunity";
import {
  getAccessibilityOptions,
  getCurrencies,
  getEngagementTypes,
  getTimeIntervals,
} from "~/api/services/lookups";
import {
  getOpportunityAccommodations,
  getOpportunityCategories,
  getOpportunityCountries,
  getOpportunityLanguages,
  getOpportunitySustainableDevelopmentGoals,
  getOpportunityTypes,
  getZltoRewardRanges,
} from "~/api/services/opportunities";
import type { FacetStatus } from "../lib/apiStatus";
import { facetStatus, hasSettled } from "../lib/apiStatus";
import { sortTypes } from "../lib/typeOrder";

/**
 * The lookups the discovery surface renders options and labels from. All static-ish reference
 * data, cached for the session. Skills are searched on demand by their `lookupSearch` control
 * rather than loaded up front; Provider is free text and needs no list. Currencies label a Job's
 * salary on the cards (its currency custom field holds a lookup id).
 *
 * Facet lists come from the `search/filter/*` endpoints, which list only values published
 * opportunities actually use — an option that could only ever return nothing is not offered.
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
  | "zltoRanges"
  | "accommodations"
  | "sdgs"
  | "currencies";

export interface DiscoveryLookups {
  types: OpportunityType[];
  categories: OpportunityCategory[];
  countries: Country[];
  languages: Language[];
  engagementTypes: EngagementType[];
  timeIntervals: TimeInterval[];
  zltoRanges: OpportunitySearchCriteriaZltoRewardRange[];
  accommodations: Accessibility[];
  /**
   * The FULL accessibility list — the wizard's, where `accommodations` is the facet list of what
   * published opportunities use. Labels an inherited need no opportunity lists yet, in the
   * Accessibility section (2026-10-03). The same cached query, never a request of its own.
   */
  accessibility: Accessibility[];
  sdgs: SustainableDevelopmentGoal[];
  currencies: Currency[];
  /** Opportunity Type enum name → GUID, for the search request. */
  typeIdByName: Record<string, string>;
  /**
   * The accessibility list's Other option, found by name in the full list (the one the wizard
   * offers), else in the facet list. Never part of an inherited search: without its private
   * description it cannot match the need (2026-10-03). `undefined` until the full list has
   * settled, so no accessibility chip shows and then vanishes; `null` when neither list has it.
   */
  otherAccommodationId: string | null | undefined;
  /**
   * Whether the lookups every search request resolves through have settled: the types loaded (it
   * sends their ids); the countries and categories loaded or failed once — Worldwide and the
   * goal's category are found in them. A failed list degrades the request at once rather than
   * holding it through the retries; one still loading would send a request that is replaced a
   * moment later.
   */
  searchReady: boolean;
  /**
   * The full accessibility list has loaded or failed once, so `otherAccommodationId` is known.
   * Only a search that inherits accessibility needs waits for it (`DiscoveryContext`).
   */
  accessibilitySettled: boolean;
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
  const zltoRangesQuery = useQuery({
    queryKey: ["discovery", "lookup", "zltoRanges"],
    queryFn: () => getZltoRewardRanges(),
    ...options,
  });
  const accommodationsQuery = useQuery({
    queryKey: ["discovery", "lookup", "accommodations"],
    queryFn: () => getOpportunityAccommodations(),
    ...options,
  });
  const sdgsQuery = useQuery({
    queryKey: ["discovery", "lookup", "sdgs"],
    queryFn: () => getOpportunitySustainableDevelopmentGoals(),
    ...options,
  });
  const currenciesQuery = useQuery({
    queryKey: ["discovery", "lookup", "currencies"],
    queryFn: () => getCurrencies(),
    ...options,
  });
  // The FULL accessibility list — the wizard's query (`useAccessibilityOptions`), one cache entry.
  // Read here only to find Other, which the facet list lacks when no opportunity lists it.
  const accessibilityQuery = useQuery({
    queryKey: ["discovery", "lookup", "accessibility"],
    queryFn: () => getAccessibilityOptions(),
    staleTime: Infinity,
  });

  const queries = [
    typesQuery,
    categoriesQuery,
    countriesQuery,
    languagesQuery,
    engagementTypesQuery,
    timeIntervalsQuery,
    zltoRangesQuery,
    accommodationsQuery,
    sdgsQuery,
    currenciesQuery,
  ];
  // Presented in the fixed enum-name order (Job · Learning · ImpactAction · Event ·
  // Entrepreneurship · Other, unknown types after) everywhere on the surface; labels still come
  // from `displayName`.
  const types = typesQuery.data ? sortTypes(typesQuery.data) : undefined;
  const status = (query: (typeof queries)[number]): FacetStatus =>
    query.isPending ? "loading" : facetStatus(query.isError, query.error);
  const otherIn = (list: { id: string; name: string }[] | undefined) =>
    list?.find((option) => option.name === ACCESSIBILITY_NAME_OTHER)?.id;

  return {
    types: types ?? [],
    categories: categoriesQuery.data ?? [],
    countries: countriesQuery.data ?? [],
    languages: languagesQuery.data ?? [],
    engagementTypes: engagementTypesQuery.data ?? [],
    timeIntervals: timeIntervalsQuery.data ?? [],
    zltoRanges: zltoRangesQuery.data ?? [],
    accommodations: accommodationsQuery.data ?? [],
    accessibility: accessibilityQuery.data ?? [],
    sdgs: sdgsQuery.data ?? [],
    currencies: currenciesQuery.data ?? [],
    typeIdByName: Object.fromEntries((types ?? []).map((t) => [t.name, t.id])),
    otherAccommodationId: hasSettled(accessibilityQuery)
      ? (otherIn(accessibilityQuery.data) ??
        otherIn(accommodationsQuery.data) ??
        null)
      : undefined,
    searchReady:
      (types?.length ?? 0) > 0 &&
      hasSettled(countriesQuery) &&
      hasSettled(categoriesQuery),
    accessibilitySettled: hasSettled(accessibilityQuery),
    status: {
      types: status(typesQuery),
      categories: status(categoriesQuery),
      countries: status(countriesQuery),
      languages: status(languagesQuery),
      engagementTypes: status(engagementTypesQuery),
      timeIntervals: status(timeIntervalsQuery),
      zltoRanges: status(zltoRangesQuery),
      accommodations: status(accommodationsQuery),
      sdgs: status(sdgsQuery),
      currencies: status(currenciesQuery),
    },
    typesFailed: typesQuery.isError,
    retry: () => {
      for (const query of [...queries, accessibilityQuery])
        if (query.isError) void query.refetch();
    },
  };
}

/** The engagement type's label — the lookup's `displayName`, never its enum-like `name`. */
export const engagementDisplayName = (
  engagementTypes: EngagementType[],
  value: string,
  by: "id" | "name" = "id",
): string => {
  const hit = engagementTypes.find((e) => e[by] === value);
  return hit?.displayName || hit?.name || value;
};

/** "13. Climate action" — the goal's number leads, as on every SDG list. */
export const sdgLabel = (goal: SustainableDevelopmentGoal): string =>
  `${goal.number}. ${goal.name}`;
