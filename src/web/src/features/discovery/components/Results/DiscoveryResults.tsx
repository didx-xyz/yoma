import React, { useEffect, useRef } from "react";
import ScrollableContainer from "~/components/Carousel/ScrollableContainer";
import { formatNumber } from "../../lib/format";
import { recordRecentSearch } from "../../lib/recentSearches";
import { serializeDiscoveryState } from "../../lib/urlCodec";
import { useDiscovery } from "../../state/DiscoveryContext";
import {
  DISCOVERY_PAGE_SIZE,
  useDiscoveryResults,
} from "../../state/useDiscoveryResults";
import { CategoryCarousel } from "../Discover/CategoryCarousel";
import { PreferenceBanner } from "../shared/PreferenceBanner";
import { AppliedChips } from "./AppliedChips";
import { ResultsGrid } from "./ResultsGrid";
import { ResultsList } from "./ResultsList";
import { SortControl } from "./SortControl";
import { ViewToggle } from "./ViewToggle";

/**
 * The applied-search surface: banner, chips, the category carousel (current position, per the
 * design decision), the count row, then the results in the chosen view. Loading keeps the previous results mounted
 * and blurred — one spinner beside the count, never one per card, `motion-reduce` throughout.
 */
export const DiscoveryResults: React.FC<{
  onEditPreferences: () => void;
  now: Date;
}> = ({ onEditPreferences, now }) => {
  const { state, dispatch, effectiveFilters, lookups, ready, setView, chips } =
    useDiscovery();
  const { results, loading } = useDiscoveryResults(
    effectiveFilters,
    state.page,
    lookups.typeIdByName,
    ready && lookups.types.length > 0,
  );

  // Pulse the chip that caused the reload: whatever id wasn't in the previous chip set.
  const previousChipIds = useRef<Set<string>>(new Set());
  const newChipId =
    chips.find((c) => !previousChipIds.current.has(c.id))?.id ?? null;
  useEffect(() => {
    previousChipIds.current = new Set(chips.map((c) => c.id));
  });

  // Record the search once its results arrive (imperative side effect, not derived state).
  useEffect(() => {
    if (!results || loading) return;
    recordRecentSearch({
      label: state.filters.q ?? chips.map((c) => c.value).join(" · ") ?? "",
      queryString: serializeDiscoveryState(state),
      resultCount: results.totalCount,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- record per result set only
  }, [results]);

  const total = results?.totalCount ?? null;
  const pages =
    total !== null ? Math.max(1, Math.ceil(total / DISCOVERY_PAGE_SIZE)) : 1;

  return (
    <div className="flex flex-col gap-4">
      <PreferenceBanner onEdit={onEditPreferences} />
      <AppliedChips pulseChipId={loading ? newChipId : null} />
      <CategoryCarousel />
      {/* One drag-scrollable row: count left, controls right — never wraps into page height. */}
      <ScrollableContainer
        className="flex items-center gap-3 overflow-x-auto"
        showShadows={true}
        shadowFromClassName="from-gray-light" // the page body's background
      >
        <h2 className="flex shrink-0 items-center gap-2 text-base font-bold tracking-normal whitespace-nowrap md:text-lg">
          {loading || total === null ? (
            <>
              <span className="bg-gray inline-block h-5 w-16 animate-pulse rounded motion-reduce:animate-none" />
              <span
                className="border-gray-dark inline-block h-3.25 w-3.25 animate-spin rounded-full border-2 border-t-transparent motion-reduce:animate-none"
                aria-hidden
              />
              <span className="text-gray-dark text-sm font-normal">
                updating
              </span>
            </>
          ) : (
            <>{formatNumber(total)} opportunities</>
          )}
        </h2>
        <div className="ml-auto flex shrink-0 items-center gap-2 md:gap-3">
          <SortControl
            sort={state.sort}
            onChange={(sort) => dispatch({ kind: "setSort", sort })}
          />
          <ViewToggle view={state.view} onChange={setView} />
        </div>
      </ScrollableContainer>
      <div
        className={
          loading
            ? "scale-[0.99] blur-sm transition duration-300 motion-reduce:transition-none"
            : "transition duration-300 motion-reduce:transition-none"
        }
        style={{ opacity: loading ? 0.5 : 1 }}
      >
        {state.view === "grid" ? (
          <ResultsGrid items={results?.items ?? []} now={now} />
        ) : (
          <ResultsList items={results?.items ?? []} now={now} />
        )}
      </div>
      {pages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            disabled={state.page <= 1}
            onClick={() => dispatch({ kind: "setPage", page: state.page - 1 })}
            className="btn btn-sm border-gray rounded-full bg-white text-xs disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-gray-dark text-xs">
            Page {state.page} of {pages}
          </span>
          <button
            type="button"
            disabled={state.page >= pages}
            onClick={() => dispatch({ kind: "setPage", page: state.page + 1 })}
            className="btn btn-sm border-gray rounded-full bg-white text-xs disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};
