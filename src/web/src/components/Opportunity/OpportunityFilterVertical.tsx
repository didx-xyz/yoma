import { zodResolver } from "@hookform/resolvers/zod";
import type { Session } from "next-auth";
import { useCallback, useEffect, useState } from "react";
import "react-datepicker/dist/react-datepicker.css";
import { Controller, useForm, type FieldValues } from "react-hook-form";
import { IoMdClose } from "react-icons/io";
import zod from "zod";
import type {
  Country,
  EngagementType,
  Language,
  SelectOption,
  TimeInterval,
} from "~/api/models/lookups";
import {
  type OpportunitySearchFilter,
  type OpportunityType,
} from "~/api/models/opportunity";
import type { OrganizationInfo } from "~/api/models/organisation";
import { getUserProfile } from "~/api/services/user";
import SelectButtons from "../Common/SelectButtons";
import { useAtomValue } from "jotai";
import { currentLanguageAtom } from "~/lib/store";

export const OpportunityFilterVertical: React.FC<{
  searchFilter: OpportunitySearchFilter;
  lookups_countries: Country[];
  lookups_languages: Language[];
  lookups_types: OpportunityType[];
  lookups_engagementTypes: EngagementType[];
  lookups_organisations: OrganizationInfo[];
  lookups_timeIntervals: TimeInterval[];
  lookups_publishedStates: SelectOption[];
  onSubmit?: (fieldValues: OpportunitySearchFilter) => void;
  onCancel?: () => void;
  clearButtonText?: string;
  submitButtonText?: string;
  onClear?: () => void;
  session: Session | null;
}> = ({
  searchFilter,
  lookups_countries,
  lookups_languages,
  lookups_types,
  lookups_engagementTypes,
  lookups_organisations,
  lookups_timeIntervals,
  lookups_publishedStates,
  onSubmit,
  onCancel,
  submitButtonText = "Submit",
  onClear,
  clearButtonText,
  session,
}) => {
  const currentLanguage = useAtomValue(currentLanguageAtom);

  const schema = zod.object({
    types: zod.array(zod.string()).optional().nullable(),
    engagementTypes: zod.array(zod.string()).optional().nullable(),
    categories: zod.array(zod.string()).optional().nullable(),
    languages: zod.array(zod.string()).optional().nullable(),
    countries: zod.array(zod.string()).optional().nullable(),
    organizations: zod.array(zod.string()).optional().nullable(),
    commitmentInterval: zod
      .object({
        options: zod.array(zod.string()).optional().nullable(),
        interval: zod
          .object({
            id: zod
              .any()
              .optional()
              .nullable()
              .transform((value) => (Array.isArray(value) ? value[0] : value)), // SelectButtons returns an array, get the first item
            count: zod.any().optional().nullable().transform(Number),
          })
          .optional()
          .nullable()
          .transform((value) => (value?.count === 0 ? null : value)), // if 'count' is 0, return null for 'interval'
      })
      .nullable()
      .transform((value) => (value?.interval === null ? null : value)), // if interval is null, return null for 'commitmentInterval'

    zltoReward: zod
      .object({
        ranges: zod.array(zod.string()).optional().nullable(),
        hasReward: zod.boolean().optional().nullable(),
      })
      .optional()
      .nullable()
      .transform((value) => (value?.hasReward == false ? null : value)), // if hasReward is false, return null for 'zltoReward'
    publishedStates: zod.array(zod.string()).optional().nullable(),
    valueContains: zod.string().optional().nullable(),
  });
  const form = useForm({
    mode: "all",
    resolver: zodResolver(schema),
  });

  const { handleSubmit, formState, watch, setValue } = form;
  const watchIntervalId = watch("commitmentInterval.interval.id");
  const watchIntervalCount = watch("commitmentInterval.interval.count");

  const [timeIntervalMax, setTimeIntervalMax] = useState(100);

  // set the maximum based on the selected time interval
  useEffect(() => {
    // if watchIntervalId is an array (from SelectButtons) get the first value, else use the value
    const watchInterval = Array.isArray(watchIntervalId)
      ? watchIntervalId[0]
      : watchIntervalId;

    let max = 0;
    switch (watchInterval) {
      case "Minute":
        max = 60;
        break;
      case "Hour":
        max = 24;
        break;
      case "Day":
        max = 30;
        break;
      case "Week":
        max = 12;
        break;
      case "Month":
        max = 60;
        break;
    }

    setTimeIntervalMax(max);

    if (watchIntervalCount > max) {
      setValue("commitmentInterval.interval.count", max);
    }
  }, [watchIntervalId, watchIntervalCount, setTimeIntervalMax, setValue]);

  // form submission handler
  const onSubmitHandler = useCallback(
    (data: FieldValues) => {
      if (onSubmit) onSubmit(data as OpportunitySearchFilter);
    },
    [onSubmit],
  );

  // set default values
  useEffect(() => {
    if (!searchFilter) return;

    // commitment interval type
    if (searchFilter.commitmentInterval?.interval?.id) {
      const lookup = lookups_timeIntervals.find(
        (x) => x.id == searchFilter.commitmentInterval?.interval?.id,
      );
      setValue("commitmentInterval.interval.id", lookup?.name ?? "Day");
    } else setValue("commitmentInterval.interval.id", "Day");

    // default to user's country
    let countries = searchFilter?.countries;
    if ((countries?.length ?? 0) == 0 && session) {
      getUserProfile().then((data) => {
        if (data.countryId) {
          const countryLookup = lookups_countries.find(
            (country) => country.id === data.countryId,
          );
          if (countryLookup) {
            countries = [countryLookup.name];
          }
          setValue("countries", countries);
        }
      });
    } else {
      setValue("countries", countries);
    }

    // default to current language
    let languages = searchFilter?.languages;
    if ((languages?.length ?? 0) == 0 && currentLanguage) {
      const languageLookup = lookups_languages.find(
        (x) => x.codeAlpha2.toLowerCase() === currentLanguage.toLowerCase(),
      );
      if (languageLookup) {
        languages = [languageLookup.name];
      }
      setValue("languages", languages);
    } else {
      setValue("languages", languages);
    }
  }, [
    searchFilter,
    session,
    currentLanguage,
    setValue,
    lookups_countries,
    lookups_languages,
    lookups_timeIntervals,
  ]);

  return (
    <>
      <form
        onSubmit={handleSubmit(onSubmitHandler)}
        className="flex h-full flex-col overflow-y-auto"
      >
        <div className="flex flex-row px-8 py-4">
          <h1 className="my-auto grow text-2xl font-bold">Filter</h1>
          <button
            type="button"
            className="btn btn-circle btn-primary"
            onClick={onCancel}
          >
            <IoMdClose className="h-6 w-6"></IoMdClose>
          </button>
        </div>
        <div className="bg-gray-light flex flex-col gap-4 px-8 py-4">
          {/* VALUECONTAINS: hidden input */}
          <input
            type="hidden"
            {...form.register("valueContains")}
            value={searchFilter?.valueContains ?? ""}
          />

          {/* TYPES */}
          <fieldset className="fieldset gap-1">
            <label className="label">
              <span className="label-text font-semibold">
                What type of opportunity are you looking for?
              </span>
            </label>

            <Controller
              name="types"
              control={form.control}
              defaultValue={searchFilter?.types ?? []}
              render={({ field: { onChange, value } }) => (
                <SelectButtons
                  id="selectButtons_types"
                  isMulti={true}
                  buttons={lookups_types.map((x) => ({
                    id: x.id,
                    title: x.name,
                    selected: value?.includes(x.name) ?? false,
                  }))}
                  onChange={(val) => {
                    const selectedButtons = val.filter((btn) => btn.selected);
                    onChange(selectedButtons.map((c) => c.title));
                  }}
                />
              )}
            />

            {formState.errors.types && (
              <label className="label font-bold">
                <span className="label-text-alt text-red-500 italic">
                  {`${formState.errors.types.message}`}
                </span>
              </label>
            )}
          </fieldset>

          {/* ENGAGEMENT TYPES */}
          <fieldset className="fieldset gap-1">
            <label className="label">
              <span className="label-text font-semibold">
                What type of engagement are you looking for?
              </span>
            </label>

            <Controller
              name="engagementTypes"
              control={form.control}
              defaultValue={searchFilter?.engagementTypes ?? []}
              render={({ field: { onChange, value } }) => (
                <SelectButtons
                  id="selectButtons_engagementTypes"
                  isMulti={true}
                  buttons={lookups_engagementTypes.map((x) => ({
                    id: x.id,
                    title: x.name,
                    selected: value?.includes(x.name) ?? false,
                  }))}
                  onChange={(val) => {
                    const selectedButtons = val.filter((btn) => btn.selected);
                    onChange(selectedButtons.map((c) => c.title));
                  }}
                />
              )}
            />

            {formState.errors.engagementTypes && (
              <label className="label font-bold">
                <span className="label-text-alt text-red-500 italic">
                  {`${formState.errors.engagementTypes.message}`}
                </span>
              </label>
            )}
          </fieldset>

          {/* COMMITMENT INTERVALS */}
          <fieldset className="fieldset gap-1">
            <label className="label">
              <span className="label-text font-semibold">
                How much time would you like to invest?
              </span>
            </label>
            <div className="flex w-full flex-row justify-start gap-4">
              <span className="text-gray-dark mt-1 text-xs font-semibold">
                0
              </span>

              <Controller
                name="commitmentInterval.interval.count"
                control={form.control}
                defaultValue={
                  searchFilter?.commitmentInterval?.interval?.count ?? 0
                }
                render={({ field: { onChange, value } }) => (
                  <div className="flex w-full flex-col justify-center text-center md:w-64">
                    <input
                      type="range"
                      className="range range-warning bg-white"
                      min="0"
                      max={timeIntervalMax}
                      value={value}
                      onChange={(val) => onChange(val)}
                    />
                    <span className="text-gray-dark mt-2 -mb-3 h-8 text-xs font-semibold">
                      {value > 0 && watchIntervalId != null && (
                        <>
                          {`${value} ${
                            value > 1 ? `${watchIntervalId}s` : watchIntervalId
                          }`}
                        </>
                      )}
                    </span>
                  </div>
                )}
              />

              <span className="text-gray-dark mt-1 text-xs font-semibold">
                {timeIntervalMax}
              </span>
            </div>
            <div className="flex w-full flex-row justify-start gap-4">
              <Controller
                name="commitmentInterval.interval.id"
                control={form.control}
                render={({ field: { onChange, value } }) => (
                  <SelectButtons
                    id="selectButtons_commitmentIntervals"
                    buttons={lookups_timeIntervals.map((x) => ({
                      id: x.id,
                      title: x.name,
                      selected: value?.includes(x.name) ?? false,
                    }))}
                    onChange={(val) => {
                      const selectedButtons = val.filter((btn) => btn.selected);
                      onChange(selectedButtons.map((c) => c.title));
                    }}
                  />
                )}
              />
            </div>
          </fieldset>

          {/* ZLTO REWARD RANGES */}
          <fieldset className="fieldset -mb-3 flex flex-row items-center gap-4">
            <label className="label">
              <span className="label-text font-semibold">ZLTO Reward</span>
            </label>
            <Controller
              name="zltoReward.hasReward"
              control={form.control}
              defaultValue={searchFilter?.zltoReward?.hasReward ?? false}
              render={({ field: { onChange, value } }) => (
                <input
                  type="checkbox"
                  className="toggle toggle-warning border-gray-dark bg-gray-dark"
                  checked={value}
                  onChange={(val) => onChange(val)}
                />
              )}
            />

            {formState.errors.zltoRewardRanges && (
              <label className="label font-bold">
                <span className="label-text-alt text-red-500 italic">
                  {`${formState.errors.zltoRewardRanges.message}`}
                </span>
              </label>
            )}
          </fieldset>

          {/* COUNTRIES */}
          <fieldset className="fieldset gap-1">
            <label className="label">
              <span className="label-text font-semibold">Country</span>
            </label>

            <Controller
              name="countries"
              control={form.control}
              render={({ field: { onChange, value } }) => (
                <SelectButtons
                  id="selectButtons_countries"
                  isMulti={true}
                  maxRows={8}
                  buttons={lookups_countries.map((x) => ({
                    id: x.id,
                    title: x.name,
                    selected: value?.includes(x.name) ?? false,
                  }))}
                  onChange={(val) => {
                    const selectedButtons = val.filter((btn) => btn.selected);
                    onChange(selectedButtons.map((c) => c.title));
                  }}
                />
              )}
            />

            {formState.errors.countries && (
              <label className="label font-bold">
                <span className="label-text-alt text-red-500 italic">
                  {`${formState.errors.countries.message}`}
                </span>
              </label>
            )}
          </fieldset>

          {/* LANGUAGES */}
          <fieldset className="fieldset gap-1">
            <label className="label">
              <span className="label-text font-semibold">Languages</span>
            </label>

            <Controller
              name="languages"
              control={form.control}
              render={({ field: { onChange, value } }) => (
                <SelectButtons
                  id="selectButtons_languages"
                  isMulti={true}
                  maxRows={8}
                  buttons={lookups_languages.map((x) => ({
                    id: x.id,
                    title: x.name,
                    selected: value?.includes(x.name) ?? false,
                  }))}
                  onChange={(val) => {
                    const selectedButtons = val.filter((btn) => btn.selected);
                    onChange(selectedButtons.map((c) => c.title));
                  }}
                />
              )}
            />

            {formState.errors.languages && (
              <label className="label font-bold">
                <span className="label-text-alt text-red-500 italic">
                  {`${formState.errors.languages.message}`}
                </span>
              </label>
            )}
          </fieldset>

          {/* ORGANIZATIONS */}
          <fieldset className="fieldset gap-1">
            <label className="label">
              <span className="label-text font-semibold">Providers</span>
            </label>

            <Controller
              name="organizations"
              control={form.control}
              defaultValue={searchFilter?.organizations ?? []}
              render={({ field: { onChange, value } }) => (
                <SelectButtons
                  id="selectButtons_organizations"
                  isMulti={true}
                  maxRows={4}
                  buttons={lookups_organisations.map((x) => ({
                    id: x.id,
                    title: x.name,
                    selected: value?.includes(x.name) ?? false,
                  }))}
                  onChange={(val) => {
                    const selectedButtons = val.filter((btn) => btn.selected);
                    onChange(selectedButtons.map((c) => c.title));
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
          </fieldset>

          {/* PUBLISHED STATES */}
          <fieldset className="fieldset gap-1">
            <label className="label">
              <span className="label-text font-semibold">
                What status would you like to see?
              </span>
            </label>
            <Controller
              name="publishedStates"
              control={form.control}
              defaultValue={searchFilter?.publishedStates ?? []}
              render={({ field: { onChange, value } }) => (
                <SelectButtons
                  id="selectButtons_publishedStates"
                  isMulti={true}
                  buttons={lookups_publishedStates.map((x) => ({
                    id: x.value,
                    title: x.label,
                    selected: value?.includes(x.label as never) ?? false,
                  }))}
                  onChange={(val) => {
                    const selectedButtons = val.filter((btn) => btn.selected);
                    onChange(selectedButtons.map((c) => c.title));
                  }}
                />
              )}
            />

            {formState.errors.publishedStates && (
              <label className="label font-bold">
                <span className="label-text-alt text-red-500 italic">
                  {`${formState.errors.publishedStates.message}`}
                </span>
              </label>
            )}
          </fieldset>
        </div>

        {/* BUTTONS */}
        <div className="mx-4 my-8 flex flex-col items-center justify-center gap-6 md:flex-row">
          {onClear && (
            <button
              type="button"
              className="btn btn-warning w-full grow rounded-full md:w-40"
              onClick={onClear}
            >
              {clearButtonText}
            </button>
          )}
          {onSubmit && (
            <button
              type="submit"
              className="btn btn-primary w-full grow rounded-full md:w-40"
            >
              {submitButtonText}
            </button>
          )}
        </div>
      </form>
    </>
  );
};
