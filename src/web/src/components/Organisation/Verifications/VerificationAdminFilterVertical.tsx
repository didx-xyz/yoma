import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect } from "react";
import { Controller, useForm, type FieldValues } from "react-hook-form";
import Select from "react-select";
import zod from "zod";
import type { SelectOption } from "~/api/models/lookups";
import type { MyOpportunitySearchFilterAdmin } from "~/api/models/myOpportunity";
import {
  FilterField,
  filterSelectProps,
  ListPageFilterDialog,
} from "~/components/Common/ListPage/ListPageFilterDialog";

export enum VerificationFilterOptions {
  OPPORTUNITY = "opportunity",
}

/**
 * Filter popup for the org-admin verification (submission) list page. The API takes a single
 * opportunity, so the picker is single-select.
 */
export const VerificationAdminFilterVertical: React.FC<{
  htmlRef: HTMLDivElement;
  searchFilter: MyOpportunitySearchFilterAdmin | null;
  /** {id, title} for the organisation's opportunities that have submissions */
  lookups_opportunities: SelectOption[];
  onSubmit?: (fieldValues: MyOpportunitySearchFilterAdmin) => void;
  onCancel?: () => void;
  filterOptions: VerificationFilterOptions[];
}> = ({
  htmlRef,
  searchFilter,
  lookups_opportunities,
  onSubmit,
  onCancel,
  filterOptions,
}) => {
  const schema = zod.object({
    opportunity: zod.string().optional().nullable(),
    valueContains: zod.string().optional().nullable(),
  });

  const form = useForm({
    mode: "all",
    resolver: zodResolver(schema),
  });
  const { handleSubmit, formState, reset } = form;

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
        } as MyOpportunitySearchFilterAdmin);
    },
    [searchFilter, onSubmit],
  );

  // single-select here, so the shared multi-select default is overridden
  const selectProps = {
    ...filterSelectProps(htmlRef),
    isMulti: false as const,
  };

  return (
    <ListPageFilterDialog
      onSubmit={handleSubmit(onSubmitHandler)}
      onCancel={onCancel}
      hiddenInputs={
        /* VALUECONTAINS: hidden input, keeps the search term when applying filters */
        <input
          type="hidden"
          {...form.register("valueContains")}
          value={searchFilter?.valueContains ?? ""}
        />
      }
    >
      {/* OPPORTUNITY */}
      {filterOptions?.includes(VerificationFilterOptions.OPPORTUNITY) && (
        <FilterField
          label="Opportunity"
          error={formState.errors.opportunity?.message?.toString()}
        >
          <Controller
            name="opportunity"
            control={form.control}
            defaultValue={searchFilter?.opportunity}
            render={({ field: { onChange, value } }) => (
              <Select
                {...selectProps}
                instanceId="filter_verification_opportunity"
                options={lookups_opportunities}
                isClearable={true}
                onChange={(val) => onChange(val?.value ?? null)}
                value={
                  lookups_opportunities.find(
                    (option) => option.value === value,
                  ) ?? null
                }
                placeholder="Select an opportunity..."
              />
            )}
          />
        </FilterField>
      )}
    </ListPageFilterDialog>
  );
};

export default VerificationAdminFilterVertical;
