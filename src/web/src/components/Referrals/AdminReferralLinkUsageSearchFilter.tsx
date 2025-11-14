import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect } from "react";
import { Controller, useForm, type FieldValues } from "react-hook-form";
import zod from "zod";
import type { ReferralLinkUsageSearchFilterAdmin } from "~/api/models/referrals";
import { ReferralLinkUsageStatus } from "~/api/models/referrals";

export enum ReferralLinkUsageFilterOptions {
  STATUSES = "statuses",
  USER_ID_REFEREE = "userIdReferee",
  USER_ID_REFERRER = "userIdReferrer",
  DATERANGE = "dateRange",
}

export const ReferralLinkUsageSearchFilters: React.FC<{
  searchFilter: ReferralLinkUsageSearchFilterAdmin | null;
  filterOptions: ReferralLinkUsageFilterOptions[];
  onSubmit?: (fieldValues: ReferralLinkUsageSearchFilterAdmin) => void;
}> = ({ searchFilter, filterOptions, onSubmit }) => {
  const schema = zod.object({
    statuses: zod.array(zod.string()).optional().nullable(),
    userIdReferee: zod.string().optional().nullable(),
    userIdReferrer: zod.string().optional().nullable(),
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
        onSubmit({
          ...searchFilter,
          ...data,
        } as ReferralLinkUsageSearchFilterAdmin);
    },
    [searchFilter, onSubmit],
  );

  // ⚠️ Avoid nested <form>: wrap controls in a <div> instead
  return (
    <div className="flex grow flex-col">
      <div className="flex flex-col gap-2">
        <div className="flex w-full grow flex-row flex-wrap gap-2 md:w-fit lg:flex-row">
          {/* STATUSES */}
          {filterOptions?.includes(ReferralLinkUsageFilterOptions.STATUSES) && (
            <span className="w-full md:w-48">
              <Controller
                name="statuses"
                control={form.control}
                render={({ field: { onChange, value } }) => (
                  <select
                    className="select select-bordered w-full md:w-48"
                    onChange={(e) => {
                      const selectedValue = e.target.value;
                      onChange(selectedValue ? [selectedValue] : null);
                      void handleSubmit(onSubmitHandler)();
                    }}
                    value={value?.[0] ?? ""}
                  >
                    <option value="">All Statuses</option>
                    <option value={ReferralLinkUsageStatus.Pending}>
                      Pending
                    </option>
                    <option value={ReferralLinkUsageStatus.Completed}>
                      Completed
                    </option>
                    <option value={ReferralLinkUsageStatus.Expired}>
                      Expired
                    </option>
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

          {/* USER ID REFEREE */}
          {filterOptions?.includes(
            ReferralLinkUsageFilterOptions.USER_ID_REFEREE,
          ) && (
            <span className="w-full md:w-56">
              <Controller
                name="userIdReferee"
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
                    placeholder="Referee user ID"
                  />
                )}
              />
              {formState.errors.userIdReferee && (
                <label className="label font-bold">
                  <span className="label-text-alt text-red-500 italic">
                    {`${formState.errors.userIdReferee.message}`}
                  </span>
                </label>
              )}
            </span>
          )}

          {/* USER ID REFERRER */}
          {filterOptions?.includes(
            ReferralLinkUsageFilterOptions.USER_ID_REFERRER,
          ) && (
            <span className="w-full md:w-56">
              <Controller
                name="userIdReferrer"
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
                    placeholder="Referrer user ID"
                  />
                )}
              />
              {formState.errors.userIdReferrer && (
                <label className="label font-bold">
                  <span className="label-text-alt text-red-500 italic">
                    {`${formState.errors.userIdReferrer.message}`}
                  </span>
                </label>
              )}
            </span>
          )}

          {/* DATE RANGE */}
          {filterOptions?.includes(
            ReferralLinkUsageFilterOptions.DATERANGE,
          ) && (
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
