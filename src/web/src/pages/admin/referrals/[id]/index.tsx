import { zodResolver } from "@hookform/resolvers/zod";
import {
  QueryClient,
  dehydrate,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import axios, { type AxiosError } from "axios";
import { type GetServerSidePropsContext } from "next";
import { getServerSession } from "next-auth";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import iconZlto from "public/images/icon-zlto.svg";
import { type ParsedUrlQuery } from "querystring";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactElement,
} from "react";
import {
  Controller,
  useFieldArray,
  useForm,
  type FieldValues,
} from "react-hook-form";
import Select from "react-select";
import { FaExclamationTriangle } from "react-icons/fa";
import {
  IoIosCheckmarkCircle,
  IoMdAlert,
  IoMdArrowRoundBack,
  IoMdClose,
} from "react-icons/io";
import { toast } from "react-toastify";
import z from "zod";
import {
  PathwayCompletionRule,
  PathwayOrderMode,
  PathwayTaskEntityType,
  type Program,
  type ProgramRequestCreate,
  type ProgramRequestUpdate,
} from "~/api/models/referrals";
import type { Opportunity } from "~/api/models/opportunity";
import {
  createReferralProgram,
  getReferralProgramById,
  updateReferralProgram,
  updateReferralProgramImage,
} from "~/api/services/referrals";
import type { Country } from "~/api/models/lookups";
import { getCountries } from "~/api/services/lookups";
import { getOpportunityById } from "~/api/services/opportunities";
import AvatarUpload from "~/components/Organisation/Upsert/AvatarUpload";
import CustomModal from "~/components/Common/CustomModal";
import FormField from "~/components/Common/FormField";
import FormInput from "~/components/Common/FormInput";
import FormRequiredFieldMessage from "~/components/Common/FormRequiredFieldMessage";
import MainLayout from "~/components/Layout/Main";
import { PageBackground } from "~/components/PageBackground";
import {
  AdminProgramInfo,
  ProgramInfoFilterOptions,
} from "~/components/Referrals/AdminProgramInfo";
import { AdminProgramPathwayEditComponent } from "~/components/Referrals/AdminProgramPathwayEdit";
import { ProgramStatusBadge } from "~/components/Referrals/ProgramStatusBadge";
import {
  AdminReferralProgramActions,
  ReferralProgramActionOptions,
} from "~/components/Referrals/AdminReferralProgramActions";
import { ApiErrors } from "~/components/Status/ApiErrors";
import { InternalServerError } from "~/components/Status/InternalServerError";
import { Loading } from "~/components/Status/Loading";
import { Unauthenticated } from "~/components/Status/Unauthenticated";
import { Unauthorized } from "~/components/Status/Unauthorized";
import { config } from "~/lib/react-query-config";
import {
  getSafeUrl,
  getThemeFromRole,
  utcToDateInput,
  dateInputToUTC,
  dateInputToUTCEndOfDay,
} from "~/lib/utils";
import { COUNTRY_CODE_WW } from "~/lib/constants";
import type { NextPageWithLayout } from "~/pages/_app";
import { authOptions, type User } from "~/server/auth";
import FormMessage, { FormMessageType } from "~/components/Common/FormMessage";
import { ProgramImage } from "~/components/Referrals/ProgramImage";

type SelectOption = { value: string; label: string };

interface IParams extends ParsedUrlQuery {
  id: string;
  returnUrl?: string;
}

// Validation schemas for each step
const schemaStep1 = z
  .object({
    name: z
      .string()
      .min(1, "Name is required")
      .max(150, "Name cannot exceed 150 characters"),
    description: z
      .string()
      .max(500, "Description cannot exceed 500 characters"),
    image: z.any().optional(), // Store uploaded image file
    //isDefault: z.boolean(),
  })
  .refine(() => true, {
    message: "Step 1 validation",
  });

const schemaStep2 = z
  .object({
    dateStart: z.string().min(1, "Start date is required"),
    dateEnd: z.string().nullable(),
    countries: z
      .array(z.string(), { required_error: "Country is required" })
      .min(1, "Country is required."),
  })
  .refine(
    (data) => {
      if (data.dateEnd && data.dateStart) {
        return data.dateEnd >= data.dateStart;
      }
      return true;
    },
    {
      message: "End date must be after start date",
      path: ["dateEnd"],
    },
  );

const schemaStep3 = z
  .object({
    completionWindowInDays: z
      .union([z.string(), z.number()])
      .pipe(
        z.coerce
          .number()
          .min(1, "Completion window must be greater than 0 days"),
      )
      .nullable()
      .catch(null)
      .transform((val) => (val === 0 ? null : val)),
    completionLimitReferee: z
      .union([z.string(), z.number()])
      .pipe(
        z.coerce
          .number()
          .min(1, "Per-referrer completion limit must be greater than 0"),
      )
      .nullable()
      .catch(null)
      .transform((val) => (val === 0 ? null : val)),
    completionLimit: z
      .union([z.string(), z.number()])
      .pipe(
        z.coerce
          .number()
          .min(1, "Program completion limit must be greater than 0"),
      )
      .nullable()
      .catch(null)
      .transform((val) => (val === 0 ? null : val)),
    zltoRewardReferrer: z
      .union([z.string(), z.number()])
      .pipe(
        z.coerce
          .number()
          .min(1, "Referrer reward must be greater than 0")
          .max(2000, "Referrer reward may not exceed 2000")
          .refine((val) => val % 1 === 0, {
            message: "Referrer reward must be a whole number",
          }),
      )
      .nullable()
      .catch(null)
      .transform((val) => (val === 0 ? null : val)),
    zltoRewardReferee: z
      .union([z.string(), z.number()])
      .pipe(
        z.coerce
          .number()
          .min(1, "Referee reward must be greater than 0")
          .max(2000, "Referee reward may not exceed 2000")
          .refine((val) => val % 1 === 0, {
            message: "Referee reward must be a whole number",
          }),
      )
      .nullable()
      .catch(null)
      .transform((val) => (val === 0 ? null : val)),
    zltoRewardPool: z
      .union([z.string(), z.number()])
      .pipe(
        z.coerce
          .number()
          .min(1, "Reward pool must be greater than 0")
          .max(10000000, "Reward pool may not exceed 10 million")
          .refine((val) => val % 1 === 0, {
            message: "Reward pool must be a whole number",
          }),
      )
      .nullable()
      .catch(null)
      .transform((val) => (val === 0 ? null : val)),
  })
  .refine(
    (data) => {
      // At least one must be configured
      return !!(
        data.completionWindowInDays ||
        data.completionLimitReferee ||
        data.completionLimit ||
        data.zltoRewardReferrer ||
        data.zltoRewardReferee
      );
    },
    {
      message:
        "At least one of: Completion Window, Caps, or Rewards must be configured",
      path: ["completionWindowInDays"],
    },
  )
  .refine(
    (data) => {
      // Reward pool must be at least the total of the referrer + referee rewards
      const totalRewards =
        (data.zltoRewardReferrer ?? 0) + (data.zltoRewardReferee ?? 0);
      if (!data.zltoRewardPool || totalRewards === 0) return true;
      return data.zltoRewardPool >= totalRewards;
    },
    {
      message:
        "Reward pool must be at least the total of the referrer + referee rewards",
      path: ["zltoRewardPool"],
    },
  )
  .refine(
    (data) => {
      // When rewards are set, add at least one completion cap (per referrer or program-wide)
      const rewardsConfigured =
        (data.zltoRewardReferrer ?? 0) + (data.zltoRewardReferee ?? 0) > 0;
      if (!rewardsConfigured) return true;
      return (
        (data.completionLimitReferee ?? 0) > 0 ||
        (data.completionLimit ?? 0) > 0
      );
    },
    {
      message:
        "When rewards are set, add at least one completion cap (per referrer or program-wide)",
      path: ["completionLimitReferee"],
    },
  );

const schemaStep4 = z
  .object({
    proofOfPersonhoodRequired: z.boolean(),
    pathwayRequired: z.boolean(),
    multipleLinksAllowed: z.boolean(),
    isDefault: z.boolean(),
    // Need these for cross-validation with Step 3
    zltoRewardReferrer: z.number().nullable().optional(),
    zltoRewardReferee: z.number().nullable().optional(),
    completionLimitReferee: z.number().nullable().optional(),
  })
  .refine(
    (data) => {
      // If rewards exist, require at least one gate: POP or Pathway
      const rewards =
        (data.zltoRewardReferrer ?? 0) + (data.zltoRewardReferee ?? 0) > 0;
      if (!rewards) return true;
      return data.proofOfPersonhoodRequired || data.pathwayRequired;
    },
    {
      message:
        "When rewards are set, enable Proof of Personhood or require a Pathway",
      path: ["proofOfPersonhoodRequired"],
    },
  )
  .refine(
    (data) => {
      // If program is marked as default, require POP or Pathway
      if (!data.isDefault) return true;
      return data.proofOfPersonhoodRequired || data.pathwayRequired;
    },
    {
      message:
        "Default programs must enable Proof of Personhood or require a Pathway",
      path: ["isDefault"],
    },
  )
  .refine(
    (data) => {
      // If multiple links are allowed, require POP or a per-referrer cap or Pathway
      if (!data.multipleLinksAllowed) return true;
      const hasPerReferrerCap = (data.completionLimitReferee ?? 0) > 0;
      return (
        data.proofOfPersonhoodRequired ||
        hasPerReferrerCap ||
        data.pathwayRequired
      );
    },
    {
      message:
        "When multiple links are allowed, enable Proof of Personhood, set a per-referrer cap, or require a Pathway",
      path: ["multipleLinksAllowed"],
    },
  );

const schemaStep5 = z
  .object({
    pathwayRequired: z.boolean(),
    pathway: z
      .object({
        id: z.string().optional().nullable(),
        name: z
          .string()
          .min(1, "Pathway name is required")
          .max(150, "Pathway name cannot exceed 150 characters"),
        description: z
          .string()
          .max(500, "Description cannot exceed 500 characters")
          .nullable(),
        rule: z.nativeEnum(PathwayCompletionRule),
        orderMode: z.string().nullable(),
        steps: z
          .array(
            z.object({
              id: z.string().optional().nullable(),
              name: z
                .string()
                .min(1, "Step name is required")
                .max(150, "Step name cannot exceed 150 characters"),
              description: z
                .string()
                .max(500, "Description cannot exceed 500 characters")
                .nullable(),
              rule: z.nativeEnum(PathwayCompletionRule),
              orderMode: z.string().nullable(),
              tasks: z
                .array(
                  z.object({
                    id: z.string().optional().nullable(),
                    entityType: z.nativeEnum(PathwayTaskEntityType),
                    entityId: z.string().min(1, "Opportunity is required"),
                  }),
                )
                .min(1, "At least one task is required per step"),
            }),
          )
          .min(1, "At least one step is required when pathway is configured"),
      })
      .refine(
        (pathway) => {
          // When pathway order mode is Sequential, rule must be All
          if (pathway.orderMode !== PathwayOrderMode.Sequential) return true;
          return pathway.rule === PathwayCompletionRule.All;
        },
        {
          message:
            "When the pathway order mode is 'Sequential', the pathway rule must be 'All' (cannot be 'Any')",
          path: ["orderMode"],
        },
      )
      .nullable(),
  })
  .refine(
    (data) => {
      // If pathwayRequired is false, pathway must be null
      if (!data.pathwayRequired) {
        return data.pathway === null;
      }
      return true;
    },
    {
      message: "Remove the pathway — this program does not require one",
      path: ["pathway"],
    },
  )
  .refine(
    (data) => {
      // If pathwayRequired is true, pathway must be configured
      if (data.pathwayRequired) {
        return (
          data.pathway !== null &&
          data.pathway !== undefined &&
          data.pathway.steps &&
          data.pathway.steps.length > 0
        );
      }
      return true;
    },
    {
      message: "Please add a pathway — this program requires one",
      path: ["pathway"],
    },
  )
  .superRefine((data, ctx) => {
    // Unique step names validation (case-insensitive)
    if (!data.pathway?.steps || data.pathway.steps.length <= 1) return;

    const stepNames = data.pathway.steps
      .map((s) => s.name.trim().toLowerCase())
      .filter((name) => name.length > 0);

    const duplicates = stepNames.filter(
      (name, index) => stepNames.indexOf(name) !== index,
    );

    if (duplicates.length > 0) {
      data.pathway.steps.forEach((step, stepIndex) => {
        const normalizedName = step.name.trim().toLowerCase();
        if (
          normalizedName &&
          stepNames.indexOf(normalizedName) !==
            stepNames.lastIndexOf(normalizedName)
        ) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Each step name must be unique within the pathway.",
            path: ["pathway", "steps", stepIndex, "name"],
          });
        }
      });
    }
  })
  .superRefine((data, ctx) => {
    // Step-level validation
    if (!data.pathway?.steps) return;

    data.pathway.steps.forEach((step, stepIndex) => {
      // When step order mode is Sequential, rule must be All
      if (
        step.orderMode === PathwayOrderMode.Sequential &&
        step.rule !== PathwayCompletionRule.All
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            "When a step's order mode is 'Sequential', the step rule must be 'All' (cannot be 'Any')",
          path: ["pathway", "steps", stepIndex, "orderMode"],
        });
      }
    });
  })
  .superRefine((data, ctx) => {
    // Task ordering validation per step
    if (!data.pathway?.steps) return;

    data.pathway.steps.forEach((step, stepIndex) => {
      // Unique task entities validation per step
      if (step.tasks.length > 1) {
        const taskEntities = step.tasks
          .map((t) => `${t.entityType}:${t.entityId}`)
          .filter((key) => key.split(":")[1]); // Filter out empty entityIds

        const duplicateEntities = taskEntities.filter(
          (key, index) => taskEntities.indexOf(key) !== index,
        );

        if (duplicateEntities.length > 0) {
          step.tasks.forEach((task, taskIndex) => {
            const taskKey = `${task.entityType}:${task.entityId}`;
            if (
              task.entityId &&
              taskEntities.indexOf(taskKey) !==
                taskEntities.lastIndexOf(taskKey)
            ) {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message:
                  "Each task in a step must reference a unique entity (opportunity).",
                path: [
                  "pathway",
                  "steps",
                  stepIndex,
                  "tasks",
                  taskIndex,
                  "entityId",
                ],
              });
            }
          });
        }
      }

      // Tasks no longer have ordering - ordering is now at the step level only
      // Task validation is simpler - just unique entities per step (already handled above)
    });
  });

// ⚠️ SSR
export async function getServerSideProps(context: GetServerSidePropsContext) {
  const { id } = context.params as IParams;
  const session = await getServerSession(context.req, context.res, authOptions);
  const queryClient = new QueryClient(config);
  let errorCode = null;

  if (!session) {
    return {
      props: {
        error: 401,
      },
    };
  }

  const theme = getThemeFromRole(session);

  try {
    if (id !== "create") {
      const data = await getReferralProgramById(id, context);

      await queryClient.prefetchQuery({
        queryKey: ["referralProgram", id],
        queryFn: () => data,
      });
    }
  } catch (error) {
    console.error("Error fetching referral program data:", error);
    if (axios.isAxiosError(error) && error.response?.status) {
      if (error.response.status === 404) {
        return {
          notFound: true,
          props: { theme: theme },
        };
      } else errorCode = error.response.status;
    } else errorCode = 500;
  }

  return {
    props: {
      dehydratedState: dehydrate(queryClient),
      id: id,
      theme: theme,
      error: errorCode,
      user: session?.user ?? null,
    },
  };
}

const ReferralProgramForm: NextPageWithLayout<{
  id: string;
  theme: string;
  error?: number;
  user: User;
}> = ({ id, error }) => {
  const router = useRouter();
  const { returnUrl } = router.query;
  const queryClient = useQueryClient();
  const [saveChangesDialogVisible, setSaveChangesDialogVisible] =
    useState(false);
  const [lastStepBeforeSaveChangesDialog, setLastStepBeforeSaveChangesDialog] =
    useState<number | null>(null);
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const previouspathwayRequired = useRef<boolean | null>(null);
  const htmlRef = useRef<HTMLDivElement>(null);
  const [opportunityDataMap, setOpportunityDataMap] = useState<
    Record<string, Opportunity>
  >({});

  //#region Form
  const formRef1 = useRef<HTMLFormElement>(null);
  const formRef2 = useRef<HTMLFormElement>(null);
  const formRef3 = useRef<HTMLFormElement>(null);
  const formRef4 = useRef<HTMLFormElement>(null);
  const formRef5 = useRef<HTMLFormElement>(null);

  // Fetch program data
  const { data: program, isLoading: isLoadingProgram } = useQuery<Program>({
    queryKey: ["referralProgram", id],
    queryFn: () => getReferralProgramById(id),
    enabled: id !== "create" && !error,
  });

  // Countries lookup
  const { data: countriesData } = useQuery<Country[]>({
    queryKey: ["countries"],
    queryFn: async () => getCountries(),
    enabled: !error,
  });
  const countriesOptions = useMemo<SelectOption[]>(
    () =>
      countriesData?.map((c) => ({
        value: c.id,
        label: c.name,
      })) ?? [],
    [countriesData],
  );
  const worldwideCountryId = useMemo<string | null>(
    () =>
      countriesData?.find((c) => c.codeAlpha2 === COUNTRY_CODE_WW)?.id ?? null,
    [countriesData],
  );

  // Form state
  const [formData, setFormData] = useState<Program>(() => {
    if (program) return program;
    // Default new program - dateStart will be set when user selects date or defaults to today
    const todayUTC = new Date();
    todayUTC.setUTCHours(0, 0, 0, 0);
    return {
      id: "",
      name: "",
      description: null,
      countries: [],
      dateStart: todayUTC.toISOString(),
      dateEnd: null,
      completionBalance: null,
      completionWindowInDays: null,
      completionLimitReferee: null,
      completionLimit: null,
      zltoRewardReferrer: null,
      zltoRewardReferee: null,
      zltoRewardPool: null,
      zltoRewardCumulative: null,
      zltoRewardBalance: null,
      proofOfPersonhoodRequired: false,
      pathwayRequired: false,
      multipleLinksAllowed: false,
      isDefault: false,
      completionTotal: null,
      status: "Active",
      statusId: "1",
      dateCreated: new Date().toISOString(),
      dateModified: new Date().toISOString(),
      pathway: null,
      createdByUserId: "",
      modifiedByUserId: "",
      imageId: null,
      imageURL: null,
    };
  });

  // Image upload state
  const [imageFiles, setImageFiles] = useState<File[]>([]);

  // Step 1 Form
  const {
    register: registerStep1,
    handleSubmit: handleSubmitStep1,
    formState: formStateStep1,
    reset: resetStep1,
    trigger: triggerStep1,
    setValue: setValueStep1,
    getValues: getValuesStep1,
  } = useForm({
    resolver: zodResolver(schemaStep1),
    defaultValues: formData,
    mode: "all",
  });

  // Step 2 Form
  const {
    handleSubmit: handleSubmitStep2,
    formState: formStateStep2,
    reset: resetStep2,
    trigger: triggerStep2,
    control: controlStep2,
    setValue: setValueStep2,
  } = useForm({
    resolver: zodResolver(schemaStep2),
    defaultValues: formData,
    mode: "all",
  });

  // Step 3 Form
  const {
    register: registerStep3,
    handleSubmit: handleSubmitStep3,
    formState: formStateStep3,
    reset: resetStep3,
    trigger: triggerStep3,
    watch: watchStep3,
  } = useForm({
    resolver: zodResolver(schemaStep3),
    defaultValues: formData,
    mode: "all",
  });

  // Step 4 Form
  const {
    register: registerStep4,
    handleSubmit: handleSubmitStep4,
    formState: formStateStep4,
    reset: resetStep4,
    trigger: triggerStep4,
    watch: watchStep4,
  } = useForm({
    resolver: zodResolver(schemaStep4),
    defaultValues: formData,
    mode: "all",
  });

  // Step 5 Form (Pathway Configuration)
  const {
    control: controlStep5,
    handleSubmit: handleSubmitStep5,
    formState: formStateStep5,
    reset: resetStep5,
    watch: watchStep5,
    trigger: triggerStep5,
    setValue: setValueStep5,
    getValues: getValuesStep5,
  } = useForm({
    resolver: zodResolver(schemaStep5),
    defaultValues: formData,
    mode: "all",
    shouldFocusError: true,
  });

  useFieldArray({
    control: controlStep5,
    name: "pathway.steps",
  });

  // Watch pathwayRequired from step 5 form for real-time updates
  const pathwayRequiredWatch = watchStep5("pathwayRequired");

  // Watch pathway fields to keep dependent values in sync
  const pathwayRuleWatch = watchStep5("pathway.rule");
  const pathwayStepsWatch = watchStep5("pathway.steps");

  // Fetch all opportunities referenced in the pathway
  useEffect(() => {
    const fetchOpportunities = async () => {
      if (!formData.pathway?.steps) {
        setOpportunityDataMap({});
        return;
      }

      const opportunityIds = new Set<string>();
      formData.pathway.steps.forEach((step) => {
        step.tasks?.forEach((task) => {
          const oppId = task.opportunity?.id || (task as any).entityId;
          if (oppId) opportunityIds.add(oppId);
        });
      });

      if (opportunityIds.size === 0) {
        setOpportunityDataMap({});
        return;
      }

      const dataMap: Record<string, Opportunity> = {};
      await Promise.all(
        Array.from(opportunityIds).map(async (id) => {
          try {
            const opp = await getOpportunityById(id);
            dataMap[id] = opp;
          } catch {}
        }),
      );

      setOpportunityDataMap(dataMap);
    };

    fetchOpportunities();
  }, [formData.pathway]);

  // Watch Step 3 fields for cross-field validation
  const zltoRewardReferrerWatch = watchStep3("zltoRewardReferrer");
  const zltoRewardRefereeWatch = watchStep3("zltoRewardReferee");
  const zltoRewardPoolWatch = watchStep3("zltoRewardPool");
  const completionLimitRefereeWatch = watchStep3("completionLimitReferee");
  const completionLimitWatch = watchStep3("completionLimit");
  const completionWindowInDaysWatch = watchStep3("completionWindowInDays");

  // Watch Step 4 fields for cross-field validation
  const proofOfPersonhoodRequiredWatch = watchStep4(
    "proofOfPersonhoodRequired",
  );
  const pathwayRequiredStep4Watch = watchStep4("pathwayRequired");
  const multipleLinksAllowedWatch = watchStep4("multipleLinksAllowed");
  const isDefaultWatch = watchStep4("isDefault");

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
  //#endregion Form

  //#region Form Behavior
  const menuItems = [
    { step: 1, label: "Basic Info", formState: formStateStep1 },
    { step: 2, label: "Availability", formState: formStateStep2 },
    { step: 3, label: "Completion & Rewards", formState: formStateStep3 },
    { step: 4, label: "Features", formState: formStateStep4 },
    { step: 5, label: "Engagement Pathway", formState: formStateStep5 },
    {
      step: 6,
      label: "Preview",
      formState: {
        isValid:
          formStateStep1.isValid &&
          formStateStep2.isValid &&
          formStateStep3.isValid &&
          formStateStep4.isValid &&
          formStateStep5.isValid,
      },
    },
  ];

  // Update form data when program loads
  useEffect(() => {
    if (program && id !== "create") {
      // Ensure pathway has rule and orderMode with defaults if missing
      // Also transform tasks to have entityId from opportunity object
      const programCountryIds: string[] = Array.isArray(program.countries)
        ? program.countries.length === 0
          ? []
          : typeof program.countries[0] === "string"
            ? (program.countries as string[])
            : (program.countries as Country[]).map((c) => c.id)
        : [];

      const programWithDefaults = {
        ...program,
        countries: programCountryIds,
        pathway: program.pathway
          ? {
              ...program.pathway,
              rule: program.pathway.rule ?? PathwayCompletionRule.All,
              orderMode:
                program.pathway.orderMode ?? PathwayOrderMode.Sequential,
              steps:
                program.pathway.steps?.map((step) => ({
                  ...step,
                  tasks:
                    step.tasks?.map((task) => ({
                      ...task,
                      // Set entityId from opportunity.id if it exists
                      entityId:
                        task.opportunity?.id ?? (task as any).entityId ?? "",
                    })) ?? [],
                })) ?? [],
            }
          : null,
      };

      setFormData(programWithDefaults);
      resetStep1(programWithDefaults);
      resetStep2(programWithDefaults);
      resetStep3(programWithDefaults);
      resetStep4(programWithDefaults);
      resetStep5(programWithDefaults);

      // Trigger validation for all forms to show warning icons
      setTimeout(() => {
        triggerStep1();
        triggerStep2();
        triggerStep3();
        triggerStep4();
        triggerStep5();
      }, 100);
    }
  }, [
    program,
    id,
    resetStep1,
    resetStep2,
    resetStep3,
    resetStep4,
    resetStep5,
    triggerStep1,
    triggerStep2,
    triggerStep3,
    triggerStep4,
    triggerStep5,
  ]);

  // Default new (and legacy) programs to Worldwide if no countries selected
  const hasInitializedCountries = useRef(false);
  useEffect(() => {
    if (hasInitializedCountries.current) return;
    if (!worldwideCountryId) return;

    const current = (formData.countries ?? []) as string[];
    if (current.length > 0) {
      hasInitializedCountries.current = true;
      return;
    }

    hasInitializedCountries.current = true;
    const nextData: Program = {
      ...formData,
      countries: [worldwideCountryId],
    };

    setFormData(nextData);
    resetStep1(nextData);
    resetStep2(nextData);
    resetStep3(nextData);
    resetStep4(nextData);
    resetStep5(nextData);
    // Mark as touched/validated for warning icons
    setValueStep2("countries", [worldwideCountryId], { shouldValidate: true });
  }, [
    formData,
    worldwideCountryId,
    resetStep1,
    resetStep2,
    resetStep3,
    resetStep4,
    resetStep5,
    setValueStep2,
  ]);

  // Scroll to top on step change
  useEffect(() => {
    window.scrollTo(0, 0);

    // Trigger validation for the current step to show warning icons
    setTimeout(() => {
      if (step === 1) triggerStep1();
      else if (step === 2) triggerStep2();
      else if (step === 3) triggerStep3();
      else if (step === 4) triggerStep4();
      else if (step === 5) triggerStep5();
    }, 100);
  }, [
    step,
    triggerStep1,
    triggerStep2,
    triggerStep3,
    triggerStep4,
    triggerStep5,
  ]);

  // Watch pathwayRequired and initialize pathway when enabled
  useEffect(() => {
    // Skip if this is the initial value being set
    if (previouspathwayRequired.current === null) {
      previouspathwayRequired.current = pathwayRequiredWatch;
      return;
    }

    // Only act if the value actually changed
    if (previouspathwayRequired.current === pathwayRequiredWatch) {
      return;
    }

    previouspathwayRequired.current = pathwayRequiredWatch;

    if (pathwayRequiredWatch && !formData.pathway) {
      const newData: Program = {
        ...formData,
        pathwayRequired: pathwayRequiredWatch,
        pathway: {
          id: "",
          programId: formData.id ?? "",
          name: "",
          description: null,
          rule: PathwayCompletionRule.All,
          orderMode: PathwayOrderMode.Sequential,
          dateCreated: new Date().toISOString(),
          dateModified: new Date().toISOString(),
          isCompletable: true,
          steps: [],
        },
      };
      setFormData(newData);
      resetStep5(newData);
      // Trigger validation after enabling pathway
      setTimeout(() => triggerStep5(), 100);
    } else if (!pathwayRequiredWatch && formData.pathway) {
      // Clear pathway when disabled
      const newData = {
        ...formData,
        pathwayRequired: pathwayRequiredWatch,
        pathway: null,
      };
      setFormData(newData);
      resetStep5(newData);
    }
  }, [pathwayRequiredWatch, resetStep5, triggerStep5, formData]);

  // Keep pathway/step order modes consistent with selected rules.
  // This prevents Zod validation from getting "stuck" when rule changes hide order mode selectors.
  useEffect(() => {
    if (!pathwayRequiredWatch) return;

    const currentPathway = getValuesStep5("pathway") as any;
    if (!currentPathway) return;

    // If pathway rule is Any, Sequential is invalid (selector is hidden), so force AnyOrder.
    if (
      pathwayRuleWatch === PathwayCompletionRule.Any &&
      currentPathway.orderMode === PathwayOrderMode.Sequential
    ) {
      setValueStep5("pathway.orderMode", PathwayOrderMode.AnyOrder, {
        shouldDirty: true,
        shouldValidate: true,
      });
    }

    const steps: any[] = Array.isArray(currentPathway.steps)
      ? currentPathway.steps
      : [];
    if (steps.length === 0) return;

    steps.forEach((step, index) => {
      const stepRule = step?.rule;
      const stepOrderMode = step?.orderMode;

      // If a step rule is Any, its order mode must be AnyOrder.
      if (
        stepRule === PathwayCompletionRule.Any &&
        stepOrderMode !== PathwayOrderMode.AnyOrder
      ) {
        setValueStep5(
          `pathway.steps.${index}.orderMode`,
          PathwayOrderMode.AnyOrder,
          { shouldDirty: true, shouldValidate: true },
        );
      }

      // If a step order mode is Sequential, its rule must be All.
      if (
        stepOrderMode === PathwayOrderMode.Sequential &&
        stepRule !== PathwayCompletionRule.All
      ) {
        setValueStep5(
          `pathway.steps.${index}.rule`,
          PathwayCompletionRule.All,
          { shouldDirty: true, shouldValidate: true },
        );
      }
    });
  }, [
    pathwayRequiredWatch,
    pathwayRuleWatch,
    pathwayStepsWatch,
    getValuesStep5,
    setValueStep5,
  ]);

  // Watch Step 3 fields and trigger validation for cross-field errors
  useEffect(() => {
    if (step === 3) {
      triggerStep3();
    }
  }, [
    zltoRewardReferrerWatch,
    zltoRewardRefereeWatch,
    zltoRewardPoolWatch,
    completionLimitRefereeWatch,
    completionLimitWatch,
    completionWindowInDaysWatch,
    step,
    triggerStep3,
  ]);

  // Watch Step 4 fields and trigger validation for cross-field errors
  useEffect(() => {
    if (step === 4) {
      triggerStep4();
    }
  }, [
    proofOfPersonhoodRequiredWatch,
    pathwayRequiredStep4Watch,
    multipleLinksAllowedWatch,
    isDefaultWatch,
    zltoRewardReferrerWatch,
    zltoRewardRefereeWatch,
    completionLimitRefereeWatch,
    step,
    triggerStep4,
  ]);

  const triggerValidation = useCallback(() => {
    const validate = async () => {
      await triggerStep1();
      await triggerStep2();
      await triggerStep3();
      await triggerStep4();
      // Trigger all fields in step 5, including nested arrays
      await triggerStep5();
      // Also explicitly trigger nested pathway fields
      await triggerStep5("pathway");
    };

    validate();
  }, [triggerStep1, triggerStep2, triggerStep3, triggerStep4, triggerStep5]);

  // validate the forms on initial load
  // this is needed to show the required field indicators (exclamation icon next to labels) on the first render
  useEffect(() => {
    triggerValidation();
  }, [triggerValidation]);
  //#endregion Form Behavior

  //#region Event Handlers
  const onStep = useCallback(
    (nextStep: number) => {
      let isDirtyStep = false;
      if (step === 1 && isDirtyStep1) isDirtyStep = true;
      else if (step === 2 && isDirtyStep2) isDirtyStep = true;
      else if (step === 3 && isDirtyStep3) isDirtyStep = true;
      else if (step === 4 && isDirtyStep4) isDirtyStep = true;
      else if (step === 5 && isDirtyStep5) isDirtyStep = true;

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
    triggerValidation();
    setSaveChangesDialogVisible(false);
    setLastStepBeforeSaveChangesDialog(null);
    if (lastStepBeforeSaveChangesDialog) {
      setStep(lastStepBeforeSaveChangesDialog);
    }
  }, [
    resetStep1,
    formData,
    resetStep2,
    resetStep3,
    resetStep4,
    resetStep5,
    triggerValidation,
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
    }
  }, [
    formRef1,
    formRef2,
    formRef3,
    formRef4,
    formRef5,
    setSaveChangesDialogVisible,
    step,
  ]);

  // this is used by the preview component
  // For preview, just use formData directly (Program type)
  const programPreview = useMemo<Program | null>(() => {
    if (!formData) return null;
    // formData is already a Program with opportunity objects attached
    return formData;
  }, [formData]);

  // Create preview URL for newly uploaded image
  const imagePreviewUrl = useMemo(() => {
    // Check form data first (from Step 1)
    const formValues = getValuesStep1() as any;
    if (formValues.image instanceof File) {
      return URL.createObjectURL(formValues.image);
    }
    // Fallback to imageFiles state for backward compatibility
    if (imageFiles && imageFiles.length > 0 && imageFiles[0]) {
      return URL.createObjectURL(imageFiles[0]);
    }
    return null;
  }, [imageFiles, getValuesStep1]);

  // Cleanup preview URL when component unmounts or imageFiles changes
  useEffect(() => {
    return () => {
      if (imagePreviewUrl) {
        URL.revokeObjectURL(imagePreviewUrl);
      }
    };
  }, [imagePreviewUrl]);

  const onSubmit = useCallback(
    async (data: Program) => {
      setIsLoading(true);
      try {
        let message = "";

        const countryIds: string[] = Array.isArray(data.countries)
          ? data.countries.length === 0
            ? []
            : typeof data.countries[0] === "string"
              ? (data.countries as string[])
              : (data.countries as Country[]).map((c) => c.id)
          : [];

        // Build request object - convert Program to request format
        const baseRequest: Partial<ProgramRequestCreate> = {
          name: data.name,
          description: data.description,
          image: null, // Image handled separately
          countries: countryIds,
          completionWindowInDays: data.completionWindowInDays,
          completionLimitReferee: data.completionLimitReferee,
          completionLimit: data.completionLimit,
          zltoRewardReferrer: data.zltoRewardReferrer,
          zltoRewardReferee: data.zltoRewardReferee,
          zltoRewardPool: data.zltoRewardPool,
          proofOfPersonhoodRequired: data.proofOfPersonhoodRequired,
          pathwayRequired: data.pathwayRequired,
          multipleLinksAllowed: data.multipleLinksAllowed,
          isDefault: data.isDefault,
          dateStart: data.dateStart,
          dateEnd: data.dateEnd,
          pathway: data.pathway
            ? {
                id: data.pathway.id || undefined,
                name: data.pathway.name,
                description: data.pathway.description,
                rule: data.pathway.rule,
                orderMode: data.pathway.orderMode,
                steps: (data.pathway.steps ?? []).map((step) => ({
                  id: step.id || undefined,
                  name: step.name,
                  description: step.description,
                  rule: step.rule as PathwayCompletionRule,
                  // Automatically set orderMode to "Any Order" when rule is "Any"
                  orderMode:
                    step.rule === PathwayCompletionRule.Any
                      ? PathwayOrderMode.AnyOrder
                      : step.orderMode,
                  tasks: (step.tasks ?? [])
                    .filter((task) => {
                      // Filter out tasks without a selected opportunity
                      const entityId =
                        task.opportunity?.id ?? (task as any).entityId;
                      return entityId && entityId.trim() !== "";
                    })
                    .map((task) => ({
                      id: task.id || undefined,
                      entityType: task.entityType as PathwayTaskEntityType,
                      entityId: task.opportunity?.id ?? (task as any).entityId,
                    })),
                })),
              }
            : undefined,
        };

        let programId: string;

        if (id === "create") {
          // For create, remove all IDs
          if (baseRequest.pathway) {
            delete baseRequest.pathway.id;
            baseRequest.pathway.steps?.forEach((step) => {
              delete step.id;
              step.tasks?.forEach((task) => {
                delete task.id;
              });
            });
          }
          const response = await createReferralProgram(
            baseRequest as ProgramRequestCreate,
          );
          programId = response.id;
          message = "Program created successfully";
        } else {
          // For update, include the program ID
          const updateRequest = {
            ...baseRequest,
            id: data.id,
          };

          // Clean up IDs according to API rules:
          if (updateRequest.pathway && !updateRequest.pathway.id) {
            updateRequest.pathway.steps?.forEach((step) => {
              delete step.id;
              step.tasks?.forEach((task) => {
                delete task.id;
              });
            });
          } else if (updateRequest.pathway) {
            updateRequest.pathway.steps?.forEach((step) => {
              if (!step.id) {
                step.tasks?.forEach((task) => {
                  delete task.id;
                });
              }
            });
          }

          await updateReferralProgram(updateRequest as ProgramRequestUpdate);
          programId = data.id;
          message = "Program updated successfully";
        }

        // Handle image upload if there's a new image.
        // IMPORTANT: image upload should not block navigation, because the program may have
        // already been created successfully.
        const imageFile =
          (data as any).image instanceof File
            ? (data as any).image
            : imageFiles && imageFiles.length > 0
              ? imageFiles[0]
              : null;

        if (imageFile) {
          try {
            await updateReferralProgramImage(programId, imageFile);
            message += " (including image)";
            setImageFiles([]); // Clear after successful upload
            (setValueStep1 as any)("image", null); // Clear form value
          } catch (imageError) {
            toast(<ApiErrors error={imageError as AxiosError} />, {
              type: "warning",
              toastId: "program-image",
              autoClose: false,
              icon: false,
            });
          }
        }

        await queryClient.invalidateQueries({ queryKey: ["referralPrograms"] });
        await queryClient.invalidateQueries({
          queryKey: ["referralProgram", id],
        });

        toast.success(message);

        // Redirect based on create vs edit
        if (id === "create") {
          // For create: redirect to info page
          await router.push(`/admin/referrals/${programId}/info`);
        } else {
          // For edit: go back to returnUrl or list
          await router.push(
            getSafeUrl(
              returnUrl ? decodeURIComponent(returnUrl.toString()) : undefined,
              "/admin/referrals",
            ),
          );
        }
      } catch (error) {
        //console.error("Error saving program:", error);
        toast(<ApiErrors error={error as AxiosError} />, {
          type: "error",
          toastId: "program",
          autoClose: false,
          icon: false,
        });
      } finally {
        setIsLoading(false);
      }
    },
    [id, queryClient, router, returnUrl, imageFiles, setValueStep1],
  );

  // Step submit handlers
  const onSubmitStep = useCallback(
    async (nextStep: number, data: FieldValues) => {
      // set form data
      const model = {
        ...formData,
        ...data,
      } as Program;

      setFormData(model);

      if (nextStep === menuItems.length + 1) {
        await onSubmit(model);
      } else {
        setStep(nextStep);
      }

      // Reset forms with new data
      resetStep1(model);
      resetStep2(model);
      resetStep3(model);
      resetStep4(model);
      resetStep5(model);

      // trigger validation
      triggerValidation();

      // go to last step before save changes dialog
      if (lastStepBeforeSaveChangesDialog)
        setStep(lastStepBeforeSaveChangesDialog);

      setLastStepBeforeSaveChangesDialog(null);
    },
    [
      formData,
      menuItems.length,
      setStep,
      setFormData,
      onSubmit,
      lastStepBeforeSaveChangesDialog,
      setLastStepBeforeSaveChangesDialog,
      resetStep1,
      resetStep2,
      resetStep3,
      resetStep4,
      resetStep5,
      triggerValidation,
    ],
  );
  //#endregion Event Handlers

  if (error) {
    if (error === 401) return <Unauthenticated />;
    else if (error === 403) return <Unauthorized />;
    else return <InternalServerError />;
  }

  if (isLoadingProgram && id !== "create") return <Loading />;

  return (
    <>
      <Head>
        <title>
          Yoma | {id === "create" ? "Create" : "Edit"} Referral Program
        </title>
      </Head>

      {isLoading && <Loading />}

      <PageBackground />

      <div ref={htmlRef} />

      {/* SAVE CHANGES DIALOG */}
      <CustomModal
        isOpen={saveChangesDialogVisible}
        shouldCloseOnOverlayClick={false}
        onRequestClose={() => {
          setSaveChangesDialogVisible(false);
        }}
        className={`md:max-h-[400px] md:w-[500px]`}
      >
        <div className="flex h-full flex-col gap-2 overflow-y-auto pb-8">
          <div className="bg-theme flex flex-row p-4 shadow-lg">
            <h1 className="grow"></h1>
            <button
              type="button"
              className="btn btn-circle text-gray-dark hover:bg-gray"
              onClick={() => {
                setSaveChangesDialogVisible(false);
              }}
            >
              <IoMdClose className="h-6 w-6"></IoMdClose>
            </button>
          </div>
          <div className="flex flex-col items-center justify-center gap-4 p-4">
            <div className="border-green-dark -mt-11 flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-full bg-white shadow-lg">
              <FaExclamationTriangle className="text-yellow h-8 w-8" />
            </div>

            <div className="font-semibold">
              Your recent changes have not been saved!
            </div>

            <div className="bg-gray mt-4 rounded-lg p-4 text-center md:w-[450px]">
              Please make sure to save your changes to prevent any loss of data.
            </div>

            <div className="mt-4 flex w-full justify-center gap-4 px-4">
              <button
                type="button"
                className="btn btn-warning btn-md flex-grow rounded-full px-8 normal-case md:flex-grow-0"
                onClick={onClickContinueWithoutSaving}
              >
                <span className="ml-1">Continue without saving</span>
              </button>

              <button
                type="button"
                className="btn btn-success btn-md flex-grow rounded-full px-8 text-white normal-case md:flex-grow-0"
                onClick={onClickSaveAndContinue}
              >
                <p className="text-white">Save and continue</p>
              </button>
            </div>
          </div>
        </div>
      </CustomModal>

      {/* PAGE */}
      <div className="z-10 container mt-20 max-w-7xl px-2 py-4">
        {/* BREADCRUMB */}
        <div className="flex flex-row items-center gap-2 text-xs text-white">
          <Link
            className="hover:text-gray flex max-w-[200px] min-w-0 items-center font-bold"
            href={getSafeUrl(returnUrl?.toString(), `/admin/referrals`)}
          >
            <IoMdArrowRoundBack className="mr-2 inline-block h-4 w-4 shrink-0" />
            <span className="truncate">Referral Programs</span>
          </Link>

          <div className="font-bold">|</div>
          <span className="max-w-[200px] min-w-0 truncate">
            {id === "create" ? "Create" : "Edit"}
          </span>
        </div>

        {/* HEADING */}
        {id === "create" ? (
          <h3 className="mt-2 mb-6 font-bold text-white">
            New referral program
          </h3>
        ) : (
          <div className="mt-2 mb-6 flex flex-row items-center justify-between gap-2">
            <div className="flex min-w-0 flex-row items-center gap-2">
              <h3 className="overflow-hidden font-bold text-ellipsis whitespace-nowrap text-white">
                {program?.name}
              </h3>
              {program && <ProgramStatusBadge status={program.status} />}
            </div>
            {program && (
              <AdminReferralProgramActions
                program={program}
                returnUrl={returnUrl?.toString()}
                actionOptions={[
                  ReferralProgramActionOptions.ACTIVATE,
                  ReferralProgramActionOptions.INACTIVATE,
                  ReferralProgramActionOptions.VIEW,
                  ReferralProgramActionOptions.VIEW_LINKS,
                  ReferralProgramActionOptions.DELETE,
                ]}
              />
            )}
          </div>
        )}

        {/* MAIN CONTENT */}
        <div className="flex flex-col gap-4 md:flex-row">
          {/* MD: LEFT VERTICAL MENU */}
          <ul className="menu shadow-custom hidden h-max w-64 flex-none gap-3 rounded-lg bg-white p-4 font-semibold md:flex md:justify-center">
            {menuItems.map((item) => (
              <li key={item.step} onClick={() => onStep(item.step)}>
                <a
                  className={`${
                    item.step === step
                      ? "bg-green-light text-green hover:bg-green-light"
                      : "bg-gray-light text-gray-dark hover:bg-gray"
                  } py-3`}
                >
                  {item.formState.isValid ? (
                    <IoIosCheckmarkCircle className="text-green h-6 w-6" />
                  ) : (
                    <IoMdAlert className="text-yellow h-6 w-6" />
                  )}
                  {item.label}
                </a>
              </li>
            ))}
          </ul>

          {/* XS: DROPDOWN MENU */}
          <select
            className="select select-md w-full focus:border-none focus:outline-none md:hidden"
            value={menuItems.find((item) => item.step === step)?.label}
            onChange={(e) => {
              const selectedLabel = e.target.value;
              const selectedItem = menuItems.find(
                (item) => item.label === selectedLabel,
              );
              if (selectedItem) {
                onStep(selectedItem.step);
              }
            }}
          >
            {menuItems.map((item) => (
              <option key={item.step} value={item.label}>
                {item.label}
              </option>
            ))}
          </select>

          {/* FORMS */}
          <div className="shadow-custom flex w-full grow flex-col items-center overflow-hidden rounded-lg bg-white">
            <div className="flex w-full flex-col px-2 py-4 md:p-8">
              {/* STEP 1: Basic Info */}
              {step === 1 && (
                <>
                  <div className="mb-4 flex flex-col gap-2">
                    <h5 className="font-bold tracking-wider">
                      Basic Information
                    </h5>
                    <p className="-mt-2 text-sm">
                      Enter the program name and description
                    </p>
                    {!formStateStep1.isValid && <FormRequiredFieldMessage />}
                  </div>

                  <form
                    ref={formRef1}
                    className="flex flex-col gap-4"
                    onSubmit={handleSubmitStep1((data) =>
                      onSubmitStep(2, data),
                    )}
                  >
                    <FormField
                      label="Program Name"
                      showWarningIcon={!!formStateStep1.errors.name?.message}
                      showError={
                        !!formStateStep1.touchedFields.name ||
                        formStateStep1.isSubmitted
                      }
                      error={formStateStep1.errors.name?.message}
                    >
                      <FormInput
                        inputProps={{
                          type: "text",
                          placeholder: "Enter program name",
                          maxLength: 255,
                          ...registerStep1("name"),
                        }}
                      />
                    </FormField>

                    <FormField
                      label="Description"
                      showWarningIcon={
                        !!formStateStep1.errors.description?.message
                      }
                      showError={
                        !!formStateStep1.touchedFields.description ||
                        formStateStep1.isSubmitted
                      }
                      error={formStateStep1.errors.description?.message}
                    >
                      <textarea
                        placeholder="Enter program description"
                        className="textarea textarea-bordered w-full"
                        rows={4}
                        {...registerStep1("description")}
                      />
                    </FormField>

                    {/* Image Upload */}
                    <FormField label="Program Image">
                      <AvatarUpload
                        onUploadComplete={(files) => {
                          const file =
                            files && files.length > 0 ? files[0] : null;
                          (setValueStep1 as any)("image", file);
                          setImageFiles(files); // Keep for backward compatibility
                          triggerStep1();
                        }}
                        onRemoveImageExisting={() => {
                          (setValueStep1 as any)("image", null);
                          setImageFiles([]);
                          triggerStep1();
                        }}
                        existingImage={
                          ((getValuesStep1() as any).image as any) ||
                          formData?.imageURL ||
                          null
                        }
                        showExisting={!(getValuesStep1() as any).image}
                      />
                    </FormField>

                    {/* <FormCheckbox
                      id="isDefault"
                      label="Set as Default Program"
                      inputProps={{
                        ...registerStep1("isDefault"),
                      }}
                    /> */}

                    <div className="flex flex-row items-center justify-center gap-2 md:justify-end md:gap-4">
                      <Link
                        href={getSafeUrl(
                          returnUrl?.toString(),
                          "/admin/referrals",
                        )}
                        className="btn btn-warning btn-md flex-grow rounded-full px-8 normal-case md:flex-grow-0"
                      >
                        Cancel
                      </Link>

                      <button
                        type="submit"
                        className="btn btn-success btn-md flex-grow rounded-full px-8 text-white normal-case md:flex-grow-0"
                      >
                        Next
                      </button>
                    </div>
                  </form>
                </>
              )}

              {/* STEP 2: Availability */}
              {step === 2 && (
                <>
                  <div className="mb-4 flex flex-col gap-2">
                    <h5 className="font-bold tracking-wider">Availability</h5>
                    <p className="-mt-2 text-sm">
                      Specify when the program is active
                    </p>
                    {!formStateStep2.isValid && <FormRequiredFieldMessage />}
                  </div>

                  <form
                    ref={formRef2}
                    className="flex flex-col gap-4"
                    onSubmit={handleSubmitStep2((data) =>
                      onSubmitStep(3, data),
                    )}
                  >
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <FormField
                        label="Start Date"
                        showWarningIcon={
                          !!formStateStep2.errors.dateStart?.message
                        }
                        showError={
                          !!formStateStep2.touchedFields.dateStart ||
                          formStateStep2.isSubmitted
                        }
                        error={formStateStep2.errors.dateStart?.message}
                      >
                        <Controller
                          control={controlStep2}
                          name="dateStart"
                          render={({ field: { onChange, onBlur, value } }) => (
                            <FormInput
                              inputProps={{
                                type: "date",
                                onBlur: (e) => {
                                  onBlur(); // mark the field as touched
                                  // Only validate and convert when user finishes editing
                                  if (e.target.value) {
                                    onChange(dateInputToUTC(e.target.value));
                                  } else {
                                    onChange(null);
                                  }
                                },
                                defaultValue: utcToDateInput(value || ""),
                              }}
                            />
                          )}
                        />
                      </FormField>

                      <FormField
                        label="End Date (Optional)"
                        showWarningIcon={
                          !!formStateStep2.errors.dateEnd?.message
                        }
                        showError={
                          !!formStateStep2.touchedFields.dateEnd ||
                          formStateStep2.isSubmitted
                        }
                        error={formStateStep2.errors.dateEnd?.message}
                      >
                        <Controller
                          control={controlStep2}
                          name="dateEnd"
                          render={({ field: { onChange, onBlur, value } }) => (
                            <FormInput
                              inputProps={{
                                type: "date",
                                onBlur: (e) => {
                                  onBlur(); // mark the field as touched
                                  // Only validate and convert when user finishes editing
                                  if (e.target.value) {
                                    onChange(
                                      dateInputToUTCEndOfDay(e.target.value),
                                    );
                                  } else {
                                    onChange(null);
                                  }
                                },
                                defaultValue: utcToDateInput(value || ""),
                              }}
                            />
                          )}
                        />
                      </FormField>

                      <div className="md:col-span-2">
                        <FormField
                          label="Countries"
                          subLabel="Where this program is available. This is used for searchability and eligibility checks."
                          showWarningIcon={
                            !!formStateStep2.errors.countries?.message
                          }
                          showError={
                            !!formStateStep2.touchedFields.countries ||
                            formStateStep2.isSubmitted
                          }
                          error={formStateStep2.errors.countries?.message}
                        >
                          <Controller
                            control={controlStep2}
                            name="countries"
                            render={({
                              field: { onChange, value, onBlur },
                            }) => (
                              <Select
                                instanceId="countries"
                                classNames={{
                                  control: () =>
                                    "input w-full !border-gray pr-0 pl-2 h-fit py-1",
                                }}
                                isMulti={true}
                                options={countriesOptions}
                                onBlur={onBlur}
                                onChange={(val) =>
                                  onChange(val.map((c) => c.value))
                                }
                                value={countriesOptions?.filter((c) =>
                                  (
                                    (value as string[] | undefined) ?? []
                                  ).includes(c.value),
                                )}
                                menuPortalTarget={htmlRef.current}
                                styles={{
                                  menuPortal: (base) => ({
                                    ...base,
                                    zIndex: 9999,
                                  }),
                                  placeholder: (base) => ({
                                    ...base,
                                    color: "#A3A6AF",
                                  }),
                                }}
                                inputId="input_countries"
                                placeholder="Select countries..."
                              />
                            )}
                          />
                        </FormField>
                      </div>
                    </div>

                    <div className="flex flex-row items-center justify-center gap-2 md:justify-end md:gap-4">
                      <button
                        type="button"
                        onClick={() => onStep(1)}
                        className="btn btn-warning btn-md flex-grow rounded-full px-8 normal-case md:flex-grow-0"
                      >
                        Back
                      </button>

                      <button
                        type="submit"
                        className="btn btn-success btn-md flex-grow rounded-full px-8 text-white normal-case md:flex-grow-0"
                      >
                        Next
                      </button>
                    </div>
                  </form>
                </>
              )}

              {/* STEP 3: Configuration */}
              {step === 3 && (
                <>
                  <div className="mb-4 flex flex-col gap-2">
                    <h5 className="font-bold tracking-wider">
                      Completion & Rewards
                    </h5>
                    <p className="-mt-2 text-sm">
                      Configure completion settings and ZLTO rewards
                    </p>
                    {!formStateStep3.isValid && <FormRequiredFieldMessage />}

                    <FormMessage messageType={FormMessageType.Info}>
                      <strong>Note:</strong> At least one of Completion Window,
                      Referrer Cap, Program Cap, or ZLTO Rewards must be
                      configured.
                    </FormMessage>
                  </div>

                  <form
                    ref={formRef3}
                    className="flex flex-col gap-6"
                    onSubmit={handleSubmitStep3((data) =>
                      onSubmitStep(4, data),
                    )}
                  >
                    {/* Completion Settings */}
                    <div className="flex flex-col gap-4">
                      <h6 className="font-semibold">Completion Settings</h6>

                      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        <FormField
                          label="Completion Window (Days)"
                          subLabel="Time allowed for referee"
                          showWarningIcon={
                            !!formStateStep3.errors.completionWindowInDays
                              ?.message
                          }
                          showError={
                            !!formStateStep3.touchedFields
                              .completionWindowInDays ||
                            formStateStep3.isSubmitted
                          }
                          error={
                            formStateStep3.errors.completionWindowInDays
                              ?.message
                          }
                        >
                          <FormInput
                            inputProps={{
                              type: "number",
                              min: "0",
                              placeholder: "e.g. 30",
                              ...registerStep3("completionWindowInDays"),
                            }}
                          />
                        </FormField>

                        <FormField
                          label="Referrer Cap"
                          subLabel="Max per referrer"
                          showWarningIcon={
                            !!formStateStep3.errors.completionLimitReferee
                              ?.message
                          }
                          showError={
                            !!formStateStep3.touchedFields
                              .completionLimitReferee ||
                            formStateStep3.isSubmitted
                          }
                          error={
                            formStateStep3.errors.completionLimitReferee
                              ?.message
                          }
                        >
                          <FormInput
                            inputProps={{
                              type: "number",
                              min: "0",
                              placeholder: "e.g. 100",
                              ...registerStep3("completionLimitReferee"),
                            }}
                          />
                        </FormField>

                        <FormField
                          label="Program Cap"
                          subLabel="Max for entire program"
                          showWarningIcon={
                            !!formStateStep3.errors.completionLimit?.message
                          }
                          showError={
                            !!formStateStep3.touchedFields.completionLimit ||
                            formStateStep3.isSubmitted
                          }
                          error={formStateStep3.errors.completionLimit?.message}
                        >
                          <FormInput
                            inputProps={{
                              type: "number",
                              min: "0",
                              placeholder: "e.g. 1000",
                              ...registerStep3("completionLimit"),
                            }}
                          />
                        </FormField>
                      </div>
                    </div>

                    {/* ZLTO Rewards */}
                    <div className="flex flex-col gap-4">
                      <h6 className="font-semibold">ZLTO Rewards</h6>

                      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        <FormField
                          label="Referee Reward"
                          subLabel="ZLTO for referee"
                          showWarningIcon={
                            !!formStateStep3.errors.zltoRewardReferee?.message
                          }
                          showError={
                            !!formStateStep3.touchedFields.zltoRewardReferee ||
                            formStateStep3.isSubmitted
                          }
                          error={
                            formStateStep3.errors.zltoRewardReferee?.message
                          }
                        >
                          <FormInput
                            inputProps={{
                              type: "number",
                              min: "0",
                              step: "0.01",
                              placeholder: "e.g. 10.00",
                              ...registerStep3("zltoRewardReferee"),
                            }}
                          />
                        </FormField>

                        <FormField
                          label="Referrer Reward"
                          subLabel="ZLTO for referrer"
                          showWarningIcon={
                            !!formStateStep3.errors.zltoRewardReferrer?.message
                          }
                          showError={
                            !!formStateStep3.touchedFields.zltoRewardReferrer ||
                            formStateStep3.isSubmitted
                          }
                          error={
                            formStateStep3.errors.zltoRewardReferrer?.message
                          }
                        >
                          <FormInput
                            inputProps={{
                              type: "number",
                              min: "0",
                              step: "0.01",
                              placeholder: "e.g. 5.00",
                              ...registerStep3("zltoRewardReferrer"),
                            }}
                          />
                        </FormField>

                        <FormField
                          label="ZLTO Pool"
                          subLabel="Total budget"
                          showWarningIcon={
                            !!formStateStep3.errors.zltoRewardPool?.message
                          }
                          showError={
                            !!formStateStep3.touchedFields.zltoRewardPool ||
                            formStateStep3.isSubmitted
                          }
                          error={formStateStep3.errors.zltoRewardPool?.message}
                        >
                          <FormInput
                            inputProps={{
                              type: "number",
                              min: "0",
                              step: "0.01",
                              placeholder: "e.g. 10000.00",
                              ...registerStep3("zltoRewardPool"),
                            }}
                          />
                        </FormField>
                      </div>
                    </div>

                    {/* Show current stats for edit mode */}
                    {program && (
                      <div className="flex flex-col gap-4">
                        <h6 className="font-semibold">Current Stats</h6>
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                          <div
                            className={`rounded-lg p-3 ${(program.completionTotal ?? 0) > 0 ? "bg-green-50" : "bg-gray-50"}`}
                          >
                            <p className="text-xs text-gray-600">
                              Total Completions
                            </p>
                            <p className="text-lg font-semibold">
                              {program.completionTotal ?? 0}
                            </p>
                          </div>
                          <div
                            className={`rounded-lg p-3 ${(program.zltoRewardCumulative ?? 0) > 0 ? "bg-blue-50" : "bg-gray-50"}`}
                          >
                            <p className="text-xs text-gray-600">
                              ZLTO Cumulative
                            </p>
                            <div className="flex items-center gap-1">
                              <Image
                                src={iconZlto}
                                alt="Zlto"
                                width={20}
                                height={20}
                                className="h-auto"
                              />
                              <p className="text-lg font-semibold">
                                {program.zltoRewardCumulative ?? 0}
                              </p>
                            </div>
                          </div>
                          <div
                            className={`rounded-lg p-3 ${(program.zltoRewardBalance ?? 0) > 0 ? "bg-blue-50" : "bg-yellow-50"}`}
                          >
                            <p className="text-xs text-gray-600">
                              ZLTO Balance
                            </p>
                            <div className="flex items-center gap-1">
                              <Image
                                src={iconZlto}
                                alt="Zlto"
                                width={20}
                                height={20}
                                className="h-auto"
                              />
                              <p className="text-lg font-semibold">
                                {program.zltoRewardBalance ?? 0}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Form-level errors */}
                    {formStateStep3.errors.root && (
                      <div className="mt-4">
                        <FormMessage messageType={FormMessageType.Error}>
                          {formStateStep3.errors.root.message}
                        </FormMessage>
                      </div>
                    )}
                    {formStateStep3.errors.zltoRewardPool && (
                      <div className="mt-4">
                        <FormMessage messageType={FormMessageType.Error}>
                          {formStateStep3.errors.zltoRewardPool.message}
                        </FormMessage>
                      </div>
                    )}
                    {formStateStep3.errors.completionLimitReferee &&
                      formStateStep3.errors.completionLimitReferee.message !==
                        "Per-referrer completion limit must be greater than 0" && (
                        <div className="mt-4">
                          <FormMessage messageType={FormMessageType.Error}>
                            {
                              formStateStep3.errors.completionLimitReferee
                                .message
                            }
                          </FormMessage>
                        </div>
                      )}

                    <div className="flex flex-row items-center justify-center gap-2 md:justify-end md:gap-4">
                      <button
                        type="button"
                        onClick={() => onStep(2)}
                        className="btn btn-warning btn-md flex-grow rounded-full px-8 normal-case md:flex-grow-0"
                      >
                        Back
                      </button>

                      <button
                        type="submit"
                        className="btn btn-success btn-md flex-grow rounded-full px-8 text-white normal-case md:flex-grow-0"
                      >
                        Next
                      </button>
                    </div>
                  </form>
                </>
              )}

              {/* STEP 4: Features */}
              {step === 4 && (
                <>
                  <div className="mb-4 flex flex-col gap-2">
                    <h5 className="font-bold tracking-wider">Features</h5>
                    <p className="-mt-2 text-sm">
                      Configure additional program features
                    </p>
                  </div>

                  <form
                    ref={formRef4}
                    className="flex flex-col gap-4"
                    onSubmit={handleSubmitStep4((data) =>
                      onSubmitStep(5, data),
                    )}
                  >
                    <div className="flex flex-col gap-4">
                      <label
                        htmlFor="isDefault"
                        className="label cursor-pointer justify-normal p-0"
                      >
                        <input
                          type="checkbox"
                          id="isDefault"
                          className="checkbox-secondary checkbox disabled:border-gray"
                          {...registerStep4("isDefault")}
                        />
                        <div className="text-gray-dark ml-4 select-none">
                          <div>Default</div>
                          <p className="text-sm">
                            Make this program the default for new referral links
                          </p>
                        </div>
                      </label>

                      <label
                        htmlFor="proofOfPersonhoodRequired"
                        className="label cursor-pointer justify-normal p-0"
                      >
                        <input
                          type="checkbox"
                          id="proofOfPersonhoodRequired"
                          className="checkbox-secondary checkbox disabled:border-gray"
                          {...registerStep4("proofOfPersonhoodRequired")}
                        />
                        <div className="text-gray-dark ml-4 select-none">
                          <div>Proof of Personhood Required</div>
                          <p className="text-sm">
                            Referee must verify via phone OTP or social sign-in
                          </p>
                        </div>
                      </label>

                      <label
                        htmlFor="multipleLinksAllowed"
                        className="label cursor-pointer justify-normal p-0"
                      >
                        <input
                          type="checkbox"
                          id="multipleLinksAllowed"
                          className="checkbox-secondary checkbox disabled:border-gray"
                          {...registerStep4("multipleLinksAllowed")}
                        />
                        <div className="text-gray-dark ml-4 select-none">
                          <div>Multiple Links Allowed</div>
                          <p className="text-sm">
                            Allow referrers to have multiple active links
                            simultaneously
                          </p>
                        </div>
                      </label>
                    </div>

                    {/* Form-level errors */}
                    {formStateStep4.errors.proofOfPersonhoodRequired &&
                      typeof formStateStep4.errors.proofOfPersonhoodRequired
                        .message === "string" && (
                        <div className="mt-4">
                          <FormMessage messageType={FormMessageType.Error}>
                            {
                              formStateStep4.errors.proofOfPersonhoodRequired
                                .message
                            }
                          </FormMessage>
                        </div>
                      )}
                    {formStateStep4.errors.isDefault &&
                      typeof formStateStep4.errors.isDefault.message ===
                        "string" && (
                        <div className="mt-4">
                          <FormMessage messageType={FormMessageType.Error}>
                            {formStateStep4.errors.isDefault.message}
                          </FormMessage>
                        </div>
                      )}
                    {formStateStep4.errors.multipleLinksAllowed &&
                      typeof formStateStep4.errors.multipleLinksAllowed
                        .message === "string" && (
                        <div className="mt-4">
                          <FormMessage messageType={FormMessageType.Error}>
                            {formStateStep4.errors.multipleLinksAllowed.message}
                          </FormMessage>
                        </div>
                      )}

                    <div className="flex flex-row items-center justify-center gap-2 md:justify-end md:gap-4">
                      <button
                        type="button"
                        onClick={() => onStep(3)}
                        className="btn btn-warning btn-md flex-grow rounded-full px-8 normal-case md:flex-grow-0"
                      >
                        Back
                      </button>

                      <button
                        type="submit"
                        className="btn btn-success btn-md flex-grow rounded-full px-8 text-white normal-case md:flex-grow-0"
                      >
                        Next
                      </button>
                    </div>
                  </form>
                </>
              )}

              {/* STEP 5: Pathway Configuration */}
              {step === 5 && (
                <>
                  <div className="mb-4 flex flex-col gap-2">
                    <h5 className="font-bold tracking-wider">
                      Engagement Pathway
                    </h5>
                    <p className="-mt-2 text-sm">
                      Configure the steps and tasks for referee completion
                    </p>
                  </div>

                  <form
                    ref={formRef5}
                    className="flex flex-col gap-4"
                    onSubmit={handleSubmitStep5((data) =>
                      onSubmitStep(6, data),
                    )}
                  >
                    {/* Pathway Required Toggle */}
                    <div className="rounded-lg border border-gray-300 bg-white p-4">
                      <Controller
                        name="pathwayRequired"
                        control={controlStep5}
                        render={({ field: { value, ...field } }) => (
                          <>
                            <label
                              htmlFor="pathwayRequired"
                              className="label cursor-pointer justify-normal p-0"
                            >
                              <input
                                type="checkbox"
                                id="pathwayRequired"
                                className="checkbox-secondary checkbox disabled:border-gray"
                                {...field}
                                checked={value}
                              />
                              <div className="text-gray-dark ml-4 select-none">
                                <div>Enable Engagement Pathway</div>
                                <p className="text-sm">
                                  When enabled, referees must complete the
                                  configured pathway checklist below
                                </p>
                              </div>
                            </label>
                          </>
                        )}
                      />
                    </div>

                    {pathwayRequiredWatch && !formStateStep5.isValid && (
                      <FormRequiredFieldMessage />
                    )}

                    {pathwayRequiredWatch ? (
                      <AdminProgramPathwayEditComponent
                        control={controlStep5}
                        opportunityDataMap={opportunityDataMap}
                      />
                    ) : (
                      <FormMessage messageType={FormMessageType.Info}>
                        Pathway configuration is disabled. Enable &quot;Enable
                        Engagement Pathway&quot; above to configure pathway
                        requirements.
                      </FormMessage>
                    )}

                    <div className="flex flex-row items-center justify-center gap-2 md:justify-end md:gap-4">
                      <button
                        type="button"
                        onClick={() => onStep(4)}
                        className="btn btn-warning btn-md flex-grow rounded-full px-8 normal-case md:flex-grow-0"
                      >
                        Back
                      </button>

                      <button
                        type="submit"
                        className="btn btn-success btn-md flex-grow rounded-full px-8 text-white normal-case md:flex-grow-0"
                      >
                        Next
                      </button>
                    </div>
                  </form>
                </>
              )}

              {/* STEP 6: Preview */}
              {step === 6 && (
                <div className="space-y-6">
                  <div className="flex flex-row items-start justify-between gap-4">
                    {/* Program Image */}
                    <div className="flex-shrink-0">
                      <ProgramImage
                        imageURL={programPreview?.imageURL}
                        name={programPreview?.name ?? "Program"}
                        size={60}
                        className="border-2 border-gray-200"
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex min-w-0 items-center gap-2">
                        <h1 className="truncate text-base font-bold md:text-lg">
                          {programPreview?.name ?? "N/A"}
                        </h1>
                        {programPreview?.isDefault && (
                          <span className="badge badge-primary">Default</span>
                        )}
                      </div>
                      <p className="truncate text-xs text-gray-500 md:text-sm">
                        {programPreview?.description ??
                          "No description provided"}
                      </p>
                    </div>
                  </div>

                  {/* Program Information Sections */}
                  {programPreview && (
                    <AdminProgramInfo
                      program={programPreview}
                      imagePreviewUrl={imagePreviewUrl}
                      opportunityDataMap={opportunityDataMap}
                      filterOptions={[
                        ProgramInfoFilterOptions.PROGRAM_INFO,
                        ProgramInfoFilterOptions.COMPLETION_REWARDS,
                        ProgramInfoFilterOptions.ZLTO_REWARDS,
                        ProgramInfoFilterOptions.FEATURES,
                        ProgramInfoFilterOptions.PATHWAY,
                      ]}
                    />
                  )}

                  {/* Action Buttons */}
                  <div className="flex flex-row items-center justify-center gap-2 pt-4 md:justify-end md:gap-4">
                    <button
                      type="button"
                      onClick={() => onStep(5)}
                      className="btn btn-warning btn-md flex-grow rounded-full px-8 normal-case md:flex-grow-0"
                    >
                      Back
                    </button>

                    <button
                      type="button"
                      className="btn btn-success btn-md flex-grow rounded-full px-8 text-white normal-case md:flex-grow-0"
                      onClick={() => onSubmit(formData)}
                      disabled={
                        isLoading ||
                        !(
                          formStateStep1.isValid &&
                          formStateStep2.isValid &&
                          formStateStep3.isValid &&
                          formStateStep4.isValid &&
                          formStateStep5.isValid
                        )
                      }
                    >
                      {isLoading && (
                        <span className="loading loading-spinner"></span>
                      )}
                      {id === "create" ? "Create Program" : "Save Changes"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

ReferralProgramForm.getLayout = function getLayout(page: ReactElement) {
  return <MainLayout>{page}</MainLayout>;
};

ReferralProgramForm.theme = function getTheme(
  page: ReactElement<{ theme: string }>,
) {
  return page.props.theme;
};

export default ReferralProgramForm;
