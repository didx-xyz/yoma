import React from "react";
import { serializeDiscoveryState } from "../../lib/urlCodec";
import type { DiscoveryState } from "../../lib/types";
import {
  DEFAULT_DISCOVERY_STATE,
  EMPTY_DISCOVERY_FILTERS,
} from "../../lib/types";
import { useDiscovery } from "../../state/DiscoveryContext";
import { AppliedChips } from "../Results/AppliedChips";
import { PreferenceBanner } from "../shared/PreferenceBanner";
import { CategoryCarousel } from "./CategoryCarousel";
import { DiscoveryRail } from "./DiscoveryRail";

/**
 * The landing surface — search not yet run: preference strip, the inherited chips (so the active
 * preference layer is visible before any search), the category carousel, then the discovery
 * rails. The first rail is preference-driven and labelled as such; "New this week" leans on the
 * API's newest-first default ordering.
 */
export const DiscoveryLanding: React.FC<{
  onEditPreferences: () => void;
  now: Date;
}> = ({ onEditPreferences, now }) => {
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
    <div className="flex flex-col gap-6">
      <PreferenceBanner onEdit={onEditPreferences} />
      <AppliedChips />
      <CategoryCarousel />
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
        seeAllQueryString=""
        now={now}
      />
    </div>
  );
};
