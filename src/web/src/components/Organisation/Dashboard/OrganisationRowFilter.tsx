import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect } from "react";
import { type FieldValues, Controller, useForm } from "react-hook-form";
import zod from "zod";
import type {
  OpportunityCategory,
  OpportunitySearchResults,
} from "~/api/models/opportunity";
import type { Country, Gender, SelectOption } from "~/api/models/lookups";
import Select, { components, type ValueContainerProps } from "react-select";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { toISOStringForTimezone } from "~/lib/utils";
import {
  OrganisationDashboardFilterOptions,
  type OrganizationSearchFilterQueryTerm,
} from "~/api/models/organizationDashboard";

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

export const OrganisationRowFilter: React.FC<{
  htmlRef: HTMLDivElement;
  searchFilter: OrganizationSearchFilterQueryTerm | null;
  lookups_categories?: OpportunityCategory[];
  lookups_opportunities?: OpportunitySearchResults;
  lookups_ageRanges?: Gender[]; //TODO:
  lookups_genders?: Gender[];
  lookups_countries?: Country[];
  onSubmit?: (fieldValues: OrganizationSearchFilterQueryTerm) => void;
  onClear?: () => void;
  onOpenFilterFullWindow?: () => void;
  clearButtonText?: string;
  filterOptions: OrganisationDashboardFilterOptions[];
  totalCount?: number;
  exportToCsv?: (arg0: boolean) => void;
}> = ({
  htmlRef,
  searchFilter,
  lookups_categories,
  lookups_opportunities,
  lookups_ageRanges,
  lookups_genders,
  lookups_countries,
  onSubmit,
  onClear,
  onOpenFilterFullWindow,
  clearButtonText = "Clear",
  filterOptions,
  totalCount,
  exportToCsv,
}) => {
  const schema = zod.object({
    organization: zod.string().optional().nullable(),
    opportunities: zod.array(zod.string()).optional().nullable(),
    categories: zod.array(zod.string()).optional().nullable(),
    startDate: zod.string().optional().nullable(),
    endDate: zod.string().optional().nullable(),

    //
    ageRanges: zod.array(zod.string()).optional().nullable(),
    genders: zod.array(zod.string()).optional().nullable(),
    countries: zod.array(zod.string()).optional().nullable(),
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
      if (onSubmit) onSubmit(data as OrganizationSearchFilterQueryTerm);
    },
    [onSubmit],
  );

  // const onClickCategoryFilter = useCallback(
  //   (cat: OpportunityCategory) => {
  //     if (!searchFilter || !onSubmit) return;

  //     const prev = { ...searchFilter };
  //     prev.categories = prev.categories ?? [];

  //     if (prev.categories.includes(cat.name)) {
  //       prev.categories = prev.categories.filter((x) => x !== cat.name);
  //     } else {
  //       prev.categories.push(cat.name);
  //     }

  //     onSubmit(prev);
  //   },
  //   [searchFilter, onSubmit],
  // );

  // // Function to handle removing an item from an array in the filter object
  // const removeFromArray = useCallback(
  //   (key: keyof OrganizationSearchFilterBase, item: string) => {
  //     if (!searchFilter || !onSubmit) return;
  //     if (searchFilter) {
  //       const updatedFilter: any = {
  //         ...searchFilter,
  //       };
  //       updatedFilter[key] = updatedFilter[key]?.filter(
  //         (val: any) => val !== item,
  //       );
  //       onSubmit(updatedFilter);
  //     }
  //   },
  //   [searchFilter, onSubmit],
  // );

  // // Function to handle removing a value from the filter object
  // const removeValue = useCallback(
  //   (key: keyof OrganizationSearchFilterQueryTerm) => {
  //     if (!searchFilter || !onSubmit) return;
  //     if (searchFilter) {
  //       const updatedFilter = { ...searchFilter };
  //       updatedFilter[key] = null;
  //       onSubmit(updatedFilter);
  //     }
  //   },
  //   [searchFilter, onSubmit],
  // );

  // const onSearchBadgesSubmit = useCallback(
  //   (filter: any) => {
  //     if (onSubmit) onSubmit(filter);
  //   },
  //   [onSubmit],
  // );

  const resultText = totalCount === 1 ? "result" : "results";
  const countText = `${totalCount?.toLocaleString()} ${resultText} for:`;

  return (
    <div className="flex flex-grow flex-col">
      {lookups_categories &&
        lookups_categories.length > 0 &&
        (filterOptions?.includes(
          OrganisationDashboardFilterOptions.CATEGORIES,
        ) ||
          filterOptions?.includes(
            OrganisationDashboardFilterOptions.VIEWALLFILTERSBUTTON,
          )) && (
          <div className="flex-col items-center justify-center gap-2 pb-8">
            <div className="flex justify-center gap-2">
              {/* CATEGORIES */}
              {/* {filterOptions?.includes(OrganisationDashboardFilterOptions.CATEGORIES) && (
                <div className="flex justify-center gap-4 overflow-hidden md:w-full">
                  {lookups_categories.map((item) => (
                    <OpportunityCategoryHorizontalCard
                      key={item.id}
                      data={item}
                      selected={searchFilter?.categories?.includes(item.name)}
                      onClick={onClickCategoryFilter}
                    />
                  ))}
                </div>
              )} */}

              {/* VIEW ALL FILTERS BUTTON */}
              {/* {filterOptions?.includes(
                OrganisationDashboardFilterOptions.VIEWALLFILTERSBUTTON,
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
          filter !== OrganisationDashboardFilterOptions.CATEGORIES &&
          filter !== OrganisationDashboardFilterOptions.VIEWALLFILTERSBUTTON,
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

            <div className="flex justify-between gap-2">
              <div className="flex flex-wrap justify-start gap-2">
                {/* VALUECONTAINS: hidden input */}
                {/* <input
                  type="hidden"
                  {...form.register("valueContains")}
                  value={searchFilter?.valueContains ?? ""}
                /> */}
                {/* CATEGORIES */}
                {filterOptions?.includes(
                  OrganisationDashboardFilterOptions.CATEGORIES,
                ) &&
                  lookups_categories && (
                    <>
                      <Controller
                        name="categories"
                        control={form.control}
                        defaultValue={searchFilter?.categories}
                        render={({ field: { onChange, value } }) => (
                          <Select
                            instanceId="categories"
                            classNames={{
                              control: () =>
                                "input input-xs h-fit !border-gray",
                            }}
                            isMulti={true}
                            options={lookups_categories.map((c) => ({
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
                            value={lookups_categories
                              .filter((c) => value?.includes(c.name))
                              .map((c) => ({ value: c.name, label: c.name }))}
                            placeholder="Category"
                            components={{
                              ValueContainer,
                            }}
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
                    </>
                  )}

                {/* OPPORTUNITIES */}
                {filterOptions?.includes(
                  OrganisationDashboardFilterOptions.OPPORTUNITIES,
                ) &&
                  lookups_opportunities && (
                    <>
                      <Controller
                        name="opportunities"
                        control={form.control}
                        defaultValue={searchFilter?.opportunities}
                        render={({ field: { onChange, value } }) => (
                          <Select
                            instanceId="opportunities"
                            classNames={{
                              control: () =>
                                "input input-xs h-fit !border-gray",
                            }}
                            isMulti={true}
                            options={lookups_opportunities?.items.map((c) => ({
                              value: c.title,
                              label: c.title,
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
                            value={lookups_opportunities?.items
                              .filter((c) => value?.includes(c.title))
                              .map((c) => ({ value: c.title, label: c.title }))}
                            placeholder="Opportunity"
                            components={{
                              ValueContainer,
                            }}
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
                    </>
                  )}
                {/* DATE START */}
                {filterOptions?.includes(
                  OrganisationDashboardFilterOptions.DATE_START,
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
                {filterOptions?.includes(
                  OrganisationDashboardFilterOptions.DATE_END,
                ) && (
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

                {/* AGE RANGES */}
                {filterOptions?.includes(
                  OrganisationDashboardFilterOptions.AGES,
                ) &&
                  lookups_ageRanges && (
                    <>
                      <Controller
                        name="ageRanges"
                        control={form.control}
                        defaultValue={searchFilter?.ageRanges}
                        render={({ field: { onChange, value } }) => (
                          <Select
                            instanceId="ageRanges"
                            classNames={{
                              control: () =>
                                "input input-xs h-fit !border-gray",
                            }}
                            isMulti={true}
                            options={lookups_ageRanges.map((c) => ({
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
                            value={lookups_ageRanges
                              .filter((c) => value?.includes(c.name))
                              .map((c) => ({ value: c.name, label: c.name }))}
                            placeholder="Age"
                            components={{
                              ValueContainer,
                            }}
                          />
                        )}
                      />
                      {formState.errors.ageRanges && (
                        <label className="label font-bold">
                          <span className="label-text-alt italic text-red-500">
                            {`${formState.errors.ageRanges.message}`}
                          </span>
                        </label>
                      )}
                    </>
                  )}

                {/* GENDERS */}
                {filterOptions?.includes(
                  OrganisationDashboardFilterOptions.GENDERS,
                ) &&
                  lookups_genders && (
                    <>
                      <Controller
                        name="genders"
                        control={form.control}
                        defaultValue={searchFilter?.genders}
                        render={({ field: { onChange, value } }) => (
                          <Select
                            instanceId="genders"
                            classNames={{
                              control: () =>
                                "input input-xs h-fit !border-gray",
                            }}
                            isMulti={true}
                            options={lookups_genders.map((c) => ({
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
                            value={lookups_genders
                              .filter((c) => value?.includes(c.name))
                              .map((c) => ({ value: c.name, label: c.name }))}
                            placeholder="Gender"
                            components={{
                              ValueContainer,
                            }}
                          />
                        )}
                      />
                      {formState.errors.genders && (
                        <label className="label font-bold">
                          <span className="label-text-alt italic text-red-500">
                            {`${formState.errors.genders.message}`}
                          </span>
                        </label>
                      )}
                    </>
                  )}

                {/* COUNTRIES */}
                {filterOptions?.includes(
                  OrganisationDashboardFilterOptions.COUNTRIES,
                ) &&
                  lookups_countries && (
                    <>
                      <Controller
                        name="countries"
                        control={form.control}
                        defaultValue={searchFilter?.countries}
                        render={({ field: { onChange, value } }) => (
                          <Select
                            instanceId="countries"
                            classNames={{
                              control: () =>
                                "input input-xs h-fit !border-gray",
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
                  OrganisationDashboardFilterOptions.VIEWALLFILTERSBUTTON,
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
        </div>
      </div>
    </div>
  );
};
