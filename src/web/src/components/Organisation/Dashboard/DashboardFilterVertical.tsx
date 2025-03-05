import { zodResolver } from "@hookform/resolvers/zod";
import type { Session } from "next-auth";
import { useCallback, useEffect, useState } from "react";
import "react-datepicker/dist/react-datepicker.css";
import { Controller, useForm, type FieldValues } from "react-hook-form";
import { IoMdClose, IoMdOptions } from "react-icons/io";
import zod from "zod";
import type {
  Country,
  EngagementType,
  Language,
  SelectOption,
  TimeInterval,
} from "~/api/models/lookups";
import {
  OpportunityCategory,
  OpportunitySearchResultsInfo,
  type OpportunitySearchFilter,
  type OpportunityType,
} from "~/api/models/opportunity";
import type {
  OrganizationInfo,
  OrganizationSearchResults,
} from "~/api/models/organisation";
import { getUserProfile } from "~/api/services/user";
import { useAtomValue } from "jotai";
import { currentLanguageAtom } from "~/lib/store";
import SelectButtons from "~/components/Common/SelectButtons";
import { OrganizationSearchFilterSummaryViewModel } from "~/pages/organisations/dashboard";
import DatePicker from "react-datepicker";
import { debounce, toISOStringForTimezone } from "~/lib/utils";
import Select, { components, type ValueContainerProps } from "react-select";
import Async from "react-select/async";
import { searchCriteriaOpportunities } from "~/api/services/opportunities";
import { getOrganisations } from "~/api/services/organisations";
import { PAGE_SIZE_MEDIUM } from "~/lib/constants";

// const ValueContainer = ({
//   children,
//   ...props
// }: ValueContainerProps<SelectOption>) => {
//   let [values, input] = children as any[];
//   if (Array.isArray(values)) {
//     if (
//       values.length > 0 &&
//       "props" in values[0] &&
//       "selectProps" in values[0].props &&
//       values[0].props.selectProps.placeholder
//     ) {
//       const pluralMapping: Record<string, string> = {
//         Category: "Categories",
//         Opportunity: "Opportunities",
//         Organization: "Organisations",
//       };

//       const pluralize = (word: string, count: number): string => {
//         if (count === 1) return word;
//         return pluralMapping[word] ?? `${word}s`;
//       };

//       const placeholder: string = values[0].props.selectProps.placeholder;
//       values = `${values.length} ${pluralize(placeholder, values.length)}`;
//     }
//   }
//   return (
//     <components.ValueContainer {...props}>
//       {values}
//       {input}
//     </components.ValueContainer>
//   );
// };

export const DashboardFilterVertical: React.FC<{
  htmlRef: HTMLDivElement;
  searchFilter: OrganizationSearchFilterSummaryViewModel;
  lookups_countries?: Country[];
  lookups_categories?: OpportunityCategory[];
  lookups_selectedOpportunities?: OpportunitySearchResultsInfo;
  lookups_selectedOrganisations?: OrganizationSearchResults;
  onSubmit?: (fieldValues: OrganizationSearchFilterSummaryViewModel) => void;
  onCancel?: () => void;
  clearButtonText?: string;
  submitButtonText?: string;
  onClear?: () => void;
  //session: Session | null;
}> = ({
  htmlRef,
  searchFilter,
  lookups_countries,
  lookups_categories,
  lookups_selectedOpportunities,
  lookups_selectedOrganisations,
  onSubmit,
  onCancel,
  submitButtonText = "Submit",
  onClear,
  clearButtonText,
  //session,
}) => {
  //const currentLanguage = useAtomValue(currentLanguageAtom);

  const schema = zod.object({
    organizations: zod.array(zod.string()).optional().nullable(),
    opportunities: zod.array(zod.string()).optional().nullable(),
    categories: zod.array(zod.string()).optional().nullable(),
    startDate: zod.string().optional().nullable(),
    endDate: zod.string().optional().nullable(),
    countries: zod.array(zod.string()).optional().nullable(),
  });
  const form = useForm({
    mode: "all",
    resolver: zodResolver(schema),
  });

  const { handleSubmit, formState, watch, setValue } = form;

  // form submission handler
  const onSubmitHandler = useCallback(
    (data: FieldValues) => {
      if (onSubmit) onSubmit(data as OrganizationSearchFilterSummaryViewModel);
    },
    [onSubmit],
  );
  // load data asynchronously for the organisations dropdown
  // debounce is used to prevent the API from being called too frequently
  const loadOrganisations = debounce(
    (inputValue: string, callback: (options: any) => void) => {
      getOrganisations({
        organizations: [],
        valueContains: (inputValue ?? []).length > 2 ? inputValue : null,
        statuses: null,
        pageNumber: 1,
        pageSize: PAGE_SIZE_MEDIUM,
      }).then((data) => {
        const options = data.items.map((item) => ({
          value: item.id,
          label: item.name,
        }));
        callback(options);
      });
    },
    1000,
  );

  // the AsyncSelect component requires the defaultOptions to be set in the state
  const [defaultOrganisationOptions, setDefaultOrganisationOptions] =
    useState<any>([]);

  useEffect(() => {
    if (searchFilter?.organizations && lookups_selectedOrganisations) {
      setDefaultOrganisationOptions(
        searchFilter.organizations.map((orgId: string) => {
          const org = lookups_selectedOrganisations.items.find(
            (item) => item.id === orgId,
          );
          return {
            value: orgId,
            label: org ? org.name : orgId, // Use orgId as label if name not found
          };
        }),
      );
    }
  }, [
    setDefaultOrganisationOptions,
    searchFilter?.organizations,
    lookups_selectedOrganisations,
  ]);

  // load data asynchronously for the opportunities dropdown
  // debounce is used to prevent the API from being called too frequently
  const loadOpportunities = debounce(
    (inputValue: string, callback: (options: any) => void) => {
      // Check if organizations are specified
      if (
        !searchFilter?.organizations ||
        searchFilter.organizations.length === 0
      ) {
        // If no organizations, return an empty array
        callback([]);
        return;
      }

      searchCriteriaOpportunities({
        opportunities: [],
        organizations: searchFilter?.organizations,
        countries: null,
        titleContains: (inputValue ?? []).length > 2 ? inputValue : null,
        published: null,
        verificationMethod: null,
        verificationEnabled: null,
        pageNumber: 1,
        pageSize: PAGE_SIZE_MEDIUM,
      }).then((data) => {
        const options = data.items.map((item) => ({
          value: item.id,
          label: item.title,
        }));
        callback(options);
      });
    },
    1000,
  );

  // the AsyncSelect component requires the defaultOptions to be set in the state
  const [defaultOpportunityOptions, setDefaultOpportunityOptions] =
    useState<any>([]);

  useEffect(() => {
    if (searchFilter?.opportunities && lookups_selectedOpportunities) {
      setDefaultOpportunityOptions(
        searchFilter.opportunities.map((oppId: string) => {
          const opp = lookups_selectedOpportunities.items.find(
            (item) => item.id === oppId,
          );
          return {
            value: oppId,
            label: opp ? opp.title : oppId, // Use oppId as label if title not found
          };
        }),
      );
    }
  }, [
    setDefaultOpportunityOptions,
    searchFilter?.opportunities,
    lookups_selectedOpportunities,
  ]);
  return (
    <>
      <form
        onSubmit={handleSubmit(onSubmitHandler)} // eslint-disable-line @typescript-eslint/no-misused-promises
        className="flex h-full flex-col overflow-y-auto"
      >
        <div className="flex flex-row px-4 py-4 md:px-8">
          <div className="my-autox flex flex-grow flex-col gap-1">
            <div className="flex flex-row items-center gap-4 text-xl font-bold">
              <IoMdOptions className="h-5 w-5" /> Filter
            </div>
            <div className="font-semiboldx text-sm text-gray-dark">
              Select the criteria below to filter the dashboard.
            </div>
          </div>
          <button
            type="button"
            className="bg-theme animate-spin-once btn rounded-full border-0 p-3 text-gray-light hover:brightness-90"
            onClick={onCancel}
          >
            <IoMdClose className="h-6 w-6"></IoMdClose>
          </button>
        </div>
        <div className="flex flex-col gap-4 bg-gray-light p-2 md:px-8">
          {/* VALUECONTAINS: hidden input */}
          {/* <input
            type="hidden"
            {...form.register("valueContains")}
            value={searchFilter?.valueContains ?? ""}
          /> */}

          {/* ORGANIZATIONS */}
          <div className="form-control gap-1">
            <label className="label">
              <span className="label-text flex font-semibold">
                <div className="flex gap-2">
                  <div>🏢</div>
                  <div>Organisation</div>
                </div>
              </span>
            </label>

            <Controller
              name="organizations"
              control={form.control}
              render={({ field: { onChange } }) => (
                <Async
                  instanceId="organizations"
                  classNames={{
                    control: () =>
                      "input input-xs h-fit !border-none w-full md:w-72",
                  }}
                  isMulti={true}
                  defaultOptions={true} // calls loadOrganisations for initial results when clicking on the dropdown
                  cacheOptions
                  loadOptions={loadOrganisations}
                  menuPortalTarget={htmlRef} // fix menu z-index issue
                  styles={{
                    menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                  }}
                  onChange={(val) => {
                    onChange(val.map((c: any) => c.value));
                    void handleSubmit(onSubmitHandler)();
                  }}
                  value={defaultOrganisationOptions}
                  placeholder="Select an organisation"
                  //   components={{
                  //     ValueContainer,
                  //   }}
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

          {/* COUNTRIES */}
          {lookups_countries && (
            <div className="form-control gap-1">
              <label className="label">
                <span className="label-text flex font-semibold">
                  <div className="flex gap-2">
                    <div>🌍</div>
                    <div>Country</div>
                  </div>
                </span>
              </label>

              <Controller
                name="countries"
                control={form.control}
                defaultValue={searchFilter?.countries}
                render={({ field: { onChange, value } }) => (
                  <Select
                    instanceId="countries"
                    classNames={{
                      control: () =>
                        "input input-xs h-fit !border-none w-full md:w-72",
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
                    placeholder="Select a country"
                    // components={{
                    //   ValueContainer,
                    // }}
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

          {/* DATES */}
          <div className="flex flex-col items-start gap-4 md:flex-row md:gap-14">
            {/* DATE START */}
            <div className="form-control w-full gap-1">
              <label className="label">
                <span className="label-text flex font-semibold">
                  <div className="flex gap-2">
                    <div>🗓️</div>
                    <div>From</div>
                  </div>
                </span>
              </label>

              <Controller
                control={form.control}
                name="startDate"
                render={({ field: { onChange, value } }) => (
                  <DatePicker
                    className="input input-bordered h-10 w-full rounded border-none !text-xs placeholder:text-xs placeholder:text-[#828181] focus:border-gray focus:outline-none"
                    onChange={(date) => {
                      onChange(toISOStringForTimezone(date));
                      void handleSubmit(onSubmitHandler)();
                    }}
                    selected={value ? new Date(value) : null}
                    placeholderText="Start Date"
                    portalId="startDate"
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
            </div>

            {/* DATE END */}
            <div className="form-control w-full gap-1">
              <label className="label">
                <span className="label-text flex font-semibold">
                  <div className="flex gap-2">
                    <div>🗓️</div>
                    <div>Until</div>
                  </div>
                </span>
              </label>

              <Controller
                control={form.control}
                name="endDate"
                render={({ field: { onChange, value } }) => (
                  <DatePicker
                    className="input input-bordered h-10 w-full rounded border-none !text-xs placeholder:text-xs placeholder:text-[#828181] focus:border-gray focus:outline-none"
                    onChange={(date) => {
                      // change time to 1 second to midnight
                      if (date) date.setHours(23, 59, 59, 999);
                      onChange(toISOStringForTimezone(date));
                      void handleSubmit(onSubmitHandler)();
                    }}
                    selected={value ? new Date(value) : null}
                    placeholderText="End Date"
                    portalId="endDate"
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
            </div>
          </div>

          <div className="flex flex-col items-start gap-4 md:flex-row">
            {/* OPPORTUNITIES */}
            <div className="form-control w-full gap-1">
              <label className="label">
                <span className="label-text flex font-semibold">
                  <div className="flex gap-2">
                    <div>🏆</div>
                    <div>Opportunity</div>
                  </div>
                </span>
              </label>

              <Controller
                name="opportunities"
                control={form.control}
                render={({ field: { onChange } }) => (
                  <Async
                    instanceId="opportunities"
                    classNames={{
                      control: () =>
                        "input input-xs h-fit !border-none w-full md:w-72",
                    }}
                    isMulti={true}
                    defaultOptions={true} // calls loadOpportunities for initial results when clicking on the dropdown
                    cacheOptions
                    loadOptions={loadOpportunities}
                    menuPortalTarget={htmlRef} // fix menu z-index issue
                    styles={{
                      menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                    }}
                    onChange={(val) => {
                      // clear categories
                      setValue("categories", []);

                      onChange(val.map((c: any) => c.value));
                      void handleSubmit(onSubmitHandler)();
                    }}
                    value={defaultOpportunityOptions}
                    placeholder="Opportunity"
                    // components={{
                    //   ValueContainer,
                    // }}
                  />
                )}
              />
              {formState.errors.opportunities && (
                <label className="label font-bold">
                  <span className="label-text-alt italic text-red-500">
                    {`${formState.errors.opportunities.message}`}
                  </span>
                </label>
              )}
            </div>

            <div className="items-centerx mx-auto flex h-full w-full justify-center text-center text-xs font-bold text-gray-dark md:mt-12">
              OR
            </div>

            {/* CATEGORIES */}
            <div className="form-control w-full gap-1">
              <label className="label">
                <span className="label-text flex font-semibold">
                  <div className="flex gap-2">
                    <div>🏷️</div>
                    <div>Category</div>
                  </div>
                </span>
              </label>

              <Controller
                name="categories"
                control={form.control}
                defaultValue={searchFilter?.categories}
                render={({ field: { onChange, value } }) => (
                  <Select
                    instanceId="categories"
                    classNames={{
                      control: () =>
                        "input input-xs h-fit !border-none w-full md:w-72",
                    }}
                    isMulti={true}
                    options={lookups_categories?.map((c) => ({
                      value: c.name,
                      label: c.name,
                    }))}
                    // fix menu z-index issue
                    menuPortalTarget={htmlRef}
                    styles={{
                      menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                    }}
                    onChange={(val) => {
                      // clear opportunities
                      setValue("opportunities", []);

                      onChange(val.map((c) => c.value));
                      void handleSubmit(onSubmitHandler)();
                    }}
                    value={
                      lookups_categories
                        ? lookups_categories
                            .filter((c) => value?.includes(c.name))
                            .map((c) => ({ value: c.name, label: c.name }))
                        : null
                    }
                    placeholder="Category"
                    // components={{
                    //   ValueContainer,
                    // }}
                  />
                )}
              />

              {formState.errors.categories && (
                <label className="label font-bold">
                  <span className="label-text-alt italic text-red-500">
                    {`${formState.errors.categories.message}`}
                  </span>
                </label>
              )}
            </div>
          </div>

          {/* ENGAGEMENT TYPES */}
          {/* <div className="form-control gap-1">
            <label className="label">
              <span className="label-text font-semibold">
                What type of engagement are you looking for?
              </span>
            </label>

            <Controller
              name="engagementTypes"
              control={form.control}
              defaultValue={searchFilter?.engagementTypes ?? []}
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
          </div> */}

          {/* COMMITMENT INTERVALS */}
          {/* <div className="form-control gap-1">
            <label className="label">
              <span className="label-text font-semibold">
                How much time would you like to invest?
              </span>
            </label>
            <div className="flex w-full flex-row justify-start gap-4">
              <span className="mt-1 text-xs font-semibold text-gray-dark">
                0
              </span>

              <Controller
                name="commitmentInterval.interval.count"
                control={form.control}
                defaultValue={
                  searchFilter?.commitmentInterval?.interval?.count ?? 0
                }
                render={({ field: { onChange, value } }) => (
                  <div className="flex w-full flex-col justify-center text-center md:w-64">
                    <input
                      type="range"
                      className="range range-warning bg-white"
                      min="0"
                      max={timeIntervalMax}
                      value={value}
                      onChange={(val) => onChange(val)}
                    />
                    <span className="-mb-3 mt-2 h-8 text-xs font-semibold text-gray-dark">
                      {value > 0 && watchIntervalId != null && (
                        <>
                          {`${value} ${
                            value > 1 ? `${watchIntervalId}s` : watchIntervalId
                          }`}
                        </>
                      )}
                    </span>
                  </div>
                )}
              />

              <span className="mt-1 text-xs font-semibold text-gray-dark">
                {timeIntervalMax}
              </span>
            </div>
            <div className="flex w-full flex-row justify-start gap-4">
              <Controller
                name="commitmentInterval.interval.id"
                control={form.control}
                render={({ field: { onChange, value } }) => (
                  <SelectButtons
                    id="selectButtons_commitmentIntervals"
                    buttons={lookups_timeIntervals.map((x) => ({
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
            </div>
          </div> */}

          {/* ZLTO REWARD RANGES */}
          {/* <div className="form-control -mb-3 flex flex-row items-center gap-4">
            <label className="label">
              <span className="label-text font-semibold">ZLTO Reward</span>
            </label>
            <Controller
              name="zltoReward.hasReward"
              control={form.control}
              defaultValue={searchFilter?.zltoReward?.hasReward ?? false}
              render={({ field: { onChange, value } }) => (
                <input
                  type="checkbox"
                  className="toggle toggle-warning border-gray-dark bg-gray-dark"
                  checked={value}
                  onChange={(val) => onChange(val)}
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
          </div> */}

          {/* COUNTRIES */}
          {/* <div className="form-control gap-1">
            <label className="label">
              <span className="label-text font-semibold">Country</span>
            </label>

            <Controller
              name="countries"
              control={form.control}
              render={({ field: { onChange, value } }) => (
                <SelectButtons
                  id="selectButtons_countries"
                  isMulti={true}
                  maxRows={8}
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
          </div> */}

          {/* LANGUAGES */}
          {/* <div className="form-control gap-1">
            <label className="label">
              <span className="label-text font-semibold">Languages</span>
            </label>

            <Controller
              name="languages"
              control={form.control}
              render={({ field: { onChange, value } }) => (
                <SelectButtons
                  id="selectButtons_languages"
                  isMulti={true}
                  maxRows={8}
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
          </div> */}

          {/* ORGANIZATIONS */}
          {/* <div className="form-control gap-1">
            <label className="label">
              <span className="label-text font-semibold">Providers</span>
            </label>

            <Controller
              name="organizations"
              control={form.control}
              defaultValue={searchFilter?.organizations ?? []}
              render={({ field: { onChange, value } }) => (
                <SelectButtons
                  id="selectButtons_organizations"
                  isMulti={true}
                  maxRows={4}
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
          </div> */}

          {/* PUBLISHED STATES */}
          {/* <div className="form-control gap-1">
            <label className="label">
              <span className="label-text font-semibold">
                What status would you like to see?
              </span>
            </label>
            <Controller
              name="publishedStates"
              control={form.control}
              defaultValue={searchFilter?.publishedStates ?? []}
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
          </div> */}
        </div>

        {/* BUTTONS */}
        <div className="mx-4 my-8 flex flex-col items-center justify-center gap-6 md:flex-row">
          {onClear && (
            <button
              type="button"
              className="btn btn-neutral w-full flex-grow rounded-full !border-gray-dark hover:bg-gray-light md:w-40"
              onClick={onClear}
            >
              {clearButtonText}
            </button>
          )}
          {onSubmit && (
            <button
              type="submit"
              className="bg-theme border-0-full btn w-full flex-grow rounded text-gray-light hover:brightness-90 md:w-40"
            >
              {submitButtonText}
            </button>
          )}
        </div>
      </form>
    </>
  );
};
