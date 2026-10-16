import React, { useRef, useState } from "react";
import type { FilterSectionDef } from "../../registry/filterSections";
import { FACET_FOR_BINDING } from "../../registry/filterSections";
import { useDiscovery } from "../../state/DiscoveryContext";
import { Badge } from "../shared/Badge";
import { Message } from "../shared/Message";
import { FilterControl } from "./FilterControl";
import { SectionHeader } from "./SectionHeader";
import type { SectionModel } from "./useSectionModel";
import { useSectionModel } from "./useSectionModel";

/**
 * Whether this section is ACTUALLY receiving an inherited value right now — what its
 * "FROM PREFERENCES" badge states. A permanent badge on an empty section would be a false claim.
 */
export function useInheritedActive(section: FilterSectionDef): boolean {
  const { state, fragments } = useDiscovery();
  const facet = section.binding ? FACET_FOR_BINDING[section.binding] : null;
  return (
    facet !== null &&
    !state.preferencesOff &&
    Object.entries(fragments).some(
      ([key, fragment]) =>
        !state.preferencesSkipped.includes(
          key as (typeof state.preferencesSkipped)[number],
        ) && fragment[facet] !== undefined,
    )
  );
}

/**
 * A section's open body: the hint (where there is no header to carry it), the control and the
 * missing-data rule. Shared by the single section and the combined one (`FilterSectionGroup`).
 */
export const FilterSectionBody: React.FC<{
  section: FilterSectionDef;
  model: SectionModel;
  /** No header above it (a popover, or a part of a combined section): the hint goes here. */
  showHint: boolean;
  largeSearch: boolean;
}> = ({ section, model, showHint, largeSearch }) => {
  const { lookups } = useDiscovery();
  return (
    <>
      {showHint && section.hint && (
        <p className="text-gray-dark text-[13px] leading-snug">
          {section.hint}
        </p>
      )}
      <FilterControl
        section={section}
        model={model}
        largeSearch={largeSearch}
        onRetry={lookups.retry}
      />
      {/* The null rule describes what the filter DOES; it has nothing to say when the options
          never arrived. A section with no API facet yet still states its rule — the BA asked for
          one line per section, and the line is what the youth will get. */}
      {section.nullRule &&
        (section.binding === null || model.status === "ok") && (
          <Message>{section.nullRule}</Message>
        )}
    </>
  );
};

/**
 * One universal section — header row (icon, label, live summary, badges, chevron) expanding in
 * place. The SAME component serves the desktop dialog, the mobile sheet and the standalone
 * popover: one section, all its homes. Collapsed by default UNLESS the section already carries a
 * selection (a hidden active filter reads as a broken page) — except the inherited accessibility
 * needs alone, which are private and stay collapsed until opened (2026-10-03); the header still
 * says they apply. Collapsed state is UI-only and never touches the query.
 */
export const FilterSection: React.FC<{
  section: FilterSectionDef;
  /** Popover home renders the section already open with no collapse chrome. */
  alwaysOpen?: boolean;
}> = ({ section, alwaysOpen = false }) => {
  const model = useSectionModel(section);
  const inheritedActive = useInheritedActive(section);
  const [open, setOpen] = useState(
    () => model.selected.length > 0 && !model.startCollapsed,
  );
  const contentRef = useRef<HTMLDivElement>(null);
  // No search facet yet (Skills): a disabled row that never opens, its caption always shown.
  const disabled = section.binding === null;
  const expanded = alwaysOpen || (open && !disabled);

  const toggleOpen = (): void => {
    const opening = !open;
    setOpen(opening);
    // Bring the revealed controls into view once they've rendered.
    if (opening)
      requestAnimationFrame(() =>
        contentRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
        }),
      );
  };

  return (
    <section className="border-gray border-b py-1">
      {!alwaysOpen && (
        <SectionHeader
          icon={section.icon}
          label={section.label}
          value={model.summary}
          subtitle={expanded || disabled ? section.hint : null}
          expanded={expanded}
          onToggle={toggleOpen}
          disabled={disabled}
          badges={
            inheritedActive && (
              <Badge
                intent="provenance"
                title="This comes from your preferences"
              >
                FROM PREFERENCES
              </Badge>
            )
          }
        />
      )}
      {/* 12px from the header row to the first control — the panel's one header rhythm. */}
      {expanded && (
        <div ref={contentRef} className="flex flex-col gap-2 pt-1 pb-3">
          {/* The popover has no header row, so the hint goes above the control there. */}
          <FilterSectionBody
            section={section}
            model={model}
            showHint={alwaysOpen}
            largeSearch={alwaysOpen}
          />
        </div>
      )}
    </section>
  );
};
