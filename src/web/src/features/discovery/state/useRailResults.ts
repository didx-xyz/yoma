import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";
import type { OpportunityInfo } from "~/api/models/opportunity";
import type { LandingRail } from "../lib/landingRails";
import { DISCOVERY_PAGE_SIZE } from "../lib/searchRequest";
import { useDiscovery } from "./DiscoveryContext";
import type { DiscoveryResultsPage } from "./useDiscoveryResults";
import {
  discoveryResultsQuery,
  useDiscoveryResults,
} from "./useDiscoveryResults";

/**
 * Whether the element given to `ref` has come within `rootMargin` of the viewport, latched: once
 * true it stays true, so a rail scrolled past keeps its cards. `ref` is a callback ref, so the
 * element may change or mount late (a collapsed rail's sentinel, then its section): whichever is
 * attached is observed. Without `IntersectionObserver` everything counts as seen.
 */
export function useInView({
  rootMargin = "0px",
}: { rootMargin?: string } = {}): {
  ref: (element: Element | null) => void;
  inView: boolean;
} {
  const [element, setElement] = useState<Element | null>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    if (inView || !element) return;
    if (typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [element, rootMargin, inView]);
  return { ref: setElement, inView };
}

/**
 * One landing rail's results (`landingRails`): ONE search, fetched only once the rail is in view,
 * never a request per card.
 *
 * - Page 1 is `useDiscoveryResults` with the newest order, so it shares the results page's query
 *   key: the rail's See all opens on a cache hit (`seeAllExact`).
 * - `loadData` is `CustomCarouselV3`'s: it pages sideways through the same query definition
 *   (`discoveryResultsQuery`), so a page the rail fetched is the page the results page shows.
 *   Give the carousel the whole of page 1 as its `data`; a start row mid-page still returns only
 *   the rows from it on.
 * - The gate: Picked for you runs the surface's own search, so it waits on `searchReady`. Every
 *   other rail is built from settled preferences (the place, the goal, the categories), so it
 *   waits for them, but not for the accessibility list, which only Picked for you applies. With
 *   preferences off the lookups alone (as `DiscoveryRail` does).
 */
export function useRailResults(
  rail: Pick<LandingRail, "search" | "personalized">,
  inView: boolean,
): {
  results: DiscoveryResultsPage | undefined;
  loading: boolean;
  failed: boolean;
  retry: () => void;
  /**
   * For `CustomCarouselV3`: the rows from `startRow` (1-based) on; none past the last. A fetch
   * that fails says so (`failed`), so the carousel can offer a retry rather than just stop.
   */
  loadData: (
    startRow: number,
  ) => Promise<{ items: OpportunityInfo[]; failed?: boolean }>;
} {
  const { lookups, ready, searchReady, preferenceSearchReady, state } =
    useDiscovery();
  const settled = rail.personalized
    ? searchReady
    : state.preferencesOff
      ? ready && lookups.searchReady
      : preferenceSearchReady([]);
  const enabled = settled && inView;
  const { search } = rail;

  const page1 = useDiscoveryResults(search, "newest", 1, lookups, enabled);
  const queryClient = useQueryClient();

  const loadData = useCallback(
    async (
      startRow: number,
    ): Promise<{ items: OpportunityInfo[]; failed?: boolean }> => {
      const page = Math.ceil(startRow / DISCOVERY_PAGE_SIZE);
      // The total from THIS search's page 1 in the cache, never a placeholder page's.
      const total =
        queryClient.getQueryData(
          discoveryResultsQuery(search, "newest", 1, lookups).queryKey,
        )?.totalCount ?? null;
      if (!enabled || page < 1 || (total !== null && startRow > total))
        return { items: [] };
      try {
        const data = await queryClient.fetchQuery(
          discoveryResultsQuery(search, "newest", page, lookups),
        );
        return {
          items: data.items.slice((startRow - 1) % DISCOVERY_PAGE_SIZE),
        };
      } catch {
        // Stated, never silent (2026-09-05): the carousel shows its retry at the row's end.
        return { items: [], failed: true };
      }
    },
    [enabled, lookups, queryClient, search],
  );

  return { ...page1, loadData };
}
