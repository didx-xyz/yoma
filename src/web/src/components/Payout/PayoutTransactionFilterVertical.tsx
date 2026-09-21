import { useCallback, useEffect, useMemo, useState } from "react";
import Select from "react-select";
import { PayoutTransactionStatus, PayoutType } from "~/api/models/payout";
import {
  DATE_INPUT_CLASSES,
  FilterField,
  filterSelectProps,
  ListPageFilterDialog,
} from "~/components/Common/ListPage/ListPageFilterDialog";
import { parseAmountInput } from "~/lib/format/amountInput";
import {
  PAYOUT_STATUS_META,
  PAYOUT_STATUS_ORDER,
  PAYOUT_TYPE_META,
  type PayoutTransactionDisplayFilter,
} from "~/lib/payout/adminTransactions";

/**
 * Filter popup for Treasury → Payouts. Same chrome as every admin list page's filter, bound to
 * local state rather than the querystring — see the note on `TreasuryPayoutsTab` for why the
 * Treasury tabs keep their filters in component state.
 *
 * Kept as plain state rather than react-hook-form + zod: the epic's validation pattern exists for
 * the *forms* that submit money, where per-field server errors have to be mapped back. A query
 * filter has two rules and no server-error mapping, so the factory-schema machinery would be
 * ceremony. The two rules are mirrored from `PayoutTransactionSearchFilterValidator`.
 *
 * **No provider filter.** One provider exists, so the control would offer a single option, and
 * naming it breaks the epic's provider-neutrality rule. The API supports `providers`; add it here
 * when there is a second one.
 */

interface Option {
  value: string;
  label: string;
}

const STATUS_OPTIONS: Option[] = PAYOUT_STATUS_ORDER.map((status) => ({
  value: status,
  label: PAYOUT_STATUS_META[status].label,
}));

/** The ZLTO cash out first — it is the only type anything creates today. */
const TYPE_OPTIONS: Option[] = [
  PayoutType.PayoutRewards,
  PayoutType.Payout,
].map((type) => ({ value: type, label: PAYOUT_TYPE_META[type].label }));

const AMOUNT_INPUT_CLASSES =
  "input input-sm border-gray focus:border-gray h-10 min-h-10 w-full rounded-md text-sm focus:outline-none";

/**
 * Mirrors the two rules the server applies to this filter
 * (`PayoutTransactionSearchFilterValidator`): each bound must be greater than zero, and the
 * maximum may not be below the minimum. Typed text is parsed rather than trusted to
 * `type="number"`, which accepts "1e5".
 */
const validate = (
  filter: PayoutTransactionDisplayFilter,
): Partial<Record<"amount" | "dates", string>> => {
  const errors: Partial<Record<"amount" | "dates", string>> = {};

  const from = parseAmountInput(filter.amountFrom ?? "");
  const to = parseAmountInput(filter.amountTo ?? "");

  if (from.kind === "invalid" || to.kind === "invalid")
    errors.amount = "Enter an amount as a plain number, e.g. 25.50";
  else if (
    (from.kind === "value" && from.value <= 0) ||
    (to.kind === "value" && to.value <= 0)
  )
    errors.amount = "Amounts must be more than 0.";
  else if (
    from.kind === "value" &&
    to.kind === "value" &&
    to.value < from.value
  )
    errors.amount = "The maximum amount is less than the minimum amount.";

  if (
    filter.dateStart &&
    filter.dateEnd &&
    filter.dateEnd < filter.dateStart // both are YYYY-MM-DD, so a string compare is a date compare
  )
    errors.dates = "The end date is earlier than the start date.";

  return errors;
};

export const PayoutTransactionFilterVertical: React.FC<{
  htmlRef: HTMLDivElement;
  searchFilter: PayoutTransactionDisplayFilter;
  onSubmit: (filter: PayoutTransactionDisplayFilter) => void;
  onCancel?: () => void;
}> = ({ htmlRef, searchFilter, onSubmit, onCancel }) => {
  const [draft, setDraft] =
    useState<PayoutTransactionDisplayFilter>(searchFilter);
  const [errors, setErrors] = useState<
    Partial<Record<"amount" | "dates", string>>
  >({});

  // The dialog stays mounted between openings, so pick up whatever is applied each time it opens
  // (including a value cleared from a badge while it was closed).
  useEffect(() => {
    setDraft(searchFilter);
    setErrors({});
  }, [searchFilter]);

  const selectProps = useMemo(() => filterSelectProps(htmlRef), [htmlRef]);

  const set = useCallback(
    <K extends keyof PayoutTransactionDisplayFilter>(
      key: K,
      value: PayoutTransactionDisplayFilter[K],
    ) => setDraft((current) => ({ ...current, [key]: value })),
    [],
  );

  const handleSubmit = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      const found = validate(draft);
      setErrors(found);
      if (Object.keys(found).length > 0) return;

      onSubmit(draft);
    },
    [draft, onSubmit],
  );

  return (
    <ListPageFilterDialog onSubmit={handleSubmit} onCancel={onCancel}>
      {/* STATUS */}
      <FilterField label="Status">
        <Select
          {...selectProps}
          instanceId="filter_payout_statuses"
          options={STATUS_OPTIONS}
          value={STATUS_OPTIONS.filter((option) =>
            draft.statuses?.includes(option.value as PayoutTransactionStatus),
          )}
          onChange={(selected) =>
            set(
              "statuses",
              selected.length > 0
                ? selected.map((o) => o.value as PayoutTransactionStatus)
                : null,
            )
          }
          placeholder="Any status..."
        />
      </FilterField>

      {/* TYPE */}
      <FilterField label="Type">
        <Select
          {...selectProps}
          instanceId="filter_payout_types"
          options={TYPE_OPTIONS}
          value={TYPE_OPTIONS.filter((option) =>
            draft.types?.includes(option.value as PayoutType),
          )}
          onChange={(selected) =>
            set(
              "types",
              selected.length > 0
                ? selected.map((o) => o.value as PayoutType)
                : null,
            )
          }
          placeholder="Any type..."
        />
      </FilterField>

      {/* AMOUNT — the payout's USD value, not the ZLTO behind it */}
      <FilterField label="Amount (USD)" error={errors.amount}>
        <div className="flex flex-row items-center gap-2">
          <input
            type="text"
            inputMode="decimal"
            className={AMOUNT_INPUT_CLASSES}
            aria-label="Minimum amount"
            placeholder="Min"
            value={draft.amountFrom ?? ""}
            onChange={(e) => set("amountFrom", e.target.value || null)}
          />
          <input
            type="text"
            inputMode="decimal"
            className={AMOUNT_INPUT_CLASSES}
            aria-label="Maximum amount"
            placeholder="Max"
            value={draft.amountTo ?? ""}
            onChange={(e) => set("amountTo", e.target.value || null)}
          />
        </div>
      </FilterField>

      {/* DATES — initiation, which is what dateCreated records */}
      <FilterField label="Initiated between" error={errors.dates}>
        <div className="flex flex-row items-center gap-2">
          <input
            type="date"
            className={DATE_INPUT_CLASSES}
            aria-label="Start date"
            value={draft.dateStart ?? ""}
            onChange={(e) => set("dateStart", e.target.value || null)}
          />
          <input
            type="date"
            className={DATE_INPUT_CLASSES}
            aria-label="End date"
            value={draft.dateEnd ?? ""}
            onChange={(e) => set("dateEnd", e.target.value || null)}
          />
        </div>
      </FilterField>
    </ListPageFilterDialog>
  );
};

export default PayoutTransactionFilterVertical;
