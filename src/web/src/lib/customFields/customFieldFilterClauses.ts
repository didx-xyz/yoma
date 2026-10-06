import {
  CustomFieldDataType,
  CustomFieldFilterOperator,
  type CustomFieldFilter,
} from "~/api/models/opportunity";
import {
  dateInputToUTC,
  dateInputToUTCEndOfDay,
  utcToDateInput,
} from "~/lib/utils";

// ─────────────────────────────────────────────────────────────────────────────
// Custom-field filter clauses (YOM-1260 / YOM-1262) — the pure rules behind
// `components/Opportunity/CustomFieldFilters`, kept free of React so the URL codec
// and the unit tests (`pnpm test`) can use them.
//
//   - clause completeness: a clause with no value never reaches the API;
//   - the fixed operators discovery uses (`fixedOperators`, 2026-10-05): one operator per
//     data type, so the youth never picks one;
//   - the chip wording for those operators;
//   - when a typed field's drafts follow its committed values (`commitOnBlur`).
//
// Like the rest of the framework, nothing here is keyed to a definition key, title or option.
// ─────────────────────────────────────────────────────────────────────────────

const OP = CustomFieldFilterOperator;

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

/** The one message for a range whose "from" is past its "to" (every caller shares it). */
export const INVERTED_RANGE_ERROR =
  "The 'from' value must not be greater than 'to'.";

export const isMultiValueOperator = (
  operator: CustomFieldFilterOperator | undefined,
) => operator === OP.AnyOf || operator === OP.AllOf;

export const hasScalar = (filter: CustomFieldFilter) =>
  filter.value != null && filter.value.trim() !== "";

export const hasUpperBound = (filter: CustomFieldFilter) =>
  filter.valueTo != null && filter.valueTo.trim() !== "";

/** True when a clause is usable: it has the value its operator needs. Exists always is. */
export function isCompleteCustomFieldFilter(
  filter: CustomFieldFilter,
): boolean {
  if (filter.operator === OP.Exists) return true;
  if (isMultiValueOperator(filter.operator))
    return (filter.values?.length ?? 0) > 0;
  if (filter.operator === OP.Between)
    return hasScalar(filter) && hasUpperBound(filter);
  return hasScalar(filter);
}

/**
 * Drops clauses that are not yet usable (no value chosen), so a half-completed
 * control never reaches the API. Exists clauses are always complete.
 */
export function sanitizeCustomFieldFilters(
  filters: CustomFieldFilter[] | null | undefined,
): CustomFieldFilter[] {
  return (filters ?? []).filter(isCompleteCustomFieldFilter);
}

//#region Fixed operators (`fixedOperators`)
/**
 * The one control each data type gets when operators are fixed:
 *   anyOf    — Option (inline options or a lookup): a multi-select, sent as `AnyOf`;
 *   contains — String: a text input, sent as `Contains`;
 *   range    — Integer / Decimal / Date / DateTime: a From–To pair. From alone sends
 *              `GreaterThanOrEqual`, To alone `LessThanOrEqual`, both `Between`;
 *   boolean  — Boolean: Any / Yes / No, sent as `Equals` ("Any" sends nothing).
 * An unknown data type falls back to String, as the operator select does.
 */
export type FixedFilterControl = "anyOf" | "contains" | "range" | "boolean";

export function fixedFilterControlOf(dataType: string): FixedFilterControl {
  switch (dataType) {
    case CustomFieldDataType.Option:
      return "anyOf";
    case CustomFieldDataType.Boolean:
      return "boolean";
    case CustomFieldDataType.Integer:
    case CustomFieldDataType.Decimal:
    case CustomFieldDataType.Date:
    case CustomFieldDataType.DateTime:
      return "range";
    default:
      return "contains";
  }
}

/**
 * True when the fixed control can show a clause. Besides the fixed operators themselves, an
 * Option `Equals` (an older link) shows as its one selected value. Any other clause is kept as
 * sent — it still filters — and the field says so under its label instead.
 */
export function isShownByFixedControl(
  dataType: string,
  clause: CustomFieldFilter,
): boolean {
  switch (fixedFilterControlOf(dataType)) {
    case "anyOf":
      return clause.operator === OP.AnyOf || clause.operator === OP.Equals;
    case "contains":
      return clause.operator === OP.Contains;
    case "boolean":
      return clause.operator === OP.Equals;
    case "range":
      return (
        clause.operator === OP.GreaterThanOrEqual ||
        clause.operator === OP.LessThanOrEqual ||
        clause.operator === OP.Between
      );
  }
}

/** A range end as the date input shows it: DateTime is stored as UTC ISO-8601. */
const rangeEndFromStored = (
  dataType: string,
  stored: string | null | undefined,
): string =>
  dataType === CustomFieldDataType.DateTime
    ? utcToDateInput(stored)
    : (stored ?? "");

/**
 * A range end as it is sent; null when empty. A DateTime "to" is the END of that day, so
 * "to 3 Nov" keeps everything later on 3 Nov. A date-only field sends the date as typed.
 */
export function rangeEndToStored(
  dataType: string,
  input: string,
  end: "from" | "to",
): string | null {
  if (input.trim() === "") return null;
  if (dataType !== CustomFieldDataType.DateTime) return input;
  return (
    (end === "to" ? dateInputToUTCEndOfDay(input) : dateInputToUTC(input)) ||
    null
  );
}

/**
 * The fixed control's values for a clause, as its inputs show them: the selected values
 * (anyOf), `[text]` (contains), `[value]` (boolean) or `[from, to]` (range). A clause the
 * control can't show leaves it empty.
 */
export function fixedControlValues(
  dataType: string,
  clause: CustomFieldFilter | undefined,
): string[] {
  const control = fixedFilterControlOf(dataType);
  const shown = clause && isShownByFixedControl(dataType, clause);

  if (control === "anyOf") {
    if (!shown) return [];
    if (clause.operator === OP.AnyOf) return [...(clause.values ?? [])];
    return clause.value ? [clause.value] : [];
  }

  if (control === "range") {
    if (!shown) return ["", ""];
    const from = clause.operator === OP.LessThanOrEqual ? null : clause.value;
    const to =
      clause.operator === OP.Between
        ? clause.valueTo
        : clause.operator === OP.LessThanOrEqual
          ? clause.value
          : null;
    return [
      rangeEndFromStored(dataType, from),
      rangeEndFromStored(dataType, to),
    ];
  }

  return [shown ? (clause.value ?? "") : ""];
}

/**
 * The clause a fixed control's values commit to, in the API's own shapes. Null when the
 * control is empty — an empty value removes its clause rather than sending an incomplete one.
 */
export function fixedClauseFor(
  dataType: string,
  key: string,
  values: string[],
): CustomFieldFilter | null {
  const control = fixedFilterControlOf(dataType);

  if (control === "anyOf") {
    const picked = values.filter((value) => value !== "");
    return picked.length > 0
      ? { key, operator: OP.AnyOf, values: picked }
      : null;
  }

  if (control === "range") {
    const from = rangeEndToStored(dataType, values[0] ?? "", "from");
    const to = rangeEndToStored(dataType, values[1] ?? "", "to");
    if (from !== null && to !== null)
      return { key, operator: OP.Between, value: from, valueTo: to };
    if (from !== null)
      return { key, operator: OP.GreaterThanOrEqual, value: from };
    if (to !== null) return { key, operator: OP.LessThanOrEqual, value: to };
    return null;
  }

  const value = values[0] ?? "";
  if (value.trim() === "") return null;
  return {
    key,
    operator: control === "contains" ? OP.Contains : OP.Equals,
    value,
  };
}

/**
 * True when both ends are set and "from" is past "to". Numbers compare as numbers; dates as
 * the date inputs' `YYYY-MM-DD`, which sorts as text.
 */
export function isInvertedRange(
  dataType: string,
  from: string,
  to: string,
): boolean {
  if (from === "" || to === "") return false;
  const numeric =
    dataType === CustomFieldDataType.Integer ||
    dataType === CustomFieldDataType.Decimal;
  return numeric ? Number(from) > Number(to) : from > to;
}

/**
 * A clause's chip value in discovery, where the operator is not on screen: the labeler's
 * value text, prefixed with the operator's label wherever the value alone would mislead —
 * "From 5000", "Up to 9000", "Contains “incub”". Between, and an Option's Any of or selected
 * value, read as they are; an Any of on any other type (an older link) says so, or "5000, 6000"
 * would read as a range. `dataType` is null while the definitions load.
 */
export function customFieldChipValue(
  clause: CustomFieldFilter,
  label: string,
  dataType: string | null,
): string {
  const operator = clause.operator;
  if (!operator) return label;
  const prefix = CUSTOM_FIELD_FILTER_OPERATOR_LABELS[operator] ?? operator;

  switch (operator) {
    case OP.Exists:
      return prefix;
    case OP.AnyOf:
      return dataType === null || dataType === CustomFieldDataType.Option
        ? label
        : `${prefix} ${label}`;
    case OP.Between:
      return label;
    case OP.Contains:
      return `${prefix} “${label}”`;
    case OP.Equals:
      return dataType === null ||
        dataType === CustomFieldDataType.Option ||
        dataType === CustomFieldDataType.Boolean
        ? label
        : `${prefix} ${label}`;
    default:
      return `${prefix} ${label}`;
  }
}
//#endregion Fixed operators

//#region Typed drafts (`commitOnBlur`)
/**
 * What a typed field's drafts do when its committed values or the outside reset signal change:
 *   reset — show the committed values: the field isn't focused, and either its own value changed
 *           (its chip removed, its own blur commit landing) or the search was replaced (Clear
 *           filters, back / forward, a replayed search);
 *   adopt — the field is focused and its own commit just landed, with nothing typed since: take
 *           the committed values (the trimmed drafts);
 *   keep  — the field is focused and something else changed, or the user typed after Enter
 *           before the commit rendered. A focused field is never overwritten.
 * A draft that failed validation sees neither signal on an unrelated change (another field's
 * commit, a pill tapped), so it stays with its error.
 */
export function draftSyncOf({
  focused,
  committed,
  sent,
  drafts,
}: {
  focused: boolean;
  /** The committed values, as the inputs show them. */
  committed: string[];
  /** The values this field last committed, or null before its first commit. */
  sent: string[] | null;
  drafts: string[];
}): "reset" | "adopt" | "keep" {
  if (!focused) return "reset";
  const key = (values: string[]) => JSON.stringify(values);
  return sent !== null &&
    key(committed) === key(sent) &&
    key(drafts.map((draft) => draft.trim())) === key(sent)
    ? "adopt"
    : "keep";
}
//#endregion Typed drafts
