import type { TreasuryFormField } from "~/api/models/treasury";
import { parseApiError } from "~/lib/apiErrorUtils";

/**
 * Maps `PATCH /treasury` validation failures onto the form fields that caused them.
 *
 * ⚠️ GOTCHA: the API does not tell us which field failed. `ExceptionResponseMiddleware:42` projects
 * every FluentValidation failure to `{ type, message }` and drops `PropertyName`, so the message text
 * is all we get. Matching on it is therefore the only way to land an error on its field instead of in
 * a generic toast — and it means this list has to be kept in step with
 * `TreasuryRequestUpdateValidator` and the two cross-field checks in `TreasuryService.Update`
 * (:78-85). Anything unmatched is surfaced verbatim above the form rather than swallowed.
 *
 * Model-binding failures take a different route (`ReformatValidationProblemAttribute`) and arrive as
 * "PropertyName: message", so a leading field-name prefix is honoured when present.
 */

interface Matcher {
  field: TreasuryFormField;
  pattern: RegExp;
}

/** Ordered: the first match wins, so the more specific patterns come first. */
const MATCHERS: Matcher[] = [
  {
    field: "financialYearStartMonth",
    pattern: /financial year start month/i,
  },
  {
    field: "financialYearStartDay",
    pattern: /financial year start day/i,
  },
  // "…cannot be less than the cumulative ZLTO rewards (N) already awarded…" (TreasuryService:80)
  {
    field: "zltoRewardPoolCurrentFinancialYear",
    pattern: /zlto reward pool/i,
  },
  /**
   * Covers all five payout-pool rejections, verified against the verbatim server strings
   * (2026-08-06): the four validator messages, and the pool floor
   * "The payout pool for the current financial year cannot be less than the total payout amount
   * (N USD) already paid out or pending" — `TreasuryService.Update`. The floor message changed when
   * pending payouts joined the floor; this pattern already matched the new wording, so no separate
   * matcher is needed. Keep the pattern this broad and it will survive the next rewording too.
   */
  {
    field: "payoutPoolCurrentFinancialYearInUsd",
    pattern: /payout pool/i,
  },
  {
    field: "conversionRateZltoPerUsd",
    pattern: /conversion rate/i,
  },
];

/** Server property names, for the "PropertyName: message" shape. */
const FIELD_BY_PROPERTY_NAME: Record<string, TreasuryFormField> = {
  financialyearstartmonth: "financialYearStartMonth",
  financialyearstartday: "financialYearStartDay",
  zltorewardpoolcurrentfinancialyear: "zltoRewardPoolCurrentFinancialYear",
  payoutpoolcurrentfinancialyearinusd: "payoutPoolCurrentFinancialYearInUsd",
  conversionratezltoperusd: "conversionRateZltoPerUsd",
};

export interface MappedTreasuryErrors {
  /** one message per field — the first failure reported for it */
  fieldErrors: Partial<Record<TreasuryFormField, string>>;
  /** validation messages that could not be attributed to a field; show these above the form */
  formErrors: string[];
  /** true when nothing at all could be extracted — the caller should fall back to <ApiErrors /> */
  isUnmapped: boolean;
}

/**
 * Splits the `"PropertyName: message"` shape that model-binding failures arrive in
 * (`ReformatValidationProblemAttribute`) — the only shape that names its own field.
 *
 * Matches the prefix only and slices the remainder off, rather than capturing it: a trailing `(.+)$`
 * group has to backtrack across the whole message and buys nothing.
 */
const splitPropertyPrefix = (
  text: string,
): { field?: TreasuryFormField; text: string } => {
  const prefixMatch = /^([A-Za-z]+)\s*:[ \t]*/.exec(text);
  if (!prefixMatch) return { text };

  const remainder = text.slice(prefixMatch[0].length).trim();
  if (!remainder) return { text };

  const field = FIELD_BY_PROPERTY_NAME[prefixMatch[1]!.toLowerCase()];
  return field ? { field, text: remainder } : { text };
};

export function mapTreasuryServerErrors(error: unknown): MappedTreasuryErrors {
  const { status, errors, message } = parseApiError(error);

  // Only 400s carry validation detail; 401/403/404/500 are page-level conditions.
  if (status !== 400) {
    return { fieldErrors: {}, formErrors: [], isUnmapped: true };
  }

  const messages = errors.map((item) => item.message).filter(Boolean);
  if (messages.length === 0 && message) messages.push(message);

  const fieldErrors: Partial<Record<TreasuryFormField, string>> = {};
  const formErrors: string[] = [];

  for (const raw of messages) {
    // A named prefix wins; otherwise fall back to matching the message text, which is all the API
    // gives us for FluentValidation failures.
    const { field: prefixField, text } = splitPropertyPrefix(raw.trim());
    const field =
      prefixField ??
      MATCHERS.find((matcher) => matcher.pattern.test(text))?.field;

    if (field) {
      fieldErrors[field] ??= text;
    } else {
      formErrors.push(text);
    }
  }

  const isUnmapped =
    Object.keys(fieldErrors).length === 0 && formErrors.length === 0;

  return { fieldErrors, formErrors, isUnmapped };
}
