import React, { useEffect, useRef, useState } from "react";
import { IoOptionsOutline } from "react-icons/io5";
import { whereSummary } from "../../lib/location";
import {
  SEGMENT_TONE_DOT,
  SEGMENT_TONE_TEXT,
  segmentTone,
  type SegmentId,
} from "../../lib/segmentTone";
import { FILTER_SECTIONS, iconForSegment } from "../../registry/filterSections";
import { useDiscovery } from "../../state/DiscoveryContext";
import { SectionPopover } from "./SectionPopover";

/**
 * The desktop segmented search bar — each segment opens ITS section alone as a popover beneath it
 * (the same `<FilterSection>` the dialog uses); the deep set lives behind the Filters button at
 * the bar's right end. Two doors, one filter state. There is deliberately no "search" button:
 * every change applies live, so the bar has nothing to submit.
 *
 * Popovers anchor left under their segment, except the LAST segment's, which anchors right —
 * its left edge would otherwise push the 560px panel off the right of the viewport.
 *
 * SEARCH · WHAT · WHERE · HOW · REQUIREMENTS (2026-10-09, Jason): How is How long and
 * Engagement, Requirements is Language and Accessibility, each one combined section
 * (`FILTER_GROUPS`), as in the Filters dialog. The segment id is the group's, so the popover
 * reuses the group definition — one definition, two homes.
 *
 * Round 7 colour rule (2026-09-30): a segment's value is green with a dot when this search set
 * it, purple when the preferences supply it, grey when empty (`lib/segmentTone.ts`); the Filters
 * button and its count are green.
 */
const SEGMENTS: { id: SegmentId; label: string }[] = [
  { id: "search", label: "Search" },
  { id: "type", label: "What" },
  { id: "where", label: "Where" },
  { id: "how", label: "How" },
  { id: "requirements", label: "Requirements" },
];

export const SegmentedSearchBar: React.FC<{ onOpenFilters: () => void }> = ({
  onOpenFilters,
}) => {
  const { state, effectiveFilters, filterCount, resolveLabel } = useDiscovery();

  /** "English" · "English +1" — the first value's name, then a count. */
  const firstPlus = (
    facet: "engagementTypes" | "languages",
    values: string[],
  ): string | null => {
    if (values.length === 0) return null;
    const first = resolveLabel(facet, values[0]!);
    return values.length > 1 ? `${first} +${values.length - 1}` : first;
  };
  const [openSection, setOpenSection] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  // Close the open popover on any click outside the bar, or on Escape.
  useEffect(() => {
    if (!openSection) return;
    const onPointerDown = (e: MouseEvent): void => {
      const target = e.target as Element;
      // A react-select menu is portalled to <body> (the type-specific filters in WHAT): picking
      // from it is still inside the popover. Its list and options carry `react-select-…` ids.
      if (target.closest?.('[id^="react-select-"]')) return;
      if (!rootRef.current?.contains(target)) setOpenSection(null);
    };
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === "Escape") setOpenSection(null);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [openSection]);

  const summaryFor = (id: string): string => {
    // Effective filters, so preference-inherited values show as the segment values on landing.
    const filters = effectiveFilters;
    switch (id) {
      case "search":
        return filters.q ?? "Anything";
      case "type": {
        if (filters.types.length === 0) return "Any type";
        const first = resolveLabel("types", filters.types[0]!);
        const more = filters.types.length - 1;
        const typesText = more > 0 ? `${first} +${more}` : first;
        // Its type-specific filters set from WHAT since 2026-10-09: "Job · 2 filters".
        const clauses = new Set(filters.customFields.map((c) => c.key)).size;
        return clauses > 0
          ? `${typesText} · ${clauses} ${clauses === 1 ? "filter" : "filters"}`
          : typesText;
      }
      case "where":
        // Most specific first — "25 km of Cape Town", "Cape Town", "Western Cape", "South Africa +1".
        return (
          whereSummary(filters, (id) => resolveLabel("countries", id)) ??
          "Anywhere"
        );
      case "time":
        return filters.commitment
          ? `Up to ${filters.commitment.count} ${resolveLabel("commitment", filters.commitment.intervalId).toLowerCase()}`
          : "Any time";
      case "engagement": {
        // "Any" · one value · "Remote +1" — through resolveLabel, so the engagement display map
        // (Online → Remote, Offline → On-site) applies here as everywhere.
        if (filters.engagementTypes.length === 0) return "Any";
        const first = resolveLabel(
          "engagementTypes",
          filters.engagementTypes[0]!,
        );
        const more = filters.engagementTypes.length - 1;
        return more > 0 ? `${first} +${more}` : first;
      }
      case "how": {
        const parts = [
          filters.commitment ? summaryFor("time") : null,
          firstPlus("engagementTypes", filters.engagementTypes),
        ].filter(Boolean);
        return parts.length > 0 ? parts.join(" · ") : "Any";
      }
      case "requirements": {
        // The inherited needs are private (2026-10-03): never named, never counted on their own.
        const own = state.filters.accommodations.length;
        const inherited = filters.accommodations.filter(
          (id) => !state.filters.accommodations.includes(id),
        ).length;
        const needs =
          inherited > 0
            ? own > 0
              ? `Your needs +${own}`
              : "Your needs"
            : own > 0
              ? `${own} ${own === 1 ? "need" : "needs"}`
              : null;
        const parts = [firstPlus("languages", filters.languages), needs].filter(
          Boolean,
        );
        return parts.length > 0 ? parts.join(" · ") : "Any";
      }
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
                {/* The section's own icon, as in the Filters dialog (2026-10-09). */}
                <span className="text-gray-dark flex items-center gap-1.5 text-[10px] font-bold tracking-wide uppercase">
                  {React.createElement(iconForSegment(segment.id), {
                    className: "h-3.5 w-3.5 shrink-0",
                    "aria-hidden": true,
                  })}
                  {segment.label}
                </span>
                {(() => {
                  const tone = segmentTone(
                    state.filters,
                    effectiveFilters,
                    segment.id,
                  );
                  const dot = SEGMENT_TONE_DOT[tone];
                  return (
                    <span
                      className={`flex max-w-32 items-center gap-1.5 text-xs font-semibold ${SEGMENT_TONE_TEXT[tone]}`}
                    >
                      {dot && (
                        <span
                          className={`h-1.5 w-1.5 shrink-0 rounded-full ${dot}`}
                        />
                      )}
                      <span className="truncate">{summaryFor(segment.id)}</span>
                    </span>
                  );
                })()}
              </button>
              {openSection === segment.id && (
                <SectionPopover
                  sectionId={segment.id}
                  alignRight={index === SEGMENTS.length - 1}
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
          className="bg-green hover:bg-green-dark flex min-h-10 shrink-0 items-center gap-1.5 rounded-full px-4 text-sm font-semibold text-white"
        >
          <IoOptionsOutline className="h-4 w-4" />
          Filters
          {filterCount > 0 && (
            <span className="text-green flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1 text-xs">
              {filterCount}
            </span>
          )}
        </button>
      </div>
    </div>
  );
};
