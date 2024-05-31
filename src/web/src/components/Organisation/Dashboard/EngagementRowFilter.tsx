import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect } from "react";
import { type FieldValues, Controller, useForm } from "react-hook-form";
import zod from "zod";
import type { Country, SelectOption } from "~/api/models/lookups";
import "react-datepicker/dist/react-datepicker.css";
import type { OrganizationSearchFilterBase } from "~/api/models/organizationDashboard";
import Select, { components, type ValueContainerProps } from "react-select";
import { OrganizationSearchFilterSummaryViewModel } from "~/pages/organisations/[id]";
import FilterBadges from "~/components/FilterBadges";

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
        Country: "Countries",
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

export const EngagementRowFilter: React.FC<{
  htmlRef: HTMLDivElement;
  searchFilter: OrganizationSearchFilterBase | null;
  lookups_countries?: Country[];
  onSubmit?: (fieldValues: OrganizationSearchFilterSummaryViewModel) => void;
}> = ({ htmlRef, searchFilter, lookups_countries, onSubmit }) => {
  const schema = zod.object({
    organization: zod.string().optional().nullable(),
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
      if (onSubmit) onSubmit(data as OrganizationSearchFilterSummaryViewModel);
    },
    [onSubmit],
  );

  return (
    <div className="flex flex-grow flex-col gap-3">
      <form
        onSubmit={handleSubmit(onSubmitHandler)} // eslint-disable-line @typescript-eslint/no-misused-promises
        className="flex flex-col gap-2"
      >
        <div className="flex w-full flex-col items-center justify-center gap-2 md:justify-start lg:flex-row">
          <div className="flex w-full flex-grow flex-col flex-wrap items-center gap-2 md:w-fit lg:flex-row">
            <div className="mr-4 flex text-sm font-bold text-gray-dark">
              Filter by:
            </div>

            {/* COUNTRIES */}
            {lookups_countries && (
              <span className="w-full md:w-72">
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
              </span>
            )}
          </div>
        </div>
      </form>

      {/* FILTER BADGES */}
      <FilterBadges
        searchFilter={searchFilter}
        excludeKeys={[
          "pageSelectedOpportunities",
          "pageCompletedYouth",
          "pageSize",
          "organization",
          "opportunities",
          "categories",
          "startDate",
          "endDate",
        ]}
        resolveValue={(key, value) => {
          return value;
        }}
        onSubmit={(e) => onSubmitHandler(e)}
      />
    </div>
  );
};
