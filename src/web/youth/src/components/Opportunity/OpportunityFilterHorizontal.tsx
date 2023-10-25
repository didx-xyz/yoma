/* eslint-disable */
import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect } from "react";
import { Controller, FieldValues, useForm } from "react-hook-form";
import zod from "zod";
import type {
  OpportunityCategory,
  OpportunitySearchCriteriaCommitmentInterval,
  OpportunitySearchFilter,
  OpportunitySearchCriteriaZltoReward,
  OpportunityType,
} from "~/api/models/opportunity";
import type { Country, Language, SelectOption } from "~/api/models/lookups";
import Select, { components, ValueContainerProps } from "react-select";
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

const ValueContainer = ({
  children,
  ...props
}: ValueContainerProps<SelectOption>) => {
  let [values, input] = children as any;
  if (Array.isArray(values)) {
    const plural = values.length === 1 ? "" : "s";
    values = `${values.length} item${plural}`;
  }

  return (
    <components.ValueContainer {...props}>
      {values}
      {input}
    </components.ValueContainer>
  );
};

export const OpportunityFilterHorizontal: React.FC<InputProps> = ({
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
    commitmentIntervals: zod
      .array(zod.object({ id: zod.string(), count: zod.number() }))
      .optional()
      .nullable(),
    zltoRewardRanges: zod
      .array(zod.any())
      .optional()
      .nullable()
      // NB: zltoRewardRanges needs special treatment
      // map it to array of OpportunitySearchCriteriaZltoReward
      .transform((val) => {
        if (val == null) return null;

        return lookups_zltoRewardRanges.filter((c) =>
          val.includes(c.description),
        );
      }),
  });

  const form = useForm({
    mode: "all",
    resolver: zodResolver(schema),
  });
  const { handleSubmit, formState, reset, watch } = form;

  // set default values
  useEffect(() => {
    if (opportunitySearchFilter == null || opportunitySearchFilter == undefined)
      return;
    // NB: zltoRewardRanges needs special treatment
    // map it to an aray of descriptions (there's no id field on the model)
    const model = {
      ...opportunitySearchFilter,
      zltoRewardRanges: opportunitySearchFilter?.zltoRewardRanges?.map(
        (c) => `Z${c.from} - Z${c.to}`,
      ),
    };
    // reset form
    // setTimeout is needed to prevent the form from being reset before the default values are set
    setTimeout(() => {
      reset({
        ...model,
      });
    }, 100);
  }, [reset, opportunitySearchFilter]);

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
        className="flex flex-row gap-2"
      >
        <div className="flex flex-row gap-2">
          {/* <div className="collapse join-item collapse-arrow border border-base-300">
              <input type="radio" name="my-accordion-1" checked={true} />
              <div className="collapse-title text-xl font-medium">Topics</div>
              <div className="">
                  CATEGORIES
                {lookups_categories && lookups_categories.length > 0 && (
                  <div className="flex flex-col items-center justify-center gap-2 pb-8">
                    <div className="flex w-full flex-col">
                      {lookups_categories.map((item) => (
                        <div
                          key={`fs_searchfilter_categories_${item.id}`}
                          className="flex h-[70px] flex-grow flex-row items-center justify-center gap-2 p-2"
                        >
                          <label
                            className="flex items-center justify-center"
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
                            className="flex w-full flex-grow flex-col"
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

                          <div className=" ">
                            <input
                              type="checkbox"
                              className="checkbox-primary checkbox"
                              id={`checkbox_${item.id}`}
                              {...register("categories")}
                              value={item.id}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {formState.errors.categories && (
                  <label className="label font-bold">
                    <span className="label-text-alt italic text-red-500">
                      {`${formState.errors.categories.message}`}
                    </span>
                  </label>
                )}
              </div>
            </div> */}
          <div className="mr-4 flex items-center text-sm font-bold text-gray-dark">
            Filter by:
          </div>
          <div className="">
            <Controller
              name="types"
              control={form.control}
              defaultValue={opportunitySearchFilter?.countries}
              render={({ field: { onChange, value } }) => (
                <Select
                  classNames={{
                    control: () => "input input-bordered input-xs",
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
                  onChange={(val) => {
                    onChange(val.map((c) => c.value));
                    handleSubmit(onSubmitHandler)();
                  }}
                  value={lookups_types
                    .filter((c) => value?.includes(c.id))
                    .map((c) => ({ value: c.id, label: c.name }))}
                  placeholder="Type"
                  components={{
                    ValueContainer,
                  }}
                />
              )}
            />

            {formState.errors.types && (
              <label className="label font-bold">
                <span className="label-text-alt italic text-red-500">
                  {`${formState.errors.types.message}`}
                </span>
              </label>
            )}
          </div>
          <div className="">
            <Controller
              name="countries"
              control={form.control}
              defaultValue={opportunitySearchFilter?.countries}
              render={({ field: { onChange, value } }) => (
                <Select
                  classNames={{
                    control: () => "input input-bordered input-xs",
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
                  onChange={(val) => {
                    onChange(val.map((c) => c.value));
                    handleSubmit(onSubmitHandler)();
                  }}
                  value={lookups_countries
                    .filter((c) => value?.includes(c.id))
                    .map((c) => ({ value: c.id, label: c.name }))}
                  placeholder="Location"
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
          </div>
          <div className="">
            <Controller
              name="languages"
              control={form.control}
              defaultValue={opportunitySearchFilter?.languages}
              render={({ field: { onChange, value } }) => (
                <Select
                  classNames={{
                    control: () => "input input-bordered input-xs",
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
                  onChange={(val) => {
                    onChange(val.map((c) => c.value));
                    handleSubmit(onSubmitHandler)();
                  }}
                  value={lookups_languages
                    .filter((c) => value?.includes(c.id))
                    .map((c) => ({ value: c.id, label: c.name }))}
                  placeholder="Language"
                  components={{
                    ValueContainer,
                  }}
                />
              )}
            />

            {formState.errors.languages && (
              <label className="label font-bold">
                <span className="label-text-alt italic text-red-500">
                  {`${formState.errors.languages.message}`}
                </span>
              </label>
            )}
          </div>

          <div className="">
            <Controller
              name="organizations"
              control={form.control}
              defaultValue={opportunitySearchFilter?.organizations}
              render={({ field: { onChange, value } }) => (
                <Select
                  classNames={{
                    control: () => "input input-bordered input-xs",
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
                  onChange={(val) => {
                    onChange(val.map((c) => c.value));
                    handleSubmit(onSubmitHandler)();
                  }}
                  value={lookups_organisations
                    .filter((c) => value?.includes(c.id))
                    .map((c) => ({ value: c.id, label: c.name }))}
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
          </div>

          {/* <div className="">
            <Controller
              name="commitmentIntervals"
              control={form.control}
              render={({ field: { onChange, value } }) => (
                <OpportunityFilterCommitmentIntervals
                  htmlRef={htmlRef}
                  lookups_commitmentIntervals={lookups_commitmentIntervals}
                  onChange={onChange}
                  defaultValue={opportunitySearchFilter?.commitmentIntervals}
                />
              )}
            />

            {formState.errors.commitmentIntervals && (
              <label className="label font-bold">
                <span className="label-text-alt italic text-red-500">
                  {`${formState.errors.commitmentIntervals.message}`}
                </span>
              </label>
            )}
          </div> */}

          <div className="">
            <Controller
              name="zltoRewardRanges"
              control={form.control}
              //defaultValue={opportunitySearchFilter?.zltoRewardRanges}
              render={({ field: { onChange, value } }) => (
                <Select
                  classNames={{
                    control: () => "input input-bordered input-xs",
                  }}
                  isMulti={true}
                  options={lookups_zltoRewardRanges.map((c) => ({
                    value: c.description,
                    label: c.description,
                  }))}
                  // fix menu z-index issue
                  menuPortalTarget={htmlRef}
                  styles={{
                    menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                  }}
                  //onChange={(val) => onChange(val.map((c) => c.value))}
                  onChange={(val) => {
                    onChange(val.map((c) => c.value));
                    handleSubmit(onSubmitHandler)();
                  }}
                  value={lookups_zltoRewardRanges
                    .filter((c) => value?.includes(c.description))
                    .map((c) => ({
                      value: c.description,
                      label: c.description,
                    }))}
                  placeholder="Reward"
                  components={{
                    ValueContainer,
                  }}
                />
              )}
            />

            {formState.errors.zltoRewardRanges && (
              <label className="label font-bold">
                <span className="label-text-alt italic text-red-500">
                  {`${formState.errors.zltoRewardRanges.message}`}
                </span>
              </label>
            )}
          </div>
        </div>
      </form>
    </>
  );
};
/* eslint-enable */
