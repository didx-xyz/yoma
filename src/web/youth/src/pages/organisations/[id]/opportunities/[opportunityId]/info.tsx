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
  OpportunityInfo,
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
  getOpportunityInfoById,
} from "~/api/services/opportunities";
import MainLayout from "~/components/Layout/Main";
import { ApiErrors } from "~/components/Status/ApiErrors";
import { Loading } from "~/components/Status/Loading";
import withAuth from "~/context/withAuth";
import { authOptions, type User } from "~/server/auth";
import { PageBackground } from "~/components/PageBackground";
import Link from "next/link";
import {
  IoMdArrowRoundBack,
  IoMdClipboard,
  IoMdClock,
  IoMdInformationCircle,
  IoMdPerson,
} from "react-icons/io";
import CreatableSelect from "react-select/creatable";
import { NextPageWithLayout } from "~/pages/_app";

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
    await queryClient.prefetchQuery(["opportunityInfo", opportunityId], () =>
      getOpportunityInfoById(opportunityId, context),
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

  const { data: opportunity } = useQuery<OpportunityInfo>({
    queryKey: ["opportunityInfo", opportunityId],
    queryFn: () => getOpportunityInfoById(opportunityId),
  });

  // const { data: categories } = useQuery<SelectOption[]>({
  //   queryKey: ["categories"],
  //   queryFn: async () =>
  //     (await getCategories()).map((c) => ({
  //       value: c.id,
  //       label: c.name,
  //     })),
  // });
  // const { data: countries } = useQuery<SelectOption[]>({
  //   queryKey: ["countries"],
  //   queryFn: async () =>
  //     (await getCountries()).map((c) => ({
  //       value: c.id,
  //       label: c.name,
  //     })),
  // });
  // const { data: languages } = useQuery<SelectOption[]>({
  //   queryKey: ["languages"],
  //   queryFn: async () =>
  //     (await getLanguages()).map((c) => ({
  //       value: c.id,
  //       label: c.name,
  //     })),
  // });
  // const { data: opportunityTypes } = useQuery<SelectOption[]>({
  //   queryKey: ["opportunityTypes"],
  //   queryFn: async () =>
  //     (await getTypes()).map((c) => ({
  //       value: c.id,
  //       label: c.name,
  //     })),
  // });
  // const { data: verificationTypes } = useQuery<OpportunityVerificationType[]>({
  //   queryKey: ["verificationTypes"],
  //   queryFn: async () => await getVerificationTypes(),
  // });
  // const { data: difficulties } = useQuery<SelectOption[]>({
  //   queryKey: ["difficulties"],
  //   queryFn: async () =>
  //     (await getDifficulties()).map((c) => ({
  //       value: c.id,
  //       label: c.name,
  //     })),
  // });
  // const { data: timeIntervals } = useQuery<SelectOption[]>({
  //   queryKey: ["timeIntervals"],
  //   queryFn: async () =>
  //     (await getTimeIntervals()).map((c) => ({
  //       value: c.id,
  //       label: c.name,
  //     })),
  // });
  // const { data: skills } = useQuery<SelectOption[]>({
  //   queryKey: ["skills"],
  //   queryFn: async () =>
  //     (
  //       await getSkills({ nameContains: null, pageNumber: 1, pageSize: 60 })
  //     ).items.map((c) => ({
  //       value: c.id,
  //       label: c.name,
  //     })),
  // });

  // // skills cache. searched items are added to this cache
  // const [skillsCache, setSkillsCache] = useState<SelectOption[]>([]);
  // useMemo(() => {
  //   setSkillsCache(skills!);
  // }, [skills, setSkillsCache]);

  // const { data: opportunity } = useQuery<Opportunity>({
  //   queryKey: ["opportunity", opportunityId],
  //   queryFn: () => getOpportunityById(opportunityId),
  //   enabled: opportunityId !== "create",
  // });

  // const loadSkills = useCallback(
  //   (inputValue: string) =>
  //     new Promise<SelectOption[]>((resolve) => {
  //       /* eslint-disable */
  //       setTimeout(() => {
  //         if (inputValue.length < 3) resolve(skillsCache!);
  //         else {
  //           const data = getSkills({
  //             nameContains: inputValue,
  //             pageNumber: 1,
  //             pageSize: 60,
  //           }).then(
  //             (res) => res?.items?.map((c) => ({ value: c.id, label: c.name })),
  //           );

  //           // add skills if not already added to skillsCache
  //           data?.then((res) => {
  //             res?.forEach((s) => {
  //               if (!skillsCache.find((x) => x.value === s.value)) {
  //                 setSkillsCache((prev) => [...prev, s]);
  //               }
  //             });
  //           });

  //           resolve(data as any);
  //         }
  //       }, 6000);
  //       /* eslint-enable */
  //     }),
  //   [skillsCache, setSkillsCache],
  // );

  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const handleCancel = () => {
    void router.push(`/organisation/${id}/opportunities`);
  };

  // const [formData, setFormData] = useState<OpportunityRequestBase>({
  //   id: opportunity?.id ?? "",
  //   title: opportunity?.title ?? "",
  //   description: opportunity?.description ?? "",
  //   typeId: opportunity?.typeId ?? "",
  //   categories: opportunity?.categories?.map((x) => x.id) ?? [],
  //   uRL: opportunity?.url ?? "",

  //   languages: opportunity?.languages?.map((x) => x.id) ?? [],
  //   countries: opportunity?.countries?.map((x) => x.id) ?? [],
  //   difficultyId: opportunity?.difficultyId ?? "",
  //   commitmentIntervalCount: opportunity?.commitmentIntervalCount ?? null,
  //   commitmentIntervalId: opportunity?.commitmentIntervalId ?? "",
  //   dateStart: opportunity?.dateStart ?? null,
  //   dateEnd: opportunity?.dateEnd ?? null,
  //   participantLimit: opportunity?.participantLimit ?? 0,

  //   zltoReward: opportunity?.zltoReward ?? null,
  //   zltoRewardPool: opportunity?.zltoRewardPool ?? null,
  //   yomaReward: opportunity?.yomaReward ?? null,
  //   yomaRewardPool: opportunity?.yomaRewardPool ?? null,
  //   skills: opportunity?.skills?.map((x) => x.id) ?? [],
  //   keywords: opportunity?.keywords ?? [],
  //   verificationSupported: opportunity?.verificationSupported ?? false,
  //   verificationTypes: opportunity?.verificationTypes ?? [],

  //   sSIIntegrated: opportunity?.sSIIntegrated ?? false,

  //   organizationId: id,
  //   postAsActive: opportunity?.published ?? false,

  //   //TODO:
  //   instructions: opportunity?.instructions ?? "",
  //   //noEndDate: opportunity?.noEndDate ?? false,
  //   //participantLimit: null,
  //   //instructions: "..",
  // });

  // const onSubmit = useCallback(
  //   async (data: OpportunityRequestBase) => {
  //     setIsLoading(true);

  //     try {
  //       // update api
  //       if (opportunity) {
  //         await updateOpportunity(data);
  //         toast("The opportunity has been updated.", {
  //           type: "success",
  //           toastId: "opportunity",
  //         });
  //       } else {
  //         await createOpportunity(data);
  //         toast("The opportunity has been created.", {
  //           type: "success",
  //           toastId: "opportunity",
  //         });
  //       }

  //       // invalidate queries
  //       await queryClient.invalidateQueries(["opportunities"]);
  //       await queryClient.invalidateQueries([id, "opportunities"]);
  //     } catch (error) {
  //       toast(<ApiErrors error={error as AxiosError} />, {
  //         type: "error",
  //         toastId: "opportunity",
  //         autoClose: false,
  //         icon: false,
  //       });

  //       captureException(error);
  //       setIsLoading(false);

  //       return;
  //     }

  //     setIsLoading(false);

  //     void router.push(`/organisations/${id}}/opportunities`);
  //   },
  //   [setIsLoading, id, opportunity, queryClient],
  // );

  // // form submission handler
  // const onSubmitStep = useCallback(
  //   async (step: number, data: FieldValues) => {
  //     // set form data
  //     const model = {
  //       ...formData,
  //       ...(data as OpportunityRequestBase),
  //     };
  //     setFormData(model);

  //     console.log("model", model);

  //     if (step === 8) {
  //       await onSubmit(model);
  //       return;
  //     }
  //     setStep(step);
  //   },
  //   [setStep, formData, setFormData, onSubmit],
  // );

  // const schemaStep1 = z.object({
  //   title: z
  //     .string()
  //     .min(1, "Opportunity title is required.")
  //     .max(255, "Opportunity title cannot exceed 255 characters."),
  //   description: z.string().min(1, "Description is required."),
  //   typeId: z.string({ required_error: "Opportunity type is required" }),
  //   categories: z
  //     .array(z.string(), { required_error: "Category is required" })
  //     .min(1, "Category is required."),
  //   uRL: z
  //     .string()
  //     .min(1, "Opportunity URL is required.")
  //     .max(2048, "Opportunity URL cannot exceed 2048 characters.")
  //     .url("Please enter a valid URL (e.g. http://www.example.com)"),
  //   //.optional()
  //   // .or(z.literal("")),
  // });

  // const schemaStep2 = z.object({
  //   difficultyId: z.string({ required_error: "Difficulty is required" }),
  //   languages: z
  //     .array(z.string(), { required_error: "Language is required" })
  //     .min(1, "Language is required."),
  //   countries: z
  //     .array(z.string(), { required_error: "Country is required" })
  //     .min(1, "Country is required."),
  //   commitmentIntervalCount: z
  //     .union([z.nan(), z.null(), z.number()])
  //     .refine((val) => val != null && !isNaN(val), {
  //       message: "Time Value is required.",
  //     }),
  //   commitmentIntervalId: z.string({
  //     required_error: "Time Period is required.",
  //   }),
  //   dateStart: z
  //     .union([z.null(), z.string(), z.date()])
  //     .refine((val) => val !== null, {
  //       message: "Start Time is required.",
  //     }),
  //   //noEndDate: z.boolean(),
  //   dateEnd: z.union([z.string(), z.date(), z.null()]).optional(),
  //   participantLimit: z.union([z.nan(), z.null(), z.number()]).optional(),
  //   // eslint-disable-next-line
  //   // .refine((val) => val !== null && !Number.isNaN(val as any), {
  //   //   message: "Participant Limit is required.",
  //   // }),
  // });

  // const schemaStep3 = z.object({
  //   zltoReward: z.union([z.nan(), z.null(), z.number()]).transform((val) => {
  //     // eslint-disable-next-line
  //     return val === null || Number.isNaN(val as any) ? undefined : val;
  //   }),
  //   zltoRewardPool: z
  //     .union([z.nan(), z.null(), z.number()])
  //     .transform((val) => {
  //       // eslint-disable-next-line
  //       return val === null || Number.isNaN(val as any) ? undefined : val;
  //     }),
  //   yomaReward: z.union([z.nan(), z.null(), z.number()]).transform((val) => {
  //     // eslint-disable-next-line
  //     return val === null || Number.isNaN(val as any) ? undefined : val;
  //   }),
  //   yomaRewardPool: z
  //     .union([z.nan(), z.null(), z.number()])
  //     .transform((val) => {
  //       // eslint-disable-next-line
  //       return val === null || Number.isNaN(val as any) ? undefined : val;
  //     }),
  //   // skills: z
  //   //   .array(z.string(), {
  //   //     required_error: "At least one skill is required.",
  //   //   })
  //   //   .min(1, "At least one skill is required."),
  //   skills: z.array(z.string()).optional(),
  // });

  // const schemaStep4 = z.object({
  //   keywords: z.array(z.string()).optional(),
  //   // keywords: z
  //   //   .array(z.string(), {
  //   //     required_error: "At least one keyword is required.",
  //   //   })
  //   //   .min(1, "At least one keyword is required."),
  // });

  // const schemaStep5 = z
  //   .object({
  //     verificationSupported: z.boolean(),
  //     verificationTypes: z
  //       .array(
  //         z.object({
  //           type: z.any(),
  //           description: z
  //             .string({
  //               required_error: "Description is required",
  //             })
  //             .optional(),
  //         }),
  //         //z.any(),
  //       )
  //       .optional(),
  //   })
  //   .superRefine((values, ctx) => {
  //     if (!values.verificationSupported) return;

  //     const count =
  //       values?.verificationTypes?.filter(
  //         (x) => x.type != null && x.type != undefined && x.type != false,
  //       )?.length ?? 0;

  //     if (values.verificationTypes == null || count === 0) {
  //       ctx.addIssue({
  //         message: "At least one verification type is required.",
  //         code: z.ZodIssueCode.custom,
  //         path: ["verificationTypes"],
  //         fatal: true,
  //       });
  //       return z.NEVER;
  //     }

  //     for (const file of values.verificationTypes) {
  //       if (file?.type && !file.description) {
  //         ctx.addIssue({
  //           message: "A description for each verification type is required .",
  //           code: z.ZodIssueCode.custom,
  //           path: ["verificationTypes"],
  //         });
  //       }
  //     }
  //   })
  //   .transform((values) => {
  //     // remove non-selected verification types
  //     values.verificationTypes =
  //       values.verificationTypes?.filter(
  //         (x) => x.type != null && x.type != undefined && x.type != false,
  //       ) ?? [];
  //     return values;
  //   });

  // const schemaStep6 = z.object({
  //   sSIIntegrated: z.boolean(),
  // });

  // const schemaStep7 = z.object({
  //   postAsActive: z.boolean(),
  // });

  // const {
  //   register: registerStep1,
  //   handleSubmit: handleSubmitStep1,
  //   setValue: setValueStep1,
  //   formState: { errors: errorsStep1, isValid: isValidStep1 },
  //   control: controlStep1,
  // } = useForm({
  //   resolver: zodResolver(schemaStep1),
  //   defaultValues: formData,
  // });

  // const {
  //   register: registerStep2,
  //   handleSubmit: handleSubmitStep2,
  //   formState: { errors: errorsStep2, isValid: isValidStep2 },
  //   control: controlStep2,
  // } = useForm({
  //   resolver: zodResolver(schemaStep2),
  //   defaultValues: formData,
  // });

  // const {
  //   register: registerStep3,
  //   handleSubmit: handleSubmitStep3,
  //   setValue: setValueStep3,
  //   formState: { errors: errorsStep3, isValid: isValidStep3 },
  //   control: controlStep3,
  // } = useForm({
  //   resolver: zodResolver(schemaStep3),
  //   defaultValues: formData,
  // });

  // const {
  //   register: registerStep4,
  //   handleSubmit: handleSubmitStep4,
  //   setValue: setValueStep4,
  //   formState: { errors: errorsStep4, isValid: isValidStep4 },
  //   control: controlStep4,
  // } = useForm({
  //   resolver: zodResolver(schemaStep4),
  //   defaultValues: formData,
  // });

  // const {
  //   register: registerStep5,
  //   handleSubmit: handleSubmitStep5,
  //   getValues: getValuesStep5,
  //   setValue: setValueStep5,
  //   formState: { errors: errorsStep5, isValid: isValidStep5 },
  //   control: controlStep5,
  //   watch: watchStep5,
  // } = useForm({
  //   resolver: zodResolver(schemaStep5),
  //   defaultValues: formData,
  // });
  // const watchVerificationSupported = watchStep5("verificationSupported");
  // const watchVerificationTypes = watchStep5("verificationTypes");

  // const {
  //   register: registerStep6,
  //   handleSubmit: handleSubmitStep6,
  //   setValue: setValueStep6,
  //   formState: { errors: errorsStep6, isValid: isValidStep6 },
  //   control: controlStep6,
  // } = useForm({
  //   resolver: zodResolver(schemaStep6),
  //   defaultValues: formData,
  // });

  // const {
  //   register: registerStep7,
  //   handleSubmit: handleSubmitStep7,
  //   setValue: setValueStep7,
  //   formState: { errors: errorsStep7, isValid: isValidStep7 },
  //   control: controlStep7,
  // } = useForm({
  //   resolver: zodResolver(schemaStep7),
  //   defaultValues: formData,
  // });

  return (
    <>
      {isLoading && <Loading />}
      <PageBackground />

      <div className="container z-10 flex max-w-5xl flex-col gap-4 px-2 py-4">
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
                {opportunity?.title}
              </div>
            </li>
          </ul>
        </div>

        <div className="flex flex-col gap-1 rounded-lg bg-white p-6">
          <h4 className="text-black">{opportunity?.title}</h4>
          {/* <h6 className="text-sm text-gray">by {opportunity?.}</h6> */}
          <div className="text-green-dark flex flex-row gap-1 text-xs font-bold">
            <div className="badge bg-green-light">
              <IoMdClock className="mr-2 h-4 w-4" />
              {`${opportunity?.commitmentIntervalCount} ${opportunity?.commitmentInterval}`}
            </div>
            {(opportunity?.participantCount ?? 0) > 0 && (
              <div className="badge bg-green-light">
                <IoMdPerson className="mr-2 h-4 w-4" />
                {opportunity?.participantCount} enrolled
              </div>
            )}
            <div className="badge bg-green-light">Ongoing</div>
          </div>
        </div>

        <div className="flex flex-col gap-2 md:flex-row">
          <div className="flex-grow rounded-lg bg-white p-6">
            {opportunity?.description}
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex flex-col rounded-lg bg-white p-6">
              <div className="flex flex-row gap-1  text-sm font-bold">
                <IoMdPerson className="h-6 w-6 text-gray" />
                Participants
              </div>
              <div className="flex flex-row items-center gap-4 rounded-lg bg-gray">
                <div className="text-3xl text-gray-dark">
                  {opportunity?.participantCount ?? 0}
                </div>
                <div className="flex flex-row rounded-lg bg-yellow">
                  <div className="badge badge-secondary">14</div>
                  <div className="text-warning">to be verified</div>
                </div>
              </div>
            </div>
            <div className="flex flex-row gap-1 rounded-lg bg-white p-6 text-sm font-bold">
              <IoMdClipboard className="h-6 w-6 text-gray" />
              Skills you will learn
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
