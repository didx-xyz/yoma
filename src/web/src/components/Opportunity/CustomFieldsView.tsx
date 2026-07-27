import { useMemo } from "react";
import {
  CustomFieldDataType,
  CustomFieldLookupType,
  type CustomFieldDefinition,
  type CustomFieldValueItem,
} from "~/api/models/opportunity";
import DetailSection from "~/components/Common/DetailSection";
import {
  useOpportunityCountriesQuery,
  useOpportunityLanguagesQuery,
  useSkillsQuery,
} from "~/hooks/useOpportunityMutations";
import { utcToDateInput } from "~/lib/utils";

// ─────────────────────────────────────────────────────────────────────────────
// CustomFieldsView (YOM-1244 / YOM-1255)
//
// Read-only, definition-driven display of saved custom-field values.
// Context-agnostic — pass the applicable definitions and the entity's values.
// Renders "{Title}: {Value}" per field, showing only fields that have a value.
// `fields` optionally whitelists/orders which keys to show. See CustomFields for editing.
// ─────────────────────────────────────────────────────────────────────────────

export interface CustomFieldsViewProps {
  /** Active definitions applicable to the entity (labels, options, lookup types). */
  definitions: CustomFieldDefinition[] | null | undefined;
  /** The entity's hydrated custom-field values, joined to definitions by `key`. */
  values: CustomFieldValueItem[] | null | undefined;
  /**
   * Optional whitelist of definition keys to show, in this order.
   * Omitted → show every definition that has a value (grouped order).
   */
  fields?: string[];
  /** Optional heading, rendered only when there is at least one value to show. */
  title?: string;
  /** Optional icon shown next to the heading (only used when `title` is set). */
  icon?: React.ReactNode;
  className?: string;
  /** Optional number of columns for grid layout. If omitted, uses flex-wrap flow. */
  columns?: number;
  /** Hide group and subgroup section headers. Defaults to false. */
  hideGrouping?: boolean;
}

const dataTypeOf = (definition: CustomFieldDefinition) =>
  definition.dataType as string;

const lookupTypeOf = (definition: CustomFieldDefinition) =>
  (definition.lookupType as string | null) ?? null;

export const CustomFieldsView: React.FC<CustomFieldsViewProps> = ({
  definitions,
  values,
  fields,
  title,
  icon,
  className,
  columns = 2,
  hideGrouping = false,
}) => {
  const defs = useMemo(() => definitions ?? [], [definitions]);

  // load lookups only if a shown field references them
  const needsCountry = defs.some(
    (d) => lookupTypeOf(d) === CustomFieldLookupType.Country,
  );
  const needsLanguage = defs.some(
    (d) => lookupTypeOf(d) === CustomFieldLookupType.Language,
  );
  const needsSkill = defs.some(
    (d) => lookupTypeOf(d) === CustomFieldLookupType.Skill,
  );
  const { data: countriesData } = useOpportunityCountriesQuery({
    enabled: needsCountry,
  });
  const { data: languagesData } = useOpportunityLanguagesQuery({
    enabled: needsLanguage,
  });
  const { data: skillsData } = useSkillsQuery(
    { nameContains: null, pageNumber: 1, pageSize: 500 },
    { enabled: needsSkill },
  );
  const countryMap = useMemo(
    () => new Map((countriesData ?? []).map((c) => [c.id, c.name])),
    [countriesData],
  );
  const languageMap = useMemo(
    () => new Map((languagesData ?? []).map((l) => [l.id, l.name])),
    [languagesData],
  );
  const skillMap = useMemo(
    () => new Map((skillsData?.items ?? []).map((s) => [s.id, s.name])),
    [skillsData?.items],
  );

  const valueByKey = useMemo(() => {
    const map = new Map<string, CustomFieldValueItem>();
    (values ?? []).forEach((v) => map.set(v.key.toLowerCase(), v));
    return map;
  }, [values]);

  // definitions to consider, in display order
  const ordered = useMemo(() => {
    if (fields && fields.length > 0)
      return fields
        .map((key) =>
          defs.find((d) => d.key.toLowerCase() === key.toLowerCase()),
        )
        .filter((d): d is CustomFieldDefinition => !!d);

    return [...defs].sort(
      (a, b) =>
        a.group.localeCompare(b.group) ||
        (a.subGroup ?? "").localeCompare(b.subGroup ?? "") ||
        a.sortOrder - b.sortOrder ||
        a.title.localeCompare(b.title),
    );
  }, [defs, fields]);

  const resolveOptionLabel = (
    definition: CustomFieldDefinition,
    value: string,
  ): string => {
    switch (lookupTypeOf(definition)) {
      case CustomFieldLookupType.Country:
        return countryMap.get(value) ?? value;
      case CustomFieldLookupType.Language:
        return languageMap.get(value) ?? value;
      case CustomFieldLookupType.Skill:
        return skillMap.get(value) ?? value;
      default:
        return (
          definition.options?.find(
            (o) => o.key.toLowerCase() === value.toLowerCase(),
          )?.name ?? value
        );
    }
  };

  const formatValue = (
    definition: CustomFieldDefinition,
    item: CustomFieldValueItem,
  ): string | null => {
    const dataType = dataTypeOf(definition);

    if (dataType === CustomFieldDataType.Option) {
      const vals = item.values ?? [];
      if (vals.length === 0) return null;
      return vals.map((v) => resolveOptionLabel(definition, v)).join(", ");
    }

    const raw = item.value;
    if (raw == null || raw.trim() === "") return null;
    if (dataType === CustomFieldDataType.Boolean)
      return raw === "true" ? "Yes" : "No";
    if (dataType === CustomFieldDataType.DateTime)
      return utcToDateInput(raw) || raw;
    return raw;
  };

  const rows = ordered
    .map((definition) => {
      const item = valueByKey.get(definition.key.toLowerCase());
      if (!item) return null;
      const value = formatValue(definition, item);
      if (!value) return null;
      return {
        key: definition.key,
        title: definition.title,
        value,
        group: definition.group,
        subGroup: definition.subGroup ?? null,
      };
    })
    .filter(
      (r): r is {
        key: string;
        title: string;
        value: string;
        group: string;
        subGroup: string | null;
      } => !!r,
    );

  if (rows.length === 0) return null;

  const renderFieldsGrid = (fieldsToRender: typeof rows) => (
    <div
      className="text-gray-dark gap-4 text-sm"
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
      }}
      data-testid="custom-fields-view"
    >
      {fieldsToRender.map((r) => (
        <div key={r.key} className="flex flex-row justify-between gap-2">
          <span
            className="font-semiboldx min-w-40 truncate text-nowrap"
            title={r.title}
          >
            {r.title}:
          </span>
          <span className="line-clamp-2 truncate font-bold" title={r.value}>
            {r.value}
          </span>
        </div>
      ))}
    </div>
  );

  const list = hideGrouping ? (
    renderFieldsGrid(rows)
  ) : (
    <div className="space-y-4" data-testid="custom-fields-view">
      {Object.entries(
        rows.reduce<
          Record<
            string,
            { group: string; subGroup: string | null; fields: typeof rows }
          >
        >((acc, r) => {
          const groupKey = r.subGroup ? `${r.group}__${r.subGroup}` : r.group;
          acc[groupKey] ??= { group: r.group, subGroup: r.subGroup, fields: [] };
          acc[groupKey]!.fields.push(r);
          return acc;
        }, {}),
      ).map(([groupKey, { group, subGroup, fields }]) => (
        <div key={groupKey}>
          <div className="mb-2">
            <h3 className="text-xs font-bold uppercase tracking-wide text-gray-dark">
              {subGroup ? `${group} - ${subGroup}` : group}
            </h3>
          </div>
          {renderFieldsGrid(fields)}
        </div>
      ))}
    </div>
  );

  // when a title is supplied, render as a labelled section (consistent chrome)
  if (title)
    return (
      <DetailSection title={title} icon={icon} className={className}>
        <div className="my-2">{list}</div>
      </DetailSection>
    );

  return className ? <div className={className}>{list}</div> : list;
};

export default CustomFieldsView;
