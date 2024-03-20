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
import { type ParsedUrlQuery } from "querystring";
import {
  useCallback,
  useMemo,
  useState,
  type ReactElement,
  useEffect,
  useRef,
} from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import {
  Controller,
  useForm,
  type FieldValues,
  useFieldArray,
} from "react-hook-form";
import Select from "react-select";
import { toast } from "react-toastify";
import z from "zod";
import type { Skill, SelectOption } from "~/api/models/lookups";
import { SchemaType } from "~/api/models/credential";
import {
  VerificationMethod,
  type Opportunity,
  type OpportunityRequestBase,
  type OpportunityVerificationType,
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
import { authOptions, type User } from "~/server/auth";
import { PageBackground } from "~/components/PageBackground";
import Link from "next/link";
import { IoMdArrowRoundBack } from "react-icons/io";
import CreatableSelect from "react-select/creatable";
import type { NextPageWithLayout } from "~/pages/_app";
import { getSchemas } from "~/api/services/credentials";
import {
  REGEX_URL_VALIDATION,
  GA_CATEGORY_OPPORTUNITY,
  GA_ACTION_OPPORTUNITY_CREATE,
  GA_ACTION_OPPORTUNITY_UPDATE,
  DATE_FORMAT_HUMAN,
  DATE_FORMAT_SYSTEM,
  PAGE_SIZE_MEDIUM,
} from "~/lib/constants";
import { Unauthorized } from "~/components/Status/Unauthorized";
import { config } from "~/lib/react-query-config";
import { trackGAEvent } from "~/lib/google-analytics";
import Moment from "react-moment";
import moment from "moment";
import { getThemeFromRole, debounce } from "~/lib/utils";
import Async from "react-select/async";
import { useRouter } from "next/router";
import ReactModal from "react-modal";
import Image from "next/image";
import iconBell from "public/images/icon-bell.webp";
import { IoMdClose } from "react-icons/io";

interface IParams extends ParsedUrlQuery {
  id: string;
  opportunityId: string;
  returnUrl?: string;
}

// ⚠️ SSR
export async function getServerSideProps(context: GetServerSidePropsContext) {
  const { id, opportunityId } = context.params as IParams;
  const session = await getServerSession(context.req, context.res, authOptions);

  // 👇 ensure authenticated
  if (!session) {
    return {
      props: {
        error: "Unauthorized",
      },
    };
  }

  // 👇 set theme based on role
  const theme = getThemeFromRole(session, id);

  // 👇 prefetch queries on server
  const queryClient = new QueryClient(config);

  await Promise.all([
    opportunityId !== "create"
      ? await queryClient.prefetchQuery({
          queryKey: ["opportunity", opportunityId],
          queryFn: () => getOpportunityById(opportunityId, context),
        })
      : null,
  ]);

  return {
    props: {
      dehydratedState: dehydrate(queryClient),
      user: session?.user ?? null,
      id: id,
      opportunityId: opportunityId,
      theme: theme,
    },
  };
}

// 👇 PAGE COMPONENT: Opportunity Create/Edit
// this page acts as a create (/opportunites/create) or edit page (/opportunities/:id) based on the [opportunityId] route param
// this page is accessed from the /organisations/[id]/.. pages (OrgAdmin role)
// or from the /admin/opportunities/.. pages (Admin role). the retunUrl query param is used to redirect back to the admin page
const OpportunityDetails: NextPageWithLayout<{
  id: string;
  opportunityId: string;
  user: User;
  theme: string;
  error: string;
}> = ({ id, opportunityId, error }) => {
  const router = useRouter();
  const { returnUrl } = router.query;
  const queryClient = useQueryClient();

  const formRef1 = useRef<HTMLFormElement>(null);
  const formRef2 = useRef<HTMLFormElement>(null);
  const formRef3 = useRef<HTMLFormElement>(null);
  const formRef4 = useRef<HTMLFormElement>(null);
  const formRef5 = useRef<HTMLFormElement>(null);
  const formRef6 = useRef<HTMLFormElement>(null);
  const formRef7 = useRef<HTMLFormElement>(null);

  const [saveChangesDialogVisible, setSaveChangesDialogVisible] =
    useState(false);
  const [lastStepBeforeSaveChangesDialog, setLastStepBeforeSaveChangesDialog] =
    useState<number | null>(null);

  // 👇 use prefetched queries from server
  const { data: categories } = useQuery<SelectOption[]>({
    queryKey: ["categories", "selectOptions"],
    queryFn: async () =>
      (await getCategories()).map((c) => ({
        value: c.id,
        label: c.name,
      })),
    enabled: !error,
  });
  const { data: countries } = useQuery<SelectOption[]>({
    queryKey: ["countries", "selectOptions"],
    queryFn: async () =>
      (await getCountries()).map((c) => ({
        value: c.id,
        label: c.name,
      })),
    enabled: !error,
  });
  const { data: languages } = useQuery<SelectOption[]>({
    queryKey: ["languages", "selectOptions"],
    queryFn: async () =>
      (await getLanguages()).map((c) => ({
        value: c.id,
        label: c.name,
      })),
    enabled: !error,
  });
  const { data: opportunityTypes } = useQuery<SelectOption[]>({
    queryKey: ["opportunityTypes", "selectOptions"],
    queryFn: async () =>
      (await getTypes()).map((c) => ({
        value: c.id,
        label: c.name,
      })),
    enabled: !error,
  });
  const { data: verificationTypes } = useQuery<OpportunityVerificationType[]>({
    queryKey: ["verificationTypes", "selectOptions"],
    queryFn: async () => await getVerificationTypes(),
    enabled: !error,
  });
  const { data: difficulties } = useQuery<SelectOption[]>({
    queryKey: ["difficulties", "selectOptions"],
    queryFn: async () =>
      (await getDifficulties()).map((c) => ({
        value: c.id,
        label: c.name,
      })),
    enabled: !error,
  });
  const { data: timeIntervals } = useQuery<SelectOption[]>({
    queryKey: ["timeIntervals", "selectOptions"],
    queryFn: async () =>
      (await getTimeIntervals()).map((c) => ({
        value: c.id,
        label: c.name,
      })),
    enabled: !error,
  });
  const { data: schemas } = useQuery({
    queryKey: ["schemas"],
    queryFn: async () => getSchemas(SchemaType.Opportunity),
    enabled: !error,
  });

  const schemasOptions = useMemo<SelectOption[]>(
    () =>
      schemas?.map((c) => ({
        value: c.name,
        label: c.displayName,
      })) ?? [],
    [schemas],
  );

  const { data: opportunity } = useQuery<Opportunity>({
    queryKey: ["opportunity", opportunityId],
    queryFn: () => getOpportunityById(opportunityId),
    enabled: opportunityId !== "create" && !error,
  });

  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const handleCancel = () => {
    void router.push(`/organisations/${id}/opportunities`);
  };

  const [formData, setFormData] = useState<OpportunityRequestBase>({
    id: opportunity?.id ?? null,
    title: opportunity?.title ?? "",
    description: opportunity?.description ?? "",
    typeId: opportunity?.typeId ?? "",
    categories: opportunity?.categories?.map((x) => x.id) ?? [],
    uRL: opportunity?.url ?? "",

    languages: opportunity?.languages?.map((x) => x.id) ?? [],
    countries: opportunity?.countries?.map((x) => x.id) ?? [],
    difficultyId: opportunity?.difficultyId ?? "",
    commitmentIntervalCount: opportunity?.commitmentIntervalCount ?? null,
    commitmentIntervalId: opportunity?.commitmentIntervalId ?? "",
    dateStart: opportunity?.dateStart ?? null,
    dateEnd: opportunity?.dateEnd ?? null,
    participantLimit: opportunity?.participantLimit ?? null,

    zltoReward: opportunity?.zltoReward ?? null,
    zltoRewardPool: opportunity?.zltoRewardPool ?? null,
    yomaReward: opportunity?.yomaReward ?? null,
    yomaRewardPool: opportunity?.yomaRewardPool ?? null,
    skills: opportunity?.skills?.map((x) => x.id) ?? [],
    keywords: opportunity?.keywords ?? [],

    verificationEnabled: opportunity?.verificationEnabled ?? null,
    // enum value comes as string from server, convert to number
    verificationMethod: opportunity?.verificationMethod
      ? VerificationMethod[opportunity.verificationMethod]
      : null,
    verificationTypes: opportunity?.verificationTypes ?? [],

    credentialIssuanceEnabled: opportunity?.credentialIssuanceEnabled ?? false,
    ssiSchemaName: opportunity?.ssiSchemaName ?? null,

    organizationId: id,
    postAsActive: opportunity?.published ?? false,
    instructions: opportunity?.instructions ?? "",
  });

  const schemaStep1 = z.object({
    title: z
      .string()
      .min(1, "Opportunity title is required.")
      .max(255, "Opportunity title cannot exceed 255 characters."),
    description: z.string().min(1, "Description is required."),
    typeId: z.string().min(1, "Opportunity type is required."),
    categories: z
      .array(z.string(), { required_error: "Category is required" })
      .min(1, "Category is required."),
    uRL: z
      .string()
      .min(1, "Opportunity URL is required.")
      .max(2048, "Opportunity URL cannot exceed 2048 characters.")
      .regex(
        REGEX_URL_VALIDATION,
        "Please enter a valid URL - example.com | www.example.com | https://www.example.com",
      ),
  });

  const schemaStep2 = z.object({
    difficultyId: z.string().min(1, "Difficulty is required."),
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
    commitmentIntervalId: z.string().min(1, "Time frame is required."),
    dateStart: z
      .union([z.null(), z.string(), z.date()])
      .refine((val) => val !== null, {
        message: "Start Time is required.",
      }),
    dateEnd: z.union([z.string(), z.date(), z.null()]).optional(),
    participantLimit: z.union([z.nan(), z.null(), z.number()]).optional(),
  });

  const schemaStep3 = z.object({
    zltoReward: z.union([z.nan(), z.null(), z.number()]).transform((val) => {
      // eslint-disable-next-line
      return val === null || Number.isNaN(val as any) ? null : val;
    }),
    zltoRewardPool: z
      .union([z.nan(), z.null(), z.number()])
      .transform((val) => {
        // eslint-disable-next-line
        return val === null || Number.isNaN(val as any) ? null : val;
      }),
    // yomaReward: z.union([z.nan(), z.null(), z.number()]).transform((val) => {
    //   // eslint-disable-next-line
    //   return val === null || Number.isNaN(val as any) ? undefined : val;
    // }),
    // yomaRewardPool: z
    //   .union([z.nan(), z.null(), z.number()])
    //   .transform((val) => {
    //     // eslint-disable-next-line
    //     return val === null || Number.isNaN(val as any) ? undefined : val;
    //   }),
    skills: z.array(z.string()).optional(),
  });

  const schemaStep4 = z.object({
    keywords: z.array(z.string()).min(1, "At least 1 keyword is required."),
  });

  const schemaStep5 = z
    .object({
      verificationEnabled: z.union([z.boolean(), z.null()]),
      verificationMethod: z.union([z.number(), z.null()]).optional(),
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
        )
        .optional(),
    })
    .superRefine((values, ctx) => {
      // verificationEnabled option is required
      if (values.verificationEnabled == null) {
        ctx.addIssue({
          message: "Please select an option.",
          code: z.ZodIssueCode.custom,
          path: ["verificationEnabled"],
          fatal: true,
        });
        return z.NEVER;
      }

      if (values.verificationEnabled == false) return;
      if (values?.verificationMethod == VerificationMethod.Automatic) return;

      // verificationTypes are required when VerificationMethod is Manual
      if (
        values.verificationTypes == null ||
        values?.verificationTypes?.length === 0
      ) {
        ctx.addIssue({
          message: "At least one verification type is required.",
          code: z.ZodIssueCode.custom,
          path: ["verificationTypes"],
          fatal: true,
        });
        return z.NEVER;
      }

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

  const schemaStep6 = z
    .object({
      credentialIssuanceEnabled: z.boolean(),
      ssiSchemaName: z.union([z.string(), z.null()]),
    })
    .superRefine((values, ctx) => {
      if (values.credentialIssuanceEnabled && !values.ssiSchemaName) {
        ctx.addIssue({
          message: "Schema name is required.",
          code: z.ZodIssueCode.custom,
          path: ["ssiSchemaName"],
        });
      }
    });

  const schemaStep7 = z.object({
    postAsActive: z.boolean(),
  });

  const {
    register: registerStep1,
    handleSubmit: handleSubmitStep1,
    formState: formStateStep1,
    control: controlStep1,
    reset: resetStep1,
  } = useForm({
    resolver: zodResolver(schemaStep1),
    defaultValues: formData,
  });

  const {
    register: registerStep2,
    handleSubmit: handleSubmitStep2,
    formState: formStateStep2,
    control: controlStep2,
    getValues: getValuesStep2,
    reset: resetStep2,
  } = useForm({
    resolver: zodResolver(schemaStep2),
    defaultValues: formData,
  });

  const {
    register: registerStep3,
    handleSubmit: handleSubmitStep3,
    formState: formStateStep3,
    control: controlStep3,
    getValues: getValuesStep3,
    setValue: setValueStep3,
    reset: resetStep3,
  } = useForm({
    resolver: zodResolver(schemaStep3),
    defaultValues: formData,
  });

  const {
    handleSubmit: handleSubmitStep4,
    formState: formStateStep4,

    reset: resetStep4,
    control: controlStep4,
  } = useForm({
    resolver: zodResolver(schemaStep4),
    defaultValues: formData,
  });

  const {
    handleSubmit: handleSubmitStep5,
    getValues: getValuesStep5,
    setValue: setValueStep5,
    formState: formStateStep5,
    control: controlStep5,
    watch: watchStep5,
    reset: resetStep5,
  } = useForm({
    resolver: zodResolver(schemaStep5),
    defaultValues: formData,
  });
  const watchVerificationEnabled = watchStep5("verificationEnabled");
  const watchVerificationMethod = watchStep5("verificationMethod");
  const watchVerificationTypes = watchStep5("verificationTypes");
  const { append, remove } = useFieldArray({
    control: controlStep5,
    name: "verificationTypes",
  });

  const {
    register: registerStep6,
    handleSubmit: handleSubmitStep6,
    formState: formStateStep6,
    control: controlStep6,
    watch: watchStep6,
    reset: resetStep6,
  } = useForm({
    resolver: zodResolver(schemaStep6),
    defaultValues: formData,
  });
  const watchCredentialIssuanceEnabled = watchStep6(
    "credentialIssuanceEnabled",
  );
  const watcSSISchemaName = watchStep6("ssiSchemaName");

  const {
    register: registerStep7,
    handleSubmit: handleSubmitStep7,
    formState: formStateStep7,
    reset: resetStep7,
  } = useForm({
    resolver: zodResolver(schemaStep7),
    defaultValues: formData,
  });

  // scroll to top on step change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [step]);

  // on schema select, show the schema attributes
  const schemaAttributes = useMemo(() => {
    if (watcSSISchemaName) {
      return schemas?.find((x) => x.name === watcSSISchemaName)?.entities ?? [];
    }
  }, [schemas, watcSSISchemaName]);

  // memo for dirty fields
  // because the "isDirty" property on useForm is not working as expected
  const isDirtyStep1 = useMemo(
    () => Object.keys(formStateStep1.dirtyFields).length > 0,
    [formStateStep1],
  );
  const isDirtyStep2 = useMemo(
    () => Object.keys(formStateStep2.dirtyFields).length > 0,
    [formStateStep2],
  );
  const isDirtyStep3 = useMemo(
    () => Object.keys(formStateStep3.dirtyFields).length > 0,
    [formStateStep3],
  );
  const isDirtyStep4 = useMemo(
    () => Object.keys(formStateStep4.dirtyFields).length > 0,
    [formStateStep4],
  );
  const isDirtyStep5 = useMemo(
    () => Object.keys(formStateStep5.dirtyFields).length > 0,
    [formStateStep5],
  );
  const isDirtyStep6 = useMemo(
    () => Object.keys(formStateStep6.dirtyFields).length > 0,
    [formStateStep6],
  );
  const isDirtyStep7 = useMemo(
    () => Object.keys(formStateStep7.dirtyFields).length > 0,
    [formStateStep7],
  );

  //* SKILLS
  // cache skills for name lookups
  const [cacheSkills, setCacheSkills] = useState<Skill[]>([]);

  // popuplate the cache with the skills from the opportunity
  useEffect(() => {
    if (opportunity?.skills) {
      setCacheSkills((prev) => [...prev, ...(opportunity.skills ?? [])]);
    }
  }, [opportunity?.skills, setCacheSkills]);

  // load data asynchronously for the skills dropdown
  // debounce is used to prevent the API from being called too frequently
  const loadSkills = debounce(
    (inputValue: string, callback: (options: any) => void) => {
      getSkills({
        nameContains: (inputValue ?? []).length > 2 ? inputValue : null,
        pageNumber: 1,
        pageSize: PAGE_SIZE_MEDIUM,
      }).then((data) => {
        const options = data.items.map((item) => ({
          value: item.id,
          label: item.name,
        }));
        callback(options);
        // add to cache
        data.items.forEach((item) => {
          if (!cacheSkills.some((x) => x.id === item.id)) {
            setCacheSkills((prev) => [...prev, item]);
          }
        });
      });
    },
    1000,
  );

  //* SAVE CHANGE DIALOG
  const onClick_Menu = useCallback(
    (nextStep: number) => {
      let isDirtyStep = false;
      if (step === 1 && isDirtyStep1) isDirtyStep = true;
      else if (step === 2 && isDirtyStep2) isDirtyStep = true;
      else if (step === 3 && isDirtyStep3) isDirtyStep = true;
      else if (step === 4 && isDirtyStep4) isDirtyStep = true;
      else if (step === 5 && isDirtyStep5) isDirtyStep = true;
      else if (step === 6 && isDirtyStep6) isDirtyStep = true;
      else if (step === 7 && isDirtyStep7) isDirtyStep = true;

      if (isDirtyStep) {
        setLastStepBeforeSaveChangesDialog(nextStep);
        setSaveChangesDialogVisible(true);
        return;
      }

      setStep(nextStep);
    },
    [
      isDirtyStep1,
      isDirtyStep2,
      isDirtyStep3,
      isDirtyStep4,
      isDirtyStep5,
      isDirtyStep6,
      isDirtyStep7,
      step,
      setStep,
      setSaveChangesDialogVisible,
      setLastStepBeforeSaveChangesDialog,
    ],
  );

  const onClickContinueWithoutSaving = useCallback(() => {
    resetStep1(formData);
    resetStep2(formData);
    resetStep3(formData);
    resetStep4(formData);
    resetStep5(formData);
    resetStep6(formData);
    resetStep7(formData);
    setSaveChangesDialogVisible(false);
    lastStepBeforeSaveChangesDialog && setStep(lastStepBeforeSaveChangesDialog);
    setLastStepBeforeSaveChangesDialog(null);
  }, [
    resetStep1,
    formData,
    resetStep2,
    resetStep3,
    resetStep4,
    resetStep5,
    resetStep6,
    resetStep7,
    setSaveChangesDialogVisible,
    lastStepBeforeSaveChangesDialog,
    setLastStepBeforeSaveChangesDialog,
    setStep,
  ]);

  const onClickSaveAndContinue = useCallback(() => {
    setSaveChangesDialogVisible(false);

    if (step == 1) {
      formRef1?.current?.dispatchEvent(
        new Event("submit", { cancelable: true, bubbles: true }),
      );
    } else if (step == 2) {
      formRef2?.current?.dispatchEvent(
        new Event("submit", { cancelable: true, bubbles: true }),
      );
    } else if (step == 3) {
      formRef3?.current?.dispatchEvent(
        new Event("submit", { cancelable: true, bubbles: true }),
      );
    } else if (step == 4) {
      formRef4?.current?.dispatchEvent(
        new Event("submit", { cancelable: true, bubbles: true }),
      );
    } else if (step == 5) {
      formRef5?.current?.dispatchEvent(
        new Event("submit", { cancelable: true, bubbles: true }),
      );
    } else if (step == 6) {
      formRef6?.current?.dispatchEvent(
        new Event("submit", { cancelable: true, bubbles: true }),
      );
    } else if (step == 7) {
      formRef7?.current?.dispatchEvent(
        new Event("submit", { cancelable: true, bubbles: true }),
      );
    }
  }, [
    formRef1,
    formRef2,
    formRef3,
    formRef4,
    formRef5,
    formRef6,
    formRef7,
    setSaveChangesDialogVisible,
    step,
  ]);

  const onSubmit = useCallback(
    async (data: OpportunityRequestBase) => {
      setIsLoading(true);

      try {
        let message = "";

        // dismiss all toasts
        toast.dismiss();

        //  convert dates to string in format "YYYY-MM-DD"
        data.dateStart = data.dateStart
          ? moment(data.dateStart).format(DATE_FORMAT_SYSTEM)
          : null;
        data.dateEnd = data.dateEnd
          ? moment(data.dateEnd).format(DATE_FORMAT_SYSTEM)
          : null;

        // update api
        if (opportunity) {
          await updateOpportunity(data);
          message = "Opportunity updated";
        } else {
          await createOpportunity(data);
          message = "Opportunity created";
        }
        toast(message, {
          type: "success",
          toastId: "opportunity",
        });
        console.log(message); // e2e

        // invalidate queries
        await queryClient.invalidateQueries({ queryKey: ["opportunities"] });
        await queryClient.invalidateQueries({
          queryKey: ["opportunities", id],
        });
        await queryClient.invalidateQueries({
          queryKey: ["opportunity", opportunityId],
        });
      } catch (error) {
        toast(<ApiErrors error={error as AxiosError} />, {
          type: "error",
          toastId: "opportunity",
          autoClose: false,
          icon: false,
        });

        captureException(error);
        setIsLoading(false);

        return;
      }

      setIsLoading(false);

      // redirect to list after create
      if (opportunityId === "create")
        void router.push(`/organisations/${id}/opportunities`);
    },
    [setIsLoading, id, opportunityId, opportunity, queryClient, router],
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

      if (opportunityId === "create") {
        // submit on last page when creating new opportunity
        if (step === 8) {
          await onSubmit(model);

          // 📊 GOOGLE ANALYTICS: track event
          trackGAEvent(
            GA_CATEGORY_OPPORTUNITY,
            GA_ACTION_OPPORTUNITY_CREATE,
            `Created Opportunity: ${model.title}`,
          );
        }
        // move to next step
        else setStep(step);
      } else {
        // submit on each page when updating opportunity
        await onSubmit(model);

        // 📊 GOOGLE ANALYTICS: track event
        trackGAEvent(
          GA_CATEGORY_OPPORTUNITY,
          GA_ACTION_OPPORTUNITY_UPDATE,
          `Updated Opportunity: ${model.title}`,
        );
      }

      resetStep1(model);
      resetStep2(model);
      resetStep3(model);
      resetStep4(model);
      resetStep5(model);
      resetStep6(model);
      resetStep7(model);

      // go to last step before save changes dialog
      if (lastStepBeforeSaveChangesDialog)
        setStep(lastStepBeforeSaveChangesDialog);

      setLastStepBeforeSaveChangesDialog(null);
    },
    [
      opportunityId,
      setStep,
      formData,
      setFormData,
      onSubmit,
      lastStepBeforeSaveChangesDialog,
      setLastStepBeforeSaveChangesDialog,
      resetStep1,
      resetStep2,
      resetStep3,
      resetStep4,
      resetStep5,
      resetStep6,
      resetStep7,
    ],
  );

  if (error) return <Unauthorized />;

  return (
    <>
      {isLoading && <Loading />}

      <PageBackground />

      {/* SAVE CHANGES DIALOG */}
      <ReactModal
        isOpen={saveChangesDialogVisible}
        shouldCloseOnOverlayClick={false}
        onRequestClose={() => {
          setSaveChangesDialogVisible(false);
        }}
        className={`fixed bottom-0 left-0 right-0 top-0 flex-grow overflow-hidden bg-white animate-in fade-in md:m-auto md:max-h-[310px] md:w-[450px] md:rounded-3xl`}
        portalClassName={"fixed z-40"}
        overlayClassName="fixed inset-0 bg-overlay"
      >
        <div className="flex h-full flex-col gap-2 overflow-y-auto pb-8">
          <div className="flex flex-row bg-green p-4 shadow-lg">
            <h1 className="flex-grow"></h1>
            <button
              type="button"
              className="btn rounded-full border-green-dark bg-green-dark p-3 text-white"
              onClick={() => {
                setSaveChangesDialogVisible(false);
              }}
            >
              <IoMdClose className="h-6 w-6"></IoMdClose>
            </button>
          </div>
          <div className="flex flex-col items-center justify-center gap-4">
            <div className="-mt-8 flex h-12 w-12 items-center justify-center rounded-full border-green-dark bg-white shadow-lg">
              <Image
                src={iconBell}
                alt="Icon Bell"
                width={28}
                height={28}
                sizes="100vw"
                priority={true}
                style={{ width: "28px", height: "28px" }}
              />
            </div>

            <p className="w-80 text-center text-base">
              Your recent changes have not been saved. Please make sure to save
              your changes to prevent any loss of data.
            </p>

            <div className="mt-4 flex flex-grow gap-4">
              <button
                type="button"
                className="btn rounded-full border-purple bg-white normal-case text-purple md:w-[150px]"
                onClick={onClickContinueWithoutSaving}
              >
                <span className="ml-1">Continue without saving</span>
              </button>

              <button
                type="button"
                className="btn rounded-full bg-purple normal-case text-white hover:bg-purple-light md:w-[150px]"
                onClick={onClickSaveAndContinue}
              >
                <p className="text-white">Save and continue</p>
              </button>
            </div>
          </div>
        </div>
      </ReactModal>

      <div className="container z-10 mt-20 max-w-7xl px-2 py-4">
        {/* BREADCRUMB */}
        <div className="flex flex-row items-center text-xs text-white">
          <Link
            className="font-bold hover:text-gray"
            href={returnUrl?.toString() ?? `/organisations/${id}/opportunities`}
          >
            <IoMdArrowRoundBack className="bg-theme mr-2 inline-block h-6 w-6 rounded-full p-1 brightness-105" />
            Opportunities
          </Link>

          <div className="mx-2">|</div>

          {opportunityId == "create" ? (
            "Create"
          ) : (
            <>
              <Link
                className="font-boldx mt-0 max-w-[250px] overflow-hidden text-ellipsis whitespace-nowrap hover:text-gray md:max-w-[400px] lg:max-w-[800px]"
                href={`/organisations/${id}/opportunities/${opportunityId}/info${
                  returnUrl ? `?returnUrl=${returnUrl}` : ""
                }`}
              >
                {opportunity?.title}
              </Link>
              <div className="mx-2">|</div>
              <div className="max-w-[600px] overflow-hidden text-ellipsis whitespace-nowrap">
                Edit
              </div>
            </>
          )}
        </div>

        <h3 className="mb-6 mt-2 pl-8 font-bold text-white">
          {opportunityId == "create" ? "New opportunity" : opportunity?.title}
        </h3>

        <div className="flex flex-col gap-4 md:flex-row">
          {/* LEFT VERTICAL MENU */}
          <ul className="menu hidden h-[420px] flex-none gap-3 rounded-lg bg-white p-4 font-semibold shadow-xl md:flex md:justify-center">
            <li onClick={() => onClick_Menu(1)}>
              <a
                className={`${
                  step === 1
                    ? "bg-green-light text-green hover:bg-green-light"
                    : "bg-gray-light text-gray-dark hover:bg-gray"
                } py-3`}
              >
                <span
                  className={`mr-2 rounded-full px-1.5 py-0.5 text-xs font-medium text-white ${
                    formStateStep1.isValid ? "bg-green" : "bg-gray-dark"
                  }`}
                >
                  1
                </span>
                Opportunity information
              </a>
            </li>
            <li onClick={() => onClick_Menu(2)}>
              <a
                className={`${
                  step === 2
                    ? "bg-green-light text-green hover:bg-green-light"
                    : "bg-gray-light text-gray-dark hover:bg-gray"
                } py-3`}
              >
                <span
                  className={`mr-2 rounded-full px-1.5 py-0.5 text-xs font-medium text-white ${
                    formStateStep2.isValid ? "bg-green" : "bg-gray-dark"
                  }`}
                >
                  2
                </span>
                Opportunity details
              </a>
            </li>
            <li onClick={() => onClick_Menu(3)}>
              <a
                className={`${
                  step === 3
                    ? "bg-green-light text-green hover:bg-green-light"
                    : "bg-gray-light text-gray-dark hover:bg-gray"
                } py-3`}
              >
                <span
                  className={`mr-2 rounded-full px-1.5 py-0.5 text-xs font-medium text-white ${
                    formStateStep3.isValid ? "bg-green" : "bg-gray-dark"
                  }`}
                >
                  3
                </span>
                Rewards
              </a>
            </li>
            <li onClick={() => onClick_Menu(4)}>
              <a
                className={`${
                  step === 4
                    ? "bg-green-light text-green hover:bg-green-light"
                    : "bg-gray-light text-gray-dark hover:bg-gray"
                } py-3`}
              >
                <span
                  className={`mr-2 rounded-full px-1.5 py-0.5 text-xs font-medium text-white ${
                    formStateStep4.isValid ? "bg-green" : "bg-gray-dark"
                  }`}
                >
                  4
                </span>
                Keywords
              </a>
            </li>
            <li onClick={() => onClick_Menu(5)}>
              <a
                className={`${
                  step === 5
                    ? "bg-green-light text-green hover:bg-green-light"
                    : "bg-gray-light text-gray-dark hover:bg-gray"
                } py-3`}
              >
                <span
                  className={`mr-2 rounded-full px-1.5 py-0.5 text-xs font-medium text-white ${
                    formStateStep5.isValid ? "bg-green" : "bg-gray-dark"
                  }`}
                >
                  5
                </span>
                Verification type
              </a>
            </li>
            <li onClick={() => onClick_Menu(6)}>
              <a
                className={`${
                  step === 6
                    ? "bg-green-light text-green hover:bg-green-light"
                    : "bg-gray-light text-gray-dark hover:bg-gray"
                } py-3`}
              >
                <span
                  className={`mr-2 rounded-full px-1.5 py-0.5 text-xs font-medium text-white ${
                    formStateStep6.isValid ? "bg-green" : "bg-gray-dark"
                  }`}
                >
                  6
                </span>
                Credential
              </a>
            </li>
            {/* only show preview when creating new opportunity */}
            {opportunityId === "create" && (
              <li onClick={() => onClick_Menu(7)}>
                <a
                  className={`${
                    step === 7
                      ? "bg-green-light text-green hover:bg-green-light"
                      : "bg-gray-light text-gray-dark hover:bg-gray"
                  } py-3`}
                >
                  <span
                    className={`mr-2 rounded-full bg-gray-dark px-1.5 py-0.5 text-xs font-medium text-white ${
                      formStateStep1.isValid &&
                      formStateStep2.isValid &&
                      formStateStep3.isValid &&
                      formStateStep4.isValid &&
                      formStateStep5.isValid &&
                      formStateStep6.isValid &&
                      formStateStep7.isValid
                        ? "bg-green"
                        : "bg-gray-dark"
                    }`}
                  >
                    7
                  </span>
                  Preview opportunity
                </a>
              </li>
            )}
          </ul>

          {/* DROPDOWN MENU */}
          <select
            className="select select-bordered select-sm md:hidden"
            onChange={(e) => {
              switch (e.target.value) {
                case "Opportunity information":
                  onClick_Menu(1);
                  break;
                case "Opportunity details":
                  onClick_Menu(2);
                  break;
                case "Rewards":
                  onClick_Menu(3);
                  break;
                case "Keywords":
                  onClick_Menu(4);
                  break;
                case "Verification type":
                  onClick_Menu(5);
                  break;
                case "Credential":
                  onClick_Menu(6);
                  break;
                case "Preview opportunity":
                  onClick_Menu(7);
                  break;
                default:
                  onClick_Menu(1);
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

          {/* FORMS */}
          <div className="flex flex-grow flex-col items-center rounded-lg bg-white shadow-xl">
            <div className="flex w-full max-w-2xl flex-col p-8">
              {step === 1 && (
                <>
                  <div className="mb-4 flex flex-col">
                    <h5 className="font-bold">Opportunity information</h5>
                    <p className="my-2 text-sm">
                      Information about the opportunity that young people can
                      explore
                    </p>
                  </div>

                  <form
                    ref={formRef1}
                    className="flex flex-col gap-4"
                    onSubmit={handleSubmitStep1((data) =>
                      onSubmitStep(2, data),
                    )} // eslint-disable-line @typescript-eslint/no-misused-promises
                  >
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text font-bold">
                          Opportunity title
                        </span>
                      </label>
                      <input
                        type="text"
                        className="input input-bordered rounded-md border-gray focus:border-gray focus:outline-none"
                        placeholder="Opportunity Title"
                        {...registerStep1("title")}
                        contentEditable
                      />
                      {formStateStep1.errors.title && (
                        <label className="label -mb-5">
                          <span className="label-text-alt italic text-red-500">
                            {`${formStateStep1.errors.title.message}`}
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
                      <Controller
                        control={controlStep1}
                        name="typeId"
                        render={({ field: { onChange, value } }) => (
                          <Select
                            instanceId="typeId"
                            classNames={{
                              control: () => "input !border-gray",
                            }}
                            options={opportunityTypes}
                            onChange={(val) => onChange(val?.value)}
                            value={opportunityTypes?.find(
                              (c) => c.value === value,
                            )}
                            styles={{
                              placeholder: (base) => ({
                                ...base,
                                color: "#A3A6AF",
                              }),
                            }}
                            inputId="input_typeid" // e2e
                          />
                        )}
                      />

                      {formStateStep1.errors.typeId && (
                        <label className="label -mb-5">
                          <span className="label-text-alt italic text-red-500">
                            {`${formStateStep1.errors.typeId.message}`}
                          </span>
                        </label>
                      )}
                    </div>

                    <div className="form-control">
                      <label className="label">
                        <span className="label-text font-bold">
                          Under which categories does your opportunity belong
                        </span>
                      </label>
                      <Controller
                        control={controlStep1}
                        name="categories"
                        render={({ field: { onChange, value } }) => (
                          <Select
                            instanceId="categories"
                            classNames={{
                              control: () => "input !border-gray py-1 h-fit",
                            }}
                            isMulti={true}
                            options={categories}
                            onChange={(val) =>
                              onChange(val?.map((c) => c.value ?? ""))
                            }
                            value={categories?.filter(
                              (c) => value?.includes(c.value),
                            )}
                            styles={{
                              placeholder: (base) => ({
                                ...base,
                                color: "#A3A6AF",
                              }),
                            }}
                            inputId="input_categories" // e2e
                          />
                        )}
                      />

                      {formStateStep1.errors.categories && (
                        <label className="label -mb-5">
                          <span className="label-text-alt italic text-red-500">
                            {`${formStateStep1.errors.categories.message}`}
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

                      <input
                        type="text"
                        className="input input-bordered rounded-md border-gray focus:border-gray focus:outline-none"
                        placeholder="Opportunity Link"
                        {...registerStep1("uRL")}
                        contentEditable
                      />
                      {formStateStep1.errors.uRL && (
                        <label className="label -mb-5">
                          <span className="label-text-alt italic text-red-500">
                            {`${formStateStep1.errors.uRL.message}`}
                          </span>
                        </label>
                      )}
                    </div>

                    <div className="form-control">
                      <label className="label">
                        <span className="label-text font-bold">
                          Description
                        </span>
                      </label>
                      <textarea
                        className="input textarea textarea-bordered h-32 rounded-md border-gray focus:border-gray focus:outline-none"
                        // placeholder="Description"
                        {...registerStep1("description")}
                      />
                      {formStateStep1.errors.description && (
                        <label className="label">
                          <span className="label-text-alt italic text-red-500">
                            {`${formStateStep1.errors.description.message}`}
                          </span>
                        </label>
                      )}
                    </div>

                    {/* BUTTONS */}
                    <div className="my-4 flex flex-row items-center justify-center gap-2 md:justify-end md:gap-4">
                      {opportunityId === "create" && (
                        <button
                          type="button"
                          className="btn btn-warning flex-grow md:w-1/3 md:flex-grow-0"
                          onClick={handleCancel}
                        >
                          Cancel
                        </button>
                      )}
                      <button
                        type="submit"
                        className="btn btn-success flex-grow md:w-1/3 md:flex-grow-0"
                      >
                        {opportunityId === "create" ? "Next" : "Submit"}
                      </button>
                    </div>
                  </form>
                </>
              )}
              {step === 2 && (
                <>
                  <div className="mb-4 flex flex-col">
                    <h5 className="font-bold">Opportunity detail</h5>
                    <p className="my-2 text-sm">
                      Detailed particulars about the opportunity
                    </p>
                  </div>

                  <form
                    ref={formRef2}
                    className="flex flex-col gap-4"
                    onSubmit={handleSubmitStep2((data) =>
                      onSubmitStep(3, data),
                    )}
                  >
                    <div className="form-control">
                      <label className="label font-bold">
                        <span className="label-text">Opportunity language</span>
                      </label>
                      <Controller
                        control={controlStep2}
                        name="languages"
                        render={({ field: { onChange, value } }) => (
                          <Select
                            instanceId="languages"
                            classNames={{
                              control: () => "input !border-gray h-fit py-1",
                            }}
                            isMulti={true}
                            options={languages}
                            onChange={(val) =>
                              onChange(val.map((c) => c.value))
                            }
                            value={languages?.filter(
                              (c) => value?.includes(c.value),
                            )}
                            styles={{
                              placeholder: (base) => ({
                                ...base,
                                color: "#A3A6AF",
                              }),
                            }}
                            inputId="input_languages" // e2e
                          />
                        )}
                      />

                      {formStateStep2.errors.languages && (
                        <label className="label -mb-5">
                          <span className="label-text-alt italic text-red-500">
                            {`${formStateStep2.errors.languages.message}`}
                          </span>
                        </label>
                      )}
                    </div>

                    <div className="form-control">
                      <label className="label font-bold">
                        <span className="label-text">
                          Country or region of opportunity
                        </span>
                      </label>
                      <Controller
                        control={controlStep2}
                        name="countries"
                        render={({ field: { onChange, value } }) => (
                          <Select
                            instanceId="countries"
                            classNames={{
                              control: () => "input !border-gray h-fit py-1",
                            }}
                            isMulti={true}
                            options={countries}
                            onChange={(val) =>
                              onChange(val.map((c) => c.value))
                            }
                            value={countries?.filter(
                              (c) => value?.includes(c.value),
                            )}
                            styles={{
                              placeholder: (base) => ({
                                ...base,
                                color: "#A3A6AF",
                              }),
                            }}
                            inputId="input_countries" // e2e
                          />
                        )}
                      />

                      {formStateStep2.errors.countries && (
                        <label className="label -mb-5">
                          <span className="label-text-alt italic text-red-500">
                            {`${formStateStep2.errors.countries.message}`}
                          </span>
                        </label>
                      )}
                    </div>

                    <div className="form-control">
                      <label className="label font-bold">
                        <span className="label-text">
                          Opportunity difficulty level
                        </span>
                      </label>
                      <Controller
                        control={controlStep2}
                        name="difficultyId"
                        render={({ field: { onChange, value } }) => (
                          <Select
                            instanceId="difficultyId"
                            classNames={{
                              control: () => "input !border-gray",
                            }}
                            isMulti={false}
                            options={difficulties}
                            onChange={(val) => onChange(val?.value)}
                            value={difficulties?.find((c) => c.value === value)}
                            styles={{
                              placeholder: (base) => ({
                                ...base,
                                color: "#A3A6AF",
                              }),
                            }}
                            inputId="input_difficultyId" // e2e
                          />
                        )}
                      />

                      {formStateStep2.errors.difficultyId && (
                        <label className="label -mb-5">
                          <span className="label-text-alt italic text-red-500">
                            {`${formStateStep2.errors.difficultyId.message}`}
                          </span>
                        </label>
                      )}
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="form-control">
                        <label className="label font-bold">
                          <span className="label-text">Number of</span>
                        </label>
                        <input
                          type="number"
                          className="input input-bordered rounded-md border-gray focus:border-gray focus:outline-none"
                          placeholder="Enter number"
                          {...registerStep2("commitmentIntervalCount", {
                            valueAsNumber: true,
                          })}
                        />
                        {formStateStep2.errors.commitmentIntervalCount && (
                          <label className="label -mb-5">
                            <span className="label-text-alt italic text-red-500">
                              {`${formStateStep2.errors.commitmentIntervalCount.message}`}
                            </span>
                          </label>
                        )}
                      </div>

                      <div className="form-control">
                        <label className="label font-bold">
                          <span className="label-text">Select time frame</span>
                        </label>
                        <Controller
                          control={controlStep2}
                          name="commitmentIntervalId"
                          render={({ field: { onChange, value } }) => (
                            <Select
                              instanceId="commitmentIntervalId"
                              classNames={{
                                control: () => "input !border-gray",
                              }}
                              options={timeIntervals}
                              onChange={(val) => onChange(val?.value)}
                              value={timeIntervals?.find(
                                (c) => c.value === value,
                              )}
                              styles={{
                                placeholder: (base) => ({
                                  ...base,
                                  color: "#A3A6AF",
                                }),
                              }}
                              inputId="input_commitmentIntervalId" // e2e
                            />
                          )}
                        />

                        {formStateStep2.errors.commitmentIntervalId && (
                          <label className="label -mb-5">
                            <span className="label-text-alt italic text-red-500">
                              {`${formStateStep2.errors.commitmentIntervalId.message}`}
                            </span>
                          </label>
                        )}
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="form-control">
                        <label className="label font-bold">
                          <span className="label-text">
                            Opportunity start date
                          </span>
                        </label>
                        <Controller
                          control={controlStep2}
                          name="dateStart"
                          render={({ field: { onChange, value } }) => (
                            <DatePicker
                              className="input input-bordered w-full rounded-md border-gray focus:border-gray focus:outline-none"
                              onChange={(date) => onChange(date)}
                              selected={value ? new Date(value) : null}
                              placeholderText="Start Date"
                              id="input_dateStart" // e2e
                            />
                          )}
                        />
                        {formStateStep2.errors.dateStart && (
                          <label className="label -mb-5">
                            <span className="label-text-alt italic text-red-500">
                              {`${formStateStep2.errors.dateStart.message}`}
                            </span>
                          </label>
                        )}
                      </div>

                      <div className="form-control">
                        <label className="label font-bold">
                          <span className="label-text">
                            Opportunity end date
                          </span>
                        </label>

                        <Controller
                          control={controlStep2}
                          name="dateEnd"
                          render={({ field: { onChange, value } }) => (
                            <DatePicker
                              className="input input-bordered w-full rounded-md border-gray focus:border-gray focus:outline-none"
                              onChange={(date) => onChange(date)}
                              selected={value ? new Date(value) : null}
                              placeholderText="Select End Date"
                              id="input_dateEnd" // e2e
                            />
                          )}
                        />

                        {formStateStep2.errors.dateEnd && (
                          <label className="label -mb-5">
                            <span className="label-text-alt italic text-red-500">
                              {`${formStateStep2.errors.dateEnd.message}`}
                            </span>
                          </label>
                        )}
                      </div>
                    </div>

                    <div className="form-control">
                      <label className="label font-bold">
                        <span className="label-text">
                          Opportunity participant limit
                        </span>
                      </label>

                      <div className="gap-2">
                        <input
                          type="number"
                          className="input input-bordered w-full rounded-md border-gray focus:border-gray focus:outline-none"
                          placeholder="Count of participants"
                          {...registerStep2("participantLimit", {
                            valueAsNumber: true,
                          })}
                          onBlur={(e) => {
                            // default pool to limit & reward
                            const participantLimit = parseInt(e.target.value);
                            // NB: yoma rewards has been disabled temporarily
                            //const yomaReward = getValuesStep3("yomaReward");
                            const zltoReward = getValuesStep3("zltoReward");

                            if (participantLimit !== null) {
                              // if (
                              //   yomaReward !== null &&
                              //   yomaReward !== undefined &&
                              //   !isNaN(yomaReward)
                              // )
                              //   setValueStep3(
                              //     "yomaRewardPool",
                              //     participantLimit * yomaReward,
                              //   );

                              if (
                                zltoReward !== null &&
                                zltoReward !== undefined &&
                                !isNaN(zltoReward)
                              )
                                setValueStep3(
                                  "zltoRewardPool",
                                  participantLimit * zltoReward,
                                );
                            }
                          }}
                        />
                      </div>
                      {formStateStep2.errors.participantLimit && (
                        <label className="label -mb-5">
                          <span className="label-text-alt italic text-red-500">
                            {`${formStateStep2.errors.participantLimit.message}`}
                          </span>
                        </label>
                      )}
                    </div>

                    {/* BUTTONS */}
                    <div className="my-4 flex items-center justify-center gap-2 md:justify-end md:gap-4">
                      {opportunityId === "create" && (
                        <button
                          type="button"
                          className="btn btn-warning flex-grow md:w-1/3 md:flex-grow-0"
                          onClick={() => {
                            setStep(1);
                          }}
                        >
                          Back
                        </button>
                      )}
                      <button
                        type="submit"
                        className="btn btn-success flex-grow md:w-1/3 md:flex-grow-0"
                      >
                        {opportunityId === "create" ? "Next" : "Submit"}
                      </button>
                    </div>
                  </form>
                </>
              )}
              {step === 3 && (
                <>
                  <div className="mb-4 flex flex-col">
                    <h5 className="font-bold">Rewards</h5>
                    <p className="my-2 text-sm">
                      Choose the reward that young participants will earn after
                      successfully completing the opportunity
                    </p>
                  </div>

                  <form
                    ref={formRef3}
                    className="flex flex-col gap-4"
                    onSubmit={handleSubmitStep3((data) =>
                      onSubmitStep(4, data),
                    )}
                  >
                    {/* NB: yoma rewards has been disabled temporarily */}
                    {/* <div className="grid grid-cols-2 gap-2">
                      <div className="form-control">
                        <label className="label">
                          <span className="label-text">Yoma Reward</span>
                        </label>
                        <input
                          type="number"
                          className="input input-bordered rounded-md border-gray focus:border-gray focus:outline-none"
                          placeholder="Enter reward amount"
                          {...registerStep3("yomaReward", {
                            valueAsNumber: true,
                          })}
                          onBlur={(e) => {
                            // default pool to limit & reward
                            const participantLimit =
                              getValuesStep2("participantLimit");
                            const yomaReward = parseInt(e.target.value);

                            if (
                              participantLimit !== null &&
                              !isNaN(yomaReward)
                            ) {
                              setValueStep3(
                                "yomaRewardPool",
                                participantLimit * yomaReward,
                              );
                            }
                          }}
                        />
                        {formStateStep3.errors.yomaReward && (
                          <label className="label">
                            <span className="label-text-alt italic text-red-500">
                              {`${formStateStep3.errors.yomaReward.message}`}
                            </span>
                          </label>
                        )}
                      </div>
                      <div className="form-control">
                        <label className="label">
                          <span className="label-text">Yoma Reward Pool</span>{" "}
                          <span className="font-gray-light label-text text-xs">
                            (default limit * reward)
                          </span>
                        </label>
                        <input
                          type="number"
                          className="input input-bordered rounded-md border-gray focus:border-gray focus:outline-none"
                          placeholder="Enter reward pool amount"
                          {...registerStep3("yomaRewardPool", {
                            valueAsNumber: true,
                          })}
                          onBlur={(e) => {
                            // default pool to limit & reward (when clearing the pool value)
                            const participantLimit =
                              getValuesStep2("participantLimit");
                            const yomaReward = getValuesStep3("yomaReward");
                            const yomaRewardPool = parseInt(e.target.value);

                            if (participantLimit !== null) {
                              if (
                                yomaReward !== null &&
                                yomaReward !== undefined &&
                                !isNaN(yomaReward) &&
                                (yomaRewardPool === null ||
                                  yomaRewardPool === undefined ||
                                  isNaN(yomaRewardPool))
                              ) {
                                setValueStep3(
                                  "yomaRewardPool",
                                  participantLimit * yomaReward,
                                );
                              }
                            }
                          }}
                        />
                        {formStateStep3.errors.yomaRewardPool && (
                          <label className="label">
                            <span className="label-text-alt italic text-red-500">
                              {`${formStateStep3.errors.yomaRewardPool.message}`}
                            </span>
                          </label>
                        )}
                      </div>
                    </div> */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="form-control">
                        <label className="label">
                          <span className="label-text font-bold">
                            ZLTO Reward
                          </span>
                        </label>
                        <input
                          type="number"
                          className="input input-bordered rounded-md border-gray focus:border-gray focus:outline-none"
                          placeholder="Enter reward amount"
                          {...registerStep3("zltoReward", {
                            valueAsNumber: true,
                          })}
                          onBlur={(e) => {
                            // default pool to limit & reward
                            const participantLimit =
                              getValuesStep2("participantLimit");
                            const zltoReward = parseInt(e.target.value);

                            if (
                              participantLimit !== null &&
                              !isNaN(zltoReward)
                            ) {
                              setValueStep3(
                                "zltoRewardPool",
                                participantLimit * zltoReward,
                              );
                            }
                          }}
                        />
                        {formStateStep3.errors.zltoReward && (
                          <label className="label -mb-5">
                            <span className="label-text-alt italic text-red-500">
                              {`${formStateStep3.errors.zltoReward.message}`}
                            </span>
                          </label>
                        )}
                      </div>
                      <div className="form-control">
                        <label className="label">
                          <span className="label-text font-bold">
                            ZLTO Reward Pool
                          </span>
                          <span className="font-gray-light label-text text-xs">
                            (default limit * reward)
                          </span>
                        </label>
                        <input
                          type="number"
                          className="input input-bordered rounded-md border-gray focus:border-gray focus:outline-none"
                          placeholder="Enter reward pool amount"
                          {...registerStep3("zltoRewardPool", {
                            valueAsNumber: true,
                          })}
                          onBlur={(e) => {
                            // default pool to limit & reward (when clearing the pool value)
                            const participantLimit =
                              getValuesStep2("participantLimit");
                            const zltoReward = getValuesStep3("zltoReward");
                            const zltoRewardPool = parseInt(e.target.value);

                            if (participantLimit !== null) {
                              if (
                                zltoReward !== null &&
                                zltoReward !== undefined &&
                                !isNaN(zltoReward) &&
                                (zltoRewardPool === null ||
                                  zltoRewardPool === undefined ||
                                  isNaN(zltoRewardPool))
                              ) {
                                setValueStep3(
                                  "zltoRewardPool",
                                  participantLimit * zltoReward,
                                );
                              }
                            }
                          }}
                        />
                        {formStateStep3.errors.zltoRewardPool && (
                          <label className="label -mb-5">
                            <span className="label-text-alt italic text-red-500">
                              {`${formStateStep3.errors.zltoRewardPool.message}`}
                            </span>
                          </label>
                        )}
                      </div>
                    </div>
                    <h6 className="font-bold">Skills</h6>
                    <div className="form-control">
                      <label className="label font-bold">
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
                            <Async
                              instanceId="skills"
                              classNames={{
                                control: () =>
                                  "input input-xs h-fit !border-gray",
                              }}
                              isMulti={true}
                              defaultOptions={true} // calls loadSkills for initial results when clicking on the dropdown
                              cacheOptions
                              loadOptions={loadSkills}
                              onChange={(val) => {
                                // eslint-disable-next-line @typescript-eslint/no-unsafe-return
                                onChange(val.map((c: any) => c.value));
                              }}
                              // for each value, look up the value and label from the cache
                              value={value?.map((x: any) => ({
                                value: x,
                                label: cacheSkills.find((c) => c.id === x)
                                  ?.name,
                              }))}
                              placeholder="Skill"
                              inputId="input_skills" // e2e
                            />
                          </>
                        )}
                      />
                      {formStateStep3.errors.skills && (
                        <label className="label -mb-5">
                          <span className="label-text-alt italic text-red-500">
                            {`${formStateStep3.errors.skills.message}`}
                          </span>
                        </label>
                      )}
                    </div>

                    {/* BUTTONS */}
                    <div className="my-4 flex items-center justify-center gap-4 md:justify-end">
                      {opportunityId === "create" && (
                        <button
                          type="button"
                          className="btn btn-warning flex-grow md:w-1/3 md:flex-grow-0"
                          onClick={() => {
                            setStep(2);
                          }}
                        >
                          Back
                        </button>
                      )}
                      <button
                        type="submit"
                        className="btn btn-success flex-grow md:w-1/3 md:flex-grow-0"
                      >
                        {opportunityId === "create" ? "Next" : "Submit"}
                      </button>
                    </div>
                  </form>
                </>
              )}
              {step === 4 && (
                <>
                  <div className="mb-4 flex flex-col">
                    <h5 className="font-bold">Keywords</h5>
                    <p className="my-2 text-sm">
                      Boost your chances of being found in searches by adding
                      keywords to your opportunity
                    </p>
                  </div>

                  <form
                    ref={formRef4}
                    className="flex h-full flex-col gap-4"
                    onSubmit={handleSubmitStep4((data) =>
                      onSubmitStep(5, data),
                    )}
                  >
                    <div className="form-control">
                      <label className="label font-bold">
                        <span className="label-text">Opportunity keywords</span>
                      </label>
                      <Controller
                        control={controlStep4}
                        name="keywords"
                        render={({ field: { onChange, value } }) => (
                          <>
                            {/* eslint-disable */}
                            <CreatableSelect
                              instanceId="keywords"
                              classNames={{
                                control: () => "input !border-gray h-fit py-1",
                              }}
                              isMulti={true}
                              onChange={(val) =>
                                onChange(val.map((c) => c.value))
                              }
                              value={value?.map((c: any) => ({
                                value: c,
                                label: c,
                              }))}
                              styles={{
                                placeholder: (base) => ({
                                  ...base,
                                  color: "#A3A6AF",
                                }),
                              }}
                              inputId="input_keywords" // e2e
                            />
                            {/* eslint-enable  */}
                          </>
                        )}
                      />
                      {formStateStep4.errors.keywords && (
                        <label className="label">
                          <span className="label-text-alt italic text-red-500">
                            {`${formStateStep4.errors.keywords.message}`}
                          </span>
                        </label>
                      )}
                    </div>

                    {/* BUTTONS */}
                    <div className="my-4 flex items-center justify-center gap-4 md:justify-end">
                      {opportunityId === "create" && (
                        <button
                          type="button"
                          className="btn btn-warning flex-grow md:w-1/3 md:flex-grow-0"
                          onClick={() => {
                            setStep(3);
                          }}
                        >
                          Back
                        </button>
                      )}
                      <button
                        type="submit"
                        className="btn btn-success flex-grow md:w-1/3 md:flex-grow-0"
                      >
                        {opportunityId === "create" ? "Next" : "Submit"}
                      </button>
                    </div>
                  </form>
                </>
              )}
              {step === 5 && (
                <>
                  <div className="mb-4 flex flex-col">
                    <h5 className="font-bold">Verification</h5>
                    <p className="my-2 text-sm">
                      How can young participants confirm their involvement?
                    </p>
                  </div>

                  <form
                    ref={formRef5}
                    className="flex flex-col gap-4"
                    onSubmit={handleSubmitStep5((data) =>
                      onSubmitStep(6, data),
                    )}
                  >
                    <div className="form-control">
                      <Controller
                        control={controlStep5}
                        name="verificationEnabled"
                        render={({ field: { onChange, value } }) => (
                          <>
                            {/* AUTOMATIC */}
                            {/* NB: automatic verification has been disabled temporarily */}
                            {/* <label
                              htmlFor="verificationEnabledAutomatic"
                              className="label cursor-pointer justify-normal"
                            >
                              <input
                                type="radio"
                                className="radio-primary radio"
                                id="verificationEnabledAutomatic"
                                onChange={() => {
                                  setValueStep5("verificationEnabled", true);
                                  setValueStep5(
                                    "verificationMethod",
                                    VerificationMethod.Automatic,
                                  );

                                  onChange(true);
                                }}
                                checked={
                                  value === true &&
                                  getValuesStep5("verificationMethod") ===
                                    VerificationMethod.Automatic
                                }
                              />
                              <span className="label-text ml-4">
                                Youth verification happens automatically
                              </span>
                            </label> */}

                            {/* MANUAL */}
                            <label
                              htmlFor="verificationEnabledManual"
                              className="label cursor-pointer justify-normal"
                            >
                              <input
                                type="radio"
                                className="radio-primary radio"
                                id="verificationEnabledManual"
                                onChange={() => {
                                  setValueStep5("verificationEnabled", true);
                                  setValueStep5(
                                    "verificationMethod",
                                    VerificationMethod.Manual,
                                  );

                                  onChange(true);
                                }}
                                checked={
                                  value === true &&
                                  getValuesStep5("verificationMethod") ===
                                    VerificationMethod.Manual
                                }
                              />
                              <span className="label-text ml-4">
                                Youth should upload proof of completion
                              </span>
                            </label>

                            {/* NOT REQUIRED */}
                            <label
                              htmlFor="verificationEnabledNo"
                              className="label cursor-pointer justify-normal"
                            >
                              <input
                                type="radio"
                                className="radio-primary radio"
                                id="verificationEnabledNo"
                                onChange={() => {
                                  setValueStep5("verificationEnabled", false);
                                  onChange(false);
                                }}
                                checked={value === false}
                              />
                              <span className="label-text ml-4">
                                No verification is required
                              </span>
                            </label>
                          </>
                        )}
                      />
                      {formStateStep5.errors.verificationEnabled && (
                        <label className="label -mb-5 font-bold">
                          <span className="label-text-alt italic text-red-500">
                            {`${formStateStep5.errors.verificationEnabled.message}`}
                          </span>
                        </label>
                      )}
                      {formStateStep5.errors.verificationMethod && (
                        <label className="label -mb-5 font-bold">
                          <span className="label-text-alt italic text-red-500">
                            {`${formStateStep5.errors.verificationMethod.message}`}
                          </span>
                        </label>
                      )}
                    </div>

                    {watchVerificationEnabled &&
                      watchVerificationMethod === VerificationMethod.Manual && (
                        <div className="form-control">
                          <label className="label font-bold">
                            <span className="label-text">
                              Select the types of proof that participants need
                              to upload as part of completing the opportuntity.
                            </span>
                          </label>

                          <div className="flex flex-col gap-1">
                            {verificationTypes?.map((item) => (
                              <div
                                className="flex flex-col"
                                key={`verificationTypes_${item.id}`}
                              >
                                {/* verification type: checkbox label */}
                                <label
                                  htmlFor={`chk_verificationType_${item.displayName}`}
                                  className="label w-full cursor-pointer justify-normal"
                                >
                                  <input
                                    type="checkbox"
                                    value={item.type}
                                    // on change, add or remove the item from the verificationTypes array
                                    onChange={(e) => {
                                      if (e.target.checked) append(item);
                                      else {
                                        const index =
                                          watchVerificationTypes?.findIndex(
                                            (x: OpportunityVerificationType) =>
                                              x.type === item.type,
                                          );
                                        remove(index);
                                      }
                                    }}
                                    id={`chk_verificationType_${item.displayName}`} // e2e
                                    className="checkbox-primary checkbox"
                                    disabled={!watchVerificationEnabled}
                                    checked={
                                      watchVerificationTypes?.find(
                                        (x: OpportunityVerificationType) =>
                                          x?.type === item.type,
                                      ) !== undefined
                                    }
                                  />
                                  <span className="label-text ml-4">
                                    {item.displayName}
                                  </span>
                                </label>

                                {/* verification type: description input */}
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
                                      className="input input-bordered rounded-md border-gray focus:border-gray focus:outline-none"
                                      placeholder="Enter description"
                                      onChange={(e) => {
                                        // update the description in the verificationTypes array
                                        setValueStep5(
                                          "verificationTypes",
                                          watchVerificationTypes?.map(
                                            (
                                              x: OpportunityVerificationType,
                                            ) => {
                                              if (x.type === item.type) {
                                                x.description = e.target.value;
                                              }
                                              return x;
                                            },
                                          ),
                                        );
                                      }}
                                      contentEditable
                                      defaultValue={
                                        // get default value from formData or item description
                                        formData.verificationTypes?.find(
                                          (x) => x.type === item.type,
                                        )?.description ?? item.description
                                      }
                                      disabled={!watchVerificationEnabled}
                                      id={`input_verificationType_${item.displayName}`} // e2e
                                    />
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                          {formStateStep5.errors.verificationTypes && (
                            <label className="label -mb-5 font-bold">
                              <span className="label-text-alt italic text-red-500">
                                {`${formStateStep5.errors.verificationTypes.message}`}
                              </span>
                            </label>
                          )}
                        </div>
                      )}

                    {/* BUTTONS */}
                    <div className="my-4 flex items-center justify-center gap-4 md:justify-end">
                      {opportunityId === "create" && (
                        <button
                          type="button"
                          className="btn btn-warning flex-grow md:w-1/3 md:flex-grow-0"
                          onClick={() => {
                            setStep(4);
                          }}
                        >
                          Back
                        </button>
                      )}
                      <button
                        type="submit"
                        className="btn btn-success flex-grow md:w-1/3 md:flex-grow-0"
                      >
                        {opportunityId === "create" ? "Next" : "Submit"}
                      </button>
                    </div>
                  </form>
                </>
              )}
              {step === 6 && (
                <>
                  <div className="mb-4 flex flex-col">
                    <h5 className="font-bold">Credential</h5>
                    <p className="my-2 text-sm">
                      Information about the credential that Youth will receive
                      upon completion of this opportunity
                    </p>
                  </div>

                  <form
                    ref={formRef6}
                    className="flex flex-col gap-4"
                    onSubmit={handleSubmitStep6((data) =>
                      onSubmitStep(7, data),
                    )}
                  >
                    <div className="form-control">
                      {/* checkbox label */}
                      <label
                        htmlFor="credentialIssuanceEnabled"
                        className="label w-full cursor-pointer justify-normal"
                      >
                        <input
                          {...registerStep6(`credentialIssuanceEnabled`)}
                          type="checkbox"
                          id="credentialIssuanceEnabled"
                          className="checkbox-primary checkbox"
                          disabled={watchVerificationEnabled !== true}
                        />
                        <span className="label-text ml-4">
                          I want to issue a credential upon completion
                        </span>
                      </label>

                      {watchVerificationEnabled !== true && (
                        <div className="text-sm text-warning">
                          Credential issuance is only available if Verification
                          is supported (previous step).
                        </div>
                      )}
                      {formStateStep6.errors.credentialIssuanceEnabled && (
                        <label className="label -mb-5 font-bold">
                          <span className="label-text-alt italic text-red-500">
                            {`${formStateStep6.errors.credentialIssuanceEnabled.message}`}
                          </span>
                        </label>
                      )}
                    </div>

                    {watchCredentialIssuanceEnabled && (
                      <>
                        <div className="form-control">
                          <label className="label">
                            <span className="label-text">Select schema</span>
                          </label>

                          <Controller
                            control={controlStep6}
                            name="ssiSchemaName"
                            render={({ field: { onChange, value } }) => (
                              <Select
                                instanceId="ssiSchemaName"
                                classNames={{
                                  control: () =>
                                    "input !border-gray h-fit py-1",
                                }}
                                options={schemasOptions}
                                onChange={(val) => onChange(val?.value)}
                                value={schemasOptions?.find(
                                  (c) => c.value === value,
                                )}
                                styles={{
                                  placeholder: (base) => ({
                                    ...base,
                                    color: "#A3A6AF",
                                  }),
                                }}
                                inputId="input_ssiSchemaName" // e2e
                              />
                            )}
                          />
                          {formStateStep6.errors.ssiSchemaName && (
                            <label className="label -mb-5">
                              <span className="label-text-alt italic text-red-500">
                                {`${formStateStep6.errors.ssiSchemaName.message}`}
                              </span>
                            </label>
                          )}
                        </div>

                        {/* SCHEMA ATTRIBUTES */}
                        {watcSSISchemaName && (
                          <>
                            <div className="flex flex-col gap-2">
                              <table className="table w-full">
                                <thead>
                                  <tr className="border-gray text-gray-dark">
                                    <th>Datasource</th>
                                    <th>Attribute</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {schemaAttributes?.map(
                                    (attribute) =>
                                      attribute.properties?.map(
                                        (property, index) => (
                                          <tr
                                            key={`schemaAttributes_${attribute.id}_${index}_${property.id}`}
                                            className="border-gray text-gray-dark"
                                          >
                                            <td>{attribute?.name}</td>
                                            <td>{property.nameDisplay}</td>
                                          </tr>
                                        ),
                                      ),
                                  )}
                                </tbody>
                              </table>
                            </div>
                          </>
                        )}
                      </>
                    )}

                    {/* BUTTONS */}
                    <div className="my-4 flex items-center justify-center gap-4 md:justify-end">
                      {opportunityId === "create" && (
                        <button
                          type="button"
                          className="btn btn-warning flex-grow md:w-1/3 md:flex-grow-0"
                          onClick={() => {
                            setStep(5);
                          }}
                        >
                          Back
                        </button>
                      )}
                      <button
                        type="submit"
                        className="btn btn-success flex-grow md:w-1/3 md:flex-grow-0"
                      >
                        {opportunityId === "create" ? "Next" : "Submit"}
                      </button>
                    </div>
                  </form>
                </>
              )}

              {/* only show preview when creating new opportunity */}
              {step === 7 && opportunityId === "create" && (
                <>
                  <div className="mb-4 flex flex-col">
                    <h5 className="font-bold">Opportunity preview</h5>
                    <p className="my-2 text-sm">
                      Detailed particulars about the opportunity
                    </p>
                  </div>

                  <form
                    ref={formRef7}
                    className="flex flex-col gap-4"
                    onSubmit={handleSubmitStep7((data) =>
                      onSubmitStep(8, data),
                    )}
                  >
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text font-semibold">
                          Opportunity title
                        </span>
                      </label>
                      <label className="label label-text pt-0 text-sm">
                        {formData.title}
                      </label>
                      {formStateStep1.errors.title && (
                        <label className="label -mb-5">
                          <span className="label-text-alt italic text-red-500">
                            {`${formStateStep1.errors.title.message}`}
                          </span>
                        </label>
                      )}
                    </div>
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text font-semibold">
                          Opportunity description
                        </span>
                      </label>
                      <label className="label label-text pt-0 text-sm ">
                        {formData.description}
                      </label>
                      {formStateStep1.errors.description && (
                        <label className="label -mb-5">
                          <span className="label-text-alt italic text-red-500">
                            {`${formStateStep1.errors.description.message}`}
                          </span>
                        </label>
                      )}
                    </div>

                    <div className="form-control">
                      <label className="label">
                        <span className="label-text font-semibold">
                          Opportunity type
                        </span>
                      </label>
                      <label className="label label-text pt-0 text-sm ">
                        {
                          opportunityTypes?.find(
                            (x) => x.value == formData.typeId,
                          )?.label
                        }
                      </label>
                      {formStateStep1.errors.typeId && (
                        <label className="label -mb-5">
                          <span className="label-text-alt italic text-red-500">
                            {`${formStateStep1.errors.typeId.message}`}
                          </span>
                        </label>
                      )}
                    </div>

                    <div className="form-control">
                      <label className="label">
                        <span className="label-text font-semibold">
                          Opportunity keywords
                        </span>
                      </label>
                      <label className="label label-text pt-0 text-sm ">
                        {formData.keywords?.join(", ")}
                      </label>
                      {formStateStep1.errors.keywords && (
                        <label className="label -mb-5">
                          <span className="label-text-alt italic text-red-500">
                            {`${formStateStep1.errors.keywords.message}`}
                          </span>
                        </label>
                      )}
                    </div>

                    <div className="form-control">
                      <label className="label">
                        <span className="label-text font-semibold">
                          Opportunity link
                        </span>
                      </label>
                      <label className="label label-text pt-0 text-sm ">
                        <Link
                          className="link link-primary"
                          href={formData.uRL ?? "#"}
                          target="new"
                        >
                          {formData.uRL}
                        </Link>
                      </label>
                      {formStateStep1.errors.uRL && (
                        <label className="label -mb-5">
                          <span className="label-text-alt italic text-red-500">
                            {`${formStateStep1.errors.uRL.message}`}
                          </span>
                        </label>
                      )}
                    </div>

                    <div className="form-control">
                      <label className="label">
                        <span className="label-text font-semibold">
                          Opportunity difficulty
                        </span>
                      </label>
                      <label className="label label-text pt-0 text-sm ">
                        {
                          difficulties?.find(
                            (x) => x.value == formData.difficultyId,
                          )?.label
                        }
                      </label>
                      {formStateStep2.errors.difficultyId && (
                        <label className="label -mb-5">
                          <span className="label-text-alt italic text-red-500">
                            {`${formStateStep2.errors.difficultyId.message}`}
                          </span>
                        </label>
                      )}
                    </div>

                    <div className="form-control">
                      <label className="label">
                        <h5 className="font-bold">Opportunity languages</h5>
                      </label>
                      <label className="label label-text pt-0 text-sm ">
                        {formData.languages
                          ?.map(
                            (x) => languages?.find((y) => y.value == x)?.label,
                          )
                          .join(", ")}
                      </label>
                      {formStateStep2.errors.languages && (
                        <label className="label -mb-5">
                          <span className="label-text-alt italic text-red-500">
                            {`${formStateStep2.errors.languages.message}`}
                          </span>
                        </label>
                      )}
                    </div>

                    <div className="form-control">
                      <label className="label">
                        <h5 className="font-bold">Opportunity countries</h5>
                      </label>
                      <label className="label label-text pt-0 text-sm ">
                        {formData.countries
                          ?.map(
                            (x) => countries?.find((y) => y.value == x)?.label,
                          )
                          .join(", ")}
                      </label>
                      {formStateStep2.errors.countries && (
                        <label className="label -mb-5">
                          <span className="label-text-alt italic text-red-500">
                            {`${formStateStep2.errors.countries.message}`}
                          </span>
                        </label>
                      )}
                    </div>

                    <div className="flex flex-col">
                      <div className="form-control">
                        <label className="label">
                          <h5 className="font-bold">Opportunity duration</h5>
                        </label>
                        <label className="label label-text pt-0 text-sm ">
                          {formData.commitmentIntervalCount}{" "}
                          {
                            timeIntervals?.find(
                              (x) => x.value == formData.commitmentIntervalId,
                            )?.label
                          }
                        </label>
                        {formStateStep2.errors.commitmentIntervalCount && (
                          <label className="label -mb-5">
                            <span className="label-text-alt italic text-red-500">
                              {`${formStateStep2.errors.commitmentIntervalCount.message}`}
                            </span>
                          </label>
                        )}
                        {formStateStep2.errors.commitmentIntervalId && (
                          <label className="label -mb-5">
                            <span className="label-text-alt italic text-red-500">
                              {`${formStateStep2.errors.commitmentIntervalId.message}`}
                            </span>
                          </label>
                        )}
                      </div>

                      <div className="flex flex-row gap-4">
                        <div className="form-control flex flex-row">
                          <label className="label">
                            <span className="label-text font-semibold">
                              Start date&#58;
                            </span>
                          </label>
                          <label className="label label-text text-sm">
                            <Moment format={DATE_FORMAT_HUMAN}>
                              {formData.dateStart!}
                            </Moment>
                          </label>
                          {formStateStep2.errors.dateStart && (
                            <label className="label -mb-5">
                              <span className="label-text-alt italic text-red-500">
                                {`${formStateStep2.errors.dateStart.message}`}
                              </span>
                            </label>
                          )}
                        </div>
                        <div className="form-control flex flex-row">
                          <label className="label">
                            <span className="label-text font-semibold">
                              End date&#58;
                            </span>
                          </label>
                          <label className="label label-text text-sm">
                            <Moment format={DATE_FORMAT_HUMAN}>
                              {formData.dateEnd!}
                            </Moment>
                          </label>
                          {formStateStep2.errors.dateEnd && (
                            <label className="label -mb-5">
                              <span className="label-text-alt italic text-red-500">
                                {`${formStateStep2.errors.dateEnd.message}`}
                              </span>
                            </label>
                          )}
                        </div>
                      </div>
                    </div>
                    {/* NB: yoma rewards has been disabled temporarily */}
                    {/* <div className="form-control">
                      <label className="label">
                        <span className="label-text font-semibold">
                          Yoma Reward
                        </span>
                      </label>
                      <label className="label label-text text-sm pt-0 ">
                        {formData.yomaReward}
                      </label>
                      {formStateStep2.errors.yomaReward && (
                        <label className="label">
                          <span className="label-text-alt italic text-red-500">
                            {`${formStateStep2.errors.yomaReward.message}`}
                          </span>
                        </label>
                      )}
                    </div>

                    <div className="form-control">
                      <label className="label">
                        <span className="label-text font-semibold">
                          Yoma Reward Pool
                        </span>
                      </label>
                      <label className="label label-text text-sm pt-0 ">
                        {formData.yomaRewardPool}
                      </label>
                      {formStateStep2.errors.yomaRewardPool && (
                        <label className="label">
                          <span className="label-text-alt italic text-red-500">
                            {`${formStateStep2.errors.yomaRewardPool.message}`}
                          </span>
                        </label>
                      )}
                    </div> */}

                    <div className="form-control">
                      <label className="label">
                        <h5 className="font-bold">Participants</h5>
                      </label>
                      <label className="label label-text pt-0 text-sm ">
                        {formData.participantLimit}
                      </label>
                      {formStateStep2.errors.participantLimit && (
                        <label className="label -mb-5">
                          <span className="label-text-alt italic text-red-500">
                            {`${formStateStep2.errors.participantLimit.message}`}
                          </span>
                        </label>
                      )}
                    </div>

                    <div>
                      <h5 className="font-bold">Rewards</h5>
                      <div className="flex flex-row gap-4">
                        <div className="form-control flex flex-row">
                          <label className="label">
                            <span className="label-text font-semibold">
                              Zlto Reward&#58;
                            </span>
                          </label>
                          <label className="label label-text text-sm ">
                            {formData.zltoReward}
                          </label>
                          {formStateStep2.errors.zltoReward && (
                            <label className="label -mb-5">
                              <span className="label-text-alt italic text-red-500">
                                {`${formStateStep2.errors.zltoReward.message}`}
                              </span>
                            </label>
                          )}
                        </div>
                        <div className="form-control flex flex-row">
                          <label className="label">
                            <span className="label-text font-semibold">
                              Zlto Reward Pool&#58;
                            </span>
                          </label>
                          <label className="label label-text text-sm ">
                            {formData.zltoRewardPool}
                          </label>
                          {formStateStep2.errors.zltoRewardPool && (
                            <label className="label -mb-5">
                              <span className="label-text-alt italic text-red-500">
                                {`${formStateStep2.errors.zltoRewardPool.message}`}
                              </span>
                            </label>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="form-control">
                      <label className="label">
                        <h5 className="font-bold">Verification Supported</h5>
                      </label>
                      <label className="label label-text pt-0 text-sm ">
                        {formData.verificationEnabled
                          ? "Youth should upload proof of completion"
                          : "No verification is required"}
                      </label>
                      {formStateStep3.errors.verificationEnabled && (
                        <label className="label -mb-5">
                          <span className="label-text-alt italic text-red-500">
                            {`${formStateStep3.errors.verificationEnabled.message}`}
                          </span>
                        </label>
                      )}
                    </div>

                    {formData.verificationEnabled && (
                      <div className="form-control">
                        <label className="label">
                          <h5 className="font-bold">Verification Types</h5>
                        </label>
                        <label className="label label-text pt-0 text-sm ">
                          {formData.verificationTypes
                            ?.map(
                              (x) =>
                                verificationTypes?.find((y) => y.id == x.id)
                                  ?.displayName,
                            )
                            .filter((x) => x !== undefined)
                            .join(", ")}
                        </label>
                        {formStateStep3.errors.verificationTypes && (
                          <label className="label -mb-5">
                            <span className="label-text-alt italic text-red-500">
                              {`${formStateStep3.errors.verificationTypes.message}`}
                            </span>
                          </label>
                        )}
                      </div>
                    )}

                    <div className="form-control">
                      <label className="label">
                        <h5 className="font-bold">Credential</h5>
                      </label>
                      <label className="label label-text pt-0 text-sm ">
                        {formData.credentialIssuanceEnabled
                          ? "I want to issue a credential upon completionn"
                          : "No credential is required"}
                      </label>
                      {formStateStep6.errors.credentialIssuanceEnabled && (
                        <label className="label -mb-5">
                          <span className="label-text-alt italic text-red-500">
                            {`${formStateStep6.errors.credentialIssuanceEnabled.message}`}
                          </span>
                        </label>
                      )}
                    </div>

                    <div className="form-control">
                      <label className="label">
                        <h5 className="font-bold">Schema</h5>
                      </label>
                      <label className="label label-text pt-0 text-sm ">
                        {formData.ssiSchemaName}
                      </label>
                      {formStateStep6.errors.ssiSchemaName && (
                        <label className="label -mb-5">
                          <span className="label-text-alt italic text-red-500">
                            {`${formStateStep6.errors.ssiSchemaName.message}`}
                          </span>
                        </label>
                      )}
                    </div>

                    {/* SCHEMA ATTRIBUTES */}
                    {watcSSISchemaName && (
                      <>
                        <div className="flex flex-col gap-2">
                          <table className="table w-full">
                            <thead>
                              <tr className="border-gray text-gray-dark">
                                <th>Datasource</th>
                                <th>Attribute</th>
                              </tr>
                            </thead>
                            <tbody>
                              {schemaAttributes?.map(
                                (attribute) =>
                                  attribute.properties?.map(
                                    (property, index) => (
                                      <tr
                                        key={`schemaAttributesPreview_${attribute.id}_${index}_${property.id}`}
                                        className="border-gray text-gray-dark"
                                      >
                                        <td>{attribute?.name}</td>
                                        <td>{property.nameDisplay}</td>
                                      </tr>
                                    ),
                                  ),
                              )}
                            </tbody>
                          </table>
                        </div>
                      </>
                    )}

                    <div className="form-control">
                      {/* checkbox label */}
                      <label
                        htmlFor="postAsActive"
                        className="label w-full cursor-pointer justify-normal"
                      >
                        <input
                          {...registerStep7(`postAsActive`)}
                          type="checkbox"
                          id="postAsActive"
                          className="checkbox-primary checkbox"
                        />
                        <span className="label-text ml-4">
                          Make this opportunity active
                        </span>
                      </label>

                      {formStateStep7.errors.postAsActive && (
                        <label className="label -mb-5 font-bold">
                          <span className="label-text-alt italic text-red-500">
                            {`${formStateStep7.errors.postAsActive.message}`}
                          </span>
                        </label>
                      )}
                    </div>

                    {/* BUTTONS */}
                    <div className="my-4 flex items-center justify-center gap-4 md:justify-end">
                      <button
                        type="button"
                        className="btn btn-warning flex-grow md:w-1/3 md:flex-grow-0"
                        onClick={() => {
                          setStep(6);
                        }}
                      >
                        Back
                      </button>
                      <button
                        type="submit"
                        className="btn btn-success flex-grow disabled:bg-gray-light md:w-1/3 md:flex-grow-0"
                        disabled={
                          !(
                            formStateStep1.isValid &&
                            formStateStep2.isValid &&
                            formStateStep3.isValid &&
                            formStateStep4.isValid &&
                            formStateStep5.isValid &&
                            formStateStep6.isValid &&
                            formStateStep7.isValid
                          )
                        }
                      >
                        Publish opportunity
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

// 👇 return theme from component properties. this is set server-side (getServerSideProps)
OpportunityDetails.theme = function getTheme(page: ReactElement) {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return page.props.theme;
};

export default OpportunityDetails;
