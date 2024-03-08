import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect, useState } from "react";
import { type FieldValues, Controller, useForm } from "react-hook-form";
import zod from "zod";
import type { OpportunityCategory } from "~/api/models/opportunity";
import type { SelectOption } from "~/api/models/lookups";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { toISOStringForTimezone } from "~/lib/utils";
import type { OrganizationSearchFilterBase } from "~/api/models/organizationDashboard";
import { IoMdDownload } from "react-icons/io";
import { searchCriteriaOpportunities } from "~/api/services/opportunities";
import Select, { components, type ValueContainerProps } from "react-select";
import Async from "react-select/async";
import { PAGE_SIZE_MEDIUM } from "~/lib/constants";

const ValueContainer = ({
  children,
  ...props
}: ValueContainerProps<SelectOption>) => {
  // eslint-disable-next-line prefer-const
  let [values, input] = children as any[];
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
      };

      const pluralize = (word: string, count: number): string => {
        if (count === 1) return word;
        return pluralMapping[word] ?? `${word}s`;
      };

      const placeholder: string = values[0].props.selectProps.placeholder;
      values = `${values.length} ${pluralize(placeholder, values.length)}`;
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
  organisationId: string;
  htmlRef: HTMLDivElement;
  searchFilter: OrganizationSearchFilterBase | null;
  lookups_categories?: OpportunityCategory[];
  onSubmit?: (fieldValues: OrganizationSearchFilterBase) => void;
  onOpenFilterFullWindow?: () => void;
  exportToCsv?: (arg0: boolean) => void;
}> = ({
  organisationId,
  htmlRef,
  searchFilter,
  lookups_categories,

  onSubmit,
  exportToCsv,
}) => {
  const schema = zod.object({
    organization: zod.string().optional().nullable(),
    opportunities: zod.array(zod.string()).optional().nullable(),
    categories: zod.array(zod.string()).optional().nullable(),
    startDate: zod.string().optional().nullable(),
    endDate: zod.string().optional().nullable(),
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
      if (onSubmit) onSubmit(data as OrganizationSearchFilterBase);
    },
    [onSubmit],
  );

  const loadOpportunities = useCallback(
    (inputValue: string, callback: (options: any) => void) => {
      setTimeout(() => {
        searchCriteriaOpportunities({
          organization: organisationId,
          titleContains: (inputValue ?? []).length > 2 ? inputValue : null,
          pageNumber: 1,
          pageSize: PAGE_SIZE_MEDIUM,
        }).then((data) => {
          const options = data.items.map((item) => ({
            value: item.id,
            label: item.title,
          }));
          callback(options);
        });
      }, 1000);
    },
    [organisationId],
  );

  // the AsyncSelect component requires the defaultOptions to be set in the state
  const [defaultOpportunityOptions, setdefaultOpportunityOptions] =
    useState<any>([]);

  useEffect(() => {
    if (searchFilter?.opportunities) {
      setdefaultOpportunityOptions(
        searchFilter?.opportunities?.map((c: any) => ({
          value: c,
          label: c,
        })),
      );
    }
  }, [setdefaultOpportunityOptions, searchFilter?.opportunities]);

  return (
    <div className="flex flex-grow flex-col">
      <form
        onSubmit={handleSubmit(onSubmitHandler)} // eslint-disable-line @typescript-eslint/no-misused-promises
        className="flex flex-col gap-2"
      >
        <div className="flex flex-grow flex-row items-center gap-2">
          <div className="mr-4 text-sm font-bold text-white">Filter by:</div>

          <div className="flex flex-grow flex-row gap-2">
            {/* OPPORTUNITIES */}
            <>
              <Controller
                name="opportunities"
                control={form.control}
                render={({ field: { onChange } }) => (
                  <Async
                    instanceId="opportunities"
                    classNames={{
                      control: () => "input input-xs h-fit !border-gray",
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

                      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
                      onChange(val.map((c: any) => c.value));
                      void handleSubmit(onSubmitHandler)();
                    }}
                    value={defaultOpportunityOptions}
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

            <div className="flex items-center text-xs text-white">OR</div>

            {/* CATEGORIES */}
            {lookups_categories && (
              <>
                <Controller
                  name="categories"
                  control={form.control}
                  defaultValue={searchFilter?.categories}
                  render={({ field: { onChange, value } }) => (
                    <Select
                      instanceId="categories"
                      classNames={{
                        control: () => "input input-xs h-fit !border-gray",
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
                        // clear opportunities
                        setValue("opportunities", []);

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
          </div>

          <div className="flex justify-end gap-2">
            {/* DATE START */}
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

            {/* DATE END */}
            <>
              <Controller
                control={form.control}
                name="endDate"
                render={({ field: { onChange, value } }) => (
                  <DatePicker
                    className="input input-bordered input-sm w-32 rounded border-gray !py-[1.13rem] !text-xs placeholder:text-xs placeholder:text-[#828181] focus:border-gray focus:outline-none"
                    onChange={(date) => {
                      // change time to 1 second to midnight
                      if (date) date.setHours(23, 59, 59, 999);
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

            {/* EXPORT TO CSV */}
            {exportToCsv && (
              <div className="flex flex-row items-center justify-end">
                <IoMdDownload className="cursor-pointer text-white" />
                {/* <button
                  type="button"
                  className="btn btn-sm h-[2.4rem] rounded-md border-2 border-green text-xs font-semibold text-green"
                  onClick={() => exportToCsv(true)}
                >
                  Export to CSV
                </button> */}
              </div>
            )}
          </div>
        </div>
      </form>
    </div>
  );
};
