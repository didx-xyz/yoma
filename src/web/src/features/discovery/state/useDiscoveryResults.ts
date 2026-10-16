import {
  keepPreviousData,
  queryOptions,
  useQuery,
} from "@tanstack/react-query";
import type { OpportunitySearchResultsInfo } from "~/api/models/opportunity";
import { searchOpportunities } from "~/api/services/opportunities";
import type { DiscoverySearch } from "../lib/preferenceMapping";
import type { SearchLookups } from "../lib/searchRequest";
import { buildSearchFilter, DISCOVERY_PAGE_SIZE } from "../lib/searchRequest";
import type { DiscoverySort } from "../lib/types";

export { DISCOVERY_PAGE_SIZE };

/**
 * How long a results page (and a count) is reused before it is fetched again. Five minutes, so a
 * youth who browses a rail sideways, then opens its See all and pages on, gets those pages from
 * the cache (2026-10-08: at one minute, a rail's pages were stale by the time they were opened).
 * Kept twice as long, so a page from the landing outlives the trip to the results page.
 */
export const DISCOVERY_STALE_MS = 5 * 60 * 1000;
const DISCOVERY_CACHE_MS = 2 * DISCOVERY_STALE_MS;

/**
 * One page of results, with the Paid filter it was fetched under. The page on screen may be the
 * previous search's while the next one loads (`keepPreviousData`), so anything that reads the
 * page against a filter — the incentive divider — reads this one, never the current filter.
 */
export interface DiscoveryResultsPage extends OpportunitySearchResultsInfo {
  paidFilter: boolean | null;
}

/**
 * One results page as a query — keyed on the request itself, so two surfaces that build the same
 * request (a landing rail and its See all) share one cache entry. The ONE definition of the key
 * and the fetch: `useDiscoveryResults` runs it, and a rail's sideways paging fetches further
 * pages through it (`useRailResults`).
 */
export function discoveryResultsQuery(
  search: DiscoverySearch,
  sort: DiscoverySort,
  page: number,
  lookups: SearchLookups,
) {
  const request = buildSearchFilter(
    search,
    sort,
    page,
    DISCOVERY_PAGE_SIZE,
    lookups,
  );
  return queryOptions({
    queryKey: ["discovery", "results", JSON.stringify(request)],
    queryFn: async (): Promise<DiscoveryResultsPage> => ({
      ...(await searchOpportunities(request)),
      paidFilter: request.incentivized?.value ?? null,
    }),
    staleTime: DISCOVERY_STALE_MS,
    gcTime: DISCOVERY_CACHE_MS,
  });
}

/**
 * The applied results — keyed on the request itself: the composed search (URL + surviving
 * preference layer), the sort and the page, built by the same `buildSearchFilter` as the live
 * count. Previous results are kept while the next page loads, so the surface can blur them in
 * place instead of blanking. The view mode is deliberately absent from the key: switching
 * grid ↔ list issues no request.
 */
export function useDiscoveryResults(
  search: DiscoverySearch,
  sort: DiscoverySort,
  page: number,
  lookups: SearchLookups,
  enabled: boolean,
): {
  results: DiscoveryResultsPage | undefined;
  loading: boolean;
  /** The search itself failed — the surface says so and offers `retry`, never an empty grid. */
  failed: boolean;
  retry: () => void;
} {
  const { data, isFetching, isError, isPlaceholderData, refetch } = useQuery({
    ...discoveryResultsQuery(search, sort, page, lookups),
    enabled,
    placeholderData: keepPreviousData,
  });

  return {
    results: data,
    // Still loading while a held request (`enabled` off — e.g. preferences switched back on
    // before they have settled) shows the previous search's results in its place.
    loading: isFetching || (isPlaceholderData && !enabled),
    failed: isError,
    retry: () => void refetch(),
  };
}
