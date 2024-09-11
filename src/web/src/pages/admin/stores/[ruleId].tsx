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
  GA_CATEGORY_STORE_ACCESS_CONTROL_RULE,
  MAX_INT32,
  DELIMETER_PASTE_MULTI,
  THEME_BLUE,
  GA_ACTION_STORE_ACCESS_CONTROL_RULE_CREATE,
  GA_ACTION_STORE_ACCESS_CONTROL_RULE_UPDATE,
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
import FormMessage, { FormMessageType } from "~/components/Common/FormMessage";
import { getOrganisations } from "~/api/services/organisations";

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
  const htmlRef = useRef<HTMLDivElement>(null);

  // const opportunityOptions: SelectOption[] = [
  //   { value: "0", label: "All" },
  //   { value: "1", label: "Any" },
  // ];

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
    queryFn: async () =>
      getOrganisations({
        pageNumber: 1,
        pageSize: MAX_INT32,
        statuses: ["Active"],
        valueContains: "",
      }),
    enabled: !error,
  });
  const organisationOptions = useMemo<SelectOption[]>(
    () =>
      dataOrganisations?.items?.map((c) => ({
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
      storeCountryCodeAlpha2: "", //storeAccessControlRule?.storeCountryCodeAlpha2 ?? "",
      id: storeAccessControlRule?.id ?? "",
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
  });

  const schemaStep2 = z.object({
    organizationId: z.string().min(1, "Organization is required."),
    storeCountryCodeAlpha2: z.string().nullable().optional(),
    storeId: z.string().min(1, "Store is required."),
    storeItemCategories: z.array(z.string()).optional(),
  });

  const schemaStep3 = z
    .object({
      ageFrom: z.union([z.nan(), z.null(), z.number()]),
      ageTo: z.union([z.nan(), z.null(), z.number()]),
      genderId: z.string().nullable().optional(),
      opportunities: z.array(z.string()).optional(),
      opportunityOption: z.string().nullable().optional(),
    })
    .superRefine((data, ctx) => {
      // if (!data.ageFrom && data.ageTo) {
      //   ctx.addIssue({
      //     code: z.ZodIssueCode.custom,
      //     message: "Both From and To must be specified together",
      //     path: ["ageFrom"],
      //     fatal: true,
      //   });
      // }
      // if (!data.ageTo && data.ageFrom) {
      //   ctx.addIssue({
      //     code: z.ZodIssueCode.custom,
      //     message: "Both From and To must be specified together",
      //     path: ["ageTo"],
      //     fatal: true,
      //   });
      // }

      // either ageFrom or ageTo or Gender or Opportunities (length > 0) must be specified
      if (
        !data.ageFrom &&
        !data.ageTo &&
        !data.genderId &&
        !data.opportunities?.length
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            "Select at least one of the following: Age, Gender or Opportunities",
          fatal: true,
          path: ["opportunityOption"],
        });
      }

      if (!!data.opportunities?.length && !data.opportunityOption) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            "Opportunity option is required when opportunities are specified",
          path: ["opportunityOption"],
          fatal: true,
        });
      }
    });

  const schemaStep4 = z.object({});

  const {
    register: registerStep1,
    handleSubmit: handleSubmitStep1,
    formState: formStateStep1,
    reset: resetStep1,
  } = useForm({
    resolver: zodResolver(schemaStep1),
    defaultValues: formData,
  });

  const {
    handleSubmit: handleSubmitStep2,
    formState: formStateStep2,
    control: controlStep2,
    reset: resetStep2,
    watch: watchStep2,
    setValue: setValueStep2,
  } = useForm({
    resolver: zodResolver(schemaStep2),
    defaultValues: formData,
  });
  const watchOrganizationId = watchStep2("organizationId");
  const watchCountry = watchStep2("storeCountryCodeAlpha2");
  const watchStoreId = watchStep2("storeId");

  const {
    register: registerStep3,
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
            Are you sure you want to submit your rule?
            <br />
            These details can be changed later.
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
      if (ruleId == "create") {
        void router.push(`/admin/stores`);
      }
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
      if (step === 5) {
        await onSubmit(model);

        // 📊 GOOGLE ANALYTICS: track event
        trackGAEvent(
          GA_CATEGORY_STORE_ACCESS_CONTROL_RULE,
          ruleId == "create"
            ? GA_ACTION_STORE_ACCESS_CONTROL_RULE_CREATE
            : GA_ACTION_STORE_ACCESS_CONTROL_RULE_UPDATE,
          `${
            ruleId === "create" ? "Created" : "Updated"
          } Store Access Control Rule: ${model.name}`,
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

  // load stores (based on watchOrganizationId)
  const [dataStores, setDataStores] = useState<SelectOption[]>([]);
  useEffect(() => {
    if (!watchCountry) return;

    // load stores
    searchStores({
      categoryId: null,
      countryCodeAlpha2: watchCountry,
      pageNumber: 1,
      pageSize: MAX_INT32,
    }).then((data) => {
      const options = data.items.map((store) => ({
        value: store.id,
        label: store.name,
      }));
      setDataStores(options);
    });
  }, [watchCountry, setDataStores]);

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

  const [dataOpportunities, setDataOpportunities] = useState<OpportunityItem[]>(
    [],
  );
  useEffect(() => {
    // popuplate the cache with the opportunities from the model
    if (storeAccessControlRule?.opportunities) {
      setDataOpportunities((prev) => [
        ...prev,
        ...(storeAccessControlRule.opportunities ?? []),
      ]);
    }
  }, [storeAccessControlRule?.opportunities, setDataOpportunities]);

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
          if (!dataOpportunities.some((x) => x.id === item.id)) {
            setDataOpportunities((prev) => [...prev, item]);
          }
        });
      });
    }, 1000),
    [watchOrganizationId],
  );

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

        {/* REFERENCE FOR FILTER POPUP: fix menu z-index issue */}
        <div ref={htmlRef} />

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
                      Store Access Control Rules are conditions to control the
                      visibility of a ZLTO store and its item categories to
                      users. This system allows precise targeting based on user
                      demographics and achievements.
                    </p>
                  </div>

                  <form
                    ref={formRef1}
                    className="flex flex-col gap-4"
                    onSubmit={handleSubmitStep1((data) =>
                      onSubmitStep(2, data),
                    )}
                  >
                    <div className="form-control">
                      <label className="flex flex-col">
                        <div className="label-text font-bold">Name</div>
                        <div className="label-text-alt my-2">
                          The name of the rule that will be visible to you.
                        </div>
                      </label>
                      <input
                        type="text"
                        className="input input-bordered rounded-md border-gray focus:border-gray focus:outline-none"
                        placeholder="Name"
                        {...registerStep1("name")}
                        contentEditable
                        maxLength={255}
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
                          A brief description of the rule, outlining its purpose
                          and any specific conditions or criteria it applies to.
                          This will help you and others understand the rule's
                          intent and scope.
                        </div>
                      </label>
                      <textarea
                        className="input textarea textarea-bordered h-32 rounded-md border-gray text-[1rem] leading-tight focus:border-gray focus:outline-none"
                        placeholder="Description"
                        {...registerStep1("description")}
                        maxLength={500}
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
                      <Link
                        className="btn btn-warning flex-grow md:w-1/3 md:flex-grow-0"
                        href={getSafeUrl(
                          returnUrl?.toString(),
                          `/admin/stores`,
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
                  <div className="mb-4 flex flex-col">
                    <h5 className="font-bold tracking-wider">Store</h5>
                    <p className="my-2 text-sm">
                      Configure a ZLTO store for users by having a ZLTO
                      representative set up the store based on your
                      specifications. You can select the organization and a
                      store, with the option to choose specific item categories.
                      Visibility conditions will apply to either the entire
                      store or the selected item categories.
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
                            onChange={(val) => {
                              onChange(val?.value);
                            }}
                            value={organisationOptions?.find(
                              (c) => c.value === value,
                            )}
                            styles={{
                              // fix menu z-index issue
                              menuPortal: (base) => ({
                                ...base,
                                zIndex: 9999,
                              }),
                              placeholder: (base) => ({
                                ...base,
                                color: "#A3A6AF",
                              }),
                            }}
                            menuPortalTarget={htmlRef.current}
                            inputId="input_organisation" // e2e
                          />
                        )}
                      />
                    </FormField>

                    {/* COUNTRY */}
                    <FormField
                      label="Country"
                      subLabel="Select the country."
                      showError={
                        !!formStateStep2.touchedFields.storeCountryCodeAlpha2 ||
                        formStateStep2.isSubmitted
                      }
                      error={
                        formStateStep2.errors.storeCountryCodeAlpha2?.message
                      }
                    >
                      <Controller
                        control={controlStep2}
                        name="storeCountryCodeAlpha2"
                        render={({ field: { onChange, value } }) => (
                          <Select
                            instanceId="storeCountryCodeAlpha2"
                            classNames={{
                              control: () => "input !border-gray",
                            }}
                            isMulti={false}
                            options={countryOptions}
                            onChange={(val) => {
                              // clear store and store item categories
                              setValueStep2("storeId", "");
                              setValueStep2("storeItemCategories", []);

                              onChange(val?.value);
                            }}
                            value={countryOptions?.filter(
                              (c) => value === c.value,
                            )}
                            placeholder="Country"
                            styles={{
                              // fix menu z-index issue
                              menuPortal: (base) => ({
                                ...base,
                                zIndex: 9999,
                              }),
                              placeholder: (base) => ({
                                ...base,
                                color: "#A3A6AF",
                              }),
                            }}
                            menuPortalTarget={htmlRef.current}
                            inputId="input_countryId" // e2e
                          />
                        )}
                      />
                    </FormField>

                    {watchCountry && (
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
                                // clear store item categories
                                setValueStep2("storeItemCategories", []);

                                onChange(val?.value);
                              }}
                              value={dataStores?.find((c) => c.value === value)}
                              placeholder="Store"
                              styles={{
                                // fix menu z-index issue
                                menuPortal: (base) => ({
                                  ...base,
                                  zIndex: 9999,
                                }),
                                placeholder: (base) => ({
                                  ...base,
                                  color: "#A3A6AF",
                                }),
                              }}
                              menuPortalTarget={htmlRef.current}
                              inputId="input_store" // e2e
                            />
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
                                // fix menu z-index issue
                                menuPortal: (base) => ({
                                  ...base,
                                  zIndex: 9999,
                                }),
                                placeholder: (base) => ({
                                  ...base,
                                  color: "#A3A6AF",
                                }),
                              }}
                              menuPortalTarget={htmlRef.current}
                              inputId="input_storeItemCategories" // e2e
                            />
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
                      These rules ensure the store is accessible only to users
                      who meet criteria like age, gender, and completed
                      opportunities. All specified conditions must be met for
                      visibility, and multiple rules can be created with OR
                      logic determining visibility across different rules.
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
                      label="Age range"
                      subLabel="Stores will not be visible to users without a specified date of birth, regardless of the age condition. If no age restriction is set, the store or item categories will be visible to all ages."
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
                                    ...registerStep3("ageFrom", {
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
                                    ...registerStep3("ageTo", {
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
                      subLabel="Stores will NOT be visible to users with no gender specified or who have selected 'Prefer not to say', irrespective of the gender condition. If no gender condition is specified, the store or item categories will be visible to all genders."
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
                      subLabel="Select the opportunities that must be completed for the store to be visible. If no opportunity condition is specified, the store or item categories will be visible to all users regardless of completed opportunities."
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
                              control: () =>
                                "input input-sm text-[1rem] h-fit !border-gray",
                            }}
                            isMulti={true}
                            defaultOptions={true} // calls loadOpportunities for initial results when clicking on the dropdown
                            cacheOptions
                            loadOptions={loadOpportunities}
                            onChange={(val) => {
                              onChange(val.map((c) => c.value));
                            }}
                            // for each value, look up the value and label from the cache
                            value={value?.map((x: any) => ({
                              value: x,
                              label: dataOpportunities.find((c) => c.id === x)
                                ?.title,
                            }))}
                            placeholder="Select opportunities..."
                            inputId="input_opportunities" // e2e
                            styles={{
                              // fix menu z-index issue
                              menuPortal: (base) => ({
                                ...base,
                                zIndex: 9999,
                              }),
                              placeholder: (base) => ({
                                ...base,
                                color: "#A3A6AF",
                              }),
                            }}
                            menuPortalTarget={htmlRef.current}
                          />
                        )}
                      />
                    </FormField>

                    {/* OPPORTUNITY OPTION */}
                    <FormField
                      label="Opportunity Option"
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
                          <>
                            <FormRadio
                              id="opportunityOptionAny"
                              label="Any - Users who have completed at least one of the selected opportunities will meet this condition."
                              inputProps={{
                                checked: value === "1",
                                onChange: () => onChange("1"),
                              }}
                            />
                            <FormRadio
                              id="opportunityOptionAll"
                              label="All - Users must have completed all of the selected opportunities to meet this condition."
                              inputProps={{
                                checked: value === "0",
                                onChange: () => onChange("0"),
                              }}
                            />
                          </>
                        )}
                      />
                    </FormField>

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
                    {/* <p className="my-2 text-sm">
                      Preview your rule before submitting it.
                    </p> */}
                  </div>

                  <form
                    ref={formRef3}
                    className="flex flex-col gap-4"
                    onSubmit={handleSubmitStep4((data) =>
                      onSubmitStep(5, data),
                    )}
                  >
                    {/* PREVIEW */}
                    {formData.name && (
                      <FormField label="Name" subLabel={formData.name} />
                    )}

                    {formData.description && (
                      <FormField
                        label="Description"
                        subLabel={formData.description!}
                      />
                    )}

                    {formData.organizationId && (
                      <FormField
                        label="Organisation"
                        subLabel={
                          dataOrganisations?.items?.find(
                            (x) => x.id == formData.organizationId,
                          )?.name
                        }
                      />
                    )}

                    {formData.storeCountryCodeAlpha2 && (
                      <FormField
                        label="Country"
                        subLabel={
                          dataCountries?.find(
                            (x) =>
                              x.codeAlpha2 == formData.storeCountryCodeAlpha2,
                          )?.name
                        }
                      />
                    )}

                    {formData.storeId && (
                      <FormField
                        label="Store"
                        subLabel={
                          dataStores.find((x) => x.value == formData.storeId)
                            ?.label
                        }
                      />
                    )}

                    {!!formData.storeItemCategories?.length && (
                      <FormField label="Store Item Categories">
                        {formData.storeItemCategories?.map((item, index) => {
                          const category = dataStoreItemCategories.find(
                            (c) => c.value === item,
                          );
                          return (
                            <span
                              key={`storeItemCategories_${index}`}
                              className="text-xs text-gray-dark"
                            >
                              {category ? category.label : item}
                            </span>
                          );
                        })}
                      </FormField>
                    )}

                    {(!!formData.ageFrom || !!formData.ageTo) && (
                      <FormField
                        label="Age range"
                        subLabel={
                          formData.ageFrom && formData.ageTo
                            ? `From ${formData.ageFrom} To ${formData.ageTo}`
                            : formData.ageFrom
                              ? `From ${formData.ageFrom}`
                              : formData.ageTo
                                ? `To ${formData.ageTo}`
                                : "No age range specified"
                        }
                      />
                    )}

                    {formData.genderId && (
                      <FormField
                        label="Gender"
                        subLabel={
                          dataGenders?.find((x) => x.id == formData.genderId)
                            ?.name
                        }
                      />
                    )}

                    {!!formData.opportunities?.length && (
                      <>
                        <FormField label="Opportunities">
                          {formData.opportunities?.map((item, index) => {
                            const opportunity = dataOpportunities.find(
                              (o) => o.id === item,
                            );
                            return (
                              <span
                                key={`opportunities_${index}`}
                                className="text-xs text-gray-dark"
                              >
                                {opportunity ? opportunity.title : item}
                              </span>
                            );
                          })}
                        </FormField>

                        <FormField label="Opportunity Option">
                          {formData.opportunityOption == "0" && (
                            <span className="text-xs text-gray-dark">All</span>
                          )}
                          {formData.opportunityOption == "1" && (
                            <span className="text-xs text-gray-dark">Any</span>
                          )}
                        </FormField>
                      </>
                    )}

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
                            formStateStep3.isValid
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
