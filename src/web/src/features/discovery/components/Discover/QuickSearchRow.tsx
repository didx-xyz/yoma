import React, { useMemo } from "react";
import ScrollableContainer from "~/components/Carousel/ScrollableContainer";
import { isQuickSearchApplied } from "../../lib/discoveryReducer";
import type { QuickSearchContext } from "../../registry/quickSearches";
import { QUICK_SEARCHES } from "../../registry/quickSearches";
import { useDiscovery } from "../../state/DiscoveryContext";

/**
 * The quick-search badge row — every home (landing, results, desktop dialog, mobile sheet)
 * renders this one component over the one registry. A badge is a filter set: tapping applies the
 * set it owns, tapping again clears only what it added.
 *
 * Only what filters today is drawn (2026-09-22): shipped badges whose criteria resolve, in
 * registry order. There is no SOON state and no "Show all N" — with four badges the row fits one
 * line on desktop and scrolls sideways inside the mobile header. A badge that cannot resolve
 * (no known country for "Jobs in my country", no city for "Jobs near me"; lookups still
 * loading) is absent, not greyed.
 * Per-badge counts are deliberately NOT fetched — each would be another search request; a
 * batched facet-count endpoint is filed as an API ask.
 */
const badgeClassFor = (applied: boolean): string =>
  applied
    ? "border-green bg-green text-white"
    : "border-gray hover:border-green bg-white text-black";

export const QuickSearchRow: React.FC<{
  wrap?: boolean;
  /**
   * A 2-column grid of full-width pills instead (the welcome step, round 10). An odd last pill
   * spans both columns, so 4, 5 or 6 badges never leave a half-width orphan. 44px tall below
   * `lg` (the touch-target rule), 42px from `lg`.
   */
  grid?: boolean;
  /** Called after a badge is tapped — the welcome step closes the dialog (round 7). */
  onPick?: () => void;
}> = ({ wrap = true, grid = false, onPick }) => {
  const { state, dispatch, lookups, homeCountryId, effectiveFilters } =
    useDiscovery();
  const hasPoint = effectiveFilters.point !== null;

  const ctx: QuickSearchContext = useMemo(() => {
    const country =
      lookups.countries.find((c) => c.id === homeCountryId) ?? null;
    return {
      profileCountry: country ? { id: country.id, name: country.name } : null,
      hasPoint,
      categories: lookups.categories,
      commitmentIntervals: lookups.timeIntervals,
      engagementTypes: lookups.engagementTypes,
    };
  }, [lookups, homeCountryId, hasPoint]);

  const badges = QUICK_SEARCHES.filter((badge) => badge.status === "shipped")
    .map((badge) => ({ badge, criteria: badge.resolve(ctx) }))
    .filter(
      (
        entry,
      ): entry is {
        badge: (typeof QUICK_SEARCHES)[number];
        criteria: NonNullable<
          ReturnType<(typeof QUICK_SEARCHES)[number]["resolve"]>
        >;
      } => entry.criteria !== null,
    )
    .map(({ badge, criteria }, i, all) => {
      const label =
        typeof badge.label === "function" ? badge.label(ctx) : badge.label;
      const applied = isQuickSearchApplied(state.filters, criteria);
      const Icon = badge.icon;
      // Panel homes are thumb-sized (44px); the hero's scrolling row stays compact. The grid
      // picks its own whole size string rather than overriding these. A grid pill is half the
      // panel wide, so a long country ("Jobs in Central African Republic") wraps to a second
      // line inside it instead of running into its neighbour — still the full name, on touch too.
      const sizeClass = grid
        ? `min-h-11 w-full justify-start px-4 py-1.5 text-left text-[13px] leading-tight font-semibold lg:min-h-[42px] ${
            all.length % 2 === 1 && i === all.length - 1 ? "col-span-2" : ""
          }`
        : `px-2.5 text-[11px] whitespace-nowrap md:px-3 md:text-xs ${
            wrap ? "min-h-11 md:min-h-9" : "min-h-7 md:min-h-9"
          }`;
      return (
        <button
          key={badge.id}
          type="button"
          aria-pressed={applied}
          onClick={() => {
            dispatch({ kind: "toggleQuickSearch", criteria });
            onPick?.();
          }}
          className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border ${sizeClass} ${badgeClassFor(applied)}`}
        >
          <Icon className="h-4 w-4 shrink-0" />
          {label}
        </button>
      );
    });

  if (badges.length === 0) return null;

  if (grid) return <div className="grid grid-cols-2 gap-2">{badges}</div>;

  // Hero rows drag-scroll through the app's ScrollableContainer; panel homes wrap in place.
  return wrap ? (
    <div className="flex flex-wrap items-center gap-2">{badges}</div>
  ) : (
    <ScrollableContainer
      // `justify-center-safe`: centred while the badges fit, falling back to start-aligned (and
      // therefore scrollable, with nothing off the left edge) the moment they do not.
      className="flex justify-center-safe gap-2 overflow-x-auto pb-1"
      showShadows={true}
      shadowFromClassName="from-purple" // the hero's background — the fade must match it
    >
      {badges}
    </ScrollableContainer>
  );
};
