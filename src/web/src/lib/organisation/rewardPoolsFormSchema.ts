import z from "zod";
import {
  ORGANIZATION_REWARD_LIMITS,
  type OrganizationRewardFigures,
  type OrganizationRewardPoolField,
  type OrganizationRewardPools,
} from "~/api/models/organisation";
import { parseAmountInput } from "~/lib/format/amountInput";
import { formatZlto } from "~/lib/format/rewards";

/**
 * Client-side validation for an organisation's ZLTO reward pool.
 *
 * Mirrors `OrganizationRequestValidatorBase.cs:72-76` (> 0, ≤ 10 million, whole numbers) plus the
 * cross-field floor in `OrganizationService.cs:465-469` (a pool may not be set below what has already
 * been awarded this financial year). The server stays the authority; this exists so a mistake lands on
 * the field that caused it instead of arriving as a generic toast.
 *
 * ZLTO is the only reward asset, so there is only one pool and no decimal case — the Yoma reward
 * capability was removed server-side (API `f051dfd8`).
 *
 * Follows the pattern established by `lib/treasury/treasuryFormSchema.ts` (T0), and reuses its amount
 * parser so both surfaces treat typed decimals identically.
 */

/** Amount fields stay strings: the text the admin typed is what the decimal rules inspect. */
export interface OrganizationRewardPoolsFormValues {
  zltoRewardPoolCurrentFinancialYear: string;
}

export const rewardPoolsFormValuesFromFigures = (
  figures: OrganizationRewardFigures,
): OrganizationRewardPoolsFormValues => ({
  zltoRewardPoolCurrentFinancialYear:
    figures.zltoRewardPoolCurrentFinancialYear?.toString() ?? "",
});

/** Empty means "no allocation" — the API accepts null for the pool. */
export const rewardPoolsFromFormValues = (
  values: OrganizationRewardPoolsFormValues,
): OrganizationRewardPools => {
  const zlto = parseAmountInput(values.zltoRewardPoolCurrentFinancialYear);

  return {
    zltoRewardPoolCurrentFinancialYear:
      zlto.kind === "value" ? zlto.value : null,
  };
};

type AddIssue = (path: OrganizationRewardPoolField, message: string) => void;

const FIELD: OrganizationRewardPoolField = "zltoRewardPoolCurrentFinancialYear";

const validatePool = (
  raw: string,
  /** already awarded this financial year — the floor the pool may not go below */
  awarded: number | null,
  issue: AddIssue,
): void => {
  const pool = parseAmountInput(raw);

  // Empty is allowed — it removes the allocation.
  if (pool.kind === "empty") return;

  if (pool.kind === "invalid") {
    issue(FIELD, "Enter the pool as a number, using digits only.");
    return;
  }

  if (pool.value <= 0) {
    issue(
      FIELD,
      "The pool must be more than 0. Leave it empty to remove the allocation entirely.",
    );
    return;
  }

  if (pool.value > ORGANIZATION_REWARD_LIMITS.poolMax) {
    issue(
      FIELD,
      `The pool can't be more than ${formatZlto(ORGANIZATION_REWARD_LIMITS.poolMax)} ZLTO.`,
    );
    return;
  }

  if (pool.decimals > 0) {
    issue(FIELD, "ZLTO amounts are whole numbers — remove the decimals.");
    return;
  }

  /**
   * `OrganizationService.cs:465-469` — only enforced when a cumulative exists. The financial-year
   * rollover that zeroes these is Treasury-driven and cannot happen as part of this save, so unlike
   * the Treasury form there is no case where this floor should be skipped.
   */
  if (awarded !== null && pool.value < awarded) {
    issue(
      FIELD,
      `The pool can't be set below the ${formatZlto(awarded)} ZLTO already awarded this financial year.`,
    );
  }
};

export const buildOrganizationRewardPoolsSchema = (
  figures: OrganizationRewardFigures,
) =>
  z
    .object({
      zltoRewardPoolCurrentFinancialYear: z.string(),
    })
    .superRefine((data, ctx) => {
      const issue: AddIssue = (path, message) =>
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: [path], message });

      validatePool(
        data.zltoRewardPoolCurrentFinancialYear,
        figures.zltoRewardCumulativeCurrentFinancialYear,
        issue,
      );
    });
