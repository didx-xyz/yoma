import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect } from "react";
import { Controller, useForm, type FieldValues } from "react-hook-form";
import Select from "react-select";
import zod from "zod";
import type { Country, SelectOption } from "~/api/models/lookups";
import type { ProgramSearchFilterAdmin } from "~/api/models/referrals";
import {
  DATE_INPUT_CLASSES,
  FilterField,
  filterSelectProps,
  ListPageFilterDialog,
} from "~/components/Common/ListPage/ListPageFilterDialog";

export enum ReferralProgramFilterOptions {
  COUNTRIES = "countries",
  DATE_RANGE = "dateRange",
}

/** Maps a list of {name} lookups to react-select options (values are names). */
const toOptions = (items: { name: string }[]): SelectOption[] =>
  items.map((item) => ({ value: item.name, label: item.name }));

/** Filter popup for the admin referral program list page. */
export const ReferralProgramAdminFilterVertical: React.FC<{
  htmlRef: HTMLDivElement;
  searchFilter: ProgramSearchFilterAdmin | null;
  lookups_countries: Country[];
  onSubmit?: (fieldValues: ProgramSearchFilterAdmin) => void;
  onCancel?: () => void;
  filterOptions: ReferralProgramFilterOptions[];
}> = ({
  htmlRef,
  searchFilter,
  lookups_countries,
  onSubmit,
  onCancel,
  filterOptions,
}) => {
  const schema = zod.object({
    countries: zod.array(zod.string()).optional().nullable(),
    dateStart: zod.string().optional().nullable(),
    dateEnd: zod.string().optional().nullable(),
    valueContains: zod.string().optional().nullable(),
  });

  const form = useForm({
    mode: "all",
    resolver: zodResolver(schema),
  });
  const { handleSubmit, formState, reset } = form;

  // set default values
  useEffect(() => {
    // setTimeout is needed to prevent the form from being reset before the default values are set
    setTimeout(() => {
      reset({
        ...searchFilter,
      });
    }, 100);
  }, [reset, searchFilter]);

  const onSubmitHandler = useCallback(
    (data: FieldValues) => {
      if (onSubmit)
        onSubmit({ ...searchFilter, ...data } as ProgramSearchFilterAdmin);
    },
    [searchFilter, onSubmit],
  );

  const selectProps = filterSelectProps(htmlRef);

  return (
    <ListPageFilterDialog
      onSubmit={handleSubmit(onSubmitHandler)}
      onCancel={onCancel}
      hiddenInputs={
        /* VALUECONTAINS: hidden input, keeps the search term when applying filters */
        <input
          type="hidden"
          {...form.register("valueContains")}
          value={searchFilter?.valueContains ?? ""}
        />
      }
    >
      {/* COUNTRIES */}
      {filterOptions?.includes(ReferralProgramFilterOptions.COUNTRIES) && (
        <FilterField
          label="Location"
          error={formState.errors.countries?.message?.toString()}
        >
          <Controller
            name="countries"
            control={form.control}
            defaultValue={searchFilter?.countries}
            render={({ field: { onChange, value } }) => (
              <Select
                {...selectProps}
                instanceId="filter_referral_countries"
                options={toOptions(lookups_countries)}
                onChange={(val) => onChange(val.map((c) => c.value))}
                value={toOptions(
                  lookups_countries.filter((c) => value?.includes(c.name)),
                )}
                placeholder="Select countries..."
              />
            )}
          />
        </FilterField>
      )}

      {/* DATES */}
      {filterOptions?.includes(ReferralProgramFilterOptions.DATE_RANGE) && (
        <FilterField
          label="Dates"
          error={
            formState.errors.dateStart?.message?.toString() ??
            formState.errors.dateEnd?.message?.toString()
          }
        >
          <div className="flex flex-row items-center gap-2">
            <Controller
              control={form.control}
              name="dateStart"
              render={({ field: { onChange, value } }) => (
                <input
                  type="date"
                  className={DATE_INPUT_CLASSES}
                  aria-label="Start date"
                  // NB: applied via the Apply button, so both dates can be set
                  // before searching
                  onChange={(e) => onChange(e.target.value || "")}
                  value={value ?? ""}
                />
              )}
            />

            <Controller
              control={form.control}
              name="dateEnd"
              render={({ field: { onChange, value } }) => (
                <input
                  type="date"
                  className={DATE_INPUT_CLASSES}
                  aria-label="End date"
                  onChange={(e) => onChange(e.target.value || "")}
                  value={value ?? ""}
                />
              )}
            />
          </div>
        </FilterField>
      )}
    </ListPageFilterDialog>
  );
};

export default ReferralProgramAdminFilterVertical;
