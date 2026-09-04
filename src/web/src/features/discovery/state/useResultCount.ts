import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { searchOpportunities } from "~/api/services/opportunities";
import { buildSearchFilter } from "../lib/searchRequest";
import type { DiscoveryFilters } from "../lib/types";

/**
 * The live result count — updates (debounced) as filters change, while results themselves apply
 * only on "Show N results". Built from the SAME request builder as the results query, so the
 * count can never disagree with what applying would return. The API's `TotalCountOnly` fast path
 * is internal-only, so this fetches one item and reads `totalCount`.
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
  filters: DiscoveryFilters,
  typeIdByName: Record<string, string>,
  enabled: boolean,
): { count: number | null; counting: boolean } {
  const request = buildSearchFilter(filters, 1, 1, typeIdByName);
  const debouncedKey = useDebouncedValue(JSON.stringify(request), 300);

  const { data, isFetching } = useQuery({
    queryKey: ["discovery", "count", debouncedKey],
    queryFn: () =>
      searchOpportunities(JSON.parse(debouncedKey) as typeof request),
    enabled,
    placeholderData: keepPreviousData,
    staleTime: 60 * 1000,
  });

  return { count: data?.totalCount ?? null, counting: isFetching };
}
