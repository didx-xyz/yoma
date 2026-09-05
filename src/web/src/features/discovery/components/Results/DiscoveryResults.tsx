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
import { CopyLinkButton } from "../shared/CopyLinkButton";
import { Message } from "../shared/Message";
import { PreferenceBanner } from "../shared/PreferenceBanner";
import { AppliedChips } from "./AppliedChips";
import { ResultsGrid } from "./ResultsGrid";
import { ResultsList } from "./ResultsList";
import { SortControl } from "./SortControl";
import { ViewToggle } from "./ViewToggle";

/**
 * The applied-search surface: banner, chips, the category carousel (current position, per the
 * design decision), the count row, then the results in the chosen view. Loading keeps the
 * previous results mounted and fades them — one spinner beside the count, never one per card,
 * `motion-reduce` throughout.
 */
export const DiscoveryResults: React.FC<{
  onEditPreferences: () => void;
  now: Date;
}> = ({ onEditPreferences, now }) => {
  const {
    state,
    dispatch,
    effectiveFilters,
    lookups,
    ready,
    setView,
    chips,
    resultsAnchorRef,
    scrollToResults,
  } = useDiscovery();
  const { results, loading, failed, retry } = useDiscoveryResults(
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

  // Paging jumps back to the count row — the new page starts at its top, not mid-scroll.
  // (This and the explicit "Show N results" actions are the ONLY scroll triggers; a filter
  // change never scrolls.)
  const previousPage = useRef(state.page);
  useEffect(() => {
    if (state.page !== previousPage.current) scrollToResults();
    previousPage.current = state.page;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- page transitions only
  }, [state.page]);

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
  // Whether the zero-results state has anything to offer removing (free text is not a chip).
  const removableFilters =
    chips.length > 0 || state.filters.customFields.length > 0;

  // "[count] match(es) for [first filter] + N filter(s)" — states WHAT the count counts while
  // staying short: first value only, the rest as a count (the chips row above carries the full
  // set). Struck-through (skipped) chips are not filtering, so they stay out of it.
  const filterValues = [
    ...(effectiveFilters.q ? [`“${effectiveFilters.q}”`] : []),
    ...chips.filter((c) => c.provenance !== "inheritedOff").map((c) => c.value),
  ];
  const heading = (count: number): string => {
    if (filterValues.length === 0)
      return `${formatNumber(count)} ${count === 1 ? "opportunity" : "opportunities"}`;
    // Custom-field clauses are chipped separately (not in the chip model), but they filter —
    // count them in the remainder. A clause can only exist while its type chip does, so
    // `filterValues` is never empty when clauses are set.
    const rest = filterValues.length - 1 + effectiveFilters.customFields.length;
    return `${formatNumber(count)} ${count === 1 ? "match" : "matches"} for ${filterValues[0]}${
      rest > 0 ? ` + ${rest} ${rest === 1 ? "filter" : "filters"}` : ""
    }`;
  };

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      <PreferenceBanner onEdit={onEditPreferences} />
      <AppliedChips pulseChipId={loading ? newChipId : null} />
      <CategoryCarousel />
      {/* One drag-scrollable row: count left, controls right — never wraps into page height.
          The pager scrolls back up to this row, so it carries the anchor ref. */}
      <div ref={resultsAnchorRef} className="scroll-mt-20">
        <ScrollableContainer
          className="flex items-center gap-3 overflow-x-auto"
          showShadows={true}
          shadowFromClassName="from-gray-light" // the page body's background
        >
          <h2 className="flex shrink-0 items-center gap-2 text-base font-bold tracking-normal whitespace-nowrap md:text-lg">
            {total === null ? (
              // First load only. A static word, not a shimmer: the surface has exactly one
              // loading treatment (fade the results, blur the previous number).
              <span className="text-gray-dark font-normal">Searching…</span>
            ) : (
              // While updating, the previous number stays and only the TEXT blurs — never a
              // swapped-in placeholder box (browser feedback, 2026-09-03).
              <span
                className={`transition duration-300 motion-reduce:transition-none ${
                  loading ? "opacity-60 blur-[2px]" : ""
                }`}
              >
                {heading(total)}
              </span>
            )}
          </h2>
          <div className="ml-auto flex shrink-0 items-center gap-2 md:gap-3">
            <CopyLinkButton />
            <SortControl
              sort={state.sort}
              onChange={(sort) => dispatch({ kind: "setSort", sort })}
            />
            <ViewToggle view={state.view} onChange={setView} />
          </div>
        </ScrollableContainer>
      </div>
      {failed && (
        <Message kind="error">
          Couldn&apos;t load these results.{" "}
          <button
            type="button"
            onClick={retry}
            className="font-semibold underline"
          >
            Retry
          </button>
        </Message>
      )}
      {lookups.failed && !failed && (
        <Message kind="error">
          Some filter options couldn&apos;t be loaded, so this search may be
          incomplete.{" "}
          <button
            type="button"
            onClick={lookups.retry}
            className="font-semibold underline"
          >
            Retry
          </button>
        </Message>
      )}
      {/* Zero results is a dead end unless the way out is on screen: the applied filters render
          inline, removable, so relaxing the search is one tap rather than a hunt back up the
          page (2026-09-05). */}
      {!loading && !failed && total === 0 && (
        <div className="flex flex-col gap-2">
          <Message kind="warning">
            {removableFilters
              ? "No matches. Try removing a filter:"
              : "No matches for this search. Try another word, or widen your filters."}
          </Message>
          {removableFilters && <AppliedChips />}
        </div>
      )}
      {/* Loading keeps the previous results mounted and fades them — no blur, no scale (browser
          feedback: the background blur read as the page breaking, a plain fade does not). */}
      <div
        className={`transition-opacity duration-300 motion-reduce:transition-none ${
          loading ? "opacity-50" : "opacity-100"
        }`}
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
