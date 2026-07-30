import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Controller, useForm, type FieldValues } from "react-hook-form";
import { IoMdClose } from "react-icons/io";
import Select from "react-select";
import zod from "zod";
import type { Country, Language, SelectOption } from "~/api/models/lookups";
import {
  OpportunityFilterOptions,
  type CustomFieldDefinition,
  type CustomFieldFilter,
  type OpportunityCategory,
  type OpportunitySearchFilterAdmin,
  type OpportunityType,
} from "~/api/models/opportunity";
import type { OrganizationInfo } from "~/api/models/organisation";
import {
  BTN_DIALOG_CLOSE,
  BTN_PRIMARY,
  BTN_SECONDARY,
} from "~/components/Common/buttonStyles";
import { dateInputToUTC, utcToDateInput } from "~/lib/utils";
import {
  CustomFieldFilters,
  getCustomFieldFilterErrors,
  sanitizeCustomFieldFilters,
} from "./CustomFieldFilters";

// compact controls — the dialog is narrow. Matches the react-select control styling
// used by CustomFieldFilters so the General and Additional tabs look the same.
const SELECT_CONTROL_CLASSES =
  "input w-full !border-gray pr-0 pl-2 h-fit py-1 text-sm";
const DATE_INPUT_CLASSES =
  "input input-sm border-gray focus:border-gray h-10 min-h-10 w-full rounded-md text-sm focus:outline-none";

/** One labelled filter row. */
const FilterField: React.FC<{
  label: string;
  error?: string;
  children: ReactNode;
}> = ({ label, error, children }) => (
  <div className="flex flex-col gap-1">
    <span className="text-gray-dark text-xs font-semibold tracking-wide uppercase">
      {label}
    </span>
    {children}
    {error && <span className="text-xs text-red-500 italic">{error}</span>}
  </div>
);

/** Maps a list of {name} lookups to react-select options (values are names). */
const toOptions = (items: { name: string }[]): SelectOption[] =>
  items.map((item) => ({ value: item.name, label: item.name }));

export const OpportunityAdminFilterVertical: React.FC<{
  htmlRef: HTMLDivElement;
  searchFilter: OpportunitySearchFilterAdmin | null;
  lookups_categories: OpportunityCategory[];
  lookups_countries: Country[];
  lookups_languages: Language[];
  lookups_types: OpportunityType[];
  lookups_organisations: OrganizationInfo[];
  lookups_publishedStates: SelectOption[];
  lookups_statuses: SelectOption[];
  lookups_customFieldDefinitions?: CustomFieldDefinition[];
  onSubmit?: (fieldValues: OpportunitySearchFilterAdmin) => void;
  onCancel?: () => void;
  filterOptions: OpportunityFilterOptions[];
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
  lookups_customFieldDefinitions,
  onSubmit,
  onCancel,
  filterOptions,
}) => {
  // ─── Custom fields (definition-driven — YOM-1260) ─────────────────────────
  // Clause state lives outside the RHF form because the zod resolver strips
  // unknown keys; it is merged into the payload in onSubmitHandler below.
  const [customFieldFilters, setCustomFieldFilters] = useState<
    CustomFieldFilter[]
  >(searchFilter?.customFields ?? []);
  const [showCustomFieldErrors, setShowCustomFieldErrors] = useState(false);

  // Sync when the filter prop changes (e.g. modal re-opened with different state)
  useEffect(() => {
    setCustomFieldFilters(searchFilter?.customFields ?? []);
  }, [searchFilter?.customFields]);

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
      const payload = data as OpportunitySearchFilterAdmin;

      // Merge custom-field clauses (usable ones only). Blocked while any clause
      // is invalid, so the search is never sent with input the API will reject.
      const activeCustomFields = sanitizeCustomFieldFilters(customFieldFilters);
      const customFieldErrors = getCustomFieldFilterErrors(
        lookups_customFieldDefinitions,
        activeCustomFields,
      );
      if (customFieldErrors.length > 0) {
        setShowCustomFieldErrors(true);
        return;
      }
      setShowCustomFieldErrors(false);

      payload.customFields =
        activeCustomFields.length > 0 ? activeCustomFields : null;

      if (onSubmit) onSubmit(payload);
    },
    [onSubmit, customFieldFilters, lookups_customFieldDefinitions],
  );

  // shared react-select props (portal keeps the menu above the dialog)
  const selectProps = {
    classNames: { control: () => SELECT_CONTROL_CLASSES },
    isMulti: true as const,
    menuPortalTarget: htmlRef,
    styles: {
      menuPortal: (base: Record<string, unknown>) => ({
        ...base,
        zIndex: 9999,
      }),
      placeholder: (base: Record<string, unknown>) => ({
        ...base,
        color: "#A3A6AF",
      }),
    },
  };

  const showDates =
    filterOptions?.includes(OpportunityFilterOptions.DATE_START) ||
    filterOptions?.includes(OpportunityFilterOptions.DATE_END);

  return (
    <form onSubmit={handleSubmit(onSubmitHandler)} className="flex flex-col">
      <div className="flex flex-row items-center px-4 py-3">
        <h1 className="my-auto grow text-lg font-bold">Filters</h1>
        <button
          type="button"
          className={BTN_DIALOG_CLOSE}
          onClick={onCancel}
          aria-label="Close"
        >
          <IoMdClose className="h-5 w-5" />
        </button>
      </div>

      {/* VALUECONTAINS: hidden input, keeps the search term when applying filters */}
      <input
        type="hidden"
        {...form.register("valueContains")}
        value={searchFilter?.valueContains ?? ""}
      />

      <div className="bg-gray-light flex flex-col">
        <div className="join join-vertical w-full">
          {/* GENERAL */}
          <div className="collapse-arrow join-item collapse">
            <input type="checkbox" name="my-accordion-general" defaultChecked />
            <div className="collapse-title font-semibold">General</div>
            <div className="collapse-content">
              <div className="flex flex-col gap-3 pb-2">
                {/* TOPICS */}
                {lookups_categories?.length > 0 &&
                  filterOptions?.includes(
                    OpportunityFilterOptions.CATEGORIES,
                  ) && (
                    <FilterField
                      label="Topics"
                      error={formState.errors.categories?.message?.toString()}
                    >
                      <Controller
                        name="categories"
                        control={form.control}
                        defaultValue={searchFilter?.categories}
                        render={({ field: { onChange, value } }) => (
                          <Select
                            {...selectProps}
                            instanceId="filter_categories"
                            options={toOptions(lookups_categories)}
                            onChange={(val) =>
                              onChange(val.map((c) => c.value))
                            }
                            value={toOptions(
                              lookups_categories.filter((c) =>
                                value?.includes(c.name),
                              ),
                            )}
                            placeholder="Select topics..."
                          />
                        )}
                      />
                    </FilterField>
                  )}

                {/* TYPE */}
                {filterOptions?.includes(OpportunityFilterOptions.TYPES) && (
                  <FilterField
                    label="Type"
                    error={formState.errors.types?.message?.toString()}
                  >
                    <Controller
                      name="types"
                      control={form.control}
                      defaultValue={searchFilter?.types}
                      render={({ field: { onChange, value } }) => (
                        <Select
                          {...selectProps}
                          instanceId="filter_types"
                          options={toOptions(lookups_types)}
                          onChange={(val) => onChange(val.map((c) => c.value))}
                          value={toOptions(
                            lookups_types.filter((c) =>
                              value?.includes(c.name),
                            ),
                          )}
                          placeholder="Select types..."
                        />
                      )}
                    />
                  </FilterField>
                )}

                {/* LOCATION */}
                {filterOptions?.includes(
                  OpportunityFilterOptions.COUNTRIES,
                ) && (
                  <FilterField
                    label="Location"
                    error={formState.errors.countries?.message?.toString()}
                  >
                    <Controller
                      name="countries"
                      control={form.control}
                      defaultValue={searchFilter?.countries}
                      render={({ field: { onChange, value } }) => (
                        <Select
                          {...selectProps}
                          instanceId="filter_countries"
                          options={toOptions(lookups_countries)}
                          onChange={(val) => onChange(val.map((c) => c.value))}
                          value={toOptions(
                            lookups_countries.filter((c) =>
                              value?.includes(c.name),
                            ),
                          )}
                          placeholder="Select countries..."
                        />
                      )}
                    />
                  </FilterField>
                )}

                {/* LANGUAGE */}
                {filterOptions?.includes(
                  OpportunityFilterOptions.LANGUAGES,
                ) && (
                  <FilterField
                    label="Language"
                    error={formState.errors.languages?.message?.toString()}
                  >
                    <Controller
                      name="languages"
                      control={form.control}
                      defaultValue={searchFilter?.languages}
                      render={({ field: { onChange, value } }) => (
                        <Select
                          {...selectProps}
                          instanceId="filter_languages"
                          options={toOptions(lookups_languages)}
                          onChange={(val) => onChange(val.map((c) => c.value))}
                          value={toOptions(
                            lookups_languages.filter((c) =>
                              value?.includes(c.name),
                            ),
                          )}
                          placeholder="Select languages..."
                        />
                      )}
                    />
                  </FilterField>
                )}

                {/* ORGANIZATION */}
                {filterOptions?.includes(
                  OpportunityFilterOptions.ORGANIZATIONS,
                ) && (
                  <FilterField
                    label="Organization"
                    error={formState.errors.organizations?.message?.toString()}
                  >
                    <Controller
                      name="organizations"
                      control={form.control}
                      defaultValue={searchFilter?.organizations}
                      render={({ field: { onChange, value } }) => (
                        <Select
                          {...selectProps}
                          instanceId="filter_organizations"
                          options={toOptions(lookups_organisations)}
                          onChange={(val) => onChange(val.map((c) => c.value))}
                          value={toOptions(
                            lookups_organisations.filter((c) =>
                              value?.includes(c.name),
                            ),
                          )}
                          placeholder="Select organisations..."
                        />
                      )}
                    />
                  </FilterField>
                )}

                {/* PUBLISHED STATES */}
                {filterOptions?.includes(
                  OpportunityFilterOptions.PUBLISHEDSTATES,
                ) && (
                  <FilterField
                    label="Published state"
                    error={formState.errors.publishedStates?.message?.toString()}
                  >
                    <Controller
                      name="publishedStates"
                      control={form.control}
                      render={({ field: { onChange, value } }) => (
                        <Select
                          {...selectProps}
                          instanceId="filter_publishedStates"
                          options={lookups_publishedStates}
                          onChange={(val) => onChange(val.map((c) => c.label))}
                          value={lookups_publishedStates.filter((c) =>
                            value?.includes(c.label),
                          )}
                          placeholder="Select published states..."
                        />
                      )}
                    />
                  </FilterField>
                )}

                {/* STATUSES */}
                {filterOptions?.includes(OpportunityFilterOptions.STATUSES) && (
                  <FilterField
                    label="Status"
                    error={formState.errors.statuses?.message?.toString()}
                  >
                    <Controller
                      name="statuses"
                      control={form.control}
                      render={({ field: { onChange, value } }) => (
                        <Select
                          {...selectProps}
                          instanceId="filter_statuses"
                          options={lookups_statuses}
                          onChange={(val) => onChange(val.map((c) => c.label))}
                          value={lookups_statuses.filter((c) =>
                            value?.includes(c.label),
                          )}
                          placeholder="Select statuses..."
                        />
                      )}
                    />
                  </FilterField>
                )}

                {/* DATES */}
                {showDates && (
                  <FilterField
                    label="Dates"
                    error={
                      formState.errors.startDate?.message?.toString() ??
                      formState.errors.endDate?.message?.toString()
                    }
                  >
                    <div className="flex flex-row items-center gap-2">
                      {filterOptions?.includes(
                        OpportunityFilterOptions.DATE_START,
                      ) && (
                        <Controller
                          control={form.control}
                          name="startDate"
                          render={({ field: { onChange, value } }) => (
                            <input
                              type="date"
                              className={DATE_INPUT_CLASSES}
                              aria-label="Start date"
                              onBlur={(e) => {
                                // Only validate and convert when user finishes editing.
                                // NB: applied via the Apply button, so both dates can be
                                // set before searching.
                                if (e.target.value) {
                                  onChange(dateInputToUTC(e.target.value));
                                } else {
                                  onChange("");
                                }
                              }}
                              defaultValue={utcToDateInput(value || "")}
                            />
                          )}
                        />
                      )}

                      {filterOptions?.includes(
                        OpportunityFilterOptions.DATE_END,
                      ) && (
                        <Controller
                          control={form.control}
                          name="endDate"
                          render={({ field: { onChange, value } }) => (
                            <input
                              type="date"
                              className={DATE_INPUT_CLASSES}
                              aria-label="End date"
                              onBlur={(e) => {
                                if (e.target.value) {
                                  onChange(dateInputToUTC(e.target.value));
                                } else {
                                  onChange("");
                                }
                              }}
                              defaultValue={utcToDateInput(value || "")}
                            />
                          )}
                        />
                      )}
                    </div>
                  </FilterField>
                )}
              </div>
            </div>
          </div>

          {/* ADDITIONAL (definition-driven custom fields — YOM-1260) */}
          <div className="collapse-arrow join-item collapse">
            <input type="checkbox" name="my-accordion-additional" />
            <div className="collapse-title font-semibold">Additional</div>
            <div className="collapse-content">
              {(lookups_customFieldDefinitions?.length ?? 0) > 0 ? (
                <CustomFieldFilters
                  definitions={lookups_customFieldDefinitions}
                  value={customFieldFilters}
                  onChange={setCustomFieldFilters}
                  showErrors={showCustomFieldErrors}
                  menuPortalTarget={htmlRef}
                />
              ) : (
                <p className="text-gray-dark pb-2 text-sm italic">
                  No additional fields for the selected type(s).
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* BUTTONS */}
      <div className="flex flex-row items-center justify-center gap-3 px-4 py-4">
        <button
          type="button"
          className={`${BTN_SECONDARY} w-28`}
          onClick={onCancel}
        >
          Close
        </button>
        <button type="submit" className={`${BTN_PRIMARY} w-28`}>
          Apply
        </button>
      </div>
    </form>
  );
};
