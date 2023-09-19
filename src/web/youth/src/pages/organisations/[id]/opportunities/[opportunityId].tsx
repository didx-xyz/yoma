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
import z from "zod";
import { type SelectOption } from "~/api/models/lookups";
import type {
  Opportunity,
  OpportunityRequestBase,
  OpportunityType,
} from "~/api/models/opportunity";
import {
  getCountries,
  getLanguages,
  getSkills,
  getTimeIntervals,
} from "~/api/services/lookups";
import {
  updateOpportunity,
  getDifficulties,
  getOpportunityById,
  getTypes,
  getVerificationTypes,
  createOpportunity,
} from "~/api/services/opportunities";
import MainLayout from "~/components/Layout/Main";
import { ApiErrors } from "~/components/Status/ApiErrors";
import { Loading } from "~/components/Status/Loading";
import withAuth from "~/context/withAuth";
import { authOptions, type User } from "~/server/auth";
import { type NextPageWithLayout } from "../../../_app";
import { PageBackground } from "~/components/PageBackground";
import Link from "next/link";
import { IoMdInformationCircle } from "react-icons/io";

interface IParams extends ParsedUrlQuery {
  id: string;
  opportunityId: string;
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const { id, opportunityId } = context.params as IParams;
  const queryClient = new QueryClient();
  const session = await getServerSession(context.req, context.res, authOptions);

  // UND_ERR_HEADERS_OVERFLOW ISSUE: disable prefetching for now
  // await queryClient.prefetchQuery(["countries"], async () =>
  //   (await getCountries(context)).map((c) => ({
  //     value: c.codeNumeric,
  //     label: c.name,
  //   })),
  // );
  // await queryClient.prefetchQuery(["languages"], async () =>
  //   (await getLanguages(context)).map((c) => ({
  //     value: c.id,
  //     label: c.name,
  //   })),
  // );
  // await queryClient.prefetchQuery(["opportunityTypes"], async () =>
  //   (await getTypes(context)).map((c) => ({
  //     value: c.id,
  //     label: c.name,
  //   })),
  // );
  // await queryClient.prefetchQuery(["verificationTypes"], async () =>
  //   (await getVerificationTypes(context)).map((c) => ({
  //     value: c.id,
  //     label: c.displayName,
  //   })),
  // );
  // await queryClient.prefetchQuery(["difficulties"], async () =>
  //   (await getDifficulties(context)).map((c) => ({
  //     value: c.id,
  //     label: c.name,
  //   })),
  // );
  // await queryClient.prefetchQuery(["timeIntervals"], async () =>
  //   (await getTimeIntervals(context)).map((c) => ({
  //     value: c.id,
  //     label: c.name,
  //   })),
  // );

  if (opportunityId !== "create") {
    await queryClient.prefetchQuery(["opportunity", opportunityId], () =>
      getOpportunityById(opportunityId, context),
    );
  }

  return {
    props: {
      dehydratedState: dehydrate(queryClient),
      user: session?.user ?? null,
      id: id,
      opportunityId: opportunityId,
    },
  };
}

const OpportunityDetails: NextPageWithLayout<{
  id: string;
  opportunityId: string;
  user: User;
}> = ({ id, opportunityId, user }) => {
  const queryClient = useQueryClient();

  const { data: countries } = useQuery<SelectOption[]>({
    queryKey: ["countries"],
    queryFn: async () =>
      (await getCountries()).map((c) => ({
        value: c.codeNumeric,
        label: c.name,
      })),
  });
  const { data: languages } = useQuery<SelectOption[]>({
    queryKey: ["languages"],
    queryFn: async () =>
      (await getLanguages()).map((c) => ({
        value: c.id,
        label: c.name,
      })),
  });
  const { data: opportunityTypes } = useQuery<SelectOption[]>({
    queryKey: ["opportunityTypes"],
    queryFn: async () =>
      (await getTypes()).map((c) => ({
        value: c.id,
        label: c.name,
      })),
  });
  const { data: verificationTypes } = useQuery<SelectOption[]>({
    queryKey: ["verificationTypes"],
    queryFn: async () =>
      (await getVerificationTypes()).map((c) => ({
        value: c.id,
        label: c.displayName,
      })),
  });
  const { data: difficulties } = useQuery<SelectOption[]>({
    queryKey: ["difficulties"],
    queryFn: async () =>
      (await getDifficulties()).map((c) => ({
        value: c.id,
        label: c.name,
      })),
  });
  const { data: timeIntervals } = useQuery<SelectOption[]>({
    queryKey: ["timeIntervals"],
    queryFn: async () =>
      (await getTimeIntervals()).map((c) => ({
        value: c.id,
        label: c.name,
      })),
  });
  const { data: skills } = useQuery<SelectOption[]>({
    queryKey: ["skills"],
    queryFn: async () =>
      (
        await getSkills({ nameContains: null, pageNumber: 1, pageSize: 60 })
      ).items.map((c) => ({
        value: c.id,
        label: c.name,
      })),
  });
  const { data: opportunity } = useQuery<Opportunity>({
    queryKey: ["opportunity", opportunityId],
    queryFn: () => getOpportunityById(opportunityId),
    enabled: opportunityId !== "create",
  });

  // const countriesOptions = useMemo(() => {
  //   return countries?.map((c) => ({
  //     value: c.codeNumeric,
  //     label: c.name,
  //   }));
  // }, [countries]);

  // const skillsOptions = useMemo(() => {
  //   return skills?.map(
  //     (c) =>
  //       ({
  //         value: c.value,
  //         label: c.value,
  //       }) as SelectOption,
  //   );
  // }, [skills]);

  // const loadSkills = useCallback(
  //   (inputValue: string) =>
  //     new Promise<SelectOption[]>((resolve) => {
  //       /* eslint-disable */
  //       setTimeout(() => {
  //         if (inputValue.length < 2) resolve(skillsOptions as any);
  //         else {
  //           const data = getSkills(null, inputValue, 60).then(
  //             (res) => res?.map((c) => ({ value: c.value, label: c.value })),
  //           );

  //           resolve(data as any);
  //         }
  //       }, 6000);
  //       /* eslint-enable */
  //     }),
  //   [skillsOptions],
  // );

  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const handleCancel = () => {
    void router.push("/dashboard/opportunities");
  };

  const [formData, setFormData] = useState<OpportunityRequestBase>({
    id: opportunity?.id ?? "",
    title: opportunity?.title ?? "",
    description: opportunity?.description ?? "",
    typeId: opportunity?.type ?? "",
    categories: opportunity?.categories?.map((x) => x.id) ?? [],
    uRL: opportunity?.uRL ?? "",

    languages: opportunity?.languages?.map((x) => x.id) ?? [],
    countries: opportunity?.countries?.map((x) => x.id) ?? [],
    difficultyId: opportunity?.difficultyId ?? "",
    commitmentIntervalCount: opportunity?.commitmentIntervalCount ?? null,
    commitmentIntervalId: opportunity?.commitmentIntervalId ?? "",
    dateStart: opportunity?.dateStart ?? null,
    dateEnd: opportunity?.dateEnd ?? null,
    participantLimit: opportunity?.participantLimit ?? 0,

    zltoReward: opportunity?.zltoReward ?? null,
    zltoRewardPool: opportunity?.zltoRewardPool ?? null,
    yomaReward: opportunity?.yomaReward ?? null,
    yomaRewardPool: opportunity?.yomaRewardPool ?? null,
    skills: opportunity?.skills?.map((x) => x.id) ?? [],
    keywords: opportunity?.keywords ?? [],
    verificationTypes: [], //opportunity?.verificationTypes?.map((x) => x.id) ?? [],

    organizationId: opportunity?.organizationId ?? "",
    postAsActive: opportunity?.published ?? false,

    //TODO:
    sSIIntegrated: opportunity?.sSIIntegrated ?? false,
    instructions: opportunity?.instructions ?? "",
    verificationSupported: opportunity?.verificationSupported ?? false,
    //noEndDate: opportunity?.noEndDate ?? false,
    //participantLimit: null,
    //instructions: "..",
  });

  const onSubmit = useCallback(
    async (data: OpportunityRequestBase) => {
      setIsLoading(true);

      try {
        // update api
        if (opportunity) {
          await updateOpportunity(data);
          toast("The opportunity has been updated.", {
            type: "success",
            toastId: "opportunitySuccess",
          });
        } else {
          await createOpportunity(data);
          toast("The opportunity has been created.", {
            type: "success",
            toastId: "opportunitySuccess",
          });
        }

        // invalidate queries
        await queryClient.invalidateQueries(["opportunities"]);
        await queryClient.invalidateQueries([id, "opportunities"]);
      } catch (error) {
        toast(<ApiErrors error={error as AxiosError} />, {
          type: "error",
          toastId: "patchOpportunityError",
          autoClose: false,
          icon: false,
        });

        captureException(error);
        setIsLoading(false);

        return;
      }

      setIsLoading(false);

      void router.push(`/organisations/${id}}/opportunities`);
    },
    [setIsLoading, id, opportunity, queryClient],
  );

  // form submission handler
  const onSubmitStep = useCallback(
    async (step: number, data: FieldValues) => {
      // set form data
      const model = {
        ...formData,
        ...(data as OpportunityRequestBase),
      };
      setFormData(model);

      console.log("model", model);

      if (step === 8) {
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
      .min(6, "Opportunity title is required.")
      .max(200, "Opportunity title cannot exceed 50 characters."),
    description: z.string().min(6, "Description is required."),
    typeId: z.string({ required_error: "Opportunity type is required" }),
    categories: z
      .array(z.string(), { required_error: "Category is required" })
      .min(6, "Category is required."),
    uRL: z
      .string()
      .min(6, "Opportunity URL is required.")
      .max(2048, "Opportunity URL cannot exceed 2048 characters.")
      .url("Please enter a valid URL (e.g. http://www.example.com)")
      .optional()
      .or(z.literal("")),
  });

  const schemaStep2 = z.object({
    difficultyId: z.string({ required_error: "Difficulty is required" }),
    languages: z
      .array(z.string(), { required_error: "Language is required" })
      .min(6, "Language is required."),
    countries: z
      .array(z.string(), { required_error: "Country is required" })
      .min(6, "Country is required."),
    commitmentIntervalCount: z
      .union([z.nan(), z.null(), z.number()])
      .refine((val) => val != null && !isNaN(val), {
        message: "Time Value is required.",
      }),
    commitmentIntervalId: z.string({
      required_error: "Time Period is required.",
    }),
    dateStart: z
      .union([z.null(), z.string(), z.date()])
      .refine((val) => val !== null, {
        message: "Start Time is required.",
      }),
    //noEndDate: z.boolean(),
    dateEnd: z.union([z.string(), z.date(), z.null()]).optional(),
    participantLimit: z
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
      .min(6, "At least one skill is required."),
  });

  const schemaStep3 = z.object({
    zltoReward: z.union([z.nan(), z.null(), z.number()]).transform((val) => {
      // eslint-disable-next-line
      return val === null || Number.isNaN(val as any) ? undefined : val;
    }),
    zltoRewardPool: z
      .union([z.nan(), z.null(), z.number()])
      .transform((val) => {
        // eslint-disable-next-line
        return val === null || Number.isNaN(val as any) ? undefined : val;
      }),
    yomaReward: z.union([z.nan(), z.null(), z.number()]).transform((val) => {
      // eslint-disable-next-line
      return val === null || Number.isNaN(val as any) ? undefined : val;
    }),
    yomaRewardPool: z
      .union([z.nan(), z.null(), z.number()])
      .transform((val) => {
        // eslint-disable-next-line
        return val === null || Number.isNaN(val as any) ? undefined : val;
      }),
    skills: z
      .array(z.string(), { required_error: "At least one skill is required." })
      .min(6, "At least one skill is required."),
  });

  const schemaStep4 = z.object({
    keywords: z.array(z.string()),
  });

  const schemaStep5 = z.object({
    verificationTypes: z.array(z.string()),
  });

  const schemaStep6 = z.object({
    postAsActive: z.boolean(),
  });

  const {
    register: registerStep1,
    handleSubmit: handleSubmitStep1,
    setValue: setValueStep1,
    formState: { errors: errorsStep1, isValid: isValidStep1 },
    control: controlStep1,
  } = useForm({
    resolver: zodResolver(schemaStep6),
    //defaultValues: opportunity,
  });

  const {
    register: registerStep2,
    handleSubmit: handleSubmitStep2,
    formState: { errors: errorsStep2, isValid: isValidStep2 },
    control: controlStep2,
    watch: watchStep2,
  } = useForm({
    resolver: zodResolver(schemaStep2),
    //defaultValues: opportunity,
  });

  const {
    register: registerStep3,
    handleSubmit: handleSubmitStep3,
    setValue: setValueStep3,
    formState: { errors: errorsStep3, isValid: isValidStep3 },
    control: controlStep3,
  } = useForm({
    resolver: zodResolver(schemaStep3),
    //defaultValues: opportunity,
  });

  const {
    register: registerStep4,
    handleSubmit: handleSubmitStep4,
    setValue: setValueStep4,
    formState: { errors: errorsStep4, isValid: isValidStep4 },
    control: controlStep4,
  } = useForm({
    resolver: zodResolver(schemaStep4),
    //defaultValues: opportunity,
  });

  const {
    register: registerStep5,
    handleSubmit: handleSubmitStep5,
    setValue: setValueStep5,
    formState: { errors: errorsStep5, isValid: isValidStep5 },
    control: controlStep5,
  } = useForm({
    resolver: zodResolver(schemaStep5),
    //defaultValues: opportunity,
  });

  const {
    register: registerStep6,
    handleSubmit: handleSubmitStep6,
    setValue: setValueStep6,
    formState: { errors: errorsStep6, isValid: isValidStep6 },
    control: controlStep6,
  } = useForm({
    resolver: zodResolver(schemaStep6),
    //defaultValues: opportunity,
  });

  const watchNoEndDateCheck = watchStep2("noEndDate");

  return (
    <>
      {isLoading && <Loading />}
      <PageBackground />

      <div className="container z-10 max-w-5xl px-2 py-4">
        {/* BREADCRUMB */}
        <div className="flex flex-row text-xs text-gray">
          <Link
            className="font-bold text-white hover:text-gray"
            href={"/opportunities"}
          >
            Opportunities
          </Link>
          <div className="mx-2">/</div>
          <div className="max-w-[600px] overflow-hidden text-ellipsis whitespace-nowrap text-white">
            {opportunity?.title ?? "Create"}
          </div>
        </div>

        <div className="flex flex-col md:flex-row">
          {/* left vertical menu */}
          <ul className="menu hidden w-64 rounded-lg bg-base-200 md:flex">
            <li onClick={() => setStep(1)}>
              <a className="text-xsz">
                <span
                  className={`mr-2 rounded-full px-1.5 py-0.5 text-xs font-medium ${
                    isValidStep1 ? "bg-green" : "bg-gray"
                  }`}
                >
                  1
                </span>
                Opportunity information
              </a>
            </li>
            <li onClick={() => setStep(2)}>
              <a className="text-xsz">
                <span
                  className={`mr-2 rounded-full px-1.5 py-0.5 text-xs font-medium ${
                    isValidStep1 ? "bg-green" : "bg-gray"
                  }`}
                >
                  2
                </span>
                Opportunity details
              </a>
            </li>
            <li onClick={() => setStep(3)}>
              <a className="text-xsz">
                <span
                  className={`mr-2 rounded-full px-1.5 py-0.5 text-xs font-medium ${
                    isValidStep1 ? "bg-green" : "bg-gray"
                  }`}
                >
                  3
                </span>
                Rewards
              </a>
            </li>
            <li onClick={() => setStep(4)}>
              <a className="text-xsz">
                <span
                  className={`mr-2 rounded-full px-1.5 py-0.5 text-xs font-medium ${
                    isValidStep1 ? "bg-green" : "bg-gray"
                  }`}
                >
                  4
                </span>
                Keywords
              </a>
            </li>
            <li onClick={() => setStep(5)}>
              <a className="text-xsz">
                <span
                  className={`mr-2 rounded-full px-1.5 py-0.5 text-xs font-medium ${
                    isValidStep1 ? "bg-green" : "bg-gray"
                  }`}
                >
                  5
                </span>
                Verification type
              </a>
            </li>
            <li onClick={() => setStep(6)}>
              <a className="text-xsz">
                <span
                  className={`mr-2 rounded-full px-1.5 py-0.5 text-xs font-medium ${
                    isValidStep1 ? "bg-green" : "bg-gray"
                  }`}
                >
                  6
                </span>
                Credential
              </a>
            </li>
            <li onClick={() => setStep(7)}>
              <a className="text-xsz">
                <span
                  className={`mr-2 rounded-full px-1.5 py-0.5 text-xs font-medium ${
                    isValidStep1 ? "bg-green" : "bg-gray"
                  }`}
                >
                  7
                </span>
                Preview opportunity
              </a>
            </li>
          </ul>

          {/* dropdown menu */}
          <select
            className="select select-bordered select-sm md:hidden"
            onClick={(e: any) => {
              switch (e.target.value) {
                case "Opportunity information":
                  setStep(1);
                  break;
                case "Opportunity details":
                  setStep(2);
                  break;
                case "Rewards":
                  setStep(3);
                  break;
                case "Keywords":
                  setStep(4);
                  break;
                case "Verification type":
                  setStep(5);
                  break;
                case "Credential":
                  setStep(6);
                  break;
                case "Preview opportunity":
                  setStep(7);
                  break;
                default:
                  setStep(1);
                  break;
              }
            }}
          >
            <option>Opportunity information</option>
            <option>Opportunity details</option>
            <option>Rewards</option>
            <option>Keywords</option>
            <option>Verification type</option>
            <option>Credential</option>
            <option>Preview opportunity</option>
          </select>

          <div className="flex flex-grow flex-col items-center justify-center rounded-lg bg-white">
            {step === 1 && (
              <>
                <div className="flex flex-col">
                  <h5>Opportunity information</h5>
                  <p className="my-2">General opportunity information</p>
                </div>

                <form
                  className="flex flex-col gap-2"
                  onSubmit={handleSubmitStep6((data) => onSubmitStep(2, data))} // eslint-disable-line @typescript-eslint/no-misused-promises
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
                      {...registerStep6("title")}
                      contentEditable
                    />
                    {errorsStep6.title && (
                      <label className="label">
                        <span className="label-text-alt italic text-red-500">
                          {/* eslint-disable-next-line @typescript-eslint/restrict-template-expressions */}
                          {`${errorsStep6.title.message}`}
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
                      {...registerStep6("opportunityURL")}
                      contentEditable
                    />

                    {errorsStep6.opportunityURL && (
                      <label className="label">
                        <span className="label-text-alt italic text-red-500">
                          {`${errorsStep6.opportunityURL.message}`}
                        </span>
                      </label>
                    )}
                  </div>

                  <div className="form-control">
                    <label className="label font-bold">
                      <span className="label-text">Opportunity Type</span>
                    </label>
                    <Controller
                      control={controlStep6}
                      name="type"
                      render={({ field: { onChange, value } }) => (
                        <Select
                          classNames={{
                            control: () => "input input-bordered",
                          }}
                          options={opportunityTypes}
                          onChange={(val) => onChange(val?.value)}
                          value={opportunityTypes?.find(
                            (c) => c.value === value,
                          )}
                        />
                      )}
                    />

                    {errorsStep6.type && (
                      <label className="label">
                        <span className="label-text-alt italic text-red-500">
                          {/* eslint-disable-next-line @typescript-eslint/restrict-template-expressions */}
                          {`${errorsStep6.type.message}`}
                        </span>
                      </label>
                    )}
                  </div>

                  <div className="form-control">
                    <label className="label font-bold">
                      <span className="label-text">Difficulty</span>
                    </label>
                    <Controller
                      control={controlStep6}
                      name="difficulty"
                      render={({ field: { onChange, value } }) => (
                        <Select
                          classNames={{
                            control: () => "input input-bordered",
                          }}
                          isMulti={false}
                          options={difficulties}
                          onChange={(val) => onChange(val?.value)}
                          value={difficulties?.find((c) => c.value === value)}
                        />
                      )}
                    />

                    {errorsStep6.difficulty && (
                      <label className="label">
                        <span className="label-text-alt italic text-red-500">
                          {`${errorsStep6.difficulty.message}`}
                        </span>
                      </label>
                    )}
                  </div>

                  <div className="form-control">
                    <label className="label font-bold">
                      <span className="label-text">Languages</span>
                    </label>
                    <Controller
                      control={controlStep6}
                      name="language"
                      render={({ field: { onChange, value } }) => (
                        <Select
                          classNames={{
                            control: () => "input input-bordered",
                          }}
                          isMulti={true}
                          options={languages}
                          onChange={(val) => onChange(val.map((c) => c.value))}
                          value={languages?.filter(
                            (c) => value?.includes(c.value),
                          )}
                        />
                      )}
                    />

                    {errorsStep6.languages && (
                      <label className="label">
                        <span className="label-text-alt italic text-red-500">
                          {/* {errorsStep6.languages.message} */}
                        </span>
                      </label>
                    )}
                  </div>

                  <div className="form-control">
                    <label className="label font-bold">
                      <span className="label-text">Countries</span>
                    </label>
                    <Controller
                      control={controlStep6}
                      name="countries"
                      render={({ field: { onChange, value } }) => (
                        <Select
                          classNames={{
                            control: () => "input input-bordered",
                          }}
                          isMulti={true}
                          options={countries}
                          onChange={(val) => onChange(val.map((c) => c.value))}
                          value={countries?.filter(
                            (c) => value?.includes(c.value),
                          )}
                        />
                      )}
                    />

                    {errorsStep6.countries && (
                      <label className="label">
                        <span className="label-text-alt italic text-red-500">
                          {`${errorsStep6.countries.message}`}
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
                      {...registerStep6("description")}
                      onChange={(e) =>
                        setValueStep6("description", e.target.value)
                      }
                    />
                    {errorsStep6.description && (
                      <label className="label">
                        <span className="label-text-alt italic text-red-500">
                          {`${errorsStep6.description.message}`}
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
                            options={timeIntervals}
                            onChange={(val) => onChange(val?.value)}
                            value={timeIntervals?.find(
                              (c) => c.value === value,
                            )}
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
                        name="dateStart"
                        render={({ field: { onChange, value } }) => (
                          <DatePicker
                            className="input input-bordered"
                            onChange={(date) => onChange(date)}
                            selected={value ? new Date(value) : null}
                            placeholderText="Start Date"
                          />
                        )}
                      />
                      {errorsStep2.dateStart && (
                        <label className="label">
                          <span className="label-text-alt italic text-red-500">
                            {/* {errorsStep2.dateStart.message} */}
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
                        name="dateEnd"
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
                          {/* {errorsStep2.endTime.message} */}
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
                      // setValueAs={(v) => (v === "" ? undefined : parseInt(v, 60))}
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
                              defaultOptions={skills}
                              cacheOptions
                              //loadOptions={loadSkills as any}
                              onChange={(val) =>
                                onChange(val.map((c) => c.value))
                              }
                              value={value?.map((val: any) => ({
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
                        setStep(6);
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
        </div>
      </div>
    </>
  );
};

OpportunityDetails.getLayout = function getLayout(page: ReactElement) {
  return <MainLayout>{page}</MainLayout>;
};

export default withAuth(OpportunityDetails);
