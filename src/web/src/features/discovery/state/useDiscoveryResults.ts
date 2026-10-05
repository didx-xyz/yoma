import { keepPreviousData, useQuery } from "@tanstack/react-query";
import type { OpportunitySearchResultsInfo } from "~/api/models/opportunity";
import { searchOpportunities } from "~/api/services/opportunities";
import type { DiscoverySearch } from "../lib/preferenceMapping";
import type { SearchLookups } from "../lib/searchRequest";
import { buildSearchFilter } from "../lib/searchRequest";
import type { DiscoverySort } from "../lib/types";

export const DISCOVERY_PAGE_SIZE = 20;

/**
 * One page of results, with the Paid filter it was fetched under. The page on screen may be the
 * previous search's while the next one loads (`keepPreviousData`), so anything that reads the
 * page against a filter — the incentive divider — reads this one, never the current filter.
 */
export interface DiscoveryResultsPage extends OpportunitySearchResultsInfo {
  paidFilter: boolean | null;
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
  const request = buildSearchFilter(
    search,
    sort,
    page,
    DISCOVERY_PAGE_SIZE,
    lookups,
  );

  const { data, isFetching, isError, isPlaceholderData, refetch } = useQuery({
    queryKey: ["discovery", "results", JSON.stringify(request)],
    queryFn: async (): Promise<DiscoveryResultsPage> => ({
      ...(await searchOpportunities(request)),
      paidFilter: request.incentivized?.value ?? null,
    }),
    enabled,
    placeholderData: keepPreviousData,
    staleTime: 60 * 1000,
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
