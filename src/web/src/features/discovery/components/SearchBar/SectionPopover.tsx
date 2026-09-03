import React from "react";
import type { FilterSectionBinding } from "../../registry/filterSections";
import { FILTER_SECTIONS } from "../../registry/filterSections";
import type { DiscoveryFilters } from "../../lib/types";
import { useDiscovery } from "../../state/DiscoveryContext";
import { FilterSection } from "../Filters/FilterSection";
import { RecentSearchesPanel } from "../Filters/RecentSearches";
import { TypeRow } from "../Filters/TypeRow";
import { FreeTextSearchInput } from "../shared/FreeTextSearchInput";
import { ShowResultsButton } from "../shared/ShowResultsButton";

const RESET_PATCHES: Record<FilterSectionBinding, Partial<DiscoveryFilters>> = {
  categories: { categories: [] },
  countries: { countries: [] },
  engagementTypes: { engagementTypes: [] },
  commitment: { commitment: null },
  zlto: { hasReward: null, zltoRanges: [] },
  languages: { languages: [] },
  providers: { providers: [] },
};

/**
 * One section opened alone, anchored beneath its search-bar segment — the same `<FilterSection>`
 * the dialog renders, so a section has two homes but one implementation. Two segments are not
 * registry sections: "type" opens the type row (block 5) and "search" opens the free-text input
 * with the recent searches beneath it (block 1).
 */
export const SectionPopover: React.FC<{
  /** A registry section id, or "type" / "search" for blocks 5 and 1. */
  sectionId: string;
  /** Anchor to the segment's right edge instead of its left (the bar's last segment). */
  alignRight?: boolean;
  onClose: () => void;
}> = ({ sectionId, alignRight = false, onClose }) => {
  const { count, counting, dispatch, scrollToResults } = useDiscovery();
  const section = FILTER_SECTIONS.find((s) => s.id === sectionId);

  const reset = (): void => {
    if (sectionId === "type")
      dispatch({
        kind: "patchFilters",
        patch: { types: [], customFields: [] },
      });
    else if (sectionId === "search")
      dispatch({ kind: "patchFilters", patch: { q: null } });
    else if (section?.binding)
      dispatch({ kind: "patchFilters", patch: RESET_PATCHES[section.binding] });
    onClose();
  };

  // Every popover opens with the section's question as its title — the type row's own header
  // (icon + divider chrome) is suppressed here so all five popovers share one title style.
  let title: string | null = null;
  let body: React.ReactNode;
  if (sectionId === "search") {
    title = "What are you looking for?";
    body = <SearchBody />;
  } else if (sectionId === "type") {
    title = "What type of opportunity?";
    body = <TypeRow hideHeader />;
  } else {
    title = section?.question ?? section?.label ?? null;
    body = section && <FilterSection section={section} alwaysOpen />;
  }

  return (
    <div
      className={`shadow-custom absolute top-full z-40 mt-3 w-[min(560px,calc(100vw-2rem))] rounded-2xl bg-white p-4 text-black ${
        alignRight ? "right-0" : "left-0"
      }`}
    >
      {title && (
        <h3 className="pb-2 text-sm font-semibold tracking-normal">{title}</h3>
      )}
      {body}
      <div className="flex items-center justify-between pt-3">
        <button
          type="button"
          onClick={reset}
          className="text-purple min-h-11 text-sm font-semibold underline"
        >
          {sectionId === "type" ? "Any type" : "Reset"}
        </button>
        <ShowResultsButton
          count={count}
          counting={counting}
          onClick={() => {
            onClose();
            scrollToResults();
          }}
        />
      </div>
    </div>
  );
};

/** Block 1 in popover form: the free-text input with the recent searches inline beneath it. */
const SearchBody: React.FC = () => {
  const { state, dispatch } = useDiscovery();

  return (
    <div className="flex flex-col gap-2">
      <FreeTextSearchInput
        initial={state.filters.q}
        onCommit={(q) => dispatch({ kind: "patchFilters", patch: { q } })}
        autoFocus
      />
      <RecentSearchesPanel variant="inline" />
    </div>
  );
};
