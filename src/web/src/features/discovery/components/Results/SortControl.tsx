import React from "react";
import { visibleSortOptions } from "../../lib/resultsOrder";
import type { DiscoverySort } from "../../lib/types";

/**
 * Sort — Newest · Ending soonest · Most ZLTO, all live since the revised search contract
 * (2026-10-03; the request mapping is `searchRequest.ts`). A segmented control in the view
 * toggle's family: the same container, the same selected look, so the two read as one set of
 * controls (`ViewToggle`).
 *
 * Below `md` each segment is a 44px touch target and the segments share the row; from `md` they
 * take the toggle's height. Most ZLTO is hidden on a Jobs-only search unless it is already the
 * sort (`visibleSortOptions`); the results header then says why the order looks as it does.
 * Motion: the colour change only, off under `motion-reduce`.
 */
export const SortControl: React.FC<{
  sort: DiscoverySort;
  /** The effective types — Most ZLTO's Jobs-only rule reads them. */
  types: string[];
  onChange: (sort: DiscoverySort) => void;
  className?: string;
}> = ({ sort, types, onChange, className = "" }) => (
  <div className={`flex items-center gap-2 ${className}`}>
    <span className="text-gray-dark text-xs">Sort</span>
    <div
      role="group"
      aria-label="Sort results"
      className="border-gray flex grow items-center rounded-full border bg-white p-0.5 sm:grow-0"
    >
      {visibleSortOptions(types, sort).map((option) => (
        <button
          key={option.id}
          type="button"
          aria-pressed={sort === option.id}
          onClick={() => {
            if (sort !== option.id) onChange(option.id);
          }}
          className={`min-h-11 flex-auto rounded-full px-3 text-xs whitespace-nowrap transition-colors duration-150 motion-reduce:transition-none md:min-h-0 md:flex-none md:py-1.5 ${
            sort === option.id
              ? "bg-purple font-semibold text-white"
              : "text-gray-dark"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  </div>
);
