import z from "zod";
import {
  TREASURY_LIMITS,
  type TreasuryInfo,
  type TreasuryRequestUpdate,
} from "~/api/models/treasury";
import { amountOrNull, parseAmountInput } from "~/lib/format/amountInput";
import { formatUsd, formatZlto } from "~/lib/format/rewards";
import {
  assessFinancialYearChange,
  daysInMonthForConfig,
  isValidDayForMonth,
  MONTH_NAMES,
} from "~/lib/treasury/financialYear";
import {
  derivePayoutTotalPending,
  payoutPoolFloor,
} from "~/lib/treasury/payoutCommitment";

/**
 * Client-side validation for the Treasury configuration form.
 *
 * Mirrors `TreasuryRequestUpdateValidator` rule for rule, plus the two cross-field checks
 * `TreasuryService.Update` performs after it (:78-85) — pool may not be set below what has already
 * been awarded / paid out this financial year. The server stays the authority; this exists so a
 * mistake is caught at the field, with friendly copy, instead of coming back as a toast.
 *
 * The caps here are Treasury's own (100,000,000 ZLTO / $50,000 / 1,000 ZLTO per USD) and differ from
 * the Organisation and Referral caps on purpose — never copy a limit from a neighbouring surface.
 */

/** Amount fields stay strings: the text the admin typed is what the decimal-place rules inspect. */
export interface TreasuryFormValues {
  financialYearStartMonth: number;
  financialYearStartDay: number;
  zltoRewardPoolCurrentFinancialYear: string;
  payoutPoolCurrentFinancialYearInUsd: string;
  conversionRateZltoPerUsd: string;
}

export const treasuryFormValuesFromInfo = (
  treasury: TreasuryInfo,
): TreasuryFormValues => ({
  financialYearStartMonth: treasury.financialYearStartMonth,
  financialYearStartDay: treasury.financialYearStartDay,
  zltoRewardPoolCurrentFinancialYear:
    treasury.zltoRewardPoolCurrentFinancialYear?.toString() ?? "",
  payoutPoolCurrentFinancialYearInUsd:
    treasury.payoutPoolCurrentFinancialYearInUsd?.toString() ?? "",
  conversionRateZltoPerUsd:
    treasury.conversionRateZltoPerUsd > 0
      ? treasury.conversionRateZltoPerUsd.toString()
      : "",
});

export const treasuryRequestFromFormValues = (
  values: TreasuryFormValues,
): TreasuryRequestUpdate => ({
  financialYearStartMonth: Number(values.financialYearStartMonth),
  financialYearStartDay: Number(values.financialYearStartDay),
  // NB: null clears the allocation — the PATCH assigns this field unconditionally.
  zltoRewardPoolCurrentFinancialYear: amountOrNull(
    values.zltoRewardPoolCurrentFinancialYear,
  ),
  payoutPoolCurrentFinancialYearInUsd: amountOrNull(
    values.payoutPoolCurrentFinancialYearInUsd,
  ),
  conversionRateZltoPerUsd: amountOrNull(values.conversionRateZltoPerUsd) ?? 0,
});

/** Reports one failure against one field. */
type AddIssue = (path: keyof TreasuryFormValues, message: string) => void;

/** `TreasuryRequestUpdateValidator:11-21` — the month, and the day within that month. */
const validateFinancialYear = (
  month: number,
  day: number,
  issue: AddIssue,
): void => {
  if (!Number.isInteger(month) || month < 1 || month > 12) {
    issue(
      "financialYearStartMonth",
      "Choose the month your financial year starts in.",
    );
    return;
  }

  // The day picker is constrained by the month, so this is the belt to that braces.
  if (!isValidDayForMonth(month, day)) {
    const maxDay = daysInMonthForConfig(month);
    issue(
      "financialYearStartDay",
      `${MONTH_NAMES[month - 1]} has ${maxDay} days — choose a day between 1 and ${maxDay}.`,
    );
  }
};

/**
 * `TreasuryRequestUpdateValidator:23-32` plus `TreasuryService.Update:78-80`.
 * Optional: empty means "no allocation", which the API accepts.
 */
const validateZltoPool = (
  raw: string,
  awarded: number,
  enforceAwardedFloor: boolean,
  issue: AddIssue,
): void => {
  const field = "zltoRewardPoolCurrentFinancialYear";
  const pool = parseAmountInput(raw);

  if (pool.kind === "empty") return;

  if (pool.kind === "invalid") {
    issue(field, "Enter the pool as a number, using digits only.");
    return;
  }

  if (pool.value <= 0) {
    issue(
      field,
      "The pool must be more than 0. Leave it empty to remove the allocation entirely.",
    );
  } else if (pool.value > TREASURY_LIMITS.zltoPoolMax) {
    issue(
      field,
      `The pool can't be more than ${formatZlto(TREASURY_LIMITS.zltoPoolMax)} ZLTO.`,
    );
  } else if (pool.decimals > 0) {
    issue(field, "ZLTO amounts are whole numbers — remove the decimals.");
  } else if (enforceAwardedFloor && pool.value < awarded) {
    issue(
      field,
      `The pool can't be set below the ${formatZlto(awarded)} ZLTO already awarded this financial year.`,
    );
  }
};

/**
 * `TreasuryRequestUpdateValidator:34-47` plus the pool floor in `TreasuryService.Update`.
 * Required — the server rejects a null payout pool outright.
 *
 * ⚠️ The floor is **`currentFYCumulative + totalPending`**, not the cumulative alone: pending payouts
 * are already committed and stay funded through a rollover. Two consequences the earlier
 * completed-only mirror got wrong:
 *   • a pool between the cumulative and the committed total passed here and was rejected by the
 *     server, and
 *   • when the financial year moves forward the cumulative is zeroed but the pending total is **not**,
 *     so the floor drops to the pending total rather than to zero.
 */
const validatePayoutPool = (
  raw: string,
  /** the floor the pool may not go below — already accounts for rollover, see `payoutPoolFloor` */
  committedFloor: number,
  /** false when the floor cannot be derived (no pool set today) — the server stays the authority */
  enforceCommittedFloor: boolean,
  /** the in-flight portion of the floor, for the message; null when not derivable */
  totalPending: number | null,
  issue: AddIssue,
): void => {
  const field = "payoutPoolCurrentFinancialYearInUsd";
  const pool = parseAmountInput(raw);

  if (pool.kind === "empty") {
    issue(
      field,
      "Enter the payout pool for this financial year — it's required.",
    );
    return;
  }

  if (pool.kind === "invalid") {
    issue(field, "Enter the pool as a number, using digits only.");
    return;
  }

  if (pool.value <= 0) {
    issue(field, "The payout pool must be more than $0.");
  } else if (pool.value > TREASURY_LIMITS.payoutPoolMaxUsd) {
    issue(
      field,
      `The payout pool can't be more than ${formatUsd(TREASURY_LIMITS.payoutPoolMaxUsd)}.`,
    );
  } else if (pool.decimals > TREASURY_LIMITS.payoutPoolDecimals) {
    issue(
      field,
      `Use at most ${TREASURY_LIMITS.payoutPoolDecimals} decimal places (cents).`,
    );
  } else if (enforceCommittedFloor && pool.value < committedFloor) {
    issue(
      field,
      totalPending && totalPending > 0
        ? `The pool can't be set below the ${formatUsd(committedFloor)} already committed — paid out this financial year plus ${formatUsd(totalPending)} in payouts still in flight.`
        : `The pool can't be set below the ${formatUsd(committedFloor)} already paid out this financial year.`,
    );
  }
};

/** `TreasuryRequestUpdateValidator:49-55`. Required and non-zero. */
const validateConversionRate = (raw: string, issue: AddIssue): void => {
  const field = "conversionRateZltoPerUsd";
  const rate = parseAmountInput(raw);

  if (rate.kind === "empty") {
    issue(field, "Enter how many ZLTO equal 1 USD — it's required.");
    return;
  }

  if (rate.kind === "invalid") {
    issue(field, "Enter the rate as a number, using digits only.");
    return;
  }

  if (rate.value <= 0) {
    issue(field, "The rate must be more than 0.");
  } else if (rate.value > TREASURY_LIMITS.conversionRateMax) {
    issue(
      field,
      `The rate can't be more than ${formatZlto(TREASURY_LIMITS.conversionRateMax)} ZLTO per USD.`,
    );
  } else if (rate.decimals > TREASURY_LIMITS.conversionRateDecimals) {
    issue(
      field,
      `Use at most ${TREASURY_LIMITS.conversionRateDecimals} decimal places.`,
    );
  }
};

export const buildTreasuryFormSchema = (treasury: TreasuryInfo) =>
  z
    .object({
      financialYearStartMonth: z.coerce.number(),
      financialYearStartDay: z.coerce.number(),
      zltoRewardPoolCurrentFinancialYear: z.string(),
      payoutPoolCurrentFinancialYearInUsd: z.string(),
      conversionRateZltoPerUsd: z.string(),
    })
    .superRefine((data, ctx) => {
      const issue: AddIssue = (path, message) =>
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: [path], message });

      const month = Number(data.financialYearStartMonth);
      const day = Number(data.financialYearStartDay);

      validateFinancialYear(month, day, issue);

      /**
       * A financial-year move forward resets the current-financial-year cumulatives to zero before
       * the pools are applied, so the server then compares the submitted pool against zero rather
       * than against today's cumulative (`TreasuryService.Update:77,82`). When that is expected — or
       * cannot be determined client-side — the "not below what's already been awarded" floors are
       * left to the server: blocking on a cumulative that is about to be zeroed would stop a
       * legitimate save.
       */
      const assessment = assessFinancialYearChange(
        month,
        day,
        treasury.financialYearStartDate,
      );
      const cumulativesHold =
        !assessment.requiresRollover && !assessment.isUncertain;

      validateZltoPool(
        data.zltoRewardPoolCurrentFinancialYear,
        treasury.zltoRewardCumulativeCurrentFinancialYear ?? 0,
        cumulativesHold,
        issue,
      );

      /**
       * The payout floor is not symmetrical with the ZLTO one: pending payouts survive a rollover, so
       * even when the cumulative is about to be zeroed the pool must still cover what is in flight.
       * The floor is therefore enforced whenever the pending total is derivable — only the cumulative
       * half of it is dropped on a rollover.
       */
      const payoutTotalPending = derivePayoutTotalPending(treasury);
      const payoutFloor = payoutPoolFloor({
        cumulative: treasury.payoutCumulativeCurrentFinancialYearInUsd,
        totalPending: payoutTotalPending,
        cumulativeHolds: cumulativesHold,
      });

      validatePayoutPool(
        data.payoutPoolCurrentFinancialYearInUsd,
        payoutFloor,
        cumulativesHold || payoutFloor > 0,
        payoutTotalPending,
        issue,
      );

      validateConversionRate(data.conversionRateZltoPerUsd, issue);
    });
