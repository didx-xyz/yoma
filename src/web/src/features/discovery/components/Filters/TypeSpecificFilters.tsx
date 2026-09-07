import React, { useState } from "react";
import { IoChevronDown, IoOptionsOutline } from "react-icons/io5";
import type {
  CustomFieldDefinition,
  CustomFieldFilter,
} from "~/api/models/opportunity";
import {
  CustomFieldFilters,
  sortCustomFieldDefinitions,
} from "~/components/Opportunity/CustomFieldFilters";
import { useDiscovery } from "../../state/DiscoveryContext";
import { useIsCompact } from "../../state/useIsCompact";
import { useTypeDefinitions } from "../../state/useTypeDefinitions";
import { Badge } from "../shared/Badge";
import { Message } from "../shared/Message";
import { SectionHeader } from "./SectionHeader";

/**
 * Block 5 — the type-conditional custom-field filters, appearing and disappearing with the type
 * selection. Two or more types split into "Details (all types)" (what every selected type
 * returns — the generic definitions) plus one section per type carrying only ITS additions;
 * with one type selected there is nothing to share and the single "«DisplayName» filters"
 * section carries everything. See `useTypeDefinitions` for why the split is an intersection.
 *
 * Inside each section, one nested disclosure per definition GROUP (the "More filters" pattern),
 * from the endpoint's own grouping in the order returned — nothing keyed to a specific field.
 * Clause editing reuses YOM-1260's `CustomFieldFilters`; the operator matrix lives there.
 */
export const TypeSpecificFilters: React.FC = () => {
  const { effectiveFilters, lookups } = useDiscovery();
  const types = effectiveFilters.types;
  const { shared, perType, unavailable, failed, retry } =
    useTypeDefinitions(types);

  if (types.length === 0) return null;

  const displayNameOf = (name: string): string =>
    lookups.types.find((t) => t.name === name)?.displayName ?? name;

  // A 404 means this API build has no custom-field definitions at all (the DEV preview, until
  // the YOM-1254 endpoints deploy). Said once, plainly, and NOT as an error — the block is
  // conditional by design, so rendering nothing would be the silent placeholder the surface
  // does not allow, and an error would blame the page for the environment.
  if (unavailable)
    return (
      <section className="border-gray border-b py-2">
        <Message>
          Type-specific filters aren&apos;t available from this API yet.
        </Message>
      </section>
    );

  if (failed)
    return (
      <section className="border-gray border-b py-2">
        <Message kind="error">
          Couldn&apos;t load the filters for this type.{" "}
          <button
            type="button"
            onClick={retry}
            className="font-semibold underline"
          >
            Retry
          </button>
        </Message>
      </section>
    );

  return (
    <>
      {shared.length > 0 && (
        <DefinitionsSection
          id="shared"
          label="Details (all types)"
          definitions={shared}
        />
      )}
      {perType
        .filter(({ definitions }) => definitions.length > 0)
        .map(({ typeName, definitions }) => (
          <DefinitionsSection
            key={typeName}
            id={typeName}
            label={`${displayNameOf(typeName)} filters`}
            definitions={definitions}
            badge={<Badge intent="provenance">FROM THIS TYPE</Badge>}
          />
        ))}
    </>
  );
};

/** Ordered unique values of a definition field, preserving display order. */
const orderedUnique = (values: (string | null | undefined)[]): string[] => [
  ...new Set(values.map((v) => v ?? "")),
];

/** One collapsible section over a set of definitions — the shared set, or one type's own. */
const DefinitionsSection: React.FC<{
  id: string;
  label: string;
  definitions: CustomFieldDefinition[];
  badge?: React.ReactNode;
}> = ({ id, label, definitions, badge }) => {
  const { state } = useDiscovery();

  const keys = new Set(definitions.map((d) => d.key));
  const ownClauses = state.filters.customFields.filter((c) => keys.has(c.key));

  // Collapsed by default, like every section — open only when clauses are already set. The
  // initializer runs before definitions arrive, so it keys on ANY clauses being present rather
  // than this section's own (which are unknowable at mount).
  const [open, setOpen] = useState(() => state.filters.customFields.length > 0);

  const sorted = sortCustomFieldDefinitions(definitions);
  const groups = orderedUnique(sorted.map((d) => d.group)).map((group) => ({
    group,
    definitions: sorted.filter((d) => (d.group ?? "") === group),
  }));

  return (
    <section className="border-gray border-b py-1">
      <SectionHeader
        icon={IoOptionsOutline}
        label={label}
        value={`${definitions.length} filters${
          ownClauses.length > 0 ? ` · ${ownClauses.length} set` : ""
        }`}
        badges={badge}
        expanded={open}
        onToggle={() => setOpen((v) => !v)}
      />
      {open && (
        <div className="flex flex-col pb-3">
          {groups.map(({ group, definitions: groupDefinitions }) => (
            <GroupDisclosure
              key={`${id}:${group || "(ungrouped)"}`}
              label={group || "Details"}
              definitions={groupDefinitions}
            />
          ))}
        </div>
      )}
    </section>
  );
};

/**
 * A sub-group that wraps exactly ONE field does not earn a heading: its name becomes the field's
 * label prefix ("Application · Required"). Five of six sub-groups in the seeded data were
 * one-field headings, which is a whole level of chrome per control. Below `md` the heading level
 * goes entirely and every field carries the prefix instead — same information, one less level of
 * nesting on the narrowest screen.
 *
 * The prefix is applied to a COPY of the definition (display only): nothing about the key,
 * grouping or clause shape changes, so this stays a presentation rule over whatever the endpoint
 * returns.
 */
const prefixed = (
  definition: CustomFieldDefinition,
  subGroup: string,
): CustomFieldDefinition =>
  subGroup
    ? { ...definition, title: `${subGroup} · ${definition.title}` }
    : definition;

/** One definition group as a nested disclosure — the "More filters" pattern, one level down. */
const GroupDisclosure: React.FC<{
  label: string;
  definitions: CustomFieldDefinition[];
}> = ({ label, definitions }) => {
  const { state, dispatch } = useDiscovery();
  const compact = useIsCompact();

  const keys = new Set(definitions.map((d) => d.key));
  const ownClauses = state.filters.customFields.filter((c) => keys.has(c.key));
  const [open, setOpen] = useState(() => ownClauses.length > 0);

  const onChange = (next: CustomFieldFilter[]): void =>
    // Replace this group's clauses; clauses owned elsewhere pass through untouched.
    dispatch({
      kind: "patchFilters",
      patch: {
        customFields: [
          ...state.filters.customFields.filter((c) => !keys.has(c.key)),
          ...next,
        ],
      },
    });

  const subGroups = orderedUnique(definitions.map((d) => d.subGroup)).map(
    (subGroup) => {
      const own = definitions.filter((d) => (d.subGroup ?? "") === subGroup);
      // Heading only where it earns its level: more than one field, and room to show it.
      const heading = subGroup && own.length > 1 && !compact ? subGroup : null;
      return {
        subGroup,
        heading,
        definitions: heading ? own : own.map((d) => prefixed(d, subGroup)),
      };
    },
  );

  return (
    // The divider spans the section's FULL width; only the CONTENT is indented — a padded
    // wrapper would inset the border line too (browser feedback, 2026-09-03). One indent level
    // only, and a shallower one below md.
    <div className="border-gray/60 border-b last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex min-h-11 w-full items-center gap-3 py-1.5 pl-3 text-left md:pl-7"
      >
        <span className="min-w-0 truncate text-sm font-semibold">{label}</span>
        <span className="text-gray-dark text-xs">
          {definitions.length}
          {ownClauses.length > 0 && ` · ${ownClauses.length} set`}
        </span>
        <IoChevronDown
          className={`ml-auto h-5 w-5 shrink-0 transition-transform motion-reduce:transition-none ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        // Touch targets: the shared filter controls size themselves for the pointer by default;
        // discovery opts into the 44px variant (`largeTouchTargets`) for the sheet.
        <div className="flex flex-col gap-3 pb-3 pl-3 md:pl-7">
          {subGroups.map(
            ({ subGroup, heading, definitions: subDefinitions }) => (
              <div key={subGroup || "(none)"} className="flex flex-col gap-1">
                {heading && (
                  <h4 className="text-gray-dark text-xs font-bold tracking-wide uppercase">
                    {heading}
                  </h4>
                )}
                <CustomFieldFilters
                  definitions={subDefinitions}
                  largeTouchTargets
                  value={state.filters.customFields.filter((c) =>
                    subDefinitions.some((d) => d.key === c.key),
                  )}
                  onChange={(next) =>
                    onChange([
                      ...ownClauses.filter(
                        (c) => !subDefinitions.some((d) => d.key === c.key),
                      ),
                      ...next,
                    ])
                  }
                />
              </div>
            ),
          )}
        </div>
      )}
    </div>
  );
};
