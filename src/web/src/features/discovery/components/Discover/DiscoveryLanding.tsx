import React from "react";
import { serializeDiscoveryState } from "../../lib/urlCodec";
import type { DiscoveryState } from "../../lib/types";
import {
  DEFAULT_DISCOVERY_STATE,
  EMPTY_DISCOVERY_FILTERS,
} from "../../lib/types";
import { useDiscovery } from "../../state/DiscoveryContext";
import { DiscoveryRail } from "./DiscoveryRail";

/**
 * The landing surface — search not yet run: the discovery rails. The preference strip, the
 * Current filters row (inherited chips, so the active preference layer is visible before any
 * search) and Browse by category are the SURFACE's since round 7 (2026-09-30), one instance each
 * for landing and results. The first rail is preference-driven and labelled as such; "New this week" leans on the
 * API's newest-first default ordering.
 */
export const DiscoveryLanding: React.FC<{
  now: Date;
}> = ({ now }) => {
  const { effectiveFilters, chips } = useDiscovery();

  const preferenceState: DiscoveryState = {
    ...DEFAULT_DISCOVERY_STATE,
    filters: effectiveFilters,
  };
  const tunedTo = chips
    .filter((c) => c.provenance === "inherited")
    .map((c) => c.value.toLowerCase())
    .slice(0, 2)
    .join(", ");

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      {tunedTo && (
        <DiscoveryRail
          title={`Because your feed is tuned to ${tunedTo}`}
          subtitle="From your preferences"
          filters={effectiveFilters}
          seeAllQueryString={serializeDiscoveryState(preferenceState)}
          now={now}
        />
      )}
      <DiscoveryRail
        title="New this week"
        subtitle="The newest opportunities across Yoma"
        filters={EMPTY_DISCOVERY_FILTERS}
        // The rail ignores preferences, so its "See all" is every opportunity with preferences
        // off — newest first, the API's default order. An empty query string was the landing
        // page itself, so the link went nowhere (2026-10-02).
        seeAllQueryString={serializeDiscoveryState({
          ...DEFAULT_DISCOVERY_STATE,
          preferencesOff: true,
        })}
        now={now}
      />
    </div>
  );
};
