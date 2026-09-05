import { useAtomValue } from "jotai";
import React, { useMemo, useState } from "react";
import ScrollableContainer from "~/components/Carousel/ScrollableContainer";
import { userProfileAtom } from "~/lib/store";
import { isQuickSearchApplied } from "../../lib/discoveryReducer";
import type { QuickSearchContext } from "../../registry/quickSearches";
import { QUICK_SEARCHES } from "../../registry/quickSearches";
import { useDiscovery } from "../../state/DiscoveryContext";
import { Badge } from "../shared/Badge";

/**
 * The quick-search badge row — every home (landing, results, desktop dialog, mobile sheet)
 * renders this one component over the one registry. A badge is a filter set: tapping applies the
 * set it owns, tapping again clears only what it added. Unresolvable badges grey out with their
 * note as a tooltip — visible and inert, never silently missing.
 *
 * Usable badges sort first. Availability is resolved at runtime (a profile country, a loaded
 * lookup), so it cannot be a registry order; with five of seven currently unavailable, the
 * registry order buried the two that work behind the ones that do not.
 */
const WRAP_VISIBLE_BEFORE_SHOW_ALL = 5;

const badgeClassFor = (applied: boolean, unavailable: boolean): string => {
  if (applied) return "border-green bg-green text-white";
  if (unavailable) return "border-yellow-light bg-beige text-gray-dark";
  return "border-gray hover:border-green bg-white text-black";
};

export const QuickSearchRow: React.FC<{ wrap?: boolean }> = ({
  wrap = true,
}) => {
  const { state, dispatch, lookups } = useDiscovery();
  const profile = useAtomValue(userProfileAtom);
  const [showAll, setShowAll] = useState(false);

  const ctx: QuickSearchContext = useMemo(() => {
    const country =
      lookups.countries.find((c) => c.id === profile?.countryId) ?? null;
    return {
      profileCountry: country ? { id: country.id, name: country.name } : null,
      categories: lookups.categories,
      commitmentIntervals: lookups.timeIntervals,
    };
  }, [lookups, profile?.countryId]);

  // Resolve first, then order: available badges lead, the rest keep their registry order.
  const resolved = QUICK_SEARCHES.map((badge) => ({
    badge,
    criteria: badge.resolve(ctx),
  }));
  const ordered = [
    ...resolved.filter((r) => r.criteria !== null),
    ...resolved.filter((r) => r.criteria === null),
  ];
  const visible =
    wrap && !showAll ? ordered.slice(0, WRAP_VISIBLE_BEFORE_SHOW_ALL) : ordered;

  const badges = visible.map(({ badge, criteria }) => {
    const label =
      typeof badge.label === "function" ? badge.label(ctx) : badge.label;
    const applied =
      criteria !== null && isQuickSearchApplied(state.filters, criteria);
    const Icon = badge.icon;
    return (
      <button
        key={badge.id}
        type="button"
        title={
          criteria === null ? (badge.unavailableNote ?? undefined) : undefined
        }
        aria-disabled={criteria === null}
        onClick={() =>
          criteria && dispatch({ kind: "toggleQuickSearch", criteria })
        }
        // Panel homes are thumb-sized (44px); the hero's scrolling row stays compact.
        className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 text-[11px] whitespace-nowrap md:px-3 md:text-xs ${
          wrap ? "min-h-11 md:min-h-9" : "min-h-7 md:min-h-9"
        } ${badgeClassFor(applied, criteria === null)}`}
      >
        <Icon className="h-4 w-4 shrink-0" />
        {label}
        {criteria === null && <Badge intent="availability">SOON</Badge>}
      </button>
    );
  });

  // Hero rows drag-scroll through the app's ScrollableContainer; panel homes wrap in place
  // behind a "Show all N" so the block stays short.
  return wrap ? (
    <div className="flex flex-wrap items-center gap-2">
      {badges}
      {!showAll && QUICK_SEARCHES.length > WRAP_VISIBLE_BEFORE_SHOW_ALL && (
        <button
          type="button"
          onClick={() => setShowAll(true)}
          className="text-green text-xs font-semibold underline"
        >
          Show all {QUICK_SEARCHES.length}
        </button>
      )}
    </div>
  ) : (
    <ScrollableContainer
      className="flex gap-2 overflow-x-auto pb-1"
      showShadows={true}
      shadowFromClassName="from-purple" // the hero's background — the fade must match it
    >
      {badges}
    </ScrollableContainer>
  );
};
