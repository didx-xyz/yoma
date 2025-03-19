import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Controller, useForm, type FieldValues } from "react-hook-form";
import { IoMdClose, IoMdOptions } from "react-icons/io";
import Async from "react-select/async";
import zod from "zod";
import type { OpportunitySearchResultsInfo } from "~/api/models/opportunity";
import type { OrganizationSearchResults } from "~/api/models/organisation";
import {
  getCategoriesAdmin,
  getCountriesAdmin,
  searchCriteriaOpportunities,
} from "~/api/services/opportunities";
import { getOrganisations } from "~/api/services/organisations";
import { PAGE_SIZE_MEDIUM } from "~/lib/constants";
import { debounce, toISOStringForTimezone } from "~/lib/utils";
import type { OrganizationSearchFilterSummaryViewModel } from "~/pages/organisations/dashboard";

// Update the schema so that countries and categories are arrays of option objects
const schema = zod.object({
  organizations: zod.array(zod.string()).optional().nullable(),
  opportunities: zod.array(zod.string()).optional().nullable(),
  countries: zod.array(zod.string()).optional().nullable(),
  categories: zod.array(zod.string()).optional().nullable(),
  startDate: zod.string().optional().nullable(),
  endDate: zod.string().optional().nullable(),
});

export const DashboardFilterVertical: React.FC<{
  htmlRef: HTMLDivElement;
  searchFilter: OrganizationSearchFilterSummaryViewModel;
  lookups_selectedOrganisations?: OrganizationSearchResults;
  lookups_selectedOpportunities?: OpportunitySearchResultsInfo;
  onSubmit?: (fieldValues: OrganizationSearchFilterSummaryViewModel) => void;
  onCancel?: () => void;
  clearButtonText?: string;
  submitButtonText?: string;
  onClear?: () => void;
  isAdmin?: boolean;
}> = ({
  htmlRef,
  searchFilter,
  lookups_selectedOrganisations,
  lookups_selectedOpportunities,
  onSubmit,
  onCancel,
  submitButtonText = "Submit",
  onClear,
  clearButtonText,
  isAdmin,
}) => {
  const form = useForm({
    mode: "all",
    resolver: zodResolver(schema),

    defaultValues: {
      organizations: searchFilter?.organizations || [],
      opportunities: searchFilter?.opportunities || [],
      countries: searchFilter?.countries || [],
      categories: searchFilter?.categories || [],
      startDate: searchFilter?.startDate || null,
      endDate: searchFilter?.endDate || null,
    },
  });
  const { handleSubmit, formState, watch, setValue } = form;
  const watchOrganisations = watch("organizations");

  // Handle form submission
  const onSubmitHandler = useCallback(
    (data: FieldValues) => {
      if (onSubmit) {
        onSubmit(data as OrganizationSearchFilterSummaryViewModel);
      }
    },
    [onSubmit],
  );

  // ------------------------ Lookup loaders (Debounced) ------------------------
  const loadOrganisations = debounce(
    (inputValue: string, callback: (options: any) => void) => {
      getOrganisations({
        organizations: [],
        valueContains: inputValue.length > 2 ? inputValue : null,
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

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const loadOpportunities = useCallback(
    debounce((inputValue: string, callback: (options: any) => void) => {
      searchCriteriaOpportunities({
        opportunities: [],
        organizations: watchOrganisations,
        countries: null,
        titleContains: inputValue.length > 2 ? inputValue : null,
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
    }, 1000),
    [watchOrganisations],
  );

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const loadCategories = useCallback(
    debounce((inputValue: string, callback: (options: any) => void) => {
      getCategoriesAdmin(watchOrganisations).then((data) => {
        const options = data.map((item) => ({
          value: item.name,
          label: item.name,
        }));
        callback(options);
      });
    }, 1000),
    [watchOrganisations],
  );

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const loadCountries = useCallback(
    debounce((inputValue: string, callback: (options: any) => void) => {
      getCountriesAdmin(watchOrganisations).then((data) => {
        const options = data.map((item) => ({
          value: item.name,
          label: item.name,
        }));
        callback(options);
      });
    }, 1000),
    [watchOrganisations],
  );

  // ------------------------ Local state for Lookup Options ------------------------
  const [defaultOpportunities, setDefaultOpportunities] = useState<any[]>([]);
  const [defaultCategories, setDefaultCategories] = useState<any[]>([]);
  const [defaultCountries, setDefaultCountries] = useState<any[]>([]);

  // Local state to manage the selected options for async selects
  const [selectedOrganisationOptions, setSelectedOrganisationOptions] =
    useState<any[]>([]);
  const [selectedOpportunityOptions, setSelectedOpportunityOptions] = useState<
    any[]
  >([]);

  // Update organisation options from provided lookup data
  useEffect(() => {
    if (searchFilter?.organizations && lookups_selectedOrganisations) {
      const newOptions = searchFilter.organizations.map((orgId: string) => {
        const org = lookups_selectedOrganisations.items.find(
          (item) => item.id === orgId,
        );
        return { value: orgId, label: org ? org.name : orgId };
      });
      setSelectedOrganisationOptions(newOptions);
    } else {
      setSelectedOrganisationOptions([]);
    }
  }, [searchFilter?.organizations, lookups_selectedOrganisations]);

  // Update opportunity options from provided lookup data
  useEffect(() => {
    if (searchFilter?.opportunities && lookups_selectedOpportunities) {
      const newOptions = searchFilter.opportunities.map((oppId: string) => {
        const opp = lookups_selectedOpportunities.items.find(
          (item) => item.id === oppId,
        );
        return { value: oppId, label: opp ? opp.title : oppId };
      });
      setSelectedOpportunityOptions(newOptions);
    } else {
      setSelectedOpportunityOptions([]);
    }
  }, [searchFilter?.opportunities, lookups_selectedOpportunities]);

  // When organisations change update dependent lookup options
  useEffect(() => {
    if (!watchOrganisations) {
      setValue("countries", []);
      setValue("opportunities", []);
      setValue("categories", []);
      setSelectedOpportunityOptions([]);

      return;
    }
    loadOpportunities("", (options: any) => setDefaultOpportunities(options));
    loadCategories("", (options: any) => setDefaultCategories(options));
    loadCountries("", (options: any) => setDefaultCountries(options));
  }, [
    watchOrganisations,
    setValue,
    loadOpportunities,
    loadCategories,
    loadCountries,
  ]);

  return (
    <>
      <form
        onSubmit={handleSubmit(onSubmitHandler)}
        className="flex h-full flex-col overflow-y-auto"
      >
        {/* Header */}
        <div className="flex flex-row px-4 py-4 md:px-8">
          <div className="my-autox flex flex-grow flex-col gap-1">
            <div className="flex flex-row items-center gap-4 text-xl font-bold">
              <IoMdOptions className="h-5 w-5" /> Filter
            </div>
            <div className="text-sm font-semibold text-gray-dark">
              Select the criteria below to filter the dashboard.
            </div>
          </div>
          <button
            type="button"
            className="bg-theme btn rounded-full border-0 p-3 text-gray-light hover:brightness-90"
            onClick={onCancel}
          >
            <IoMdClose className="h-6 w-6" />
          </button>
        </div>

        {/* Filter Fields */}
        <div className="flex flex-col gap-4 bg-gray-light p-2 md:px-8">
          {/* Organisations Async Dropdown */}
          {isAdmin && (
            <div className="form-control gap-1">
              <label className="label">
                <span className="label-text flex font-semibold">
                  <span className="flex gap-2">
                    <span>🏢</span>
                    <span>Organisation</span>
                  </span>
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
                        "input input-xs h-fit !border-none w-full md:w-72z",
                    }}
                    isMulti
                    defaultOptions={true}
                    cacheOptions
                    loadOptions={loadOrganisations}
                    menuPortalTarget={htmlRef}
                    styles={{
                      menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                    }}
                    onChange={(val) => {
                      // clear dependents when organisation changes
                      setValue("countries", []);
                      setValue("opportunities", []);
                      setValue("categories", []);
                      setSelectedOpportunityOptions([]);

                      // Save IDs in the form and update local selected options
                      onChange(val.map((c: any) => c.value));
                      setSelectedOrganisationOptions(val as any);
                    }}
                    value={selectedOrganisationOptions}
                    placeholder="Select an organisation"
                  />
                )}
              />
              {formState.errors.organizations && (
                <label className="label font-bold">
                  <span className="label-text-alt italic text-red-500">
                    {formState.errors.organizations.message as string}
                  </span>
                </label>
              )}
            </div>
          )}

          {/* Countries Async Dropdown */}
          <div className="form-control gap-1">
            <label className="label">
              <span className="label-text flex font-semibold">
                <span className="flex gap-2">
                  <span>🌍</span>
                  <span>Country</span>
                </span>
              </span>
            </label>
            <Controller
              name="countries"
              control={form.control}
              render={({ field: { onChange, value } }) => (
                <Async
                  instanceId="countries"
                  classNames={{
                    control: () =>
                      "input input-xs h-fit !border-none w-full md:w-72",
                  }}
                  isMulti
                  defaultOptions={defaultCountries}
                  cacheOptions={false}
                  loadOptions={(inputValue, callback) => {
                    const filtered = defaultCountries.filter((option) =>
                      option.label
                        .toLowerCase()
                        .includes(inputValue.toLowerCase()),
                    );
                    callback(filtered);
                  }}
                  menuPortalTarget={htmlRef}
                  styles={{ menuPortal: (base) => ({ ...base, zIndex: 9999 }) }}
                  onChange={(val) => {
                    onChange(val?.map((c: any) => c.value));
                  }}
                  value={
                    value?.map((c: any) => {
                      const found = defaultCountries.find(
                        (country) => country.value === c,
                      );
                      return {
                        value: c,
                        label: found ? found.label : c,
                      };
                    }) || []
                  }
                  placeholder="Select a country"
                  noOptionsMessage={() =>
                    !watchOrganisations?.length
                      ? "Select an organisation to load available countries"
                      : "No countries found."
                  }
                />
              )}
            />
            {formState.errors.countries && (
              <label className="label font-bold">
                <span className="label-text-alt italic text-red-500">
                  {formState.errors.countries.message as string}
                </span>
              </label>
            )}
          </div>
          {/* Date Pickers */}
          <div className="flex flex-col items-start gap-4 md:flex-row md:gap-14">
            {/* Start Date */}
            <div className="form-control w-full gap-1">
              <label className="label">
                <span className="label-text flex font-semibold">
                  <span className="flex gap-2">
                    <span>🗓️</span>
                    <span>From</span>
                  </span>
                </span>
              </label>
              <Controller
                control={form.control}
                name="startDate"
                render={({ field: { onChange, value } }) => (
                  <DatePicker
                    className="input input-bordered h-10 w-full rounded border-none !text-xs placeholder:text-xs placeholder:text-[#828181] focus:border-gray focus:outline-none"
                    onChange={(date) => onChange(toISOStringForTimezone(date))}
                    selected={value ? new Date(value) : null}
                    placeholderText="Start Date"
                    portalId="startDate"
                  />
                )}
              />
              {formState.errors.startDate && (
                <label className="label">
                  <span className="label-text-alt px-4 text-base italic text-red-500">
                    {formState.errors.startDate.message as string}
                  </span>
                </label>
              )}
            </div>

            {/* End Date */}
            <div className="form-control w-full gap-1">
              <label className="label">
                <span className="label-text flex font-semibold">
                  <span className="flex gap-2">
                    <span>🗓️</span>
                    <span>Until</span>
                  </span>
                </span>
              </label>
              <Controller
                control={form.control}
                name="endDate"
                render={({ field: { onChange, value } }) => (
                  <DatePicker
                    className="input input-bordered h-10 w-full rounded border-none !text-xs placeholder:text-xs placeholder:text-[#828181] focus:border-gray focus:outline-none"
                    onChange={(date) => {
                      if (date) date.setHours(23, 59, 59, 999);
                      onChange(toISOStringForTimezone(date));
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
                    {formState.errors.endDate.message as string}
                  </span>
                </label>
              )}
            </div>
          </div>
          {/* Opportunities & Categories */}
          <div className="flex flex-col items-start gap-4 md:flex-row">
            {/* Opportunities Async Dropdown */}
            <div className="form-control w-full gap-1">
              <label className="label">
                <span className="label-text flex font-semibold">
                  <span className="flex gap-2">
                    <span>🏆</span>
                    <span>Opportunity</span>
                  </span>
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
                    isMulti
                    defaultOptions={defaultOpportunities}
                    cacheOptions={false}
                    loadOptions={loadOpportunities}
                    menuPortalTarget={htmlRef}
                    styles={{
                      menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                    }}
                    onChange={(val) => {
                      // clear categories when opportunity changes
                      setValue("categories", []);

                      onChange(val.map((c: any) => c.value));
                      setSelectedOpportunityOptions(val as any);
                    }}
                    value={selectedOpportunityOptions}
                    placeholder="Select an opportunity"
                    noOptionsMessage={() =>
                      !watchOrganisations?.length
                        ? "Select an organisation to load available opportunities"
                        : "No opportunities found."
                    }
                  />
                )}
              />
              {formState.errors.opportunities && (
                <label className="label font-bold">
                  <span className="label-text-alt italic text-red-500">
                    {formState.errors.opportunities.message as string}
                  </span>
                </label>
              )}
            </div>

            <div className="md: mx-auto mt-12 flex h-full w-full items-start justify-center text-center text-xs font-bold text-gray-dark">
              OR
            </div>

            {/* Categories Select Dropdown */}
            <div className="form-control w-full gap-1">
              <label className="label">
                <span className="label-text flex font-semibold">
                  <span className="flex gap-2">
                    <span>🏷️</span>
                    <span>Category</span>
                  </span>
                </span>
              </label>

              <Controller
                name="categories"
                control={form.control}
                render={({ field: { onChange, value } }) => (
                  <Async
                    instanceId="categories"
                    classNames={{
                      control: () =>
                        "input input-xs h-fit !border-none w-full md:w-72",
                    }}
                    isMulti
                    defaultOptions={defaultCategories}
                    cacheOptions={false}
                    loadOptions={(inputValue, callback) => {
                      const filtered = defaultCategories.filter((option) =>
                        option.label
                          .toLowerCase()
                          .includes(inputValue.toLowerCase()),
                      );
                      callback(filtered);
                    }}
                    menuPortalTarget={htmlRef}
                    styles={{
                      menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                    }}
                    onChange={(val) => {
                      // clear opportunities when category changes
                      setValue("opportunities", []);
                      setSelectedOpportunityOptions([]);

                      onChange(val?.map((c: any) => c.value));
                    }}
                    value={
                      value?.map((c: any) => {
                        const found = defaultCategories.find(
                          (item) => item.value === c,
                        );
                        return {
                          value: c,
                          label: found ? found.label : c,
                        };
                      }) || []
                    }
                    placeholder="Select a category"
                    noOptionsMessage={() =>
                      !watchOrganisations?.length
                        ? "Select an organisation to load available categories"
                        : "No categories found."
                    }
                  />
                )}
              />
              {formState.errors.categories && (
                <label className="label font-bold">
                  <span className="label-text-alt italic text-red-500">
                    {formState.errors.categories.message as string}
                  </span>
                </label>
              )}
            </div>
          </div>
        </div>

        {/* Action buttons */}
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
