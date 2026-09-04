import { useEffect, useMemo, useState } from "react";
import Select from "react-select";
import Async from "react-select/async";
import type { SelectOption, Skill } from "~/api/models/lookups";
import {
  CustomFieldDataType,
  CustomFieldFilterOperator,
  CustomFieldLookupType,
  type CustomFieldDefinition,
  type CustomFieldFilter,
} from "~/api/models/opportunity";
import { getSkills } from "~/api/services/lookups";
import {
  useOpportunityCountriesQuery,
  useOpportunityLanguagesQuery,
  useSkillsQuery,
} from "~/hooks/useOpportunityMutations";
import { PAGE_SIZE_MEDIUM } from "~/lib/constants";
import { dateInputToUTC, debounce, utcToDateInput } from "~/lib/utils";
import { getCustomFieldNumberError } from "./CustomFields";

// ─────────────────────────────────────────────────────────────────────────────
// CustomFieldFilters (YOM-1244 / YOM-1260)
//
// Definition-driven custom-field filter UI, shared by the user-facing
// (OpportunityFilterVertical) and admin (OpportunityAdminFilterVertical) filters.
// Nothing here is hardcoded to a definition key, title, option or opportunity type.
//
// Controlled component: the parent owns the CustomFieldFilter[] state and merges
// it into its search-filter payload on submit.
//
// Request shape per clause (verified against the API):
//   Equals / Contains / GreaterThan(OrEqual) / LessThan(OrEqual)  → `value`
//   AnyOf / AllOf                                                 → `values`
//   Between                       → `value` (inclusive from) + `valueTo` (inclusive to)
//   Exists                        → no value at all
// Option fields submit inline option KEYS (not option ids); lookup-backed Option
// fields (Country / Language / Skill) submit lookup GUIDs.
// ─────────────────────────────────────────────────────────────────────────────

// TODO(YOM-1260): pending BA-approved definitions, we may need to temporarily
// switch custom-field filtering off (public + admin) without unpicking the wiring.
// Uncomment the line below (and comment out the one after it) to disable it.
// export const CUSTOM_FIELD_FILTERS_ENABLED = false;
export const CUSTOM_FIELD_FILTERS_ENABLED = true;

const OP = CustomFieldFilterOperator;

// Operators the API accepts per data type. Numeric/date types additionally support
// AnyOf; Boolean AnyOf is omitted here because "any of true/false" filters nothing,
// and DateTime AnyOf is omitted because exact-instant matching is not a useful control.
export const CUSTOM_FIELD_FILTER_OPERATORS_BY_DATA_TYPE: Record<
  string,
  CustomFieldFilterOperator[]
> = {
  [CustomFieldDataType.String]: [OP.Contains, OP.Equals, OP.AnyOf, OP.Exists],
  [CustomFieldDataType.Integer]: [
    OP.Equals,
    OP.GreaterThanOrEqual,
    OP.LessThanOrEqual,
    OP.GreaterThan,
    OP.LessThan,
    OP.Between,
    OP.AnyOf,
    OP.Exists,
  ],
  [CustomFieldDataType.Decimal]: [
    OP.Equals,
    OP.GreaterThanOrEqual,
    OP.LessThanOrEqual,
    OP.GreaterThan,
    OP.LessThan,
    OP.Between,
    OP.AnyOf,
    OP.Exists,
  ],
  [CustomFieldDataType.DateTime]: [
    OP.Equals,
    OP.GreaterThanOrEqual,
    OP.LessThanOrEqual,
    OP.GreaterThan,
    OP.LessThan,
    OP.Between,
    OP.Exists,
  ],
  [CustomFieldDataType.Boolean]: [OP.Equals, OP.Exists],
  // AllOf is filtered out below for single-select options (API rejects it).
  [CustomFieldDataType.Option]: [OP.AnyOf, OP.AllOf, OP.Equals, OP.Exists],
};

export const CUSTOM_FIELD_FILTER_OPERATOR_LABELS: Record<string, string> = {
  [OP.Equals]: "Is",
  [OP.Contains]: "Contains",
  [OP.AnyOf]: "Any of",
  [OP.AllOf]: "All of",
  [OP.Exists]: "Has any value",
  [OP.GreaterThan]: "Greater than",
  [OP.GreaterThanOrEqual]: "From",
  [OP.LessThan]: "Less than",
  [OP.LessThanOrEqual]: "Up to",
  [OP.Between]: "Between",
};

const dataTypeOf = (definition: CustomFieldDefinition) =>
  definition.dataType as string;

const lookupTypeOf = (definition: CustomFieldDefinition) =>
  (definition.lookupType as string | null) ?? null;

const isMultiValueOperator = (operator: CustomFieldFilterOperator) =>
  operator === OP.AnyOf || operator === OP.AllOf;

/** Operators offered for a definition (AllOf only where the API allows it). */
export function getCustomFieldFilterOperators(
  definition: CustomFieldDefinition,
): CustomFieldFilterOperator[] {
  const operators =
    CUSTOM_FIELD_FILTER_OPERATORS_BY_DATA_TYPE[dataTypeOf(definition)] ??
    CUSTOM_FIELD_FILTER_OPERATORS_BY_DATA_TYPE[CustomFieldDataType.String] ??
    [];

  // AllOf is valid for multi-select Option definitions only.
  if (definition.supportsMultiple !== true)
    return operators.filter((operator) => operator !== OP.AllOf);

  return operators;
}

/** Definitions in display order (Group → SubGroup → SortOrder → Title). */
export function sortCustomFieldDefinitions(
  definitions: CustomFieldDefinition[],
): CustomFieldDefinition[] {
  return [...definitions].sort(
    (a, b) =>
      a.group.localeCompare(b.group) ||
      (a.subGroup ?? "").localeCompare(b.subGroup ?? "") ||
      a.sortOrder - b.sortOrder ||
      a.title.localeCompare(b.title),
  );
}

const hasScalar = (filter: CustomFieldFilter) =>
  filter.value != null && filter.value.trim() !== "";

const hasUpperBound = (filter: CustomFieldFilter) =>
  filter.valueTo != null && filter.valueTo.trim() !== "";

/**
 * Drops clauses that are not yet usable (no value chosen), so a half-completed
 * control never reaches the API. Exists clauses are always complete.
 */
export function sanitizeCustomFieldFilters(
  filters: CustomFieldFilter[] | null | undefined,
): CustomFieldFilter[] {
  return (filters ?? []).filter((filter) => {
    if (filter.operator === OP.Exists) return true;
    if (isMultiValueOperator(filter.operator))
      return (filter.values?.length ?? 0) > 0;
    if (filter.operator === OP.Between)
      return hasScalar(filter) && hasUpperBound(filter);
    return hasScalar(filter);
  });
}

/**
 * Client-side validation mirroring the API's filter rules, so bad input is caught
 * before the request instead of surfacing as a failed search.
 */
export function getCustomFieldFilterErrors(
  definitions: CustomFieldDefinition[] | null | undefined,
  filters: CustomFieldFilter[] | null | undefined,
): { key: string; title: string; error: string }[] {
  const byKey = new Map<string, CustomFieldDefinition>();
  (definitions ?? []).forEach((definition) =>
    byKey.set(definition.key.toLowerCase(), definition),
  );

  const errors: { key: string; title: string; error: string }[] = [];

  for (const filter of filters ?? []) {
    const definition = byKey.get(filter.key.toLowerCase());
    if (!definition) continue;

    const error = getCustomFieldFilterError(definition, filter);
    if (error) errors.push({ key: filter.key, title: definition.title, error });
  }

  return errors;
}

/** Validation for a single clause; undefined when the clause is usable. */
export function getCustomFieldFilterError(
  definition: CustomFieldDefinition,
  filter: CustomFieldFilter | undefined,
): string | undefined {
  if (!filter || filter.operator === OP.Exists) return undefined;

  const dataType = dataTypeOf(definition);
  const numeric =
    dataType === CustomFieldDataType.Integer ||
    dataType === CustomFieldDataType.Decimal;

  if (isMultiValueOperator(filter.operator)) {
    if (!numeric) return undefined;
    for (const value of filter.values ?? []) {
      const error = getCustomFieldNumberError(dataType, value);
      if (error) return error;
    }
    return undefined;
  }

  if (numeric && hasScalar(filter)) {
    const error = getCustomFieldNumberError(dataType, filter.value!);
    if (error) return error;
  }

  if (filter.operator === OP.Between) {
    if (numeric && hasUpperBound(filter)) {
      const error = getCustomFieldNumberError(dataType, filter.valueTo!);
      if (error) return error;
    }

    // Partially completed ranges are dropped rather than flagged (see
    // sanitizeCustomFieldFilters) — only a fully specified, inverted range is an error.
    if (hasScalar(filter) && hasUpperBound(filter)) {
      const inverted = numeric
        ? Number(filter.value) > Number(filter.valueTo)
        : filter.value! > filter.valueTo!;
      if (inverted) return "The 'from' value must not be greater than 'to'.";
    }
  }

  return undefined;
}

/**
 * Resolves option keys / lookup GUIDs to display names for the current definitions.
 * Lookups are only fetched when a definition actually references them.
 */
export function useCustomFieldFilterLabeler(
  definitions: CustomFieldDefinition[] | null | undefined,
) {
  const defs = useMemo(() => definitions ?? [], [definitions]);

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

  return useMemo(() => {
    const definitionByKey = new Map<string, CustomFieldDefinition>();
    defs.forEach((d) => definitionByKey.set(d.key.toLowerCase(), d));

    const resolve = (definition: CustomFieldDefinition, value: string) => {
      switch (lookupTypeOf(definition)) {
        case CustomFieldLookupType.Country:
          return countryMap.get(value) ?? value;
        case CustomFieldLookupType.Language:
          return languageMap.get(value) ?? value;
        case CustomFieldLookupType.Skill:
          return skillMap.get(value) ?? value;
        default:
          break;
      }

      if (dataTypeOf(definition) === CustomFieldDataType.Option)
        return (
          definition.options?.find(
            (o) => o.key.toLowerCase() === value.toLowerCase(),
          )?.name ?? value
        );

      if (dataTypeOf(definition) === CustomFieldDataType.DateTime)
        return utcToDateInput(value) || value;

      if (dataTypeOf(definition) === CustomFieldDataType.Boolean)
        return value === "true" ? "Yes" : "No";

      return value;
    };

    /**
     * Badge text for one clause. Values only (no field name) — except Exists,
     * which has no value, so the field title is shown instead.
     */
    return (filter: CustomFieldFilter): string => {
      const definition = definitionByKey.get(filter.key.toLowerCase());
      if (!definition) return filter.value ?? filter.key;

      if (filter.operator === OP.Exists) return definition.title;

      if (isMultiValueOperator(filter.operator))
        return (filter.values ?? [])
          .map((value) => resolve(definition, value))
          .join(", ");

      if (filter.operator === OP.Between)
        return `${resolve(definition, filter.value ?? "")} – ${resolve(
          definition,
          filter.valueTo ?? "",
        )}`;

      return resolve(definition, filter.value ?? "");
    };
  }, [defs, countryMap, languageMap, skillMap]);
}

// shared react-select styling, matching the rest of the opportunity forms
// react-select renders its own control with a 38px min-height that can't be
// overridden from here, so the native selects/inputs are sized to match it
// (rather than using the shorter select-sm / input-sm variants).
const REACT_SELECT_CONTROL_CLASSES =
  "input w-full !border-gray pr-0 pl-2 py-1 text-sm";
const NATIVE_CONTROL_CLASSES = "h-10 min-h-10 py-1 text-sm !border-gray";
const NATIVE_SELECT_CLASSES = `select select-bordered w-full ${NATIVE_CONTROL_CLASSES}`;
const NATIVE_INPUT_CLASSES = `input input-bordered w-full ${NATIVE_CONTROL_CLASSES}`;

const SELECT_STYLES = {
  menuPortal: (base: any) => ({ ...base, zIndex: 9999 }),
  placeholder: (base: any) => ({ ...base, color: "#A3A6AF" }),
};

export interface CustomFieldFiltersProps {
  /** Active definitions applicable to the current entity / selected types. */
  definitions: CustomFieldDefinition[] | null | undefined;
  /** Current clauses (controlled). */
  value: CustomFieldFilter[] | null | undefined;
  /** Emits the full clause collection on any change. */
  onChange: (filters: CustomFieldFilter[]) => void;
  /** Force display of validation errors (e.g. on a blocked submit). */
  showErrors?: boolean;
  /** react-select menu portal target (defaults to document.body to avoid clipping). */
  menuPortalTarget?: HTMLElement | null;
  className?: string;
}

export const CustomFieldFilters: React.FC<CustomFieldFiltersProps> = ({
  definitions,
  value,
  onChange,
  showErrors,
  menuPortalTarget,
  className = "",
}) => {
  const ordered = useMemo(
    () => sortCustomFieldDefinitions(definitions ?? []),
    [definitions],
  );

  const filters = useMemo(() => value ?? [], [value]);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const filterFor = (key: string) =>
    filters.find((f) => f.key === key) ?? undefined;

  // Replaces a clause wholesale. `patch === null` removes it. Operator changes
  // always reset the value shape, because each operator uses a different field.
  const setFilter = (key: string, patch: CustomFieldFilter | null) => {
    setTouched((prev) => (prev[key] ? prev : { ...prev, [key]: true }));

    if (patch === null) {
      onChange(filters.filter((f) => f.key !== key));
      return;
    }

    const exists = filters.some((f) => f.key === key);
    onChange(
      exists
        ? filters.map((f) => (f.key === key ? patch : f))
        : [...filters, patch],
    );
  };

  //#region Lookups
  const needsCountry = ordered.some(
    (d) => lookupTypeOf(d) === CustomFieldLookupType.Country,
  );
  const needsLanguage = ordered.some(
    (d) => lookupTypeOf(d) === CustomFieldLookupType.Language,
  );

  const { data: countriesData } = useOpportunityCountriesQuery({
    enabled: needsCountry,
  });
  const countryOptions = useMemo<SelectOption[]>(
    () => countriesData?.map((c) => ({ value: c.id, label: c.name })) ?? [],
    [countriesData],
  );

  const { data: languagesData } = useOpportunityLanguagesQuery({
    enabled: needsLanguage,
  });
  const languageOptions = useMemo<SelectOption[]>(
    () => languagesData?.map((l) => ({ value: l.id, label: l.name })) ?? [],
    [languagesData],
  );

  // skills are searched asynchronously; cache resolved records for label display
  const [skillCache, setSkillCache] = useState<Skill[]>([]);
  const loadSkills = useMemo(
    () =>
      debounce(
        (inputValue: string, callback: (options: SelectOption[]) => void) => {
          getSkills({
            nameContains: (inputValue ?? "").length > 2 ? inputValue : null,
            pageNumber: 1,
            pageSize: PAGE_SIZE_MEDIUM,
          }).then((data) => {
            callback(
              data.items.map((item) => ({ value: item.id, label: item.name })),
            );
            setSkillCache((prev) => {
              const merged = [...prev];
              data.items.forEach((item) => {
                if (!merged.some((s) => s.id === item.id)) merged.push(item);
              });
              return merged;
            });
          });
        },
        1000,
      ),
    [],
  );
  //#endregion Lookups

  const [defaultPortalTarget, setDefaultPortalTarget] =
    useState<HTMLElement | null>(null);
  useEffect(() => {
    setDefaultPortalTarget(document.body);
  }, []);
  const portalTarget = menuPortalTarget ?? defaultPortalTarget;

  function renderOptionControl(
    definition: CustomFieldDefinition,
    filter: CustomFieldFilter | undefined,
    operator: CustomFieldFilterOperator,
  ) {
    const key = definition.key;
    const isMulti = isMultiValueOperator(operator);
    const lookupType = lookupTypeOf(definition);

    // Equals uses the scalar `value`; AnyOf / AllOf use `values`.
    const selected = isMulti
      ? (filter?.values ?? [])
      : filter?.value
        ? [filter.value]
        : [];

    const emit = (selectedValues: string[]) =>
      setFilter(
        key,
        isMulti
          ? {
              key,
              operator,
              values: selectedValues.length > 0 ? selectedValues : null,
            }
          : { key, operator, value: selectedValues[0] ?? null },
      );

    // Skill: async search (submits lookup GUIDs)
    if (lookupType === CustomFieldLookupType.Skill) {
      return (
        <Async
          instanceId={`customfieldfilter_${key}`}
          classNames={{
            control: () => REACT_SELECT_CONTROL_CLASSES,
          }}
          isMulti={isMulti}
          isClearable={true}
          defaultOptions={true}
          cacheOptions
          loadOptions={loadSkills}
          onChange={(val: any) =>
            emit(
              isMulti
                ? (val ?? []).map((o: SelectOption) => o.value)
                : val
                  ? [val.value]
                  : [],
            )
          }
          value={selected.map((id) => ({
            value: id,
            label: skillCache.find((s) => s.id === id)?.name ?? id,
          }))}
          menuPortalTarget={portalTarget}
          styles={SELECT_STYLES}
          placeholder="Search skills..."
          inputId={`input_customfieldfilter_${key}`}
        />
      );
    }

    // inline options submit option keys; Country / Language submit lookup GUIDs
    let options: SelectOption[] = [];
    if (lookupType === CustomFieldLookupType.Country) options = countryOptions;
    else if (lookupType === CustomFieldLookupType.Language)
      options = languageOptions;
    else
      options = [...(definition.options ?? [])]
        .filter((o) => o.isActive)
        .sort(
          (a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name),
        )
        .map((o) => ({ value: o.key, label: o.name }));

    return (
      <Select
        instanceId={`customfieldfilter_${key}`}
        classNames={{
          control: () => REACT_SELECT_CONTROL_CLASSES,
        }}
        isMulti={isMulti}
        isClearable={true}
        options={options}
        onChange={(val: any) =>
          emit(
            isMulti
              ? (val ?? []).map((o: SelectOption) => o.value)
              : val
                ? [val.value]
                : [],
          )
        }
        value={
          isMulti
            ? options.filter((o) => selected.includes(o.value))
            : (options.find((o) => selected.includes(o.value)) ?? null)
        }
        menuPortalTarget={portalTarget}
        styles={SELECT_STYLES}
        placeholder="Select..."
        inputId={`input_customfieldfilter_${key}`}
      />
    );
  }

  function renderValueControl(
    definition: CustomFieldDefinition,
    filter: CustomFieldFilter | undefined,
    operator: CustomFieldFilterOperator,
  ) {
    const key = definition.key;
    const dataType = dataTypeOf(definition);

    if (operator === OP.Exists) return null;

    if (dataType === CustomFieldDataType.Option)
      return renderOptionControl(definition, filter, operator);

    if (dataType === CustomFieldDataType.Boolean)
      return (
        <select
          className={NATIVE_SELECT_CLASSES}
          value={filter?.value ?? ""}
          onChange={(e) =>
            setFilter(key, {
              key,
              operator,
              value: e.target.value || null,
            })
          }
        >
          <option value="">Select...</option>
          <option value="true">Yes</option>
          <option value="false">No</option>
        </select>
      );

    // AnyOf on a scalar type: comma-separated list
    if (isMultiValueOperator(operator))
      return (
        <input
          type="text"
          placeholder="Comma separated values..."
          className={NATIVE_INPUT_CLASSES}
          value={(filter?.values ?? []).join(", ")}
          onChange={(e) => {
            const values = e.target.value
              .split(",")
              .map((v) => v.trim())
              .filter(Boolean);
            setFilter(key, {
              key,
              operator,
              values: values.length > 0 ? values : null,
            });
          }}
        />
      );

    const isDate = dataType === CustomFieldDataType.DateTime;
    const isNumber =
      dataType === CustomFieldDataType.Integer ||
      dataType === CustomFieldDataType.Decimal;

    // DateTime is submitted as UTC ISO-8601 (the date input works in YYYY-MM-DD).
    const toStored = (raw: string) =>
      isDate ? (raw ? dateInputToUTC(raw) : null) : raw || null;
    const fromStored = (stored: string | null | undefined) =>
      isDate ? utcToDateInput(stored ?? undefined) : (stored ?? "");

    const inputProps = {
      type: isDate ? "date" : isNumber ? "number" : "text",
      step: isNumber
        ? dataType === CustomFieldDataType.Integer
          ? "1"
          : "any"
        : undefined,
      className: NATIVE_INPUT_CLASSES,
    };

    if (operator === OP.Between)
      return (
        <div className="flex flex-col gap-1 sm:flex-row">
          <input
            {...inputProps}
            placeholder="From..."
            value={fromStored(filter?.value)}
            onChange={(e) =>
              setFilter(key, {
                key,
                operator,
                value: toStored(e.target.value),
                valueTo: filter?.valueTo ?? null,
              })
            }
          />
          <input
            {...inputProps}
            placeholder="To..."
            value={fromStored(filter?.valueTo)}
            onChange={(e) =>
              setFilter(key, {
                key,
                operator,
                value: filter?.value ?? null,
                valueTo: toStored(e.target.value),
              })
            }
          />
        </div>
      );

    return (
      <input
        {...inputProps}
        placeholder="Value..."
        value={fromStored(filter?.value)}
        onChange={(e) =>
          setFilter(key, {
            key,
            operator,
            value: toStored(e.target.value),
          })
        }
      />
    );
  }

  if (!CUSTOM_FIELD_FILTERS_ENABLED) return null;
  if (ordered.length === 0) return null;

  return (
    <div
      className={`flex flex-col gap-4 ${className}`}
      data-testid="opportunity-custom-field-filters"
    >
      {ordered.map((definition) => {
        const filter = filterFor(definition.key);
        const operators = getCustomFieldFilterOperators(definition);
        const operator =
          filter?.operator ?? operators[0] ?? CustomFieldFilterOperator.Equals;
        const error = getCustomFieldFilterError(definition, filter);

        return (
          <fieldset
            key={definition.key}
            className="fieldset gap-1"
            data-custom-field-key={definition.key}
            data-custom-field-datatype={definition.dataType}
          >
            <label className="label">
              <span className="label-text font-semibold">
                {definition.title}
              </span>
            </label>

            <div className="flex flex-col gap-1 sm:flex-row">
              <select
                className={`${NATIVE_SELECT_CLASSES} sm:w-40`}
                aria-label={`${definition.title} filter operator`}
                value={operator}
                onChange={(e) =>
                  setFilter(definition.key, {
                    key: definition.key,
                    operator: e.target.value as CustomFieldFilterOperator,
                    value: null,
                    valueTo: null,
                    values: null,
                  })
                }
              >
                {operators.map((op) => (
                  <option key={op} value={op}>
                    {CUSTOM_FIELD_FILTER_OPERATOR_LABELS[op] ?? op}
                  </option>
                ))}
              </select>

              <div className="w-full">
                {renderValueControl(definition, filter, operator)}
              </div>
            </div>

            {error && (touched[definition.key] || showErrors) && (
              <label className="label font-bold">
                <span className="label-text-alt text-red-500 italic">
                  {error}
                </span>
              </label>
            )}

            {/* {filter && (
              <button
                type="button"
                className="btn btn-xs btn-ghost mt-1 w-fit text-xs"
                onClick={() => setFilter(definition.key, null)}
              >
                Clear
              </button>
            )} */}
          </fieldset>
        );
      })}
    </div>
  );
};

export default CustomFieldFilters;
