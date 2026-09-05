import React, { useRef, useState } from "react";
import type { FilterSectionDef } from "../../registry/filterSections";
import { FACET_FOR_BINDING } from "../../registry/filterSections";
import { useDiscovery } from "../../state/DiscoveryContext";
import { Badge } from "../shared/Badge";
import { Message } from "../shared/Message";
import { FilterControl } from "./FilterControl";
import { SectionHeader } from "./SectionHeader";
import { useSectionModel } from "./useSectionModel";

/**
 * One universal section — header row (icon, label, live summary, badges, chevron) expanding in
 * place. The SAME component serves the desktop dialog, the mobile sheet and the standalone
 * popover: one section, all its homes. Collapsed by default UNLESS the section already carries a
 * selection (a hidden active filter reads as a broken page). Collapsed state is UI-only and never
 * touches the query.
 */
export const FilterSection: React.FC<{
  section: FilterSectionDef;
  /** Popover home renders the section already open with no collapse chrome. */
  alwaysOpen?: boolean;
}> = ({ section, alwaysOpen = false }) => {
  const model = useSectionModel(section);
  const { state, fragments } = useDiscovery();
  const [open, setOpen] = useState(() => model.selected.length > 0);
  const contentRef = useRef<HTMLDivElement>(null);
  const expanded = alwaysOpen || open;

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

  // The badge states provenance, so it shows only when this section is ACTUALLY receiving an
  // inherited value right now — a permanent badge on an empty section would be a false claim.
  const facet = section.binding ? FACET_FOR_BINDING[section.binding] : null;
  const inheritedActive =
    facet !== null &&
    !state.preferencesOff &&
    Object.entries(fragments).some(
      ([key, fragment]) =>
        !state.preferencesSkipped.includes(
          key as (typeof state.preferencesSkipped)[number],
        ) && fragment[facet] !== undefined,
    );

  return (
    <section className="border-gray border-b py-1">
      {!alwaysOpen && (
        <SectionHeader
          icon={section.icon}
          label={section.label}
          value={model.summary}
          expanded={expanded}
          onToggle={toggleOpen}
          badges={
            <>
              {inheritedActive && (
                <Badge
                  intent="provenance"
                  title="This search inherits a value here from your preferences"
                >
                  FROM PREFERENCES
                </Badge>
              )}
              {section.optIn && <Badge intent="consent">OPT-IN</Badge>}
            </>
          }
        />
      )}
      {/* 12px from the header row to the first control — the panel's one header rhythm. */}
      {expanded && (
        <div ref={contentRef} className="flex flex-col gap-2 pt-1 pb-3">
          <FilterControl
            section={section}
            model={model}
            largeSearch={alwaysOpen}
          />
          {section.nullRule && section.binding !== null && (
            <Message>{section.nullRule}</Message>
          )}
        </div>
      )}
    </section>
  );
};
