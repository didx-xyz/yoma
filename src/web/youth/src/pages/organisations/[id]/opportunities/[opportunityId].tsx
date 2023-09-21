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
  OpportunityVerificationType,
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
  getCategories,
} from "~/api/services/opportunities";
import MainLayout from "~/components/Layout/Main";
import { ApiErrors } from "~/components/Status/ApiErrors";
import { Loading } from "~/components/Status/Loading";
import withAuth from "~/context/withAuth";
import { authOptions, type User } from "~/server/auth";
import { type NextPageWithLayout } from "../../../_app";
import { PageBackground } from "~/components/PageBackground";
import Link from "next/link";
import { IoMdArrowRoundBack, IoMdInformationCircle } from "react-icons/io";
import CreatableSelect from "react-select/creatable";

interface IParams extends ParsedUrlQuery {
  id: string;
  opportunityId: string;
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const { id, opportunityId } = context.params as IParams;
  const queryClient = new QueryClient();
  const session = await getServerSession(context.req, context.res, authOptions);

  // UND_ERR_HEADERS_OVERFLOW ISSUE: disable prefetching for now
  //   await queryClient.prefetchQuery(["categories"], async () =>
  //   (await getCategories(context)).map((c) => ({
  //     value: c.id,
  //     label: c.name,
  //   })),
  // );
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

  const { data: categories } = useQuery<SelectOption[]>({
    queryKey: ["categories"],
    queryFn: async () =>
      (await getCategories()).map((c) => ({
        value: c.id,
        label: c.name,
      })),
  });
  const { data: countries } = useQuery<SelectOption[]>({
    queryKey: ["countries"],
    queryFn: async () =>
      (await getCountries()).map((c) => ({
        value: c.id,
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
  const { data: verificationTypes } = useQuery<OpportunityVerificationType[]>({
    queryKey: ["verificationTypes"],
    queryFn: async () => await getVerificationTypes(),
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

  // skills cache. searched items are added to this cache
  const [skillsCache, setSkillsCache] = useState<SelectOption[]>([]);
  useMemo(() => {
    setSkillsCache(skills!);
  }, [skills, setSkillsCache]);

  const { data: opportunity } = useQuery<Opportunity>({
    queryKey: ["opportunity", opportunityId],
    queryFn: () => getOpportunityById(opportunityId),
    enabled: opportunityId !== "create",
  });

  const loadSkills = useCallback(
    (inputValue: string) =>
      new Promise<SelectOption[]>((resolve) => {
        /* eslint-disable */
        setTimeout(() => {
          if (inputValue.length < 3) resolve(skillsCache!);
          else {
            const data = getSkills({
              nameContains: inputValue,
              pageNumber: 1,
              pageSize: 60,
            }).then(
              (res) => res?.items?.map((c) => ({ value: c.id, label: c.name })),
            );

            // add skills if not already added to skillsCache
            data?.then((res) => {
              res?.forEach((s) => {
                if (!skillsCache.find((x) => x.value === s.value)) {
                  setSkillsCache((prev) => [...prev, s]);
                }
              });
            });

            resolve(data as any);
          }
        }, 6000);
        /* eslint-enable */
      }),
    [skillsCache, setSkillsCache],
  );

  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const handleCancel = () => {
    void router.push(`/organisation/${id}/opportunities`);
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
    verificationSupported: opportunity?.verificationSupported ?? false,
    verificationTypes: opportunity?.verificationTypes ?? [],

    sSIIntegrated: opportunity?.sSIIntegrated ?? false,

    organizationId: id,
    postAsActive: opportunity?.published ?? false,

    //TODO:
    instructions: opportunity?.instructions ?? "",
    //noEndDate: opportunity?.noEndDate ?? false,
    //participantLimit: null,
    //instructions: "..",
  });

  const onSubmit = useCallback(
    async (data: OpportunityRequestBase) => {
      setIsLoading(true);
      console.log("data:", data);
      //return;

      // data.verificationTypes = data.verificationTypes.filter(
      //   (x) => x.key != null && x.key != undefined && x.key != false,
      // );
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
      .min(1, "Opportunity title is required.")
      .max(255, "Opportunity title cannot exceed 255 characters."),
    description: z.string().min(1, "Description is required."),
    typeId: z.string({ required_error: "Opportunity type is required" }),
    categories: z
      .array(z.string(), { required_error: "Category is required" })
      .min(1, "Category is required."),
    uRL: z
      .string()
      .min(1, "Opportunity URL is required.")
      .max(2048, "Opportunity URL cannot exceed 2048 characters.")
      .url("Please enter a valid URL (e.g. http://www.example.com)"),
    //.optional()
    // .or(z.literal("")),
  });

  const schemaStep2 = z.object({
    difficultyId: z.string({ required_error: "Difficulty is required" }),
    languages: z
      .array(z.string(), { required_error: "Language is required" })
      .min(1, "Language is required."),
    countries: z
      .array(z.string(), { required_error: "Country is required" })
      .min(1, "Country is required."),
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
    participantLimit: z.union([z.nan(), z.null(), z.number()]).optional(),
      // eslint-disable-next-line
    // .refine((val) => val !== null && !Number.isNaN(val as any), {
    //   message: "Participant Limit is required.",
    // }),
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
    // skills: z
    //   .array(z.string(), {
    //     required_error: "At least one skill is required.",
    //   })
    //   .min(1, "At least one skill is required."),
    skills: z.array(z.string()).optional(),
  });

  const schemaStep4 = z.object({
    keywords: z.array(z.string()).optional(),
    // keywords: z
    //   .array(z.string(), {
    //     required_error: "At least one keyword is required.",
    //   })
    //   .min(1, "At least one keyword is required."),
  });

  const schemaStep5 = z
    .object({
      verificationSupported: z.boolean(),
      verificationTypes: z
        .array(
          z.object({
            type: z.any(),
            description: z
              .string({
                required_error: "Description is required",
    })
              .optional(),
          }),
          //z.any(),
        )
        .optional(),
    })
    .superRefine((values, ctx) => {
      if (!values.verificationSupported) return;

      const count =
        values?.verificationTypes?.filter(
          (x) => x.type != null && x.type != undefined && x.type != false,
        )?.length ?? 0;

      if (count === 0) {
        ctx.addIssue({
          message: "At least one verification type is required.",
          code: z.ZodIssueCode.custom,
          path: ["verificationTypes"],
          fatal: true,
        });
        return z.NEVER;
      }

      for (const item of values.verificationTypes!) {
        if (item?.type && !item.description) {
          // set default value for description
          // item.description =
          //   verificationTypes?.find((x) => x.type == item.type)?.description ??
          //   "";
        ctx.addIssue({
            message: "A description is required for each type of proof.",
          code: z.ZodIssueCode.custom,
          path: ["verificationTypes"],
        });

      for (const file of values.verificationTypes) {
        if (file?.type && !file.description) {
          ctx.addIssue({
            message: "A description for each verification type is required .",
            code: z.ZodIssueCode.custom,
            path: ["verificationTypes"],
          });
        }
      }
    })
    .transform((values) => {
      // remove non-selected verification types
      values.verificationTypes =
        values.verificationTypes?.filter(
          (x) => x.type != null && x.type != undefined && x.type != false,
        ) ?? [];
      return values;
    });

  const schemaStep6 = z.object({
    sSIIntegrated: z.boolean(),
  });

  const schemaStep7 = z.object({
    postAsActive: z.boolean(),
  });

  const {
    register: registerStep1,
    handleSubmit: handleSubmitStep1,
    setValue: setValueStep1,
    formState: { errors: errorsStep1, isValid: isValidStep1 },
    control: controlStep1,
  } = useForm({
    resolver: zodResolver(schemaStep1),
    //defaultValues: opportunity,
  });

  const {
    register: registerStep2,
    handleSubmit: handleSubmitStep2,
    formState: { errors: errorsStep2, isValid: isValidStep2 },
    control: controlStep2,
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
    getValues: getValuesStep5,
    setValue: setValueStep5,
    formState: { errors: errorsStep5, isValid: isValidStep5 },
    control: controlStep5,
    watch: watchStep5,
  } = useForm({
    resolver: zodResolver(schemaStep5),
    // defaultValues: {
    //   verificationSupported: opportunity?.verificationSupported ?? false,
    //   verificationTypes: opportunity?.verificationTypes ?? verificationTypes,
    // },
  });
  const watchVerificationSupported = watchStep5("verificationSupported");
  const watchVerificationTypes = watchStep5("verificationTypes");

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

  const {
    register: registerStep7,
    handleSubmit: handleSubmitStep7,
    setValue: setValueStep7,
    formState: { errors: errorsStep7, isValid: isValidStep7 },
    control: controlStep7,
  } = useForm({
    resolver: zodResolver(schemaStep7),
    //defaultValues: opportunity,
  });

  return (
    <>
      {isLoading && <Loading />}
      <PageBackground />

      <div className="container z-10 max-w-5xl px-2 py-4">
        {/* BREADCRUMB */}
        <div
          //className="flex flex-row text-xs text-gray"
          className="breadcrumbs text-sm"
        >
          <ul>
            <li>
              <Link
                className="font-bold text-white hover:text-gray"
                href={`/organisations/${id}/opportunities`}
              >
                <IoMdArrowRoundBack className="mr-1 inline-block h-4 w-4" />
                Opportunities
              </Link>
            </li>
            <li>
              <div className="max-w-[600px] overflow-hidden text-ellipsis whitespace-nowrap text-white">
                {opportunity?.title ?? "Create"}
              </div>
            </li>
          </ul>
        </div>

        <h4 className="pb-2 pl-5 text-white">
          {opportunityId == "create" ? "New opportunity" : opportunity?.title}
        </h4>

        <div className="flex flex-col gap-2 md:flex-row">
          {/* left vertical menu */}
          <ul className="menu hidden w-64 gap-2 rounded-lg bg-base-200 font-semibold md:flex">
            <li onClick={() => setStep(1)}>
              <a
                className={`menu-title ${
                  step === 1
                    ? "bg-green-light text-green hover:bg-green-light"
                    : "bg-gray text-gray-dark"
                }`}
              >
                <span
                  className={`mr-2 rounded-full px-1.5 py-0.5 text-xs font-medium text-white ${
                    isValidStep1 ? "bg- bg-green" : "bg-gray-dark"
                  }`}
                >
                  1
                </span>
                Opportunity information
              </a>
            </li>
            <li onClick={() => setStep(2)}>
              <a
                className={`menu-title ${
                  step === 2
                    ? "bg-green-light text-green hover:bg-green-light"
                    : "bg-gray text-gray-dark"
                }`}
              >
                <span
                  className={`mr-2 rounded-full px-1.5 py-0.5 text-xs font-medium text-white ${
                    isValidStep2 ? "bg- bg-green" : "bg-gray-dark"
                  }`}
                >
                  2
                </span>
                Opportunity details
              </a>
            </li>
            <li onClick={() => setStep(3)}>
              <a
                className={`menu-title ${
                  step === 3
                    ? "bg-green-light text-green hover:bg-green-light"
                    : "bg-gray text-gray-dark"
                }`}
              >
                <span
                  className={`mr-2 rounded-full px-1.5 py-0.5 text-xs font-medium text-white ${
                    isValidStep3 ? "bg- bg-green" : "bg-gray-dark"
                  }`}
                >
                  3
                </span>
                Rewards
              </a>
            </li>
            <li onClick={() => setStep(4)}>
              <a
                className={`menu-title ${
                  step === 4
                    ? "bg-green-light text-green hover:bg-green-light"
                    : "bg-gray text-gray-dark"
                }`}
              >
                <span
                  className={`mr-2 rounded-full px-1.5 py-0.5 text-xs font-medium text-white ${
                    isValidStep4 ? "bg- bg-green" : "bg-gray-dark"
                  }`}
                >
                  4
                </span>
                Keywords
              </a>
            </li>
            <li onClick={() => setStep(5)}>
              <a
                className={`menu-title ${
                  step === 5
                    ? "bg-green-light text-green hover:bg-green-light"
                    : "bg-gray text-gray-dark"
                }`}
              >
                <span
                  className={`mr-2 rounded-full px-1.5 py-0.5 text-xs font-medium text-white ${
                    isValidStep5 ? "bg- bg-green" : "bg-gray-dark"
                  }`}
                >
                  5
                </span>
                Verification type
              </a>
            </li>
            <li onClick={() => setStep(6)}>
              <a
                className={`menu-title ${
                  step === 6
                    ? "bg-green-light text-green hover:bg-green-light"
                    : "bg-gray text-gray-dark"
                }`}
              >
                <span
                  className={`mr-2 rounded-full px-1.5 py-0.5 text-xs font-medium text-white ${
                    isValidStep6 ? "bg-green" : "bg-gray-dark"
                  }`}
                >
                  6
                </span>
                Credential
              </a>
            </li>
            <li onClick={() => setStep(7)}>
              <a
                className={`menu-title ${
                  step === 7
                    ? "bg-green-light text-green hover:bg-green-light"
                    : "bg-gray text-gray-dark"
                }`}
              >
                <span
                  className={`mr-2 rounded-full bg-gray-dark px-1.5 py-0.5 text-xs font-medium text-white ${
                    isValidStep1 &&
                    isValidStep2 &&
                    isValidStep3 &&
                    isValidStep4 &&
                    isValidStep5 &&
                    isValidStep6 &&
                    isValidStep7
                      ? "bg-green"
                      : "bg-gray-dark"
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

          {/* forms */}
          <div className="flex flex-grow flex-col items-center rounded-lg bg-white">
            <div className="flex w-full max-w-xl flex-col p-4">
              {step === 1 && (
                <>
                  <div className="flex flex-col">
                    <h6 className="font-bold">Opportunity information</h6>
                    <p className="my-2 text-sm">
                      Information about the opportunity that young people can
                      explore
                    </p>
                  </div>

                  <form
                    className="flex flex-col gap-2"
                    onSubmit={handleSubmitStep1((data) =>
                      onSubmitStep(2, data),
                    )} // eslint-disable-line @typescript-eslint/no-misused-promises
                  >
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">Opportunity title</span>
                      </label>
                      <input
                        type="text"
                        className="input input-bordered rounded-md"
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
                      <label className="label">
                        <span className="label-text">Opportunity type</span>
                      </label>
                      <Controller
                        control={controlStep1}
                        name="typeId"
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

                      {errorsStep1.typeId && (
                        <label className="label">
                          <span className="label-text-alt italic text-red-500">
                            {/* eslint-disable-next-line @typescript-eslint/restrict-template-expressions */}
                            {`${errorsStep1.typeId.message}`}
                          </span>
                        </label>
                      )}
                    </div>

                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">
                          Under which categories does your opportunity belong
                        </span>
                      </label>
                      <Controller
                        control={controlStep1}
                        name="categories"
                        render={({ field: { onChange, value } }) => (
                          <Select
                            classNames={{
                              control: () => "input input-bordered",
                            }}
                            isMulti={true}
                            options={categories}
                            onChange={(val) =>
                              onChange(val?.map((c) => c.value ?? ""))
                            }
                            value={categories?.filter(
                              (c) => value?.includes(c.value),
                            )}
                          />
                        )}
                      />

                      {errorsStep1.categories && (
                        <label className="label">
                          <span className="label-text-alt italic text-red-500">
                            {/* eslint-disable-next-line @typescript-eslint/restrict-template-expressions */}
                            {`${errorsStep1.categories.message}`}
                          </span>
                        </label>
                      )}
                    </div>

                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">Opportunity link</span>
                      </label>
                      <input
                        type="text"
                        className="input input-bordered rounded-md"
                        placeholder="Opportunity Link"
                        {...registerStep1("uRL")}
                        contentEditable
                      />

                      {errorsStep1.uRL && (
                        <label className="label">
                          <span className="label-text-alt italic text-red-500">
                            {`${errorsStep1.uRL.message}`}
                          </span>
                        </label>
                      )}
                    </div>

                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">Description</span>
                      </label>
                      <textarea
                        className="textarea textarea-bordered h-24"
                        placeholder="Description"
                        {...registerStep1("description")}
                        onChange={(e) =>
                          setValueStep1("description", e.target.value)
                        }
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
                  <div className="flex flex-col">
                    <h6 className="font-bold">Opportunity detail</h6>
                    <p className="my-2 text-sm">
                      Detailed particulars about the opportunity
                    </p>
                  </div>

                  <form
                    className="flex flex-col gap-2"
                    onSubmit={handleSubmitStep2((data) =>
                      onSubmitStep(3, data),
                    )}
                  >
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">Opportunity language</span>
                      </label>
                      <Controller
                        control={controlStep2}
                        name="languages"
                        render={({ field: { onChange, value } }) => (
                          <Select
                            classNames={{
                              control: () => "input input-bordered",
                            }}
                            isMulti={true}
                            options={languages}
                            onChange={(val) =>
                              onChange(val.map((c) => c.value))
                            }
                            value={languages?.filter(
                              (c) => value?.includes(c.value),
                            )}
                          />
                        )}
                      />

                      {errorsStep2.languages && (
                        <label className="label">
                          <span className="label-text-alt italic text-red-500">
                            {`${errorsStep2.languages.message}`}
                          </span>
                        </label>
                      )}
                    </div>

                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">
                          Country or region of opportunity
                        </span>
                      </label>
                      <Controller
                        control={controlStep2}
                        name="countries"
                        render={({ field: { onChange, value } }) => (
                          <Select
                            classNames={{
                              control: () => "input input-bordered",
                            }}
                            isMulti={true}
                            options={countries}
                            onChange={(val) =>
                              onChange(val.map((c) => c.value))
                            }
                            value={countries?.filter(
                              (c) => value?.includes(c.value),
                            )}
                          />
                        )}
                      />

                      {errorsStep2.countries && (
                        <label className="label">
                          <span className="label-text-alt italic text-red-500">
                            {`${errorsStep2.countries.message}`}
                          </span>
                        </label>
                      )}
                    </div>

                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">
                          Opportunity difficulty level
                        </span>
                      </label>
                      <Controller
                        control={controlStep2}
                        name="difficultyId"
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

                      {errorsStep2.difficultyId && (
                        <label className="label">
                          <span className="label-text-alt italic text-red-500">
                            {`${errorsStep2.difficultyId.message}`}
                          </span>
                        </label>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="form-control">
                        <label className="label">
                          <span className="label-text">Number of</span>
                        </label>
                        <input
                          type="number"
                          className="input input-bordered w-full"
                          placeholder="Enter number"
                          {...registerStep2("commitmentIntervalCount", {
                            valueAsNumber: true,
                          })}
                        />
                        {errorsStep2.commitmentIntervalCount && (
                          <label className="label">
                            <span className="label-text-alt italic text-red-500">
                              {/* eslint-disable-next-line @typescript-eslint/restrict-template-expressions */}
                              {`${errorsStep2.commitmentIntervalCount.message}`}
                            </span>
                          </label>
                        )}
                      </div>

                      <div className="form-control">
                        <label className="label">
                          <span className="label-text">Select time frame</span>
                        </label>
                        <Controller
                          control={controlStep2}
                          name="commitmentIntervalId"
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

                        {errorsStep2.commitmentIntervalId && (
                          <label className="label">
                            <span className="label-text-alt italic text-red-500">
                              {/* eslint-disable-next-line @typescript-eslint/restrict-template-expressions */}
                              {`${errorsStep2.commitmentIntervalId.message}`}
                            </span>
                          </label>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="form-control">
                        <label className="label">
                          <span className="label-text">
                            Opportunity start date
                          </span>
                        </label>
                        <Controller
                          control={controlStep2}
                          name="dateStart"
                          render={({ field: { onChange, value } }) => (
                            <DatePicker
                              className="input input-bordered rounded-md"
                              onChange={(date) => onChange(date)}
                              selected={value ? new Date(value) : null}
                              placeholderText="Start Date"
                            />
                          )}
                        />
                        {errorsStep2.dateStart && (
                          <label className="label">
                            <span className="label-text-alt italic text-red-500">
                              {`${errorsStep2.dateStart.message}`}
                            </span>
                          </label>
                        )}
                      </div>

                      <div className="form-control">
                        <label className="label">
                          <span className="label-text">
                            Opportunity end date
                          </span>
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

                        {errorsStep2.dateEnd && (
                          <label className="label">
                            <span className="label-text-alt italic text-red-500">
                              {`${errorsStep2.dateEnd.message}`}
                            </span>
                          </label>
                        )}
                      </div>
                    </div>

                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">
                          Opportunity participant limit
                        </span>
                      </label>

                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="number"
                          className="input input-bordered rounded-md"
                          placeholder="Count of participants"
                          {...registerStep2("participantLimit", {
                            valueAsNumber: true,
                          })}
                        />
                      </div>

                      {errorsStep2.participantLimit && (
                        <label className="label">
                          <span className="label-text-alt italic text-red-500">
                            {/* eslint-disable-next-line @typescript-eslint/restrict-template-expressions */}
                            {`${errorsStep2.participantLimit.message}`}
                          </span>
                        </label>
                      )}
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
                        Next
                      </button>
                    </div>
                  </form>
                </>
              )}
              {step === 3 && (
                <>
                  <div className="flex flex-col">
                    <h6 className="font-bold">Rewards</h6>
                    <p className="my-2 text-sm">
                      Choose the reward that young participants will earn after
                      successfully completing the opportunity
                    </p>
                  </div>

                  <form
                    className="flex flex-col gap-2"
                    onSubmit={handleSubmitStep3((data) =>
                      onSubmitStep(4, data),
                    )}
                  >
                    <div className="grid grid-cols-2 gap-2">
                      <div className="form-control">
                        <label className="label">
                          <span className="label-text">Yoma Reward</span>
                        </label>
                        <input
                          type="number"
                          className="input input-bordered rounded-md"
                          placeholder="Enter reward amount"
                          {...registerStep3("yomaReward", {
                            valueAsNumber: true,
                          })}
                          // setValueAs={(v) => (v === "" ? undefined : parseInt(v, 60))}
                        />
                        {errorsStep3.yomaReward && (
                          <label className="label">
                            <span className="label-text-alt italic text-red-500">
                              {/* eslint-disable-next-line @typescript-eslint/restrict-template-expressions */}
                              {`${errorsStep3.yomaReward.message}`}
                            </span>
                          </label>
                        )}
                      </div>
                      <div className="form-control">
                        <label className="label">
                          <span className="label-text">Yoma Reward Pool</span>
                        </label>
                        <input
                          type="number"
                          className="input input-bordered rounded-md"
                          placeholder="Enter reward pool amount"
                          {...registerStep3("yomaRewardPool", {
                            valueAsNumber: true,
                          })}
                          // setValueAs={(v) => (v === "" ? undefined : parseInt(v, 60))}
                        />
                        {errorsStep3.yomaRewardPool && (
                          <label className="label">
                            <span className="label-text-alt italic text-red-500">
                              {/* eslint-disable-next-line @typescript-eslint/restrict-template-expressions */}
                              {`${errorsStep3.yomaRewardPool.message}`}
                            </span>
                          </label>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="form-control">
                        <label className="label">
                          <span className="label-text">ZLTO Reward</span>
                        </label>
                        <input
                          type="number"
                          className="input input-bordered rounded-md"
                          placeholder="Enter reward amount"
                          {...registerStep3("zltoReward", {
                            valueAsNumber: true,
                          })}
                          // setValueAs={(v) => (v === "" ? undefined : parseInt(v, 60))}
                        />
                        {errorsStep3.zltoReward && (
                          <label className="label">
                            <span className="label-text-alt italic text-red-500">
                              {/* eslint-disable-next-line @typescript-eslint/restrict-template-expressions */}
                              {`${errorsStep3.zltoReward.message}`}
                            </span>
                          </label>
                        )}
                      </div>
                      <div className="form-control">
                        <label className="label">
                          <span className="label-text">ZLTO Reward Pool</span>
                        </label>
                        <input
                          type="number"
                          className="input input-bordered rounded-md"
                          placeholder="Enter reward pool amount"
                          {...registerStep3("zltoRewardPool", {
                            valueAsNumber: true,
                          })}
                          // setValueAs={(v) => (v === "" ? undefined : parseInt(v, 60))}
                        />
                        {errorsStep3.zltoRewardPool && (
                          <label className="label">
                            <span className="label-text-alt italic text-red-500">
                              {/* eslint-disable-next-line @typescript-eslint/restrict-template-expressions */}
                              {`${errorsStep3.zltoRewardPool.message}`}
                            </span>
                          </label>
                        )}
                      </div>
                    </div>

                    <h6 className="font-bold">Skills</h6>

                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">
                          Which skills will the Youth be awarded with upon
                          completion?
                        </span>
                      </label>
                      <Controller
                        control={controlStep3}
                        name="skills"
                        render={({ field: { onChange, value } }) => (
                          <>
                            {/* eslint-disable  */}
                            <AsyncSelect
                              classNames={{
                                control: () =>
                                  "input input-bordered-full overflow-y-scroll",
                              }}
                              styles={{
                                control: (base) => ({
                                  ...base,
                                  maxHeight: 200,
                                }),
                              }}
                              isMulti={true}
                              defaultOptions={skillsCache}
                              cacheOptions
                              loadOptions={loadSkills as any}
                              onChange={(val) =>
                                onChange(val.map((c) => c.value))
                              }
                              value={skillsCache?.filter(
                                (c) => value?.includes(c.value),
                              )}
                            />
                            {/* eslint-enable  */}
                          </>
                        )}
                      />
                      {errorsStep3.skills && (
                        <label className="label">
                          <span className="label-text-alt italic text-red-500">
                            {/* eslint-disable-next-line @typescript-eslint/restrict-template-expressions */}
                            {`${errorsStep3.skills.message}`}
                          </span>
                        </label>
                      )}
                    </div>

                    {/* BUTTONS */}
                    <div className="my-4 flex items-center justify-center gap-2">
                      <button
                        type="button"
                        className="btn btn-warning btn-sm flex-grow"
                        onClick={() => {
                          setStep(2);
                        }}
                      >
                        Back
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
              {step === 4 && (
                <>
                  <div className="flex flex-col">
                    <h6 className="font-bold">Keywords</h6>
                    <p className="my-2 text-sm">
                      Boost your chances of being found in searches by adding
                      keywords to your opportunity
                    </p>
                  </div>

                  <form
                    className="flex h-full flex-col gap-2"
                    onSubmit={handleSubmitStep4((data) =>
                      onSubmitStep(5, data),
                    )}
                  >
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">Opportunity keywords</span>
                      </label>
                      <Controller
                        control={controlStep4}
                        name="keywords"
                        render={({ field: { onChange, value } }) => (
                          <>
                            {/* eslint-disable */}
                            <CreatableSelect
                              classNames={{
                                control: () =>
                                  "input input-bordered-full overflow-y-scroll",
                              }}
                              styles={{
                                control: (base) => ({
                                  ...base,
                                  maxHeight: 200,
                                }),
                              }}
                              isMulti={true}
                              onChange={(val) =>
                                onChange(val.map((c) => c.value))
                              }
                              value={value?.map((c: any) => ({
                                value: c,
                                label: c,
                              }))}
                            />
                            {/* eslint-enable  */}
                          </>
                        )}
                      />
                      {errorsStep4.keywords && (
                        <label className="label">
                          <span className="label-text-alt italic text-red-500">
                            {/* eslint-disable-next-line @typescript-eslint/restrict-template-expressions */}
                            {`${errorsStep4.keywords.message}`}
                          </span>
                        </label>
                      )}
                    </div>

                    {/* BUTTONS */}
                    <div className="my-4 flex items-center justify-center gap-2">
                      <button
                        type="button"
                        className="btn btn-warning btn-sm flex-grow"
                        onClick={() => {
                          setStep(3);
                        }}
                      >
                        Back
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
              {step === 5 && (
                <>
                  <div className="flex flex-col">
                    <h6 className="font-bold">Verification</h6>
                    <p className="my-2 text-sm">
                      How can young participants confirm they're involvement?
                    </p>
                  </div>

                  <form
                    className="flex flex-col gap-2"
                    onSubmit={handleSubmitStep5((data) =>
                      onSubmitStep(6, data),
                    )}
                  >
                    <div className="form-control">
                      <Controller
                        control={controlStep5}
                        name="verificationSupported"
                        render={({ field: { onChange, value } }) => (
                          <>
                            <label
                              htmlFor="verificationSupportedYes"
                              className="label cursor-pointer justify-normal"
                            >
                              <input
                                type="radio"
                                className="radio-primary radio"
                                id="verificationSupportedYes"
                                onChange={() => onChange(true)}
                                checked={value === true}
                              />
                              <span className="label-text ml-4">
                                Youth should upload proof of completion
                              </span>
                            </label>

                            <label
                              htmlFor="verificationSupportedNo"
                              className="label cursor-pointer justify-normal"
                            >
                              <input
                                type="radio"
                                className="radio-primary radio"
                                id="verificationSupportedNo"
                                onChange={() => onChange(false)}
                                checked={value === false}
                              />
                              <span className="label-text ml-4">
                                No verification is required
                              </span>
                            </label>
                          </>
                        )}
                      />

                      {errorsStep5.verificationSupported && (
                        <label className="label font-bold">
                          <span className="label-text-alt italic text-red-500">
                            {/* eslint-disable-next-line @typescript-eslint/restrict-template-expressions */}
                            {`${errorsStep5.verificationSupported.message}`}
                          </span>
                        </label>
                      )}
                    </div>

                    {watchVerificationSupported && (
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">
                            Select the types of proof that participants need to
                            upload as part of completing the opportuntity.
                        </span>
                      </label>

                        <div className="flex flex-col gap-2">
                      {verificationTypes?.map((item, index) => (
                            // <Controller
                            //   key={item.id}
                            //   control={controlStep5}
                            //   name="verificationTypes"
                            //   render={({ field: { onChange, value } }) => (
                            //     <>
                            <div className="flex flex-col" key={item.id}>
                          {/* checkbox label */}
                          <label
                            htmlFor={item.id}
                            className="label w-full cursor-pointer justify-normal"
                          >
                            <input
                              {...registerStep5(
                                    `verificationTypes.${index}.type`,
                              )}
                              type="checkbox"
                              value={item.type}
                              id={item.id}
                              className="checkbox-primary checkbox"
                              disabled={!watchVerificationSupported}
                            />
                            <span className="label-text ml-4">
                              {item.displayName}
                            </span>
                          </label>
                          {/* description input */}
                              {watchVerificationTypes?.find(
                                (x: OpportunityVerificationType) =>
                                  x.type === item.type,
                              ) && (
                          <div className="form-control w-full">
                                  <label className="label">
                                    <span className="label-text">
                                      Description
                                    </span>
                                  </label>
                            <input
                              type="text"
                              className="input input-bordered input-sm rounded-md"
                                    placeholder="Enter description"
                              {...registerStep5(
                                      `verificationTypes.${index}.description`,
                              )}
                              contentEditable
                                    // value={value ?? item.description}
                                    defaultValue={item.description}
                              disabled={!watchVerificationSupported}
                            />
                          </div>
                              )}
                        </div>
                            //     </>
                            //   )}
                            // />
                      ))}
                        </div>
                        {errorsStep5.verificationTypes?.root && (
                        <label className="label font-bold">
                          <span className="label-text-alt italic text-red-500">
                            {/* eslint-disable-next-line @typescript-eslint/restrict-template-expressions */}
                              {`${errorsStep5.verificationTypes.root.message}`}
                          </span>
                        </label>
                      )}
                    </div>
                    )}

                    {/* BUTTONS */}
                    <div className="my-4 flex items-center justify-center gap-2">
                      <button
                        type="button"
                        className="btn btn-warning btn-sm flex-grow"
                        onClick={() => {
                          setStep(4);
                        }}
                      >
                        Back
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
              {step === 6 && (
                <>
                  <div className="flex flex-col">
                    <h6 className="font-bold">Credential</h6>
                    <p className="my-2 text-sm">
                      Information about the credential that Youth will receive
                      upon completion of this opportunity
                    </p>
                  </div>

                  <form
                    className="flex flex-col gap-2"
                    onSubmit={handleSubmitStep6((data) =>
                      onSubmitStep(7, data),
                    )}
                  >
                    <div className="form-control">
                      {/* checkbox label */}
                      <label
                        htmlFor="sSIIntegrated"
                        className="label w-full cursor-pointer justify-normal"
                      >
                        <input
                          {...registerStep6(`sSIIntegrated`)}
                          type="checkbox"
                          //value={item.value}
                          id="sSIIntegrated"
                          className="checkbox-primary checkbox"
                        />
                        <span className="label-text ml-4">
                          I want to issue a credential upon completion
                        </span>
                      </label>
                    </div>
                    {errorsStep6.sSIIntegrated && (
                      <label className="label font-bold">
                        <span className="label-text-alt italic text-red-500">
                          {/* eslint-disable-next-line @typescript-eslint/restrict-template-expressions */}
                          {`${errorsStep6.sSIIntegrated.message}`}
                        </span>
                      </label>
                    )}
                    {/* BUTTONS */}
                    <div className="my-4 flex items-center justify-center gap-2">
                      <button
                        type="button"
                        className="btn btn-warning btn-sm flex-grow"
                        onClick={() => {
                          setStep(5);
                        }}
                      >
                        Back
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
              {step === 7 && (
                <>
                  <div className="flex flex-col">
                    <h6 className="font-bold">Opportunity preview</h6>
                    <p className="my-2 text-sm">
                      Detailed particulars about the opportunity
                    </p>
                  </div>

                  <form
                    className="flex flex-col gap-2"
                    onSubmit={handleSubmitStep7((data) =>
                      onSubmitStep(8, data),
                    )}
                  >
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text font-bold">
                          Opportunity title
                        </span>
                      </label>
                      <label className="label-text text-sm">
                        {formData.title}
                      </label>
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
                      <label className="label">
                        <span className="label-text font-bold">
                          Opportunity description
                        </span>
                      </label>
                      <label className="label-text text-sm">
                        {formData.description}
                      </label>
                      {errorsStep1.description && (
                        <label className="label">
                          <span className="label-text-alt italic text-red-500">
                            {/* eslint-disable-next-line @typescript-eslint/restrict-template-expressions */}
                            {`${errorsStep1.description.message}`}
                          </span>
                        </label>
                      )}
                    </div>

                    <div className="form-control">
                      <label className="label">
                        <span className="label-text font-bold">
                          Opportunity type
                        </span>
                      </label>
                      <label className="label-text text-sm">
                        {
                          opportunityTypes?.find(
                            (x) => x.value == formData.typeId,
                          )?.label
                        }
                      </label>
                      {errorsStep1.typeId && (
                        <label className="label">
                          <span className="label-text-alt italic text-red-500">
                            {/* eslint-disable-next-line @typescript-eslint/restrict-template-expressions */}
                            {`${errorsStep1.typeId.message}`}
                          </span>
                        </label>
                      )}
                    </div>

                    <div className="form-control">
                      <label className="label">
                        <span className="label-text font-bold">
                          Opportunity keywords
                        </span>
                      </label>
                      <label className="label-text text-sm">
                        {formData.keywords?.map((x: any) => x).join(", ")}
                      </label>
                      {errorsStep1.keywords && (
                        <label className="label">
                          <span className="label-text-alt italic text-red-500">
                            {/* eslint-disable-next-line @typescript-eslint/restrict-template-expressions */}
                            {`${errorsStep1.keywords.message}`}
                          </span>
                        </label>
                      )}
                    </div>

                    <div className="form-control">
                      <label className="label">
                        <span className="label-text font-bold">
                          Opportunity link
                        </span>
                      </label>
                      <label className="label-text text-sm">
                        <Link
                          className="link-primary link"
                          href={formData.uRL ?? "#"}
                          target="new"
                        >
                          {formData.uRL}
                        </Link>
                      </label>
                      {errorsStep1.uRL && (
                        <label className="label">
                          <span className="label-text-alt italic text-red-500">
                            {/* eslint-disable-next-line @typescript-eslint/restrict-template-expressions */}
                            {`${errorsStep1.uRL.message}`}
                          </span>
                        </label>
                      )}
                    </div>

                    <div className="form-control">
                      <label className="label">
                        <span className="label-text font-bold">
                          Opportunity languages
                        </span>
                      </label>
                      <label className="label-text text-sm">
                        {formData.languages
                          ?.map(
                            (x: any) =>
                              languages?.find((y) => y.value == x)?.label,
                          )
                          .join(", ")}
                      </label>
                      {errorsStep2.languages && (
                        <label className="label">
                          <span className="label-text-alt italic text-red-500">
                            {/* eslint-disable-next-line @typescript-eslint/restrict-template-expressions */}
                            {`${errorsStep2.languages.message}`}
                          </span>
                        </label>
                      )}
                    </div>

                    <div className="form-control">
                      <label className="label">
                        <span className="label-text font-bold">
                          Opportunity countries
                        </span>
                      </label>
                      <label className="label-text text-sm">
                        {formData.countries
                          ?.map(
                            (x: any) =>
                              countries?.find((y) => y.value == x)?.label,
                          )
                          .join(", ")}
                      </label>
                      {errorsStep2.countries && (
                        <label className="label">
                          <span className="label-text-alt italic text-red-500">
                            {/* eslint-disable-next-line @typescript-eslint/restrict-template-expressions */}
                            {`${errorsStep2.countries.message}`}
                          </span>
                        </label>
                      )}
                    </div>

                    <div className="form-control">
                      <label className="label">
                        <span className="label-text font-bold">
                          Opportunity difficulty
                        </span>
                      </label>
                      <label className="label-text text-sm">
                        {
                          difficulties?.find(
                            (x) => x.value == formData.difficultyId,
                          )?.label
                        }
                      </label>
                      {errorsStep2.difficultyId && (
                        <label className="label">
                          <span className="label-text-alt italic text-red-500">
                            {/* eslint-disable-next-line @typescript-eslint/restrict-template-expressions */}
                            {`${errorsStep2.difficultyId.message}`}
                          </span>
                        </label>
                      )}
                    </div>

                    <h6>Opporunity duration</h6>

                    <div className="form-control">
                      <label className="label">
                        <span className="label-text font-bold">
                          Opportunity duration
                        </span>
                      </label>
                      <label className="label-text text-sm">
                        {formData.commitmentIntervalCount}{" "}
                        {
                          timeIntervals?.find(
                            (x) => x.value == formData.commitmentIntervalId,
                          )?.label
                        }
                      </label>
                      {errorsStep2.commitmentIntervalCount && (
                        <label className="label">
                          <span className="label-text-alt italic text-red-500">
                            {/* eslint-disable-next-line @typescript-eslint/restrict-template-expressions */}
                            {`${errorsStep2.commitmentIntervalCount.message}`}
                          </span>
                        </label>
                      )}
                      {errorsStep2.commitmentIntervalId && (
                        <label className="label">
                          <span className="label-text-alt italic text-red-500">
                            {/* eslint-disable-next-line @typescript-eslint/restrict-template-expressions */}
                            {`${errorsStep2.commitmentIntervalId.message}`}
                          </span>
                        </label>
                      )}
                    </div>

                    <div className="form-control">
                      <label className="label">
                        <span className="label-text font-bold">Start date</span>
                      </label>
                      <label className="label-text text-sm">
                        {formData.dateStart?.toString()}
                      </label>
                      {errorsStep2.dateStart && (
                        <label className="label">
                          <span className="label-text-alt italic text-red-500">
                            {/* eslint-disable-next-line @typescript-eslint/restrict-template-expressions */}
                            {`${errorsStep2.dateStart.message}`}
                          </span>
                        </label>
                      )}
                    </div>
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text font-bold">End date</span>
                      </label>
                      <label className="label-text text-sm">
                        {formData.dateEnd?.toString()}
                      </label>
                      {errorsStep2.dateEnd && (
                        <label className="label">
                          <span className="label-text-alt italic text-red-500">
                            {/* eslint-disable-next-line @typescript-eslint/restrict-template-expressions */}
                            {`${errorsStep2.dateEnd.message}`}
                          </span>
                        </label>
                      )}
                    </div>

                    <div className="form-control">
                      <label className="label">
                        <span className="label-text font-bold">
                          Yoma Reward
                        </span>
                      </label>
                      <label className="label-text text-sm">
                        {formData.yomaReward}
                      </label>
                      {errorsStep2.yomaReward && (
                        <label className="label">
                          <span className="label-text-alt italic text-red-500">
                            {/* eslint-disable-next-line @typescript-eslint/restrict-template-expressions */}
                            {`${errorsStep2.yomaReward.message}`}
                          </span>
                        </label>
                      )}
                    </div>

                    <div className="form-control">
                      <label className="label">
                        <span className="label-text font-bold">
                          Yoma Reward Pool
                        </span>
                      </label>
                      <label className="label-text text-sm">
                        {formData.yomaRewardPool}
                      </label>
                      {errorsStep2.yomaRewardPool && (
                        <label className="label">
                          <span className="label-text-alt italic text-red-500">
                            {/* eslint-disable-next-line @typescript-eslint/restrict-template-expressions */}
                            {`${errorsStep2.yomaRewardPool.message}`}
                          </span>
                        </label>
                      )}
                    </div>

                    <div className="form-control">
                      <label className="label">
                        <span className="label-text font-bold">
                          Zlto Reward
                        </span>
                      </label>
                      <label className="label-text text-sm">
                        {formData.zltoReward}
                      </label>
                      {errorsStep2.zltoReward && (
                        <label className="label">
                          <span className="label-text-alt italic text-red-500">
                            {/* eslint-disable-next-line @typescript-eslint/restrict-template-expressions */}
                            {`${errorsStep2.zltoReward.message}`}
                          </span>
                        </label>
                      )}
                    </div>

                    <div className="form-control">
                      <label className="label">
                        <span className="label-text font-bold">
                          Zlto Reward Pool
                        </span>
                      </label>
                      <label className="label-text text-sm">
                        {formData.zltoRewardPool}
                      </label>
                      {errorsStep2.zltoRewardPool && (
                        <label className="label">
                          <span className="label-text-alt italic text-red-500">
                            {/* eslint-disable-next-line @typescript-eslint/restrict-template-expressions */}
                            {`${errorsStep2.zltoRewardPool.message}`}
                          </span>
                        </label>
                      )}
                    </div>

                    <div className="form-control">
                      <label className="label">
                        <span className="label-text font-bold">
                          Participants
                        </span>
                      </label>
                      <label className="label-text text-sm">
                        {formData.participantLimit}
                      </label>
                      {errorsStep2.participantLimit && (
                        <label className="label">
                          <span className="label-text-alt italic text-red-500">
                            {/* eslint-disable-next-line @typescript-eslint/restrict-template-expressions */}
                            {`${errorsStep2.participantLimit.message}`}
                          </span>
                        </label>
                      )}
                    </div>

                    <div className="form-control">
                      <label className="label">
                        <span className="label-text font-bold">
                          Verification Supported
                        </span>
                      </label>
                      <label className="label-text text-sm">
                        {formData.verificationSupported
                          ? "Youth should upload proof of completion"
                          : "No verification is required"}
                      </label>
                      {errorsStep3.verificationSupported && (
                        <label className="label">
                          <span className="label-text-alt italic text-red-500">
                            {/* eslint-disable-next-line @typescript-eslint/restrict-template-expressions */}
                            {`${errorsStep3.verificationSupported.message}`}
                          </span>
                        </label>
                      )}
                    </div>

                    {formData.verificationSupported && (
                      <div className="form-control">
                        <label className="label">
                          <span className="label-text font-bold">
                            Verification Types
                          </span>
                        </label>
                        <label className="label-text text-sm">
                          {formData.verificationTypes
                            ?.map(
                              (x: any) =>
                                verificationTypes?.find((y) => y.id == x.id)
                                  ?.displayName,
                            )
                            .filter((x) => x !== undefined)
                            .join(", ")}
                        </label>
                        {errorsStep3.verificationTypes && (
                          <label className="label">
                            <span className="label-text-alt italic text-red-500">
                              {/* eslint-disable-next-line @typescript-eslint/restrict-template-expressions */}
                              {`${errorsStep3.verificationTypes.message}`}
                            </span>
                          </label>
                        )}
                      </div>
                    )}

                    <div className="form-control">
                      <label className="label">
                        <span className="label-text font-bold">Credential</span>
                      </label>
                      <label className="label-text text-sm">
                        {formData.sSIIntegrated
                          ? "I want to issue a credential upon completionn"
                          : "No credential is required"}
                      </label>
                      {errorsStep6.sSIIntegrated && (
                        <label className="label">
                          <span className="label-text-alt italic text-red-500">
                            {/* eslint-disable-next-line @typescript-eslint/restrict-template-expressions */}
                            {`${errorsStep6.sSIIntegrated.message}`}
                          </span>
                        </label>
                      )}
                    </div>

                    <div className="form-control">
                      {/* checkbox label */}
                      <label
                        htmlFor="postAsActive"
                        className="label w-full cursor-pointer justify-normal"
                      >
                        <input
                          {...registerStep7(`postAsActive`)}
                          type="checkbox"
                          //value={item.value}
                          id="postAsActive"
                          className="checkbox-primary checkbox"
                        />
                        <span className="label-text ml-4">
                          I want to this opportunity to be Publicly available
                        </span>
                      </label>
                    </div>
                    {errorsStep7.postAsActive && (
                      <label className="label font-bold">
                        <span className="label-text-alt italic text-red-500">
                          {/* eslint-disable-next-line @typescript-eslint/restrict-template-expressions */}
                          {`${errorsStep7.postAsActive.message}`}
                        </span>
                      </label>
                    )}

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
                        disabled={
                          !(
                            isValidStep1 &&
                            isValidStep2 &&
                            isValidStep3 &&
                            isValidStep4 &&
                            isValidStep5 &&
                            isValidStep6 &&
                            isValidStep7
                          )
                        }
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
      </div>
    </>
  );
};

OpportunityDetails.getLayout = function getLayout(page: ReactElement) {
  return <MainLayout>{page}</MainLayout>;
};

export default withAuth(OpportunityDetails);
