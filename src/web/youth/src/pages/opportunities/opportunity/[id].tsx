import { zodResolver } from "@hookform/resolvers/zod";
import { captureException } from "@sentry/nextjs";
import {
  QueryClient,
  dehydrate,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { type AxiosError } from "axios";
import { type GetServerSidePropsContext } from "next";
import { getServerSession } from "next-auth";
import router from "next/router";
import { type ParsedUrlQuery } from "querystring";
import { useCallback, useMemo, useState, type ReactElement } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Controller, useForm, type FieldValues } from "react-hook-form";
import Select from "react-select";
import AsyncSelect from "react-select/async";
import { toast } from "react-toastify";
import { type KeyValuePair } from "tailwindcss/types/config";
import z from "zod";
import { type SelectOption } from "~/api/models/lookups";
import {
  type FullOpportunityResponseDto,
  type OpportunityRequestDto,
} from "~/api/models/opportunity";
import { getCountries } from "~/api/services/lookups";
import {
  createOpportunities,
  getOpportunityById,
  updateOpportunities,
} from "~/api/services/opportunities";
import { getSkills } from "~/api/services/skills";
import MainLayout from "~/components/Layout/Main";
import { ApiErrors } from "~/components/Status/ApiErrors";
import { Loading } from "~/components/Status/Loading";
import withAuth from "~/context/withAuth";
import { authOptions, type User } from "~/server/auth";
import { type NextPageWithLayout } from "../../_app";

interface IParams extends ParsedUrlQuery {
  id: string;
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const { id } = context.params as IParams;
  const queryClient = new QueryClient();
  const session = await getServerSession(context.req, context.res, authOptions);

  await queryClient.prefetchQuery(["countries"], getCountries);

  if (id !== "create") {
    await queryClient.prefetchQuery(["opportunity", id], () =>
      getOpportunityById(context, id),
    );
  }

  return {
    props: {
      dehydratedState: dehydrate(queryClient),
      user: session?.user ?? null,
      id: id,
    },
  };
}

const OpportunityDetails: NextPageWithLayout<{
  id: string;
  user: User;
}> = ({ id, user }) => {
  const queryClient = useQueryClient();

  const { data: countries } = useQuery({
    queryKey: ["countries"],
    queryFn: getCountries,
  });

  const { data: skills } = useQuery<KeyValuePair<string, string>[]>({
    queryKey: ["skills"],
    queryFn: () => getSkills(null, "", 10),
  });

  const { data: opportunity } = useQuery<FullOpportunityResponseDto>({
    queryKey: ["opportunity", id],
    enabled: id !== "create",
  });

  const countriesOptions = useMemo(() => {
    return countries?.map((c) => ({
      value: c.code,
      label: c.name,
    }));
  }, [countries]);

  const skillsOptions = useMemo(() => {
    return skills?.map(
      (c) =>
        ({
          value: c.value,
          label: c.value,
        }) as SelectOption,
    );
  }, [skills]);

  const loadSkills = useCallback(
    (inputValue: string) =>
      new Promise<SelectOption[]>((resolve) => {
        /* eslint-disable */
        setTimeout(() => {
          if (inputValue.length < 2) resolve(skillsOptions as any);
          else {
            const data = getSkills(null, inputValue, 10).then(
              (res) => res?.map((c) => ({ value: c.value, label: c.value })),
            );

            resolve(data as any);
          }
        }, 1000);
        /* eslint-enable */
      }),
    [skillsOptions],
  );

  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const types = [
    { value: "Task", label: "Task" },
    { value: "Learning", label: "Learning" },
  ];
  const difficulties = [
    { value: "Beginner", label: "Beginner" },
    { value: "Intermediate", label: "Intermediate" },
    { value: "Advanced", label: "Advanced" },
  ];

  const languages = [
    { value: "EN", label: "English" },
    { value: "FR", label: "French" },
  ];

  const hours = [
    { value: "Hour", label: "Hour" },
    { value: "Day", label: "Day" },
    { value: "Week", label: "Week" },
    { value: "Month", label: "Month" },
  ];

  const handleCancel = () => {
    void router.push("/dashboard/opportunities");
  };

  const [formData, setFormData] = useState<OpportunityRequestDto>({
    title: opportunity?.title ?? "",
    description: opportunity?.description ?? "",
    countries: opportunity?.countries ?? [],
    language: opportunity?.language ?? [],
    organisationId: user.organisationId ?? "",
    instructions: "..",
    zltoReward: opportunity?.zltoReward ?? null,
    timeValue: opportunity?.timeValue ?? null,
    timePeriod: opportunity?.timePeriod ?? "",
    startTime: opportunity?.startTime ?? null,
    endTime: opportunity?.endTime ?? null,
    published: opportunity?.published ?? false,
    type: opportunity?.type ?? "",
    noEndDate: opportunity?.noEndDate ?? false,
    participantCount: opportunity?.participantCount ?? 0,
    skills: opportunity?.skills ?? [],
    difficulty: opportunity?.difficulty ?? "",
    opportunityURL: opportunity?.opportunityURL ?? "",
    participantLimit: null,
    zltoRewardPool: null,
  });

  const onSubmit = useCallback(
    async (data: OpportunityRequestDto) => {
      setIsLoading(true);

      try {
        // update api
        if (opportunity) {
          await updateOpportunities(id, data);
          toast("You have successfully updated the opportunity", {
            type: "success",
            toastId: "updateOpportunitySuccess",
          });
        } else {
          await createOpportunities(data);
          toast("You have successfully created an opportunity", {
            type: "success",
            toastId: "createOpportunitySuccess",
          });
        }

        // invalidate queries
        await queryClient.invalidateQueries(["opportunities"]);
        await queryClient.invalidateQueries([id, "opportunities"]);
      } catch (error) {
        toast(<ApiErrors error={error as AxiosError} />, {
          type: "error",
          toastId: "patcOpportunityError",
          autoClose: false,
          icon: false,
        });

        captureException(error);
        setIsLoading(false);

        return;
      }

      setIsLoading(false);

      void router.push("/dashboard/opportunities");
    },
    [setIsLoading, id, opportunity, queryClient],
  );

  // form submission handler
  const onSubmitStep = useCallback(
    async (step: number, data: FieldValues) => {
      // set form data
      const model = {
        ...formData,
        ...(data as OpportunityRequestDto),
      };
      setFormData(model);

      console.log("model", model);

      if (step === 3) {
        await onSubmit(model);
        return;
      }
      setStep(step);
    },
    [setStep, formData, setFormData, onSubmit],
  );

  const schemaStep1 = z.object({
    title: z
      .string()
      .min(2, "Opportunity title is required.")
      .max(200, "Opportunity title cannot exceed 50 characters."),
    opportunityURL: z
      .string()
      .url("Please enter a valid URL (e.g. http://www.example.com)")
      .optional()
      .or(z.literal("")),
    description: z
      .string()
      .min(1, "Description is required.")
      .max(8000, "Description cannot exceed 2083 characters."),
    type: z
      .string({ required_error: "Opportunity type is required" })
      .min(1, "Opportunity type is required."),
    difficulty: z
      .string({ required_error: "Difficulty is required" })
      .min(1, "Difficulty is required."),
    language: z
      .array(z.string(), { required_error: "Language is required" })
      .min(1, "Language is required."),
    countries: z
      .array(z.string(), { required_error: "Country is required" })
      .min(1, "Country is required."),
  });

  const schemaStep2 = z.object({
    timeValue: z
      .union([z.nan(), z.null(), z.number()])
      .refine((val) => val != null && !isNaN(val), {
        message: "Time Value is required.",
      }),
    timePeriod: z
      .string({ required_error: "Time Period is required." })
      .min(1, "Time Period is required."),
    startTime: z
      .union([z.null(), z.string(), z.date()])
      .refine((val) => val !== null, {
        message: "Start Time is required.",
      }),
    //noEndDate: z.boolean(),
    endTime: z.union([z.string(), z.date(), z.null()]).optional(),
    participantCount: z
      .union([z.nan(), z.null(), z.number()])
      // eslint-disable-next-line
      .refine((val) => val !== null && !Number.isNaN(val as any), {
        message: "Participant Count is required.",
      }),
    zltoReward: z.union([z.nan(), z.null(), z.number()]).transform((val) => {
      // eslint-disable-next-line
      return val === null || Number.isNaN(val as any) ? undefined : val;
    }),
    skills: z
      .array(z.string(), { required_error: "At least one skill is required." })
      .min(1, "At least one skill is required."),
  });

  const {
    register: registerStep1,
    handleSubmit: handleSubmitStep1,
    setValue: setValueStep1,
    formState: { errors: errorsStep1 },
    control: controlStep1,
  } = useForm({
    resolver: zodResolver(schemaStep1),
    defaultValues: opportunity,
  });

  const {
    register: registerStep2,
    handleSubmit: handleSubmitStep2,
    formState: { errors: errorsStep2 },
    control: controlStep2,
    watch: watchStep2,
  } = useForm({
    resolver: zodResolver(schemaStep2),
    defaultValues: opportunity,
  });

  const watchNoEndDateCheck = watchStep2("noEndDate");

  return (
    <div className="container max-w-md">
      {isLoading && <Loading />}

      {step === 1 && (
        <>
          <ul className="steps steps-vertical w-full lg:steps-horizontal">
            <li className="step step-success"></li>
            <li className="step"></li>
          </ul>
          <div className="flex flex-col text-center">
            <h2>Opportunity General</h2>
            <p className="my-2">General opportunity information</p>
          </div>

          <form
            className="flex flex-col gap-2"
            onSubmit={handleSubmitStep1((data) => onSubmitStep(2, data))} // eslint-disable-line @typescript-eslint/no-misused-promises
          >
            <div className="form-control">
              <label className="label font-bold">
                <span className="label-text">Opportunity Title</span>
              </label>
              <input
                type="text"
                // className="input input-bordered w-full"
                className="input input-bordered"
                placeholder="Opportunity Title"
                {...registerStep1("title")}
                contentEditable
              />
              {errorsStep1.title && (
                <label className="label">
                  <span className="label-text-alt italic text-red-500">
                    {/* eslint-disable-next-line @typescript-eslint/restrict-template-expressions */}
                    {`${errorsStep1.title.message}`}
                  </span>
                </label>
              )}
            </div>

            <div className="form-control">
              <label className="label font-bold">
                <span className="label-text">Opportunity Link</span>
              </label>
              <input
                type="text"
                className="input input-bordered"
                placeholder="Opportunity Link"
                {...registerStep1("opportunityURL")}
                contentEditable
              />

              {errorsStep1.opportunityURL && (
                <label className="label">
                  <span className="label-text-alt italic text-red-500">
                    {`${errorsStep1.opportunityURL.message}`}
                  </span>
                </label>
              )}
            </div>

            <div className="form-control">
              <label className="label font-bold">
                <span className="label-text">Opportunity Type</span>
              </label>
              <Controller
                control={controlStep1}
                name="type"
                render={({ field: { onChange, value } }) => (
                  <Select
                    classNames={{
                      control: () => "input input-bordered",
                    }}
                    options={types}
                    onChange={(val) => onChange(val?.value)}
                    value={types.find((c) => c.value === value)}
                  />
                )}
              />

              {errorsStep1.type && (
                <label className="label">
                  <span className="label-text-alt italic text-red-500">
                    {/* eslint-disable-next-line @typescript-eslint/restrict-template-expressions */}
                    {`${errorsStep1.type.message}`}
                  </span>
                </label>
              )}
            </div>

            <div className="form-control">
              <label className="label font-bold">
                <span className="label-text">Difficulty</span>
              </label>
              <Controller
                control={controlStep1}
                name="difficulty"
                render={({ field: { onChange, value } }) => (
                  <Select
                    classNames={{
                      control: () => "input input-bordered",
                    }}
                    isMulti={false}
                    options={difficulties}
                    onChange={(val) => onChange(val?.value)}
                    value={difficulties.find((c) => c.value === value)}
                  />
                )}
              />

              {errorsStep1.difficulty && (
                <label className="label">
                  <span className="label-text-alt italic text-red-500">
                    {`${errorsStep1.difficulty.message}`}
                  </span>
                </label>
              )}
            </div>

            <div className="form-control">
              <label className="label font-bold">
                <span className="label-text">Languages</span>
              </label>
              <Controller
                control={controlStep1}
                name="language"
                render={({ field: { onChange, value } }) => (
                  <Select
                    classNames={{
                      control: () => "input input-bordered",
                    }}
                    isMulti={true}
                    options={languages}
                    onChange={(val) => onChange(val.map((c) => c.value))}
                    value={languages.filter((c) => value?.includes(c.value))}
                  />
                )}
              />

              {errorsStep1.language && (
                <label className="label">
                  <span className="label-text-alt italic text-red-500">
                    {errorsStep1.language.message}
                  </span>
                </label>
              )}
            </div>

            <div className="form-control">
              <label className="label font-bold">
                <span className="label-text">Countries</span>
              </label>
              <Controller
                control={controlStep1}
                name="countries"
                render={({ field: { onChange, value } }) => (
                  <Select
                    classNames={{
                      control: () => "input input-bordered",
                    }}
                    isMulti={true}
                    options={countriesOptions}
                    onChange={(val) => onChange(val.map((c) => c.value))}
                    value={countriesOptions?.filter(
                      (c) => value?.includes(c.value),
                    )}
                  />
                )}
              />

              {errorsStep1.countries && (
                <label className="label">
                  <span className="label-text-alt italic text-red-500">
                    {`${errorsStep1.countries.message}`}
                  </span>
                </label>
              )}
            </div>

            <div className="form-control">
              <label className="label font-bold">
                <span className="label-text">Description</span>
              </label>
              <textarea
                className="textarea textarea-bordered h-24"
                placeholder="Description"
                {...registerStep1("description")}
                onChange={(e) => setValueStep1("description", e.target.value)}
              />
              {errorsStep1.description && (
                <label className="label">
                  <span className="label-text-alt italic text-red-500">
                    {`${errorsStep1.description.message}`}
                  </span>
                </label>
              )}
            </div>

            {/* BUTTONS */}
            <div className="my-4 flex items-center justify-center gap-2">
              <button
                type="button"
                className="btn btn-warning btn-sm flex-grow"
                onClick={handleCancel}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-success btn-sm flex-grow"
              >
                Next
              </button>
            </div>
          </form>
        </>
      )}

      {step === 2 && (
        <>
          <ul className="steps steps-vertical w-full lg:steps-horizontal">
            <li className="step"></li>
            <li className="step step-success"></li>
          </ul>
          <div className="flex flex-col text-center">
            <h2>Opportunity General</h2>
            <p className="my-2">General opportunity information</p>
          </div>
          <form
            className="flex flex-col gap-2"
            onSubmit={handleSubmitStep2((data) => onSubmitStep(3, data))} //
          >
            <div className="grid grid-cols-2 gap-2">
              <div className="form-control">
                <label className="label font-bold">
                  <span className="label-text">Time Value</span>
                </label>
                <input
                  type="number"
                  className="input input-bordered w-full"
                  placeholder="Enter number"
                  {...registerStep2("timeValue", {
                    valueAsNumber: true,
                  })}
                />
                {errorsStep2.timeValue && (
                  <label className="label">
                    <span className="label-text-alt italic text-red-500">
                      {/* eslint-disable-next-line @typescript-eslint/restrict-template-expressions */}
                      {`${errorsStep2.timeValue.message}`}
                    </span>
                  </label>
                )}
              </div>

              <div className="form-control">
                <label className="label font-bold">
                  <span className="label-text">Time Period</span>
                </label>
                <Controller
                  control={controlStep2}
                  name="timePeriod"
                  render={({ field: { onChange, value } }) => (
                    <Select
                      classNames={{
                        control: () => "input input-bordered",
                      }}
                      options={hours}
                      onChange={(val) => onChange(val?.value)}
                      value={hours.find((c) => c.value === value)}
                    />
                  )}
                />

                {errorsStep2.timePeriod && (
                  <label className="label">
                    <span className="label-text-alt italic text-red-500">
                      {/* eslint-disable-next-line @typescript-eslint/restrict-template-expressions */}
                      {`${errorsStep2.timePeriod.message}`}
                    </span>
                  </label>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="form-control">
                <label className="label font-bold">
                  <span className="label-text">Start Time</span>
                </label>
                <Controller
                  control={controlStep2}
                  name="startTime"
                  render={({ field: { onChange, value } }) => (
                    <DatePicker
                      className="input input-bordered"
                      onChange={(date) => onChange(date)}
                      selected={value ? new Date(value) : null}
                      placeholderText="Start Date"
                    />
                  )}
                />
                {errorsStep2.startTime && (
                  <label className="label">
                    <span className="label-text-alt italic text-red-500">
                      {errorsStep2.startTime.message}
                    </span>
                  </label>
                )}
              </div>
            </div>

            <div className="form-control">
              <label className="label font-bold">
                <span className="label-text">End Date</span>
              </label>

              <div className="grid grid-cols-2 gap-2">
                <Controller
                  control={controlStep2}
                  name="endTime"
                  render={({ field: { onChange, value } }) => (
                    <DatePicker
                      className="input input-bordered w-full"
                      onChange={(date) => onChange(date)}
                      selected={value ? new Date(value) : null}
                      placeholderText="Select End Date"
                      disabled={watchNoEndDateCheck}
                    />
                  )}
                />

                {/* <label className="label cursor-pointer text-sm">
                  <input
                    type="checkbox"
                    className="checkbox-primary checkbox"
                    {...registerStep2("noEndDate")}
                  />
                  <span className="label-text ml-4 w-full text-left">
                    No end date
                  </span>
                </label> */}
              </div>

              {errorsStep2.endTime && (
                <label className="label">
                  <span className="label-text-alt italic text-red-500">
                    {errorsStep2.endTime.message}
                  </span>
                </label>
              )}
            </div>

            <div className="form-control">
              <label className="label font-bold">
                <span className="label-text">Participant Limit</span>
              </label>

              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  className="input input-bordered"
                  placeholder="Count of participants"
                  {...registerStep2("participantCount", {
                    valueAsNumber: true,
                  })}
                  //disabled={watchNoParticipantLimitCheck}
                />

                {/* <label className="label cursor-pointer text-sm">
                  <input
                    type="checkbox"
                    className="checkbox-primary checkbox"
                    {...registerStep2("noParticipantLimit")}
                  />
                  <span className="label-text">No participant limit</span>
                </label> */}
              </div>

              {errorsStep2.participantCount && (
                <label className="label">
                  <span className="label-text-alt italic text-red-500">
                    {/* eslint-disable-next-line @typescript-eslint/restrict-template-expressions */}
                    {`${errorsStep2.participantCount.message}`}
                  </span>
                </label>
              )}
            </div>

            <div className="form-control">
              <label className="label font-bold">
                <span className="label-text">ZLTO Reward</span>
              </label>
              <input
                type="number"
                className="input input-bordered"
                placeholder="ZLTO"
                {...registerStep2("zltoReward", { valueAsNumber: true })}
                // setValueAs={(v) => (v === "" ? undefined : parseInt(v, 10))}
              />
              {errorsStep2.zltoReward && (
                <label className="label">
                  <span className="label-text-alt italic text-red-500">
                    {/* eslint-disable-next-line @typescript-eslint/restrict-template-expressions */}
                    {`${errorsStep2.zltoReward.message}`}
                  </span>
                </label>
              )}

              <div className="form-control">
                <label className="label font-bold">
                  <span className="label-text">Skills</span>
                </label>
                <Controller
                  control={controlStep2}
                  name="skills"
                  render={({ field: { onChange, value } }) => (
                    <>
                      {/* eslint-disable  */}
                      <AsyncSelect
                        classNames={{
                          control: () => "input input-bordered-full",
                        }}
                        isMulti={true}
                        defaultOptions={skillsOptions}
                        cacheOptions
                        loadOptions={loadSkills as any}
                        onChange={(val) => onChange(val.map((c) => c.value))}
                        value={value?.map((val) => ({
                          label: val,
                          value: val,
                        }))}
                      />
                      {/* eslint-enable  */}
                    </>
                  )}
                />
                {errorsStep2.skills && (
                  <label className="label">
                    <span className="label-text-alt italic text-red-500">
                      {/* eslint-disable-next-line @typescript-eslint/restrict-template-expressions */}
                      {`${errorsStep2.skills.message}`}
                    </span>
                  </label>
                )}
              </div>
            </div>

            {/* BUTTONS */}
            <div className="my-4 flex items-center justify-center gap-2">
              <button
                type="button"
                className="btn btn-warning btn-sm flex-grow"
                onClick={() => {
                  setStep(1);
                }}
              >
                Back
              </button>
              <button
                type="submit"
                className="btn btn-success btn-sm flex-grow"
              >
                Submit
              </button>
            </div>
          </form>
        </>
      )}
    </div>
  );
};

OpportunityDetails.getLayout = function getLayout(page: ReactElement) {
  return <MainLayout>{page}</MainLayout>;
};

export default withAuth(OpportunityDetails);
