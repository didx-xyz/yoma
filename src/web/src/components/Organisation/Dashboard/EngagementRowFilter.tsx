import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect } from "react";
import { type FieldValues, Controller, useForm } from "react-hook-form";
import zod from "zod";
import type { Country, SelectOption } from "~/api/models/lookups";
import "react-datepicker/dist/react-datepicker.css";
import Select, { components, type ValueContainerProps } from "react-select";
import FilterBadges from "~/components/FilterBadges";
import type { OrganizationSearchFilterSummaryViewModel } from "~/pages/organisations/dashboard";

const ValueContainer = ({
  children,
  ...props
}: ValueContainerProps<SelectOption>) => {
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
  searchFilter: OrganizationSearchFilterSummaryViewModel | null;
  lookups_countries?: Country[];
  onSubmit?: (fieldValues: OrganizationSearchFilterSummaryViewModel) => void;
}> = ({ htmlRef, searchFilter, lookups_countries, onSubmit }) => {
  const schema = zod.object({
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
      if (onSubmit) {
        const mergedData = {
          ...searchFilter, // Keep existing filter values
          countries: data.countries, // Update countries with form data
        };
        onSubmit(mergedData as OrganizationSearchFilterSummaryViewModel);
      }
    },
    [onSubmit, searchFilter],
  );

  return (
    <div className="flex flex-grow flex-col gap-3">
      <form
        onSubmit={handleSubmit(onSubmitHandler)}
        className="flex flex-col gap-2"
      >
        <div className="flex flex-row items-center gap-2">
          <div className="whitespace-nowrap text-sm font-bold text-gray-dark">
            Filter by:
          </div>

          {/* COUNTRIES */}
          {lookups_countries && (
            <span className="w-full sm:w-72">
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
      </form>

      {/* FILTER BADGES */}
      <FilterBadges
        searchFilter={searchFilter}
        excludeKeys={[
          "pageSelectedOpportunities",
          "pageCompletedYouth",
          "pageSize",
          "organizations",
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
