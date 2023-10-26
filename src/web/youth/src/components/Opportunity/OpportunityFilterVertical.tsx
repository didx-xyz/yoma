/* eslint-disable */
import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect } from "react";
import { Controller, FieldValues, useForm } from "react-hook-form";
import { IoMdClose } from "react-icons/io";
import zod from "zod";
import type {
  OpportunityCategory,
  OpportunitySearchCriteriaCommitmentInterval,
  OpportunitySearchFilter,
  OpportunitySearchCriteriaZltoReward,
  OpportunityType,
} from "~/api/models/opportunity";
import type { Country, Language } from "~/api/models/lookups";
import Image from "next/image";
import { shimmer, toBase64 } from "src/lib/image";
import iconRocket from "public/images/icon-rocket.svg";
import Select from "react-select";
import type { OrganizationInfo } from "~/api/models/organisation";
import { OpportunityFilterCommitmentIntervals } from "./OpportunityFilterCommitmentIntervals";

export interface InputProps {
  htmlRef: HTMLDivElement;
  opportunitySearchFilter: OpportunitySearchFilter | null;
  lookups_categories: OpportunityCategory[];
  lookups_countries: Country[];
  lookups_languages: Language[];
  lookups_types: OpportunityType[];
  lookups_organisations: OrganizationInfo[];
  lookups_commitmentIntervals: OpportunitySearchCriteriaCommitmentInterval[];
  lookups_zltoRewardRanges: OpportunitySearchCriteriaZltoReward[];
  onSubmit?: (fieldValues: OpportunitySearchFilter) => void;
  onCancel?: () => void;
  cancelButtonText?: string;
  submitButtonText?: string;
}

export const OpportunityFilterVertical: React.FC<InputProps> = ({
  htmlRef,
  opportunitySearchFilter,
  lookups_categories,
  lookups_countries,
  lookups_languages,
  lookups_types,
  lookups_organisations,
  lookups_commitmentIntervals,
  lookups_zltoRewardRanges,
  onSubmit,
  onCancel,
  cancelButtonText = "Cancel",
  submitButtonText = "Submit",
}) => {
  const schema = zod.object({
    types: zod.array(zod.string()).optional().nullable(),
    categories: zod.array(zod.string()).optional().nullable(),
    languages: zod.array(zod.string()).optional().nullable(),
    countries: zod.array(zod.string()).optional().nullable(),
    organizations: zod.array(zod.string()).optional().nullable(),
    commitmentIntervals: zod.array(zod.string()).optional().nullable(),
    zltoRewardRanges: zod.array(zod.string()).optional().nullable(),
  });
  const form = useForm({
    mode: "all",
    resolver: zodResolver(schema),
  });
  const { register, handleSubmit, formState, reset } = form;

  // set default values
  useEffect(() => {
    // reset form
    // setTimeout is needed to prevent the form from being reset before the default values are set
    setTimeout(() => {
      reset({
        ...opportunitySearchFilter,
      });
    }, 100);
  }, [reset,opportunitySearchFilter]);

  // form submission handler
  const onSubmitHandler = useCallback(
    (data: FieldValues) => {
      if (onSubmit) onSubmit(data as OpportunitySearchFilter);
    },
    [onSubmit],
  );

  return (
    <>
      <form
        onSubmit={handleSubmit(onSubmitHandler)} // eslint-disable-line @typescript-eslint/no-misused-promises
        className="flex flex-col gap-2"
      >
        <div className="flex flex-row p-4">
          <h1 className="flex-grow text-2xl font-bold">Filter</h1>
          <button
            type="button"
            className="btn btn-primary rounded-lg"
            onClick={onCancel}
          >
            <IoMdClose className="h-6 w-6"></IoMdClose>
          </button>
        </div>
        <div className="flex flex-col bg-gray">
          <div className="join join-vertical w-full">
            <div className="collapse join-item collapse-arrow border border-base-300">
              <input type="radio" name="my-accordion-1" checked={true} />
              <div className="collapse-title text-xl font-medium">Topics</div>
              <div className="collapse-content">
                {/* CATEGORIES */}
                {lookups_categories && lookups_categories.length > 0 && (
                  <div className="flex flex-col items-center justify-center gap-2 pb-8">
                    <div className="flex w-full flex-col">
                      {lookups_categories.map((item) => (
                        <div
                          key={`fs_searchfilter_categories_${item.id}`}
                          className="flex h-[70px] flex-grow flex-row items-center justify-center gap-2 p-2"
                        >
                          <label
                            className="flex cursor-pointer items-center justify-center"
                            htmlFor={`checkbox_${item.id}`}
                          >
                            {!item.imageURL && (
                              <Image
                                src={iconRocket}
                                alt="Icon Rocket"
                                width={60}
                                height={60}
                                sizes="100vw"
                                priority={true}
                                placeholder="blur"
                                blurDataURL={`data:image/svg+xml;base64,${toBase64(
                                  shimmer(288, 182),
                                )}`}
                                style={{
                                  borderTopLeftRadius: "8px",
                                  borderTopRightRadius: "8px",
                                  width: "60px",
                                  height: "60px",
                                }}
                              />
                            )}
                            {item.imageURL && (
                              <Image
                                src={item.imageURL}
                                alt="Organization Logo"
                                width={60}
                                height={60}
                                sizes="100vw"
                                priority={true}
                                placeholder="blur"
                                blurDataURL={`data:image/svg+xml;base64,${toBase64(
                                  shimmer(288, 182),
                                )}`}
                                style={{
                                  borderTopLeftRadius: "8px",
                                  borderTopRightRadius: "8px",
                                  width: "60px",
                                  height: "60px",
                                }}
                              />
                            )}
                          </label>

                          <label
                            className="flex w-full flex-grow cursor-pointer flex-col"
                            htmlFor={`checkbox_${item.id}`}
                          >
                            <div className="flex flex-grow flex-col">
                              <h1 className="h-7 overflow-hidden text-ellipsis text-lg font-semibold text-black">
                                {item.name}
                              </h1>
                              <h6 className="text-sm text-gray-dark">
                                {item.count} available
                              </h6>
                            </div>
                          </label>

                          <input
                            type="checkbox"
                            className="checkbox-primary checkbox"
                            id={`checkbox_${item.id}`}
                            {...register("categories")}
                            value={item.name}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {formState.errors.categories && (
                  <label className="label font-bold">
                    <span className="label-text-alt italic text-red-500">
                      {/* eslint-disable-next-line @typescript-eslint/restrict-template-expressions */}
                      {`${formState.errors.categories.message}`}
                    </span>
                  </label>
                )}
              </div>
            </div>
            <div className="collapse-arrow collapse join-item border border-base-300">
              <input type="radio" name="my-accordion-2" />
              <div className="collapse-title text-xl font-medium">
                Opportunity type
              </div>
              <div className="collapse-content">
                <Controller
                  name="types"
                  control={form.control}
                  defaultValue={opportunitySearchFilter?.countries}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  render={({ field: { onChange, value } }) => (
                    <Select
                      classNames={{
                        control: () => "input input-bordered",
                      }}
                      isMulti={true}
                      options={lookups_types.map((c) => ({
                        value: c.id,
                        label: c.name,
                      }))}
                      // fix menu z-index issue
                      menuPortalTarget={htmlRef}
                      styles={{
                        menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                      }}
                      onChange={(val) => onChange(val.map((c) => c.value))}
                      value={lookups_types
                        .filter((c) => value?.includes(c.id))
                        .map((c) => ({ value: c.id, label: c.name }))}
                    />
                  )}
                />

                {formState.errors.types && (
                  <label className="label font-bold">
                    <span className="label-text-alt italic text-red-500">
                      {/* eslint-disable-next-line @typescript-eslint/restrict-template-expressions */}
                      {`${formState.errors.types.message}`}
                    </span>
                  </label>
                )}
              </div>
            </div>
            <div className="collapse-arrow collapse join-item border border-base-300">
              <input type="radio" name="my-accordion-3" />
              <div className="collapse-title text-xl font-medium">Location</div>
              <div className="collapse-content">
                <Controller
                  name="countries"
                  control={form.control}
                  defaultValue={opportunitySearchFilter?.countries}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  render={({ field: { onChange, value } }) => (
                    <Select
                      classNames={{
                        control: () => "input input-bordered",
                      }}
                      isMulti={true}
                      options={lookups_countries.map((c) => ({
                        value: c.id,
                        label: c.name,
                      }))}
                      // fix menu z-index issue
                      menuPortalTarget={htmlRef}
                      styles={{
                        menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                      }}
                      onChange={(val) => onChange(val.map((c) => c.value))}
                      value={lookups_countries
                        .filter((c) => value?.includes(c.id))
                        .map((c) => ({ value: c.id, label: c.name }))}
                    />
                  )}
                />

                {formState.errors.countries && (
                  <label className="label font-bold">
                    <span className="label-text-alt italic text-red-500">
                      {/* eslint-disable-next-line @typescript-eslint/restrict-template-expressions */}
                      {`${formState.errors.countries.message}`}
                    </span>
                  </label>
                )}
              </div>
            </div>
            <div className="collapse-arrow collapse join-item border border-base-300">
              <input type="radio" name="my-accordion-4" />
              <div className="collapse-title text-xl font-medium">Language</div>
              <div className="collapse-content">
                <Controller
                  name="languages"
                  control={form.control}
                  defaultValue={opportunitySearchFilter?.languages}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  render={({ field: { onChange, value } }) => (
                    <Select
                      classNames={{
                        control: () => "input input-bordered",
                      }}
                      isMulti={true}
                      options={lookups_languages.map((c) => ({
                        value: c.id,
                        label: c.name,
                      }))}
                      // fix menu z-index issue
                      menuPortalTarget={htmlRef}
                      styles={{
                        menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                      }}
                      onChange={(val) => onChange(val.map((c) => c.value))}
                      value={lookups_languages
                        .filter((c) => value?.includes(c.id))
                        .map((c) => ({ value: c.id, label: c.name }))}
                    />
                  )}
                />

                {formState.errors.languages && (
                  <label className="label font-bold">
                    <span className="label-text-alt italic text-red-500">
                      {/* eslint-disable-next-line @typescript-eslint/restrict-template-expressions */}
                      {`${formState.errors.languages.message}`}
                    </span>
                  </label>
                )}
              </div>
            </div>
            <div className="collapse-arrow collapse join-item border border-base-300">
              <input type="radio" name="my-accordion-5" />
              <div className="collapse-title text-xl font-medium">
                Organisation
              </div>
              <div className="collapse-content">
                <Controller
                  name="organizations"
                  control={form.control}
                  defaultValue={opportunitySearchFilter?.organizations}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  render={({ field: { onChange, value } }) => (
                    <Select
                      classNames={{
                        control: () => "input input-bordered",
                      }}
                      isMulti={true}
                      options={lookups_organisations.map((c) => ({
                        value: c.id,
                        label: c.name,
                      }))}
                      // fix menu z-index issue
                      menuPortalTarget={htmlRef}
                      styles={{
                        menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                      }}
                      onChange={(val) => onChange(val.map((c) => c.value))}
                      value={lookups_organisations
                        .filter((c) => value?.includes(c.id))
                        .map((c) => ({ value: c.id, label: c.name }))}
                    />
                  )}
                />

                {formState.errors.organizations && (
                  <label className="label font-bold">
                    <span className="label-text-alt italic text-red-500">
                      {/* eslint-disable-next-line @typescript-eslint/restrict-template-expressions */}
                      {`${formState.errors.organizations.message}`}
                    </span>
                  </label>
                )}
              </div>
            </div>
            <div className="collapse-arrow collapse join-item border border-base-300">
              <input type="radio" name="my-accordion-5" />
              <div className="collapse-title text-xl font-medium">
                Effort
              </div>
              <div className="collapse-content">
                <Controller
                  name="commitmentIntervals"
                  control={form.control}
                  defaultValue={opportunitySearchFilter?.commitmentIntervals}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  render={({ field: { onChange, value } }) => (
                    <Select
                      classNames={{
                        control: () => "input input-bordered",
                      }}
                      isMulti={true}
                      options={lookups_commitmentIntervals.map((c) => ({
                        value: c.id,
                        label: c.name,
                      }))}
                      // fix menu z-index issue
                      menuPortalTarget={htmlRef}
                      styles={{
                        menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                      }}
                      onChange={(val) => onChange(val.map((c) => c.value))}
                      value={lookups_commitmentIntervals
                        .filter((c) => value?.includes(c.id))
                        .map((c) => ({ value: c.id, label: c.name }))}
                    />
                  )}
                />

                {formState.errors.commitmentIntervals && (
                  <label className="label font-bold">
                    <span className="label-text-alt italic text-red-500">
                      {/* eslint-disable-next-line @typescript-eslint/restrict-template-expressions */}
                      {`${formState.errors.commitmentIntervals.message}`}
                    </span>
                  </label>
                )}
              </div>
            </div>
            <div className="collapse-arrow collapse join-item border border-base-300">
              <input type="radio" name="my-accordion-5" />
              <div className="collapse-title text-xl font-medium">
              Reward
              </div>
              <div className="collapse-content">
                <Controller
                  name="zltoRewardRanges"
                  control={form.control}
                  defaultValue={opportunitySearchFilter?.zltoRewardRanges}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  render={({ field: { onChange, value } }) => (
                    <Select
                      classNames={{
                        control: () => "input input-bordered",
                      }}
                      isMulti={true}
                      options={lookups_zltoRewardRanges.map((c) => ({
                        value: c.id,
                        label: c.name,
                      }))}
                      // fix menu z-index issue
                      menuPortalTarget={htmlRef}
                      styles={{
                        menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                      }}
                      onChange={(val) => onChange(val.map((c) => c.value))}
                      value={lookups_zltoRewardRanges
                        .filter((c) => value?.includes(c.id))
                        .map((c) => ({ value: c.id, label: c.name }))}
                    />
                  )}
                />

                {formState.errors.zltoRewardRanges && (
                  <label className="label font-bold">
                    <span className="label-text-alt italic text-red-500">
                      {/* eslint-disable-next-line @typescript-eslint/restrict-template-expressions */}
                      {`${formState.errors.zltoRewardRanges.message}`}
                    </span>
                  </label>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* BUTTONS */}
        <div className="my-4 flex items-center justify-center gap-2">
          {onCancel && (
            <button
              type="button"
              className="btn btn-warning btn-sm w-40 flex-grow rounded-full"
              onClick={onCancel}
            >
              {cancelButtonText}
            </button>
          )}
          {onSubmit && (
            <button
              type="submit"
              className="btn btn-primary btn-sm w-40 flex-grow rounded-full"
            >
              {submitButtonText}
            </button>
          )}
        </div>
      </form>
    </>
  );
};
/* eslint-enable */
