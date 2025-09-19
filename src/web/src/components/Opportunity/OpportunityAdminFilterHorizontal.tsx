import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect } from "react";
import { Controller, useForm, type FieldValues } from "react-hook-form";
import Select, { components, type ValueContainerProps } from "react-select";
import zod from "zod";
import type { Country, Language, SelectOption } from "~/api/models/lookups";
import type {
  OpportunityCategory,
  OpportunitySearchFilterAdmin,
  OpportunityType,
} from "~/api/models/opportunity";
import { OpportunityFilterOptions } from "~/api/models/opportunity";
import type { OrganizationInfo } from "~/api/models/organisation";
import { dateInputToUTC, utcToDateInput } from "~/lib/utils";
import OpportunityCategoriesHorizontalFilter from "./OpportunityCategoriesHorizontalFilter";
import { FaDownload } from "react-icons/fa";

const ValueContainer = ({
  children,
  ...props
}: ValueContainerProps<SelectOption>) => {
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

export const OpportunityAdminFilterHorizontal: React.FC<{
  htmlRef: HTMLDivElement;
  searchFilter: OpportunitySearchFilterAdmin | null;
  lookups_categories: OpportunityCategory[];
  lookups_countries: Country[];
  lookups_languages: Language[];
  lookups_types: OpportunityType[];
  lookups_organisations: OrganizationInfo[];
  lookups_publishedStates: SelectOption[];
  lookups_statuses: SelectOption[];
  onSubmit?: (fieldValues: OpportunitySearchFilterAdmin) => void;
  onClear?: () => void;
  onOpenFilterFullWindow?: () => void;
  clearButtonText?: string;
  filterOptions: OpportunityFilterOptions[];
  totalCount?: number;
  exportToCsv?: (arg0: boolean) => void;
}> = ({
  htmlRef,
  searchFilter,
  lookups_categories,
  lookups_countries,
  lookups_languages,
  lookups_types,
  lookups_organisations,
  lookups_publishedStates,
  lookups_statuses,
  onSubmit,
  onClear,
  onOpenFilterFullWindow,
  clearButtonText,
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
    if (searchFilter == null || searchFilter == undefined) return;

    // reset form
    // setTimeout is needed to prevent the form from being reset before the default values are set
    setTimeout(() => {
      reset({
        ...(searchFilter as any),
      });
    }, 100);
  }, [reset, searchFilter]);

  // form submission handler
  const onSubmitHandler = useCallback(
    (data: FieldValues) => {
      if (onSubmit) onSubmit(data as OpportunitySearchFilterAdmin);
    },
    [onSubmit],
  );

  const onClickCategoryFilter = useCallback(
    (cat: OpportunityCategory) => {
      if (!searchFilter || !onSubmit) return;

      const prev = { ...searchFilter };
      prev.categories = prev.categories ?? [];

      if (prev.categories.includes(cat.name)) {
        prev.categories = prev.categories.filter((x) => x !== cat.name);
      } else {
        prev.categories.push(cat.name);
      }

      onSubmit(prev);
    },
    [searchFilter, onSubmit],
  );

  const resultText = totalCount === 1 ? "result" : "results";
  const countText = `${totalCount?.toLocaleString()} ${resultText}`;

  return (
    <div className="flex grow flex-col">
      {lookups_categories &&
        lookups_categories.length > 0 &&
        (filterOptions?.includes(OpportunityFilterOptions.CATEGORIES) ||
          filterOptions?.includes(
            OpportunityFilterOptions.VIEWALLFILTERSBUTTON,
          )) && (
          <>
            {/* CATEGORIES */}
            {filterOptions?.includes(OpportunityFilterOptions.CATEGORIES) && (
              <OpportunityCategoriesHorizontalFilter
                lookups_categories={lookups_categories}
                selected_categories={searchFilter?.categories}
                onClick={onClickCategoryFilter}
              />
            )}
          </>
        )}

      {filterOptions?.some(
        (filter) =>
          filter !== OpportunityFilterOptions.CATEGORIES &&
          filter !== OpportunityFilterOptions.VIEWALLFILTERSBUTTON,
      ) && (
        <form
          onSubmit={handleSubmit(onSubmitHandler)}
          className="hidden flex-col gap-2 md:flex"
        >
          <div className="flex flex-col gap-2">
            <div className="text-gray-dark mr-4 flex text-sm font-bold">
              Filter by:
            </div>

            <div className="flex flex-wrap justify-between">
              <div className="flex flex-wrap justify-start gap-2">
                {/* VALUECONTAINS: hidden input */}
                <input
                  type="hidden"
                  {...form.register("valueContains")}
                  value={searchFilter?.valueContains ?? ""}
                />

                {/* TYPES */}
                {filterOptions?.includes(OpportunityFilterOptions.TYPES) && (
                  <>
                    <Controller
                      name="types"
                      control={form.control}
                      defaultValue={searchFilter?.types}
                      render={({ field: { onChange, value } }) => (
                        <Select
                          instanceId="types"
                          classNames={{
                            control: () => "input input-xs h-fit !border-none",
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
                        <span className="label-text-alt text-red-500 italic">
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
                      defaultValue={searchFilter?.countries}
                      render={({ field: { onChange, value } }) => (
                        <Select
                          instanceId="countries"
                          classNames={{
                            control: () => "input input-xs h-fit !border-none",
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
                        <span className="label-text-alt text-red-500 italic">
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
                      defaultValue={searchFilter?.languages}
                      render={({ field: { onChange, value } }) => (
                        <Select
                          instanceId="languages"
                          classNames={{
                            control: () => "input input-xs h-fit !border-none",
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
                        <span className="label-text-alt text-red-500 italic">
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
                      defaultValue={searchFilter?.organizations}
                      render={({ field: { onChange, value } }) => (
                        <Select
                          instanceId="organizations"
                          classNames={{
                            control: () => "input input-xs h-fit !border-none",
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
                          placeholder="Organisation"
                          components={{
                            ValueContainer,
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
                            control: () => "input input-xs h-fit !border-none",
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
                          value={lookups_publishedStates.filter((c) =>
                            value?.includes(c.label),
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
                        <span className="label-text-alt text-red-500 italic">
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
                            control: () => "input input-xs h-fit !border-none",
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
                          value={lookups_statuses.filter((c) =>
                            value?.includes(c.label),
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
                        <span className="label-text-alt text-red-500 italic">
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
                        <input
                          type="date"
                          className="input input-sm border-gray focus:border-gray w-32 rounded !py-[1.13rem] !text-xs placeholder:text-xs placeholder:text-[#828181] focus:outline-none"
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
                  </>
                )}

                {/* DATE END */}
                {filterOptions?.includes(OpportunityFilterOptions.DATE_END) && (
                  <>
                    <Controller
                      control={form.control}
                      name="endDate"
                      render={({ field: { onChange, value } }) => (
                        <input
                          type="date"
                          className="input input-sm border-gray focus:border-gray w-32 rounded !py-[1.13rem] !text-xs placeholder:text-xs placeholder:text-[#828181] focus:outline-none"
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

                    {formState.errors.endDate && (
                      <label className="label">
                        <span className="label-text-alt px-4 text-base text-red-500 italic">
                          {`${formState.errors.endDate.message}`}
                        </span>
                      </label>
                    )}
                  </>
                )}
              </div>

              {/* BUTTONS */}
              <div className="mt-1 mb-auto flex gap-2">
                <button
                  type="button"
                  className="btn btn-sm border-green text-green my-auto border-2 px-6 text-xs font-semibold"
                  onClick={onClear}
                >
                  {clearButtonText}
                </button>

                {filterOptions?.includes(
                  OpportunityFilterOptions.VIEWALLFILTERSBUTTON,
                ) && (
                  <button
                    type="button"
                    className="btn btn-sm border-green text-green my-auto border-2 text-xs font-semibold"
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
        <div className="mt-4 flex h-fit flex-col md:mt-6">
          <div className="flex items-center justify-between">
            {/* COUNT RESULT TEXT */}
            <div className="h-10 text-xl font-semibold whitespace-nowrap text-black">
              {countText && totalCount && totalCount > 0 ? (
                <span>{countText}</span>
              ) : null}
            </div>

            {/* EXPORT TO CSV */}
            {exportToCsv && (
              <div className="flex flex-row items-center justify-end">
                <button
                  type="button"
                  onClick={() => exportToCsv(true)}
                  className="btn btn-sm border-blue text-blue hover:bg-blue w-36 flex-nowrap bg-white hover:text-white"
                >
                  <FaDownload className="h-4 w-4" /> Export
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
