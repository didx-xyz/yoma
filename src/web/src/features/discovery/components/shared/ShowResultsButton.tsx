import React from "react";
import { formatNumber } from "../../lib/format";

/**
 * The "Show N matches" action both filter footers share (sticky footer + segment popover).
 * While recounting, the previous number stays and only the white TEXT blurs — never a
 * swapped-in placeholder box on the purple button (the count-update pattern used everywhere).
 * `min-w` keeps the button from resizing between short and long counts. Zero matches reads
 * plainly as "0 matches" — the results section carries the way out.
 *
 * With no number to show — the first load, or a count request that failed — the button says
 * "Show results" and still works. It never shimmers a number that may not arrive.
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
    <span
      className={`transition duration-300 motion-reduce:transition-none ${
        counting && count !== null ? "opacity-70 blur-[2px]" : ""
      }`}
    >
      {count === null && "Show results"}
      {count === 0 && "0 matches"}
      {count !== null &&
        count > 0 &&
        `Show ${formatNumber(count)} ${count === 1 ? "match" : "matches"}`}
    </span>
  </button>
);
