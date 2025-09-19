import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect, useState } from "react";
import { Controller, useForm, type FieldValues } from "react-hook-form";
import zod from "zod";
import type { SelectOption } from "~/api/models/lookups";
import "react-datepicker/dist/react-datepicker.css";
import { searchCriteriaOpportunities } from "~/api/services/opportunities";
import { components, type ValueContainerProps } from "react-select";
import Async from "react-select/async";
import { PAGE_SIZE_MEDIUM } from "~/lib/constants";
import { debounce } from "~/lib/utils";
import type { LinkSearchFilter } from "~/api/models/actionLinks";
import { getOrganisations } from "~/api/services/organisations";
import { SearchInput } from "../SearchInput";

export enum LinkFilterOptions {
  VALUECONTAINS = "valueContains",
  ORGANIZATIONS = "organizations",
  ENTITIES = "entities",
}

const ValueContainer = (props: ValueContainerProps<SelectOption, boolean>) => {
  const { children } = props;
  let [values, input] = children as any[];
  if (Array.isArray(values)) {
    if (
      values.length > 0 &&
      "props" in values[0] &&
      "selectProps" in values[0].props &&
      values[0].props.selectProps.placeholder
    ) {
      const pluralMapping: Record<string, string> = {
        Organisation: "Organisations",
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

  const OriginalValueContainer = components.ValueContainer;
  return (
    <OriginalValueContainer {...props}>
      {values}
      {input}
    </OriginalValueContainer>
  );
};

export const LinkSearchFilters: React.FC<{
  searchFilter: LinkSearchFilter | null;
  filterOptions: LinkFilterOptions[];
  onSubmit?: (fieldValues: LinkSearchFilter) => void;
}> = ({ searchFilter, filterOptions, onSubmit }) => {
  const schema = zod.object({
    organizations: zod.array(zod.string()).optional().nullable(),
    entities: zod.array(zod.string()).optional().nullable(),
    valueContains: zod.string().optional().nullable(),
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
      if (onSubmit) onSubmit({ ...searchFilter, ...data } as LinkSearchFilter);
    },
    [searchFilter, onSubmit],
  );

  //#region organisations
  // load data asynchronously for the organisations dropdown
  // debounce is used to prevent the API from being called too frequently
  const loadOrganisations = debounce(
    (inputValue: string, callback: (options: any) => void) => {
      getOrganisations({
        organizations: null,
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
  //#endregion organisations

  //#region opportunities
  // load data asynchronously for the opportunities dropdown
  // debounce is used to prevent the API from being called too frequently
  const loadOpportunities = debounce(
    (inputValue: string, callback: (options: any) => void) => {
      searchCriteriaOpportunities({
        opportunities: [],
        organizations: searchFilter?.organizations ?? null,
        titleContains: (inputValue ?? []).length > 2 ? inputValue : null,
        published: null,
        verificationMethod: null,
        countries: null,
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
    if (searchFilter?.entities) {
      setDefaultOpportunityOptions(
        searchFilter?.entities?.map((c: any) => ({
          value: c,
          label: c,
        })),
      );
    }
  }, [setDefaultOpportunityOptions, searchFilter?.entities]);
  //#endregion opportunities

  // ⚠️ Avoid nested <form>: wrap controls in a <div> instead
  return (
    <div className="flex grow flex-col">
      <div className="flex flex-col gap-2">
        <div className="flex w-full grow flex-row flex-wrap gap-2 md:w-fit lg:flex-row">
          {/* VALUE CONTAINS */}
          {filterOptions?.includes(LinkFilterOptions.VALUECONTAINS) && (
            <span className="w-full md:w-72">
              <Controller
                name="valueContains"
                control={form.control}
                render={({ field: { onChange, value } }) => (
                  <SearchInput
                    defaultValue={value ?? ""}
                    onSearch={(query: string) => {
                      onChange(query);
                      void handleSubmit(onSubmitHandler)();
                    }}
                    placeholder="Search"
                  />
                )}
              />
              {formState.errors.valueContains && (
                <label className="label font-bold">
                  <span className="label-text-alt text-red-500 italic">
                    {`${formState.errors.valueContains.message}`}
                  </span>
                </label>
              )}
            </span>
          )}

          {/* ORGANISATIONS */}
          {filterOptions?.includes(LinkFilterOptions.ORGANIZATIONS) && (
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
                    onChange={(val) => {
                      // clear entities
                      setValue("entities", []);
                      // to honor the respective API contracts, we need to set a single value
                      // setting isMulti={false} breaks the contracts...
                      onChange(
                        val && val.length > 0
                          ? [val[val.length - 1]?.value]
                          : [],
                      );
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

          {/* ENTITIES */}
          {filterOptions?.includes(LinkFilterOptions.ENTITIES) && (
            <span className="w-full md:w-72">
              <Controller
                name="entities"
                control={form.control}
                render={({ field: { onChange } }) => (
                  <Async
                    instanceId="entities"
                    classNames={{
                      control: () =>
                        "input input-xs h-fit !border-none w-full md:w-72",
                    }}
                    isMulti={true}
                    defaultOptions={true} // calls loadOpportunities for initial results when clicking on the dropdown
                    cacheOptions
                    loadOptions={loadOpportunities}
                    onChange={(val) => {
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
              {formState.errors.entities && (
                <label className="label font-bold">
                  <span className="label-text-alt text-red-500 italic">
                    {`${formState.errors.entities.message}`}
                  </span>
                </label>
              )}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
