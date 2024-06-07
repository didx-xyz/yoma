import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect, useState } from "react";
import { Controller, type FieldValues, useForm } from "react-hook-form";
import { IoMdClose } from "react-icons/io";
import zod from "zod";
import {
  type OpportunityCategory,
  type OpportunitySearchCriteriaCommitmentIntervalOption,
  type OpportunitySearchCriteriaZltoRewardRange,
  type OpportunityType,
  OpportunityFilterOptions,
  type OpportunitySearchFilter,
} from "~/api/models/opportunity";
import type {
  Country,
  EngagementType,
  Language,
  SelectOption,
  TimeInterval,
} from "~/api/models/lookups";
import Select from "react-select";
import type { OrganizationInfo } from "~/api/models/organisation";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { toISOStringForTimezone } from "~/lib/utils";
import { AvatarImage } from "../AvatarImage";
import SelectButtons from "../Common/SelectButtons";

export const OpportunityFilterVertical: React.FC<{
  htmlRef: HTMLDivElement;
  searchFilter: OpportunitySearchFilter;
  lookups_categories: OpportunityCategory[];
  lookups_countries: Country[];
  lookups_languages: Language[];
  lookups_types: OpportunityType[];
  lookups_engagementTypes: EngagementType[];
  lookups_organisations: OrganizationInfo[];
  lookups_timeIntervals: TimeInterval[];
  lookups_zltoRewardRanges: OpportunitySearchCriteriaZltoRewardRange[];
  lookups_publishedStates: SelectOption[];
  lookups_statuses: SelectOption[];
  onSubmit?: (fieldValues: OpportunitySearchFilter) => void;
  onCancel?: () => void;
  clearButtonText?: string;
  submitButtonText?: string;
  filterOptions: OpportunityFilterOptions[];
  onClear?: () => void;
}> = ({
  htmlRef,
  searchFilter,
  lookups_categories,
  lookups_countries,
  lookups_languages,
  lookups_types,
  lookups_engagementTypes,
  lookups_organisations,
  lookups_timeIntervals,
  lookups_zltoRewardRanges,
  lookups_publishedStates,
  lookups_statuses,
  onSubmit,
  onCancel,
  submitButtonText = "Submit",
  filterOptions,
  onClear,
  clearButtonText,
}) => {
  const schema = zod.object({
    types: zod.array(zod.string()).optional().nullable(),
    engagementTypes: zod.array(zod.string()).optional().nullable(),
    categories: zod.array(zod.string()).optional().nullable(),
    languages: zod.array(zod.string()).optional().nullable(),
    countries: zod.array(zod.string()).optional().nullable(),
    organizations: zod.array(zod.string()).optional().nullable(),
    commitmentInterval: zod
      .object({
        options: zod.array(zod.string()).optional().nullable(),
        interval: zod
          .object({
            id: zod
              .any()
              .optional()
              .nullable()
              .transform((value) => (value ? value[0] : null)), // SelectButtons returns an array, get the first item
            // .transform((value) => (value === null ? "Day" : value)), // default to 'Month' if not selected
            count: zod.any().optional().nullable().transform(Number),
          })
          .optional()
          .nullable()
          .transform((value) => (value?.count === 0 ? null : value)), // if 'count' is 0, return null for 'interval'
      })
      .nullable()
      .transform((value) => (value?.interval === null ? null : value)), // if interval is null, return null for 'commitmentInterval'

    zltoRewardRanges: zod.array(zod.string()).optional().nullable(),
    publishedStates: zod.array(zod.string()).optional().nullable(),
    valueContains: zod.string().optional().nullable(),
  });
  const form = useForm({
    mode: "all",
    resolver: zodResolver(schema),
    defaultValues: searchFilter,
  });

  const { handleSubmit, formState, reset, watch, setValue } = form;
  const watchIntervalId = watch("commitmentInterval.interval.id");
  const watchIntervalCount = watch("commitmentInterval.interval.count");

  const [timeIntervalMax, setTimeIntervalMax] = useState(100);

  // set the maximum based on the selected time interval
  useEffect(() => {
    const watchInterval =
      (watchIntervalId?.length ?? 0) > 0 ? watchIntervalId[0] : "Month";

    let max = 0;
    switch (watchInterval) {
      case "Minute":
        max = 60;
        break;
      case "Hour":
        max = 24;
        break;
      case "Day":
        max = 30;
        break;
      case "Week":
        max = 12;
        break;
      case "Month":
        max = 60;
        break;
    }

    setTimeIntervalMax(max);

    if (watchIntervalCount > max) {
      setValue("commitmentInterval.interval.count", max);
    }
  }, [watchIntervalId, watchIntervalCount, setTimeIntervalMax, setValue]);

  // form submission handler
  const onSubmitHandler = useCallback(
    (data: FieldValues) => {
      // if (onSubmit) onSubmit(data as OpportunitySearchFilter);

      console.table(data);
      return;
    },
    [onSubmit],
  );

  return (
    <>
      <form
        onSubmit={handleSubmit(onSubmitHandler)} // eslint-disable-line @typescript-eslint/no-misused-promises
        className="flex flex-col gap-2"
      >
        <div className="flex flex-row px-8 py-4">
          <h1 className="my-auto flex-grow text-2xl font-bold">Filter</h1>
          <button
            type="button"
            className="btn btn-primary rounded-full px-3"
            onClick={onCancel}
          >
            <IoMdClose className="h-6 w-6"></IoMdClose>
          </button>
        </div>

        <div className="flex flex-col gap-4 bg-gray-light px-8 py-4">
          {/* CATEGORIES */}
          {/* {lookups_categories &&
              lookups_categories.length > 0 &&
              (filterOptions?.includes(OpportunityFilterOptions.CATEGORIES) ||
                filterOptions?.includes(
                  OpportunityFilterOptions.VIEWALLFILTERSBUTTON,
                )) && (
                <div className="collapse join-item collapse-arrow">
                  <input type="checkbox" name="my-accordion-1" />
                  <div className="collapse-title text-xl font-medium">
                    Topics
                  </div>
                  <div className="collapse-content">
                    <div className="flex flex-col items-center justify-center gap-2 pb-8">
                      <div className="flex w-full flex-col">
                        {lookups_categories.map((item) => (
                          <div
                            key={`fs_searchfilter_categories_${item.id}`}
                            className="flex h-[70px] flex-grow flex-row items-center justify-center gap-4 p-2"
                          >
                            <label
                              className="flex cursor-pointer items-center justify-center"
                              htmlFor={`checkbox_${item.id}`}
                            >
                              <AvatarImage
                                icon={item.imageURL ?? null}
                                alt="Organization Logo"
                                size={40}
                              />
                            </label>

                            <label
                              className="flex w-full flex-grow cursor-pointer flex-col"
                              htmlFor={`checkbox_${item.id}`}
                            >
                              <div className="flex flex-grow flex-col">
                                <h1 className="h-7 overflow-hidden text-ellipsis text-lg font-semibold text-black">
                                  {item.name}
                                </h1>
                                <h6 className="text-sm text-gray-dark">
                                  {item.count} available
                                </h6>
                              </div>
                            </label>

                            <input
                              type="checkbox"
                              className="checkbox-primary checkbox"
                              id={`checkbox_${item.id}`}
                              {...register("categories")}
                              value={item.name}
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    {formState.errors.categories && (
                      <label className="label font-bold">
                        <span className="label-text-alt italic text-red-500">
                          {`${formState.errors.categories.message}`}
                        </span>
                      </label>
                    )}
                  </div>
                </div>
              )} */}

          {/* VALUECONTAINS: hidden input */}
          <input
            type="hidden"
            {...form.register("valueContains")}
            value={searchFilter?.valueContains ?? ""}
          />

          {/* TYPES */}
          {filterOptions?.includes(OpportunityFilterOptions.TYPES) && (
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">
                  What type of opportunity are you looking for?
                </span>
              </label>

              <Controller
                name="types"
                control={form.control}
                defaultValue={searchFilter?.types}
                render={({ field: { onChange, value } }) => (
                  <SelectButtons
                    id="selectButtons_types"
                    isMulti={true}
                    buttons={lookups_types.map((x) => ({
                      id: x.id,
                      title: x.name,
                      selected: value?.includes(x.name) ?? false,
                    }))}
                    onChange={(val) => {
                      const selectedButtons = val.filter((btn) => btn.selected);
                      onChange(selectedButtons.map((c) => c.title));
                    }}
                  />
                )}
              />

              {formState.errors.types && (
                <label className="label font-bold">
                  <span className="label-text-alt italic text-red-500">
                    {`${formState.errors.types.message}`}
                  </span>
                </label>
              )}
            </div>
          )}

          {/* ENGAGEMENT TYPES */}
          {filterOptions?.includes(
            OpportunityFilterOptions.ENGAGEMENT_TYPES,
          ) && (
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">
                  What type of engagement are you looking for?
                </span>
              </label>

              <Controller
                name="engagementTypes"
                control={form.control}
                defaultValue={searchFilter?.engagementTypes}
                render={({ field: { onChange, value } }) => (
                  <SelectButtons
                    id="selectButtons_engagementTypes"
                    isMulti={true}
                    buttons={lookups_engagementTypes.map((x) => ({
                      id: x.id,
                      title: x.name,
                      selected: value?.includes(x.name) ?? false,
                    }))}
                    onChange={(val) => {
                      const selectedButtons = val.filter((btn) => btn.selected);
                      onChange(selectedButtons.map((c) => c.title));
                    }}
                  />
                )}
              />

              {formState.errors.engagementTypes && (
                <label className="label font-bold">
                  <span className="label-text-alt italic text-red-500">
                    {`${formState.errors.engagementTypes.message}`}
                  </span>
                </label>
              )}
            </div>
          )}

          {/* COMMITMENT INTERVALS */}
          {filterOptions?.includes(
            OpportunityFilterOptions.COMMITMENTINTERVALS,
          ) && (
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">
                  How much time would you like to invest?
                </span>
              </label>
              <div className="flex w-full flex-row justify-center gap-4">
                <span>0</span>

                <Controller
                  name="commitmentInterval.interval.count"
                  control={form.control}
                  // defaultValue={
                  //   searchFilter?.commitmentInterval?.interval?.count ?? 0
                  // }
                  render={({ field: { onChange, value } }) => (
                    <div className="flex w-full flex-col justify-center text-center md:w-64">
                      <input
                        type="range"
                        className="range range-secondary bg-gray"
                        min="0"
                        max={timeIntervalMax}
                        value={value ?? 0} // default to 0 if not selected
                        onChange={(val) => onChange(val)}
                      />
                      <span className="h-8">
                        {value > 0 && watchIntervalId != null && (
                          <>
                            {`${value} ${
                              value > 1
                                ? `${watchIntervalId}s`
                                : watchIntervalId
                            }`}
                          </>
                        )}
                      </span>
                    </div>
                  )}
                />

                <span>{timeIntervalMax}</span>
              </div>
              <div className="flex w-full flex-row justify-center gap-4">
                <Controller
                  name="commitmentInterval.interval.id"
                  control={form.control}
                  // defaultValue={
                  //   searchFilter?.commitmentInterval?.interval?.id ?? "Month"
                  // }
                  render={({ field: { onChange, value } }) => (
                    <SelectButtons
                      id="selectButtons_commitmentIntervals"
                      buttons={lookups_timeIntervals.map((x) => ({
                        id: x.id,
                        title: x.name,
                        selected:
                          (!value && x.name === "Day") ||
                          (value?.includes(x.name) ?? false), // default to 'Day' if not selected
                      }))}
                      onChange={(val) => {
                        const selectedButtons = val.filter(
                          (btn) => btn.selected,
                        );
                        onChange(selectedButtons.map((c) => c.title));
                      }}
                    />
                  )}
                />
              </div>
              ERROR: {JSON.stringify(formState.errors)}
              {formState.errors.commitmentInterval?.interval?.count && (
                <label className="label font-bold">
                  <span className="label-text-alt italic text-red-500">
                    {`${formState.errors.commitmentInterval.interval.count.message}`}
                  </span>
                </label>
              )}
            </div>
          )}

          {/* ZLTO REWARD RANGES */}
          {/* {filterOptions?.includes(
            OpportunityFilterOptions.ZLTOREWARDRANGES,
          ) && (
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">ZLTO Reward</span>
              </label>
              <Controller
                name="zltoRewardRanges"
                control={form.control}
                defaultValue={searchFilter?.zltoRewardRanges}
                render={({ field: { onChange, value } }) => (
                  <Select
                    classNames={{
                      control: () => "input input-bordered h-fit py-1",
                    }}
                    isMulti={true}
                    options={lookups_zltoRewardRanges.map((c) => ({
                      value: c.id,
                      label: c.name,
                    }))}
                    // fix menu z-index issue
                    menuPortalTarget={htmlRef}
                    styles={{
                      menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                    }}
                    onChange={(val) => onChange(val.map((c) => c.value))}
                    value={lookups_zltoRewardRanges
                      .filter((c) => value?.includes(c.id))
                      .map((c) => ({ value: c.id, label: c.name }))}
                  />
                )}
              />

              {formState.errors.zltoRewardRanges && (
                <label className="label font-bold">
                  <span className="label-text-alt italic text-red-500">
                    {`${formState.errors.zltoRewardRanges.message}`}
                  </span>
                </label>
              )}
            </div>
          )} */}

          {/* COUNTRIES */}
          {filterOptions?.includes(OpportunityFilterOptions.COUNTRIES) && (
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">Country</span>
              </label>

              <Controller
                name="countries"
                control={form.control}
                defaultValue={searchFilter?.countries}
                render={({ field: { onChange, value } }) => (
                  <SelectButtons
                    id="selectButtons_countries"
                    isMulti={true}
                    buttons={lookups_countries.map((x) => ({
                      id: x.id,
                      title: x.name,
                      selected: value?.includes(x.name) ?? false,
                    }))}
                    onChange={(val) => {
                      const selectedButtons = val.filter((btn) => btn.selected);
                      onChange(selectedButtons.map((c) => c.title));
                    }}
                  />
                )}
              />

              {formState.errors.countries && (
                <label className="label font-bold">
                  <span className="label-text-alt italic text-red-500">
                    {`${formState.errors.countries.message}`}
                  </span>
                </label>
              )}
            </div>
          )}

          {/* LANGUAGES */}
          {filterOptions?.includes(OpportunityFilterOptions.LANGUAGES) && (
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">Languages</span>
              </label>

              <Controller
                name="languages"
                control={form.control}
                defaultValue={searchFilter?.languages}
                render={({ field: { onChange, value } }) => (
                  <SelectButtons
                    id="selectButtons_languages"
                    isMulti={true}
                    buttons={lookups_languages.map((x) => ({
                      id: x.id,
                      title: x.name,
                      selected: value?.includes(x.name) ?? false,
                    }))}
                    onChange={(val) => {
                      const selectedButtons = val.filter((btn) => btn.selected);
                      onChange(selectedButtons.map((c) => c.title));
                    }}
                  />
                )}
              />

              {formState.errors.languages && (
                <label className="label font-bold">
                  <span className="label-text-alt italic text-red-500">
                    {`${formState.errors.languages.message}`}
                  </span>
                </label>
              )}
            </div>
          )}

          {/* ORGANIZATIONS */}
          {filterOptions?.includes(OpportunityFilterOptions.ORGANIZATIONS) && (
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">Providers</span>
              </label>

              <Controller
                name="organizations"
                control={form.control}
                defaultValue={searchFilter?.organizations}
                render={({ field: { onChange, value } }) => (
                  <SelectButtons
                    id="selectButtons_organizations"
                    isMulti={true}
                    buttons={lookups_organisations.map((x) => ({
                      id: x.id,
                      title: x.name,
                      selected: value?.includes(x.name) ?? false,
                    }))}
                    onChange={(val) => {
                      const selectedButtons = val.filter((btn) => btn.selected);
                      onChange(selectedButtons.map((c) => c.title));
                    }}
                  />
                )}
              />

              {formState.errors.organizations && (
                <label className="label font-bold">
                  <span className="label-text-alt italic text-red-500">
                    {`${formState.errors.organizations.message}`}
                  </span>
                </label>
              )}
            </div>
          )}

          {/* PUBLISHED STATES */}
          {filterOptions?.includes(
            OpportunityFilterOptions.PUBLISHEDSTATES,
          ) && (
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">
                  What status would you like to see?
                </span>
              </label>
              <Controller
                name="publishedStates"
                control={form.control}
                render={({ field: { onChange, value } }) => (
                  <SelectButtons
                    id="selectButtons_publishedStates"
                    isMulti={true}
                    buttons={lookups_publishedStates.map((x) => ({
                      id: x.value,
                      title: x.label,
                      selected: value?.includes(x.label as never) ?? false,
                    }))}
                    onChange={(val) => {
                      const selectedButtons = val.filter((btn) => btn.selected);
                      onChange(selectedButtons.map((c) => c.title));
                    }}
                  />
                )}
              />

              {formState.errors.publishedStates && (
                <label className="label font-bold">
                  <span className="label-text-alt italic text-red-500">
                    {`${formState.errors.publishedStates.message}`}
                  </span>
                </label>
              )}
            </div>
          )}

          {/* STATUSES */}
          {/* {filterOptions?.includes(OpportunityFilterOptions.STATUSES) && (
            <div className="collapse join-item collapse-arrow">
              <input type="checkbox" name="my-accordion-8" />
              <div className="collapse-title text-xl font-medium">Status</div>
              <div className="collapse-content">
                <Controller
                  name="statuses"
                  control={form.control}
                  render={({ field: { onChange, value } }) => (
                    <Select
                      instanceId="statuses"
                      classNames={{
                        control: () => "input input-xs",
                      }}
                      isMulti={true}
                      options={lookups_statuses}
                      // fix menu z-index issue
                      menuPortalTarget={htmlRef}
                      styles={{
                        menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                      }}
                      onChange={(val) => onChange(val.map((c) => c.label))}
                      value={lookups_statuses.filter(
                        (c) => value?.includes(c.label),
                      )}
                      placeholder="Status"
                    />
                  )}
                />

                {formState.errors.statuses && (
                  <label className="label font-bold">
                    <span className="label-text-alt italic text-red-500">
                      {`${formState.errors.statuses.message}`}
                    </span>
                  </label>
                )}
              </div>
            </div>
          )} */}

          {/* DATES */}
          {/* {(filterOptions?.includes(OpportunityFilterOptions.DATE_START) ||
            filterOptions?.includes(OpportunityFilterOptions.DATE_END)) && (
            <>
              <div className="collapse-title text-xl font-medium">Dates</div>
              <input type="checkbox" name="my-accordion-9" />
              <div className="flex flex-row gap-1 px-4 pb-4">
                 DATE START
                {filterOptions?.includes(
                  OpportunityFilterOptions.DATE_START,
                ) && (
                  <>
                    <Controller
                      control={form.control}
                      name="startDate"
                      render={({ field: { onChange, value } }) => (
                        <DatePicker
                          className="input input-bordered input-sm w-full rounded-md border-gray focus:border-gray focus:outline-none"
                          onChange={(date) => {
                            onChange(toISOStringForTimezone(date));
                            void handleSubmit(onSubmitHandler)();
                          }}
                          selected={value ? new Date(value) : null}
                          placeholderText="Start Date"
                        />
                      )}
                    />

                    {formState.errors.startDate && (
                      <label className="label">
                        <span className="label-text-alt px-4 text-base italic text-red-500">
                          {`${formState.errors.startDate.message}`}
                        </span>
                      </label>
                    )}
                  </>
                )}

                DATE END
                {filterOptions?.includes(OpportunityFilterOptions.DATE_END) && (
                  <>
                    <Controller
                      control={form.control}
                      name="endDate"
                      render={({ field: { onChange, value } }) => (
                        <DatePicker
                          className="input input-bordered input-sm z-50 w-full rounded-md border-gray focus:border-gray focus:outline-none"
                          onChange={(date) => {
                            onChange(toISOStringForTimezone(date));
                            void handleSubmit(onSubmitHandler)();
                          }}
                          selected={value ? new Date(value) : null}
                          placeholderText="End Date"
                          // calendarClassName="z-50"
                          popperProps={{
                            positionFixed: true,
                          }}
                          popperPlacement="top-end"
                        />
                      )}
                    />

                    {formState.errors.endDate && (
                      <label className="label">
                        <span className="label-text-alt px-4 text-base italic text-red-500">
                          {`${formState.errors.endDate.message}`}
                        </span>
                      </label>
                    )}
                  </>
                )}
              </div>
            </>
          )} */}
        </div>

        {/* BUTTONS */}
        <div className="mx-4 my-8 flex flex-col items-center justify-center gap-6 md:flex-row">
          {onSubmit && (
            <button
              type="submit"
              className="btn btn-primary w-full flex-grow rounded-full md:w-40"
            >
              {submitButtonText}
            </button>
          )}
          {onClear && (
            <button
              type="button"
              className="btn btn-warning w-full flex-grow rounded-full md:w-40"
              onClick={onClear}
            >
              {clearButtonText}
            </button>
          )}
        </div>
      </form>
    </>
  );
};
