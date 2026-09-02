import React, { useRef, useState } from "react";
import {
  IoAddCircleOutline,
  IoChevronDown,
  IoSearchOutline,
} from "react-icons/io5";
import { FILTER_SECTIONS } from "../../registry/filterSections";
import { useDiscovery } from "../../state/DiscoveryContext";
import { QuickSearchRow } from "../Discover/QuickSearchRow";
import { FilterSection } from "./FilterSection";
import { PreferencesBlock } from "./PreferencesBlock";
import { RecentSearchesPanel } from "./RecentSearches";
import { TypeRow } from "./TypeRow";
import { TypeSpecificFilters } from "./TypeSpecificFilters";

/**
 * Blocks 1–6 of the filter surface, in the one order both breakpoints must render:
 * search input (with recents as a typeahead beneath it) · quick searches · your preferences ·
 * type row · type-specific filters · the sections (primary seven, then Skills / SDGs / Provider
 * behind one "More filters" disclosure). The desktop dialog and the mobile sheet are CONTAINERS
 * around this component — they may differ in chrome and density, never in the set or the order.
 * (Block 7, the sticky footer, is container chrome.)
 */
export const FilterPanelBlocks: React.FC<{ onEditPreferences: () => void }> = ({
  onEditPreferences,
}) => {
  const { state, dispatch } = useDiscovery();
  // Transient input draft; the URL stays the source of truth and is committed on Enter/blur.
  const [draft, setDraft] = useState(state.filters.q ?? "");
  const [inputFocused, setInputFocused] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);
  const commit = (): void => {
    const q = draft.trim() === "" ? null : draft.trim();
    if (q !== state.filters.q) dispatch({ kind: "patchFilters", patch: { q } });
  };

  const toggleMore = (): void => {
    const opening = !moreOpen;
    setMoreOpen(opening);
    // Bring the newly revealed sections into view once they've rendered.
    if (opening)
      requestAnimationFrame(() =>
        moreRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
        }),
      );
  };

  const primary = FILTER_SECTIONS.filter((s) => s.group === "primary");
  const more = FILTER_SECTIONS.filter((s) => s.group === "more");

  return (
    <div className="flex flex-col gap-4" data-testid="filter-panel-blocks">
      <div className="relative">
        <label className="input input-bordered flex h-11 items-center gap-2 rounded-full">
          <IoSearchOutline className="text-gray-dark h-5 w-5" />
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onFocus={() => setInputFocused(true)}
            onBlur={() => {
              setInputFocused(false);
              commit();
            }}
            onKeyDown={(e) => e.key === "Enter" && commit()}
            placeholder="Search titles, summaries and keywords…"
            className="grow"
            aria-label="Search opportunities"
          />
        </label>
        {inputFocused && <RecentSearchesPanel />}
      </div>

      <section>
        <h3 className="text-gray-dark pb-2 text-xs font-bold tracking-wide uppercase">
          Quick searches
        </h3>
        <QuickSearchRow />
      </section>

      <PreferencesBlock onEdit={onEditPreferences} />

      <TypeRow />

      {/* Type-specific filters sit inside the section list so they read as one contiguous set. */}
      <div>
        <TypeSpecificFilters />
        {primary.map((section) => (
          <FilterSection key={section.id} section={section} />
        ))}
        <button
          type="button"
          onClick={toggleMore}
          aria-expanded={moreOpen}
          className="flex min-h-11 w-full items-center gap-3 py-2 text-left text-sm font-semibold"
        >
          <IoAddCircleOutline className="text-gray-dark h-4 w-4 shrink-0" />
          <span>More filters</span>
          <span className="text-gray-dark text-xs font-normal">
            {more.map((s) => s.label).join(" · ")}
          </span>
          <IoChevronDown
            className={`ml-auto h-4 w-4 transition-transform motion-reduce:transition-none ${moreOpen ? "rotate-180" : ""}`}
          />
        </button>
        <div ref={moreRef}>
          {moreOpen &&
            more.map((section) => (
              <FilterSection key={section.id} section={section} />
            ))}
        </div>
      </div>
    </div>
  );
};
