import React from "react";
import type { DiscoverySort } from "../../lib/types";

/**
 * Sort — exactly Newest · Ending soonest · Most ZLTO; there is deliberately no "Best match"
 * (nothing server-side computes relevance). The search API currently orders by DateCreated only
 * (`OrderInstructions` is internal), so the other two ship visible but unavailable — flagged to
 * the API side — rather than lying about the order.
 *
 * Two of three pills being dead is a poor use of a 390px row, so below `md` the unavailable ones
 * collapse into one disabled "More sorts soon" pill: the same honesty, a third of the width.
 * Desktop keeps the full row with the note on hover.
 */
const OPTIONS: { id: DiscoverySort; label: string; available: boolean }[] = [
  { id: "newest", label: "Newest", available: true },
  { id: "endingSoonest", label: "Ending soonest", available: false },
  { id: "mostZlto", label: "Most ZLTO", available: false },
];

const SOON_NOTE =
  "Coming soon — the search API doesn't offer this ordering yet.";

const PILL = "flex min-h-9 items-center rounded-full px-3 text-xs";

const sortPillClassFor = (selected: boolean, available: boolean): string => {
  if (selected) return "bg-purple font-semibold text-white";
  if (available) return "hover:bg-gray-light bg-white text-black";
  return "text-gray-dark bg-white opacity-50";
};

export const SortControl: React.FC<{
  sort: DiscoverySort;
  onChange: (sort: DiscoverySort) => void;
}> = ({ sort, onChange }) => (
  <div className="flex items-center gap-1">
    <span className="text-gray-dark pr-1 text-xs">Sort</span>
    {OPTIONS.map((option) => (
      <button
        key={option.id}
        type="button"
        disabled={!option.available}
        title={option.available ? undefined : SOON_NOTE}
        onClick={() => onChange(option.id)}
        className={`${PILL} ${option.available ? "" : "hidden md:flex"} ${sortPillClassFor(
          sort === option.id,
          option.available,
        )}`}
      >
        {option.label}
      </button>
    ))}
    <button
      type="button"
      disabled
      title={SOON_NOTE}
      className={`${PILL} text-gray-dark bg-white opacity-50 md:hidden`}
    >
      More sorts soon
    </button>
  </div>
);
