import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useId, useMemo } from "react";
import { useForm, useWatch } from "react-hook-form";
import {
  ORGANIZATION_REWARD_LIMITS,
  type OrganizationRewardFigures,
  type OrganizationRewardPoolField,
  type OrganizationRewardPools,
} from "~/api/models/organisation";
import { BTN_PRIMARY, BTN_SECONDARY } from "~/components/Common/buttonStyles";
import FormField from "~/components/Common/FormField";
import FormInput from "~/components/Common/FormInput";
import FormMessage, { FormMessageType } from "~/components/Common/FormMessage";
import { parseAmountInput } from "~/lib/format/amountInput";
import { formatYoma, formatZlto } from "~/lib/format/rewards";
import {
  buildOrganizationRewardPoolsSchema,
  rewardPoolsFormValuesFromFigures,
  rewardPoolsFromFormValues,
  type OrganizationRewardPoolsFormValues,
} from "~/lib/organisation/rewardPoolsFormSchema";

/**
 * Edits an organisation's two reward pools — the only settable reward values; everything else is
 * derived by the server and read-only.
 *
 * ⚠️ Built to render in **two homes** — the organisation edit page's Reward step and the Treasury
 * Organisations tab. It owns rendering and validation only: it reads nothing from the router or the
 * session, and it does not submit. The caller supplies the figures, receives the pools through
 * `onSubmit`, and owns the PATCH, the toast and the cache (see the working plan's
 * "`/admin/treasury` IS THE AGGREGATION POINT").
 *
 * Reward-pool changes are Admin-only server-side (`OrganizationService.cs:460-463`), so the caller is
 * responsible for only rendering this to an admin.
 */
export const OrganizationRewardPoolsForm: React.FC<{
  figures: OrganizationRewardFigures;
  onSubmit: (pools: OrganizationRewardPools) => void;
  isSubmitting: boolean;
  /** server validation failures, already mapped onto fields */
  serverFieldErrors?: Partial<Record<OrganizationRewardPoolField, string>>;
  /** server validation failures that could not be attributed to a field */
  serverFormErrors?: string[];
  submitLabel?: string;
  /** rendered next to the submit button — e.g. a Cancel that closes a dialog */
  secondaryAction?: { label: string; onClick: () => void };
  className?: string;
}> = ({
  figures,
  onSubmit,
  isSubmitting,
  serverFieldErrors,
  serverFormErrors,
  submitLabel = "Save",
  secondaryAction,
  className = "flex flex-col gap-4",
}) => {
  const idPrefix = useId();
  const fieldId = (field: OrganizationRewardPoolField) =>
    `${idPrefix}-${field}`;
  const errorId = (field: OrganizationRewardPoolField) =>
    `${idPrefix}-${field}-error`;
  const helpId = (field: OrganizationRewardPoolField) =>
    `${idPrefix}-${field}-help`;

  const defaultValues = useMemo(
    () => rewardPoolsFormValuesFromFigures(figures),
    [figures],
  );

  const schema = useMemo(
    () => buildOrganizationRewardPoolsSchema(figures),
    [figures],
  );

  const { register, handleSubmit, control, setError, reset, formState } =
    useForm<OrganizationRewardPoolsFormValues>({
      resolver: zodResolver(schema),
      mode: "onTouched",
      defaultValues,
    });

  // A successful save returns the updated organisation — adopt it as the new baseline so the form is
  // no longer dirty and the "already awarded" context lines are current.
  useEffect(() => {
    reset(defaultValues);
  }, [defaultValues, reset]);

  useEffect(() => {
    if (!serverFieldErrors) return;
    for (const [field, message] of Object.entries(serverFieldErrors)) {
      if (message)
        setError(field as OrganizationRewardPoolField, {
          type: "server",
          message,
        });
    }
  }, [serverFieldErrors, setError]);

  const zltoInput =
    useWatch({ control, name: "zltoRewardPoolCurrentFinancialYear" }) ??
    defaultValues.zltoRewardPoolCurrentFinancialYear;
  const yomaInput =
    useWatch({ control, name: "yomaRewardPoolCurrentFinancialYear" }) ??
    defaultValues.yomaRewardPoolCurrentFinancialYear;

  /** Warn when a pool that exists today is being cleared — that stops all awards for it. */
  const clearing = (current: number | null, input: string): boolean =>
    current !== null && parseAmountInput(input).kind === "empty";

  const clearingZlto = clearing(
    figures.zltoRewardPoolCurrentFinancialYear,
    zltoInput,
  );
  const clearingYoma = clearing(
    figures.yomaRewardPoolCurrentFinancialYear,
    yomaInput,
  );

  const showError = (field: OrganizationRewardPoolField) =>
    !!formState.touchedFields[field] || formState.isSubmitted;
  const errorFor = (field: OrganizationRewardPoolField) =>
    formState.errors[field]?.message?.toString();
  const describedBy = (field: OrganizationRewardPoolField) =>
    [helpId(field), errorFor(field) && showError(field) ? errorId(field) : null]
      .filter(Boolean)
      .join(" ");

  return (
    <form
      onSubmit={handleSubmit((values) =>
        onSubmit(rewardPoolsFromFormValues(values)),
      )}
      className={className}
      noValidate
    >
      {!!serverFormErrors?.length && (
        <FormMessage messageType={FormMessageType.Error}>
          <span className="flex flex-col gap-1">
            {serverFormErrors.map((message) => (
              <span key={message}>{message}</span>
            ))}
          </span>
        </FormMessage>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <FormField
          label="ZLTO reward pool"
          subLabel={`Whole numbers, up to ${formatZlto(ORGANIZATION_REWARD_LIMITS.poolMax)}. ${formatZlto(figures.zltoRewardCumulativeCurrentFinancialYear, "0")} awarded so far this financial year.`}
          tooltip="The ZLTO this organisation can award this financial year, across all its opportunities. Leave it empty to remove the allocation."
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
              max: ORGANIZATION_REWARD_LIMITS.poolMax,
              placeholder: "e.g. 100000",
              "data-autocomplete": "zlto-reward-pool",
              "aria-describedby": describedBy(
                "zltoRewardPoolCurrentFinancialYear",
              ),
              "aria-invalid": !!errorFor("zltoRewardPoolCurrentFinancialYear"),
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

        <FormField
          label="Yoma reward pool"
          subLabel={`Up to ${formatZlto(ORGANIZATION_REWARD_LIMITS.poolMax)}, ${ORGANIZATION_REWARD_LIMITS.yomaPoolDecimals} decimal places. ${formatYoma(figures.yomaRewardCumulativeCurrentFinancialYear, "0")} awarded so far this financial year.`}
          tooltip="The Yoma rewards this organisation can award this financial year. Leave it empty to remove the allocation."
          htmlFor={fieldId("yomaRewardPoolCurrentFinancialYear")}
          errorId={errorId("yomaRewardPoolCurrentFinancialYear")}
          showError={showError("yomaRewardPoolCurrentFinancialYear")}
          error={errorFor("yomaRewardPoolCurrentFinancialYear")}
        >
          <FormInput
            inputProps={{
              id: fieldId("yomaRewardPoolCurrentFinancialYear"),
              type: "number",
              inputMode: "decimal",
              step: "0.01",
              min: 0.01,
              max: ORGANIZATION_REWARD_LIMITS.poolMax,
              placeholder: "e.g. 1000.00",
              "data-autocomplete": "yoma-reward-pool",
              "aria-describedby": describedBy(
                "yomaRewardPoolCurrentFinancialYear",
              ),
              "aria-invalid": !!errorFor("yomaRewardPoolCurrentFinancialYear"),
              ...register("yomaRewardPoolCurrentFinancialYear"),
            }}
          />
          <span
            id={helpId("yomaRewardPoolCurrentFinancialYear")}
            className="sr-only"
          >
            Up to two decimal places. Leave empty to remove the allocation.
          </span>
        </FormField>
      </div>

      {(clearingZlto || clearingYoma) && (
        <FormMessage messageType={FormMessageType.Warning}>
          You&apos;ve cleared the{" "}
          {clearingZlto && clearingYoma
            ? "ZLTO and Yoma reward pools"
            : `${clearingZlto ? "ZLTO" : "Yoma"} reward pool`}
          . Saving this removes the allocation, and this organisation can&apos;t
          award{" "}
          {clearingZlto && clearingYoma
            ? "either reward"
            : `${clearingZlto ? "ZLTO" : "Yoma rewards"}`}{" "}
          until a new pool is set.
        </FormMessage>
      )}

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        {secondaryAction && (
          <button
            type="button"
            className={`${BTN_SECONDARY} w-full sm:w-40`}
            onClick={secondaryAction.onClick}
            disabled={isSubmitting}
          >
            {secondaryAction.label}
          </button>
        )}
        <button
          type="submit"
          className={`${BTN_PRIMARY} w-full sm:w-40`}
          disabled={isSubmitting}
        >
          {isSubmitting ? "Saving..." : submitLabel}
        </button>
      </div>
    </form>
  );
};

export default OrganizationRewardPoolsForm;
