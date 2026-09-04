import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect } from "react";
import { Controller, useForm, type FieldValues } from "react-hook-form";
import Select from "react-select";
import zod from "zod";
import type { SelectOption } from "~/api/models/lookups";
import type {
  StoreAccessControlRuleSearchFilter,
  StoreInfo,
} from "~/api/models/marketplace";
import type { OrganizationInfo } from "~/api/models/organisation";
import {
  FilterField,
  filterSelectProps,
  ListPageFilterDialog,
} from "~/components/Common/ListPage/ListPageFilterDialog";

export enum StoreRuleFilterOptions {
  ORGANIZATIONS = "organizations",
  STORES = "stores",
}

/** Maps a list of {name} lookups to react-select options (values are names). */
const toOptions = (items: { name: string | null }[]): SelectOption[] =>
  items
    .filter((item): item is { name: string } => !!item.name)
    .map((item) => ({ value: item.name, label: item.name }));

/**
 * Filter popup for the two marketplace store access rule list pages. Both lookups are full
 * lists, so both filters are by name.
 */
export const StoreAccessControlRuleFilterVertical: React.FC<{
  htmlRef: HTMLDivElement;
  searchFilter: StoreAccessControlRuleSearchFilter | null;
  lookups_organisations: OrganizationInfo[];
  lookups_stores: StoreInfo[];
  onSubmit?: (fieldValues: StoreAccessControlRuleSearchFilter) => void;
  onCancel?: () => void;
  filterOptions: StoreRuleFilterOptions[];
}> = ({
  htmlRef,
  searchFilter,
  lookups_organisations,
  lookups_stores,
  onSubmit,
  onCancel,
  filterOptions,
}) => {
  const schema = zod.object({
    organizations: zod.array(zod.string()).optional().nullable(),
    stores: zod.array(zod.string()).optional().nullable(),
    nameContains: zod.string().optional().nullable(),
  });

  const form = useForm({
    mode: "all",
    resolver: zodResolver(schema),
  });
  const { handleSubmit, formState, reset, setValue } = form;

  // set default values
  useEffect(() => {
    // setTimeout is needed to prevent the form from being reset before the default values are set
    setTimeout(() => {
      reset({
        ...searchFilter,
      });
    }, 100);
  }, [reset, searchFilter]);

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

  const selectProps = filterSelectProps(htmlRef);

  return (
    <ListPageFilterDialog
      onSubmit={handleSubmit(onSubmitHandler)}
      onCancel={onCancel}
      hiddenInputs={
        /* NAMECONTAINS: hidden input, keeps the search term when applying filters */
        <input
          type="hidden"
          {...form.register("nameContains")}
          value={searchFilter?.nameContains ?? ""}
        />
      }
    >
      {/* ORGANISATION */}
      {filterOptions?.includes(StoreRuleFilterOptions.ORGANIZATIONS) && (
        <FilterField
          label="Organisation"
          error={formState.errors.organizations?.message?.toString()}
        >
          <Controller
            name="organizations"
            control={form.control}
            defaultValue={searchFilter?.organizations}
            render={({ field: { onChange, value } }) => (
              <Select
                {...selectProps}
                instanceId="filter_store_rule_organizations"
                options={toOptions(lookups_organisations)}
                onChange={(val) => {
                  // the store list is scoped to the organisation
                  setValue("stores", []);
                  onChange(val.map((c) => c.value));
                }}
                value={toOptions(
                  lookups_organisations.filter((c) => value?.includes(c.name)),
                )}
                placeholder="Select organisations..."
              />
            )}
          />
        </FilterField>
      )}

      {/* STORE */}
      {filterOptions?.includes(StoreRuleFilterOptions.STORES) && (
        <FilterField
          label="Store"
          error={formState.errors.stores?.message?.toString()}
        >
          <Controller
            name="stores"
            control={form.control}
            defaultValue={searchFilter?.stores}
            render={({ field: { onChange, value } }) => (
              <Select
                {...selectProps}
                instanceId="filter_store_rule_stores"
                options={toOptions(lookups_stores)}
                onChange={(val) => onChange(val.map((c) => c.value))}
                value={toOptions(
                  lookups_stores.filter(
                    (c) => c.name && value?.includes(c.name),
                  ),
                )}
                placeholder="Select stores..."
              />
            )}
          />
        </FilterField>
      )}
    </ListPageFilterDialog>
  );
};

export default StoreAccessControlRuleFilterVertical;
