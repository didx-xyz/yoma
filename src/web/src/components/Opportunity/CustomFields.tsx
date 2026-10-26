import { useEffect, useMemo, useRef, useState } from "react";
import Select from "react-select";
import Async from "react-select/async";
import {
  CustomFieldDataType,
  CustomFieldLookupType,
  type CustomFieldDefinition,
  type CustomFieldValueRequest,
} from "~/api/models/opportunity";
import type { SelectOption, Skill } from "~/api/models/lookups";
import { getSkills } from "~/api/services/lookups";
import FormField from "~/components/Common/FormField";
import FormInput from "~/components/Common/FormInput";
import FormRadio from "~/components/Common/FormRadio";
import {
  useCurrenciesQuery,
  useEducationsQuery,
  useOpportunityCountriesQuery,
  useOpportunityLanguagesQuery,
  useSkillLabeler,
} from "~/hooks/useOpportunityMutations";
import { PAGE_SIZE_MEDIUM } from "~/lib/constants";
import { skillIdsInValues } from "~/lib/customFields/skillLabels";
import { dateInputToUTC, debounce, utcToDateInput } from "~/lib/utils";
import { RequiredMark } from "./RequiredMark";

// ─────────────────────────────────────────────────────────────────────────────
// CustomFields (YOM-1244 / YOM-1255)
//
// Editable, definition-driven custom fields. Context-agnostic (Opportunity today;
// MyOpportunity / User later) — pass the applicable definitions in.
// For read-only display of saved values, see CustomFieldsView.
//
// Definition-driven custom fields. Fields are rendered purely from `definitions`
// (no hardcoded keys, titles, options or opportunity types). One control per
// DataType: String / Integer / Decimal / Boolean / Date / DateTime / Option.
// Boolean is an explicit Yes / No choice (radios when required, a select with an
// empty state otherwise), so "No" is an answer rather than an untouched checkbox.
//
// Option fields:
//   - lookupType null            → inline `options` (submit option keys)
//   - lookupType Country / Language / Education / Currency
//                                 → load from lookup endpoint (submit lookup GUIDs)
//   - lookupType Skill            → async search (submit lookup GUIDs)
//   - supportsMultiple            → single- vs multi-select
//
// Optional `rules` (off by default) lets a host apply cross-field rules the
// definition contract cannot express — e.g. ~/lib/customFields/customFieldRules,
// which mirrors the API's protected Job and Impact Action contracts. Rules may clear dependent
// values, disable fields and add per-field errors.
//
// Values use the API contract (CustomFieldValueRequest): non-option fields use
// `value`; every Option field uses `values`. The parent owns submission and must
// resubmit the full collection (replacement semantics — omitted keys are cleared).
// ─────────────────────────────────────────────────────────────────────────────

export interface CustomFieldsProps {
  /** Active definitions applicable to the currently selected opportunity type. */
  definitions: CustomFieldDefinition[] | null | undefined;
  /** Current values, joined to definitions by `key`. Managed by the parent form. */
  values?: CustomFieldValueRequest[] | null;
  /** Emits the full (non-empty) custom-field collection on any change. */
  onChange?: (values: CustomFieldValueRequest[]) => void;
  /** True while definitions are being fetched (type change / initial load). */
  isLoading?: boolean;
  /** Force display of validation errors (e.g. on submit attempt). */
  showErrors?: boolean;
  /** react-select menu portal target (defaults to document.body to avoid clipping). */
  menuPortalTarget?: HTMLElement | null;
  /** Hide group and subgroup section headers. Defaults to false. */
  hideGrouping?: boolean;
  /**
   * The line under the "Additional details" title, in the host's own voice (the editor's says
   * the details are shown and searchable). Omitted → no line: the title and group headings are
   * enough, as on the youth completion form.
   */
  intro?: string;
  /**
   * Hide each definition's `description` under its field. Descriptions are written for admins,
   * so the youth completion form hides them; the editor keeps them. Defaults to false.
   */
  hideDescriptions?: boolean;
  /**
   * Optional cross-field rules, applied on every change (their `values` replace the edited
   * collection, so dependents can be cleared) and on render (`disabledKeys`, `errors`).
   * Must be referentially stable (memoize it). Omitted → purely definition-driven.
   */
  rules?: CustomFieldRules;
  /**
   * `"completion"` is the youth's completion form (2026-10-21): no "Additional details" title
   * (its section header replaces it), "(optional)" after every optional label instead of the
   * required marker, and full-width controls. `"editor"` (default) is unchanged.
   */
  variant?: "editor" | "completion";
}

export interface CustomFieldRulesResult {
  values: CustomFieldValueRequest[];
  disabledKeys?: Set<string>;
  errors?: { key: string; message: string }[];
}

export type CustomFieldRules = (
  values: CustomFieldValueRequest[],
) => CustomFieldRulesResult;

interface CustomFieldGroup {
  group: string;
  subGroups: {
    subGroup: string | null;
    definitions: CustomFieldDefinition[];
  }[];
}

type ValueMap = Record<string, CustomFieldValueRequest>;

const dataTypeOf = (definition: CustomFieldDefinition) =>
  definition.dataType as string;

const lookupTypeOf = (definition: CustomFieldDefinition) =>
  (definition.lookupType as string | null) ?? null;

/** "1 field" · "5 fields" — a group heading's count. */
const fieldCountLabel = (count: number): string =>
  `${count} ${count === 1 ? "field" : "fields"}`;

// Group definitions by Group → SubGroup, ordering by SortOrder then Title within
// each subgroup. Groups and subgroups preserve first-seen order after sorting.
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

/** The definitions in the order the fields render: by group, subgroup, sort order, title. */
export function orderCustomFieldDefinitions(
  definitions: CustomFieldDefinition[] | null | undefined,
): CustomFieldDefinition[] {
  return groupDefinitions(definitions ?? []).flatMap((group) =>
    group.subGroups.flatMap((subGroup) => subGroup.definitions),
  );
}

export function isCustomFieldEntryEmpty(
  entry: CustomFieldValueRequest | undefined,
): boolean {
  if (!entry) return true;
  if (entry.values != null) return entry.values.length === 0;
  return entry.value == null || entry.value.trim() === "";
}

// Validates a non-empty numeric value against the C# API's invariant parsing.
// Exported so the filter UI (CustomFieldFilters) applies the identical rules. With the
// field's `title` the message names the field; without one (the filters) it is generic.
export function getCustomFieldNumberError(
  dataType: string,
  value: string,
  title?: string,
): string | undefined {
  if (dataType === CustomFieldDataType.Integer) {
    if (!INTEGER_REGEX.test(value))
      return title
        ? `${title} must be a whole number, like 3.`
        : "Enter a whole number, like 3.";
    const parsed = Number(value);
    if (parsed > INT32_MAX)
      return title
        ? `${title} is too big a number.`
        : "That number is too big.";
    if (parsed < INT32_MIN)
      return title
        ? `${title} is too small a number.`
        : "That number is too small.";
  } else if (dataType === CustomFieldDataType.Decimal) {
    if (!DECIMAL_REGEX.test(value))
      return title
        ? `${title} must be a number, like 1500 or 12.5.`
        : "Enter a number, like 1500 or 12.5.";
    if (exceedsDecimalMax(value))
      return title
        ? `${title} is too big a number.`
        : "That number is too big.";
  }
  return undefined;
}

// Number validation mirrors the C# API's invariant parsing:
// Integer → Int32 (whole number, in range); Decimal → invariant decimal text.
const INT32_MIN = -2147483648;
const INT32_MAX = 2147483647;
const INTEGER_REGEX = /^-?\d+$/;
const DECIMAL_REGEX = /^-?\d+(\.\d+)?$/;
// Absolute integer portion of C# decimal.MaxValue (79,228,162,514,264,337,593,543,950,335).
// Too large for JS Number, so magnitude is compared as digit strings (exact).
const DECIMAL_MAX_INTEGER_DIGITS = "79228162514264337593543950335";

// True when |value| exceeds C# decimal.MaxValue. Assumes DECIMAL_REGEX has passed.
function exceedsDecimalMax(value: string): boolean {
  const abs = value.replace("-", "");
  const [rawInt, frac] = abs.split(".");
  const intPart = (rawInt ?? "").replace(/^0+/, "") || "0";
  if (intPart.length !== DECIMAL_MAX_INTEGER_DIGITS.length)
    return intPart.length > DECIMAL_MAX_INTEGER_DIGITS.length;
  // same digit count → lexicographic compare equals numeric compare
  if (intPart !== DECIMAL_MAX_INTEGER_DIGITS)
    return intPart > DECIMAL_MAX_INTEGER_DIGITS;
  // integer part equals the max → any non-zero fraction pushes it over
  return !!frac && /[1-9]/.test(frac);
}

// Date fields mirror the API's strict `DateOnly.ParseExact(value, "yyyy-MM-dd")`: the
// shape AND a real calendar day (2026-02-30 is rejected). No time zone is involved.
const DATE_ONLY_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export function isValidDateOnly(value: string): boolean {
  if (!DATE_ONLY_REGEX.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number) as [
    number,
    number,
    number,
  ];
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

// Definitions carry .NET patterns (the API validates with System.Text.RegularExpressions).
// The string anchors differ: `\A` / `\z` / `\Z` are anchors in .NET but match a literal
// "A" / "z" / "Z" in JavaScript, so `\A[\s\S]{1,500}\z` rejected every normal value.
// Translate them outside character classes; everything else is shared syntax.
export function toEcmaScriptPattern(pattern: string): string {
  let out = "";
  let inClass = false;
  for (let i = 0; i < pattern.length; i++) {
    const char = pattern[i];
    if (char === "\\" && i + 1 < pattern.length) {
      const next = pattern[i + 1];
      i++;
      if (!inClass && next === "A") out += "^";
      else if (!inClass && next === "z") out += "$";
      else if (!inClass && next === "Z") out += "(?=\\n?$)";
      else out += char + next;
      continue;
    }
    if (char === "[") inClass = true;
    else if (char === "]") inClass = false;
    out += char;
  }
  return out;
}

// The API tests `validationRegex` against the NORMALISED value, for every data type
// (`CustomFieldValueService.Normalize`): a String trimmed, an Integer as its invariant
// `int` text ("007" → "7", "-0" → "0"), so `EntrepreneurshipJobsCreated`'s
// non-negative pattern rejects "-1" here rather than on save. Other types are not
// mirrored — no definition gives them a pattern — and are left to the API.
function patternSubject(dataType: string, value: string): string | null {
  if (dataType === CustomFieldDataType.String) return value.trim();
  if (dataType === CustomFieldDataType.Integer)
    // only reached once getCustomFieldNumberError accepted it as an Int32 (`-?\d+`)
    return String(Number(value) + 0);
  return null;
}

// Pure per-field validator, shared by this component's inline errors and the
// caller's zod schema (so both agree without duplicating rules).
export function getCustomFieldError(
  definition: CustomFieldDefinition,
  entry: CustomFieldValueRequest | undefined,
): string | undefined {
  const empty = isCustomFieldEntryEmpty(entry);
  const dataType = dataTypeOf(definition);

  if (definition.isRequired && empty) return requiredMessage(definition);

  if (!empty && entry?.value) {
    const numErr = getCustomFieldNumberError(
      dataType,
      entry.value,
      definition.title,
    );
    if (numErr) return numErr;
    if (dataType === CustomFieldDataType.Date && !isValidDateOnly(entry.value))
      return `Enter a real date for ${definition.title}.`;
  }

  const subject =
    !empty && entry?.value ? patternSubject(dataType, entry.value) : null;
  if (subject !== null && definition.validationRegex) {
    try {
      if (
        !new RegExp(toEcmaScriptPattern(definition.validationRegex)).test(
          subject,
        )
      )
        return (
          definition.validationErrorMessage ??
          `Check ${definition.title}: it isn't in the format we need.`
        );
    } catch {
      // ignore malformed regex from the definition
    }
  }

  return undefined;
}

// "Enter {title}." for typed values, "Choose {title}." for options and lookups, and
// "Choose Yes or No for {title}." for a Boolean (2026-10-21 copy).
function requiredMessage(definition: CustomFieldDefinition): string {
  const dataType = dataTypeOf(definition);
  if (dataType === CustomFieldDataType.Boolean)
    return `Choose Yes or No for ${definition.title}.`;
  if (dataType === CustomFieldDataType.Option)
    return `Choose ${definition.title}.`;
  return `Enter ${definition.title}.`;
}

// Validates a full value collection against its definitions (joined by key).
// Returns one entry per invalid field; empty array means valid.
export function getCustomFieldErrors(
  definitions: CustomFieldDefinition[] | null | undefined,
  values: CustomFieldValueRequest[] | null | undefined,
): { key: string; title: string; error: string }[] {
  const byKey = new Map<string, CustomFieldValueRequest>();
  (values ?? []).forEach((v) => byKey.set(v.key, v));

  const errors: { key: string; title: string; error: string }[] = [];
  for (const definition of definitions ?? []) {
    const error = getCustomFieldError(definition, byKey.get(definition.key));
    if (error)
      errors.push({ key: definition.key, title: definition.title, error });
  }
  return errors;
}

// Boolean values are stored as the invariant strings the API parses
const BOOLEAN_OPTIONS = [
  { value: "true", label: "Yes" },
  { value: "false", label: "No" },
];

// shared react-select styling to match the rest of the opportunity form
const SELECT_STYLES = {
  menuPortal: (base: any) => ({ ...base, zIndex: 9999 }),
  placeholder: (base: any) => ({ ...base, color: "#A3A6AF" }),
};

export const CustomFields: React.FC<CustomFieldsProps> = ({
  definitions,
  values,
  onChange,
  isLoading,
  showErrors,
  menuPortalTarget,
  hideGrouping = false,
  intro,
  hideDescriptions = false,
  rules,
  variant = "editor",
}) => {
  const completion = variant === "completion";
  // the editor's controls take half the row; the completion form's section card is narrow
  const controlWidth = completion ? "" : "md:w-1/2";
  const groups = useMemo(
    () => groupDefinitions(definitions ?? []),
    [definitions],
  );

  // which lookups are actually referenced by the current definitions
  const { needsCountry, needsLanguage, needsEducation, needsCurrency } =
    useMemo(() => {
      const list = definitions ?? [];
      const needs = (lookupType: CustomFieldLookupType) =>
        list.some((d) => lookupTypeOf(d) === lookupType);
      return {
        needsCountry: needs(CustomFieldLookupType.Country),
        needsLanguage: needs(CustomFieldLookupType.Language),
        needsEducation: needs(CustomFieldLookupType.Education),
        needsCurrency: needs(CustomFieldLookupType.Currency),
      };
    }, [definitions]);

  //#region Value state
  // `valueMap` is the local source of truth while editing. It updates immediately
  // on every keystroke (responsive input) while propagation to the parent `onChange`
  // is debounced. The seed effect ignores echoes of our own emissions to avoid a
  // feedback loop (emit → parent state → new `values` prop → re-seed → …).
  const [valueMap, setValueMap] = useState<ValueMap>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // keep a live ref to onChange so the debounced emitter stays stable
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  // signature of the last collection we emitted, so the seed effect can tell an
  // external change (initial load / type reset) from our own echo
  const lastPropagatedRef = useRef<string | null>(null);

  // holds the latest emitted collection so blur can flush it immediately (avoids
  // losing the final keystroke if the user saves within the debounce window)
  const latestCollectionRef = useRef<CustomFieldValueRequest[]>([]);

  const propagate = useMemo(
    () =>
      debounce((collection: CustomFieldValueRequest[]) => {
        onChangeRef.current?.(collection);
      }, 400),
    [],
  );

  // seed internal state from parent-provided values (joined by key), skipping echoes
  useEffect(() => {
    const incoming = values ?? [];
    const signature = JSON.stringify(incoming);
    if (signature === lastPropagatedRef.current) return; // our own echo — ignore

    const seeded: ValueMap = {};
    incoming.forEach((v) => {
      seeded[v.key] = v;
    });
    setValueMap(seeded);
    lastPropagatedRef.current = signature;
  }, [values]);

  const applyChange = (edited: ValueMap) => {
    let next = edited;
    let collection = Object.values(next).filter(
      (e) => !isCustomFieldEntryEmpty(e),
    );

    // host rules may clear dependent values (e.g. an undisclosed salary drops its amounts)
    if (rules) {
      const cleaned = rules(collection).values;
      if (cleaned !== collection) {
        const kept = new Set(cleaned.map((e) => e.key));
        next = { ...next };
        collection.forEach((e) => {
          if (!kept.has(e.key)) delete next[e.key];
        });
        collection = cleaned;
      }
    }

    setValueMap(next); // immediate local update
    latestCollectionRef.current = collection;
    lastPropagatedRef.current = JSON.stringify(collection);
    propagate(collection); // debounced parent update
  };

  // a change marks the field touched too, so its inline error keeps pace with the host's
  // live error count rather than waiting for blur
  const setScalar = (definition: CustomFieldDefinition, value: string) => {
    markTouched(definition.key);
    applyChange({
      ...valueMap,
      [definition.key]: { key: definition.key, value },
    });
  };

  const setOptionValues = (
    definition: CustomFieldDefinition,
    optionValues: string[],
  ) => {
    markTouched(definition.key);
    applyChange({
      ...valueMap,
      [definition.key]: { key: definition.key, values: optionValues },
    });
  };

  const markTouched = (key: string) =>
    setTouched((prev) => (prev[key] ? prev : { ...prev, [key]: true }));

  // on blur, mark touched and flush the latest value to the parent immediately,
  // so a save triggered within the debounce window still includes the last edit
  const handleBlur = (key: string) => {
    markTouched(key);
    onChangeRef.current?.(latestCollectionRef.current);
  };
  //#endregion Value state

  //#region Lookups
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

  // Currency submits the lookup id (never the ISO code) — unlike the core partner incentive
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
  // saved and picked skills are named by id (one request for all of them), so a saved skill shows
  // its name without a search that happens to return it; a picked one is named from the cache
  const skillIds = useMemo(
    () => skillIdsInValues(definitions, Object.values(valueMap)),
    [definitions, valueMap],
  );
  const skillLabel = useSkillLabeler(skillIds, skillCache);
  //#endregion Lookups

  const [defaultPortalTarget, setDefaultPortalTarget] =
    useState<HTMLElement | null>(null);
  useEffect(() => {
    setDefaultPortalTarget(document.body);
  }, []);
  const portalTarget = menuPortalTarget ?? defaultPortalTarget;

  // host rules, evaluated against the live (un-debounced) values
  const ruleResult = useMemo(
    () =>
      rules?.(
        Object.values(valueMap).filter((e) => !isCustomFieldEntryEmpty(e)),
      ) ?? null,
    [rules, valueMap],
  );
  const ruleErrors = useMemo(() => {
    const map = new Map<string, string>();
    ruleResult?.errors?.forEach(({ key, message }) => {
      if (!map.has(key.toLowerCase())) map.set(key.toLowerCase(), message);
    });
    return map;
  }, [ruleResult]);

  const isDisabled = (definition: CustomFieldDefinition) =>
    !!ruleResult?.disabledKeys?.has(definition.key);

  // a disabled field does not apply to the current selection, so it has no error of its own
  const fieldError = (definition: CustomFieldDefinition): string | undefined =>
    isDisabled(definition)
      ? undefined
      : (getCustomFieldError(definition, valueMap[definition.key]) ??
        ruleErrors.get(definition.key.toLowerCase()));

  // the field's label: the completion form marks a required field with its status (done /
  // missing, pink once the host shows all errors) to the left and says "(optional)" on the
  // others
  const labelOf = (definition: CustomFieldDefinition): React.ReactNode => {
    if (!completion) return definition.title;
    if (!definition.isRequired)
      return (
        <>
          {definition.title}
          <span className="text-gray-dark font-normal"> (optional)</span>
        </>
      );
    return (
      <>
        <RequiredMark
          done={!fieldError(definition)}
          afterSubmit={!!showErrors}
        />
        {definition.title}
      </>
    );
  };

  // the id the field's label points at (the selects already used it as `inputId`); the
  // required Boolean radiogroup has none, its `aria-label` names it
  const controlIdOf = (
    definition: CustomFieldDefinition,
  ): string | undefined =>
    dataTypeOf(definition) === CustomFieldDataType.Boolean &&
    definition.isRequired
      ? undefined
      : `input_customfield_${definition.key}`;

  const renderControl = (definition: CustomFieldDefinition) => {
    const entry = valueMap[definition.key];
    const dataType = dataTypeOf(definition);
    const key = definition.key;
    const disabled = isDisabled(definition);
    const id = controlIdOf(definition);

    switch (dataType) {
      case CustomFieldDataType.Integer:
      case CustomFieldDataType.Decimal:
        return (
          <FormInput
            className={controlWidth}
            inputProps={{
              id,
              type: "number",
              step: dataType === CustomFieldDataType.Integer ? "1" : "any",
              placeholder: "Enter a number...",
              value: entry?.value ?? "",
              onChange: (e) => setScalar(definition, e.target.value),
              onBlur: () => handleBlur(key),
              disabled,
              "data-custom-field-key": key,
            }}
          />
        );

      case CustomFieldDataType.Boolean: {
        // an explicit answer: "No" is a choice, not an untouched box
        const current = entry?.value?.trim().toLowerCase() ?? "";

        if (definition.isRequired)
          return (
            <div
              className="flex flex-row flex-wrap gap-6"
              role="radiogroup"
              aria-label={definition.title}
              data-custom-field-key={key}
            >
              {BOOLEAN_OPTIONS.map((option) => (
                <div key={option.value}>
                  <FormRadio
                    id={`customfield_${key}_${option.value}`}
                    label={option.label}
                    inputProps={{
                      name: `customfield_${key}`,
                      value: option.value,
                      checked: current === option.value,
                      onChange: () => setScalar(definition, option.value),
                      onBlur: () => handleBlur(key),
                      disabled,
                    }}
                  />
                </div>
              ))}
            </div>
          );

        return (
          <select
            id={id}
            className={`select select-bordered border-gray w-full rounded-md focus:outline-none ${controlWidth}`}
            value={
              BOOLEAN_OPTIONS.some((o) => o.value === current) ? current : ""
            }
            onChange={(e) => setScalar(definition, e.target.value)}
            onBlur={() => handleBlur(key)}
            disabled={disabled}
            aria-label={definition.title}
            data-custom-field-key={key}
          >
            <option value="">Select…</option>
            {BOOLEAN_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );
      }

      case CustomFieldDataType.DateTime:
        return (
          <FormInput
            className={controlWidth}
            inputProps={{
              id,
              type: "date",
              // API stores/returns UTC ISO; the date input needs YYYY-MM-DD
              value: utcToDateInput(entry?.value),
              onChange: (e) =>
                setScalar(definition, dateInputToUTC(e.target.value)),
              onBlur: () => handleBlur(key),
              disabled,
              "data-custom-field-key": key,
            }}
          />
        );

      case CustomFieldDataType.Date:
        return (
          <FormInput
            className={controlWidth}
            inputProps={{
              id,
              type: "date",
              // Date-only: the input's YYYY-MM-DD IS the wire value — no UTC conversion,
              // which would shift the day for anyone east or west of UTC.
              value: entry?.value ?? "",
              onChange: (e) => setScalar(definition, e.target.value),
              onBlur: () => handleBlur(key),
              disabled,
              "data-custom-field-key": key,
            }}
          />
        );

      case CustomFieldDataType.Option:
        return renderOptionControl(definition);

      case CustomFieldDataType.String:
      default:
        return (
          <FormInput
            className={controlWidth}
            inputProps={{
              id,
              type: "text",
              placeholder: "Enter a value...",
              value: entry?.value ?? "",
              onChange: (e) => setScalar(definition, e.target.value),
              onBlur: () => handleBlur(key),
              disabled,
              "data-custom-field-key": key,
            }}
          />
        );
    }
  };

  function renderOptionControl(definition: CustomFieldDefinition) {
    const entry = valueMap[definition.key];
    const key = definition.key;
    const isMulti = definition.supportsMultiple === true;
    const lookupType = lookupTypeOf(definition);
    const selected = entry?.values ?? [];
    const disabled = isDisabled(definition);

    const onSelectChange = (selectedValues: string[]) =>
      setOptionValues(definition, selectedValues);

    // Skill: async search
    if (lookupType === CustomFieldLookupType.Skill) {
      return (
        <Async
          instanceId={`customfield_${key}`}
          classNames={{
            control: () =>
              `input input-xs text-[1rem] h-fit w-full !border-gray ${controlWidth}`,
          }}
          isMulti={isMulti}
          isDisabled={disabled}
          defaultOptions={true}
          cacheOptions
          loadOptions={loadSkills}
          onBlur={() => handleBlur(key)}
          onChange={(val: any) =>
            onSelectChange(
              isMulti
                ? (val ?? []).map((o: SelectOption) => o.value)
                : val
                  ? [val.value]
                  : [],
            )
          }
          value={selected.map((id) => ({
            value: id,
            label: skillLabel(id),
          }))}
          menuPortalTarget={portalTarget}
          styles={SELECT_STYLES}
          placeholder="Search skills..."
          inputId={`input_customfield_${key}`}
        />
      );
    }

    // resolve the option set for inline vs lookup-backed fields
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
        instanceId={`customfield_${key}`}
        classNames={{
          control: () =>
            `input w-full !border-gray pr-0 pl-2 h-fit py-1 ${controlWidth}`,
        }}
        isMulti={isMulti}
        isClearable={true}
        isDisabled={disabled}
        options={options}
        onBlur={() => handleBlur(key)}
        onChange={(val: any) =>
          onSelectChange(
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
        inputId={`input_customfield_${key}`}
      />
    );
  }

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

  // the admin-facing description under a field, unless this host hides them
  const subLabelOf = (definition: CustomFieldDefinition): string | undefined =>
    hideDescriptions ? undefined : (definition.description ?? undefined);

  // One field: the label, the control in its keyed wrapper, and the error once the field was
  // touched or the host shows all errors. `data-completion-error` marks a shown error, so the
  // completion form can find the first one in document order.
  const renderField = (
    definition: CustomFieldDefinition,
    badge?: React.ReactNode,
  ) => {
    const error = fieldError(definition);
    const showError = !!(touched[definition.key] || showErrors);

    return (
      <FormField
        key={definition.key}
        label={labelOf(definition)}
        subLabel={subLabelOf(definition)}
        badge={badge}
        htmlFor={controlIdOf(definition)}
        showWarningIcon={!completion && !!error}
        showError={showError}
        error={error}
      >
        <div
          data-custom-field-key={definition.key}
          data-custom-field-datatype={definition.dataType}
          data-completion-error={error && showError ? "" : undefined}
        >
          {renderControl(definition)}
        </div>
      </FormField>
    );
  };

  return (
    <>
      {!completion && (
        <div className="mb-4 flex flex-col gap-2">
          <h5 className="font-bold tracking-wider">Additional details</h5>
          {intro && <p className="-mt-2 text-sm">{intro}</p>}
        </div>
      )}

      <div
        className="flex flex-col gap-4"
        data-testid="opportunity-custom-fields"
      >
        {hideGrouping ? (
          <>
            {groups.flatMap((group) =>
              group.subGroups.flatMap((subGroup) =>
                subGroup.definitions.map((definition) =>
                  renderField(definition),
                ),
              ),
            )}
          </>
        ) : (
          <>
            {groups.map((group) => (
              <div key={group.group} className="flex flex-col gap-3">
                {/* the label wraps before the count is pushed out of a 320px form */}
                <div className="flex items-center gap-3">
                  <span className="text-green min-w-0 text-sm font-semibold tracking-[0.12em] uppercase">
                    {group.group}
                  </span>
                  <span className="border-gray-light h-px flex-1 border-t"></span>
                  <span className="text-gray-dark shrink-0 text-sm font-medium">
                    {fieldCountLabel(
                      group.subGroups.reduce(
                        (count, subGroup) =>
                          count + subGroup.definitions.length,
                        0,
                      ),
                    )}
                  </span>
                </div>

                {group.subGroups.map((subGroup) => (
                  <div
                    key={`${group.group}-${subGroup.subGroup ?? "default"}`}
                    className="flex flex-col gap-3"
                  >
                    {subGroup.definitions.map((definition) =>
                      renderField(
                        definition,
                        subGroup.subGroup ? (
                          <div className="badge bg-green-light text-green-dark">
                            {subGroup.subGroup}
                          </div>
                        ) : undefined,
                      ),
                    )}
                  </div>
                ))}
              </div>
            ))}
          </>
        )}
      </div>
    </>
  );
};

export default CustomFields;
