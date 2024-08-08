import { zodResolver } from "@hookform/resolvers/zod";
import { captureException } from "@sentry/nextjs";
import {
  QueryClient,
  dehydrate,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import axios, { type AxiosError } from "axios";
import moment from "moment";
import { type GetServerSidePropsContext } from "next";
import { getServerSession } from "next-auth";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import iconBell from "public/images/icon-bell.webp";
import { type ParsedUrlQuery } from "querystring";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactElement,
} from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import {
  Controller,
  useFieldArray,
  useForm,
  type FieldValues,
} from "react-hook-form";
import {
  IoIosCheckmarkCircle,
  IoMdAlert,
  IoMdArrowRoundBack,
  IoMdClose,
  IoMdImage,
} from "react-icons/io";
import ReactModal from "react-modal";
import Select from "react-select";
import Async from "react-select/async";
import CreatableSelect from "react-select/creatable";
import { toast } from "react-toastify";
import z from "zod";
import { SchemaType } from "~/api/models/credential";
import type { SelectOption, Skill } from "~/api/models/lookups";
import {
  Status,
  VerificationMethod,
  type Opportunity,
  type OpportunityInfo,
  type OpportunityRequestBase,
  type OpportunityVerificationType,
} from "~/api/models/opportunity";
import type { Organization } from "~/api/models/organisation";
import { getSchemas } from "~/api/services/credentials";
import {
  getCountries,
  getEngagementTypes,
  getLanguages,
  getSkills,
  getTimeIntervals,
} from "~/api/services/lookups";
import {
  createOpportunity,
  getCategories,
  getDifficulties,
  getOpportunityById,
  getTypes,
  getVerificationTypes,
  updateOpportunity,
  updateOpportunityStatus,
} from "~/api/services/opportunities";
import { getOrganisationById } from "~/api/services/organisations";
import { AvatarImage } from "~/components/AvatarImage";
import FormCheckbox from "~/components/Common/FormCheckbox";
import FormField from "~/components/Common/FormField";
import FormInput from "~/components/Common/FormInput";
import FormMessage, { FormMessageType } from "~/components/Common/FormMessage";
import FormRadio from "~/components/Common/FormRadio";
import FormRequiredFieldMessage from "~/components/Common/FormRequiredFieldMessage";
import MainLayout from "~/components/Layout/Main";
import OpportunityPublicDetails from "~/components/Opportunity/OpportunityPublicDetails";
import { OpportunityPublicSmallComponent } from "~/components/Opportunity/OpportunityPublicSmall";
import { PageBackground } from "~/components/PageBackground";
import { Editor } from "~/components/RichText/Editor";
import { ApiErrors } from "~/components/Status/ApiErrors";
import { InternalServerError } from "~/components/Status/InternalServerError";
import { Loading } from "~/components/Status/Loading";
import { Unauthenticated } from "~/components/Status/Unauthenticated";
import { Unauthorized } from "~/components/Status/Unauthorized";
import { useDisableBodyScroll } from "~/hooks/useDisableBodyScroll";
import {
  ACCEPTED_AUDIO_TYPES_LABEL,
  ACCEPTED_DOC_TYPES_LABEL,
  ACCEPTED_IMAGE_TYPES_LABEL,
  DATE_FORMAT_SYSTEM,
  GA_ACTION_OPPORTUNITY_CREATE,
  GA_ACTION_OPPORTUNITY_UPDATE,
  GA_CATEGORY_OPPORTUNITY,
  MAX_FILE_SIZE_LABEL,
  PAGE_SIZE_MEDIUM,
  REGEX_URL_VALIDATION,
} from "~/lib/constants";
import { trackGAEvent } from "~/lib/google-analytics";
import { config } from "~/lib/react-query-config";
import {
  debounce,
  getSafeUrl,
  getThemeFromRole,
  normalizeDate,
} from "~/lib/utils";
import type { NextPageWithLayout } from "~/pages/_app";
import { authOptions, type User } from "~/server/auth";

interface IParams extends ParsedUrlQuery {
  id: string;
  opportunityId: string;
  returnUrl?: string;
}

// ⚠️ SSR
export async function getServerSideProps(context: GetServerSidePropsContext) {
  const { id, opportunityId } = context.params as IParams;
  const session = await getServerSession(context.req, context.res, authOptions);
  const queryClient = new QueryClient(config);
  let errorCode = null;

  // 👇 ensure authenticated
  if (!session) {
    return {
      props: {
        error: 401,
      },
    };
  }

  // 👇 set theme based on role
  const theme = getThemeFromRole(session, id);

  try {
    // 👇 prefetch queries on server
    if (opportunityId !== "create") {
      const data = await getOpportunityById(opportunityId, context);

      await queryClient.prefetchQuery({
        queryKey: ["opportunity", opportunityId],
        queryFn: () => data,
      });
    }
  } catch (error) {
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
      user: session?.user ?? null,
      id: id,
      opportunityId: opportunityId,
      theme: theme,
      error: errorCode,
    },
  };
}

// 👇 PAGE COMPONENT: Opportunity Create/Edit
// this page acts as a create (/opportunites/create) or edit page (/opportunities/:id) based on the [opportunityId] route param
// this page is accessed from the /organisations/[id]/.. pages (OrgAdmin role)
// or from the /admin/opportunities/.. pages (Admin role). the retunUrl query param is used to redirect back to the admin page
const OpportunityAdminDetails: NextPageWithLayout<{
  id: string;
  opportunityId: string;
  user: User;
  theme: string;
  error?: number;
}> = ({ id, opportunityId, error }) => {
  const router = useRouter();
  const { returnUrl } = router.query;
  const queryClient = useQueryClient();
  const [saveChangesDialogVisible, setSaveChangesDialogVisible] =
    useState(false);
  const [lastStepBeforeSaveChangesDialog, setLastStepBeforeSaveChangesDialog] =
    useState<number | null>(null);
  const [oppExpiredModalVisible, setOppExpiredModalVisible] = useState(false);
  const [loadingUpdateInactive, setLoadingUpdateInactive] = useState(false);
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [cacheSkills, setCacheSkills] = useState<Skill[]>([]);
  const htmlRef = useRef<HTMLDivElement>(null);

  // 👇 prevent scrolling on the page when the dialogs are open
  useDisableBodyScroll(oppExpiredModalVisible || saveChangesDialogVisible);

  //#region Queries

  // Categories
  const { data: categoriesData } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => getCategories(),
    enabled: !error,
  });
  const categoriesOptions = useMemo<SelectOption[]>(
    () =>
      categoriesData?.map((c) => ({
        value: c.id,
        label: c.name,
      })) ?? [],
    [categoriesData],
  );

  // Countries
  const { data: countriesData } = useQuery({
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

  // Languages
  const { data: languagesData } = useQuery({
    queryKey: ["languages"],
    queryFn: async () => getLanguages(),
    enabled: !error,
  });
  const languagesOptions = useMemo<SelectOption[]>(
    () =>
      languagesData?.map((c) => ({
        value: c.id,
        label: c.name,
      })) ?? [],
    [languagesData],
  );

  // Opportunity Types
  const { data: opportunityTypesData } = useQuery({
    queryKey: ["opportunityTypes"],
    queryFn: async () => getTypes(),
    enabled: !error,
  });
  const opportunityTypesOptions = useMemo<SelectOption[]>(
    () =>
      opportunityTypesData?.map((c) => ({
        value: c.id,
        label: c.name,
      })) ?? [],
    [opportunityTypesData],
  );

  // Verification Types
  const { data: verificationTypesData } = useQuery({
    queryKey: ["verificationTypes"],
    queryFn: async () => getVerificationTypes(),
    enabled: !error,
  });

  // Difficulties
  const verificationTypesOptions = useMemo<OpportunityVerificationType[]>(
    () => verificationTypesData ?? [],
    [verificationTypesData],
  );

  // Difficulties
  const { data: difficultiesData } = useQuery({
    queryKey: ["difficulties"],
    queryFn: async () => getDifficulties(),
    enabled: !error,
  });
  const difficultiesOptions = useMemo<SelectOption[]>(
    () =>
      difficultiesData?.map((c) => ({
        value: c.id,
        label: c.name,
      })) ?? [],
    [difficultiesData],
  );

  // Time Intervals
  const { data: timeIntervalsData } = useQuery({
    queryKey: ["timeIntervals"],
    queryFn: async () => getTimeIntervals(),
    enabled: !error,
  });
  const timeIntervalsOptions = useMemo<SelectOption[]>(
    () =>
      timeIntervalsData?.map((c) => ({
        value: c.id,
        label: c.name,
      })) ?? [],
    [timeIntervalsData],
  );

  // Engagement Types
  const { data: engagementTypesData } = useQuery({
    queryKey: ["engagementTypes"],
    queryFn: async () => getEngagementTypes(),
    enabled: !error,
  });
  const engagementTypesOptions = useMemo<SelectOption[]>(
    () =>
      engagementTypesData?.map((c) => ({
        value: c.id,
        label: c.name,
      })) ?? [],
    [engagementTypesData],
  );

  // Schemas
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

  // Opportunity
  // 👇 use prefetched query from server
  const { data: opportunity } = useQuery<Opportunity>({
    queryKey: ["opportunity", opportunityId],
    queryFn: () => getOpportunityById(opportunityId),
    enabled: opportunityId !== "create" && !error,
  });

  // Organisation
  const { data: organisation } = useQuery<Organization>({
    queryKey: ["organisation", id],
    queryFn: () => getOrganisationById(id),
    enabled: !error,
  });
  //#endregion Queries

  //#region Form
  const formRef1 = useRef<HTMLFormElement>(null);
  const formRef2 = useRef<HTMLFormElement>(null);
  const formRef3 = useRef<HTMLFormElement>(null);
  const formRef4 = useRef<HTMLFormElement>(null);
  const formRef5 = useRef<HTMLFormElement>(null);
  const formRef6 = useRef<HTMLFormElement>(null);
  const formRef7 = useRef<HTMLFormElement>(null);

  const [formData, setFormData] = useState<OpportunityRequestBase>({
    id: opportunity?.id ?? null,
    title: opportunity?.title ?? "",
    summary: opportunity?.summary ?? "",
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
    verificationMethod: opportunity?.verificationMethod
      ? VerificationMethod[opportunity.verificationMethod]
      : null,
    verificationTypes: opportunity?.verificationTypes ?? [],
    credentialIssuanceEnabled: opportunity?.credentialIssuanceEnabled ?? false,
    ssiSchemaName: opportunity?.ssiSchemaName ?? null,
    engagementTypeId: opportunity?.engagementTypeId ?? null,
    organizationId: id,
    postAsActive: opportunity?.published ?? false,
    instructions: opportunity?.instructions ?? "",
  });

  const schemaStep1 = z.object({
    title: z
      .string()
      .min(1, "Title is required.")
      .max(150, "Title cannot exceed 150 characters."),
    description: z.string().min(1, "Description is required."),
    summary: z
      .string()
      .min(1, "Summary is required.")
      .max(150, "Summary cannot exceed 150 characters."),
    typeId: z.string().min(1, "Type is required."),
    engagementTypeId: z.union([z.string(), z.null()]).optional(),
    categories: z
      .array(z.string(), { required_error: "Category is required" })
      .min(1, "Category is required."),
    uRL: z
      .string()
      .max(2048, "Link cannot exceed 2048 characters.")
      .optional()
      .refine(
        (value) => (value ?? "") === "" || REGEX_URL_VALIDATION.test(value!),
        "Please enter a valid URL - example.com | www.example.com | https://www.example.com",
      ),
  });

  const schemaStep2 = z
    .object({
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
          message: "Number is required.",
        })
        .refine((val) => val != null && val > 0, {
          message: "Number must be greater than 0.",
        })
        .refine((val) => val != null && val <= 32767, {
          message: "Number must be less than or equal to 32767.",
        }),
      commitmentIntervalId: z.string().min(1, "Time frame is required."),
      dateStart: z
        .union([z.null(), z.string(), z.date()])
        .refine((val) => val !== null, {
          message: "Start date is required.",
        })
        .refine(
          (val) => {
            /*
              Create: Can not be in the past
              Update: Can not be in the past provided the start date has changed
            */
            if (typeof val === "string") {
              val = new Date(val);
            }

            // Normalize the date to midnight
            val = normalizeDate(val);

            if (opportunityId !== "create") {
              // update
              const originalDateStart = opportunity?.dateStart;
              if (originalDateStart) {
                const originalDate = normalizeDate(new Date(originalDateStart));
                if (originalDate.getTime() === val.getTime()) {
                  return true; // No change in start date
                }
              }
            }

            return val instanceof Date && val >= normalizeDate(new Date());
          },
          {
            message: "Start date cannot be in the past.",
          },
        ),
      dateEnd: z.union([z.string(), z.date(), z.null()]).optional(),
      participantLimit: z
        .union([z.nan(), z.null(), z.number()])
        .optional()
        .superRefine((val, ctx) => {
          if (val != null) {
            if (val <= 0) {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Number must be greater than 0.",
              });
            }
            if (val > 2147483647) {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Number must be less than or equal to 2147483647.",
              });
            }
          }
        }),
    })
    .superRefine((val, ctx) => {
      if (val == null) return;
      // debugger;
      // ensure dateEnd is not before dateStart
      if (val.dateEnd && val.dateStart) {
        if (
          normalizeDate(new Date(val.dateEnd)) <
          normalizeDate(new Date(val.dateStart))
        ) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "End date must be after start date.",
            path: ["dateEnd"],
            fatal: true,
          });
        }
      }
    });

  const schemaStep3 = z
    .object({
      zltoReward: z
        .union([z.nan(), z.null(), z.number()])
        .superRefine((val, ctx) => {
          if (val != null) {
            if (val <= 0) {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Reward amount must be greater than 0.",
              });
            }
            if (val > 2000) {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Reward amount must be less than or equal to 2000.",
              });
            }
          }
        }),
      zltoRewardPool: z
        .union([z.nan(), z.null(), z.number()])
        .superRefine((val, ctx) => {
          if (val != null) {
            if (val <= 0) {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Reward pool must be greater than 0.",
              });
            }
          }
        }),
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
    })
    .superRefine((val, ctx) => {
      if (val == null) return;

      if (
        val.zltoRewardPool != null &&
        val.zltoReward != null &&
        val.zltoRewardPool < val.zltoReward
      ) {
        ctx.addIssue({
          message:
            "Reward pool must be greater than or equal to reward amount.",
          code: z.ZodIssueCode.custom,
          path: ["zltoRewardPool"],
          fatal: true,
        });
        return z.NEVER;
      }
    });

  const schemaStep4 = z.object({
    keywords: z.array(z.string()).min(1, "Keyword is required."),
  });

  const schemaStep5 = z
    .object({
      verificationEnabled: z.union([z.boolean(), z.null()]),
      verificationMethod: z.union([z.number(), z.null()]).optional(),
      verificationTypes: z
        .union([
          z.array(
            z.object({
              type: z.any(),
              description: z
                .string({
                  required_error: "Description is required",
                })
                .optional(),
            }),
          ),
          z.null(),
        ])
        .optional(),
    })
    .superRefine((values, ctx) => {
      // verificationEnabled option is required
      if (values.verificationEnabled == null) {
        ctx.addIssue({
          message: "Verification type is required.",
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
          message: "Verification proof is required.",
          code: z.ZodIssueCode.custom,
          path: ["verificationTypes"],
          fatal: true,
        });
        return z.NEVER;
      }

      for (const file of values.verificationTypes) {
        if (file?.type && !file.description) {
          ctx.addIssue({
            message: "A description for each verification proof is required.",
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
          (x: any) => x.type != null && x.type != undefined && x.type != false,
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
          message: "Schema is required.",
          code: z.ZodIssueCode.custom,
          path: ["ssiSchemaName"],
        });
      }
    });

  const schemaStep7 = z.object({
    postAsActive: z.boolean().optional(),
  });

  const {
    register: registerStep1,
    handleSubmit: handleSubmitStep1,
    formState: formStateStep1,
    control: controlStep1,
    reset: resetStep1,
    trigger: triggerStep1,
  } = useForm({
    resolver: zodResolver(schemaStep1),
    defaultValues: formData,
    mode: "all",
  });

  const {
    register: registerStep2,
    handleSubmit: handleSubmitStep2,
    formState: formStateStep2,
    control: controlStep2,
    getValues: getValuesStep2,
    reset: resetStep2,
    trigger: triggerStep2,
  } = useForm({
    resolver: zodResolver(schemaStep2),
    defaultValues: formData,
    mode: "all",
  });

  const {
    register: registerStep3,
    handleSubmit: handleSubmitStep3,
    formState: formStateStep3,
    control: controlStep3,
    getValues: getValuesStep3,
    setValue: setValueStep3,
    reset: resetStep3,
    trigger: triggerStep3,
  } = useForm({
    resolver: zodResolver(schemaStep3),
    defaultValues: formData,
    mode: "all",
  });

  const {
    handleSubmit: handleSubmitStep4,
    formState: formStateStep4,
    reset: resetStep4,
    control: controlStep4,
    trigger: triggerStep4,
  } = useForm({
    resolver: zodResolver(schemaStep4),
    defaultValues: formData,
    mode: "all",
  });

  const {
    handleSubmit: handleSubmitStep5,
    getValues: getValuesStep5,
    setValue: setValueStep5,
    formState: formStateStep5,
    control: controlStep5,
    watch: watchStep5,
    reset: resetStep5,
    trigger: triggerStep5,
  } = useForm({
    resolver: zodResolver(schemaStep5),
    defaultValues: formData,
    mode: "all",
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
    trigger: triggerStep6,
  } = useForm({
    resolver: zodResolver(schemaStep6),
    defaultValues: formData,
    mode: "all",
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
    trigger: triggerStep7,
  } = useForm({
    resolver: zodResolver(schemaStep7),
    defaultValues: formData,
    mode: "all",
  });

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
  //#endregion Form

  //#region Form Behavior
  const menuItems = [
    { step: 1, label: "General", formState: formStateStep1 },
    { step: 2, label: "Details", formState: formStateStep2 },
    { step: 3, label: "Rewards", formState: formStateStep3 },
    { step: 4, label: "Keywords", formState: formStateStep4 },
    { step: 5, label: "Verification", formState: formStateStep5 },
    { step: 6, label: "Credential", formState: formStateStep6 },
    {
      step: 7,
      label: "Preview",
      formState: {
        isValid:
          formStateStep1.isValid &&
          formStateStep2.isValid &&
          formStateStep3.isValid &&
          formStateStep4.isValid &&
          formStateStep5.isValid &&
          formStateStep6.isValid,
      },
    },
  ];

  useEffect(() => {
    // show the expired modal if the opportunity is expired
    if ((opportunity?.status as any) == "Expired") {
      setOppExpiredModalVisible(true);
    }
  }, [opportunity?.status, setOppExpiredModalVisible]);

  useEffect(() => {
    // if verification is disabled, uncheck credential issuance, clear verification method, clear schema, clear participantLimit
    if (!watchVerificationEnabled) {
      setFormData((prev) => ({
        ...prev,
        credentialIssuanceEnabled: false,
        verificationMethod: null,
        ssiSchemaName: null,
        participantLimit: null,
      }));
    }
  }, [watchVerificationEnabled, setFormData]);

  useEffect(() => {
    // trigger validation when watchVerificationEnabled & watchVerificationMethod changes (for required field indicators to refresh)
    triggerStep5();
  }, [watchVerificationEnabled, watchVerificationMethod, triggerStep5]);

  useEffect(() => {
    // trigger validation when credential issuance changed (for required field indicators to refresh)
    triggerStep6();
  }, [watchCredentialIssuanceEnabled, triggerStep6]);

  useEffect(() => {
    // scroll to top on step change
    window.scrollTo(0, 0);
  }, [step]);

  // on schema select, show the schema attributes
  const schemaAttributes = useMemo(() => {
    if (watcSSISchemaName) {
      return schemas?.find((x) => x.name === watcSSISchemaName)?.entities ?? [];
    } else return [];
  }, [schemas, watcSSISchemaName]);

  useEffect(() => {
    // popuplate the cache with the skills from the opportunity
    if (opportunity?.skills) {
      setCacheSkills((prev) => [...prev, ...(opportunity.skills ?? [])]);
    }
  }, [opportunity?.skills, setCacheSkills]);

  // this is used by the preview components
  const opportunityInfo = useMemo<OpportunityInfo>(
    () => ({
      id: opportunityId,
      title: formData.title,
      description: formData.description,
      type:
        formData.typeId && opportunityTypesData
          ? opportunityTypesData.find((x) => x.id == formData.typeId)?.name ??
            ""
          : "",
      organizationId: id,
      organizationName: organisation ? organisation.name : "",
      organizationLogoURL: organisation ? organisation.logoURL : "",
      summary: formData.summary,
      instructions: formData.instructions,
      url: formData.uRL,
      zltoReward: formData.zltoReward,
      zltoRewardCumulative: 0,
      yomaReward: formData.yomaReward,
      yomaRewardCumulative: 0,
      verificationEnabled: formData.verificationEnabled ?? false,
      verificationMethod: formData.verificationMethod,
      difficulty:
        formData.difficultyId && difficultiesData
          ? difficultiesData.find((x) => x.id == formData.difficultyId)?.name ??
            ""
          : "",
      commitmentInterval:
        formData.commitmentIntervalId && timeIntervalsData
          ? timeIntervalsData.find((x) => x.id == formData.commitmentIntervalId)
              ?.name ?? ""
          : "",
      commitmentIntervalCount: formData.commitmentIntervalCount ?? 0,
      commitmentIntervalDescription: "",
      participantLimit: formData.participantLimit,
      participantCountCompleted: 0,
      participantCountPending: 0,
      participantCountTotal: 0,
      participantLimitReached: false,
      countViewed: 0,
      countNavigatedExternalLink: 0,
      statusId: "",
      status: "Active",
      keywords: formData.keywords,
      dateStart: formData.dateStart ?? "",
      dateEnd: formData.dateEnd ?? "",
      featured: false,
      engagementType:
        formData.engagementTypeId && engagementTypesData
          ? engagementTypesData.find((x) => x.id == formData.engagementTypeId)
              ?.name ?? ""
          : "",
      published: true,
      yomaInfoURL: "",
      categories:
        formData.categories && categoriesData
          ? formData.categories?.map(
              (x) => categoriesData.find((y) => y.id == x)!,
            )
          : [],
      countries:
        formData.countries && countriesData
          ? formData.countries?.map(
              (x) => countriesData.find((y) => y.id == x)!,
            )
          : [],
      languages:
        formData.languages && languagesData
          ? formData.languages?.map(
              (x) => languagesData.find((y) => y.id == x)!,
            )
          : [],
      skills:
        formData.skills && cacheSkills
          ? formData.skills
              .map((x) => cacheSkills.find((y) => y.id === x))
              .filter((skill): skill is Skill => Boolean(skill))
          : [],
      verificationTypes: formData.verificationTypes,
    }),
    [
      formData,
      organisation,
      opportunityId,
      id,
      opportunityTypesData,
      difficultiesData,
      timeIntervalsData,
      engagementTypesData,
      categoriesData,
      countriesData,
      languagesData,
      cacheSkills,
    ],
  );

  const triggerValidation = useCallback(() => {
    const validate = async () => {
      await triggerStep1();
      await triggerStep2();
      await triggerStep3();
      await triggerStep4();
      await triggerStep5();
      await triggerStep6();
      await triggerStep7();
    };

    validate();
  }, [
    triggerStep1,
    triggerStep2,
    triggerStep3,
    triggerStep4,
    triggerStep5,
    triggerStep6,
    triggerStep7,
  ]);

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
      else if (step === 6 && isDirtyStep6) isDirtyStep = true;

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
    triggerValidation();
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

        // convert dates to string in format "YYYY-MM-DD"
        data.dateStart = data.dateStart
          ? moment.utc(data.dateStart).format(DATE_FORMAT_SYSTEM)
          : null;
        data.dateEnd = data.dateEnd
          ? moment.utc(data.dateEnd).format(DATE_FORMAT_SYSTEM)
          : null;

        // if verification is disabled, uncheck credential issuance, clear verification method, clear schema
        if (!data.verificationEnabled) {
          data.credentialIssuanceEnabled = false;
          data.verificationMethod = null;
          data.verificationTypes = null;
          data.participantLimit = null;
        }

        // if credential issuance is disabled, clear schema
        if (!data.credentialIssuanceEnabled) {
          data.ssiSchemaName = null;
        }

        // update api
        if (opportunity) {
          await updateOpportunity(data);

          // 📊 GOOGLE ANALYTICS: track event
          trackGAEvent(
            GA_CATEGORY_OPPORTUNITY,
            GA_ACTION_OPPORTUNITY_UPDATE,
            `Updated Opportunity: ${data.title}`,
          );

          message = "Opportunity updated";
        } else {
          await createOpportunity(data);

          // 📊 GOOGLE ANALYTICS: track event
          trackGAEvent(
            GA_CATEGORY_OPPORTUNITY,
            GA_ACTION_OPPORTUNITY_CREATE,
            `Created Opportunity: ${data.title}`,
          );

          message = "Opportunity created";
        }

        toast(message, {
          type: "success",
        });
        console.log(message); // e2e

        // invalidate queries
        await queryClient.invalidateQueries({
          queryKey: ["opportunity", opportunityId],
        });
        //NB: this is the query on the opportunities page
        await queryClient.invalidateQueries({
          queryKey: ["opportunities", id],
        });
      } catch (error) {
        toast(<ApiErrors error={error as AxiosError} />, {
          type: "error",
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

  const onSubmitStep = useCallback(
    async (step: number, data: FieldValues) => {
      // set form data
      const model = {
        ...formData,
        ...(data as OpportunityRequestBase),
      };

      setFormData(model);

      if (step === menuItems.length + 1) {
        await onSubmit(model);

        // // 📊 GOOGLE ANALYTICS: track event
        // trackGAEvent(
        //   GA_CATEGORY_OPPORTUNITY,
        //   GA_ACTION_OPPORTUNITY_CREATE,
        //   `Created Opportunity: ${model.title}`,
        // );
      }
      // move to next step
      else setStep(step);

      // forms needs to be reset in order to clear the dirty fields
      resetStep1(model);
      resetStep2(model);
      resetStep3(model);
      resetStep4(model);
      resetStep5(model);
      resetStep6(model);
      resetStep7(model);

      // trigger validation
      triggerValidation();

      // go to last step before save changes dialog
      if (lastStepBeforeSaveChangesDialog)
        setStep(lastStepBeforeSaveChangesDialog);

      setLastStepBeforeSaveChangesDialog(null);
    },
    [
      menuItems.length,
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
      triggerValidation,
    ],
  );

  const updateStatus = useCallback(
    async (status: Status) => {
      setLoadingUpdateInactive(true);

      try {
        // call api
        await updateOpportunityStatus(opportunityId, status);

        // 📊 GOOGLE ANALYTICS: track event
        trackGAEvent(
          GA_CATEGORY_OPPORTUNITY,
          GA_ACTION_OPPORTUNITY_UPDATE,
          `Opportunity Status Changed to ${status} for Opportunity ID: ${opportunityId}`,
        );

        // invalidate queries
        await queryClient.invalidateQueries({ queryKey: ["opportunities"] });
        await queryClient.invalidateQueries({
          queryKey: ["opportunity", opportunityId],
        });

        toast.success("Opportunity status updated");
        setOppExpiredModalVisible(false);
      } catch (error) {
        toast(<ApiErrors error={error as AxiosError} />, {
          type: "error",
          toastId: "opportunity",
          autoClose: false,
          icon: false,
        });
      }
      setLoadingUpdateInactive(false);

      return;
    },
    [opportunityId, queryClient],
  );

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
  //#endregion Event Handlers

  if (error) {
    if (error === 401) return <Unauthenticated />;
    else if (error === 403) return <Unauthorized />;
    else return <InternalServerError />;
  }

  return (
    <>
      {isLoading && <Loading />}

      <PageBackground />

      {/* REFERENCE FOR FILTER POPUP: fix menu z-index issue */}
      <div ref={htmlRef} />

      {/* OPPORTUNITY EXPIRED MODAL */}
      <ReactModal
        isOpen={oppExpiredModalVisible}
        shouldCloseOnOverlayClick={false}
        onRequestClose={() => {
          setOppExpiredModalVisible(false);
        }}
        className={`fixed bottom-0 left-0 right-0 top-0 flex-grow overflow-hidden bg-white animate-in fade-in md:m-auto md:max-h-[450px] md:w-[450px] md:rounded-3xl`}
        portalClassName={"fixed z-40"}
        overlayClassName="fixed inset-0 bg-overlay"
      >
        <div className="flex h-full flex-col gap-4 overflow-y-auto pb-8">
          <div className="flex flex-row bg-green p-4 shadow-lg">
            <h1 className="flex-grow"></h1>
            <button
              type="button"
              className="btn rounded-full border-green-dark bg-green-dark p-3 text-white"
              onClick={() => {
                setOppExpiredModalVisible(false);
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
              Opportunity expired, please inactivate your opportunity before
              editing.
            </p>

            <p className="w-80 text-center text-base">
              Once you&apos;re happy with the opportunity changes, you can set
              it to active.
            </p>
            <p className="w-80 text-center text-base">
              Please make sure to set the end date in the future, else it will
              set your opportunity to expired again.
            </p>

            <div className="mt-4 flex flex-grow gap-4">
              <button
                type="button"
                className="btn btn-primary btn-wide rounded-full normal-case"
                onClick={() => updateStatus(Status.Inactive)}
                disabled={loadingUpdateInactive}
              >
                {loadingUpdateInactive ? (
                  <>
                    <span className="loading loading-spinner"></span>
                  </>
                ) : (
                  <p className="text-white">Inactivate opportunity</p>
                )}
              </button>
            </div>
          </div>
        </div>
      </ReactModal>

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

      {/* PAGE */}
      <div className="container z-10 mt-20 max-w-7xl overflow-hidden px-2 py-4">
        {/* BREADCRUMB */}
        <div className="flex flex-row items-center text-xs text-white">
          <Link
            className="flex items-center justify-center font-bold hover:text-gray"
            href={getSafeUrl(
              returnUrl?.toString(),
              `/organisations/${id}/opportunities`,
            )}
          >
            <IoMdArrowRoundBack className="bg-theme mr-2 inline-block h-4 w-4" />
            Opportunities
          </Link>

          <div className="mx-2 font-bold">|</div>

          {opportunityId == "create" ? (
            "Create"
          ) : (
            <>
              <Link
                className="mt-0 max-w-[250px] overflow-hidden text-ellipsis whitespace-nowrap font-bold hover:text-gray md:max-w-[400px] lg:max-w-[800px]"
                href={`/organisations/${id}/opportunities/${opportunityId}/info${
                  returnUrl
                    ? `?returnUrl=${encodeURIComponent(returnUrl.toString())}`
                    : ""
                }`}
              >
                {opportunity?.title}
              </Link>
              <div className="mx-2 font-bold">|</div>
              <div className="max-w-[600px] overflow-hidden text-ellipsis whitespace-nowrap">
                Edit
              </div>
            </>
          )}
        </div>

        {/* HEADING */}
        {opportunityId == "create" ? (
          <h3 className="mb-6 mt-2 font-bold text-white">New opportunity</h3>
        ) : (
          <div className="flex flex-row items-center">
            {/* LOGO */}
            <div className="flex h-20 min-w-max items-center justify-center">
              {/* NO IMAGE */}
              {!opportunity?.organizationLogoURL && (
                <IoMdImage className="h-10 w-10 text-white" />
              )}
              {/* EXISTING IMAGE */}
              {opportunity?.organizationLogoURL && (
                <div className="mr-4 h-fit">
                  <AvatarImage
                    alt="company logo"
                    size={40}
                    icon={opportunity?.organizationLogoURL}
                  />
                </div>
              )}
            </div>
            {/* TITLE */}
            <h3 className="overflow-hidden text-ellipsis whitespace-nowrap font-bold text-white">
              {opportunity?.title}
            </h3>
          </div>
        )}

        {/* MAIN CONTENT */}
        <div className="flex flex-col gap-4 md:flex-row">
          {/* MD: LEFT VERTICAL MENU */}
          <ul className="menu hidden h-max w-64 flex-none gap-3 rounded-lg bg-white p-4 font-semibold shadow-custom md:flex md:justify-center">
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
                    <IoIosCheckmarkCircle className="h-6 w-6 text-green" />
                  ) : (
                    <IoMdAlert className="h-6 w-6 text-yellow" />
                  )}
                  {item.label}
                </a>
              </li>
            ))}
          </ul>

          {/* XS: DROPDOWN MENU */}
          <select
            className="select select-md focus:border-none focus:outline-none md:hidden"
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
              <option key={item.step}>{item.label}</option>
            ))}
          </select>

          {/* FORMS */}
          <div className="flex w-full flex-grow flex-col items-center overflow-hidden rounded-lg bg-white shadow-custom">
            <div className="flex w-full flex-col px-2 py-4 md:p-8">
              {step === 1 && (
                <>
                  <div className="mb-4 flex flex-col gap-2">
                    <h5 className="font-bold tracking-wider">General</h5>
                    <p className="-mt-2 text-sm">
                      Information about the opportunity that people can explore.
                    </p>
                    {!formStateStep1.isValid && <FormRequiredFieldMessage />}
                  </div>

                  <form
                    ref={formRef1}
                    className="flex flex-col gap-4"
                    onSubmit={handleSubmitStep1((data) =>
                      onSubmitStep(2, data),
                    )} // eslint-disable-line @typescript-eslint/no-misused-promises
                  >
                    <FormField
                      label="Title"
                      subLabel="A short title of the opportunity (max 150 characters). This will be displayed on the search results and opportunity page."
                      showWarningIcon={!!formStateStep1.errors.title?.message}
                      showError={
                        !!formStateStep1.touchedFields.title ||
                        formStateStep1.isSubmitted
                      }
                      error={formStateStep1.errors.title?.message}
                    >
                      <FormInput
                        inputProps={{
                          type: "text",
                          placeholder: "Enter title...",
                          maxLength: 150,
                          ...registerStep1("title"),
                        }}
                      />
                    </FormField>

                    <FormField
                      label="Type"
                      subLabel="What type of opportunity is this?"
                      showWarningIcon={!!formStateStep1.errors.typeId?.message}
                      showError={
                        !!formStateStep1.touchedFields.typeId ||
                        formStateStep1.isSubmitted
                      }
                      error={formStateStep1.errors.typeId?.message}
                    >
                      <Controller
                        control={controlStep1}
                        name="typeId"
                        render={({ field: { onChange, value, onBlur } }) => (
                          <Select
                            instanceId="typeId"
                            classNames={{
                              control: () => "input pr-0 pl-2 !border-gray",
                            }}
                            options={opportunityTypesOptions}
                            onBlur={onBlur} // mark the field as touched
                            onChange={(val) => onChange(val?.value)}
                            value={opportunityTypesOptions?.find(
                              (c) => c.value === value,
                            )}
                            // fix menu z-index issue
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
                            inputId="input_typeid" // e2e
                            placeholder="Select type..."
                          />
                        )}
                      />
                    </FormField>

                    <FormField
                      label="Engagement"
                      subLabel="How will a person engage with this opportunity?"
                      showWarningIcon={
                        !!formStateStep1.errors.engagementTypeId?.message
                      }
                      showError={
                        !!formStateStep1.touchedFields.engagementTypeId ||
                        formStateStep1.isSubmitted
                      }
                      error={formStateStep1.errors.engagementTypeId?.message}
                    >
                      <Controller
                        control={controlStep1}
                        name="engagementTypeId"
                        render={({ field: { onChange, value, onBlur } }) => (
                          <Select
                            instanceId="engagementTypeId"
                            classNames={{
                              control: () => "input !border-gray pr-0 pl-2",
                            }}
                            options={engagementTypesOptions}
                            onBlur={onBlur} // mark the field as touched
                            onChange={(val) => onChange(val ? val.value : null)}
                            value={engagementTypesOptions?.find(
                              (c) => c.value === value,
                            )}
                            // fix menu z-index issue
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
                            isClearable={true}
                            inputId="input_engagementTypeId" // e2e
                            placeholder="Select engagement..."
                          />
                        )}
                      />
                    </FormField>

                    <FormField
                      label="Categories"
                      subLabel="Under which categories does your opportunity belong?"
                      showWarningIcon={
                        !!formStateStep1.errors.categories?.message
                      }
                      showError={
                        !!formStateStep1.touchedFields.categories ||
                        formStateStep1.isSubmitted
                      }
                      error={formStateStep1.errors.categories?.message}
                    >
                      <Controller
                        control={controlStep1}
                        name="categories"
                        render={({ field: { onChange, value, onBlur } }) => (
                          <Select
                            instanceId="categories"
                            classNames={{
                              control: () =>
                                "input !border-gray pr-0 pl-2 py-1 h-fit",
                            }}
                            isMulti={true}
                            options={categoriesOptions}
                            onBlur={onBlur} // mark the field as touched
                            onChange={(val) =>
                              onChange(val?.map((c) => c.value ?? ""))
                            }
                            value={categoriesOptions?.filter(
                              (c) => value?.includes(c.value),
                            )}
                            // fix menu z-index issue
                            menuPortalTarget={htmlRef.current}
                            styles={{
                              menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                              placeholder: (base) => ({
                                ...base,
                                color: "#A3A6AF",
                              }),
                            }}
                            inputId="input_categories" // e2e
                            placeholder="Select categories..."
                          />
                        )}
                      />
                    </FormField>

                    <FormField
                      label="Link"
                      subLabel="Add a link to a website. This can be opened from the 'Go to opportunity' button on the opportunity page."
                      showWarningIcon={!!formStateStep1.errors.uRL?.message}
                      showError={
                        !!formStateStep1.touchedFields.uRL ||
                        formStateStep1.isSubmitted
                      }
                      error={formStateStep1.errors.uRL?.message}
                    >
                      <input
                        type="text"
                        className="input input-bordered rounded-md border-gray focus:border-gray focus:outline-none"
                        placeholder="Enter link..."
                        maxLength={2048}
                        {...registerStep1("uRL")}
                      />
                    </FormField>

                    <FormField
                      label="Summary"
                      subLabel="A short summary of the opportunity (max 150 characters). This will be displayed on the search results."
                      showWarningIcon={!!formStateStep1.errors.summary?.message}
                      showError={
                        !!formStateStep1.touchedFields.summary ||
                        formStateStep1.isSubmitted
                      }
                      error={formStateStep1.errors.summary?.message}
                    >
                      <textarea
                        className="input textarea textarea-bordered h-16 rounded-md border-gray text-[1rem] leading-tight focus:border-gray focus:outline-none"
                        placeholder="Enter summary..."
                        maxLength={150}
                        {...registerStep1("summary")}
                      />
                    </FormField>

                    <FormField
                      label="Description"
                      subLabel="A detailed description of the opportunity. This will be displayed on the opportunity page."
                      showWarningIcon={
                        !!formStateStep1.errors.description?.message
                      }
                      showError={
                        !!formStateStep1.touchedFields.description ||
                        formStateStep1.isSubmitted
                      }
                      error={formStateStep1.errors.description?.message}
                    >
                      <FormMessage messageType={FormMessageType.Info}>
                        Ensure to add a space (&apos; &apos;) on your empty
                        lines if you want to add a line break.
                      </FormMessage>
                      <Controller
                        control={controlStep1}
                        name="description"
                        render={({ field: { onChange, value, onBlur } }) => (
                          <Editor
                            value={value}
                            readonly={false}
                            onBlur={onBlur} // mark the field as touched
                            onChange={onChange}
                            placeholder="Enter description..."
                          />
                        )}
                      />
                    </FormField>

                    {/* BUTTONS */}
                    <div className="flex flex-row items-center justify-center gap-2 md:justify-end md:gap-4">
                      <Link
                        className="btn btn-warning flex-grow md:w-1/3 md:flex-grow-0"
                        href={getSafeUrl(
                          returnUrl?.toString(),
                          `/organisations/${id}/opportunities`,
                        )}
                      >
                        Cancel
                      </Link>

                      <button
                        type="submit"
                        className="btn btn-success flex-grow md:w-1/3 md:flex-grow-0"
                      >
                        Next
                      </button>
                    </div>
                  </form>
                </>
              )}
              {step === 2 && (
                <>
                  <div className="mb-4 flex flex-col gap-2">
                    <h5 className="font-bold tracking-wider">Details</h5>
                    <p className="-mt-2 text-sm">
                      Detailed particulars about the opportunity.
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
                    <FormField
                      label="Languages"
                      subLabel="The languages in which the opportunity is available. This is used for searchability and will be displayed on the opportunity page."
                      showWarningIcon={
                        !!formStateStep2.errors.languages?.message
                      }
                      showError={
                        !!formStateStep2.touchedFields.languages ||
                        formStateStep2.isSubmitted
                      }
                      error={formStateStep2.errors.languages?.message}
                    >
                      <Controller
                        control={controlStep2}
                        name="languages"
                        render={({ field: { onChange, value, onBlur } }) => (
                          <Select
                            instanceId="languages"
                            classNames={{
                              control: () =>
                                "input !border-gray pr-0 pl-2 h-fit py-1",
                            }}
                            isMulti={true}
                            options={languagesOptions}
                            onBlur={onBlur} // mark the field as touched
                            onChange={(val) =>
                              onChange(val.map((c) => c.value))
                            }
                            value={languagesOptions?.filter(
                              (c) => value?.includes(c.value),
                            )}
                            // fix menu z-index issue
                            menuPortalTarget={htmlRef.current}
                            styles={{
                              menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                              placeholder: (base) => ({
                                ...base,
                                color: "#A3A6AF",
                              }),
                            }}
                            inputId="input_languages" // e2e
                            placeholder="Select languages..."
                          />
                        )}
                      />
                    </FormField>

                    <FormField
                      label="Location"
                      subLabel="The countries or regions where the opportunity is available. This is used for searchability and will be displayed on the opportunity page."
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
                        render={({ field: { onChange, value, onBlur } }) => (
                          <Select
                            instanceId="countries"
                            classNames={{
                              control: () =>
                                "input !border-gray pr-0 pl-2 h-fit py-1",
                            }}
                            isMulti={true}
                            options={countriesOptions}
                            onBlur={onBlur} // mark the field as touched
                            onChange={(val) =>
                              onChange(val.map((c) => c.value))
                            }
                            value={countriesOptions?.filter(
                              (c) => value?.includes(c.value),
                            )}
                            // fix menu z-index issue
                            menuPortalTarget={htmlRef.current}
                            styles={{
                              menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                              placeholder: (base) => ({
                                ...base,
                                color: "#A3A6AF",
                              }),
                            }}
                            inputId="input_countries" // e2e
                            placeholder="Select countries..."
                          />
                        )}
                      />
                    </FormField>

                    <FormField
                      label="Difficulty"
                      subLabel="The difficulty level of the opportunity. This will be displayed on the opportunity page."
                      showWarningIcon={
                        !!formStateStep2.errors.difficultyId?.message
                      }
                      showError={
                        !!formStateStep2.touchedFields.difficultyId ||
                        formStateStep2.isSubmitted
                      }
                      error={formStateStep2.errors.difficultyId?.message}
                    >
                      <Controller
                        control={controlStep2}
                        name="difficultyId"
                        render={({ field: { onChange, value, onBlur } }) => (
                          <Select
                            instanceId="difficultyId"
                            classNames={{
                              control: () => "input !border-gray pr-0 pl-2",
                            }}
                            isMulti={false}
                            options={difficultiesOptions}
                            onBlur={onBlur} // mark the field as touched
                            onChange={(val) => onChange(val?.value)}
                            value={difficultiesOptions?.find(
                              (c) => c.value === value,
                            )}
                            // fix menu z-index issue
                            menuPortalTarget={htmlRef.current}
                            styles={{
                              menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                              placeholder: (base) => ({
                                ...base,
                                color: "#A3A6AF",
                              }),
                            }}
                            inputId="input_difficultyId" // e2e
                            placeholder="Select difficulty..."
                          />
                        )}
                      />
                    </FormField>

                    <FormField
                      label="Effort"
                      subLabel="The effort required to complete the opportunity. This will be displayed on the opportunity page."
                      showWarningIcon={
                        !!formStateStep2.errors.commitmentIntervalCount
                          ?.message ||
                        !!formStateStep2.errors.commitmentIntervalId?.message
                      }
                    >
                      <div className="grid gap-4 md:grid-cols-2">
                        <FormField
                          showError={
                            !!formStateStep2.touchedFields
                              .commitmentIntervalCount ||
                            formStateStep2.isSubmitted
                          }
                          error={
                            formStateStep2.errors.commitmentIntervalCount
                              ?.message
                          }
                        >
                          <input
                            type="number"
                            className="input input-bordered w-full rounded-md border-gray focus:border-gray focus:outline-none"
                            placeholder="Enter number..."
                            {...registerStep2("commitmentIntervalCount", {
                              valueAsNumber: true,
                            })}
                          />
                        </FormField>

                        <FormField
                          showError={
                            !!formStateStep2.touchedFields
                              .commitmentIntervalId ||
                            formStateStep2.isSubmitted
                          }
                          error={
                            formStateStep2.errors.commitmentIntervalId?.message
                          }
                        >
                          <Controller
                            control={controlStep2}
                            name="commitmentIntervalId"
                            render={({
                              field: { onChange, value, onBlur },
                            }) => (
                              <Select
                                instanceId="commitmentIntervalId"
                                classNames={{
                                  control: () => "input !border-gray pr-0 pl-2",
                                }}
                                options={timeIntervalsOptions}
                                onBlur={onBlur} // mark the field as touched
                                onChange={(val) => onChange(val?.value)}
                                value={timeIntervalsOptions?.find(
                                  (c) => c.value === value,
                                )}
                                styles={{
                                  placeholder: (base) => ({
                                    ...base,
                                    color: "#A3A6AF",
                                  }),
                                }}
                                inputId="input_commitmentIntervalId" // e2e
                                placeholder="Select time frame..."
                              />
                            )}
                          />
                        </FormField>
                      </div>
                    </FormField>

                    <FormField
                      label="Availability"
                      subLabel="When this opportunity will be available for completion. The end date is optional."
                      showWarningIcon={
                        !!formStateStep2.errors.dateStart?.message ||
                        !!formStateStep2.errors.dateEnd?.message
                      }
                    >
                      <div className="flex flex-col gap-2">
                        <FormMessage messageType={FormMessageType.Warning}>
                          Heads up! If there is not an end date set, this
                          opportunity cannot be posted to SAYouth, we therefore
                          recommend adding one.
                        </FormMessage>

                        <div className="grid gap-4 md:grid-cols-2">
                          <FormField
                            showError={
                              !!formStateStep2.touchedFields.dateStart ||
                              formStateStep2.isSubmitted
                            }
                            error={formStateStep2.errors.dateStart?.message}
                          >
                            <Controller
                              control={controlStep2}
                              name="dateStart"
                              render={({
                                field: { onChange, onBlur, value },
                              }) => (
                                <DatePicker
                                  className="input input-bordered w-full rounded-md border-gray focus:border-gray focus:outline-none"
                                  wrapperClassName="w-full"
                                  onBlur={onBlur} // mark the field as touched
                                  onChange={(date) => onChange(date)}
                                  selected={value ? new Date(value) : null}
                                  placeholderText="Select start date..."
                                  id="input_dateStart" // e2e
                                />
                              )}
                            />
                          </FormField>

                          <FormField
                            showError={
                              !!formStateStep2.touchedFields.dateEnd ||
                              formStateStep2.isSubmitted
                            }
                            error={formStateStep2.errors.dateEnd?.message}
                          >
                            <Controller
                              control={controlStep2}
                              name="dateEnd"
                              render={({
                                field: { onChange, onBlur, value },
                              }) => (
                                <DatePicker
                                  className="input input-bordered w-full rounded-md border-gray focus:border-gray focus:outline-none"
                                  wrapperClassName="w-full"
                                  onBlur={onBlur} // mark the field as touched
                                  onChange={(date) => onChange(date)}
                                  selected={value ? new Date(value) : null}
                                  placeholderText="Select end date..."
                                  id="input_dateEnd" // e2e
                                />
                              )}
                            />
                          </FormField>
                        </div>
                      </div>
                    </FormField>

                    <FormField
                      label="Participant limit"
                      subLabel="The number of participants that can complete this opportunity."
                      showWarningIcon={
                        !!formStateStep2.errors.participantLimit?.message
                      }
                      showError={
                        !!formStateStep2.touchedFields.participantLimit ||
                        formStateStep2.isSubmitted
                      }
                      error={formStateStep2.errors.participantLimit?.message}
                    >
                      <Controller
                        control={controlStep2}
                        name="participantLimit"
                        render={({ field: { onBlur } }) => (
                          <input
                            type="number"
                            className="input input-bordered w-full rounded-md border-gray focus:border-gray focus:outline-none md:w-1/2"
                            placeholder="Enter number..."
                            {...registerStep2("participantLimit", {
                              valueAsNumber: true,
                            })}
                            onBlur={(e) => {
                              onBlur(); // mark the field as touched

                              // default pool to limit & reward
                              const participantLimit = parseInt(e.target.value);
                              //const yomaReward = getValuesStep3("yomaReward");
                              const zltoReward = getValuesStep3("zltoReward");

                              if (participantLimit !== null) {
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
                        )}
                      />
                    </FormField>

                    {/* BUTTONS */}
                    <div className="flex items-center justify-center gap-2 md:justify-end md:gap-4">
                      <button
                        type="button"
                        className="btn btn-warning flex-grow md:w-1/3 md:flex-grow-0"
                        onClick={() => {
                          onStep(1);
                        }}
                      >
                        Back
                      </button>

                      <button
                        type="submit"
                        className="btn btn-success flex-grow md:w-1/3 md:flex-grow-0"
                      >
                        Next
                      </button>
                    </div>
                  </form>
                </>
              )}
              {step === 3 && (
                <>
                  <div className="mb-4 flex flex-col gap-2">
                    <h5 className="font-bold tracking-wider">Rewards</h5>
                    <p className="-mt-2 text-sm">
                      Choose the reward that participants will earn after
                      successfully completing the opportunity.
                    </p>
                    {!formStateStep3.isValid && <FormRequiredFieldMessage />}
                  </div>

                  <form
                    ref={formRef3}
                    className="flex flex-col gap-4"
                    onSubmit={handleSubmitStep3((data) =>
                      onSubmitStep(4, data),
                    )}
                  >
                    <FormField
                      label="ZLTO Reward"
                      subLabel="Amount rewarded for completing the opportunity. Setting a pool will limit the rewards; once depleted, no ZLTO is awarded. If a participant limit is set, then the pool will default to the limit * reward. This can be changed."
                      showWarningIcon={
                        !!formStateStep3.errors.zltoReward?.message ||
                        !!formStateStep3.errors.participantLimit?.message
                      }
                    >
                      <div className="grid gap-4 md:grid-cols-2">
                        <FormField
                          showError={
                            !!formStateStep3.touchedFields.zltoReward ||
                            formStateStep3.isSubmitted
                          }
                          error={formStateStep3.errors.zltoReward?.message}
                        >
                          <Controller
                            control={controlStep3}
                            name="zltoReward"
                            render={({ field: { onBlur } }) => (
                              <input
                                type="number"
                                className="input input-bordered w-full rounded-md border-gray focus:border-gray focus:outline-none"
                                placeholder="Enter reward amount..."
                                {...registerStep3("zltoReward", {
                                  valueAsNumber: true,
                                })}
                                onBlur={(e) => {
                                  onBlur(); // mark the field as touched

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
                            )}
                          />
                        </FormField>

                        <FormField
                          showError={
                            !!formStateStep3.touchedFields.zltoRewardPool ||
                            formStateStep3.isSubmitted
                          }
                          error={formStateStep3.errors.zltoRewardPool?.message}
                        >
                          <Controller
                            control={controlStep3}
                            name="zltoRewardPool"
                            render={({ field: { onBlur } }) => (
                              <input
                                type="number"
                                className="input input-bordered w-full rounded-md border-gray focus:border-gray focus:outline-none"
                                placeholder="Enter pool amount..."
                                {...registerStep3("zltoRewardPool", {
                                  valueAsNumber: true,
                                })}
                                onBlur={(e) => {
                                  onBlur(); // mark the field as touched

                                  // default pool to limit & reward (when clearing the pool value)
                                  const participantLimit =
                                    getValuesStep2("participantLimit");
                                  const zltoReward =
                                    getValuesStep3("zltoReward");
                                  const zltoRewardPool = parseInt(
                                    e.target.value,
                                  );

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
                            )}
                          />
                        </FormField>
                      </div>
                    </FormField>

                    <FormField
                      label="Skills"
                      subLabel="Which skills will the Youth be awarded with upon completion? This will be displayed on the opportunity page."
                      showWarningIcon={!!formStateStep3.errors.skills?.message}
                      showError={
                        !!formStateStep3.touchedFields.skills ||
                        formStateStep3.isSubmitted
                      }
                      error={formStateStep3.errors.skills?.message}
                    >
                      <Controller
                        control={controlStep3}
                        name="skills"
                        render={({ field: { onChange, value, onBlur } }) => (
                          <>
                            <Async
                              instanceId="skills"
                              classNames={{
                                control: () =>
                                  "input input-xs text-[1rem] h-fit !border-gray",
                              }}
                              isMulti={true}
                              defaultOptions={true} // calls loadSkills for initial results when clicking on the dropdown
                              cacheOptions
                              loadOptions={loadSkills}
                              onBlur={onBlur} // mark the field as touched
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
                              placeholder="Select skills..."
                              inputId="input_skills" // e2e
                              // fix menu z-index issue
                              menuPortalTarget={htmlRef.current}
                              styles={{
                                menuPortal: (base) => ({
                                  ...base,
                                  zIndex: 9999,
                                }),
                              }}
                            />
                          </>
                        )}
                      />
                    </FormField>

                    {/* BUTTONS */}
                    <div className="flex items-center justify-center gap-4 md:justify-end">
                      <button
                        type="button"
                        className="btn btn-warning flex-grow md:w-1/3 md:flex-grow-0"
                        onClick={() => {
                          onStep(2);
                        }}
                      >
                        Back
                      </button>

                      <button
                        type="submit"
                        className="btn btn-success flex-grow md:w-1/3 md:flex-grow-0"
                      >
                        Next
                      </button>
                    </div>
                  </form>
                </>
              )}
              {step === 4 && (
                <>
                  <div className="mb-4 flex flex-col gap-2">
                    <h5 className="font-bold tracking-wider">Keywords</h5>
                    <p className="-mt-2 text-sm">
                      Boost your chances of being found in searches by adding
                      keywords to your opportunity.
                    </p>
                    {!formStateStep4.isValid && <FormRequiredFieldMessage />}
                  </div>

                  <form
                    ref={formRef4}
                    className="flex h-full flex-col gap-4"
                    onSubmit={handleSubmitStep4((data) =>
                      onSubmitStep(5, data),
                    )}
                  >
                    <FormField
                      label="Keywords"
                      showWarningIcon={
                        !!formStateStep4.errors.keywords?.message
                      }
                      showError={
                        !!formStateStep4.touchedFields.keywords ||
                        formStateStep4.isSubmitted
                      }
                      error={formStateStep4.errors.keywords?.message}
                    >
                      <Controller
                        control={controlStep4}
                        name="keywords"
                        render={({ field: { onChange, value, onBlur } }) => (
                          <>
                            {/* eslint-disable */}
                            <CreatableSelect
                              instanceId="keywords"
                              classNames={{
                                control: () =>
                                  "input !border-gray pr-0 pl-2 h-fit py-1",
                              }}
                              isMulti={true}
                              onBlur={onBlur} // mark the field as touched
                              onChange={(val) =>
                                onChange(val.map((c) => c.value))
                              }
                              value={value?.map((c: any) => ({
                                value: c,
                                label: c,
                              }))}
                              // fix menu z-index issue
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
                              inputId="input_keywords" // e2e
                              placeholder="Enter keywords..."
                            />
                            {/* eslint-enable  */}
                          </>
                        )}
                      />
                    </FormField>

                    {/* BUTTONS */}
                    <div className="flex items-center justify-center gap-4 md:justify-end">
                      <button
                        type="button"
                        className="btn btn-warning flex-grow md:w-1/3 md:flex-grow-0"
                        onClick={() => {
                          onStep(3);
                        }}
                      >
                        Back
                      </button>

                      <button
                        type="submit"
                        className="btn btn-success flex-grow md:w-1/3 md:flex-grow-0"
                      >
                        Next
                      </button>
                    </div>
                  </form>
                </>
              )}
              {step === 5 && (
                <>
                  <div className="mb-4 flex flex-col gap-2">
                    <h5 className="font-bold tracking-wider">Verification</h5>
                    <p className="-mt-2 text-sm">
                      How can participants confirm their involvement?
                    </p>
                    {!formStateStep5.isValid && <FormRequiredFieldMessage />}
                  </div>

                  <form
                    ref={formRef5}
                    className="flex flex-col gap-4"
                    onSubmit={handleSubmitStep5((data) =>
                      onSubmitStep(6, data),
                    )}
                  >
                    <FormField
                      label="Verification type"
                      subLabel="What type of verification is required for participants to complete the opportunity?"
                      showWarningIcon={
                        !!formStateStep5.errors.verificationEnabled?.message
                      }
                      showError={
                        !!formStateStep5.touchedFields.verificationEnabled ||
                        formStateStep5.isSubmitted
                      }
                      error={formStateStep5.errors.verificationEnabled?.message}
                    >
                      <Controller
                        control={controlStep5}
                        name="verificationEnabled"
                        render={({ field: { onChange, value } }) => (
                          <>
                            {/* MANUAL */}
                            <FormRadio
                              id="verificationEnabledManual"
                              label="Youth should upload proof of completion"
                              inputProps={{
                                checked:
                                  value === true &&
                                  getValuesStep5("verificationMethod") ===
                                    VerificationMethod.Manual,
                                onChange: () => {
                                  setValueStep5("verificationEnabled", true);
                                  setValueStep5(
                                    "verificationMethod",
                                    VerificationMethod.Manual,
                                  );

                                  onChange(true);
                                },
                              }}
                            />

                            {/* NOT REQUIRED */}
                            <FormRadio
                              id="verificationEnabledNo"
                              label="No verification is required"
                              inputProps={{
                                checked: value === false,
                                onChange: () => {
                                  setValueStep5("verificationEnabled", false);
                                  onChange(false);
                                },
                              }}
                            />
                          </>
                        )}
                      />
                    </FormField>
                    {watchVerificationEnabled &&
                      watchVerificationMethod === VerificationMethod.Manual && (
                        <FormField
                          label="Verification proof"
                          subLabel="Select the types of proof that participants need to upload as part of completing the opportuntity."
                          showWarningIcon={
                            !!formStateStep5.errors.verificationTypes?.message
                          }
                          showError={
                            !!formStateStep5.touchedFields.verificationTypes ||
                            formStateStep5.isSubmitted
                          }
                          error={
                            formStateStep5.errors.verificationTypes?.message
                          }
                        >
                          <div className="flex flex-col gap-2">
                            {verificationTypesOptions?.map((item) => (
                              <div
                                className="flex flex-col"
                                key={`verificationTypes_${item.id}`}
                              >
                                <FormCheckbox
                                  id={`chk_verificationType_${item.displayName}`}
                                  label={item.displayName}
                                  inputProps={{
                                    value: item.type,
                                    checked: watchVerificationTypes?.some(
                                      (x) => x.type === item.type,
                                    ),
                                    onChange: (e) => {
                                      if (e.target.checked) append(item);
                                      else {
                                        const index =
                                          watchVerificationTypes?.findIndex(
                                            (x) => x.type === item.type,
                                          );
                                        remove(index);
                                      }
                                    },
                                    disabled: !watchVerificationEnabled,
                                  }}
                                />

                                {/* verification type: description input */}
                                {watchVerificationTypes?.find(
                                  (x: OpportunityVerificationType) =>
                                    x.type === item.type,
                                ) && (
                                  <>
                                    {/* file types and file size message */}
                                    {item.displayName === "File Upload" && (
                                      <FormMessage
                                        messageType={FormMessageType.Warning}
                                        className="my-2"
                                      >
                                        Kindly note that candidates are required
                                        to upload a file (max{" "}
                                        {MAX_FILE_SIZE_LABEL}) in one of the
                                        following formats:
                                        <div className="my-1" />
                                        {ACCEPTED_DOC_TYPES_LABEL.map(
                                          (item, index) => (
                                            <span
                                              key={`verification_file_upload_doc_file_type_${index}`}
                                              className="mr-2 font-bold"
                                            >
                                              {item}
                                            </span>
                                          ),
                                        )}
                                        {ACCEPTED_IMAGE_TYPES_LABEL.map(
                                          (item, index) => (
                                            <span
                                              key={`verification_file_upload_image_file_type_${index}`}
                                              className="mr-2 font-bold"
                                            >
                                              {item}
                                            </span>
                                          ),
                                        )}
                                      </FormMessage>
                                    )}
                                    {item.displayName === "Location" && (
                                      <FormMessage
                                        messageType={FormMessageType.Warning}
                                        className="my-2"
                                      >
                                        Kindly note that candidates are required
                                        to choose their location from a map.
                                      </FormMessage>
                                    )}
                                    {item.displayName === "Picture" && (
                                      <FormMessage
                                        messageType={FormMessageType.Warning}
                                        className="my-2"
                                      >
                                        Kindly note that candidates are required
                                        to upload a file (max{" "}
                                        {MAX_FILE_SIZE_LABEL}) in one of the
                                        following formats:
                                        <div className="my-1" />
                                        {ACCEPTED_IMAGE_TYPES_LABEL.map(
                                          (item, index) => (
                                            <span
                                              key={`verificationtype_picture_image_file_type_${index}`}
                                              className="mr-2 font-bold"
                                            >
                                              {item}
                                            </span>
                                          ),
                                        )}
                                      </FormMessage>
                                    )}
                                    {item.displayName === "Voice Note" && (
                                      <FormMessage
                                        messageType={FormMessageType.Warning}
                                        className="my-2"
                                      >
                                        Kindly note that candidates are required
                                        to upload a file (max{" "}
                                        {MAX_FILE_SIZE_LABEL}) in one of the
                                        following formats:
                                        <div className="my-1" />
                                        {ACCEPTED_AUDIO_TYPES_LABEL.map(
                                          (item, index) => (
                                            <span
                                              key={`verificationtype_voicenote_audio_file_type_${index}`}
                                              className="mr-2 font-bold"
                                            >
                                              {item}
                                            </span>
                                          ),
                                        )}
                                      </FormMessage>
                                    )}

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
                                                  x.description =
                                                    e.target.value;
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
                                  </>
                                )}
                              </div>
                            ))}
                          </div>
                        </FormField>
                      )}

                    {/* BUTTONS */}
                    <div className="flex items-center justify-center gap-4 md:justify-end">
                      <button
                        type="button"
                        className="btn btn-warning flex-grow md:w-1/3 md:flex-grow-0"
                        onClick={() => {
                          onStep(4);
                        }}
                      >
                        Back
                      </button>

                      <button
                        type="submit"
                        className="btn btn-success flex-grow md:w-1/3 md:flex-grow-0"
                      >
                        Next
                      </button>
                    </div>
                  </form>
                </>
              )}
              {step === 6 && (
                <>
                  <div className="mb-4 flex flex-col gap-2">
                    <h5 className="font-bold tracking-wider">Credential</h5>
                    <p className="-mt-2 text-sm">
                      Information about the credential that participants will
                      receive upon completion of this opportunity.
                    </p>
                    {!formStateStep6.isValid && <FormRequiredFieldMessage />}
                  </div>

                  <form
                    ref={formRef6}
                    className="flex flex-col gap-4"
                    onSubmit={handleSubmitStep6((data) =>
                      onSubmitStep(7, data),
                    )}
                  >
                    <div className="form-control">
                      {watchVerificationEnabled === true && (
                        <FormField
                          label="Issuance"
                          subLabel="Should a credential be issued upon completion of the opportunity?"
                          showWarningIcon={
                            !!formStateStep6.errors.credentialIssuanceEnabled
                              ?.message
                          }
                          showError={
                            !!formStateStep6.touchedFields
                              .credentialIssuanceEnabled ||
                            formStateStep6.isSubmitted
                          }
                          error={
                            formStateStep6.errors.credentialIssuanceEnabled
                              ?.message
                          }
                        >
                          <FormCheckbox
                            id="credentialIssuanceEnabled"
                            label="I want to issue a credential upon completion"
                            inputProps={{
                              ...registerStep6(`credentialIssuanceEnabled`),
                              disabled: !watchVerificationEnabled,
                            }}
                          />
                        </FormField>
                      )}

                      {watchVerificationEnabled !== true && (
                        <FormMessage messageType={FormMessageType.Warning}>
                          Credential issuance is only available if verification
                          is supported (see previous step).
                        </FormMessage>
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
                        <FormField
                          label="Schema"
                          subLabel="What information will be used to issue the credential?"
                          showWarningIcon={
                            !!formStateStep6.errors.ssiSchemaName?.message
                          }
                          showError={
                            !!formStateStep6.touchedFields.ssiSchemaName ||
                            formStateStep6.isSubmitted
                          }
                          error={formStateStep6.errors.ssiSchemaName?.message}
                        >
                          <Controller
                            control={controlStep6}
                            name="ssiSchemaName"
                            render={({
                              field: { onChange, value, onBlur },
                            }) => (
                              <Select
                                instanceId="ssiSchemaName"
                                classNames={{
                                  control: () =>
                                    "input !border-gray pr-0 pl-2 h-fit py-1",
                                }}
                                options={schemasOptions}
                                onBlur={onBlur} // mark the field as touched
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
                                placeholder="Select schema..."
                              />
                            )}
                          />
                        </FormField>

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
                    <div className="flex items-center justify-center gap-4 md:justify-end">
                      <button
                        type="button"
                        className="btn btn-warning flex-grow md:w-1/3 md:flex-grow-0"
                        onClick={() => {
                          onStep(5);
                        }}
                      >
                        Back
                      </button>

                      <button
                        type="submit"
                        className="btn btn-success flex-grow md:w-1/3 md:flex-grow-0"
                      >
                        Next
                      </button>
                    </div>
                  </form>
                </>
              )}
              {step === 7 && (
                <>
                  <div className="mb-4 flex flex-col gap-2">
                    <h5 className="font-bold tracking-wider">Preview</h5>
                    <p className="-mt-2 text-sm">
                      Preview your opportunity before submitting.
                    </p>
                  </div>

                  {!(
                    formStateStep1.isValid &&
                    formStateStep2.isValid &&
                    formStateStep3.isValid &&
                    formStateStep4.isValid &&
                    formStateStep5.isValid &&
                    formStateStep6.isValid
                  ) && (
                    <FormMessage messageType={FormMessageType.Warning}>
                      Please complete the previous steps to preview and submit
                      the opportunity.
                    </FormMessage>
                  )}

                  {/* PREVIEWS */}
                  {formStateStep1.isValid &&
                    formStateStep2.isValid &&
                    formStateStep3.isValid &&
                    formStateStep4.isValid &&
                    formStateStep5.isValid &&
                    formStateStep6.isValid && (
                      <div className="flex flex-col gap-4">
                        {/* CARD PREVIEW */}
                        <div className="flex flex-col gap-2">
                          <h6 className="text-sm font-bold">Search Results</h6>

                          <FormMessage messageType={FormMessageType.Info}>
                            This is how your opportunity will appear in search
                            results.
                          </FormMessage>

                          <div className="mt-4 flex justify-center">
                            <OpportunityPublicSmallComponent
                              key={`opportunity_card_preview`}
                              preview={true}
                              data={opportunityInfo}
                            />
                          </div>
                        </div>

                        {/* DETAILS PREVIEW */}
                        <div className="flex flex-col gap-2">
                          <h6 className="text-sm font-bold">
                            Opportunity Page
                          </h6>

                          <FormMessage messageType={FormMessageType.Info}>
                            This is how your opportunity will appear on the
                            opportunity page when navigating from the search
                            results.
                          </FormMessage>

                          <div className="mt-4 flex justify-center">
                            <OpportunityPublicDetails
                              opportunityInfo={opportunityInfo}
                              user={null}
                              error={error}
                              preview={true}
                            />
                          </div>
                        </div>
                      </div>
                    )}

                  <form
                    ref={formRef7}
                    className="mt-4 flex flex-col gap-4"
                    onSubmit={handleSubmitStep7((data) =>
                      onSubmitStep(8, data),
                    )}
                  >
                    {/* POST AS ACTIVE */}
                    <FormField
                      label="Visibility"
                      subLabel="Make this opportunity active to be visible to the public. Inactive opportunities are only visible to you and your team members."
                      showWarningIcon={
                        !!formStateStep7.errors.postAsActive?.message
                      }
                      showError={
                        !!formStateStep7.touchedFields.postAsActive ||
                        formStateStep7.isSubmitted
                      }
                      error={formStateStep7.errors.postAsActive?.message}
                    >
                      <FormCheckbox
                        id="postAsActive"
                        label="Make this opportunity active"
                        inputProps={{ ...registerStep7(`postAsActive`) }}
                      />

                      {/* <label
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
                        </label> */}

                      {/* {!!formStateStep7.errors.postAsActive?.message &&
                          (!!formStateStep7.touchedFields.postAsActive ||
                            formStateStep7.isSubmitted) && (
                            <FormError
                              label={formStateStep7.errors.postAsActive.message}
                            />
                          )} */}
                    </FormField>

                    {/* BUTTONS */}
                    <div className="flex items-center justify-center gap-4 md:justify-end">
                      <button
                        type="button"
                        className="btn btn-warning flex-grow md:w-1/3 md:flex-grow-0"
                        onClick={() => {
                          onStep(6);
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
                            formStateStep6.isValid
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

OpportunityAdminDetails.getLayout = function getLayout(page: ReactElement) {
  return <MainLayout>{page}</MainLayout>;
};

// 👇 return theme from component properties. this is set server-side (getServerSideProps)
OpportunityAdminDetails.theme = function getTheme(page: ReactElement) {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return page.props.theme;
};

export default OpportunityAdminDetails;
