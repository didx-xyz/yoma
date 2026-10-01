import React from "react";
import { IoClose, IoPersonOutline, IoSearchOutline } from "react-icons/io5";
import { useDiscovery } from "../../state/DiscoveryContext";

/**
 * The zero-results state (2026-10-01, Jason): a friendly card with a large way out instead of a
 * warning line and a second copy of the chips — the filters panel and the preference banner sit
 * right above it, so the chips are already one tap away.
 *
 * The way out matches what is narrowing the search: this search's own filters → Clear filters
 * (filters only, never the preferences — 2026-09-05); the preference layer → search without it
 * (the master switch: this search only, nothing saved). Both can show.
 */
export const NoMatches: React.FC = () => {
  const { state, dispatch, chips, hasFilters, clearFilters } = useDiscovery();
  const preferencesNarrowing =
    !state.preferencesOff && chips.some((c) => c.provenance === "inherited");

  let body = "Nothing matches this search. Try another word.";
  if (hasFilters)
    body =
      "Nothing fits everything you've picked. Clear your filters to see more — your preferences stay as they are.";
  else if (preferencesNarrowing)
    body =
      "Nothing fits your preferences right now. Try this search without them — they stay saved.";

  return (
    <div className="shadow-custom flex flex-col items-center gap-3 rounded-xl bg-white px-6 py-8 text-center md:py-12">
      <span className="bg-green-light text-green flex h-14 w-14 items-center justify-center rounded-full">
        <IoSearchOutline className="h-7 w-7" />
      </span>
      <h3 className="text-lg font-bold tracking-normal md:text-xl">
        No matches — yet
      </h3>
      <p className="text-gray-dark max-w-md text-sm">{body}</p>
      {(hasFilters || preferencesNarrowing) && (
        <div className="flex flex-wrap justify-center gap-3 pt-2">
          {hasFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="btn bg-green hover:bg-green-dark min-h-12 rounded-full border-none px-6 text-base font-semibold text-white"
            >
              <IoClose className="h-5 w-5" />
              Clear filters
            </button>
          )}
          {preferencesNarrowing && (
            <button
              type="button"
              onClick={() => dispatch({ kind: "setPreferencesOff", off: true })}
              className="btn border-purple text-purple hover:bg-purple-tint min-h-12 rounded-full bg-white px-6 text-base font-semibold"
            >
              <IoPersonOutline className="h-5 w-5" />
              Search without my preferences
            </button>
          )}
        </div>
      )}
    </div>
  );
};
