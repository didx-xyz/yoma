import React, { useEffect, useRef } from "react";
import ScrollableContainer from "~/components/Carousel/ScrollableContainer";
import {
  filteringSummary,
  headingSubject,
  recentSearchLabel,
} from "../../lib/chipModel";
import { formatNumber } from "../../lib/format";
import {
  DISTANCE_NOTE,
  hasLocationFilter,
  LOCATION_NOT_APPLIED,
  LOCATION_SEARCH_LIVE,
} from "../../lib/location";
import { recordRecentSearch } from "../../lib/recentSearches";
import { incentiveSplitAt, sortNote } from "../../lib/resultsOrder";
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
import { SortControl } from "./SortControl";
import { ViewToggle } from "./ViewToggle";

/**
 * The applied-search surface: the count row, then the results in the chosen view. The banner,
 * the Current filters row and Browse by category sit above it, owned by the surface since round 7
 * (2026-09-30). Loading keeps the
 * previous results mounted and fades them — one spinner beside the count, never one per card,
 * `motion-reduce` throughout.
 *
 * Sort is back since the revised search contract (2026-10-03): inline beside the view toggle from
 * `lg`, its own row under the heading below it. A sort change never scrolls.
 */
export const DiscoveryResults: React.FC<{
  now: Date;
}> = ({ now }) => {
  const {
    state,
    dispatch,
    search,
    effectiveFilters,
    lookups,
    searchReady,
    setView,
    chips,
    resultsAnchorRef,
    scrollToResults,
  } = useDiscovery();
  const { results, loading, failed, retry } = useDiscoveryResults(
    search,
    state.sort,
    state.page,
    lookups,
    searchReady,
  );

  // Paging jumps back to the count row — the new page starts at its top, not mid-scroll.
  // (This and the explicit "Show N results" actions are the ONLY scroll triggers; a filter
  // change never scrolls.) A sort change resets the page too, and never scrolls either
  // (2026-09-03): the youth stays where the control is.
  const previous = useRef({ page: state.page, sort: state.sort });
  useEffect(() => {
    if (
      state.page !== previous.current.page &&
      state.sort === previous.current.sort
    )
      scrollToResults();
    previous.current = { page: state.page, sort: state.sort };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- page and sort transitions only
  }, [state.page, state.sort]);

  // The chips that actually filter: struck-through (skipped) and inapplicable chips do not, and
  // neither do pending ones (region / city / distance until the Location search lands). The
  // heading and the recent-search label both name only these — and never a private value (the
  // accessibility needs), which the heading counts and the label leaves out.
  const filtering = filteringSummary(chips);

  // Record the search once its results arrive (imperative side effect, not derived state).
  useEffect(() => {
    if (!results || loading) return;
    recordRecentSearch({
      label: recentSearchLabel(state.filters.q, filtering),
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
  // set). Only the filtering chips may claim the count. Custom-field clauses are chipped
  // separately (not in the chip model), but they filter — counted in the remainder. A clause can
  // only exist while its type chip does, so there is always a subject when clauses are set.
  const subject = headingSubject(
    effectiveFilters.q,
    filtering,
    effectiveFilters.customFields.length,
  );
  const heading = (count: number): string => {
    if (!subject)
      return `${formatNumber(count)} ${count === 1 ? "opportunity" : "opportunities"}`;
    // No-break spaces inside "+ 1 filter", so a wrapped heading (below `sm`) moves it to the
    // next line whole rather than orphaning "filter".
    const { first, rest } = subject;
    return `${formatNumber(count)} ${count === 1 ? "match" : "matches"} for ${first}${
      rest > 0
        ? ` +\u00a0${rest}\u00a0${rest === 1 ? "filter" : "filters"}`
        : ""
    }`;
  };

  const items = results?.items ?? [];
  // Under a Paid filter the explicit matches come first, whatever the sort; the divider marks
  // where the unspecified ones begin on this page. Split on the filter the page was fetched
  // with: the previous search's page, kept on screen while the next loads, keeps a correct
  // divider (the faded results never change layout) and never gets a wrong one.
  const splitAt = incentiveSplitAt(results);
  const note = sortNote(effectiveFilters.types, state.sort);
  const sortControl = (className: string): React.ReactNode => (
    <SortControl
      sort={state.sort}
      types={effectiveFilters.types}
      onChange={(sort) => dispatch({ kind: "setSort", sort })}
      className={className}
    />
  );

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      {/* One drag-scrollable row: count left, controls right — never wraps into page height.
          The pager scrolls back up to this row, so it carries the anchor ref. Below `lg` Sort
          is a row of its own under it, inside the anchor, so the pager lands above both. */}
      <div ref={resultsAnchorRef} className="flex scroll-mt-20 flex-col gap-3">
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
            {sortControl("hidden lg:flex")}
            <ViewToggle view={state.view} onChange={setView} />
          </div>
        </ScrollableContainer>
        {sortControl("flex lg:hidden")}
      </div>
      {note && <Message>{note}</Message>}
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
          <ResultsGrid items={items} now={now} incentiveSplitAt={splitAt} />
        ) : (
          <ResultsList items={items} now={now} incentiveSplitAt={splitAt} />
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
