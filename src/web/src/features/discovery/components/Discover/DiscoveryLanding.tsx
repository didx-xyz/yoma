import React from "react";
import { inheritedSummary } from "../../lib/chipModel";
import { manualSearch } from "../../lib/preferenceMapping";
import { serializeDiscoveryState } from "../../lib/urlCodec";
import type { DiscoveryFilters, DiscoveryState } from "../../lib/types";
import {
  DEFAULT_DISCOVERY_STATE,
  EMPTY_DISCOVERY_FILTERS,
} from "../../lib/types";
import { QUICK_SEARCHES } from "../../registry/quickSearches";
import { useDiscovery } from "../../state/DiscoveryContext";
import { DiscoveryRail } from "./DiscoveryRail";

/**
 * Every rail but "Picked for you" ignores preferences, so its "See all" is its own filter set
 * with preferences off — and, like the newest rail since 2026-10-02, never an empty query string,
 * which was the landing page itself.
 */
const withoutPreferences = (filters: DiscoveryFilters): string =>
  serializeDiscoveryState({
    ...DEFAULT_DISCOVERY_STATE,
    filters,
    preferencesOff: true,
  });

const FEATURED_FILTERS: DiscoveryFilters = {
  ...EMPTY_DISCOVERY_FILTERS,
  featured: true,
};

/**
 * The landing surface — search not yet run: the discovery rails. The preference strip, the
 * Current filters row (inherited chips, so the active preference layer is visible before any
 * search) and Browse by category are the SURFACE's since round 7 (2026-09-30), one instance each
 * for landing and results.
 *
 * Round 10 (2026-10-02), at most four rails, one search each: "Picked for you" (only while a
 * preference applies) · Featured · "Newest on Yoma", which leans on the API's newest-first
 * default ordering · "Done in under an hour", the quick-search registry's own filter set, absent
 * until the Hour interval resolves.
 */
export const DiscoveryLanding: React.FC<{
  now: Date;
}> = ({ now }) => {
  const { state, search, effectiveFilters, chips, lookups } = useDiscovery();

  // "See all" writes the inherited values into the URL as this search's own. The count still
  // matches the rail: the same preferences supply them there, so they keep their inherited modes
  // (`composeSearch`), and the goal and skills groups, which have no param, stay inherited.
  // Except the accessibility needs, which are private: in the URL they would be named in chips,
  // recent searches, history and shared links, and turn strict with preferences off. The
  // destination inherits them as the rail does.
  const preferenceState: DiscoveryState = {
    ...DEFAULT_DISCOVERY_STATE,
    filters: {
      ...effectiveFilters,
      accommodations: state.filters.accommodations,
    },
  };
  // The rail shows while ANY preference applies; its subtitle names only what may be named — never
  // a private value — and falls back to the layer itself (2026-10-03).
  const inherited = inheritedSummary(chips);
  const personalized = inherited.named.length + inherited.unnamed > 0;
  const tunedTo = inherited.named
    .map((value) => value.toLowerCase())
    .slice(0, 2)
    .join(", ");

  // The badge's resolver reads the time intervals only; the rail ignores preferences, so it
  // gets none of the youth's own context.
  const underAnHour =
    QUICK_SEARCHES.find((q) => q.id === "under-an-hour")?.resolve({
      profileCountry: null,
      hasPoint: false,
      categories: lookups.categories,
      commitmentIntervals: lookups.timeIntervals,
      engagementTypes: lookups.engagementTypes,
    }) ?? null;
  const underAnHourFilters: DiscoveryFilters | null = underAnHour
    ? { ...EMPTY_DISCOVERY_FILTERS, ...underAnHour }
    : null;

  return (
    <div className="flex flex-col gap-8 md:gap-10">
      {personalized && (
        <DiscoveryRail
          title="Picked for you"
          subtitle={
            tunedTo
              ? `Because your feed is tuned to ${tunedTo}`
              : "Because of your preferences"
          }
          search={search}
          personalized
          seeAllQueryString={serializeDiscoveryState(preferenceState)}
          now={now}
        />
      )}
      <DiscoveryRail
        title="Featured"
        subtitle="Hand-picked by the Yoma team"
        search={manualSearch(FEATURED_FILTERS)}
        seeAllQueryString={withoutPreferences(FEATURED_FILTERS)}
        now={now}
      />
      <DiscoveryRail
        title="Newest on Yoma"
        subtitle="Latest start dates first"
        search={manualSearch(EMPTY_DISCOVERY_FILTERS)}
        seeAllQueryString={withoutPreferences(EMPTY_DISCOVERY_FILTERS)}
        now={now}
      />
      {underAnHourFilters && (
        <DiscoveryRail
          title="Done in under an hour"
          subtitle="Quick wins that fit into your day"
          search={manualSearch(underAnHourFilters)}
          seeAllQueryString={withoutPreferences(underAnHourFilters)}
          now={now}
        />
      )}
    </div>
  );
};
