import type {
  CustomFieldDefinition,
  CustomFieldValueRequest,
} from "~/api/models/opportunity";

// ─────────────────────────────────────────────────────────────────────────────
// Custom-field cross-field rules (YOM-1244 — Job and Impact Action fields)
//
// WHY THIS EXISTS. Custom fields are otherwise rendered and validated purely from
// their definitions. The definition contract has no conditional visibility or
// requiredness expressions, yet the API enforces cross-field rules on a handful of
// SYSTEM-CONTROLLED keys (`AssertCrossFieldRules` in OpportunityService.cs, one case
// per opportunity type; the keys live in Opportunity/CustomFieldConstants.cs). Per
// the epic's "One Rule", protected CF contracts may be referenced by shared
// constants — everything else stays metadata-driven. The API plans declarative,
// configurable rules later (its TODO); when those land this module goes.
//
// This module MIRRORS those API contracts so the editor can disable and clear
// dependent fields and explain a conflict before the save is rejected. It:
//   - keys ONLY on those system-controlled definition keys, plus the option keys
//     a rule interprets (Job employment Permanent / FixedTerm, Impact Action tool
//     Other); never on titles, labels or other options;
//   - is INERT when a controlling key is absent from the loaded definitions, so
//     other types and future definition changes are unaffected;
//   - is pure; the API remains the authority. Keep it in step with the API.
// ─────────────────────────────────────────────────────────────────────────────

/** Mirrors `CustomFieldConstants.ImpactAction` (API). Persisted contracts — never rename. */
export const IMPACT_ACTION_CUSTOM_FIELD_KEYS = {
  toolsRequired: "impactActionToolsRequired",
  toolsOtherDescription: "impactActionToolsOtherDescription",
} as const;

/** Mirrors the API's `ImpactActionTool` enum — the one tool option a rule interprets. */
export const IMPACT_ACTION_TOOL_OPTIONS = { Other: "Other" } as const;

/** Mirrors `CustomFieldConstants.Job` (API). Persisted contracts — never rename. */
export const JOB_CUSTOM_FIELD_KEYS = {
  salaryDisclosed: "jobSalaryDisclosed",
  salaryMinimum: "jobSalaryMinimum",
  salaryMaximum: "jobSalaryMaximum",
  salaryCurrency: "jobSalaryCurrency",
  payInterval: "jobPayInterval",
  employmentType: "jobEmploymentType",
  employmentDuration: "jobEmploymentDuration",
  employmentDurationUnit: "jobEmploymentDurationUnit",
} as const;

/**
 * Mirrors `CustomFieldConstants.Job.Salary.PayIntervalOptions` (API). Not used by a rule here —
 * the discovery cards label a disclosed salary's interval from it (`features/discovery/lib/money`).
 */
export const JOB_PAY_INTERVAL_OPTIONS = {
  PerYear: "PerYear",
  PerMonth: "PerMonth",
  PerHour: "PerHour",
  PerEngagement: "PerEngagement",
} as const;

/** Mirrors the API's `EmploymentType` enum — the only employment options a rule interprets. */
export const JOB_EMPLOYMENT_TYPE_OPTIONS = {
  Permanent: "Permanent",
  FixedTerm: "FixedTerm",
} as const;

const K = JOB_CUSTOM_FIELD_KEYS;
const IA = IMPACT_ACTION_CUSTOM_FIELD_KEYS;

/** Salary details that an undisclosed salary must not carry. */
const SALARY_DETAIL_KEYS = [
  K.salaryMinimum,
  K.salaryMaximum,
  K.salaryCurrency,
  K.payInterval,
];

/** Duration details that permanent employment must not carry. */
const DURATION_KEYS = [K.employmentDuration, K.employmentDurationUnit];

export interface CustomFieldRuleError {
  key: string;
  message: string;
}

export interface CustomFieldRuleResult {
  /** The input with rule-dependent values cleared (the same array when nothing changed). */
  values: CustomFieldValueRequest[];
  /** Keys that do not apply to the current selection — render disabled. */
  disabledKeys: Set<string>;
  /** Cross-field violations, keyed to the field the admin should change. */
  errors: CustomFieldRuleError[];
}

export interface CustomFieldRuleContext {
  /** The core `incentivized` answer; `null` / `undefined` = not answered yet. */
  incentivized?: boolean | null;
}

const sameKey = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();

const entryOf = (values: CustomFieldValueRequest[], key: string) =>
  values.find((v) => sameKey(v.key, key));

const scalarOf = (
  values: CustomFieldValueRequest[],
  key: string,
): string | null => {
  const value = entryOf(values, key)?.value?.trim();
  return value ? value : null;
};

const selectionsOf = (
  values: CustomFieldValueRequest[],
  key: string,
): string[] => entryOf(values, key)?.values ?? [];

/** A parseable number, else null (format errors are the generic validator's job). */
const numberOf = (
  values: CustomFieldValueRequest[],
  key: string,
): number | null => {
  const value = scalarOf(values, key);
  if (value === null) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

/**
 * Applies the API's cross-field rules (`AssertCrossFieldRules`) to a custom-field collection.
 * Job salary rules run only when `jobSalaryDisclosed` is among the definitions, employment rules
 * only when `jobEmploymentType` is, and the Impact Action tools rule only when both tools keys
 * are. Otherwise the input is returned untouched.
 */
export function applyCustomFieldRules(
  definitions: CustomFieldDefinition[] | null | undefined,
  values: CustomFieldValueRequest[] | null | undefined,
  context: CustomFieldRuleContext = {},
): CustomFieldRuleResult {
  const defs = definitions ?? [];
  const input = values ?? [];
  const defined = (key: string) => defs.some((d) => sameKey(d.key, key));

  const disabledKeys = new Set<string>();
  const errors: CustomFieldRuleError[] = [];
  const cleared = new Set<string>();

  const disable = (keys: string[]) =>
    keys.forEach((key) => {
      disabledKeys.add(key);
      cleared.add(key.toLowerCase());
    });

  //#region Salary — compensation, not a partner incentive
  if (defined(K.salaryDisclosed)) {
    const disclosed = scalarOf(input, K.salaryDisclosed)?.toLowerCase();

    if (disclosed === "false") {
      // "An undisclosed salary cannot include salary amounts, currency or pay interval."
      disable(SALARY_DETAIL_KEYS);
    } else {
      const minimum = numberOf(input, K.salaryMinimum);
      const maximum = numberOf(input, K.salaryMaximum);
      const hasSalary =
        scalarOf(input, K.salaryMinimum) !== null ||
        scalarOf(input, K.salaryMaximum) !== null;
      const hasCurrency = selectionsOf(input, K.salaryCurrency).length > 0;
      const hasInterval = selectionsOf(input, K.payInterval).length > 0;

      if (minimum !== null && minimum <= 0)
        errors.push({
          key: K.salaryMinimum,
          message: "Salary amounts must be greater than zero.",
        });
      if (maximum !== null && maximum <= 0)
        errors.push({
          key: K.salaryMaximum,
          message: "Salary amounts must be greater than zero.",
        });
      if (
        minimum !== null &&
        maximum !== null &&
        minimum > 0 &&
        maximum > 0 &&
        maximum < minimum
      )
        errors.push({
          key: K.salaryMaximum,
          message: "Maximum salary cannot be less than minimum salary.",
        });

      if (disclosed === "true") {
        if (!hasSalary)
          errors.push({
            key: K.salaryMinimum,
            message:
              "A disclosed salary needs a minimum or maximum amount. Otherwise set Salary disclosed to No.",
          });
        if (!hasCurrency)
          errors.push({
            key: K.salaryCurrency,
            message: "A disclosed salary needs a currency.",
          });
        if (!hasInterval)
          errors.push({
            key: K.payInterval,
            message: "A disclosed salary needs a pay interval.",
          });
      }

      if (
        context.incentivized === false &&
        (disclosed === "true" || hasSalary || hasCurrency || hasInterval)
      )
        errors.push({
          key: K.salaryDisclosed,
          message:
            "A Job with salary details cannot be marked as not incentivized. Change the answer on the Rewards step, or set Salary disclosed to No.",
        });
    }
  }
  //#endregion Salary

  //#region Employment — type does not imply schedule or duration
  if (defined(K.employmentType)) {
    const types = selectionsOf(input, K.employmentType);
    const permanent = types.some((t) =>
      sameKey(t, JOB_EMPLOYMENT_TYPE_OPTIONS.Permanent),
    );
    const fixedTerm = types.some((t) =>
      sameKey(t, JOB_EMPLOYMENT_TYPE_OPTIONS.FixedTerm),
    );

    if (permanent && fixedTerm)
      errors.push({
        key: K.employmentType,
        message: "Permanent and Fixed-term employment cannot be combined.",
      });

    if (permanent) {
      // "Permanent employment cannot specify an employment duration or unit."
      disable(DURATION_KEYS);
    } else {
      const duration = numberOf(input, K.employmentDuration);

      if (duration !== null && duration <= 0)
        errors.push({
          key: K.employmentDuration,
          message: "Employment duration must be greater than zero.",
        });

      if (types.length > 0) {
        if (scalarOf(input, K.employmentDuration) === null)
          errors.push({
            key: K.employmentDuration,
            message:
              "Employment duration is required unless employment is permanent.",
          });
        if (selectionsOf(input, K.employmentDurationUnit).length === 0)
          errors.push({
            key: K.employmentDurationUnit,
            message:
              "Employment duration unit is required unless employment is permanent.",
          });
      }
    }
  }
  //#endregion Employment

  //#region Impact Action tools — the Other description belongs to the Other tool
  // Applies on every write path (not only manual capture), both directions:
  // "Other tool description is required when Other is selected" / "…is only supported
  // when Other is selected". The description is disabled and cleared while Other is off.
  if (defined(IA.toolsRequired) && defined(IA.toolsOtherDescription)) {
    const other = selectionsOf(input, IA.toolsRequired).some((tool) =>
      sameKey(tool, IMPACT_ACTION_TOOL_OPTIONS.Other),
    );
    if (!other) disable([IA.toolsOtherDescription]);
    else if (scalarOf(input, IA.toolsOtherDescription) === null)
      errors.push({
        key: IA.toolsOtherDescription,
        message:
          "Describe the other tool — it is required when Other is selected.",
      });
  }
  //#endregion Impact Action tools

  if (cleared.size === 0) return { values: input, disabledKeys, errors };

  const cleaned = input.filter((v) => !cleared.has(v.key.toLowerCase()));
  return {
    values: cleaned.length === input.length ? input : cleaned,
    disabledKeys,
    errors,
  };
}
