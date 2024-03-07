import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect } from "react";
import { type FieldValues, Controller, useForm } from "react-hook-form";
import zod from "zod";
import type { OpportunityCategory } from "~/api/models/opportunity";
import type { SelectOption } from "~/api/models/lookups";
import Select, { components, type ValueContainerProps } from "react-select";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { toISOStringForTimezone } from "~/lib/utils";
import type { OrganizationSearchFilterBase } from "~/api/models/organizationDashboard";
import { IoMdDownload } from "react-icons/io";

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
  searchFilter: OrganizationSearchFilterBase | null;
  lookups_categories?: OpportunityCategory[];
  //lookups_opportunities?: OpportunitySearchResults;

  onSubmit?: (fieldValues: OrganizationSearchFilterBase) => void;
  //onClear?: () => void;
  onOpenFilterFullWindow?: () => void;
  //clearButtonText?: string;

  //totalCount?: number;
  exportToCsv?: (arg0: boolean) => void;
}> = ({
  htmlRef,
  searchFilter,
  lookups_categories,
  //lookups_opportunities,

  onSubmit,
  //onClear,
  //clearButtonText = "Clear",

  //totalCount,
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
            {/* TODO: this has been removed till the on-demand dropdown is developed */}
            {/* {lookups_opportunities && (
              <>
                <Controller
                  name="opportunities"
                  control={form.control}
                  defaultValue={searchFilter?.opportunities}
                  render={({ field: { onChange, value } }) => (
                    <Select
                      instanceId="opportunities"
                      classNames={{
                        control: () => "input input-xs h-fit !border-gray",
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
                        // clear categories
                        setValue("categories", []);

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

            <div className="flex items-center text-xs text-white">OR</div> */}

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
