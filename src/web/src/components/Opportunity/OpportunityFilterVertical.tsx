import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect } from "react";
import { Controller, type FieldValues, useForm } from "react-hook-form";
import { IoMdClose } from "react-icons/io";
import zod from "zod";
import {
  type OpportunityCategory,
  type OpportunitySearchCriteriaCommitmentInterval,
  type OpportunitySearchCriteriaZltoReward,
  type OpportunityType,
  OpportunityFilterOptions,
  type OpportunitySearchFilterCombined,
} from "~/api/models/opportunity";
import type { Country, Language, SelectOption } from "~/api/models/lookups";
import Image from "next/image";
import { shimmer, toBase64 } from "src/lib/image";
import iconRocket from "public/images/icon-rocket.webp";
import Select from "react-select";
import type { OrganizationInfo } from "~/api/models/organisation";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { toISOStringForTimezone } from "~/lib/utils";

export const OpportunityFilterVertical: React.FC<{
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
  onCancel?: () => void;
  clearButtonText?: string;
  submitButtonText?: string;
  filterOptions: OpportunityFilterOptions[];
  onClear?: () => void;
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
  onCancel,
  submitButtonText = "Submit",
  filterOptions,
  onClear,
  clearButtonText,
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
  const { register, handleSubmit, formState, reset } = form;

  // set default values
  useEffect(() => {
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

  return (
    <>
      <form
        onSubmit={handleSubmit(onSubmitHandler)} // eslint-disable-line @typescript-eslint/no-misused-promises
        className="flex flex-col gap-2"
      >
        <div className="flex flex-row p-4">
          <h1 className="my-auto flex-grow text-2xl font-bold">Filter</h1>
          <button
            type="button"
            className="btn btn-primary rounded-full px-3"
            onClick={onCancel}
          >
            <IoMdClose className="h-6 w-6"></IoMdClose>
          </button>
        </div>

        <div className="-mb-2 flex flex-col bg-gray-light">
          <div className="join join-vertical w-full">
            {/* CATEGORIES */}
            {lookups_categories &&
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
                            className="flex h-[70px] flex-grow flex-row items-center justify-center gap-2 p-2"
                          >
                            <label
                              className="flex cursor-pointer items-center justify-center"
                              htmlFor={`checkbox_${item.id}`}
                            >
                              {!item.imageURL && (
                                <Image
                                  src={iconRocket}
                                  alt="Icon Rocket"
                                  width={60}
                                  height={60}
                                  sizes="100vw"
                                  priority={true}
                                  placeholder="blur"
                                  blurDataURL={`data:image/svg+xml;base64,${toBase64(
                                    shimmer(288, 182),
                                  )}`}
                                  style={{
                                    borderTopLeftRadius: "8px",
                                    borderTopRightRadius: "8px",
                                    width: "60px",
                                    height: "60px",
                                  }}
                                />
                              )}
                              {item.imageURL && (
                                <Image
                                  src={item.imageURL}
                                  alt="Organization Logo"
                                  width={60}
                                  height={60}
                                  sizes="100vw"
                                  priority={true}
                                  placeholder="blur"
                                  blurDataURL={`data:image/svg+xml;base64,${toBase64(
                                    shimmer(288, 182),
                                  )}`}
                                  style={{
                                    borderTopLeftRadius: "8px",
                                    borderTopRightRadius: "8px",
                                    width: "60px",
                                    height: "60px",
                                  }}
                                />
                              )}
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
              )}

            {/* VALUECONTAINS: hidden input */}
            <input
              type="hidden"
              {...form.register("valueContains")}
              value={opportunitySearchFilter?.valueContains ?? ""}
            />

            {/* TYPES */}
            {filterOptions?.includes(OpportunityFilterOptions.TYPES) && (
              <div className="collapse join-item collapse-arrow">
                <input type="checkbox" name="my-accordion-2" />
                <div className="collapse-title text-xl font-medium">
                  Opportunity type
                </div>
                <div className="collapse-content">
                  <Controller
                    name="types"
                    control={form.control}
                    defaultValue={opportunitySearchFilter?.types}
                    render={({ field: { onChange, value } }) => (
                      <Select
                        classNames={{
                          control: () => "input input-bordered",
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
                        onChange={(val) => onChange(val.map((c) => c.value))}
                        value={lookups_types
                          .filter((c) => value?.includes(c.name))
                          .map((c) => ({ value: c.name, label: c.name }))}
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
              </div>
            )}

            {/* COUNTRIES */}
            {filterOptions?.includes(OpportunityFilterOptions.COUNTRIES) && (
              <div className="collapse join-item collapse-arrow">
                <input type="checkbox" name="my-accordion-3" />
                <div className="collapse-title text-xl font-medium">
                  Location
                </div>
                <div className="collapse-content">
                  <Controller
                    name="countries"
                    control={form.control}
                    defaultValue={opportunitySearchFilter?.countries}
                    render={({ field: { onChange, value } }) => (
                      <Select
                        classNames={{
                          control: () => "input input-bordered",
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
                        onChange={(val) => onChange(val.map((c) => c.value))}
                        value={lookups_countries
                          .filter((c) => value?.includes(c.name))
                          .map((c) => ({ value: c.name, label: c.name }))}
                        placeholder="Select Countries..."
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
              </div>
            )}

            {/* LANGUAGES */}
            {filterOptions?.includes(OpportunityFilterOptions.LANGUAGES) && (
              <div className="collapse join-item collapse-arrow">
                <input type="checkbox" name="my-accordion-4" />
                <div className="collapse-title text-xl font-medium">
                  Language
                </div>
                <div className="collapse-content">
                  <Controller
                    name="languages"
                    control={form.control}
                    defaultValue={opportunitySearchFilter?.languages}
                    render={({ field: { onChange, value } }) => (
                      <Select
                        classNames={{
                          control: () => "input input-bordered",
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
                        onChange={(val) => onChange(val.map((c) => c.value))}
                        value={lookups_languages
                          .filter((c) => value?.includes(c.name))
                          .map((c) => ({ value: c.name, label: c.name }))}
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
              </div>
            )}

            {/* ORGANIZATIONS */}
            {filterOptions?.includes(
              OpportunityFilterOptions.ORGANIZATIONS,
            ) && (
              <div className="collapse join-item collapse-arrow">
                <input type="checkbox" name="my-accordion-5" />
                <div className="collapse-title text-xl font-medium">
                  Organisation
                </div>
                <div className="collapse-content">
                  <Controller
                    name="organizations"
                    control={form.control}
                    defaultValue={opportunitySearchFilter?.organizations}
                    render={({ field: { onChange, value } }) => (
                      <Select
                        classNames={{
                          control: () => "input input-bordered",
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
                        onChange={(val) => onChange(val.map((c) => c.value))}
                        value={lookups_organisations
                          .filter((c) => value?.includes(c.name))
                          .map((c) => ({ value: c.name, label: c.name }))}
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
              </div>
            )}

            {/* COMMITMENT INTERVALS */}
            {filterOptions?.includes(
              OpportunityFilterOptions.COMMITMENTINTERVALS,
            ) && (
              <div className="collapse join-item collapse-arrow">
                <input type="checkbox" name="my-accordion-6" />
                <div className="collapse-title text-xl font-medium">Effort</div>
                <div className="collapse-content">
                  <Controller
                    name="commitmentIntervals"
                    control={form.control}
                    defaultValue={opportunitySearchFilter?.commitmentIntervals}
                    render={({ field: { onChange, value } }) => (
                      <Select
                        classNames={{
                          control: () => "input input-bordered",
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
                        onChange={(val) => onChange(val.map((c) => c.value))}
                        value={lookups_commitmentIntervals
                          .filter((c) => value?.includes(c.id))
                          .map((c) => ({ value: c.id, label: c.name }))}
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
                </div>
              </div>
            )}

            {/* ZLTO REWARD RANGES */}
            {filterOptions?.includes(
              OpportunityFilterOptions.ZLTOREWARDRANGES,
            ) && (
              <div className="collapse join-item collapse-arrow">
                <input type="checkbox" name="my-accordion-7" />
                <div className="collapse-title text-xl font-medium">Reward</div>
                <div className="collapse-content">
                  <Controller
                    name="zltoRewardRanges"
                    control={form.control}
                    defaultValue={opportunitySearchFilter?.zltoRewardRanges}
                    render={({ field: { onChange, value } }) => (
                      <Select
                        classNames={{
                          control: () => "input input-bordered",
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
              </div>
            )}

            {/* PUBLISHED STATES */}
            {filterOptions?.includes(
              OpportunityFilterOptions.PUBLISHEDSTATES,
            ) && (
              <div className="collapse join-item collapse-arrow">
                <input type="checkbox" name="my-accordion-7" />
                <div className="collapse-title text-xl font-medium">Status</div>
                <div className="collapse-content">
                  <Controller
                    name="publishedStates"
                    control={form.control}
                    render={({ field: { onChange, value } }) => (
                      <Select
                        instanceId="publishedStates"
                        classNames={{
                          control: () => "input",
                        }}
                        isMulti={true}
                        options={lookups_publishedStates}
                        // fix menu z-index issue
                        menuPortalTarget={htmlRef}
                        styles={{
                          menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                        }}
                        onChange={(val) => onChange(val.map((c) => c.label))}
                        value={lookups_publishedStates.filter(
                          (c) => value?.includes(c.label),
                        )}
                        placeholder="Status"
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
              </div>
            )}

            {/* STATUSES */}
            {filterOptions?.includes(OpportunityFilterOptions.STATUSES) && (
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
            )}

            {/* DATES */}
            {(filterOptions?.includes(OpportunityFilterOptions.DATE_START) ||
              filterOptions?.includes(OpportunityFilterOptions.DATE_END)) && (
              <>
                <div className="collapse-title text-xl font-medium">Dates</div>
                <input type="checkbox" name="my-accordion-9" />
                <div className="flex flex-row gap-1 px-4 pb-4">
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

                  {/* DATE END */}
                  {filterOptions?.includes(
                    OpportunityFilterOptions.DATE_END,
                  ) && (
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
            )}
          </div>
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
