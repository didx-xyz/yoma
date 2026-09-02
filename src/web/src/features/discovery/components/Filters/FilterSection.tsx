import React, { useRef, useState } from "react";
import { IoChevronDown } from "react-icons/io5";
import type { FilterSectionDef } from "../../registry/filterSections";
import { FACET_FOR_BINDING } from "../../registry/filterSections";
import { useDiscovery } from "../../state/DiscoveryContext";
import { Message } from "../shared/Message";
import { FilterControl } from "./FilterControl";
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
  const Icon = section.icon;

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
        <button
          type="button"
          onClick={toggleOpen}
          aria-expanded={expanded}
          className="flex min-h-11 w-full items-center gap-3 py-2 text-left"
        >
          <Icon className="text-gray-dark h-4 w-4 shrink-0" />
          <span className="shrink-0 text-sm font-semibold whitespace-nowrap">
            {section.label}
          </span>
          <span className="text-gray-dark hidden min-w-0 flex-1 truncate text-xs sm:block">
            {model.summary}
          </span>
          <span className="ml-auto flex shrink-0 items-center gap-2">
            {inheritedActive && (
              <span
                title="This search inherits a value here from your preferences"
                className="bg-purple-tint text-purple rounded px-1.5 py-0.5 text-[10px] font-bold tracking-wide whitespace-nowrap"
              >
                FROM PREFERENCES
              </span>
            )}
            {section.optIn && (
              <span className="bg-yellow-tint text-yellow rounded px-1.5 py-0.5 text-[10px] font-bold tracking-wide whitespace-nowrap">
                OPT-IN
              </span>
            )}
            <IoChevronDown
              className={`h-4 w-4 transition-transform motion-reduce:transition-none ${expanded ? "rotate-180" : ""}`}
            />
          </span>
        </button>
      )}
      {expanded && (
        <div ref={contentRef} className="flex flex-col gap-2 pb-3">
          <FilterControl section={section} model={model} />
          {section.nullRule && section.binding !== null && (
            <Message>{section.nullRule}</Message>
          )}
        </div>
      )}
    </section>
  );
};
