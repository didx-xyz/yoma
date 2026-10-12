import React from "react";
import type { FilterSectionBinding } from "../../registry/filterSections";
import {
  FILTER_GROUPS,
  FILTER_SECTIONS,
  iconForSegment,
  TYPE_ROW_HINT,
  TYPE_ROW_QUESTION,
} from "../../registry/filterSections";
import type { DiscoveryFilters } from "../../lib/types";
import { useDiscovery } from "../../state/DiscoveryContext";
import { FilterSection } from "../Filters/FilterSection";
import { FilterSectionGroup } from "../Filters/FilterSectionGroup";
import { RecentSearchesPanel } from "../Filters/RecentSearches";
import { TypeRow } from "../Filters/TypeRow";
import { TypeFiltersBlock } from "../Filters/TypeSpecificFilters";
import { FreeTextSearchInput } from "../shared/FreeTextSearchInput";
import { ShowResultsButton } from "../shared/ShowResultsButton";

const RESET_PATCHES: Record<FilterSectionBinding, Partial<DiscoveryFilters>> = {
  categories: { categories: [] },
  countries: { countries: [] },
  engagementTypes: { engagementTypes: [] },
  commitment: { commitment: null },
  zlto: { incentivized: null, hasReward: null, zltoRanges: [] },
  languages: { languages: [] },
  accommodations: { accommodations: [] },
  sdgs: { sdgs: [] },
  provider: { provider: null },
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
  // "how" and "requirements" are combined sections (2026-10-09): both parts, reset together.
  const group = FILTER_GROUPS.find((g) => g.id === sectionId);

  const reset = (): void => {
    // The reducer's clause rule decides which custom-field clauses leave with the cleared types:
    // an inherited type stays in effect, and so do its clauses.
    // The type takes its own filters with it (the reducer's clause rule); the shared ones, which
    // can be set with no type, go too: Reset empties the whole section.
    if (sectionId === "type")
      dispatch({
        kind: "patchFilters",
        patch: { types: [], customFields: [] },
      });
    else if (sectionId === "search")
      dispatch({ kind: "patchFilters", patch: { q: null } });
    else if (group)
      dispatch({
        kind: "patchFilters",
        patch: Object.assign(
          {},
          ...group.parts.map((id) => {
            const binding = FILTER_SECTIONS.find((s) => s.id === id)?.binding;
            return binding ? RESET_PATCHES[binding] : {};
          }),
        ),
      });
    else if (section?.binding)
      dispatch({ kind: "patchFilters", patch: RESET_PATCHES[section.binding] });
    onClose();
  };

  // Every popover opens with one header (2026-10-09): the section's icon, its question, and a
  // line on what it covers where there is one. The body and the actions sit in their own bands
  // below, divided. The type row's own header is suppressed here, as is a section's.
  let title: string | null = null;
  let subtitle: string | null = null;
  let body: React.ReactNode;
  if (sectionId === "search") {
    title = "What are you looking for?";
    body = <SearchBody />;
  } else if (sectionId === "type") {
    title = TYPE_ROW_QUESTION;
    subtitle = TYPE_ROW_HINT;
    body = (
      <>
        <TypeRow bare />
        <TypeFiltersBlock />
      </>
    );
  } else if (group) {
    title = group.question;
    subtitle = group.description;
    body = <FilterSectionGroup group={group} alwaysOpen />;
  } else {
    title = section?.question ?? section?.label ?? null;
    body = section && <FilterSection section={section} alwaysOpen />;
  }

  const Icon = iconForSegment(sectionId);

  return (
    // Mounted per segment by the bar, so switching segments mounts a new one, which rises in
    // (2026-10-09): 180ms, a fade alone under reduced motion.
    <div
      className={`shadow-custom absolute top-full z-40 mt-3 w-[min(560px,calc(100vw-2rem))] rounded-2xl bg-white p-4 text-black motion-safe:animate-[rise-in_180ms_ease-out_both] motion-reduce:animate-[fade-in_120ms_ease-out_both] ${
        alignRight ? "right-0" : "left-0"
      }`}
    >
      {title && (
        <div className="flex items-start gap-3 pb-3">
          <span
            aria-hidden
            className="bg-green-light text-green flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
          >
            <Icon className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold tracking-normal">{title}</h3>
            {subtitle && (
              <p className="text-gray-dark text-[13px] leading-snug">
                {subtitle}
              </p>
            )}
          </div>
        </div>
      )}
      <div className="border-gray border-t pt-3">{body}</div>
      <div className="border-gray mt-3 flex items-center justify-between border-t pt-3">
        <button
          type="button"
          onClick={reset}
          className="text-purple min-h-11 text-sm font-semibold underline"
        >
          Reset
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
