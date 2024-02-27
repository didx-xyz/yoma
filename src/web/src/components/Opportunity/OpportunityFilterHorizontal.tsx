import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect } from "react";
import { type FieldValues, Controller, useForm } from "react-hook-form";
import zod from "zod";
import type {
  OpportunityCategory,
  OpportunitySearchCriteriaCommitmentInterval,
  OpportunitySearchCriteriaZltoReward,
  OpportunityType,
  OpportunitySearchFilterCombined,
} from "~/api/models/opportunity";
import { OpportunityFilterOptions } from "~/api/models/opportunity";
import type { Country, Language, SelectOption } from "~/api/models/lookups";
import Select, { components, type ValueContainerProps } from "react-select";
import type { OrganizationInfo } from "~/api/models/organisation";
import { OpportunityCategoryHorizontalCard } from "./OpportunityCategoryHorizontalCard";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { toISOStringForTimezone } from "~/lib/utils";
import { IoIosClose } from "react-icons/io";

const ValueContainer = ({
  children,
  ...props
}: ValueContainerProps<SelectOption>) => {
  // eslint-disable-next-line prefer-const
  let [values, input] = children as any[];
  if (Array.isArray(values)) {
    const plural = values.length === 1 ? "" : "s";
    if (values.length > 0 && values[0].props.selectProps.placeholder) {
      if (
        values[0].props.selectProps.placeholder === "Status" &&
        values.length > 1
      ) {
        values = `${values.length} Statuses`;
      } else if (
        values[0].props.selectProps.placeholder === "Country" &&
        values.length > 1
      ) {
        values = `${values.length} Countries`;
      } else if (values[0].props.selectProps.placeholder === "Time to invest") {
        values =
          values.length > 1
            ? `${values.length} Time spans`
            : `${values.length} Time span`;
      } else {
        values = `${values.length} ${values[0].props.selectProps.placeholder}${plural}`;
      }
    }
  }
  return (
    <components.ValueContainer {...props}>
      {values}
      {input}
    </components.ValueContainer>
  );
};

export const OpportunityFilterHorizontal: React.FC<{
  htmlRef: HTMLDivElement;
  opportunitySearchFilter: OpportunitySearchFilterCombined | null;
  lookups_categories: OpportunityCategory[];
  lookups_countries: Country[];
  lookups_languages: Language[];
  lookups_types: OpportunityType[];
  lookups_organisations: OrganizationInfo[];
  lookups_commitmentIntervals: OpportunitySearchCriteriaCommitmentInterval[];
  lookups_zltoRewardRanges: OpportunitySearchCriteriaZltoReward[];
  lookups_publishedStates: SelectOption[];
  lookups_statuses: SelectOption[];
  onSubmit?: (fieldValues: OpportunitySearchFilterCombined) => void;
  onClear?: () => void;
  onOpenFilterFullWindow?: () => void;
  clearButtonText?: string;
  filterOptions: OpportunityFilterOptions[];
  totalCount?: number;
  exportToCsv?: (arg0: boolean) => void;
}> = ({
  htmlRef,
  opportunitySearchFilter,
  lookups_categories,
  lookups_countries,
  lookups_languages,
  lookups_types,
  lookups_organisations,
  lookups_commitmentIntervals,
  lookups_zltoRewardRanges,
  lookups_publishedStates,
  lookups_statuses,
  onSubmit,
  onClear,
  onOpenFilterFullWindow,
  clearButtonText = "Clear",
  filterOptions,
  totalCount,
  exportToCsv,
}) => {
  const schema = zod.object({
    types: zod.array(zod.string()).optional().nullable(),
    categories: zod.array(zod.string()).optional().nullable(),
    languages: zod.array(zod.string()).optional().nullable(),
    countries: zod.array(zod.string()).optional().nullable(),
    organizations: zod.array(zod.string()).optional().nullable(),
    commitmentIntervals: zod.array(zod.string()).optional().nullable(),
    zltoRewardRanges: zod.array(zod.string()).optional().nullable(),
    publishedStates: zod.array(zod.string()).optional().nullable(),
    valueContains: zod.string().optional().nullable(),
    startDate: zod.string().optional().nullable(),
    endDate: zod.string().optional().nullable(),
    statuses: zod.array(zod.string()).optional().nullable(),
  });

  const form = useForm({
    mode: "all",
    resolver: zodResolver(schema),
  });
  const { handleSubmit, formState, reset } = form;

  // set default values
  useEffect(() => {
    if (opportunitySearchFilter == null || opportunitySearchFilter == undefined)
      return;

    // reset form
    // setTimeout is needed to prevent the form from being reset before the default values are set
    setTimeout(() => {
      reset({
        ...opportunitySearchFilter,
      });
    }, 100);
  }, [reset, opportunitySearchFilter]);

  // form submission handler
  const onSubmitHandler = useCallback(
    (data: FieldValues) => {
      if (onSubmit) onSubmit(data as OpportunitySearchFilterCombined);
    },
    [onSubmit],
  );

  const onClickCategoryFilter = useCallback(
    (cat: OpportunityCategory) => {
      if (!opportunitySearchFilter || !onSubmit) return;

      const prev = { ...opportunitySearchFilter };
      prev.categories = prev.categories ?? [];

      if (prev.categories.includes(cat.name)) {
        prev.categories = prev.categories.filter((x) => x !== cat.name);
      } else {
        prev.categories.push(cat.name);
      }

      onSubmit(prev);
    },
    [opportunitySearchFilter, onSubmit],
  );

  // Function to handle removing an item from an array in the filter object
  const removeFromArray = useCallback(
    (key: keyof OpportunitySearchFilterCombined, item: string) => {
      if (!opportunitySearchFilter || !onSubmit) return;
      if (opportunitySearchFilter) {
        const updatedFilter: any = {
          ...opportunitySearchFilter,
        };
        updatedFilter[key] = updatedFilter[key]?.filter(
          (val: any) => val !== item,
        );
        onSubmit(updatedFilter);
      }
    },
    [opportunitySearchFilter, onSubmit],
  );

  // Function to handle removing a value from the filter object
  const removeValue = useCallback(
    (key: keyof OpportunitySearchFilterCombined) => {
      if (!opportunitySearchFilter || !onSubmit) return;
      if (opportunitySearchFilter) {
        const updatedFilter = { ...opportunitySearchFilter };
        updatedFilter[key] = null;
        onSubmit(updatedFilter);
      }
    },
    [opportunitySearchFilter, onSubmit],
  );

  const resultText = totalCount === 1 ? "result" : "results";
  const countText = `${totalCount?.toLocaleString()} ${resultText} for:`;

  return (
    <div className="flex flex-grow flex-col">
      {lookups_categories &&
        lookups_categories.length > 0 &&
        (filterOptions?.includes(OpportunityFilterOptions.CATEGORIES) ||
          filterOptions?.includes(
            OpportunityFilterOptions.VIEWALLFILTERSBUTTON,
          )) && (
          <div className="flex-col items-center justify-center gap-2 pb-8">
            <div className="flex justify-center gap-2">
              {/* CATEGORIES */}
              {filterOptions?.includes(OpportunityFilterOptions.CATEGORIES) && (
                <div className="flex justify-center gap-4 overflow-hidden md:w-full">
                  {lookups_categories.map((item) => (
                    <OpportunityCategoryHorizontalCard
                      key={item.id}
                      data={item}
                      selected={opportunitySearchFilter?.categories?.includes(
                        item.name,
                      )}
                      onClick={onClickCategoryFilter}
                    />
                  ))}
                </div>
              )}

              {/* VIEW ALL FILTERS BUTTON */}
              {/* {filterOptions?.includes(
                OpportunityFilterOptions.VIEWALLFILTERSBUTTON,
              ) && (
                <button
                  type="button"
                  onClick={onOpenFilterFullWindow}
                  className="-ml-10 flex aspect-square h-[120px] flex-col items-center rounded-lg bg-white p-2 shadow-lg"
                >
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-center">
                      <Image
                        src={iconNextArrow}
                        alt="Icon View All"
                        width={31}
                        height={31}
                        sizes="100vw"
                        priority={true}
                        placeholder="blur"
                        blurDataURL={`data:image/svg+xml;base64,${toBase64(
                          shimmer(288, 182),
                        )}`}
                        style={{
                          width: "31px",
                          height: "31px",
                        }}
                      />
                    </div>

                    <div className="flex flex-grow flex-row">
                      <div className="flex flex-grow flex-col gap-1">
                        <h1 className="h-10 overflow-hidden text-ellipsis text-center text-sm font-semibold text-black">
                          View all
                          <br />
                          Topics
                        </h1>
                      </div>
                    </div>
                  </div>
                </button>
              )} */}
            </div>
          </div>
        )}

      {filterOptions?.some(
        (filter) =>
          filter !== OpportunityFilterOptions.CATEGORIES &&
          filter !== OpportunityFilterOptions.VIEWALLFILTERSBUTTON,
      ) && (
        <form
          onSubmit={handleSubmit(onSubmitHandler)} // eslint-disable-line @typescript-eslint/no-misused-promises
          className={`
        ${filterOptions ? "flex flex-col gap-2" : "hidden"} `}
        >
          <div className="flex flex-col gap-2">
            <div className="mr-4 flex text-sm font-bold text-gray-dark">
              Filter by:
            </div>

            <div className="flex justify-between">
              <div className="flex flex-wrap justify-start gap-2">
                {/* VALUECONTAINS: hidden input */}
                <input
                  type="hidden"
                  {...form.register("valueContains")}
                  value={opportunitySearchFilter?.valueContains ?? ""}
                />

                {/* TYPES */}
                {filterOptions?.includes(OpportunityFilterOptions.TYPES) && (
                  <>
                    <Controller
                      name="types"
                      control={form.control}
                      defaultValue={opportunitySearchFilter?.types}
                      render={({ field: { onChange, value } }) => (
                        <Select
                          instanceId="types"
                          classNames={{
                            control: () => "input input-xs h-fit !border-gray",
                          }}
                          isMulti={true}
                          options={lookups_types.map((c) => ({
                            value: c.name,
                            label: c.name,
                          }))}
                          // fix menu z-index issue
                          menuPortalTarget={htmlRef}
                          styles={{
                            menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                          }}
                          onChange={(val) => {
                            onChange(val.map((c) => c.value));
                            void handleSubmit(onSubmitHandler)();
                          }}
                          value={lookups_types
                            .filter((c) => value?.includes(c.name))
                            .map((c) => ({ value: c.name, label: c.name }))}
                          placeholder="Type"
                          components={{
                            ValueContainer,
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
                  </>
                )}

                {/* COUNTRIES */}
                {filterOptions?.includes(
                  OpportunityFilterOptions.COUNTRIES,
                ) && (
                  <>
                    <Controller
                      name="countries"
                      control={form.control}
                      defaultValue={opportunitySearchFilter?.countries}
                      render={({ field: { onChange, value } }) => (
                        <Select
                          instanceId="countries"
                          classNames={{
                            control: () => "input input-xs h-fit !border-gray",
                          }}
                          isMulti={true}
                          options={lookups_countries.map((c) => ({
                            value: c.name,
                            label: c.name,
                          }))}
                          // fix menu z-index issue
                          menuPortalTarget={htmlRef}
                          styles={{
                            menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                          }}
                          onChange={(val) => {
                            onChange(val.map((c) => c.value));
                            void handleSubmit(onSubmitHandler)();
                          }}
                          value={lookups_countries
                            .filter((c) => value?.includes(c.name))
                            .map((c) => ({ value: c.name, label: c.name }))}
                          placeholder="Country"
                          components={{
                            ValueContainer,
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
                  </>
                )}

                {/* LANGUAGES */}
                {filterOptions?.includes(
                  OpportunityFilterOptions.LANGUAGES,
                ) && (
                  <>
                    <Controller
                      name="languages"
                      control={form.control}
                      defaultValue={opportunitySearchFilter?.languages}
                      render={({ field: { onChange, value } }) => (
                        <Select
                          instanceId="languages"
                          classNames={{
                            control: () => "input input-xs h-fit !border-gray",
                          }}
                          isMulti={true}
                          options={lookups_languages.map((c) => ({
                            value: c.name,
                            label: c.name,
                          }))}
                          // fix menu z-index issue
                          menuPortalTarget={htmlRef}
                          styles={{
                            menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                          }}
                          onChange={(val) => {
                            onChange(val.map((c) => c.value));
                            void handleSubmit(onSubmitHandler)();
                          }}
                          value={lookups_languages
                            .filter((c) => value?.includes(c.name))
                            .map((c) => ({ value: c.name, label: c.name }))}
                          placeholder="Language"
                          components={{
                            ValueContainer,
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
                  </>
                )}

                {/* ORGANIZATIONS */}
                {filterOptions?.includes(
                  OpportunityFilterOptions.ORGANIZATIONS,
                ) && (
                  <>
                    <Controller
                      name="organizations"
                      control={form.control}
                      defaultValue={opportunitySearchFilter?.organizations}
                      render={({ field: { onChange, value } }) => (
                        <Select
                          instanceId="organizations"
                          classNames={{
                            control: () => "input input-xs h-fit !border-gray",
                          }}
                          isMulti={true}
                          options={lookups_organisations.map((c) => ({
                            value: c.name,
                            label: c.name,
                          }))}
                          // fix menu z-index issue
                          menuPortalTarget={htmlRef}
                          styles={{
                            menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                          }}
                          onChange={(val) => {
                            onChange(val.map((c) => c.value));
                            void handleSubmit(onSubmitHandler)();
                          }}
                          value={lookups_organisations
                            .filter((c) => value?.includes(c.name))
                            .map((c) => ({ value: c.name, label: c.name }))}
                          placeholder="Opportunity provider"
                          components={{
                            ValueContainer,
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
                  </>
                )}

                {/* COMMITMENT INTERVALS */}
                {filterOptions?.includes(
                  OpportunityFilterOptions.COMMITMENTINTERVALS,
                ) && (
                  <>
                    <Controller
                      name="commitmentIntervals"
                      control={form.control}
                      defaultValue={
                        opportunitySearchFilter?.commitmentIntervals
                      }
                      render={({ field: { onChange, value } }) => (
                        <Select
                          instanceId="commitmentIntervals"
                          classNames={{
                            control: () => "input input-xs h-fit !border-gray",
                          }}
                          isMulti={true}
                          options={lookups_commitmentIntervals.map((c) => ({
                            value: c.id,
                            label: c.name,
                          }))}
                          // fix menu z-index issue
                          menuPortalTarget={htmlRef}
                          styles={{
                            menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                          }}
                          onChange={(val) => {
                            onChange(val.map((c) => c.value));
                            void handleSubmit(onSubmitHandler)();
                          }}
                          value={lookups_commitmentIntervals
                            .filter((c) => value?.includes(c.id))
                            .map((c) => ({ value: c.id, label: c.name }))}
                          placeholder="Time to invest"
                          components={{
                            ValueContainer,
                          }}
                        />
                      )}
                    />
                    {formState.errors.commitmentIntervals && (
                      <label className="label font-bold">
                        <span className="label-text-alt italic text-red-500">
                          {`${formState.errors.commitmentIntervals.message}`}
                        </span>
                      </label>
                    )}
                  </>
                )}

                {/* ZLTO REWARD RANGES */}
                {filterOptions?.includes(
                  OpportunityFilterOptions.ZLTOREWARDRANGES,
                ) && (
                  <>
                    <Controller
                      name="zltoRewardRanges"
                      control={form.control}
                      defaultValue={opportunitySearchFilter?.zltoRewardRanges}
                      render={({ field: { onChange, value } }) => (
                        <Select
                          instanceId="zltoRewardRanges"
                          classNames={{
                            control: () => "input input-xs h-fit !border-gray",
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
                          onChange={(val) => {
                            onChange(val.map((c) => c.value));
                            void handleSubmit(onSubmitHandler)();
                          }}
                          value={lookups_zltoRewardRanges
                            .filter((c) => value?.includes(c.id))
                            .map((c) => ({ value: c.id, label: c.name }))}
                          placeholder="Reward"
                          components={{
                            ValueContainer,
                          }}
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
                  </>
                )}

                {/* PUBLISHED STATES */}
                {filterOptions?.includes(
                  OpportunityFilterOptions.PUBLISHEDSTATES,
                ) && (
                  <>
                    <Controller
                      name="publishedStates"
                      control={form.control}
                      render={({ field: { onChange, value } }) => (
                        <Select
                          instanceId="publishedStates"
                          classNames={{
                            control: () => "input input-xs h-fit !border-gray",
                          }}
                          isMulti={true}
                          options={lookups_publishedStates}
                          // fix menu z-index issue
                          menuPortalTarget={htmlRef}
                          styles={{
                            menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                          }}
                          onChange={(val) => {
                            onChange(val.map((c) => c.label));
                            void handleSubmit(onSubmitHandler)();
                          }}
                          value={lookups_publishedStates.filter(
                            (c) => value?.includes(c.label),
                          )}
                          placeholder="Status"
                          components={{
                            ValueContainer,
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
                  </>
                )}

                {/* STATUSES */}
                {filterOptions?.includes(OpportunityFilterOptions.STATUSES) && (
                  <>
                    <Controller
                      name="statuses"
                      control={form.control}
                      render={({ field: { onChange, value } }) => (
                        <Select
                          instanceId="statuses"
                          classNames={{
                            control: () => "input input-xs h-fit !border-gray",
                          }}
                          isMulti={true}
                          options={lookups_statuses}
                          // fix menu z-index issue
                          menuPortalTarget={htmlRef}
                          styles={{
                            menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                          }}
                          onChange={(val) => {
                            onChange(val.map((c) => c.label));
                            void handleSubmit(onSubmitHandler)();
                          }}
                          value={lookups_statuses.filter(
                            (c) => value?.includes(c.label),
                          )}
                          placeholder="Status"
                          components={{
                            ValueContainer,
                          }}
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
                  </>
                )}

                {/* DATE START */}
                {filterOptions?.includes(
                  OpportunityFilterOptions.DATE_START,
                ) && (
                  <>
                    <Controller
                      control={form.control}
                      name="startDate"
                      render={({ field: { onChange, value } }) => (
                        <DatePicker
                          className="input input-bordered input-sm w-32 rounded border-gray !py-[1.13rem] !text-xs placeholder:text-xs placeholder:text-[#828181] focus:border-gray focus:outline-none"
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

                {/* DATE END */}
                {filterOptions?.includes(OpportunityFilterOptions.DATE_END) && (
                  <>
                    <Controller
                      control={form.control}
                      name="endDate"
                      render={({ field: { onChange, value } }) => (
                        <DatePicker
                          className="input input-bordered input-sm w-32 rounded border-gray !py-[1.13rem] !text-xs placeholder:text-xs placeholder:text-[#828181] focus:border-gray focus:outline-none"
                          onChange={(date) => {
                            onChange(toISOStringForTimezone(date));
                            void handleSubmit(onSubmitHandler)();
                          }}
                          selected={value ? new Date(value) : null}
                          placeholderText="End Date"
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

              {/* BUTTONS */}
              <div className="mb-auto flex gap-2">
                <button
                  type="button"
                  className="btn btn-sm my-auto h-[2.4rem] rounded-md border-2 border-green px-6 text-xs font-semibold text-green"
                  onClick={onClear}
                >
                  {clearButtonText}
                </button>

                {filterOptions?.includes(
                  OpportunityFilterOptions.VIEWALLFILTERSBUTTON,
                ) && (
                  <button
                    type="button"
                    className="btn btn-sm my-auto h-[2.4rem] rounded-md border-2 border-green text-xs font-semibold text-green"
                    onClick={onOpenFilterFullWindow}
                  >
                    View All Filters
                  </button>
                )}
              </div>
            </div>
          </div>
        </form>
      )}
      <div>
        <div className="mt-6 flex h-fit flex-col md:max-w-[1300px]">
          <div className="mb-2 flex items-center justify-between">
            {/* COUNT RESULT TEXT */}
            <div className="whitespace-nowrap text-xl font-semibold text-black">
              {countText && totalCount && totalCount > 0 ? (
                <span>{countText}</span>
              ) : null}
            </div>
            {/* EXPORT TO CSV */}
            {exportToCsv && (
              <div className="flex flex-row items-center justify-end">
                <button
                  type="button"
                  className="btn btn-sm h-[2.4rem] rounded-md border-2 border-green text-xs font-semibold text-green"
                  onClick={() => exportToCsv(true)}
                >
                  Export to CSV
                </button>
              </div>
            )}
          </div>

          {/* FILTER BADGES */}
          <div className="flex flex-wrap gap-2">
            {opportunitySearchFilter &&
              Object.entries(opportunitySearchFilter).map(([key, value]) =>
                key !== "pageNumber" &&
                key !== "pageSize" &&
                value != null &&
                (Array.isArray(value) ? value.length > 0 : true) ? (
                  <>
                    {Array.isArray(value) ? (
                      value.map((item: string) => {
                        if (key === "commitmentIntervals") {
                          const interval = lookups_commitmentIntervals.find(
                            (interval) => interval.id === item,
                          );
                          return (
                            <span
                              key={item}
                              className="badge h-6 max-w-[200px] rounded-md border-none bg-green-light p-2 text-green"
                            >
                              <p className="truncate text-center text-xs font-semibold">
                                {interval ? interval.name : ""}
                              </p>
                              <button
                                className="btn h-fit w-fit border-none p-0 shadow-none"
                                onClick={() => removeFromArray(key, item)}
                              >
                                <IoIosClose className="-mr-2 h-6 w-6" />
                              </button>
                            </span>
                          );
                        } else if (key === "zltoRewardRanges") {
                          const zltoRewardRange = lookups_zltoRewardRanges.find(
                            (range) => range.id === item,
                          );
                          return (
                            <span
                              key={item}
                              className="badge h-6 max-w-[200px] rounded-md border-none bg-green-light p-2 text-green"
                            >
                              <p className="truncate text-center text-xs font-semibold">
                                {zltoRewardRange ? zltoRewardRange.name : ""}
                              </p>
                              <button
                                className="btn h-fit w-fit border-none p-0 shadow-none"
                                onClick={() => removeFromArray(key, item)}
                              >
                                <IoIosClose className="-mr-2 h-6 w-6" />
                              </button>
                            </span>
                          );
                        } else {
                          return (
                            <span
                              key={item}
                              className="badge h-6 max-w-[200px] rounded-md border-none bg-green-light p-2 text-green"
                            >
                              <p className="truncate text-center text-xs font-semibold">
                                {item}
                              </p>
                              <button
                                className="btn h-fit w-fit border-none p-0 shadow-none"
                                onClick={() => removeFromArray(key, item)}
                              >
                                <IoIosClose className="-mr-2 h-6 w-6" />
                              </button>
                            </span>
                          );
                        }
                      })
                    ) : (
                      <span className="badge h-6 max-w-[200px] rounded-md border-none bg-green-light p-2 text-green">
                        <p className="truncate text-center text-xs font-semibold">
                          {key === "startDate" || key === "endDate"
                            ? new Date(value).toISOString().split("T")[0]
                            : (value as string)}
                        </p>
                        <button
                          className="btn h-fit w-fit border-none p-0 shadow-none"
                          onClick={() => removeValue(key)}
                        >
                          <IoIosClose className="-mr-2 h-6 w-6" />
                        </button>
                      </span>
                    )}
                  </>
                ) : null,
              )}
          </div>
        </div>
      </div>
    </div>
  );
};
