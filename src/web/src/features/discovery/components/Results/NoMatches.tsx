import React from "react";
import { IoClose, IoPersonOutline, IoSearchOutline } from "react-icons/io5";
import { hasActiveFilters } from "../../lib/types";
import { useDiscovery } from "../../state/DiscoveryContext";

const SOLID_GREEN =
  "btn bg-green hover:bg-green-dark min-h-12 rounded-full border-none px-6 text-base font-semibold text-white";

/**
 * The zero-results state (2026-10-01, Jason): a friendly card with a large way out instead of a
 * warning line and a second copy of the chips — the filters panel and the preference banner sit
 * right above it, so the chips are already one tap away.
 *
 * Round 10 (2026-10-02) tells three cases apart, by what is narrowing the search:
 *
 *   preferences — the inherited layer applies: search without it (the master switch, this search
 *                 only, purple like every preference control), then the session's own way out;
 *   filters     — this search set filters of its own (± a word): Clear filters, which clears
 *                 the word too and never the preferences (2026-09-05);
 *   word        — a word alone: Clear search.
 *
 * A clear action shows only while there is something for it to clear (2026-09-05).
 */
export const NoMatches: React.FC = () => {
  const { state, dispatch, chips, clearFilters } = useDiscovery();
  const word = state.filters.q;
  const manualFilters = hasActiveFilters({ ...state.filters, q: null });
  const preferencesNarrowing =
    !state.preferencesOff && chips.some((c) => c.provenance === "inherited");

  const clearSearch = (): void =>
    dispatch({ kind: "patchFilters", patch: { q: null } });

  // Nothing narrows the search at all (an empty catalogue): no title names a cause, no button.
  let title = "No matches — yet";
  let body = "Nothing matches this search.";
  if (preferencesNarrowing) {
    title = "No matches in your feed";
    body =
      "Your preferences may be too narrow for this search. Try it without them — nothing is changed in your profile.";
  } else if (manualFilters) {
    title = "No matches with these filters";
    body =
      "Remove a filter or two, or clear them all — your preferences stay as they are.";
  } else if (word) {
    title = `No matches for “${word}”`;
    body = "Check the spelling, or try a shorter or broader word.";
  }

  const clearFiltersButton = (
    <button type="button" onClick={clearFilters} className={SOLID_GREEN}>
      <IoClose className="h-5 w-5" />
      Clear filters
    </button>
  );
  const clearSearchButton = (
    <button type="button" onClick={clearSearch} className={SOLID_GREEN}>
      <IoClose className="h-5 w-5" />
      Clear search
    </button>
  );

  let buttons: React.ReactNode = null;
  if (preferencesNarrowing)
    buttons = (
      <>
        <button
          type="button"
          onClick={() => dispatch({ kind: "setPreferencesOff", off: true })}
          className="btn border-purple text-purple hover:bg-purple-tint min-h-12 rounded-full bg-white px-6 text-base font-semibold"
        >
          <IoPersonOutline className="h-5 w-5" />
          Search without my preferences
        </button>
        {manualFilters ? clearFiltersButton : word && clearSearchButton}
      </>
    );
  else if (manualFilters) buttons = clearFiltersButton;
  else if (word) buttons = clearSearchButton;

  return (
    <div className="shadow-custom flex flex-col items-center gap-3 rounded-xl bg-white px-6 py-8 text-center md:py-12">
      <span className="bg-green-light text-green flex h-14 w-14 items-center justify-center rounded-full">
        <IoSearchOutline className="h-7 w-7" />
      </span>
      {/* The title can quote a long word, so it may break inside one. */}
      <h3 className="max-w-full text-lg font-bold tracking-normal wrap-break-word md:text-xl">
        {title}
      </h3>
      <p className="text-gray-dark max-w-md text-sm">{body}</p>
      {buttons && (
        <div className="flex flex-wrap justify-center gap-3 pt-2">
          {buttons}
        </div>
      )}
    </div>
  );
};
