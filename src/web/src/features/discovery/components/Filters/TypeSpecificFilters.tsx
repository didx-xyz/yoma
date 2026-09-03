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
import { useOpportunityCustomFieldDefinitionsQuery } from "~/hooks/useOpportunityMutations";
import { useDiscovery } from "../../state/DiscoveryContext";

/**
 * Block 5 — the type-conditional custom-field filters: ONE collapsible section per EFFECTIVE
 * type (manual or preference-inherited), appearing and disappearing with the type selection.
 * Inside each, one nested disclosure per definition GROUP (the "More filters" pattern), with
 * sub-group headings inside — all of it from the definitions endpoint's own grouping, in the
 * order returned; nothing keyed to a specific field. The header is "«DisplayName» filters"; the
 * FROM THIS TYPE badge marks the conditionality. Clause editing reuses YOM-1260's
 * `CustomFieldFilters` — the operator matrix lives there, not here.
 */
export const TypeSpecificFilters: React.FC = () => {
  const { effectiveFilters, lookups } = useDiscovery();

  if (effectiveFilters.types.length === 0) return null;

  return (
    <>
      {effectiveFilters.types.map((name) => (
        <TypeFilterSection
          key={name}
          typeName={name}
          displayName={
            lookups.types.find((t) => t.name === name)?.displayName ?? name
          }
        />
      ))}
    </>
  );
};

/** Ordered unique values of a definition field, preserving display order. */
const orderedUnique = (values: (string | null | undefined)[]): string[] => [
  ...new Set(values.map((v) => v ?? "")),
];

const TypeFilterSection: React.FC<{
  typeName: string;
  displayName: string;
}> = ({ typeName, displayName }) => {
  const { state } = useDiscovery();

  // `types` binds the Type enum NAME — a GUID silently returns only generic definitions.
  const { data: definitions } = useOpportunityCustomFieldDefinitionsQuery([
    typeName,
  ]);

  // Only the clauses this section's definitions own; generic definitions arrive with every
  // type, so a generic clause shows (and edits consistently) in each open section.
  const keys = new Set((definitions ?? []).map((d) => d.key));
  const ownClauses = state.filters.customFields.filter((c) => keys.has(c.key));

  // Collapsed by default, like every section — open only when clauses are already set. The
  // initializer runs before definitions arrive, so it keys on ANY clauses being present rather
  // than this section's own (which are unknowable at mount).
  const [open, setOpen] = useState(() => state.filters.customFields.length > 0);

  if (!definitions || definitions.length === 0) return null;

  const sorted = sortCustomFieldDefinitions(definitions);
  const groups = orderedUnique(sorted.map((d) => d.group)).map((group) => ({
    group,
    definitions: sorted.filter((d) => (d.group ?? "") === group),
  }));

  return (
    <section className="border-gray border-b py-1">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex min-h-11 w-full items-center gap-3 py-2 text-left"
      >
        <IoOptionsOutline className="text-gray-dark h-4 w-4 shrink-0" />
        {/* Title truncates on one line rather than wrapping; the badge never shrinks. */}
        <span className="min-w-0 truncate text-sm font-semibold whitespace-nowrap">
          {displayName} filters
        </span>
        <span className="text-gray-dark hidden min-w-0 flex-1 truncate text-xs sm:block">
          {definitions.length} filters
          {ownClauses.length > 0 && ` · ${ownClauses.length} set`}
        </span>
        <span className="ml-auto flex shrink-0 items-center gap-2">
          <span className="bg-purple rounded px-1.5 py-0.5 text-[10px] font-bold tracking-wide whitespace-nowrap text-white">
            FROM THIS TYPE
          </span>
          <IoChevronDown
            className={`h-4 w-4 transition-transform motion-reduce:transition-none ${open ? "rotate-180" : ""}`}
          />
        </span>
      </button>
      {open && (
        <div className="flex flex-col pb-3">
          {groups.map(({ group, definitions: groupDefinitions }) => (
            <GroupDisclosure
              key={group || "(ungrouped)"}
              label={group || `${displayName} details`}
              definitions={groupDefinitions}
            />
          ))}
        </div>
      )}
    </section>
  );
};

/** One definition group as a nested disclosure — the "More filters" pattern, one level down. */
const GroupDisclosure: React.FC<{
  label: string;
  definitions: CustomFieldDefinition[];
}> = ({ label, definitions }) => {
  const { state, dispatch } = useDiscovery();

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
    (subGroup) => ({
      subGroup,
      definitions: definitions.filter((d) => (d.subGroup ?? "") === subGroup),
    }),
  );

  return (
    // The divider spans the section's FULL width; only the CONTENT is indented (pl-7) — a
    // padded wrapper would inset the border line too (browser feedback, 2026-09-03).
    <div className="border-gray/60 border-b last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex min-h-10 w-full items-center gap-3 py-1.5 pl-7 text-left"
      >
        <span className="min-w-0 truncate text-sm font-semibold">{label}</span>
        <span className="text-gray-dark text-xs">
          {definitions.length}
          {ownClauses.length > 0 && ` · ${ownClauses.length} set`}
        </span>
        <IoChevronDown
          className={`ml-auto h-4 w-4 shrink-0 transition-transform motion-reduce:transition-none ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="flex flex-col gap-3 pb-3 pl-7">
          {subGroups.map(({ subGroup, definitions: subDefinitions }) => (
            <div key={subGroup || "(none)"} className="flex flex-col gap-1">
              {subGroup && (
                <h4 className="text-gray-dark text-xs font-bold tracking-wide uppercase">
                  {subGroup}
                </h4>
              )}
              <CustomFieldFilters
                definitions={subDefinitions}
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
          ))}
        </div>
      )}
    </div>
  );
};
