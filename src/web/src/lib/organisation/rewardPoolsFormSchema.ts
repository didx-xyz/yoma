import z from "zod";
import {
  ORGANIZATION_REWARD_LIMITS,
  type OrganizationRewardFigures,
  type OrganizationRewardPoolField,
  type OrganizationRewardPools,
} from "~/api/models/organisation";
import { parseAmountInput } from "~/lib/format/amountInput";
import { formatYoma, formatZlto } from "~/lib/format/rewards";

/**
 * Client-side validation for an organisation's two reward pools.
 *
 * Mirrors `OrganizationRequestValidatorBase.cs:72-79` (> 0, ≤ 10 million, ZLTO whole numbers — the
 * Yoma pool deliberately allows decimals) plus the cross-field floors in
 * `OrganizationService.cs:465-469` (a pool may not be set below what has already been awarded this
 * financial year). The server stays the authority; this exists so a mistake lands on the field that
 * caused it instead of arriving as a generic toast.
 *
 * Follows the pattern established by `lib/treasury/treasuryFormSchema.ts` (T0), and reuses its amount
 * parser so both surfaces treat typed decimals identically.
 */

/** Amount fields stay strings: the text the admin typed is what the decimal rules inspect. */
export interface OrganizationRewardPoolsFormValues {
  zltoRewardPoolCurrentFinancialYear: string;
  yomaRewardPoolCurrentFinancialYear: string;
}

export const rewardPoolsFormValuesFromFigures = (
  figures: OrganizationRewardFigures,
): OrganizationRewardPoolsFormValues => ({
  zltoRewardPoolCurrentFinancialYear:
    figures.zltoRewardPoolCurrentFinancialYear?.toString() ?? "",
  yomaRewardPoolCurrentFinancialYear:
    figures.yomaRewardPoolCurrentFinancialYear?.toString() ?? "",
});

/** Empty means "no allocation" — the API accepts null for both pools. */
export const rewardPoolsFromFormValues = (
  values: OrganizationRewardPoolsFormValues,
): OrganizationRewardPools => {
  const zlto = parseAmountInput(values.zltoRewardPoolCurrentFinancialYear);
  const yoma = parseAmountInput(values.yomaRewardPoolCurrentFinancialYear);

  return {
    zltoRewardPoolCurrentFinancialYear:
      zlto.kind === "value" ? zlto.value : null,
    yomaRewardPoolCurrentFinancialYear:
      yoma.kind === "value" ? yoma.value : null,
  };
};

type AddIssue = (path: OrganizationRewardPoolField, message: string) => void;

interface PoolRules {
  field: OrganizationRewardPoolField;
  /** the reward's name as it appears in copy */
  label: string;
  /** already awarded this financial year — the floor the pool may not go below */
  awarded: number | null;
  /** ZLTO is whole numbers only; Yoma allows decimals */
  wholeNumbersOnly: boolean;
  maxDecimals: number;
  format: (value: number | null) => string;
}

const validatePool = (raw: string, rules: PoolRules, issue: AddIssue): void => {
  const pool = parseAmountInput(raw);

  // Empty is allowed — it removes the allocation.
  if (pool.kind === "empty") return;

  if (pool.kind === "invalid") {
    issue(rules.field, "Enter the pool as a number, using digits only.");
    return;
  }

  if (pool.value <= 0) {
    issue(
      rules.field,
      "The pool must be more than 0. Leave it empty to remove the allocation entirely.",
    );
    return;
  }

  if (pool.value > ORGANIZATION_REWARD_LIMITS.poolMax) {
    // The cap is a whole number for both rewards, so it reads better without Yoma's decimals.
    issue(
      rules.field,
      `The pool can't be more than ${formatZlto(ORGANIZATION_REWARD_LIMITS.poolMax)} ${rules.label}.`,
    );
    return;
  }

  if (rules.wholeNumbersOnly && pool.decimals > 0) {
    issue(
      rules.field,
      `${rules.label} amounts are whole numbers — remove the decimals.`,
    );
    return;
  }

  if (!rules.wholeNumbersOnly && pool.decimals > rules.maxDecimals) {
    // Stricter than the server on purpose: the column is decimal(12,2), so a third decimal is
    // silently rounded away on save. Better to say so than to change the admin's number quietly.
    issue(
      rules.field,
      `Use at most ${rules.maxDecimals} decimal places — anything finer is rounded when saved.`,
    );
    return;
  }

  /**
   * `OrganizationService.cs:465-469` — only enforced when a cumulative exists. The financial-year
   * rollover that zeroes these is Treasury-driven and cannot happen as part of this save, so unlike
   * the Treasury form there is no case where this floor should be skipped.
   */
  if (rules.awarded !== null && pool.value < rules.awarded) {
    issue(
      rules.field,
      `The pool can't be set below the ${rules.format(rules.awarded)} ${rules.label} already awarded this financial year.`,
    );
  }
};

export const buildOrganizationRewardPoolsSchema = (
  figures: OrganizationRewardFigures,
) =>
  z
    .object({
      zltoRewardPoolCurrentFinancialYear: z.string(),
      yomaRewardPoolCurrentFinancialYear: z.string(),
    })
    .superRefine((data, ctx) => {
      const issue: AddIssue = (path, message) =>
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: [path], message });

      validatePool(
        data.zltoRewardPoolCurrentFinancialYear,
        {
          field: "zltoRewardPoolCurrentFinancialYear",
          label: "ZLTO",
          awarded: figures.zltoRewardCumulativeCurrentFinancialYear,
          wholeNumbersOnly: true,
          maxDecimals: 0,
          format: (value) => formatZlto(value),
        },
        issue,
      );

      validatePool(
        data.yomaRewardPoolCurrentFinancialYear,
        {
          field: "yomaRewardPoolCurrentFinancialYear",
          label: "Yoma",
          awarded: figures.yomaRewardCumulativeCurrentFinancialYear,
          wholeNumbersOnly: false,
          maxDecimals: ORGANIZATION_REWARD_LIMITS.yomaPoolDecimals,
          format: (value) => formatYoma(value),
        },
        issue,
      );
    });
