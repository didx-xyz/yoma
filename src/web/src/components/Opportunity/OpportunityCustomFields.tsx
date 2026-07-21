import { useMemo } from "react";
import type {
  CustomFieldDefinition,
  CustomFieldValueRequest,
} from "~/api/models/opportunity";

// ─────────────────────────────────────────────────────────────────────────────
// OpportunityCustomFields (YOM-1244 / YOM-1255 — Task 1)
//
// BASE / SCAFFOLD component. This wiring loads definition-driven custom fields
// and lays out the grouping structure (Group → SubGroup → SortOrder → Title).
// The per-DataType field controls (String / Integer / Decimal / Boolean /
// DateTime / Option) are rendered in a follow-up prompt — the `renderField`
// slot below marks where they go.
//
// Hard constraint (fixed): everything here is derived from `definitions`.
// No hardcoded field keys, titles, options or opportunity types.
// ─────────────────────────────────────────────────────────────────────────────

export interface OpportunityCustomFieldsProps {
  /** Active definitions applicable to the currently selected opportunity type. */
  definitions: CustomFieldDefinition[] | null | undefined;
  /** Current values, joined to definitions by `key`. Managed by the parent form. */
  values?: CustomFieldValueRequest[] | null;
  /** Emits the full custom-field collection (replacement semantics on save). */
  onChange?: (values: CustomFieldValueRequest[]) => void;
  /** True while definitions are being fetched (type change / initial load). */
  isLoading?: boolean;
}

interface CustomFieldGroup {
  group: string;
  subGroups: {
    subGroup: string | null;
    definitions: CustomFieldDefinition[];
  }[];
}

// Group definitions by Group → SubGroup, ordering by SortOrder then Title within
// each subgroup. Groups and subgroups preserve first-seen order after the
// definitions are pre-sorted by the API (Group, SubGroup, SortOrder, Title).
function groupDefinitions(
  definitions: CustomFieldDefinition[],
): CustomFieldGroup[] {
  const sorted = [...definitions].sort(
    (a, b) =>
      a.group.localeCompare(b.group) ||
      (a.subGroup ?? "").localeCompare(b.subGroup ?? "") ||
      a.sortOrder - b.sortOrder ||
      a.title.localeCompare(b.title),
  );

  const groups: CustomFieldGroup[] = [];

  for (const definition of sorted) {
    let group = groups.find((g) => g.group === definition.group);
    if (!group) {
      group = { group: definition.group, subGroups: [] };
      groups.push(group);
    }

    let subGroup = group.subGroups.find(
      (s) => s.subGroup === (definition.subGroup ?? null),
    );
    if (!subGroup) {
      subGroup = { subGroup: definition.subGroup ?? null, definitions: [] };
      group.subGroups.push(subGroup);
    }

    subGroup.definitions.push(definition);
  }

  return groups;
}

export const OpportunityCustomFields: React.FC<
  OpportunityCustomFieldsProps
> = ({ definitions, isLoading }) => {
  const groups = useMemo(
    () => groupDefinitions(definitions ?? []),
    [definitions],
  );

  if (isLoading) {
    return (
      <div className="text-gray-dark flex items-center gap-2 text-sm">
        <span className="loading loading-spinner loading-sm"></span>
        Loading additional fields...
      </div>
    );
  }

  // no applicable custom fields for the selected type — render nothing
  if (groups.length === 0) return null;

  return (
    <div
      className="flex flex-col gap-4"
      data-testid="opportunity-custom-fields"
    >
      {groups.map((group) => (
        <div key={group.group} className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <span className="text-green shrink-0 text-sm font-semibold tracking-[0.2em] uppercase">
              {group.group}
            </span>
            <span className="border-gray-light h-px flex-1 border-t"></span>
            <span className="text-gray-dark shrink-0 text-sm font-medium">
              {group.subGroups.reduce(
                (count, subGroup) => count + subGroup.definitions.length,
                0,
              )}{" "}
              fields
            </span>
          </div>

          {group.subGroups.map((subGroup) => (
            <div
              key={`${group.group}-${subGroup.subGroup ?? "default"}`}
              className="flex flex-col gap-3"
            >
              {subGroup.subGroup && (
                <h6 className="font-semibold tracking-wider">
                  {subGroup.subGroup}
                </h6>
              )}

              {subGroup.definitions.map((definition) => (
                // TODO(YOM-1255): render the per-DataType control here
                // (String / Integer / Decimal / Boolean / DateTime / Option),
                // wired to `values` / `onChange` and validation. Placeholder for now.
                <div
                  key={definition.key}
                  className="flex flex-col gap-1"
                  data-custom-field-key={definition.key}
                  data-custom-field-datatype={definition.dataType}
                >
                  <span className="text-sm font-semibold">
                    {definition.title}
                    {definition.isRequired && (
                      <span className="text-red-500"> *</span>
                    )}
                  </span>
                  {definition.description && (
                    <span className="text-gray-dark text-xs">
                      {/* {definition.description} */}
                      {JSON.stringify(definition)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

export default OpportunityCustomFields;
