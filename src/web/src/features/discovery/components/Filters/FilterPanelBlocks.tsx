import React, { useRef, useState } from "react";
import { IoAddCircleOutline, IoFlashOutline } from "react-icons/io5";
import { FILTER_SECTIONS } from "../../registry/filterSections";
import { useDiscovery } from "../../state/DiscoveryContext";
import { QuickSearchRow } from "../Discover/QuickSearchRow";
import { FreeTextSearchInput } from "../shared/FreeTextSearchInput";
import { FilterSection } from "./FilterSection";
import { PreferencesBlock } from "./PreferencesBlock";
import { RecentSearchesPanel } from "./RecentSearches";
import { SectionHeader } from "./SectionHeader";
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
  const [inputFocused, setInputFocused] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

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
    // 24px between blocks — the panel's one vertical rhythm (the section list inside block 6
    // runs contiguous with dividers instead, by design).
    <div className="flex flex-col gap-6" data-testid="filter-panel-blocks">
      <div className="relative">
        <FreeTextSearchInput
          initial={state.filters.q}
          onCommit={(q) => dispatch({ kind: "patchFilters", patch: { q } })}
          onFocusChange={setInputFocused}
        />
        {inputFocused && <RecentSearchesPanel />}
      </div>

      <section>
        <div className="flex items-center gap-3 pb-3">
          <IoFlashOutline className="text-gray-dark h-5 w-5 shrink-0" />
          <h3 className="text-[15px] font-semibold">Quick searches</h3>
        </div>
        <QuickSearchRow />
      </section>

      <PreferencesBlock onEdit={onEditPreferences} />

      {/* The type row and the type-specific filters sit inside the section list so the whole
          filter surface reads as one contiguous set with shared dividers. */}
      <div>
        <TypeRow />
        <TypeSpecificFilters />
        {primary.map((section) => (
          <FilterSection key={section.id} section={section} />
        ))}
        <SectionHeader
          icon={IoAddCircleOutline}
          label="More filters"
          value={more.map((s) => s.label).join(" · ")}
          expanded={moreOpen}
          onToggle={toggleMore}
        />
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
