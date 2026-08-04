import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useId, useMemo } from "react";
import { useForm, useWatch } from "react-hook-form";
import { IoMdCalendar, IoMdSwap, IoMdWallet } from "react-icons/io";
import {
  TREASURY_LIMITS,
  type TreasuryFormField,
  type TreasuryInfo,
  type TreasuryRequestUpdate,
} from "~/api/models/treasury";
import { BTN_PRIMARY, BTN_SECONDARY } from "~/components/Common/buttonStyles";
import DetailSection from "~/components/Common/DetailSection";
import FormField from "~/components/Common/FormField";
import FormInput from "~/components/Common/FormInput";
import FormMessage, { FormMessageType } from "~/components/Common/FormMessage";
import { formatUsd, formatZlto } from "~/lib/format/rewards";
import {
  CONVERSION_EXAMPLE_ZLTO,
  previewZltoToUsd,
} from "~/lib/treasury/conversion";
import {
  assessFinancialYearChange,
  dayOptionsForMonth,
  daysInMonthForConfig,
  MONTH_OPTIONS,
  type FinancialYearAssessment,
} from "~/lib/treasury/financialYear";
import {
  buildTreasuryFormSchema,
  parseAmountInput,
  treasuryFormValuesFromInfo,
  treasuryRequestFromFormValues,
  type TreasuryFormValues,
} from "~/lib/treasury/treasuryFormSchema";

/**
 * Treasury configuration: the financial-year start, the two pools, and the conversion rate.
 *
 * The form validates client-side against the same rules as the server (see
 * `lib/treasury/treasuryFormSchema.ts`) so mistakes land on the field that caused them, and hands
 * both the request and the financial-year assessment to its caller, which owns the rollover
 * confirmation and the PATCH.
 */
export const TreasuryManagementForm: React.FC<{
  treasury: TreasuryInfo;
  onSubmit: (
    request: TreasuryRequestUpdate,
    assessment: FinancialYearAssessment,
  ) => void;
  isSubmitting: boolean;
  /** server validation failures, already mapped onto fields */
  serverFieldErrors?: Partial<Record<TreasuryFormField, string>>;
  /** server validation failures that could not be attributed to a field */
  serverFormErrors?: string[];
}> = ({
  treasury,
  onSubmit,
  isSubmitting,
  serverFieldErrors,
  serverFormErrors,
}) => {
  const idPrefix = useId();
  const fieldId = (field: TreasuryFormField) => `${idPrefix}-${field}`;
  const errorId = (field: TreasuryFormField) => `${idPrefix}-${field}-error`;
  const helpId = (field: TreasuryFormField) => `${idPrefix}-${field}-help`;

  const defaultValues = useMemo(
    () => treasuryFormValuesFromInfo(treasury),
    [treasury],
  );

  const schema = useMemo(() => buildTreasuryFormSchema(treasury), [treasury]);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    setError,
    reset,
    formState,
  } = useForm<TreasuryFormValues>({
    resolver: zodResolver(schema),
    mode: "onTouched",
    defaultValues,
  });

  // A successful save returns the updated Treasury — adopt it as the new baseline so the form is no
  // longer dirty and a rollover reset is reflected in the "already awarded" context lines.
  useEffect(() => {
    reset(defaultValues);
  }, [defaultValues, reset]);

  // Server-side failures land on their fields (see lib/treasury/serverErrors.ts).
  useEffect(() => {
    if (!serverFieldErrors) return;
    for (const [field, message] of Object.entries(serverFieldErrors)) {
      if (message)
        setError(field as TreasuryFormField, { type: "server", message });
    }
  }, [serverFieldErrors, setError]);

  const month = Number(
    useWatch({ control, name: "financialYearStartMonth" }) ??
      treasury.financialYearStartMonth,
  );
  const day = Number(
    useWatch({ control, name: "financialYearStartDay" }) ??
      treasury.financialYearStartDay,
  );
  // Fall back to the saved values, never to "", so neither the "you've cleared the pool" warning nor
  // the conversion example flickers on the first render.
  const zltoPoolInput =
    useWatch({ control, name: "zltoRewardPoolCurrentFinancialYear" }) ??
    defaultValues.zltoRewardPoolCurrentFinancialYear;
  const rateInput =
    useWatch({ control, name: "conversionRateZltoPerUsd" }) ??
    defaultValues.conversionRateZltoPerUsd;

  // Coupled month/day: a day that does not exist in the chosen month is corrected at the input
  // rather than rejected at submit (31 February is never selectable).
  const dayOptions = useMemo(() => dayOptionsForMonth(month), [month]);
  useEffect(() => {
    const maxDay = daysInMonthForConfig(month);
    if (day > maxDay)
      setValue("financialYearStartDay", maxDay, {
        shouldValidate: true,
        shouldDirty: true,
      });
  }, [month, day, setValue]);

  const assessment = useMemo(
    () =>
      assessFinancialYearChange(month, day, treasury.financialYearStartDate),
    [month, day, treasury.financialYearStartDate],
  );

  const parsedRate = parseAmountInput(rateInput);
  const exampleUsd =
    parsedRate.kind === "value"
      ? previewZltoToUsd(CONVERSION_EXAMPLE_ZLTO, parsedRate.value)
      : null;

  const clearingZltoPool =
    treasury.zltoRewardPoolCurrentFinancialYear !== null &&
    parseAmountInput(zltoPoolInput).kind === "empty";

  const zltoAwarded = treasury.zltoRewardCumulativeCurrentFinancialYear ?? 0;
  const cashedOut = treasury.cashOutCumulativeCurrentFinancialYearInUsd ?? 0;

  /** Errors show once a field has been touched, or after a submit attempt. */
  const showError = (field: TreasuryFormField) =>
    !!formState.touchedFields[field] || formState.isSubmitted;
  const errorFor = (field: TreasuryFormField) =>
    formState.errors[field]?.message?.toString();
  const describedBy = (field: TreasuryFormField) =>
    [helpId(field), errorFor(field) && showError(field) ? errorId(field) : null]
      .filter(Boolean)
      .join(" ");

  return (
    <div className="shadow-custom flex flex-col gap-4 rounded-lg bg-white p-4">
      <div className="flex flex-col gap-1">
        <h5 className="font-bold tracking-wider">Treasury settings</h5>
        <p className="text-gray-dark text-sm">
          Set the financial year, how much is available to award and cash out
          this financial year, and what ZLTO is worth. Awarded and paid-out
          totals are calculated by the system and can&apos;t be edited.
        </p>
      </div>

      {!!serverFormErrors?.length && (
        <FormMessage messageType={FormMessageType.Error}>
          <span className="flex flex-col gap-1">
            {serverFormErrors.map((message) => (
              <span key={message}>{message}</span>
            ))}
          </span>
        </FormMessage>
      )}

      <form
        onSubmit={handleSubmit((values) =>
          onSubmit(treasuryRequestFromFormValues(values), assessment),
        )}
        className="divide-gray-light flex flex-col divide-y"
        noValidate
      >
        {/* FINANCIAL YEAR */}
        <DetailSection
          title="Financial year start"
          icon={<IoMdCalendar className="text-blue h-4 w-4" />}
        >
          <p className="text-gray-dark mt-1 text-xs">
            The date each financial year begins. Totals for the financial year
            reset when a new one starts.
          </p>

          <div className="mt-2 grid gap-4 sm:grid-cols-2">
            <FormField
              label="Month"
              htmlFor={fieldId("financialYearStartMonth")}
              errorId={errorId("financialYearStartMonth")}
              showError={showError("financialYearStartMonth")}
              error={errorFor("financialYearStartMonth")}
            >
              <select
                id={fieldId("financialYearStartMonth")}
                className="select border-gray focus:border-gray w-full focus:outline-none"
                aria-invalid={!!errorFor("financialYearStartMonth")}
                aria-describedby={describedBy("financialYearStartMonth")}
                {...register("financialYearStartMonth", {
                  valueAsNumber: true,
                })}
              >
                {MONTH_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <span id={helpId("financialYearStartMonth")} className="sr-only">
                The month the financial year starts in.
              </span>
            </FormField>

            <FormField
              label="Day"
              htmlFor={fieldId("financialYearStartDay")}
              errorId={errorId("financialYearStartDay")}
              showError={showError("financialYearStartDay")}
              error={errorFor("financialYearStartDay")}
            >
              <select
                id={fieldId("financialYearStartDay")}
                className="select border-gray focus:border-gray w-full focus:outline-none"
                aria-invalid={!!errorFor("financialYearStartDay")}
                aria-describedby={describedBy("financialYearStartDay")}
                {...register("financialYearStartDay", { valueAsNumber: true })}
              >
                {dayOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <span id={helpId("financialYearStartDay")} className="sr-only">
                Only days that exist in the chosen month are offered.
              </span>
            </FormField>
          </div>

          {assessment.shouldWarn && (
            <div className="mt-3">
              <FormMessage messageType={FormMessageType.Warning}>
                Saving this starts a new financial year. The Treasury&apos;s and
                every organisation&apos;s totals for the financial year will
                reset to zero — all-time totals are kept. We&apos;ll ask you to
                confirm before anything changes.
              </FormMessage>
            </div>
          )}
        </DetailSection>

        {/* POOLS */}
        <DetailSection
          title="Pools for this financial year"
          icon={<IoMdWallet className="text-blue h-4 w-4" />}
        >
          <div className="mt-2 flex flex-col gap-4">
            <FormField
              label="ZLTO reward pool"
              subLabel={`Whole numbers, up to ${formatZlto(TREASURY_LIMITS.zltoPoolMax)}. ${formatZlto(zltoAwarded)} ZLTO has been awarded so far this financial year.`}
              tooltip="The total ZLTO available to award this financial year across every organisation, opportunity and referral. Leave it empty to remove the allocation — no ZLTO can be awarded while it is empty."
              htmlFor={fieldId("zltoRewardPoolCurrentFinancialYear")}
              errorId={errorId("zltoRewardPoolCurrentFinancialYear")}
              showError={showError("zltoRewardPoolCurrentFinancialYear")}
              error={errorFor("zltoRewardPoolCurrentFinancialYear")}
            >
              <FormInput
                inputProps={{
                  id: fieldId("zltoRewardPoolCurrentFinancialYear"),
                  type: "number",
                  inputMode: "numeric",
                  step: "1",
                  min: 1,
                  max: TREASURY_LIMITS.zltoPoolMax,
                  placeholder: "e.g. 1000000",
                  "aria-describedby": describedBy(
                    "zltoRewardPoolCurrentFinancialYear",
                  ),
                  "aria-invalid": !!errorFor(
                    "zltoRewardPoolCurrentFinancialYear",
                  ),
                  ...register("zltoRewardPoolCurrentFinancialYear"),
                }}
              />
              <span
                id={helpId("zltoRewardPoolCurrentFinancialYear")}
                className="sr-only"
              >
                Whole ZLTO only. Leave empty to remove the allocation.
              </span>
            </FormField>

            {clearingZltoPool && (
              <FormMessage messageType={FormMessageType.Warning}>
                You&apos;ve cleared the ZLTO reward pool. Saving this removes
                the allocation, and no ZLTO can be awarded anywhere until a new
                pool is set.
              </FormMessage>
            )}

            <FormField
              label="Cash-out pool (USD)"
              subLabel={`Up to ${formatUsd(TREASURY_LIMITS.cashOutPoolMaxUsd)}, cents allowed. ${formatUsd(cashedOut)} has been paid out so far this financial year.`}
              tooltip="The total value available for cash-outs this financial year. Required."
              htmlFor={fieldId("cashOutPoolCurrentFinancialYearInUsd")}
              errorId={errorId("cashOutPoolCurrentFinancialYearInUsd")}
              showError={showError("cashOutPoolCurrentFinancialYearInUsd")}
              error={errorFor("cashOutPoolCurrentFinancialYearInUsd")}
              showWarningIcon={
                !!errorFor("cashOutPoolCurrentFinancialYearInUsd")
              }
            >
              <FormInput
                inputProps={{
                  id: fieldId("cashOutPoolCurrentFinancialYearInUsd"),
                  type: "number",
                  inputMode: "decimal",
                  step: "0.01",
                  min: 0.01,
                  max: TREASURY_LIMITS.cashOutPoolMaxUsd,
                  placeholder: "e.g. 5000.00",
                  required: true,
                  "aria-describedby": describedBy(
                    "cashOutPoolCurrentFinancialYearInUsd",
                  ),
                  "aria-invalid": !!errorFor(
                    "cashOutPoolCurrentFinancialYearInUsd",
                  ),
                  ...register("cashOutPoolCurrentFinancialYearInUsd"),
                }}
              />
              <span
                id={helpId("cashOutPoolCurrentFinancialYearInUsd")}
                className="sr-only"
              >
                US dollars, up to two decimal places. Required.
              </span>
            </FormField>
          </div>
        </DetailSection>

        {/* CONVERSION RATE */}
        <DetailSection
          title="Conversion rate"
          icon={<IoMdSwap className="text-blue h-4 w-4" />}
        >
          <div className="mt-2">
            <FormField
              label="How many ZLTO equal 1 USD?"
              subLabel={`Up to ${formatZlto(TREASURY_LIMITS.conversionRateMax)} ZLTO per USD, with at most ${TREASURY_LIMITS.conversionRateDecimals} decimal places.`}
              tooltip="Used to value ZLTO for cash-out. The value a youth sees before cashing out is indicative — the final value is determined at payout."
              htmlFor={fieldId("conversionRateZltoPerUsd")}
              errorId={errorId("conversionRateZltoPerUsd")}
              showError={showError("conversionRateZltoPerUsd")}
              error={errorFor("conversionRateZltoPerUsd")}
              showWarningIcon={!!errorFor("conversionRateZltoPerUsd")}
            >
              <div className="flex flex-row flex-wrap items-center gap-2">
                <FormInput
                  className="w-full sm:w-40"
                  inputProps={{
                    id: fieldId("conversionRateZltoPerUsd"),
                    type: "number",
                    inputMode: "decimal",
                    step: "0.0001",
                    min: 0.0001,
                    max: TREASURY_LIMITS.conversionRateMax,
                    placeholder: "e.g. 500",
                    required: true,
                    "aria-describedby": describedBy("conversionRateZltoPerUsd"),
                    "aria-invalid": !!errorFor("conversionRateZltoPerUsd"),
                    ...register("conversionRateZltoPerUsd"),
                  }}
                />
                <span className="text-sm font-semibold whitespace-nowrap">
                  ZLTO = {formatUsd(treasury.conversionRateUsdAmount)}
                </span>
              </div>

              <span
                id={helpId("conversionRateZltoPerUsd")}
                className="text-gray-dark mt-1 text-xs"
                aria-live="polite"
              >
                {exampleUsd !== null
                  ? `At this rate, ${formatZlto(CONVERSION_EXAMPLE_ZLTO)} ZLTO is worth approximately ${formatUsd(exampleUsd)}.`
                  : "Enter a rate to see an example."}
              </span>
            </FormField>
          </div>
        </DetailSection>

        {/* ACTIONS */}
        <div className="flex flex-col-reverse gap-2 pt-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            className={`${BTN_SECONDARY} w-full sm:w-40`}
            onClick={() => reset(defaultValues)}
            disabled={isSubmitting || !formState.isDirty}
          >
            Discard changes
          </button>
          <button
            type="submit"
            className={`${BTN_PRIMARY} w-full sm:w-40`}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Saving..." : "Save changes"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default TreasuryManagementForm;
