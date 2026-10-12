import React, { useRef, useState } from "react";
import { IoAdd, IoClose } from "react-icons/io5";
import Select from "react-select";
import type { CustomFieldDefinition } from "~/api/models/opportunity";
import {
  CustomFieldFilters,
  sortCustomFieldDefinitions,
} from "~/components/Opportunity/CustomFieldFilters";
import { useDiscovery } from "../../state/DiscoveryContext";

/** One set of definitions the dropdown groups under a name: a type's own, or the shared ones. */
export interface FieldSet {
  /** Prefixes each of its groups ("Job · Employment"); `null` with one type selected. */
  label: string | null;
  /**
   * The type whose own fields these are; `null` for the shared ones. Picking one of its fields
   * selects the type when it isn't in effect (no type selected, 2026-10-09).
   */
  typeName: string | null;
  definitions: CustomFieldDefinition[];
}

interface FieldOption {
  value: string;
  label: string;
}

interface FieldGroup {
  label: string;
  options: FieldOption[];
}

/** A field's name in the dropdown: its sub-group first, where it has one. */
const fieldLabel = (definition: CustomFieldDefinition): string =>
  definition.subGroup
    ? `${definition.subGroup} · ${definition.title}`
    : definition.title;

/** The dropdown matches the value controls beside it (`CustomFieldFilters`, 44px below md). */
const CONTROL_CLASSES =
  "input w-full !border-gray pr-0 pl-2 h-fit py-0 text-sm !min-h-11 md:!min-h-10";
const SELECT_STYLES = {
  menuPortal: (base: object) => ({ ...base, zIndex: 9999 }),
  placeholder: (base: object) => ({ ...base, color: "#A3A6AF" }),
  // The menu at the control's own size, not the browser's 16px.
  option: (base: object) => ({ ...base, fontSize: "0.875rem" }),
};

interface Row {
  id: string;
  key: string | null;
}

/**
 * The type-specific filters as rows (2026-10-09, Jason; the pattern of admin/schemas): each row
 * picks ONE field from a single grouped dropdown, and its value control appears beside it once
 * picked, the same fixed-operator control the fields had before (`CustomFieldFilters` with its
 * label hidden: the dropdown names the field). A row is removed with its ×, and "Add filter"
 * adds one. The Filters dialog and sheet and the search bar's WHAT popover all render this.
 *
 * Rows are local while being edited and keep their identity through the first commit, so the
 * value control is never remounted mid-edit. A clause that arrives from elsewhere (a link, a
 * replayed search) gets a row of its own, first. A row whose value is cleared stays, field
 * picked, so it can be set again; Clear filters or a replaced search drops the local rows.
 */
export const TypeSpecificFilterRows: React.FC<{ sets: FieldSet[] }> = ({
  sets,
}) => {
  const { state, dispatch, resetEpoch, effectiveFilters } = useDiscovery();
  const nextId = useRef(0);
  const newRow = (key: string | null = null): Row => {
    nextId.current += 1;
    return { id: `row-${nextId.current}`, key };
  };

  const definitions = sets.flatMap((set) => set.definitions);
  const byKey = new Map(definitions.map((d) => [d.key, d]));
  const clauses = state.filters.customFields.filter((c) => byKey.has(c.key));
  const committedKeys = [...new Set(clauses.map((c) => c.key))];

  // An empty row to start with when nothing is set: the dropdown is the invitation.
  const [local, setLocal] = useState<Row[]>(() =>
    committedKeys.length > 0 ? [] : [newRow()],
  );
  // A replaced search (Clear filters, back / forward, a replayed search) drops the drafts.
  const [epoch, setEpoch] = useState(resetEpoch);
  if (epoch !== resetEpoch) {
    setEpoch(resetEpoch);
    setLocal([]);
  }

  const localKeys = local.map((row) => row.key);
  const rows: Row[] = [
    // Set elsewhere, with no row here yet: first, as they are already in the search.
    ...committedKeys
      .filter((key) => !localKeys.includes(key))
      .map((key) => ({ id: `set-${key}`, key })),
    // A type that left takes its fields' rows with it.
    ...local.filter((row) => row.key === null || byKey.has(row.key)),
  ];
  const taken = rows.flatMap((row) => (row.key ? [row.key] : []));

  // Every field not already in another row, grouped as the endpoint groups them.
  const optionsFor = (own: string | null): FieldGroup[] =>
    sets.flatMap((set) => {
      const sorted = sortCustomFieldDefinitions(set.definitions).filter(
        (d) => d.key === own || !taken.includes(d.key),
      );
      const groupNames = [...new Set(sorted.map((d) => d.group ?? ""))];
      return groupNames.map((group) => ({
        label: [set.label, group || "Details"].filter(Boolean).join(" · "),
        options: sorted
          .filter((d) => (d.group ?? "") === group)
          .map((d) => ({ value: d.key, label: fieldLabel(d) })),
      }));
    });

  const setClauses = (key: string, next: typeof clauses): void =>
    dispatch({ kind: "setCustomFieldClauses", keys: [key], clauses: next });

  /** Another field for this row: its old clause goes, the row keeps its place. */
  const changeField = (row: Row, key: string | null): void => {
    if (row.key && committedKeys.includes(row.key)) setClauses(row.key, []);
    // A type's own field picked with that type not in effect (no type selected): select it, so
    // the filter narrows the results rather than one type among all (the API passes the others).
    const typeName = key
      ? sets.find((set) => set.definitions.some((d) => d.key === key))?.typeName
      : null;
    if (typeName && !effectiveFilters.types.includes(typeName))
      dispatch({ kind: "toggleType", name: typeName });
    setLocal((current) =>
      current.some((r) => r.id === row.id)
        ? current.map((r) => (r.id === row.id ? { ...r, key } : r))
        : [...current, { ...newRow(), key }],
    );
  };

  const remove = (row: Row): void => {
    if (row.key && committedKeys.includes(row.key)) setClauses(row.key, []);
    setLocal((current) => current.filter((r) => r.id !== row.id));
  };

  const canAdd =
    rows.every((row) => row.key !== null) && taken.length < definitions.length;

  return (
    <div className="flex flex-col gap-2">
      <ul className="flex flex-col gap-3 sm:gap-2">
        {rows.map((row) => {
          const definition = row.key ? byKey.get(row.key) : undefined;
          const name = definition ? fieldLabel(definition) : null;
          return (
            <li key={row.id} className="flex items-start gap-2">
              <div className="grid min-w-0 grow gap-2 sm:grid-cols-[minmax(0,14rem)_minmax(0,1fr)]">
                <Select<FieldOption, false, FieldGroup>
                  inputId={`discovery-cf-field-${row.id}`}
                  aria-label="Filter by"
                  classNames={{ control: () => CONTROL_CLASSES }}
                  styles={SELECT_STYLES}
                  menuPortalTarget={
                    typeof document === "undefined" ? null : document.body
                  }
                  options={optionsFor(row.key)}
                  value={
                    definition && name
                      ? { value: definition.key, label: name }
                      : null
                  }
                  onChange={(option) => changeField(row, option?.value ?? null)}
                  placeholder="Choose a filter…"
                  noOptionsMessage={() => "No more filters for this type"}
                />
                {definition ? (
                  // The fieldset's own top padding would sit the value 4px below the field.
                  <div className="min-w-0 [&_.fieldset]:py-0">
                    <CustomFieldFilters
                      definitions={[definition]}
                      hideLabels
                      largeTouchTargets
                      fixedOperators
                      commitOnBlur
                      // Clear filters or a replaced search drops an uncommitted (invalid) draft.
                      resetKey={String(resetEpoch)}
                      // A skill from a shared link is named, not shown as its id.
                      resolveSkillsById
                      value={clauses.filter((c) => c.key === definition.key)}
                      // Replaces this field's own clauses only, so a change elsewhere in the same
                      // task (a blur commit, then the tap) isn't undone.
                      onChange={(next) => setClauses(definition.key, next)}
                    />
                  </div>
                ) : (
                  <p className="text-gray-dark hidden self-center text-xs sm:block">
                    Pick a filter, then its value.
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => remove(row)}
                aria-label={name ? `Remove ${name}` : "Remove this filter"}
                className="text-gray-dark flex h-11 w-11 shrink-0 items-center justify-center rounded-full hover:text-black md:h-10 md:w-10"
              >
                <IoClose className="h-5 w-5" />
              </button>
            </li>
          );
        })}
      </ul>
      <button
        type="button"
        disabled={!canAdd}
        onClick={() => setLocal((current) => [...current, newRow()])}
        className="text-green inline-flex min-h-11 w-fit items-center gap-1.5 text-sm font-semibold disabled:opacity-40"
      >
        <IoAdd className="h-4 w-4" aria-hidden />
        Add filter
      </button>
    </div>
  );
};
