import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Controller, useForm, type FieldValues } from "react-hook-form";
import Select from "react-select";
import Async from "react-select/async";
import zod from "zod";
import type { LinkSearchFilter } from "~/api/models/actionLinks";
import type { SelectOption } from "~/api/models/lookups";
import type { OrganizationInfo } from "~/api/models/organisation";
import { searchCriteriaOpportunities } from "~/api/services/opportunities";
import {
  FilterField,
  filterSelectProps,
  ListPageFilterDialog,
} from "~/components/Common/ListPage/ListPageFilterDialog";
import { PAGE_SIZE_MEDIUM } from "~/lib/constants";
import { debounce } from "~/lib/utils";

export enum LinkAdminFilterOptions {
  ORGANIZATIONS = "organizations",
  ENTITIES = "entities",
}

/** Maps a list of {name} lookups to react-select options (values are names). */
const toOptions = (items: { name: string }[]): SelectOption[] =>
  items.map((item) => ({ value: item.name, label: item.name }));

/**
 * Filter popup for the two action-link list pages. Organisations come from a full lookup, so
 * they are filtered by name; opportunities are an async title search, so that filter stays
 * id-based and `entityOptions` supplies the labels for the id's already applied.
 */
export const LinkAdminFilterVertical: React.FC<{
  htmlRef: HTMLDivElement;
  searchFilter: LinkSearchFilter | null;
  lookups_organisations: OrganizationInfo[];
  /** {id, title} for the applied opportunity id's, so the picker shows their titles */
  entityOptions?: SelectOption[];
  onSubmit?: (fieldValues: LinkSearchFilter) => void;
  onCancel?: () => void;
  filterOptions: LinkAdminFilterOptions[];
}> = ({
  htmlRef,
  searchFilter,
  lookups_organisations,
  entityOptions,
  onSubmit,
  onCancel,
  filterOptions,
}) => {
  const schema = zod.object({
    organizations: zod.array(zod.string()).optional().nullable(),
    entities: zod.array(zod.string()).optional().nullable(),
    valueContains: zod.string().optional().nullable(),
  });

  const form = useForm({
    mode: "all",
    resolver: zodResolver(schema),
  });
  const { handleSubmit, formState, reset, setValue, watch } = form;

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
      if (onSubmit) onSubmit({ ...searchFilter, ...data } as LinkSearchFilter);
    },
    [searchFilter, onSubmit],
  );

  const selectProps = filterSelectProps(htmlRef);

  // the async opportunity picker holds id's, so the labels for whatever is selected have to
  // be remembered: seeded from the applied id's, extended as the user picks more
  const [entitySelection, setEntitySelection] = useState<SelectOption[]>(
    entityOptions ?? [],
  );
  useEffect(() => {
    setEntitySelection((previous) => {
      const known = new Set(previous.map((option) => option.value));
      return [
        ...previous,
        ...(entityOptions ?? []).filter((option) => !known.has(option.value)),
      ];
    });
  }, [entityOptions]);

  // organisations pending in the form scope the opportunity search
  const selectedOrganisationNames = watch("organizations");
  const selectedOrganisationIds = useMemo(
    () =>
      lookups_organisations
        .filter((organisation) =>
          selectedOrganisationNames?.includes(organisation.name),
        )
        .map((organisation) => organisation.id),
    [lookups_organisations, selectedOrganisationNames],
  );

  // debounce keeps the API from being called on every keystroke
  const loadOpportunities = useMemo(
    () =>
      debounce(
        (inputValue: string, callback: (options: SelectOption[]) => void) => {
          void searchCriteriaOpportunities({
            pageNumber: 1,
            pageSize: PAGE_SIZE_MEDIUM,
            types: null,
            organizations:
              selectedOrganisationIds.length > 0
                ? selectedOrganisationIds
                : null,
            titleContains: (inputValue ?? "").length > 2 ? inputValue : null,
            opportunities: null,
            countries: null,
            published: null,
            verificationEnabled: null,
            verificationMethod: null,
            onlyCompletable: false,
          }).then((data) => {
            callback(
              data.items.map((item) => ({
                value: item.id,
                label: item.title,
              })),
            );
          });
        },
        1000,
      ),
    [selectedOrganisationIds],
  );

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
      {/* ORGANISATION */}
      {filterOptions?.includes(LinkAdminFilterOptions.ORGANIZATIONS) && (
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
                instanceId="filter_link_organizations"
                options={toOptions(lookups_organisations)}
                onChange={(val) => {
                  // the opportunity list is scoped to the organisation(s)
                  setValue("entities", []);
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

      {/* OPPORTUNITY */}
      {filterOptions?.includes(LinkAdminFilterOptions.ENTITIES) && (
        <FilterField
          label="Opportunity"
          error={formState.errors.entities?.message?.toString()}
        >
          <Controller
            name="entities"
            control={form.control}
            defaultValue={searchFilter?.entities}
            render={({ field: { onChange, value } }) => (
              <Async
                {...selectProps}
                instanceId="filter_link_entities"
                defaultOptions={true} // loads initial results when the dropdown is opened
                cacheOptions
                loadOptions={loadOpportunities}
                onChange={(val) => {
                  setEntitySelection((previous) => {
                    const known = new Set(
                      previous.map((option) => option.value),
                    );
                    return [
                      ...previous,
                      ...val.filter((option) => !known.has(option.value)),
                    ];
                  });
                  onChange(val.map((c) => c.value));
                }}
                value={entitySelection.filter((option) =>
                  value?.includes(option.value),
                )}
                placeholder="Select opportunities..."
              />
            )}
          />
        </FilterField>
      )}
    </ListPageFilterDialog>
  );
};

export default LinkAdminFilterVertical;
