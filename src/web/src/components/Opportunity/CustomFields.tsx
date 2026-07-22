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
import FormCheckbox from "~/components/Common/FormCheckbox";
import FormField from "~/components/Common/FormField";
import FormInput from "~/components/Common/FormInput";
import {
  useOpportunityCountriesQuery,
  useOpportunityLanguagesQuery,
} from "~/hooks/useOpportunityMutations";
import { PAGE_SIZE_MEDIUM } from "~/lib/constants";
import { dateInputToUTC, debounce, utcToDateInput } from "~/lib/utils";

// ─────────────────────────────────────────────────────────────────────────────
// OpportunityCustomFields (YOM-1244 / YOM-1255 — Task 1)
//
// Definition-driven custom fields. Fields are rendered purely from `definitions`
// (no hardcoded keys, titles, options or opportunity types). One control per
// DataType: String / Integer / Decimal / Boolean / DateTime / Option.
//
// Option fields:
//   - lookupType null            → inline `options` (submit option keys)
//   - lookupType Country/Language → load from lookup endpoint (submit lookup GUIDs)
//   - lookupType Skill            → async search (submit lookup GUIDs)
//   - supportsMultiple            → single- vs multi-select
//
// Values use the API contract (CustomFieldValueRequest): non-option fields use
// `value`; every Option field uses `values`. The parent owns submission and must
// resubmit the full collection (replacement semantics — omitted keys are cleared).
// ─────────────────────────────────────────────────────────────────────────────

export interface OpportunityCustomFieldsProps {
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
}

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

function isEmptyEntry(entry: CustomFieldValueRequest | undefined): boolean {
  if (!entry) return true;
  if (entry.values != null) return entry.values.length === 0;
  return entry.value == null || entry.value.trim() === "";
}

// Validates a non-empty numeric value against the C# API's invariant parsing.
function numberError(dataType: string, value: string): string | undefined {
  if (dataType === CustomFieldDataType.Integer) {
    if (!INTEGER_REGEX.test(value)) return "Please enter a whole number.";
    const parsed = Number(value);
    if (parsed < INT32_MIN || parsed > INT32_MAX)
      return `Number must be between ${INT32_MIN} and ${INT32_MAX}.`;
  } else if (dataType === CustomFieldDataType.Decimal) {
    if (!DECIMAL_REGEX.test(value)) return "Please enter a valid number.";
    if (exceedsDecimalMax(value))
      return "Number exceeds the maximum allowed value.";
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

// Pure per-field validator, shared by this component's inline errors and the
// caller's zod schema (so both agree without duplicating rules).
export function getCustomFieldError(
  definition: CustomFieldDefinition,
  entry: CustomFieldValueRequest | undefined,
): string | undefined {
  const empty = isEmptyEntry(entry);

  if (definition.isRequired && empty) return `${definition.title} is required.`;

  const dataType = dataTypeOf(definition);

  if (!empty && entry?.value) {
    const numErr = numberError(dataType, entry.value);
    if (numErr) return numErr;
  }

  if (
    !empty &&
    dataType === CustomFieldDataType.String &&
    definition.validationRegex &&
    entry?.value
  ) {
    try {
      if (!new RegExp(definition.validationRegex).test(entry.value))
        return (
          definition.validationErrorMessage ?? "Please enter a valid value."
        );
    } catch {
      // ignore malformed regex from the definition
    }
  }

  return undefined;
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

// shared react-select styling to match the rest of the opportunity form
const SELECT_STYLES = {
  menuPortal: (base: any) => ({ ...base, zIndex: 9999 }),
  placeholder: (base: any) => ({ ...base, color: "#A3A6AF" }),
};

export const OpportunityCustomFields: React.FC<
  OpportunityCustomFieldsProps
> = ({
  definitions,
  values,
  onChange,
  isLoading,
  showErrors,
  menuPortalTarget,
}) => {
  const groups = useMemo(
    () => groupDefinitions(definitions ?? []),
    [definitions],
  );

  // which lookups are actually referenced by the current definitions
  const { needsCountry, needsLanguage } = useMemo(() => {
    const list = definitions ?? [];
    return {
      needsCountry: list.some(
        (d) => lookupTypeOf(d) === CustomFieldLookupType.Country,
      ),
      needsLanguage: list.some(
        (d) => lookupTypeOf(d) === CustomFieldLookupType.Language,
      ),
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

  const applyChange = (next: ValueMap) => {
    setValueMap(next); // immediate local update
    const collection = Object.values(next).filter((e) => !isEmptyEntry(e));
    latestCollectionRef.current = collection;
    lastPropagatedRef.current = JSON.stringify(collection);
    propagate(collection); // debounced parent update
  };

  const setScalar = (definition: CustomFieldDefinition, value: string) =>
    applyChange({
      ...valueMap,
      [definition.key]: { key: definition.key, value },
    });

  const setOptionValues = (
    definition: CustomFieldDefinition,
    optionValues: string[],
  ) =>
    applyChange({
      ...valueMap,
      [definition.key]: { key: definition.key, values: optionValues },
    });

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

  const fieldError = (definition: CustomFieldDefinition): string | undefined =>
    getCustomFieldError(definition, valueMap[definition.key]);

  const renderControl = (definition: CustomFieldDefinition) => {
    const entry = valueMap[definition.key];
    const dataType = dataTypeOf(definition);
    const key = definition.key;

    switch (dataType) {
      case CustomFieldDataType.Integer:
      case CustomFieldDataType.Decimal:
        return (
          <FormInput
            className="md:w-1/2"
            inputProps={{
              type: "number",
              step: dataType === CustomFieldDataType.Integer ? "1" : "any",
              placeholder: "Enter a number...",
              value: entry?.value ?? "",
              onChange: (e) => setScalar(definition, e.target.value),
              onBlur: () => handleBlur(key),
              "data-custom-field-key": key,
            }}
          />
        );

      case CustomFieldDataType.Boolean:
        return (
          <FormCheckbox
            id={`customfield_${key}`}
            label={definition.description ?? definition.title}
            inputProps={{
              checked: entry?.value === "true",
              onChange: (e) =>
                setScalar(definition, e.target.checked ? "true" : "false"),
              onBlur: () => handleBlur(key),
            }}
          />
        );

      case CustomFieldDataType.DateTime:
        return (
          <FormInput
            className="md:w-1/2"
            inputProps={{
              type: "date",
              // API stores/returns UTC ISO; the date input needs YYYY-MM-DD
              value: utcToDateInput(entry?.value),
              onChange: (e) =>
                setScalar(definition, dateInputToUTC(e.target.value)),
              onBlur: () => handleBlur(key),
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
            className="md:w-1/2"
            inputProps={{
              type: "text",
              placeholder: "Enter a value...",
              value: entry?.value ?? "",
              onChange: (e) => setScalar(definition, e.target.value),
              onBlur: () => handleBlur(key),
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

    const onSelectChange = (selectedValues: string[]) =>
      setOptionValues(definition, selectedValues);

    // Skill: async search
    if (lookupType === CustomFieldLookupType.Skill) {
      return (
        <Async
          instanceId={`customfield_${key}`}
          classNames={{
            control: () =>
              "input input-xs text-[1rem] h-fit w-full !border-gray md:w-1/2",
          }}
          isMulti={isMulti}
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
            label: skillCache.find((s) => s.id === id)?.name ?? id,
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
            "input w-full !border-gray pr-0 pl-2 h-fit py-1 md:w-1/2",
        }}
        isMulti={isMulti}
        isClearable={true}
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

  return (
    <>
      <div className="mb-4 flex flex-col gap-2">
        <h5 className="font-bold tracking-wider">Additional details</h5>
        <p className="-mt-2 text-sm">
          Extra structured fields for this opportunity type, defined centrally
          and rendered here automatically.
        </p>
      </div>

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
                {subGroup.definitions.map((definition) => {
                  const error = fieldError(definition);
                  const isBoolean =
                    dataTypeOf(definition) === CustomFieldDataType.Boolean;
                  const badge = subGroup.subGroup;

                  return (
                    <FormField
                      key={definition.key}
                      // boolean renders its own inline label via FormCheckbox
                      label={isBoolean ? undefined : definition.title}
                      subLabel={
                        isBoolean
                          ? undefined
                          : (definition.description ?? undefined)
                      }
                      badge={
                        badge && !isBoolean ? (
                          <div className="badge bg-green-light text-green-dark">
                            {badge}
                          </div>
                        ) : undefined
                      }
                      showWarningIcon={!!error}
                      showError={!!(touched[definition.key] || showErrors)}
                      error={error}
                    >
                      <div
                        data-custom-field-key={definition.key}
                        data-custom-field-datatype={definition.dataType}
                      >
                        {renderControl(definition)}
                      </div>
                    </FormField>
                  );
                })}
              </div>
            ))}
          </div>
        ))}
      </div>
    </>
  );
};

export default OpportunityCustomFields;
