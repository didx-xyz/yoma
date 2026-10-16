import React from "react";
import { inheritedSummary } from "../../lib/chipModel";
import { landingRails } from "../../lib/landingRails";
import { useDiscovery } from "../../state/DiscoveryContext";
import { DiscoveryRail } from "./DiscoveryRail";
import { tunedToText } from "./railCopy";

/**
 * The landing surface — search not yet run: the discovery rails. The preference strip, the
 * Current filters row (inherited chips, so the active preference layer is visible before any
 * search) and Browse by category are the SURFACE's since round 7 (2026-09-30), one instance each
 * for landing and results.
 *
 * The rails are generated from the preferences (Jason, 2026-10-07; `landingRails` has the
 * catalogue and its order): Picked for you · near the youth's place · the goal · up to three
 * interests · the time they have · paid · Featured · Latest. With no preference in play, today's
 * three: Featured · Latest opportunities · Done in under an hour. Each rail fetches its ONE search
 * as it nears the viewport and pages sideways (`DiscoveryRail`).
 */
export const DiscoveryLanding: React.FC<{
  now: Date;
}> = ({ now }) => {
  const { state, search, chips, fragments, lookups } = useDiscovery();

  // Picked for you shows while ANY preference applies; its subtitle names only what may be
  // named — never a private value — counts the rest, and falls back to the layer itself
  // (2026-10-03). Names keep their own case.
  const inherited = inheritedSummary(chips);
  const personalized = inherited.named.length + inherited.unnamed > 0;
  const tunedTo = tunedToText(inherited);

  const rails = landingRails({
    fragments,
    preferencesOff: state.preferencesOff,
    preferencesSkipped: state.preferencesSkipped,
    interestsSkipped: state.interestsSkipped,
    search,
    personalized,
    lookups,
  });

  return (
    <div className="flex flex-col gap-8 md:gap-10">
      {rails.map((rail) => (
        // Keyed on the search too: a rail whose search changes (a preference skipped) starts
        // afresh — its own page 1, its own reveal — never the previous search's cards.
        <DiscoveryRail
          key={`${rail.id}|${JSON.stringify(rail.search)}`}
          rail={rail}
          tunedTo={tunedTo}
          now={now}
        />
      ))}
    </div>
  );
};
