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
import { Controller, Form, useForm, type FieldValues } from "react-hook-form";
import Select from "react-select";
import { toast } from "react-toastify";
import z from "zod";
import type { SelectOption } from "~/api/models/lookups";
import {
  searchCriteriaOpportunities,
  getOpportunityInfoByIdAdminOrgAdminOrUser,
} from "~/api/services/opportunities";
import MainLayout from "~/components/Layout/Main";
import { ApiErrors } from "~/components/Status/ApiErrors";
import { Loading } from "~/components/Status/Loading";
import { authOptions, type User } from "~/server/auth";
import { PageBackground } from "~/components/PageBackground";
import Link from "next/link";
import { IoMdArrowRoundBack, IoMdWarning } from "react-icons/io";
import CreatableSelect from "react-select/creatable";
import type { NextPageWithLayout } from "~/pages/_app";
import {
  DATE_FORMAT_HUMAN,
  DATE_FORMAT_SYSTEM,
  PAGE_SIZE_MEDIUM,
  GA_ACTION_OPPORTUNITY_LINK_CREATE,
  GA_CATEGORY_OPPORTUNITY_LINK,
  MAX_INT32,
  DELIMETER_PASTE_MULTI,
  THEME_BLUE,
} from "~/lib/constants";
import { Unauthorized } from "~/components/Status/Unauthorized";
import { config } from "~/lib/react-query-config";
import { trackGAEvent } from "~/lib/google-analytics";
import Moment from "react-moment";
import moment from "moment";
import { getThemeFromRole, debounce, getSafeUrl } from "~/lib/utils";
import Async from "react-select/async";
import { useRouter } from "next/router";
import ReactModal from "react-modal";
import Image from "next/image";
import iconBell from "public/images/icon-bell.webp";
import { IoMdClose } from "react-icons/io";
import {
  VerificationMethod,
  type OpportunityInfo,
  type OpportunitySearchResultsInfo,
} from "~/api/models/opportunity";
import axios from "axios";
import { InternalServerError } from "~/components/Status/InternalServerError";
import { Unauthenticated } from "~/components/Status/Unauthenticated";
import { useDisableBodyScroll } from "~/hooks/useDisableBodyScroll";
import { validateEmail } from "~/lib/validate";
import type { LinkRequestCreateVerify } from "~/api/models/actionLinks";
import { createLinkInstantVerify } from "~/api/services/actionLinks";
import SocialPreview from "~/components/Opportunity/SocialPreview";
import { useConfirmationModalContext } from "~/context/modalConfirmationContext";
import {
  OpportunityItem,
  StoreAccessControlRuleInfo,
  StoreAccessControlRuleRequestUpdate,
  StoreInfo,
  StoreItemCategorySearchResults,
  StoreSearchResults,
} from "~/api/models/marketplace";
import {
  createStoreAccessControlRule,
  getStoreAccessControlRuleById,
  listSearchCriteriaCountries,
  listSearchCriteriaOrganizations,
  listSearchCriteriaStores,
  searchStoreItemCategories,
  searchStores,
  updateStoreAccessControlRule,
} from "~/api/services/marketplace";
import FormField from "~/components/Common/FormField";
import FormInput from "~/components/Common/FormInput";
import { getGenders } from "~/api/services/lookups";
import AsyncSelect from "react-select/async";
import FormRadio from "~/components/Common/FormRadio";

interface IParams extends ParsedUrlQuery {
  ruleId: string;
  returnUrl?: string;
}

// ⚠️ SSR
export async function getServerSideProps(context: GetServerSidePropsContext) {
  const { ruleId } = context.params as IParams;
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
  //const theme = getThemeFromRole(session, id);

  try {
    // 👇 prefetch queries on server
    if (ruleId !== "create") {
      const data = await getStoreAccessControlRuleById(ruleId, context);
      await queryClient.prefetchQuery({
        queryKey: ["storeAccessControlRule", ruleId],
        queryFn: () => data,
      });
    }
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status) {
      if (error.response.status === 404) {
        return {
          notFound: true,
          //props: { theme: theme },
        };
      } else errorCode = error.response.status;
    } else errorCode = 500;
  }

  return {
    props: {
      dehydratedState: dehydrate(queryClient),
      user: session?.user ?? null,
      ruleId: ruleId ?? null,
      // theme: theme,
      error: errorCode,
    },
  };
}

// 👇 PAGE COMPONENT: Link Create/Edit
// this page acts as a create (/links/create) or edit page (/links/:id) based on the [entityId] route param
const StoreRuleDetails: NextPageWithLayout<{
  ruleId: string;
  user: User;
  // theme: string;
  error?: number;
}> = ({ ruleId, error }) => {
  const router = useRouter();
  const { returnUrl } = router.query;
  const queryClient = useQueryClient();

  const formRef1 = useRef<HTMLFormElement>(null);
  const formRef2 = useRef<HTMLFormElement>(null);
  const formRef3 = useRef<HTMLFormElement>(null);
  const formRef4 = useRef<HTMLFormElement>(null);

  const [saveChangesDialogVisible, setSaveChangesDialogVisible] =
    useState(false);
  const [lastStepBeforeSaveChangesDialog, setLastStepBeforeSaveChangesDialog] =
    useState<number | null>(null);
  const modalContext = useConfirmationModalContext();

  const opportunityOptions: SelectOption[] = [
    { value: "0", label: "All" },
    { value: "1", label: "Any" },
  ];

  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  //#region Queries

  // 👇 use prefetched query from server
  const { data: storeAccessControlRule } = useQuery<StoreAccessControlRuleInfo>(
    {
      queryKey: ["storeAccessControlRule", ruleId],
      queryFn: () => getStoreAccessControlRuleById(ruleId),
      enabled: ruleId !== "create" && !error,
    },
  );

  // Organisations
  const { data: dataOrganisations } = useQuery({
    queryKey: ["organisations"],
    queryFn: async () => listSearchCriteriaOrganizations(),
    enabled: !error,
  });
  const organisationOptions = useMemo<SelectOption[]>(
    () =>
      dataOrganisations?.map((c) => ({
        value: c.id,
        label: c.name,
      })) ?? [],
    [dataOrganisations],
  );

  // Countries
  const { data: dataCountries } = useQuery({
    queryKey: ["marketplace", "countries"],
    queryFn: async () => listSearchCriteriaCountries(),
    enabled: !error,
  });
  const countryOptions = useMemo<SelectOption[]>(
    () =>
      dataCountries?.map((c) => ({
        value: c.codeAlpha2,
        label: c.name,
      })) ?? [],
    [dataCountries],
  );

  // Genders
  const { data: dataGenders } = useQuery({
    queryKey: ["genders"],
    queryFn: async () => getGenders(),
    enabled: !error,
  });
  const genderOptions = useMemo<SelectOption[]>(
    () =>
      dataGenders
        ?.filter((c) => c.name.toLowerCase() !== "prefer not to say")
        .map((c) => ({
          value: c.id,
          label: c.name,
        })) ?? [],
    [dataGenders],
  );
  //# endregion

  const [formData, setFormData] = useState<StoreAccessControlRuleRequestUpdate>(
    {
      name: storeAccessControlRule?.name ?? "",
      description: storeAccessControlRule?.description ?? "",
      organizationId: storeAccessControlRule?.organizationId ?? "",
      storeId: storeAccessControlRule?.store.id ?? "",
      storeItemCategories:
        storeAccessControlRule?.storeItemCategories?.map((x) => x.id) ?? [],
      ageFrom: storeAccessControlRule?.ageMin ?? null,
      ageTo: storeAccessControlRule?.ageMax ?? null,
      genderId: storeAccessControlRule?.genderId ?? null,
      opportunities:
        storeAccessControlRule?.opportunities?.map((x) => x.id) ?? [],
      opportunityOption: storeAccessControlRule?.opportunityOption ?? null,
      countryCodeAlpha2: "", //storeAccessControlRule?.countryCodeAlpha2 ?? "",
      id: storeAccessControlRule?.id ?? ruleId ?? null,
    },
  );

  const schemaStep1 = z.object({
    name: z
      .string()
      .min(1, "Name is required.")
      .max(255, "Name cannot exceed 255 characters."),
    description: z
      .string()
      .max(500, "Description cannot exceed 500 characters.")
      .optional(),
    // entityType: z.string().min(1, "Type is required."),
    // entityId: z.string().min(1, "Entity is required."),
  });

  const schemaStep2 = z.object({
    organizationId: z.string().min(1, "Organization is required."),
    storeId: z.string().min(1, "Store is required."),
    storeItemCategories: z
      .array(z.string())
      .min(1, "At least one item must be selected"),

    // usagesLimit: z.union([z.nan(), z.null(), z.number()]).transform((val) => {
    //   // eslint-disable-next-line
    //   return val === null || Number.isNaN(val as any) ? null : val;
    // }),
    // dateEnd: z.union([z.string(), z.date(), z.null()]).optional(),
    // lockToDistributionList: z.boolean().optional(),
    // distributionList: z
    //   .union([z.array(z.string().email()), z.null()])
    //   .optional(),
  });
  // .refine(
  //   (data) => {
  //     // if not locked to the distribution list, you must specify either a usage limit or an end date.
  //     if (
  //       !data.lockToDistributionList &&
  //       data.usagesLimit == null &&
  //       data.dateEnd == null
  //     ) {
  //       return false;
  //     }

  //     return true;
  //   },
  //   {
  //     message:
  //       "If not limited to the distribution list, you must specify either a usage limit or an expiry date.",
  //     path: ["lockToDistributionList"],
  //   },
  // )
  // .refine(
  //   (data) => {
  //     // if lockToDistributionList is true, then distributionList is required
  //     return (
  //       !data.lockToDistributionList ||
  //       (data.distributionList?.length ?? 0) > 0
  //     );
  //   },
  //   {
  //     message: "Please enter at least one email address.",
  //     path: ["distributionList"],
  //   },
  // )
  // .refine(
  //   (data) => {
  //     // validate all items are valid email addresses
  //     return (
  //       data.distributionList == null ||
  //       data.distributionList?.every((email) => validateEmail(email))
  //     );
  //   },
  //   {
  //     message:
  //       "Please enter valid email addresses e.g. name@domain.com. One or more email address are wrong.",
  //     path: ["distributionList"],
  //   },
  // )
  // .refine(
  //   (data) => {
  //     // if lockToDistributionList is false and dateEnd is not null, then validate that the dateEnd is not in the past.
  //     if (!data.lockToDistributionList && data.dateEnd !== null) {
  //       const now = new Date();
  //       const dateEnd = data.dateEnd ? new Date(data.dateEnd) : undefined;
  //       return dateEnd ? dateEnd >= now : true;
  //     }
  //     return true;
  //   },
  //   {
  //     message: "The expiry date must be in the future.",
  //     path: ["dateEnd"],
  //   },
  // );

  const schemaStep3 = z.object({
    ageFrom: z.number().int().min(0).max(MAX_INT32).nullable().optional(),
    ageTo: z.number().int().min(0).max(MAX_INT32).nullable().optional(),
    genderId: z.string().nullable().optional(),
    opportunities: z.array(z.string()).optional(),
    opportunityOption: z.string().nullable().optional(),
    countryCodeAlpha2: z.string().nullable().optional(),
  });

  const schemaStep4 = z.object({});

  const {
    register: registerStep1,
    handleSubmit: handleSubmitStep1,
    formState: formStateStep1,
    control: controlStep1,
    reset: resetStep1,
    watch: watchStep1,
  } = useForm({
    resolver: zodResolver(schemaStep1),
    defaultValues: formData,
  });

  const {
    register: registerStep2,
    handleSubmit: handleSubmitStep2,
    formState: formStateStep2,
    control: controlStep2,
    reset: resetStep2,
    watch: watchStep2,
  } = useForm({
    resolver: zodResolver(schemaStep2),
    defaultValues: formData,
  });
  const watchOrganizationId = watchStep2("organizationId");
  const watchStoreId = watchStep2("storeId");

  const {
    handleSubmit: handleSubmitStep3,
    formState: formStateStep3,
    control: controlStep3,
    reset: resetStep3,
  } = useForm({
    resolver: zodResolver(schemaStep3),
    defaultValues: formData,
  });

  const {
    handleSubmit: handleSubmitStep4,
    formState: formStateStep4,

    reset: resetStep4,
  } = useForm({
    resolver: zodResolver(schemaStep4),
    defaultValues: formData,
  });

  // scroll to top on step change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [step]);

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

  //* SAVE CHANGE DIALOG
  const onClick_Menu = useCallback(
    (nextStep: number) => {
      let isDirtyStep = false;
      if (step === 1 && isDirtyStep1) isDirtyStep = true;
      else if (step === 2 && isDirtyStep2) isDirtyStep = true;
      else if (step === 3 && isDirtyStep3) isDirtyStep = true;
      else if (step === 4 && isDirtyStep3) isDirtyStep = true;

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
    setSaveChangesDialogVisible(false);
    lastStepBeforeSaveChangesDialog && setStep(lastStepBeforeSaveChangesDialog);
    setLastStepBeforeSaveChangesDialog(null);
  }, [
    formData,
    resetStep1,
    resetStep2,
    resetStep3,
    resetStep4,
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
    }
  }, [
    formRef1,
    formRef2,
    formRef3,
    formRef4,
    setSaveChangesDialogVisible,
    step,
  ]);

  const onSubmit = useCallback(
    async (data: StoreAccessControlRuleRequestUpdate) => {
      // confirm dialog
      const result = await modalContext.showConfirmation(
        "",
        <div
          key="confirm-dialog-content"
          className="flex h-full flex-col space-y-2"
        >
          <div className="flex flex-row items-center gap-2">
            <IoMdWarning className="h-6 w-6 text-warning" />
            <p className="text-lg">Submit</p>
          </div>

          <div className="text-xs leading-6 text-gray-dark md:text-sm">
            Are you sure you want to submit your link for approval?
            <br />
            An administrator must approve this link before it becomes active.
            <br />
            Please note that these details cannot be changed later.
          </div>
        </div>,
      );
      if (!result) return;

      setIsLoading(true);

      try {
        let message = "";

        // dismiss all toasts
        toast.dismiss();

        //  convert dates to string in format "YYYY-MM-DD"
        // data.dateEnd = data.dateEnd
        //   ? moment.utc(data.dateEnd).format(DATE_FORMAT_SYSTEM)
        //   : null;

        // // HACK: api want nulls and not empty arrays...
        // if (data.distributionList?.length == 0) data.distributionList = null;

        // //  clear distributionList if not locked
        // if (!data.lockToDistributionList) data.distributionList = null;
        // else {
        //   data.usagesLimit = null;
        //   data.dateEnd = null;
        // }

        // update api
        if (ruleId == "create") {
          await createStoreAccessControlRule(data);
        } else {
          await updateStoreAccessControlRule(data);
        }
        // invalidate cache
        // this will match all queries with the following prefixes ['Links', id] (list data) & ['Links_TotalCount', id] (tab counts)
        // await queryClient.invalidateQueries({
        //   queryKey: ["Links", id],
        //   exact: false,
        // });
        // await queryClient.invalidateQueries({
        //   queryKey: ["Links_TotalCount", id],
        //   exact: false,
        // });
        //TODO: check if this is correct
        await queryClient.invalidateQueries({
          queryKey: ["Admin", "StoreAccessControlRule"],
          exact: false,
        });

        message = "Rule created";
        toast(message, {
          type: "success",
          toastId: "rule",
        });
        console.log(message); // e2e
      } catch (error) {
        toast(<ApiErrors error={error as AxiosError} />, {
          type: "error",
          toastId: "link",
          autoClose: false,
          icon: false,
        });

        captureException(error);
        setIsLoading(false);

        return;
      }

      setIsLoading(false);

      // redirect to list after create
      //void router.push(`/organisations/${id}/links`);
    },
    [setIsLoading, /* id,*/ queryClient, /* router,*/ modalContext],
  );

  // form submission handler
  const onSubmitStep = useCallback(
    async (step: number, data: FieldValues) => {
      // set form data
      const model = {
        ...formData,
        ...(data as StoreAccessControlRuleRequestUpdate),
      };

      setFormData(model);

      // submit on last page when creating new opportunity
      if (step === 4) {
        await onSubmit(model);

        // 📊 GOOGLE ANALYTICS: track event
        trackGAEvent(
          GA_CATEGORY_OPPORTUNITY_LINK,
          GA_ACTION_OPPORTUNITY_LINK_CREATE,
          `Created Link: ${model.name}`,
        );
      }
      // move to next step
      else setStep(step);

      resetStep1(model);
      resetStep2(model);
      resetStep3(model);
      resetStep4(model);

      // go to last step before save changes dialog
      if (lastStepBeforeSaveChangesDialog)
        setStep(lastStepBeforeSaveChangesDialog);

      setLastStepBeforeSaveChangesDialog(null);
    },
    [
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
    ],
  );

  // 👇 prevent scrolling on the page when the dialogs are open
  useDisableBodyScroll(saveChangesDialogVisible);

  //  look up the opportunity when watchEntityId changes (for link preview)
  // const [selectedOpportuntity, setSelectedOpportuntity] =
  //   useState<OpportunityInfo | null>(null);

  // useEffect(() => {
  //   if (!watchEntityId) return;

  //   if (watchEntityType == "0") {
  //     // get opportunity
  //     getOpportunityInfoByIdAdminOrgAdminOrUser(watchEntityId).then((res) => {
  //       // set state
  //       setSelectedOpportuntity(res);
  //     });
  //   }
  // }, [watchEntityId, watchEntityType, setSelectedOpportuntity]);

  // load data asynchronously for the opportunities dropdown (debounced)
  // const loadOpportunities = debounce(
  //   (inputValue: string, callback: (options: any) => void) => {
  //     if (inputValue.length < 3) inputValue = "";

  //     const cacheKey = [
  //       "opportunities",
  //       {
  //         organization: null, // id,
  //         titleContains: inputValue,
  //         published: true,
  //         verificationMethod: VerificationMethod.Manual,
  //       },
  //     ];

  //     // try to get data from cache
  //     const cachedData =
  //       queryClient.getQueryData<OpportunitySearchResultsInfo>(cacheKey);

  //     if (cachedData) {
  //       const options = cachedData.items.map((item) => ({
  //         value: item.id,
  //         label: item.title,
  //       }));
  //       callback(options);
  //     } else {
  //       // if not in cache, fetch data
  //       searchCriteriaOpportunities({
  //         opportunities: [],
  //         organization: null, //id,
  //         titleContains: inputValue,
  //         published: true,
  //         verificationMethod: VerificationMethod.Manual,
  //         pageNumber: 1,
  //         pageSize: PAGE_SIZE_MEDIUM,
  //       }).then((data) => {
  //         const options = data.items.map((item) => ({
  //           value: item.id,
  //           label: item.title,
  //         }));
  //         callback(options);

  //         // save data to cache
  //         queryClient.setQueryData(cacheKey, data);
  //       });
  //     }
  //   },
  //   1000,
  // );

  // //  look up the store when watchEntityId changes (for link preview)
  //   const [selectedStore, setSelectedStore] =
  //   useState<StoreInfo | null>(null);

  // useEffect(() => {
  //   if (!watchStoreId )return;

  //   if (watchStoreId == "0") {
  //     // get store
  //     getOpportunityInfoByIdAdminOrgAdminOrUser(watchStoreId).then((res) => {
  //       // set state
  //       setSelectedStore(res);
  //     });
  //   }
  // }, [watchStoreId,  setSelectedStore]);

  // // load data asynchronously for the stores dropdown (debounced)
  // const loadStores = useCallback(
  //   debounce((inputValue: string, callback: (options: any) => void) => {
  //     if (inputValue.length < 3) inputValue = "";

  //     const cacheKey = ["stores", watchOrganizationId];

  //     // try to get data from cache
  //     const cachedData = queryClient.getQueryData<StoreInfo[]>(cacheKey);

  //     if (cachedData) {
  //       const options = cachedData.map((item) => ({
  //         value: item.id,
  //         label: item.name,
  //       }));
  //       callback(options);
  //     } else {
  //       // if not in cache, fetch data
  //       listSearchCriteriaStores(watchOrganizationId).then((data) => {
  //         const options = data.map((item) => ({
  //           value: item.id,
  //           label: item.name,
  //         }));
  //         callback(options);

  //         // save data to cache
  //         queryClient.setQueryData(cacheKey, data);
  //       });
  //     }
  //   }, 1000),
  //   [watchOrganizationId, queryClient],
  // );

  // // load data asynchronously for the store item categories dropdown (debounced)
  // const loadStoreItemCategories = useCallback(
  //   debounce((inputValue: string, callback: (options: any) => void) => {
  //     if (inputValue.length < 3) inputValue = "";

  //     const cacheKey = ["storesItemCategories", watchStoreId];

  //     // try to get data from cache
  //     const cachedData =
  //       queryClient.getQueryData<StoreItemCategorySearchResults>(cacheKey);

  //     if (cachedData) {
  //       const options = cachedData.items.map((item) => ({
  //         value: item.id,
  //         label: item.name,
  //       }));
  //       callback(options);
  //     } else {
  //       // if not in cache, fetch data
  //       searchStoreItemCategories({
  //         storeId: watchStoreId,
  //         pageNumber: 1,
  //         pageSize: MAX_INT32,
  //       }).then((data) => {
  //         const options = data.items.map((item) => ({
  //           value: item.id,
  //           label: item.name,
  //         }));
  //         callback(options);

  //         // save data to cache
  //         queryClient.setQueryData(cacheKey, data);
  //       });
  //     }
  //   }, 1000),
  //   [watchStoreId, queryClient],
  // );

  // load stores (based on watchOrganizationId)
  const [dataStores, setDataStores] = useState<SelectOption[]>([]);
  useEffect(() => {
    if (!watchOrganizationId) return;

    // load stores
    listSearchCriteriaStores(watchOrganizationId).then((data) => {
      const options = data.map((store) => ({
        value: store.id,
        label: store.name,
      }));
      setDataStores(options);
    });
  }, [watchOrganizationId, setDataStores]);

  // load store item categories (based on watchStoreId)
  const [dataStoreItemCategories, setDataStoreItemCategories] = useState<
    SelectOption[]
  >([]);
  useEffect(() => {
    if (!watchStoreId) return;

    // load store item categories
    searchStoreItemCategories({
      storeId: watchStoreId,
      pageNumber: 1,
      pageSize: MAX_INT32,
    }).then((data) => {
      const options = data.items.map((category) => ({
        value: category.id,
        label: category.name,
      }));
      setDataStoreItemCategories(options);
    });
  }, [watchStoreId, setDataStoreItemCategories]);

  //#region opportunities

  const [cacheOpportunities, setCacheOpportunities] = useState<
    OpportunityItem[]
  >([]);
  useEffect(() => {
    // popuplate the cache with the opportunities from the model
    if (storeAccessControlRule?.opportunities) {
      setCacheOpportunities((prev) => [
        ...prev,
        ...(storeAccessControlRule.opportunities ?? []),
      ]);
    }
  }, [storeAccessControlRule?.opportunities, setCacheOpportunities]);

  // load data asynchronously for the opportunities dropdown
  // debounce is used to prevent the API from being called too frequently
  const loadOpportunities = useCallback(
    debounce((inputValue: string, callback: (options: any) => void) => {
      searchCriteriaOpportunities({
        opportunities: [],
        organization: watchOrganizationId ?? null,
        titleContains: (inputValue ?? []).length > 2 ? inputValue : null,
        published: null,
        verificationMethod: null,
        pageNumber: 1,
        pageSize: PAGE_SIZE_MEDIUM,
      }).then((data) => {
        const options = data.items.map((item) => ({
          value: item.id,
          label: item.title,
        }));
        callback(options);
        // add to cache
        data.items.forEach((item) => {
          if (!cacheOpportunities.some((x) => x.id === item.id)) {
            setCacheOpportunities((prev) => [...prev, item]);
          }
        });
      });
    }, 1000),
    [watchOrganizationId],
  );

  // the AsyncSelect component requires the defaultOptions to be set in the state
  // const [defaultOpportunityOptions, setDefaultOpportunityOptions] =
  //   useState<any>([]);

  // useEffect(() => {
  //   if (formData?.opportunities) {
  //     setDefaultOpportunityOptions(
  //       formData?.opportunities?.map((c: any) => ({
  //         value: c,
  //         label: c,
  //       })),
  //     );
  //   }
  // }, [setDefaultOpportunityOptions, formData?.opportunities]);
  // #endregion opportunities

  if (error) {
    if (error === 401) return <Unauthenticated />;
    else if (error === 403) return <Unauthorized />;
    else return <InternalServerError />;
  }

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

      {/* PAGE */}
      <div className="container z-10 mt-20 max-w-7xl overflow-hidden px-2 py-4">
        {/* BREADCRUMB */}
        <div className="flex flex-row items-center text-xs text-white">
          <div
            className="flex items-center justify-center font-bold hover:text-gray"
            // href={getSafeUrl(
            //   returnUrl?.toString(),
            //   `/organisations/${id}/links`,
            // )}
          >
            <IoMdArrowRoundBack className="bg-theme mr-2 inline-block h-4 w-4" />
            Store Rules
          </div>
          <div className="mx-2 font-bold">|</div>
          Create
        </div>

        <h3 className="mb-6 mt-2 font-bold text-white">New rule</h3>

        <div className="flex flex-col gap-4 md:flex-row">
          {/* LEFT VERTICAL MENU */}
          <ul className="menu hidden h-max w-60 flex-none gap-3 rounded-lg bg-white p-4 font-semibold shadow-custom md:flex md:justify-center">
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
                General
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
                Store
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
                    formStateStep2.isValid ? "bg-green" : "bg-gray-dark"
                  }`}
                >
                  3
                </span>
                Conditions
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
                  className={`mr-2 rounded-full bg-gray-dark px-1.5 py-0.5 text-xs font-medium text-white ${
                    formStateStep1.isValid &&
                    formStateStep2.isValid &&
                    formStateStep3.isValid
                      ? "bg-green"
                      : "bg-gray-dark"
                  }`}
                >
                  4
                </span>
                Preview
              </a>
            </li>
          </ul>

          {/* DROPDOWN MENU */}
          <select
            className="select select-md focus:border-none focus:outline-none md:hidden"
            onChange={(e) => {
              switch (e.target.value) {
                case "General":
                  onClick_Menu(1);
                  break;
                case "Store":
                  onClick_Menu(2);
                  break;
                case "Conditions":
                  onClick_Menu(3);
                  break;
                case "Preview":
                  onClick_Menu(4);
                  break;

                default:
                  onClick_Menu(1);
                  break;
              }
            }}
          >
            <option>General</option>
            <option>Store</option>
            <option>Conditions</option>
            <option>Preview</option>
          </select>

          {/* FORMS */}
          <div className="flex w-full flex-grow flex-col items-center overflow-hidden rounded-lg bg-white shadow-custom">
            <div className="flex w-full flex-col px-2 py-4 md:p-8">
              {step === 1 && (
                <>
                  <div className="mb-4 flex flex-col">
                    <h5 className="font-bold tracking-wider">General</h5>
                    <p className="my-2 text-sm">
                      Create a new rule for your store.
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
                      <label className="flex flex-col">
                        <div className="label-text font-bold">Name</div>
                        <div className="label-text-alt my-2">
                          This name will be visible to you, and in the link
                          preview.
                        </div>
                      </label>
                      <input
                        type="text"
                        className="input input-bordered rounded-md border-gray focus:border-gray focus:outline-none"
                        placeholder="Name"
                        {...registerStep1("name")}
                        contentEditable
                      />
                      {formStateStep1.errors.name && (
                        <label className="label -mb-5">
                          <span className="label-text-alt italic text-red-500">
                            {`${formStateStep1.errors.name.message}`}
                          </span>
                        </label>
                      )}
                    </div>

                    <div className="form-control">
                      <label className="flex flex-col">
                        <div className="label-text font-bold">Description</div>
                        <div className="label-text-alt my-2">
                          This description will be visible to you, and in the
                          link preview.
                        </div>
                      </label>
                      <textarea
                        className="input textarea textarea-bordered h-32 rounded-md border-gray text-[1rem] leading-tight focus:border-gray focus:outline-none"
                        placeholder="Description"
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
                      {/* <Link
                        className="btn btn-warning flex-grow md:w-1/3 md:flex-grow-0"
                        href={getSafeUrl(
                          returnUrl?.toString(),
                          `/organisations/${id}/links`,
                        )}
                      >
                        Cancel
                      </Link> */}

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
                  <div className="mb-4 flex flex-col">
                    <h5 className="font-bold tracking-wider">Store</h5>
                    <p className="my-2 text-sm">
                      Select the store you want to create a rule for.
                    </p>
                  </div>
                  <form
                    ref={formRef2}
                    className="flex flex-col gap-4"
                    onSubmit={handleSubmitStep2((data) =>
                      onSubmitStep(3, data),
                    )}
                  >
                    <FormField
                      label="Organisation"
                      subLabel="Select the organisation that owns the store."
                      showWarningIcon={
                        !!formStateStep2.errors.organizationId?.message
                      }
                      showError={
                        !!formStateStep2.touchedFields.organizationId ||
                        formStateStep2.isSubmitted
                      }
                      error={formStateStep2.errors.organizationId?.message}
                    >
                      <Controller
                        control={controlStep2}
                        name="organizationId"
                        render={({ field: { onChange, value } }) => (
                          <Select
                            instanceId="organizationId"
                            classNames={{
                              control: () => "input !border-gray",
                            }}
                            options={organisationOptions}
                            onChange={(val) => onChange(val?.value)}
                            value={organisationOptions?.find(
                              (c) => c.value === value,
                            )}
                            styles={{
                              placeholder: (base) => ({
                                ...base,
                                color: "#A3A6AF",
                              }),
                            }}
                            inputId="input_organisation" // e2e
                          />
                        )}
                      />
                    </FormField>
                    {watchOrganizationId && (
                      <FormField
                        label="Store"
                        subLabel="Select the store."
                        showWarningIcon={
                          !!formStateStep2.errors.storeId?.message
                        }
                        showError={
                          !!formStateStep2.touchedFields.storeId ||
                          formStateStep2.isSubmitted
                        }
                        error={formStateStep2.errors.storeId?.message}
                      >
                        <Controller
                          control={controlStep2}
                          name="storeId"
                          render={({ field: { onChange, value } }) => (
                            <Select
                              instanceId="storeId"
                              classNames={{
                                control: () => "input !border-gray",
                              }}
                              isMulti={false}
                              options={dataStores}
                              onChange={(val) => {
                                onChange(val?.value);
                              }}
                              value={dataStores?.find((c) => c.value === value)}
                              placeholder="Store"
                              styles={{
                                placeholder: (base) => ({
                                  ...base,
                                  color: "#A3A6AF",
                                }),
                              }}
                              inputId="input_store" // e2e
                            />
                            // <Select
                            //   instanceId="storeId"
                            //   classNames={{
                            //     control: () => "input !border-gray",
                            //   }}
                            //   options={organisationOptions}
                            //   onChange={(val) => onChange(val?.value)}
                            //   value={organisationOptions?.find(
                            //     (c) => c.value === value,
                            //   )}
                            //   styles={{
                            //     placeholder: (base) => ({
                            //       ...base,
                            //       color: "#A3A6AF",
                            //     }),
                            //   }}
                            //   inputId="input_store" // e2e
                            // />
                          )}
                        />
                      </FormField>
                    )}

                    {watchStoreId && (
                      <FormField
                        label="Store Categories"
                        subLabel="Select the store categories."
                        showWarningIcon={
                          !!formStateStep2.errors.storeItemCategories?.message
                        }
                        showError={
                          !!formStateStep2.touchedFields.storeItemCategories ||
                          formStateStep2.isSubmitted
                        }
                        error={
                          formStateStep2.errors.storeItemCategories?.message
                        }
                      >
                        <Controller
                          control={controlStep2}
                          name="storeItemCategories"
                          render={({ field: { onChange, value } }) => (
                            <Select
                              instanceId="storeItemCategories"
                              classNames={{
                                control: () => "input !border-gray",
                              }}
                              isMulti={true}
                              options={dataStoreItemCategories}
                              onChange={(val) => {
                                onChange(val.map((c) => c.value));
                              }}
                              value={dataStoreItemCategories?.filter(
                                (c) => value?.includes(c.value),
                              )}
                              placeholder="Store Item Categories"
                              styles={{
                                placeholder: (base) => ({
                                  ...base,
                                  color: "#A3A6AF",
                                }),
                              }}
                              inputId="input_storeItemCategories" // e2e
                            />
                            // <Select
                            //   instanceId="storeItemCategories"
                            //   classNames={{
                            //     control: () => "input !border-gray",
                            //   }}
                            //   options={organisationOptions}
                            //   onChange={(val) => onChange(val?.value)}
                            //   value={organisationOptions?.find(
                            //     (c) => c.value === value,
                            //   )}
                            //   styles={{
                            //     placeholder: (base) => ({
                            //       ...base,
                            //       color: "#A3A6AF",
                            //     }),
                            //   }}
                            //   inputId="input_store" // e2e
                            // />
                          )}
                        />
                      </FormField>
                    )}
                    {/* BUTTONS */}
                    <div className="my-4 flex items-center justify-center gap-2 md:justify-end md:gap-4">
                      <button
                        type="button"
                        className="btn btn-warning flex-grow md:w-1/3 md:flex-grow-0"
                        onClick={() => {
                          onClick_Menu(1);
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
                  <div className="mb-4 flex flex-col">
                    <h5 className="font-bold">Conditions</h5>
                    <p className="my-2 text-sm">
                      Target audiences with specific conditions.
                    </p>
                  </div>

                  <form
                    ref={formRef3}
                    className="flex flex-col gap-4"
                    onSubmit={handleSubmitStep3((data) =>
                      onSubmitStep(4, data),
                    )}
                  >
                    {/* AGES */}
                    <FormField
                      label="Ages"
                      subLabel="Select the age range."
                      showWarningIcon={
                        !!formStateStep3.errors.ageFrom?.message ||
                        !!formStateStep3.errors.ageTo?.message
                      }
                    >
                      <div className="flex flex-col gap-2">
                        <div className="grid gap-4 md:grid-cols-2">
                          <FormField
                            showError={
                              !!formStateStep3.touchedFields.ageFrom ||
                              formStateStep3.isSubmitted
                            }
                            error={formStateStep3.errors.ageFrom?.message}
                          >
                            <Controller
                              control={controlStep3}
                              name="ageFrom"
                              render={() => (
                                <FormInput
                                  inputProps={{
                                    type: "number",
                                    placeholder: "Age from...",
                                    step: 1,
                                    ...registerStep2("ageFrom", {
                                      valueAsNumber: true,
                                    }),
                                  }}
                                />
                              )}
                            />
                          </FormField>

                          <FormField
                            showError={
                              !!formStateStep3.touchedFields.ageTo ||
                              formStateStep3.isSubmitted
                            }
                            error={formStateStep3.errors.ageTo?.message}
                          >
                            <Controller
                              control={controlStep3}
                              name="ageTo"
                              render={() => (
                                <FormInput
                                  inputProps={{
                                    type: "number",
                                    placeholder: "Age to...",
                                    step: 1,
                                    ...registerStep2("ageTo", {
                                      valueAsNumber: true,
                                    }),
                                  }}
                                />
                              )}
                            />
                          </FormField>
                        </div>
                      </div>
                    </FormField>

                    {/* GENDER */}
                    <FormField
                      label="Gender"
                      subLabel="Select the gender."
                      showError={
                        !!formStateStep3.touchedFields.genderId ||
                        formStateStep3.isSubmitted
                      }
                      error={formStateStep3.errors.genderId?.message}
                    >
                      <Controller
                        control={controlStep3}
                        name="genderId"
                        render={({ field: { onChange, value } }) => (
                          <Select
                            instanceId="genderId"
                            classNames={{
                              control: () => "input !border-gray",
                            }}
                            isMulti={false}
                            options={genderOptions}
                            onChange={(val) => {
                              onChange(val?.value);
                            }}
                            value={genderOptions?.filter(
                              (c) => value === c.value,
                            )}
                            placeholder="Genders"
                            styles={{
                              placeholder: (base) => ({
                                ...base,
                                color: "#A3A6AF",
                              }),
                            }}
                            inputId="input_genderId" // e2e
                          />
                        )}
                      />
                    </FormField>

                    {/* OPPORTUNITIES */}
                    <FormField
                      label="Opportunities"
                      subLabel="Select the opportunities."
                      showError={
                        !!formStateStep3.touchedFields.opportunities ||
                        formStateStep3.isSubmitted
                      }
                      error={formStateStep3.errors.opportunities?.message}
                    >
                      <Controller
                        control={controlStep3}
                        name="opportunities"
                        render={({ field: { onChange, value } }) => (
                          <Async
                            instanceId="opportunities"
                            classNames={{
                              control: () => "input !border-gray",
                            }}
                            isMulti={true}
                            defaultOptions={true} // calls loadSkills for initial results when clicking on the dropdown
                            cacheOptions
                            loadOptions={loadOpportunities}
                            onChange={(val) => {
                              onChange(val.map((c) => c.value));
                            }}
                            // for each value, look up the value and label from the cache
                            value={value?.map((x: any) => ({
                              value: x,
                              label: cacheOpportunities.find((c) => c.id === x)
                                ?.title,
                            }))}
                            placeholder="Select opportunities..."
                            inputId="input_opportunities" // e2e
                            // fix menu z-index issue
                            // menuPortalTarget={htmlRef.current}
                            styles={{
                              menuPortal: (base) => ({
                                ...base,
                                zIndex: 9999,
                              }),
                            }}
                          />
                        )}
                      />
                    </FormField>

                    {/* OPPORTUNITY OPTION (radio button All/Any)  */}
                    <FormField
                      label="Opportunity Option"
                      subLabel="Select the opportunity option."
                      showError={
                        !!formStateStep3.touchedFields.opportunityOption ||
                        formStateStep3.isSubmitted
                      }
                      error={formStateStep3.errors.opportunityOption?.message}
                    >
                      <Controller
                        control={controlStep3}
                        name="opportunityOption"
                        render={({ field: { onChange, value } }) => (
                          <Select
                            instanceId="opportunityOption"
                            classNames={{
                              control: () => "input !border-gray",
                            }}
                            isMulti={false}
                            options={opportunityOptions}
                            onChange={(val) => {
                              onChange(val?.value);
                            }}
                            value={opportunityOptions?.filter(
                              (c) => value === c.value,
                            )}
                            placeholder="Select option..."
                            styles={{
                              placeholder: (base) => ({
                                ...base,
                                color: "#A3A6AF",
                              }),
                            }}
                            inputId="input_opportunityOption" // e2e
                            isClearable={true}
                          />
                        )}
                      />
                    </FormField>

                    {/* COUNTRY */}
                    <FormField
                      label="Country"
                      subLabel="Select the country."
                      showError={
                        !!formStateStep3.touchedFields.countryCodeAlpha2 ||
                        formStateStep3.isSubmitted
                      }
                      error={formStateStep3.errors.countryCodeAlpha2?.message}
                    >
                      <Controller
                        control={controlStep3}
                        name="countryCodeAlpha2"
                        render={({ field: { onChange, value } }) => (
                          <Select
                            instanceId="countryCodeAlpha2"
                            classNames={{
                              control: () => "input !border-gray",
                            }}
                            isMulti={false}
                            options={countryOptions}
                            onChange={(val) => {
                              onChange(val?.value);
                            }}
                            value={countryOptions?.filter(
                              (c) => value === c.value,
                            )}
                            placeholder="Country"
                            styles={{
                              placeholder: (base) => ({
                                ...base,
                                color: "#A3A6AF",
                              }),
                            }}
                            inputId="input_countryId" // e2e
                          />
                        )}
                      />
                    </FormField>

                    {/* TYPE */}
                    {/* <div className="form-control">
                      <label className="label">
                        <span className="label-text font-semibold">Type</span>
                      </label>

                      <label className="label label-text pt-0 text-sm ">
                        {
                          linkEntityTypes?.find(
                            (x) => x.value == formData.entityType,
                          )?.label
                        }
                      </label>
                      {formStateStep1.errors.entityType && (
                        <label className="label">
                          <span className="label-text-alt italic text-red-500">
                            {`${formStateStep1.errors.entityType.message}`}
                          </span>
                        </label>
                      )}
                    </div> */}

                    {/* LINK PREVIEW */}
                    {/* <div className="form-control">
                      <label className="flex flex-col">
                        <div className="label-text font-semibold">
                          Social Preview
                        </div>
                        <div className="label-text-alt my-2">
                          This is how your link will look on social media:
                        </div>
                      </label>
                      {formData.entityType == "0" && (
                        <SocialPreview
                          name={formData?.name}
                          description={formData?.description}
                          logoURL={selectedOpportuntity?.organizationLogoURL}
                          organizationName={
                            selectedOpportuntity?.organizationName
                          }
                        />
                      )}
                      {formStateStep1.errors.entityId && (
                        <label className="label">
                          <span className="label-text-alt italic text-red-500">
                            {`${formStateStep1.errors.entityId.message}`}
                          </span>
                        </label>
                      )}
                    </div> */}

                    {/* BUTTONS */}
                    <div className="my-4 flex items-center justify-center gap-4 md:justify-end">
                      <button
                        type="button"
                        className="btn btn-warning flex-grow md:w-1/3 md:flex-grow-0"
                        onClick={() => {
                          onClick_Menu(2);
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
                  <div className="mb-4 flex flex-col">
                    <h5 className="font-bold">Preview</h5>
                    <p className="my-2 text-sm">
                      Review your link before publishing it.
                    </p>
                  </div>

                  <form
                    ref={formRef3}
                    className="flex flex-col gap-4"
                    onSubmit={handleSubmitStep4((data) =>
                      onSubmitStep(5, data),
                    )}
                  >
                    {/* TYPE */}
                    {/* <div className="form-control">
                      <label className="label">
                        <span className="label-text font-semibold">Type</span>
                      </label>

                      <label className="label label-text pt-0 text-sm ">
                        {
                          linkEntityTypes?.find(
                            (x) => x.value == formData.entityType,
                          )?.label
                        }
                      </label>
                      {formStateStep1.errors.entityType && (
                        <label className="label">
                          <span className="label-text-alt italic text-red-500">
                            {`${formStateStep1.errors.entityType.message}`}
                          </span>
                        </label>
                      )}
                    </div> */}

                    {/* LINK PREVIEW */}
                    {/* <div className="form-control">
                      <label className="flex flex-col">
                        <div className="label-text font-semibold">
                          Social Preview
                        </div>
                        <div className="label-text-alt my-2">
                          This is how your link will look on social media:
                        </div>
                      </label>
                      {formData.entityType == "0" && (
                        <SocialPreview
                          name={formData?.name}
                          description={formData?.description}
                          logoURL={selectedOpportuntity?.organizationLogoURL}
                          organizationName={
                            selectedOpportuntity?.organizationName
                          }
                        />
                      )}
                      {formStateStep1.errors.entityId && (
                        <label className="label">
                          <span className="label-text-alt italic text-red-500">
                            {`${formStateStep1.errors.entityId.message}`}
                          </span>
                        </label>
                      )}
                    </div> */}

                    {/* BUTTONS */}
                    <div className="my-4 flex items-center justify-center gap-4 md:justify-end">
                      <button
                        type="button"
                        className="btn btn-warning flex-grow md:w-1/3 md:flex-grow-0"
                        onClick={() => {
                          onClick_Menu(3);
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
                            formStateStep4.isValid
                          )
                        }
                      >
                        Publish
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

StoreRuleDetails.getLayout = function getLayout(page: ReactElement) {
  return <MainLayout>{page}</MainLayout>;
};

StoreRuleDetails.theme = function getTheme(page: ReactElement) {
  return THEME_BLUE;
};

export default StoreRuleDetails;
