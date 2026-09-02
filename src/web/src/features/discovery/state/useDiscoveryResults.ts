import { keepPreviousData, useQuery } from "@tanstack/react-query";
import type { OpportunitySearchResultsInfo } from "~/api/models/opportunity";
import { searchOpportunities } from "~/api/services/opportunities";
import { buildSearchFilter } from "../lib/searchRequest";
import type { DiscoveryFilters } from "../lib/types";

export const DISCOVERY_PAGE_SIZE = 20;

/**
 * The applied results — keyed on the effective filters (URL + surviving preference layer) and
 * the page, built by the same `buildSearchFilter` as the live count. Previous results are kept
 * while the next page loads, so the surface can blur them in place instead of blanking.
 * The view mode is deliberately absent from the key: switching grid ↔ list issues no request.
 */
export function useDiscoveryResults(
  filters: DiscoveryFilters,
  page: number,
  typeIdByName: Record<string, string>,
  enabled: boolean,
): {
  results: OpportunitySearchResultsInfo | undefined;
  loading: boolean;
} {
  const request = buildSearchFilter(
    filters,
    page,
    DISCOVERY_PAGE_SIZE,
    typeIdByName,
  );

  const { data, isFetching } = useQuery({
    queryKey: ["discovery", "results", JSON.stringify(request)],
    queryFn: () => searchOpportunities(request),
    enabled,
    placeholderData: keepPreviousData,
    staleTime: 60 * 1000,
  });

  return { results: data, loading: isFetching };
}
