import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect, useState } from "react";
import { Controller, useForm, type FieldValues } from "react-hook-form";
import Select, { components, type ValueContainerProps } from "react-select";
import Async from "react-select/async";
import zod from "zod";
import type { SelectOption } from "~/api/models/lookups";
import type {
  OpportunityCategory,
  OpportunitySearchResultsInfo,
} from "~/api/models/opportunity";
import type { OrganizationSearchResults } from "~/api/models/organisation";
import { searchCriteriaOpportunities } from "~/api/services/opportunities";
import { getOrganisations } from "~/api/services/organisations";
import FilterBadges from "~/components/FilterBadges";
import { PAGE_SIZE_MEDIUM, ROLE_ADMIN } from "~/lib/constants";
import {
  debounce,
  dateInputToUTC,
  dateInputToUTCEndOfDay,
  utcToDateInput,
} from "~/lib/utils";
import type { OrganizationSearchFilterSummaryViewModel } from "~/pages/organisations/dashboard";
import type { User } from "~/server/auth";

const ValueContainer = ({
  children,
  ...props
}: ValueContainerProps<SelectOption>) => {
  const [values, input] = children as any[];
  let displayValues = values;

  if (Array.isArray(values)) {
    if (
      values.length > 0 &&
      "props" in values[0] &&
      "selectProps" in values[0].props &&
      values[0].props.selectProps.placeholder
    ) {
      const pluralMapping: Record<string, string> = {
        Category: "Categories",
        Opportunity: "Opportunities",
        Organization: "Organisations",
      };

      const pluralize = (word: string, count: number): string => {
        if (count === 1) return word;
        return pluralMapping[word] ?? `${word}s`;
      };

      const placeholder: string = values[0].props.selectProps.placeholder;
      displayValues = `${values.length} ${pluralize(placeholder, values.length)}`;
    }
  }
  return (
    <components.ValueContainer {...props}>
      {displayValues}
      {input}
    </components.ValueContainer>
  );
};

export const DashboardFilterHorizontal: React.FC<{
  htmlRef: HTMLDivElement;
  searchFilter: OrganizationSearchFilterSummaryViewModel | null;
  lookups_categories?: OpportunityCategory[];
  lookups_selectedOpportunities?: OpportunitySearchResultsInfo;
  lookups_selectedOrganisations?: OrganizationSearchResults;
  user: User;
  onSubmit?: (fieldValues: OrganizationSearchFilterSummaryViewModel) => void;
}> = ({
  htmlRef,
  searchFilter,
  lookups_categories,
  lookups_selectedOpportunities,
  lookups_selectedOrganisations,
  user,
  onSubmit,
}) => {
  const isAdmin = user?.roles.includes(ROLE_ADMIN);

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
  const { handleSubmit, formState, reset, setValue } = form;

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
      if (onSubmit) {
        const mergedData = {
          ...searchFilter, // Keep existing filter values
          // don't clear organisations if orgAdmin
          ...(isAdmin ? { organizations: data.organizations } : {}),
          opportunities: data.opportunities,
          categories: data.categories,
          startDate: data.startDate,
          endDate: data.endDate,
        };
        onSubmit(mergedData as OrganizationSearchFilterSummaryViewModel);
      }
    },
    [onSubmit, searchFilter, isAdmin],
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
    if (searchFilter?.organizations) {
      setDefaultOrganisationOptions(
        searchFilter?.organizations?.map((c: any) => ({
          value: c,
          label: c,
        })),
      );
    }
  }, [setDefaultOrganisationOptions, searchFilter?.organizations]);

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
    if (searchFilter?.opportunities) {
      setDefaultOpportunityOptions(
        searchFilter?.opportunities?.map((c: any) => ({
          value: c,
          label: c,
        })),
      );
    }
  }, [setDefaultOpportunityOptions, searchFilter?.opportunities]);

  return (
    <div className="flex grow flex-col gap-3">
      <form
        onSubmit={handleSubmit(onSubmitHandler)}
        className="flex flex-col gap-2"
      >
        <div className="md:flex-rowx items-centerx justify-centerx md:justify-startx flex w-full flex-col gap-2">
          <div className="items-centerx flex w-full grow flex-col flex-wrap gap-2 md:w-fit md:flex-row">
            {/* ORGANISATIONS */}
            {isAdmin && (
              <span className="w-full md:w-72">
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
                      placeholder="Organisation"
                      components={{
                        ValueContainer: ValueContainer as any,
                      }}
                    />
                  )}
                />
                {formState.errors.organizations && (
                  <label className="label font-bold">
                    <span className="label-text-alt text-red-500 italic">
                      {`${formState.errors.organizations.message}`}
                    </span>
                  </label>
                )}
              </span>
            )}

            <div className="flex w-full items-start gap-2 md:w-fit">
              {/* DATE START */}
              <span className="flex">
                <Controller
                  control={form.control}
                  name="startDate"
                  render={({ field: { onChange, value } }) => (
                    <input
                      type="date"
                      className="input focus:border-gray h-10 w-full rounded border-none !text-xs placeholder:text-xs placeholder:text-[#828181] focus:outline-none md:w-32"
                      onBlur={(e) => {
                        // Only validate and convert when user finishes editing
                        if (e.target.value) {
                          onChange(dateInputToUTC(e.target.value));
                        } else {
                          onChange("");
                        }
                        void handleSubmit(onSubmitHandler)();
                      }}
                      defaultValue={utcToDateInput(value || "")}
                    />
                  )}
                />

                {formState.errors.startDate && (
                  <label className="label">
                    <span className="label-text-alt px-4 text-base text-red-500 italic">
                      {`${formState.errors.startDate.message}`}
                    </span>
                  </label>
                )}
              </span>

              {/* DATE END */}
              <span className="flex">
                <Controller
                  control={form.control}
                  name="endDate"
                  render={({ field: { onChange, value } }) => (
                    <input
                      type="date"
                      className="input focus:border-gray h-10 w-full rounded border-none !text-xs placeholder:text-xs placeholder:text-[#828181] focus:outline-none md:w-32"
                      onBlur={(e) => {
                        // Only validate and convert when user finishes editing
                        if (e.target.value) {
                          onChange(dateInputToUTCEndOfDay(e.target.value));
                        } else {
                          onChange("");
                        }
                        void handleSubmit(onSubmitHandler)();
                      }}
                      defaultValue={utcToDateInput(value || "")}
                    />
                  )}
                />

                {formState.errors.endDate && (
                  <label className="label">
                    <span className="label-text-alt px-4 text-base text-red-500 italic">
                      {`${formState.errors.endDate.message}`}
                    </span>
                  </label>
                )}
              </span>
            </div>
          </div>

          <div className="flex flex-row gap-2">
            {/* OPPORTUNITIES */}
            <span className="w-full md:w-72">
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
                    components={{
                      ValueContainer: ValueContainer as any,
                    }}
                  />
                )}
              />
              {formState.errors.opportunities && (
                <label className="label font-bold">
                  <span className="label-text-alt text-red-500 italic">
                    {`${formState.errors.opportunities.message}`}
                  </span>
                </label>
              )}
            </span>

            <div className="text-gray mx-auto flex items-center text-center text-xs font-bold md:mx-1 md:text-left">
              or
            </div>

            {/* CATEGORIES */}
            <span className="w-full md:w-72">
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
                    components={{
                      ValueContainer: ValueContainer as any,
                    }}
                  />
                )}
              />

              {formState.errors.categories && (
                <label className="label font-bold">
                  <span className="label-text-alt text-red-500 italic">
                    {`${formState.errors.categories.message}`}
                  </span>
                </label>
              )}
            </span>
          </div>
        </div>
      </form>

      {/* FILTER BADGES */}
      <div className="h-10">
        <FilterBadges
          searchFilter={searchFilter}
          excludeKeys={[
            "pageSelectedOpportunities",
            "pageCompletedYouth",
            "pageSize",
            "organization",
            "countries",
            ...(isAdmin ? [] : ["organizations"]), // Exclude organizations if not admin
          ]}
          resolveValue={(key, value) => {
            if (key === "startDate" || key === "endDate")
              return value ? utcToDateInput(value) : "";
            else if (key === "opportunities") {
              // HACK: resolve opportunity ids to titles
              const lookup = lookups_selectedOpportunities?.items.find(
                (x) => x.id === value,
              );
              return lookup?.title ?? value;
            } else if (key === "organizations") {
              // HACK: resolve organisation ids to titles
              const lookup = lookups_selectedOrganisations?.items.find(
                (x) => x.id === value,
              );
              return lookup?.name ?? value;
            } else {
              return value;
            }
          }}
          onSubmit={(e) => onSubmitHandler(e)}
        />
      </div>
    </div>
  );
};
