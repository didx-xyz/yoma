import React from "react";
import { formatNumber } from "../../lib/format";
import type { FilterSectionBinding } from "../../registry/filterSections";
import { FILTER_SECTIONS } from "../../registry/filterSections";
import type { DiscoveryFilters } from "../../lib/types";
import { useDiscovery } from "../../state/DiscoveryContext";
import { FilterSection } from "../Filters/FilterSection";
import { TypeRow } from "../Filters/TypeRow";

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
 * the dialog renders, so a section has two homes but one implementation. "What" opens the type
 * row, which is block 5 rather than one of the eleven sections.
 */
export const SectionPopover: React.FC<{
  /** A registry section id, or "type" for the type row (block 5). */
  sectionId: string;
  onClose: () => void;
}> = ({ sectionId, onClose }) => {
  const { count, counting, dispatch } = useDiscovery();
  const section = FILTER_SECTIONS.find((s) => s.id === sectionId);

  return (
    <div className="shadow-custom absolute top-full left-0 z-40 mt-3 w-[min(560px,calc(100vw-2rem))] rounded-2xl bg-white p-4 text-black">
      {sectionId === "type" ? (
        <TypeRow />
      ) : (
        section && <FilterSection section={section} alwaysOpen />
      )}
      <div className="flex items-center justify-between pt-3">
        <button
          type="button"
          onClick={() => {
            if (sectionId === "type") dispatch({ kind: "setType", type: null });
            else if (section?.binding)
              dispatch({
                kind: "patchFilters",
                patch: RESET_PATCHES[section.binding],
              });
            onClose();
          }}
          className="text-purple min-h-11 text-sm font-semibold underline"
        >
          {sectionId === "type" ? "Any type" : "Reset"}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="btn bg-purple hover:bg-purple-shade min-h-11 rounded-full border-none px-5 text-white"
        >
          {counting || count === null ? (
            <span className="bg-purple-soft inline-block h-4 w-14 animate-pulse rounded motion-reduce:animate-none" />
          ) : (
            <>Show {formatNumber(count)} results</>
          )}
        </button>
      </div>
    </div>
  );
};
