import {
  keepPreviousData,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useEffect, useState } from "react";
import type { OpportunitySearchResultsInfo } from "~/api/models/opportunity";
import { searchOpportunities } from "~/api/services/opportunities";
import type { DiscoverySearch } from "../lib/preferenceMapping";
import type { SearchLookups } from "../lib/searchRequest";
import { buildCountFilter } from "../lib/searchRequest";
import {
  DISCOVERY_STALE_MS,
  discoveryResultsQuery,
} from "./useDiscoveryResults";

/**
 * The live result count — updates (debounced) as filters change, while results themselves apply
 * only on "Show N results". Built from the SAME request builder as the results query, so the
 * count can never disagree with what applying would return. A count-only search
 * (`totalCountOnly`, public since 2026-09-29): no items are loaded, `totalCount` is all it reads.
 *
 * When page 1 of the same search is already cached (a landing rail, then its See all), its total
 * IS the count, so no count request goes out until that page goes stale (2026-10-08).
 */
function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const handle = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(handle);
  }, [value, delayMs]);
  return debounced;
}

export function useResultCount(
  search: DiscoverySearch,
  lookups: SearchLookups,
  enabled: boolean,
): { count: number | null; counting: boolean; failed: boolean } {
  const queryClient = useQueryClient();
  const request = buildCountFilter(search, lookups);
  const currentKey = enabled ? JSON.stringify(request) : null;
  // Debounced only once the request can be built. A key from before (lookups still loading)
  // would otherwise go out the moment the count is enabled: one request with the wrong body.
  const debouncedKey = useDebouncedValue(currentKey, 300);
  // The newest-first page 1 of this search, as the rails and the results page cache it. Only
  // while the debounced key is the current search's, so a total never lands on another key.
  const page1Key = discoveryResultsQuery(search, "newest", 1, lookups).queryKey;
  const cachedPage1 = (): OpportunitySearchResultsInfo | undefined =>
    debouncedKey !== null && debouncedKey === currentKey
      ? queryClient.getQueryData(page1Key)
      : undefined;

  const { data, isFetching, isError, isPlaceholderData } = useQuery({
    queryKey: ["discovery", "count", debouncedKey],
    queryFn: () =>
      searchOpportunities(JSON.parse(debouncedKey!) as typeof request),
    enabled: debouncedKey !== null,
    placeholderData: keepPreviousData,
    staleTime: DISCOVERY_STALE_MS,
    initialData: cachedPage1,
    initialDataUpdatedAt: () =>
      cachedPage1() ? queryClient.getQueryState(page1Key)?.dataUpdatedAt : 0,
  });

  // A failed count must not read as "still counting" — the button drops the number and says
  // "Show results" rather than spinning on a request that is not coming back. A held one does:
  // while the gate is shut, the number shown is the previous search's.
  return {
    count: data?.totalCount ?? null,
    counting: isFetching || (isPlaceholderData && !enabled),
    failed: isError,
  };
}
