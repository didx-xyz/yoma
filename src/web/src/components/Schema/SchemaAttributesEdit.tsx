import { useEffect, useMemo, useRef, useState } from "react";
import { IoIosAdd, IoIosRemove, IoMdAlert, IoMdLock } from "react-icons/io";
import Select from "react-select";
import type {
  SSISchemaEntity,
  SSISchemaEntityCustomField,
} from "~/api/models/credential";
import type { SelectOption, SelectOptionGroup } from "~/api/models/lookups";
import {
  byPresentationOrder,
  groupLabelOf,
  type AttributePresentation,
} from "~/lib/credentials/attributePresentation";

/**
 * An attribute already mapped by the schema that schema-entity discovery no longer offers —
 * typically a custom field that has since been deactivated, or one scoped to another type context.
 * The API validates a submitted attribute list against the *active, in-context* discovery set, so
 * these cannot be carried forward: they are shown, and dropped on the next save.
 */
export interface SchemaRetiredAttribute {
  attributeName: string;
  nameDisplay: string;
  entityName: string;
  detail: string | null;
}

interface InputProps {
  defaultValue?: string[] | null;
  schemaEntities: SSISchemaEntity[] | null | undefined;
  retiredAttributes?: SchemaRetiredAttribute[] | null;
  onChange?: (attributes: string[]) => void;
}

interface AttributeOption extends AttributePresentation {
  description: string | null;
  typeName: string;
  required: boolean;
}

interface EntitySection {
  id: string;
  name: string;
  /** Non-system attributes, selectable in the Attribute dropdown, in presentation order. */
  options: AttributeOption[];
  /** System statics — always issued, so listed read-only and never submitted. */
  locked: AttributeOption[];
}

const fromCustomField = (
  field: SSISchemaEntityCustomField,
): AttributeOption => ({
  attributeName: field.attributeName,
  nameDisplay: field.nameDisplay,
  description: field.description,
  typeName: field.typeName,
  required: field.required,
  group: field.group,
  subGroup: field.subGroup,
  sortOrder: field.sortOrder,
});

/**
 * Projects what the API returned into one section per owning entity. Every group and heading comes
 * from the API's own presentation metadata — this component knows no field key, group name or
 * opportunity type.
 */
const buildSections = (
  schemaEntities: SSISchemaEntity[] | null | undefined,
): EntitySection[] =>
  (schemaEntities ?? [])
    .map((entity) => {
      const statics = (entity.properties ?? []).map((property) => ({
        option: {
          attributeName: property.attributeName,
          nameDisplay: property.nameDisplay,
          description: property.description,
          typeName: property.typeName,
          required: property.required,
          group: property.group,
          subGroup: property.subGroup,
          sortOrder: property.sortOrder,
        },
        system: property.system,
      }));

      return {
        id: entity.id,
        name: entity.name,
        options: [
          ...statics.filter((o) => !o.system).map((o) => o.option),
          ...(entity.customFields ?? []).map(fromCustomField),
        ].sort(byPresentationOrder),
        // system properties carry no presentation metadata — they render in the credential's
        // fixed header — so the API's own order is kept
        locked: statics.filter((o) => o.system).map((o) => o.option),
      };
    })
    .filter((section) => section.options.length + section.locked.length > 0);

/** One editable row: a datasource and the attribute chosen from it. Either may be blank. */
interface AttributeRow {
  key: number;
  entityId: string;
  attributeName: string;
}

export const SchemaAttributesEdit: React.FC<InputProps> = ({
  defaultValue,
  schemaEntities,
  retiredAttributes,
  onChange,
}) => {
  const sections = useMemo(
    () => buildSections(schemaEntities),
    [schemaEntities],
  );

  const lockedRows = useMemo(
    () =>
      sections.flatMap((section) =>
        section.locked.map((option) => ({ section, option })),
      ),
    [sections],
  );

  /** attributeName → owning section, for seeding rows from the schema's existing mappings. */
  const ownerByAttribute = useMemo(() => {
    const owners = new Map<string, EntitySection>();
    for (const section of sections)
      for (const option of section.options)
        owners.set(option.attributeName, section);
    return owners;
  }, [sections]);

  const datasourceOptions = useMemo<SelectOption[]>(
    () =>
      sections
        .filter((section) => section.options.length > 0)
        .map((section) => ({ value: section.id, label: section.name })),
    [sections],
  );

  const nextKey = useRef(0);
  const [rows, setRows] = useState<AttributeRow[]>([]);

  // Seed from the schema's existing mappings, and reconcile whenever discovery changes — selecting
  // a different Opportunity Type narrows what is applicable, so anything no longer offered drops.
  useEffect(() => {
    if (!schemaEntities) return;
    setRows(
      (defaultValue ?? [])
        .filter((attribute) => ownerByAttribute.has(attribute))
        .map((attribute) => ({
          key: nextKey.current++,
          entityId: ownerByAttribute.get(attribute)!.id,
          attributeName: attribute,
        })),
    );
  }, [schemaEntities, defaultValue, ownerByAttribute]);

  const selected = useMemo(
    () =>
      rows
        .map((row) => row.attributeName)
        .filter(
          (attribute, index, all) =>
            !!attribute && all.indexOf(attribute) === index,
        ),
    [rows],
  );

  useEffect(() => {
    onChange?.(selected);
  }, [selected, onChange]);

  /**
   * Attribute options for a row, minus what other rows already use. Grouped entries come first
   * because `options` is already in presentation order; ungrouped attributes trail as bare entries,
   * which is what the API's "ungrouped renders last" rule means in a dropdown.
   */
  const attributeOptionsFor = (
    row: AttributeRow,
  ): (SelectOption | SelectOptionGroup)[] => {
    const section = sections.find((candidate) => candidate.id === row.entityId);
    if (!section) return [];

    const takenElsewhere = new Set(
      rows
        .filter((candidate) => candidate.key !== row.key)
        .map((candidate) => candidate.attributeName),
    );

    const entries: (SelectOption | SelectOptionGroup)[] = [];
    const groupsByLabel = new Map<string, SelectOptionGroup>();

    for (const option of section.options) {
      if (takenElsewhere.has(option.attributeName)) continue;

      const entry = {
        value: option.attributeName,
        label: option.required
          ? `${option.nameDisplay} (required)`
          : option.nameDisplay,
      };

      const label = groupLabelOf(option);
      if (!label) {
        entries.push(entry);
        continue;
      }

      let group = groupsByLabel.get(label);
      if (!group) {
        group = { label, options: [] };
        groupsByLabel.set(label, group);
        entries.push(group);
      }
      group.options.push(entry);
    }
    return entries;
  };

  /** Flattens grouped and ungrouped entries so a row's current value can be looked up. */
  const flattenOptions = (
    entries: (SelectOption | SelectOptionGroup)[],
  ): SelectOption[] =>
    entries.flatMap((entry) => ("options" in entry ? entry.options : [entry]));

  const updateRow = (key: number, changes: Partial<AttributeRow>) =>
    setRows((previous) =>
      previous.map((row) => (row.key === key ? { ...row, ...changes } : row)),
    );

  const removeRow = (key: number) =>
    setRows((previous) => previous.filter((row) => row.key !== key));

  const addRow = () =>
    setRows((previous) => [
      ...previous,
      { key: nextKey.current++, entityId: "", attributeName: "" },
    ]);

  return (
    <div className="flex flex-col gap-2">
      {!schemaEntities && (
        <p className="text-error py-4 text-xs italic">
          Select a schema type to load the available attributes.
        </p>
      )}

      {schemaEntities && sections.length === 0 && (
        <p className="text-error py-4 text-xs italic">
          No attributes are available for this schema type.
        </p>
      )}

      {/* RETIRED MAPPINGS — shown so nothing disappears silently, but never resubmitted */}
      {!!retiredAttributes?.length && (
        <div className="mt-2 rounded-lg border border-amber-300 bg-amber-50 p-3">
          <div className="flex items-center gap-1 text-sm font-bold text-amber-900">
            <IoMdAlert className="h-4 w-4" />
            No longer available
          </div>
          <p className="mt-1 text-xs text-amber-900">
            These attributes are mapped by the current schema version but are no
            longer offered for this schema type and context. Saving creates a
            new version without them.
          </p>

          <table className="table w-full">
            <thead>
              <tr className="border-amber-200 text-amber-900">
                <th className="w-65">Data Source</th>
                <th>Attribute</th>
              </tr>
            </thead>
            <tbody>
              {retiredAttributes.map((attribute) => (
                <tr
                  key={attribute.attributeName}
                  className="border-amber-200 text-amber-900"
                >
                  <td>{attribute.entityName}</td>
                  <td>
                    {attribute.nameDisplay}
                    {attribute.detail && (
                      <span className="ml-1 text-xs italic">
                        ({attribute.detail})
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {sections.length > 0 && (
        <>
          <table className="table w-full">
            <thead>
              <tr className="border-gray text-gray-dark">
                <th className="w-65">Data Source</th>
                <th>Attribute</th>
                <th className="w-12"></th>
              </tr>
            </thead>
            <tbody>
              {/* Core fields — always issued, so read-only */}
              {lockedRows.map(({ section, option }) => (
                <tr
                  key={option.attributeName}
                  className="border-gray text-gray-dark"
                  title={option.description ?? undefined}
                >
                  <td>{section.name}</td>
                  <td>
                    <IoMdLock
                      className="mr-1 inline-block h-3 w-3"
                      title="Always issued — cannot be removed"
                    />
                    {option.nameDisplay}
                  </td>
                  <td></td>
                </tr>
              ))}

              {/* Additional fields — datasource and attribute are chosen */}
              {rows.map((row) => (
                <tr key={row.key} className="border-gray text-gray-dark">
                  <td>
                    <Select
                      classNames={{ control: () => "input" }}
                      placeholder="Select data source"
                      isMulti={false}
                      options={datasourceOptions}
                      onChange={(value) =>
                        updateRow(row.key, {
                          entityId: value?.value ?? "",
                          attributeName: "", // clear — attributes are scoped to their datasource
                        })
                      }
                      value={
                        datasourceOptions.find(
                          (option) => option.value === row.entityId,
                        ) ?? null
                      }
                    />
                  </td>
                  <td>
                    <Select
                      classNames={{ control: () => "input" }}
                      placeholder="Select attribute"
                      isMulti={false}
                      options={attributeOptionsFor(row)}
                      isDisabled={!row.entityId}
                      onChange={(value) =>
                        updateRow(row.key, {
                          attributeName: value?.value ?? "",
                        })
                      }
                      value={
                        flattenOptions(attributeOptionsFor(row)).find(
                          (option) => option.value === row.attributeName,
                        ) ?? null
                      }
                    />
                  </td>
                  <td>
                    <button
                      type="button"
                      className="btn btn-sm"
                      onClick={() => removeRow(row.key)}
                      title="Remove attribute"
                    >
                      <IoIosRemove className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex justify-center">
            <button
              type="button"
              className="btn"
              onClick={addRow}
              title="Add attribute"
            >
              <IoIosAdd className="h-4 w-4" />
              Add field
            </button>
          </div>
        </>
      )}
    </div>
  );
};
