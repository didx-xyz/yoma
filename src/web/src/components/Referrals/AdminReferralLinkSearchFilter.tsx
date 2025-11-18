import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect } from "react";
import { Controller, useForm, type FieldValues } from "react-hook-form";
import zod from "zod";
import type { ReferralLinkSearchFilterAdmin } from "~/api/models/referrals";
import { ReferralLinkStatus } from "~/api/models/referrals";
import { SearchInput } from "../SearchInput";

export enum ReferralLinkFilterOptions {
  VALUECONTAINS = "valueContains",
  STATUSES = "statuses",
  USER_ID = "userId",
}

export const ReferralLinkSearchFilters: React.FC<{
  searchFilter: ReferralLinkSearchFilterAdmin | null;
  filterOptions: ReferralLinkFilterOptions[];
  onSubmit?: (fieldValues: ReferralLinkSearchFilterAdmin) => void;
}> = ({ searchFilter, filterOptions, onSubmit }) => {
  const schema = zod.object({
    valueContains: zod.string().optional().nullable(),
    statuses: zod.array(zod.string()).optional().nullable(),
    userId: zod.string().optional().nullable(),
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
        onSubmit({ ...searchFilter, ...data } as ReferralLinkSearchFilterAdmin);
    },
    [searchFilter, onSubmit],
  );

  // ⚠️ Avoid nested <form>: wrap controls in a <div> instead
  return (
    <div className="flex grow flex-col">
      <div className="flex flex-col gap-2">
        <div className="flex w-full grow flex-row flex-wrap gap-2 md:w-fit lg:flex-row">
          {/* VALUE CONTAINS */}
          {filterOptions?.includes(ReferralLinkFilterOptions.VALUECONTAINS) && (
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
                    placeholder="Search links"
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

          {/* USER ID */}
          {filterOptions?.includes(ReferralLinkFilterOptions.USER_ID) && (
            <span className="w-full md:w-56">
              <Controller
                name="userId"
                control={form.control}
                render={({ field: { onChange, value } }) => (
                  <input
                    type="text"
                    className="input input-bordered w-full md:w-56"
                    value={value ?? ""}
                    onChange={(e) => {
                      onChange(e.target.value || null);
                      void handleSubmit(onSubmitHandler)();
                    }}
                    placeholder="User ID"
                  />
                )}
              />
              {formState.errors.userId && (
                <label className="label font-bold">
                  <span className="label-text-alt text-red-500 italic">
                    {`${formState.errors.userId.message}`}
                  </span>
                </label>
              )}
            </span>
          )}

          {/* STATUSES */}
          {filterOptions?.includes(ReferralLinkFilterOptions.STATUSES) && (
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
                    <option value={ReferralLinkStatus.Active}>Active</option>
                    <option value={ReferralLinkStatus.Cancelled}>
                      Cancelled
                    </option>
                    <option value={ReferralLinkStatus.LimitReached}>
                      Limit Reached
                    </option>
                    <option value={ReferralLinkStatus.Expired}>Expired</option>
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
        </div>
      </div>
    </div>
  );
};
