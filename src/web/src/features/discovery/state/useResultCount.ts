import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { searchOpportunities } from "~/api/services/opportunities";
import type { DiscoverySearch } from "../lib/preferenceMapping";
import type { SearchLookups } from "../lib/searchRequest";
import { buildCountFilter } from "../lib/searchRequest";

/**
 * The live result count — updates (debounced) as filters change, while results themselves apply
 * only on "Show N results". Built from the SAME request builder as the results query, so the
 * count can never disagree with what applying would return. A count-only search
 * (`totalCountOnly`, public since 2026-09-29): no items are loaded, `totalCount` is all it reads.
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
  const request = buildCountFilter(search, lookups);
  // Debounced only once the request can be built. A key from before (lookups still loading)
  // would otherwise go out the moment the count is enabled: one request with the wrong body.
  const debouncedKey = useDebouncedValue(
    enabled ? JSON.stringify(request) : null,
    300,
  );

  const { data, isFetching, isError, isPlaceholderData } = useQuery({
    queryKey: ["discovery", "count", debouncedKey],
    queryFn: () =>
      searchOpportunities(JSON.parse(debouncedKey!) as typeof request),
    enabled: debouncedKey !== null,
    placeholderData: keepPreviousData,
    staleTime: 60 * 1000,
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
