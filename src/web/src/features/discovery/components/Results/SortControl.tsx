import React from "react";
import type { DiscoverySort } from "../../lib/types";

/**
 * Sort — exactly Newest · Ending soonest · Most ZLTO; there is deliberately no "Best match"
 * (nothing server-side computes relevance). The search API currently orders by DateCreated only
 * (`OrderInstructions` is internal), so the other two ship visible but unavailable — flagged to
 * the API side — rather than lying about the order.
 */
const OPTIONS: { id: DiscoverySort; label: string; available: boolean }[] = [
  { id: "newest", label: "Newest", available: true },
  { id: "endingSoonest", label: "Ending soonest", available: false },
  { id: "mostZlto", label: "Most ZLTO", available: false },
];

const SOON_NOTE =
  "Coming soon — the search API doesn't offer this ordering yet.";

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
        className={`rounded-full px-3 py-1.5 text-xs ${sortPillClassFor(sort === option.id, option.available)}`}
      >
        {option.label}
      </button>
    ))}
  </div>
);
