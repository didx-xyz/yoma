import React, { useState } from "react";
import { IoShapesOutline } from "react-icons/io5";
import {
  TYPE_ROW_HINT,
  TYPE_ROW_QUESTION,
} from "../../registry/filterSections";
import { useDiscovery } from "../../state/DiscoveryContext";
import {
  useAllTypeDefinitions,
  useTypeDefinitions,
} from "../../state/useTypeDefinitions";
import { Message } from "../shared/Message";
import { SectionHeader } from "./SectionHeader";
import { TypeRow } from "./TypeRow";
import type { FieldSet } from "./TypeSpecificFilterRows";
import { TypeSpecificFilterRows } from "./TypeSpecificFilterRows";

/**
 * The guidance line over the type-specific filters (2026-10-06): a generic note, never keyed to
 * a field, so a group such as "Requirements" doesn't read as an entry rule.
 */
export const TYPE_FILTERS_NOTE =
  "These describe the opportunity. They are not entry rules. The provider decides who can join.";

/** With no type selected, what picking a type's field does. */
const ANY_TYPE_NOTE = "Choosing one also picks its type.";

/**
 * The type-specific filters on offer, as the rows' dropdown groups them (`FieldSet`):
 *
 * - one type: its definitions under their own group names;
 * - two or more: the shared definitions ("All types", no type context), then each type's own
 *   under its name (`splitTypeDefinitions`);
 * - none (2026-10-09, Jason): EVERY type's, the same way, from one request
 *   (`useAllTypeDefinitions`), only while `loadAll` (the block is on screen). Picking a type's
 *   field selects that type (`TypeSpecificFilterRows`), so the results mean what the filter says:
 *   the API lets every other type through a type's clause.
 *
 * Also the load state, said once by the caller.
 */
export function useTypeFilterSets(loadAll: boolean): {
  types: string[];
  sets: FieldSet[];
  /** "Job filters" for one type, else "Type-specific filters". */
  heading: string;
  unavailable: boolean;
  failed: boolean;
  retry: () => void;
} {
  const { effectiveFilters, lookups } = useDiscovery();
  const types = effectiveFilters.types;
  const anyType = types.length === 0;
  const selected = useTypeDefinitions(types);
  const allNames = lookups.types.map((t) => t.name);
  const every = useAllTypeDefinitions(allNames, anyType && loadAll);
  // Just after a pick selected its type, that type's own list may still be loading: the
  // all-types list (still cached) stands in, so the block doesn't empty and drop the new row.
  const everyLoaded = every.shared.length + every.perType.length > 0;
  const standIn =
    !anyType && selected.loading && everyLoaded
      ? {
          shared: types.length === 1 ? [] : every.shared,
          perType: types.map((typeName) => ({
            typeName,
            definitions: [
              ...(types.length === 1 ? every.shared : []),
              ...(every.perType.find((p) => p.typeName === typeName)
                ?.definitions ?? []),
            ],
          })),
        }
      : null;
  const source = anyType ? every : selected;
  const { unavailable, failed, retry } = source;
  const { shared, perType } = standIn ?? source;
  const displayNameOf = (name: string): string =>
    lookups.types.find((t) => t.name === name)?.displayName ?? name;

  const single = types.length === 1;
  const sets: FieldSet[] = [
    {
      label: single ? null : "All types",
      typeName: null,
      definitions: shared,
    },
    ...perType.map(({ typeName, definitions }) => ({
      label: single ? null : displayNameOf(typeName),
      typeName,
      definitions,
    })),
  ].filter((set) => set.definitions.length > 0);

  return {
    types,
    sets,
    heading:
      single && types[0]
        ? `${displayNameOf(types[0])} filters`
        : "Type-specific filters",
    unavailable,
    failed,
    retry,
  };
}

/**
 * The type-specific filter rows with their heading and note, and the load states said once:
 * the body under the type pills, in the Filters dialog's Type section and the WHAT popover.
 */
export const TypeFiltersBlock: React.FC = () => {
  const { types, sets, heading, unavailable, failed, retry } =
    useTypeFilterSets(true);

  // A 404 means this API build has no custom-field definitions at all. Said once, plainly, and
  // NOT as an error: the block is conditional by design.
  if (unavailable)
    return (
      <Message className="mt-2">
        Type-specific filters aren&apos;t available from this API yet.
      </Message>
    );
  if (failed)
    return (
      <Message kind="error" className="mt-2">
        Couldn&apos;t load the filters for this type.{" "}
        <button
          type="button"
          onClick={retry}
          className="font-semibold underline"
        >
          Retry
        </button>
      </Message>
    );
  if (sets.length === 0) return null;

  return (
    <div className="border-gray/60 mt-1 border-t pt-3">
      <h4 className="text-sm font-semibold tracking-normal">{heading}</h4>
      <p className="text-gray-dark pb-2 text-xs">
        {TYPE_FILTERS_NOTE}
        {types.length === 0 && ` ${ANY_TYPE_NOTE}`}
      </p>
      <TypeSpecificFilterRows sets={sets} />
    </div>
  );
};

/**
 * Block 5 — the opportunity type and its own filters as ONE collapsible section (2026-10-09,
 * Jason): the type pills (`TypeRow`), then the type-specific filter rows (`TypeFiltersBlock`).
 * Open by default, as the type row always was. The search bar's WHAT popover renders the same
 * two under its question.
 */
export const TypeSection: React.FC = () => {
  const { effectiveFilters, lookups } = useDiscovery();
  const [open, setOpen] = useState(true);

  const types = effectiveFilters.types
    .map((name) => lookups.types.find((t) => t.name === name)?.displayName)
    .filter((label): label is string => !!label);
  const clauses = new Set(effectiveFilters.customFields.map((c) => c.key)).size;
  const value = [
    types.length > 0 ? types.join(" · ") : "Any type",
    ...(clauses > 0
      ? [`${clauses} ${clauses === 1 ? "filter" : "filters"}`]
      : []),
  ].join(" · ");

  return (
    <section className="border-gray border-b py-1">
      <SectionHeader
        icon={IoShapesOutline}
        label="Type"
        value={value}
        subtitle={open ? `${TYPE_ROW_QUESTION} ${TYPE_ROW_HINT}` : null}
        expanded={open}
        onToggle={() => setOpen((v) => !v)}
      />
      {open && (
        <div className="pb-3">
          <TypeRow bare />
          <TypeFiltersBlock />
        </div>
      )}
    </section>
  );
};
