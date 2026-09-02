import React, { useEffect, useRef, useState } from "react";
import { IoOptionsOutline } from "react-icons/io5";
import { FILTER_SECTIONS } from "../../registry/filterSections";
import { useDiscovery } from "../../state/DiscoveryContext";
import { SectionPopover } from "./SectionPopover";

/**
 * The desktop segmented search bar — each segment opens ITS section alone as a popover beneath it
 * (the same `<FilterSection>` the dialog uses); the deep set lives behind the Filters button at
 * the bar's right end. Two doors, one filter state. There is deliberately no "search" button:
 * every change applies live, so the bar has nothing to submit.
 */
const SEGMENTS: { id: string; label: string }[] = [
  { id: "type", label: "What" },
  { id: "where", label: "Where" },
  { id: "time", label: "When" },
  { id: "pay", label: "Pay" },
];

export const SegmentedSearchBar: React.FC<{ onOpenFilters: () => void }> = ({
  onOpenFilters,
}) => {
  const { effectiveFilters, chips, lookups, resolveLabel } = useDiscovery();
  const [openSection, setOpenSection] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  // Close the open popover on any click outside the bar.
  useEffect(() => {
    if (!openSection) return;
    const onPointerDown = (e: MouseEvent): void => {
      if (!rootRef.current?.contains(e.target as Node)) setOpenSection(null);
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [openSection]);

  const summaryFor = (id: string): string => {
    // Effective filters, so preference-inherited values show as the segment values on landing.
    const filters = effectiveFilters;
    switch (id) {
      case "type":
        return filters.type
          ? (lookups.types.find((t) => t.name === filters.type)?.displayName ??
              filters.type)
          : "Any type";
      case "where": {
        if (filters.countries.length === 0) return "Anywhere";
        const first = resolveLabel("countries", filters.countries[0]!);
        const more = filters.countries.length - 1;
        return more > 0 ? `${first} +${more}` : first;
      }
      case "time":
        return filters.commitment
          ? `Up to ${filters.commitment.count} ${resolveLabel("commitment", filters.commitment.intervalId).toLowerCase()}`
          : "Any time";
      case "pay":
        return filters.hasReward || filters.zltoRanges.length > 0
          ? "With rewards"
          : "Any";
      default:
        return FILTER_SECTIONS.find((s) => s.id === id)?.label ?? id;
    }
  };

  return (
    <div ref={rootRef}>
      {/* text-black: the hero sets text-white, which made the segment values white-on-white */}
      <div className="shadow-custom flex items-center rounded-full bg-white p-1.5 text-black">
        {SEGMENTS.map((segment, index) => (
          <React.Fragment key={segment.id}>
            {index > 0 && <span className="bg-gray h-6 w-px" />}
            {/* Each segment is its own anchor: the popover opens beneath the clicked segment. */}
            <div className="relative flex grow">
              <button
                type="button"
                onClick={() =>
                  setOpenSection((current) =>
                    current === segment.id ? null : segment.id,
                  )
                }
                className={`hover:bg-gray-light flex min-h-10 grow flex-col items-start rounded-full px-4 py-1 text-left ${
                  openSection === segment.id ? "bg-gray-light" : ""
                }`}
              >
                <span className="text-gray-dark text-[10px] font-bold tracking-wide uppercase">
                  {segment.label}
                </span>
                <span className="max-w-32 truncate text-xs font-semibold">
                  {summaryFor(segment.id)}
                </span>
              </button>
              {openSection === segment.id && (
                <SectionPopover
                  sectionId={segment.id}
                  onClose={() => setOpenSection(null)}
                />
              )}
            </div>
          </React.Fragment>
        ))}
        <button
          type="button"
          onClick={() => {
            setOpenSection(null);
            onOpenFilters();
          }}
          className="bg-purple hover:bg-purple-shade flex min-h-10 shrink-0 items-center gap-1.5 rounded-full px-4 text-sm font-semibold text-white"
        >
          <IoOptionsOutline className="h-4 w-4" />
          Filters
          {chips.length > 0 && (
            <span className="text-purple flex h-5 w-5 items-center justify-center rounded-full bg-white text-xs">
              {chips.length}
            </span>
          )}
        </button>
      </div>
    </div>
  );
};
