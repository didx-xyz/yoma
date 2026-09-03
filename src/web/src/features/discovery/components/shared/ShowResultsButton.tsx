import React from "react";
import { formatNumber } from "../../lib/format";

/**
 * The "Show N matches" action both filter footers share (sticky footer + segment popover).
 * While recounting, the previous number stays and only the white TEXT blurs — never a
 * swapped-in placeholder box on the purple button (the count-update pattern used everywhere);
 * the placeholder survives only for the very first load. `min-w` keeps the button from
 * resizing between the placeholder, short and long counts. Zero matches reads plainly as
 * "0 matches" — the results section carries the refine-your-search warning.
 */
export const ShowResultsButton: React.FC<{
  count: number | null;
  counting: boolean;
  onClick: () => void;
}> = ({ count, counting, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="btn bg-purple hover:bg-purple-shade min-h-11 min-w-44 rounded-full border-none px-6 text-white"
  >
    {count === null ? (
      <span className="bg-purple-soft inline-block h-4 w-16 animate-pulse rounded motion-reduce:animate-none" />
    ) : (
      <span
        className={`transition duration-300 motion-reduce:transition-none ${
          counting ? "opacity-70 blur-[2px]" : ""
        }`}
      >
        {count === 0
          ? "0 matches"
          : `Show ${formatNumber(count)} ${count === 1 ? "match" : "matches"}`}
      </span>
    )}
  </button>
);
