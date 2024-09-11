import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect, useState } from "react";
import { type FieldValues, Controller, useForm } from "react-hook-form";
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
import { StoreAccessControlRuleSearchFilter } from "~/api/models/marketplace";
import { listSearchCriteriaStores } from "~/api/services/marketplace";

export enum StoreAccessControlRuleSearchFilterOptions {
  ORGANIZATIONS = "organizations",
  STORES = "stores",
}

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
        Organisation: "Organisations",
        Store: "Stores",
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

export const StoreAccessControlRuleSearchFilters: React.FC<{
  searchFilter: StoreAccessControlRuleSearchFilter | null;
  filterOptions: StoreAccessControlRuleSearchFilterOptions[];
  onSubmit?: (fieldValues: StoreAccessControlRuleSearchFilter) => void;
}> = ({ searchFilter, filterOptions, onSubmit }) => {
  const schema = zod.object({
    organizations: zod.array(zod.string()).optional().nullable(),
    entities: zod.array(zod.string()).optional().nullable(),
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
      if (onSubmit)
        onSubmit({
          ...searchFilter,
          ...data,
        } as StoreAccessControlRuleSearchFilter);
    },
    [searchFilter, onSubmit],
  );

  //#region organisations
  // load data asynchronously for the organisations dropdown
  // debounce is used to prevent the API from being called too frequently
  const loadOrganisations = debounce(
    (inputValue: string, callback: (options: any) => void) => {
      getOrganisations({
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
  // const [defaultOrganisationOptions, setDefaultOrganisationOptions] =
  //   useState<any>([]);

  // useEffect(() => {
  //   if (searchFilter?.organizations) {
  //     setDefaultOrganisationOptions(
  //       searchFilter?.organizations?.map((c: any) => ({
  //         value: c,
  //         label: c,
  //       })),
  //     );
  //   }
  // }, [setDefaultOrganisationOptions, searchFilter?.organizations]);

  const [defaultOrganisationOptions, setDefaultOrganisationOptions] =
    useState<any>([]);

  //#endregion organisations

  //#region stores
  // load data asynchronously for the stores dropdown
  // debounce is used to prevent the API from being called too frequently
  const loadStores = debounce(
    (inputValue: string, callback: (options: any) => void) => {
      listSearchCriteriaStores(
        searchFilter?.organizations?.[0]! ?? null,
        //{
        // opportunities: [],
        // organization: searchFilter?.organizations?.[0] ?? null,
        // titleContains: (inputValue ?? []).length > 2 ? inputValue : null,
        // published: null,
        // verificationMethod: null,
        //pageNumber: 1,
        // pageSize: PAGE_SIZE_MEDIUM,
        //}
      ).then((data) => {
        const options = data.map((item) => ({
          value: item.id,
          label: item.name,
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
    if (searchFilter?.stores) {
      setDefaultOpportunityOptions(
        searchFilter?.stores?.map((c: any) => ({
          value: c,
          label: c,
        })),
      );
    }
  }, [setDefaultOpportunityOptions, searchFilter?.stores]);
  //#endregion opportunities

  return (
    <div className="flex flex-grow flex-col">
      <form
        onSubmit={handleSubmit(onSubmitHandler)} // eslint-disable-line @typescript-eslint/no-misused-promises
        className="flex flex-col gap-2"
      >
        <div className="flex w-full flex-grow flex-row flex-wrap gap-2 md:w-fit lg:flex-row">
          {/* ORGANISATIONS */}
          {filterOptions?.includes(
            StoreAccessControlRuleSearchFilterOptions.ORGANIZATIONS,
          ) && (
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
                      // clear stores
                      setValue("stores", []);
                      // to honor the respective API contracts, we need to set a single value
                      // setting isMulti={false} breaks the contracts...
                      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
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
                      ValueContainer,
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
            </span>
          )}

          {/* STORES */}
          {filterOptions?.includes(
            StoreAccessControlRuleSearchFilterOptions.STORES,
          ) && (
            <span className="w-full md:w-72">
              <Controller
                name="stores"
                control={form.control}
                render={({ field: { onChange } }) => (
                  <Async
                    instanceId="stores"
                    classNames={{
                      control: () =>
                        "input input-xs h-fit !border-none w-full md:w-72",
                    }}
                    isMulti={true}
                    defaultOptions={true} // calls loadOpportunities for initial results when clicking on the dropdown
                    cacheOptions
                    loadOptions={loadStores}
                    onChange={(val) => {
                      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
                      onChange(val.map((c: any) => c.value));
                      void handleSubmit(onSubmitHandler)();
                    }}
                    value={defaultOpportunityOptions}
                    placeholder="Store"
                    components={{
                      ValueContainer,
                    }}
                    isDisabled={
                      !searchFilter?.organizations?.[0] ||
                      searchFilter?.organizations?.length > 1
                    }
                  />
                )}
              />
              {formState.errors.stores && (
                <label className="label font-bold">
                  <span className="label-text-alt italic text-red-500">
                    {`${formState.errors.stores.message}`}
                  </span>
                </label>
              )}
            </span>
          )}
        </div>
      </form>
    </div>
  );
};
