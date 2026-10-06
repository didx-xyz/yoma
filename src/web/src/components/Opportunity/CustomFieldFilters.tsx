import { useEffect, useMemo, useRef, useState } from "react";
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
  useCurrenciesQuery,
  useEducationsQuery,
  useOpportunityCountriesQuery,
  useOpportunityLanguagesQuery,
  useSkillsQuery,
} from "~/hooks/useOpportunityMutations";
import { CUSTOM_FIELDS_ENABLED, PAGE_SIZE_MEDIUM } from "~/lib/constants";
import {
  CUSTOM_FIELD_FILTER_OPERATOR_LABELS,
  customFieldChipValue,
  draftSyncOf,
  fixedClauseFor,
  fixedControlValues,
  fixedFilterControlOf,
  hasScalar,
  hasUpperBound,
  INVERTED_RANGE_ERROR,
  isInvertedRange,
  isMultiValueOperator,
  isShownByFixedControl,
  sanitizeCustomFieldFilters,
} from "~/lib/customFields/customFieldFilterClauses";
import { dateInputToUTC, debounce, utcToDateInput } from "~/lib/utils";
import { getCustomFieldNumberError } from "./CustomFields";

// The clause rules live in a pure module (the URL codec and the unit tests use them); these two
// stay importable from here for the existing callers.
export { CUSTOM_FIELD_FILTER_OPERATOR_LABELS, sanitizeCustomFieldFilters };

// ─────────────────────────────────────────────────────────────────────────────
// CustomFieldFilters (YOM-1244 / YOM-1260)
//
// Definition-driven custom-field filter UI, shared by the user-facing
// (OpportunityFilterVertical) and admin (OpportunityAdminFilterVertical) filters, and
// discovery's type-specific block (YOM-1262), which opts into `fixedOperators` and
// `commitOnBlur`. Nothing here is hardcoded to a definition key, title, option or
// opportunity type.
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
// fields (Country / Language / Skill / Education / Currency) submit lookup GUIDs.
// ─────────────────────────────────────────────────────────────────────────────

// Custom-field filtering (public + admin) switches off with the rest of the framework rather
// than on a switch of its own — this used to be a hand-edited boolean with a TODO(YOM-1260)
// asking for exactly the release gate `CUSTOM_FIELDS_ENABLED` now provides. Kept as a named
// export because the filter panels read it directly.
export const CUSTOM_FIELD_FILTERS_ENABLED = CUSTOM_FIELDS_ENABLED;

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
  // Date-only (API 2026-09-29) filters like DateTime; AnyOf left out for the same reason.
  [CustomFieldDataType.Date]: [
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

const dataTypeOf = (definition: CustomFieldDefinition) =>
  definition.dataType as string;

const lookupTypeOf = (definition: CustomFieldDefinition) =>
  (definition.lookupType as string | null) ?? null;

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
      if (inverted) return INVERTED_RANGE_ERROR;
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
  const needsEducation = defs.some(
    (d) => lookupTypeOf(d) === CustomFieldLookupType.Education,
  );
  const needsCurrency = defs.some(
    (d) => lookupTypeOf(d) === CustomFieldLookupType.Currency,
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
  const { data: educationsData } = useEducationsQuery({
    enabled: needsEducation,
  });
  const { data: currenciesData } = useCurrenciesQuery({
    enabled: needsCurrency,
  });

  const educationMap = useMemo(
    () => new Map((educationsData ?? []).map((e) => [e.id, e.name])),
    [educationsData],
  );
  const currencyMap = useMemo(
    () =>
      new Map(
        (currenciesData ?? []).map((c) => [c.id, `${c.code} — ${c.name}`]),
      ),
    [currenciesData],
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
        case CustomFieldLookupType.Education:
          return educationMap.get(value) ?? value;
        case CustomFieldLookupType.Currency:
          return currencyMap.get(value) ?? value;
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
  }, [defs, countryMap, languageMap, skillMap, educationMap, currencyMap]);
}

// shared react-select styling, matching the rest of the opportunity forms
// react-select renders its own control with a 38px min-height that can't be
// overridden from here, so the native selects/inputs are sized to match it
// (rather than using the shorter select-sm / input-sm variants).
// `h-fit` lets a multi-select grow with its chips: daisyUI's `.input` otherwise holds the
// control at its fixed height while the chips spill over the next field (2026-10-05). Empty, it
// is then as tall as its content (36px) plus padding, so the padding goes and a min-height
// matches the neighbouring controls instead: 40px, or 44px below md with `largeTouchTargets`.
// The min-height needs `!` to beat react-select's own 38px.
const REACT_SELECT_CONTROL_CLASSES =
  "input w-full !border-gray pr-0 pl-2 h-fit py-0 text-sm";
const NATIVE_CONTROL_CLASSES = "h-10 min-h-10 py-1 text-sm !border-gray";
const NATIVE_SELECT_CLASSES = `select select-bordered w-full ${NATIVE_CONTROL_CLASSES}`;
const NATIVE_INPUT_CLASSES = `input input-bordered w-full ${NATIVE_CONTROL_CLASSES}`;

// Opt-in 44px touch targets (see `largeTouchTargets`): same controls, sized for a thumb below
// md. Additive — callers that do not ask for it render exactly as before.
const TOUCH_CONTROL_CLASSES =
  "h-11 min-h-11 md:h-10 md:min-h-10 py-1 text-sm !border-gray";
const TOUCH_SELECT_CLASSES = `select select-bordered w-full ${TOUCH_CONTROL_CLASSES}`;
const TOUCH_INPUT_CLASSES = `input input-bordered w-full ${TOUCH_CONTROL_CLASSES}`;

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
  /**
   * Render the operator select and value inputs at 44px below `md` (WCAG touch target size).
   * Off by default so existing pointer-first callers (the admin and legacy filter panels) are
   * unchanged; the youth discovery sheet opts in.
   */
  largeTouchTargets?: boolean;
  /**
   * Typed values (the fixed text, number and date inputs) keep a local draft and commit on blur
   * or Enter instead of on every keystroke; a From–To pair commits when focus leaves the pair.
   * An invalid draft is never committed, and an emptied one removes its clause. Applies to the
   * `fixedOperators` controls; the operator-select layout always commits as you type. Off by
   * default; the youth discovery sheet opts in.
   */
  commitOnBlur?: boolean;
  /**
   * One fixed operator per data type and no operator select: Option Any of, String Contains,
   * numbers and dates a From–To range (either end alone), Boolean Any / Yes / No. An emptied
   * control removes its clause. A clause the control can't show (an older link) is kept as sent,
   * with a note under the field, until the control is edited. Off by default, so the admin and
   * legacy panels keep the full operator matrix; the youth discovery sheet opts in.
   */
  fixedOperators?: boolean;
  /**
   * With `commitOnBlur`: changes when the search is replaced rather than edited (discovery bumps
   * it on Clear filters, back / forward and a replayed search). A typed field that isn't focused
   * then shows its committed values again, so an uncommitted (invalid) draft doesn't outlive
   * them. An unrelated change keeps such a draft, with its error. Without it, drafts follow only
   * their own committed values.
   */
  resetKey?: string;
  className?: string;
}

export const CustomFieldFilters: React.FC<CustomFieldFiltersProps> = ({
  definitions,
  value,
  onChange,
  showErrors,
  menuPortalTarget,
  largeTouchTargets = false,
  commitOnBlur = false,
  fixedOperators = false,
  resetKey,
  className = "",
}) => {
  const selectClasses = largeTouchTargets
    ? TOUCH_SELECT_CLASSES
    : NATIVE_SELECT_CLASSES;
  const inputClasses = largeTouchTargets
    ? TOUCH_INPUT_CLASSES
    : NATIVE_INPUT_CLASSES;
  const reactSelectControlClasses = largeTouchTargets
    ? `${REACT_SELECT_CONTROL_CLASSES} !min-h-11 md:!min-h-10`
    : `${REACT_SELECT_CONTROL_CLASSES} !min-h-10`;

  const ordered = useMemo(
    () => sortCustomFieldDefinitions(definitions ?? []),
    [definitions],
  );

  const filters = useMemo(() => value ?? [], [value]);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const filterFor = (key: string) =>
    filters.find((f) => f.key === key) ?? undefined;

  // The clauses last emitted, and the `value` they were built on. Until the parent passes the
  // change back, `value` is stale: two changes in one task (a blur commit and the tap that caused
  // it, such as a multi-select's clear) would each rebuild from it, and the second would undo
  // the first. While `value` is still the one they were built on, changes build on them instead.
  const emitted = useRef<{
    from: CustomFieldFilter[];
    filters: CustomFieldFilter[];
  } | null>(null);
  const latestFilters = (): CustomFieldFilter[] =>
    value != null && emitted.current?.from === value
      ? emitted.current.filters
      : filters;

  // Replaces a clause wholesale. `patch === null` removes it. Operator changes
  // always reset the value shape, because each operator uses a different field.
  const setFilter = (key: string, patch: CustomFieldFilter | null) => {
    setTouched((prev) => (prev[key] ? prev : { ...prev, [key]: true }));

    const current = latestFilters();
    const next =
      patch === null
        ? current.filter((f) => f.key !== key)
        : current.some((f) => f.key === key)
          ? current.map((f) => (f.key === key ? patch : f))
          : [...current, patch];
    if (value != null) emitted.current = { from: value, filters: next };
    onChange(next);
  };

  // Fixed operators: a control's values become its clause, and an empty control removes it.
  const commitFixed = (definition: CustomFieldDefinition, values: string[]) => {
    const clause = fixedClauseFor(
      dataTypeOf(definition),
      definition.key,
      values,
    );
    if (
      clause === null &&
      !latestFilters().some((f) => f.key === definition.key)
    )
      return;
    setFilter(definition.key, clause);
  };

  // Clauses the fixed controls can't show (older links) are named under their field in the chip
  // wording, so they're labelled here. Only their definitions are passed, so no lookup is fetched
  // unless such a clause exists.
  const unshownDefinitions = useMemo(
    () =>
      fixedOperators
        ? ordered.filter((definition) => {
            const filter = filters.find((f) => f.key === definition.key);
            return (
              filter !== undefined &&
              !isShownByFixedControl(dataTypeOf(definition), filter)
            );
          })
        : [],
    [fixedOperators, ordered, filters],
  );
  const labelUnshown = useCustomFieldFilterLabeler(unshownDefinitions);

  //#region Lookups
  const needsCountry = ordered.some(
    (d) => lookupTypeOf(d) === CustomFieldLookupType.Country,
  );
  const needsLanguage = ordered.some(
    (d) => lookupTypeOf(d) === CustomFieldLookupType.Language,
  );
  const needsEducation = ordered.some(
    (d) => lookupTypeOf(d) === CustomFieldLookupType.Education,
  );
  const needsCurrency = ordered.some(
    (d) => lookupTypeOf(d) === CustomFieldLookupType.Currency,
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

  const { data: educationsData } = useEducationsQuery({
    enabled: needsEducation,
  });
  const educationOptions = useMemo<SelectOption[]>(
    () => educationsData?.map((e) => ({ value: e.id, label: e.name })) ?? [],
    [educationsData],
  );

  // Currency custom fields filter on the lookup id, never the ISO code
  const { data: currenciesData } = useCurrenciesQuery({
    enabled: needsCurrency,
  });
  const currencyOptions = useMemo<SelectOption[]>(
    () =>
      currenciesData?.map((c) => ({
        value: c.id,
        label: `${c.code} — ${c.name}`,
      })) ?? [],
    [currenciesData],
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

  // `fixed`: always the Any of multi-select (`fixedOperators`), whatever the clause's operator.
  function renderOptionControl(
    definition: CustomFieldDefinition,
    filter: CustomFieldFilter | undefined,
    operator: CustomFieldFilterOperator,
    fixed = false,
  ) {
    const key = definition.key;
    const isMulti = fixed || isMultiValueOperator(operator);
    const lookupType = lookupTypeOf(definition);

    // Equals uses the scalar `value`; AnyOf / AllOf use `values`.
    const selected = fixed
      ? fixedControlValues(dataTypeOf(definition), filter)
      : isMulti
        ? (filter?.values ?? [])
        : filter?.value
          ? [filter.value]
          : [];

    const emit = (selectedValues: string[]) =>
      fixed
        ? commitFixed(definition, selectedValues)
        : setFilter(
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
            control: () => reactSelectControlClasses,
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
          aria-label={fixed ? definition.title : undefined}
        />
      );
    }

    // inline options submit option keys; Country / Language / Education / Currency
    // submit lookup GUIDs
    let options: SelectOption[] = [];
    if (lookupType === CustomFieldLookupType.Country) options = countryOptions;
    else if (lookupType === CustomFieldLookupType.Language)
      options = languageOptions;
    else if (lookupType === CustomFieldLookupType.Education)
      options = educationOptions;
    else if (lookupType === CustomFieldLookupType.Currency)
      options = currencyOptions;
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
          control: () => reactSelectControlClasses,
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
        placeholder={fixed ? "Any" : "Select..."}
        inputId={`input_customfieldfilter_${key}`}
        aria-label={fixed ? definition.title : undefined}
      />
    );
  }

  /** The one control a field gets with `fixedOperators`; see `fixedFilterControlOf`. */
  function renderFixedControl(
    definition: CustomFieldDefinition,
    filter: CustomFieldFilter | undefined,
  ) {
    const dataType = dataTypeOf(definition);
    const control = fixedFilterControlOf(dataType);
    const values = fixedControlValues(dataType, filter);
    const commit = (next: string[]) => commitFixed(definition, next);

    if (control === "anyOf")
      return renderOptionControl(definition, filter, OP.AnyOf, true);

    if (control === "boolean")
      return (
        <select
          className={selectClasses}
          aria-label={definition.title}
          value={values[0] ?? ""}
          onChange={(e) => commit([e.target.value])}
        >
          <option value="">Any</option>
          <option value="true">Yes</option>
          <option value="false">No</option>
        </select>
      );

    if (control === "contains")
      return (
        <DraftInputs
          committed={values}
          resetKey={resetKey ?? ""}
          commitOnBlur={commitOnBlur}
          showErrors={showErrors}
          validate={() => undefined}
          onCommit={commit}
          inputs={[
            {
              type: "text",
              placeholder: "Contains…",
              "aria-label": definition.title,
              className: inputClasses,
            },
          ]}
        />
      );

    // range: numbers and dates, From–To side by side
    const isNumber =
      dataType === CustomFieldDataType.Integer ||
      dataType === CustomFieldDataType.Decimal;
    const endProps = (end: "from" | "to") => ({
      type: isNumber ? "number" : "date",
      step: isNumber
        ? dataType === CustomFieldDataType.Integer
          ? "1"
          : "any"
        : undefined,
      inputMode: isNumber
        ? dataType === CustomFieldDataType.Integer
          ? ("numeric" as const)
          : ("decimal" as const)
        : undefined,
      // date inputs show no placeholder; the aria-label names both
      placeholder: isNumber ? (end === "from" ? "From" : "To") : undefined,
      "aria-label": `${definition.title} ${end}`,
      className: inputClasses,
    });

    return (
      <DraftInputs
        committed={values}
        resetKey={resetKey ?? ""}
        commitOnBlur={commitOnBlur}
        showErrors={showErrors}
        // The browser reports unparseable text as "", so it is named by the type alone: the
        // number rules' own message for any non-number, or the date one.
        badInputError={
          isNumber
            ? getCustomFieldNumberError(dataType, "?")
            : "Please enter a valid date."
        }
        validate={([from = "", to = ""]) => {
          if (isNumber)
            for (const end of [from, to]) {
              const error = end
                ? getCustomFieldNumberError(dataType, end)
                : undefined;
              if (error) return error;
            }
          return isInvertedRange(dataType, from, to)
            ? INVERTED_RANGE_ERROR
            : undefined;
        }}
        onCommit={commit}
        inputsClassName="grid grid-cols-2 gap-2"
        inputs={[endProps("from"), endProps("to")]}
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
          className={selectClasses}
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
          className={inputClasses}
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

    const isDateTime = dataType === CustomFieldDataType.DateTime;
    const isDate = isDateTime || dataType === CustomFieldDataType.Date;
    const isNumber =
      dataType === CustomFieldDataType.Integer ||
      dataType === CustomFieldDataType.Decimal;

    // DateTime is submitted as UTC ISO-8601 (the date input works in YYYY-MM-DD). A
    // date-only field submits the input's YYYY-MM-DD as it is.
    const toStored = (raw: string) =>
      isDateTime ? (raw ? dateInputToUTC(raw) : null) : raw || null;
    const fromStored = (stored: string | null | undefined) =>
      isDateTime ? utcToDateInput(stored ?? undefined) : (stored ?? "");

    const inputProps = {
      type: isDate ? "date" : isNumber ? "number" : "text",
      step: isNumber
        ? dataType === CustomFieldDataType.Integer
          ? "1"
          : "any"
        : undefined,
      className: inputClasses,
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

        // `min-w-0` on the fieldset and its rows: a fieldset (a grid in daisyUI) otherwise grows
        // to its longest chip and widens the whole panel; the chips truncate inside instead.
        if (fixedOperators)
          return (
            <fieldset
              key={definition.key}
              className="fieldset min-w-0 gap-1"
              data-custom-field-key={definition.key}
              data-custom-field-datatype={definition.dataType}
            >
              <label className="label">
                <span className="label-text font-semibold">
                  {definition.title}
                </span>
              </label>

              {/* A clause from an older link that this control can't show: it still filters,
                  and editing the control replaces it. */}
              {filter &&
                !isShownByFixedControl(dataTypeOf(definition), filter) && (
                  <p className="text-gray-dark text-xs">
                    From a shared link:{" "}
                    {customFieldChipValue(
                      filter,
                      labelUnshown(filter),
                      dataTypeOf(definition),
                    )}
                    .
                  </p>
                )}

              <div className="min-w-0">
                {renderFixedControl(definition, filter)}
              </div>
            </fieldset>
          );

        const operators = getCustomFieldFilterOperators(definition);
        const operator =
          filter?.operator ?? operators[0] ?? CustomFieldFilterOperator.Equals;
        const error = getCustomFieldFilterError(definition, filter);

        return (
          <fieldset
            key={definition.key}
            className="fieldset min-w-0 gap-1"
            data-custom-field-key={definition.key}
            data-custom-field-datatype={definition.dataType}
          >
            <label className="label">
              <span className="label-text font-semibold">
                {definition.title}
              </span>
            </label>

            <div className="flex min-w-0 flex-col gap-1 sm:flex-row">
              <select
                className={`${selectClasses} sm:w-40`}
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

              <div className="w-full min-w-0">
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

type DraftInputProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "value" | "onChange" | "onInput" | "onBlur" | "onKeyDown"
>;

/**
 * The typed inputs of one fixed-operator field: a text input, or a From–To pair.
 *
 * With `commitOnBlur` each input keeps a local draft and typing dispatches nothing. The field
 * commits on Enter (focus stays put) or when focus leaves the FIELD, so tabbing From → To
 * doesn't commit and one edit of both ends is one search. As in discovery's
 * FreeTextSearchInput, the drafts are trimmed and nothing is committed when they match what is
 * already committed. An invalid draft is never committed: the clause stays as it was, and the
 * error shows from the first attempt. That includes text the browser can't parse ("5000e" in a
 * number input), which it reports as "" (`validity.badInput`), so it never reads as a cleared
 * field. Without `commitOnBlur` every change commits.
 *
 * The drafts follow the committed values, with FreeTextSearchInput's "adjust state on a prop
 * change" pattern, when those change or `resetKey` says the search was replaced (Clear filters,
 * back / forward, a replayed search). Otherwise a stale draft would commit back over the change on
 * the next blur. A focused field is never overwritten, and a draft that failed validation
 * survives an unrelated change with its error; see `draftSyncOf` for the rule.
 */
const DraftInputs: React.FC<{
  /** The committed values as the inputs show them, one per input. */
  committed: string[];
  /** Changes when the search changes from outside; see above. */
  resetKey: string;
  /** Props per input (type, placeholder, aria-label, classes…). */
  inputs: DraftInputProps[];
  commitOnBlur: boolean;
  showErrors?: boolean;
  /** The error for a set of values, or undefined when they may be committed. */
  validate: (values: string[]) => string | undefined;
  /** The error while an input holds text the browser can't parse. */
  badInputError?: string;
  onCommit: (values: string[]) => void;
  inputsClassName?: string;
}> = ({
  committed,
  resetKey,
  inputs,
  commitOnBlur,
  showErrors,
  validate,
  badInputError = "Please enter a valid value.",
  onCommit,
  inputsClassName,
}) => {
  const [drafts, setDrafts] = useState(committed);
  // Per input: the browser can't parse what is typed, so it reports "".
  const [bad, setBad] = useState<boolean[]>([]);
  const [attempted, setAttempted] = useState(false);
  const [focused, setFocused] = useState(false);
  // Bumped to remount the inputs on a reset: an input holding unparseable text already reports
  // "", so setting "" again would leave that text on screen.
  const [generation, setGeneration] = useState(0);
  // The values this field last committed: after Enter, the drafts take the committed values only
  // while they still equal these, so typing on before the commit renders isn't overwritten.
  const [sent, setSent] = useState<string[] | null>(null);

  const committedKey = JSON.stringify(committed);
  const [syncedCommitted, setSyncedCommitted] = useState(committedKey);
  const [syncedReset, setSyncedReset] = useState(resetKey);
  if (committedKey !== syncedCommitted || resetKey !== syncedReset) {
    setSyncedCommitted(committedKey);
    setSyncedReset(resetKey);
    const sync = draftSyncOf({ focused, committed, sent, drafts });
    if (sync === "reset") {
      setDrafts(committed);
      setBad([]);
      setAttempted(false);
      setGeneration((g) => g + 1);
    } else if (sync === "adopt") {
      setDrafts(committed);
      setAttempted(false);
    }
  }

  const errorFor = (values: string[], badInputs: boolean[]) =>
    badInputs.some(Boolean) ? badInputError : validate(values);

  const commit = (values: string[], badInputs: boolean[]): void => {
    setAttempted(true);
    if (errorFor(values, badInputs) !== undefined) return;
    if (values.every((value, i) => value === (committed[i] ?? ""))) return;
    setSent(values);
    onCommit(values);
  };
  const commitDrafts = (): void =>
    commit(
      drafts.map((draft) => draft.trim()),
      bad,
    );

  const badWith = (index: number, isBad: boolean): boolean[] =>
    inputs.map((_, i) => (i === index ? isBad : (bad[i] ?? false)));

  const change = (index: number, value: string, isBad: boolean): void => {
    const next = drafts.map((draft, i) => (i === index ? value : draft));
    const nextBad = badWith(index, isBad);
    setDrafts(next);
    setBad(nextBad);
    if (!commitOnBlur) commit(next, nextBad);
  };

  const error =
    attempted || showErrors
      ? errorFor(
          commitOnBlur ? drafts.map((draft) => draft.trim()) : drafts,
          bad,
        )
      : undefined;

  return (
    <div
      className="flex min-w-0 flex-col gap-1"
      onFocus={() => setFocused(true)}
      onBlur={(e) => {
        // Moving between this field's own inputs is not leaving it.
        const next = e.relatedTarget;
        if (next instanceof Node && e.currentTarget.contains(next)) return;
        setFocused(false);
        if (commitOnBlur) commitDrafts();
      }}
    >
      <div className={inputsClassName}>
        {inputs.map((props, index) => (
          <input
            key={`${generation}:${index}`}
            {...props}
            value={drafts[index] ?? ""}
            onChange={(e) =>
              change(index, e.target.value, e.target.validity.badInput)
            }
            // `change` misses some of these: the value stays "" while unparseable text is
            // typed or deleted, so React reports no change.
            onInput={(e) => {
              const isBad = e.currentTarget.validity.badInput;
              if (isBad !== (bad[index] ?? false))
                setBad(badWith(index, isBad));
            }}
            onKeyDown={(e) =>
              commitOnBlur && e.key === "Enter" && commitDrafts()
            }
          />
        ))}
      </div>

      {/* Discovery's error token; the text is the shared one. */}
      {error && (
        <label className="label font-bold">
          <span className="label-text-alt text-pink italic">{error}</span>
        </label>
      )}
    </div>
  );
};

export default CustomFieldFilters;
