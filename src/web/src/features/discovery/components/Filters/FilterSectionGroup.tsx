import React, { useState } from "react";
import type {
  FilterGroupDef,
  FilterSectionDef,
} from "../../registry/filterSections";
import { FILTER_SECTIONS } from "../../registry/filterSections";
import { Badge } from "../shared/Badge";
import { FilterSectionBody, useInheritedActive } from "./FilterSection";
import { SectionHeader } from "./SectionHeader";
import type { SectionModel } from "./useSectionModel";
import { useSectionModel } from "./useSectionModel";

const sectionOf = (id: string): FilterSectionDef => {
  const section = FILTER_SECTIONS.find((s) => s.id === id);
  if (!section) throw new Error(`No filter section "${id}"`);
  return section;
};

/**
 * A part's summary as the combined header lists it: nothing while it is "Any", and the first
 * pick by name, then a count ("Remote +1", as the search bar says it), rather than "2 selected",
 * which beside another part wouldn't say of what. The inherited accessibility needs keep their
 * own wording ("Your needs"), never named.
 */
const partSummary = (model: SectionModel): string | null => {
  if (model.summary === "Any") return null;
  if (/^\d+ selected$/.test(model.summary)) {
    const first = model.options.find((o) => o.id === model.selected[0])?.label;
    if (first)
      return model.selected.length > 1
        ? `${first} +${model.selected.length - 1}`
        : first;
  }
  return model.summary;
};

/**
 * Two sections as ONE (`FILTER_GROUPS`, 2026-10-09): "How" (How long, Engagement) and
 * "Requirements" (Language, Accessibility). One header — the parts' summaries side by side, the
 * FROM PREFERENCES badge while either inherits, the group's description as its subtitle when
 * open — over each part's own body under its question. Each part keeps its control, rules and
 * provenance exactly as its single section had them. In a popover (`alwaysOpen`) there is no
 * header: the popover titles it with the group's question and description.
 *
 * Open by default when either part carries a selection — unless all it carries is the private
 * inherited accessibility needs (`startCollapsed`), as for the single section.
 */
export const FilterSectionGroup: React.FC<{
  group: FilterGroupDef;
  alwaysOpen?: boolean;
}> = ({ group, alwaysOpen = false }) => {
  const first = sectionOf(group.parts[0]);
  const second = sectionOf(group.parts[1]);
  const firstModel = useSectionModel(first);
  const secondModel = useSectionModel(second);
  const firstInherited = useInheritedActive(first);
  const secondInherited = useInheritedActive(second);
  const parts = [
    { section: first, model: firstModel },
    { section: second, model: secondModel },
  ];

  const opensWith = (model: SectionModel): boolean =>
    model.selected.length > 0 && !model.startCollapsed;
  const [open, setOpen] = useState(
    () => opensWith(firstModel) || opensWith(secondModel),
  );
  const expanded = alwaysOpen || open;

  const summaries = parts
    .map(({ model }) => partSummary(model))
    .filter((summary): summary is string => summary !== null);

  return (
    <section className={alwaysOpen ? "" : "border-gray border-b py-1"}>
      {!alwaysOpen && (
        <SectionHeader
          icon={group.icon}
          label={group.label}
          value={summaries.length > 0 ? summaries.join(" · ") : "Any"}
          subtitle={expanded ? group.description : null}
          expanded={expanded}
          onToggle={() => setOpen((v) => !v)}
          badges={
            (firstInherited || secondInherited) && (
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
      {expanded && (
        // 12px from the header to the first part; a hairline and 16px between the parts.
        <div className="[&>div+div]:border-gray/60 flex flex-col gap-4 pt-1 pb-3 [&>div+div]:border-t [&>div+div]:pt-4">
          {parts.map(({ section, model }) => (
            <div key={section.id} className="flex flex-col gap-2">
              <h4 className="text-sm font-semibold tracking-normal">
                {section.question}
              </h4>
              <FilterSectionBody
                section={section}
                model={model}
                showHint
                largeSearch={alwaysOpen}
              />
            </div>
          ))}
        </div>
      )}
    </section>
  );
};
