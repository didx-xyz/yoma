import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect } from "react";
import { Controller, useForm, type FieldValues } from "react-hook-form";
import Select from "react-select";
import zod from "zod";
import type { Country } from "~/api/models/lookups";
import type { ProgramSearchFilterAdmin } from "~/api/models/referrals";
import { ProgramStatus } from "~/api/models/referrals";
import { SearchInput } from "../SearchInput";

export enum ReferralFilterOptions {
  VALUECONTAINS = "valueContains",
  COUNTRIES = "countries",
  STATUSES = "statuses",
  DATERANGE = "dateRange",
}

export const ReferralProgramSearchFilters: React.FC<{
  searchFilter: ProgramSearchFilterAdmin | null;
  lookups_countries?: Country[];
  filterOptions: ReferralFilterOptions[];
  onSubmit?: (fieldValues: ProgramSearchFilterAdmin) => void;
}> = ({ searchFilter, lookups_countries, filterOptions, onSubmit }) => {
  const schema = zod.object({
    valueContains: zod.string().optional().nullable(),
    countries: zod.array(zod.string()).optional().nullable(),
    statuses: zod.array(zod.string()).optional().nullable(),
    dateStart: zod.string().optional().nullable(),
    dateEnd: zod.string().optional().nullable(),
  });

  const form = useForm({
    mode: "all",
    resolver: zodResolver(schema),
  });
  const { handleSubmit, formState, reset } = form;

  // set default values
  useEffect(() => {
    if (searchFilter == null || searchFilter == undefined) return;

    // reset form
    // setTimeout is needed to prevent the form from being reset before the default values are set
    setTimeout(() => {
      reset({
        ...searchFilter,
      });
    }, 100);
  }, [reset, searchFilter]);

  // form submission handler
  const onSubmitHandler = useCallback(
    (data: FieldValues) => {
      if (onSubmit)
        onSubmit({ ...searchFilter, ...data } as ProgramSearchFilterAdmin);
    },
    [searchFilter, onSubmit],
  );

  // ⚠️ Avoid nested <form>: wrap controls in a <div> instead
  return (
    <div className="flex grow flex-col">
      <div className="flex flex-col gap-2">
        <div className="flex w-full grow flex-row flex-wrap gap-2 md:w-fit lg:flex-row">
          {/* VALUE CONTAINS */}
          {filterOptions?.includes(ReferralFilterOptions.VALUECONTAINS) && (
            <span className="w-full md:w-72">
              <Controller
                name="valueContains"
                control={form.control}
                render={({ field: { onChange, value } }) => (
                  <SearchInput
                    defaultValue={value ?? ""}
                    onSearch={(query: string) => {
                      onChange(query || null);
                      void handleSubmit(onSubmitHandler)();
                    }}
                    placeholder="Search programs"
                  />
                )}
              />
              {formState.errors.valueContains && (
                <label className="label font-bold">
                  <span className="label-text-alt text-red-500 italic">
                    {`${formState.errors.valueContains.message}`}
                  </span>
                </label>
              )}
            </span>
          )}

          {/* STATUSES */}
          {filterOptions?.includes(ReferralFilterOptions.STATUSES) && (
            <span className="w-full md:w-72">
              <Controller
                name="statuses"
                control={form.control}
                render={({ field: { onChange, value } }) => (
                  <select
                    className="select select-bordered w-full md:w-72"
                    onChange={(e) => {
                      const selectedValue = e.target.value;
                      onChange(selectedValue ? [selectedValue] : null);
                      void handleSubmit(onSubmitHandler)();
                    }}
                    value={value?.[0] ?? ""}
                  >
                    <option value="">All Statuses</option>
                    <option value={ProgramStatus.Active}>Active</option>
                    <option value={ProgramStatus.Inactive}>Inactive</option>
                    <option value={ProgramStatus.Expired}>Expired</option>
                  </select>
                )}
              />
              {formState.errors.statuses && (
                <label className="label font-bold">
                  <span className="label-text-alt text-red-500 italic">
                    {`${formState.errors.statuses.message}`}
                  </span>
                </label>
              )}
            </span>
          )}

          {/* COUNTRIES */}
          {filterOptions?.includes(ReferralFilterOptions.COUNTRIES) &&
            lookups_countries &&
            lookups_countries.length > 0 && (
              <span className="w-full md:w-72">
                <Controller
                  name="countries"
                  control={form.control}
                  defaultValue={searchFilter?.countries}
                  render={({ field: { onChange, value } }) => (
                    <Select
                      instanceId="countries"
                      classNames={{
                        control: () => "input h-fit py-1",
                      }}
                      isMulti={true}
                      options={lookups_countries.map((c) => ({
                        value: c.id,
                        label: c.name,
                      }))}
                      onChange={(val) => {
                        onChange((val ?? []).map((c) => c.value));
                        void handleSubmit(onSubmitHandler)();
                      }}
                      value={lookups_countries
                        .filter((c) => value?.includes(c.id))
                        .map((c) => ({ value: c.id, label: c.name }))}
                      placeholder="Countries"
                    />
                  )}
                />

                {formState.errors.countries && (
                  <label className="label font-bold">
                    <span className="label-text-alt text-red-500 italic">
                      {`${formState.errors.countries.message}`}
                    </span>
                  </label>
                )}
              </span>
            )}

          {/* DATE RANGE */}
          {filterOptions?.includes(ReferralFilterOptions.DATERANGE) && (
            <>
              <span className="w-full md:w-44">
                <Controller
                  name="dateStart"
                  control={form.control}
                  render={({ field: { onChange, value } }) => (
                    <input
                      type="date"
                      className="input border-gray focus:border-gray w-full rounded-md focus:outline-none"
                      value={value ?? ""}
                      onChange={(e) => {
                        onChange(e.target.value || null);
                        void handleSubmit(onSubmitHandler)();
                      }}
                      placeholder="Start date"
                    />
                  )}
                />
                {formState.errors.dateStart && (
                  <label className="label font-bold">
                    <span className="label-text-alt text-red-500 italic">
                      {`${formState.errors.dateStart.message}`}
                    </span>
                  </label>
                )}
              </span>
              <span className="w-full md:w-44">
                <Controller
                  name="dateEnd"
                  control={form.control}
                  render={({ field: { onChange, value } }) => (
                    <input
                      type="date"
                      className="input border-gray focus:border-gray w-full rounded-md focus:outline-none"
                      value={value ?? ""}
                      onChange={(e) => {
                        onChange(e.target.value || null);
                        void handleSubmit(onSubmitHandler)();
                      }}
                      placeholder="End date"
                    />
                  )}
                />
                {formState.errors.dateEnd && (
                  <label className="label font-bold">
                    <span className="label-text-alt text-red-500 italic">
                      {`${formState.errors.dateEnd.message}`}
                    </span>
                  </label>
                )}
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
