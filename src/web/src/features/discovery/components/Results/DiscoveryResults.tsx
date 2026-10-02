import React, { useEffect, useRef } from "react";
import ScrollableContainer from "~/components/Carousel/ScrollableContainer";
import { formatNumber } from "../../lib/format";
import {
  DISTANCE_NOTE,
  hasLocationFilter,
  LOCATION_NOT_APPLIED,
  LOCATION_SEARCH_LIVE,
} from "../../lib/location";
import { recordRecentSearch } from "../../lib/recentSearches";
import { serializeDiscoveryState } from "../../lib/urlCodec";
import { useDiscovery } from "../../state/DiscoveryContext";
import {
  DISCOVERY_PAGE_SIZE,
  useDiscoveryResults,
} from "../../state/useDiscoveryResults";
// NB: re-enable with the copy button below
// import { CopyLinkButton } from "../shared/CopyLinkButton";
import { Message } from "../shared/Message";
import { NoMatches } from "./NoMatches";
import { ResultsGrid } from "./ResultsGrid";
import { ResultsList } from "./ResultsList";
// NB: re-enable with the sort control below (once the API supports sorting)
// import { SortControl } from "./SortControl";
import { ViewToggle } from "./ViewToggle";

/**
 * The applied-search surface: the count row, then the results in the chosen view. The banner,
 * the Current filters row and Browse by category sit above it, owned by the surface since round 7
 * (2026-09-30). Loading keeps the
 * previous results mounted and fades them — one spinner beside the count, never one per card,
 * `motion-reduce` throughout.
 */
export const DiscoveryResults: React.FC<{
  now: Date;
}> = ({ now }) => {
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

  // Paging jumps back to the count row — the new page starts at its top, not mid-scroll.
  // (This and the explicit "Show N results" actions are the ONLY scroll triggers; a filter
  // change never scrolls.)
  const previousPage = useRef(state.page);
  useEffect(() => {
    if (state.page !== previousPage.current) scrollToResults();
    previousPage.current = state.page;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- page transitions only
  }, [state.page]);

  // The chips that actually filter: struck-through (skipped) and inapplicable chips do not, and
  // neither do pending ones (region / city / distance until the Location search lands). The
  // heading and the recent-search label both name only these.
  const filteringChipValues = chips
    .filter(
      (c) =>
        (c.provenance === "inherited" || c.provenance === "manual") &&
        !c.pending,
    )
    .map((c) => c.value);

  // Record the search once its results arrive (imperative side effect, not derived state).
  useEffect(() => {
    if (!results || loading) return;
    recordRecentSearch({
      // No word and no filtering chip (`prefsOff=1` alone) is every opportunity — never a
      // blank row.
      label:
        state.filters.q ??
        (filteringChipValues.join(" · ") || "All opportunities"),
      queryString: serializeDiscoveryState(state),
      resultCount: results.totalCount,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- record per result set only
  }, [results]);

  const total = results?.totalCount ?? null;
  const pages =
    total !== null ? Math.max(1, Math.ceil(total / DISCOVERY_PAGE_SIZE)) : 1;
  // "[count] match(es) for [first filter] + N filter(s)" — states WHAT the count counts while
  // staying short: first value only, the rest as a count (the chips row above carries the full
  // set). Only the filtering chips may claim the count.
  const filterValues = [
    ...(effectiveFilters.q ? [`“${effectiveFilters.q}”`] : []),
    ...filteringChipValues,
  ];
  const heading = (count: number): string => {
    if (filterValues.length === 0)
      return `${formatNumber(count)} ${count === 1 ? "opportunity" : "opportunities"}`;
    // Custom-field clauses are chipped separately (not in the chip model), but they filter —
    // count them in the remainder. A clause can only exist while its type chip does, so
    // `filterValues` is never empty when clauses are set.
    // No-break spaces inside "+ 1 filter", so a wrapped heading (below `sm`) moves it to the
    // next line whole rather than orphaning "filter".
    const rest = filterValues.length - 1 + effectiveFilters.customFields.length;
    return `${formatNumber(count)} ${count === 1 ? "match" : "matches"} for ${filterValues[0]}${
      rest > 0
        ? ` +\u00a0${rest}\u00a0${rest === 1 ? "filter" : "filters"}`
        : ""
    }`;
  };

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      {/* One drag-scrollable row: count left, controls right — never wraps into page height.
          The pager scrolls back up to this row, so it carries the anchor ref. */}
      <div ref={resultsAnchorRef} className="scroll-mt-20">
        <ScrollableContainer
          className="flex items-center gap-3 overflow-x-auto"
          showShadows={true}
          shadowFromClassName="from-gray-light" // the page body's background
        >
          {/* Below `sm` the heading wraps (a long word can break) so the view toggle always
              stays on screen; from `sm` it is one line, as before. */}
          <h2 className="flex min-w-0 items-center gap-2 text-base font-bold tracking-normal sm:shrink-0 sm:whitespace-nowrap md:text-lg">
            {total === null ? (
              // First load only. A static word, not a shimmer: the surface has exactly one
              // loading treatment (fade the results, blur the previous number).
              <span className="text-gray-dark font-normal">Searching…</span>
            ) : (
              // While updating, the previous number stays and only the TEXT blurs — never a
              // swapped-in placeholder box (browser feedback, 2026-09-03).
              <span
                className={`min-w-0 wrap-break-word transition duration-300 motion-reduce:transition-none ${
                  loading ? "opacity-60 blur-[2px]" : ""
                }`}
              >
                {heading(total)}
              </span>
            )}
          </h2>
          <div className="ml-auto flex shrink-0 items-center gap-2 md:gap-3">
            {/* NB: copy button removed for now to save space */}
            {/* <CopyLinkButton /> */}
            {/* NB: sorting disabled for now till API supports it */}
            {/* <SortControl
              sort={state.sort}
              onChange={(sort) => dispatch({ kind: "setSort", sort })}
            /> */}
            <ViewToggle view={state.view} onChange={setView} />
          </div>
        </ScrollableContainer>
      </div>
      {!LOCATION_SEARCH_LIVE && hasLocationFilter(effectiveFilters) && (
        <Message kind="warning">{LOCATION_NOT_APPLIED}</Message>
      )}
      {LOCATION_SEARCH_LIVE &&
        effectiveFilters.radiusKm !== null &&
        effectiveFilters.point !== null && <Message>{DISTANCE_NOTE}</Message>}
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
      {/* Zero results is a dead end unless the way out is on screen (2026-09-05). Since
          2026-10-01 that is a friendly empty state with a large way out, not a second copy of the
          chips — the filters panel and the banner sit right above it (Jason). */}
      {!loading && !failed && total === 0 && <NoMatches />}
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
