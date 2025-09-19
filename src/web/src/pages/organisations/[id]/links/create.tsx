import { zodResolver } from "@hookform/resolvers/zod";
import { QueryClient, dehydrate, useQueryClient } from "@tanstack/react-query";
import axios, { type AxiosError } from "axios";
import moment from "moment";
import { type GetServerSidePropsContext } from "next";
import { getServerSession } from "next-auth";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { type ParsedUrlQuery } from "querystring";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactElement,
} from "react";
import { Controller, useForm, type FieldValues } from "react-hook-form";
import { FaExclamationTriangle } from "react-icons/fa";
import { IoMdArrowRoundBack, IoMdClose, IoMdWarning } from "react-icons/io";
import Moment from "react-moment";
import Select from "react-select";
import Async from "react-select/async";
import CreatableSelect from "react-select/creatable";
import { toast } from "react-toastify";
import z from "zod";
import type { LinkRequestCreateVerify } from "~/api/models/actionLinks";
import type { SelectOption } from "~/api/models/lookups";
import {
  VerificationMethod,
  type OpportunityInfo,
  type OpportunitySearchResultsInfo,
} from "~/api/models/opportunity";
import { createLinkInstantVerify } from "~/api/services/actionLinks";
import {
  getOpportunityInfoByIdAdminOrgAdminOrUser,
  searchCriteriaOpportunities,
} from "~/api/services/opportunities";
import CustomModal from "~/components/Common/CustomModal";
import FormMessage, { FormMessageType } from "~/components/Common/FormMessage";
import MainLayout from "~/components/Layout/Main";
import SocialPreview from "~/components/Opportunity/SocialPreview";
import { PageBackground } from "~/components/PageBackground";
import { ApiErrors } from "~/components/Status/ApiErrors";
import { InternalServerError } from "~/components/Status/InternalServerError";
import { Loading } from "~/components/Status/Loading";
import { Unauthenticated } from "~/components/Status/Unauthenticated";
import { Unauthorized } from "~/components/Status/Unauthorized";
import { useConfirmationModalContext } from "~/context/modalConfirmationContext";
import {
  DATE_FORMAT_HUMAN,
  DATE_FORMAT_SYSTEM,
  DELIMETER_PASTE_MULTI,
  GA_ACTION_OPPORTUNITY_LINK_CREATE,
  GA_CATEGORY_OPPORTUNITY_LINK,
  MAX_INT32,
  PAGE_SIZE_MEDIUM,
} from "~/lib/constants";
import { trackGAEvent } from "~/lib/google-analytics";
import { config } from "~/lib/react-query-config";
import {
  debounce,
  getSafeUrl,
  getThemeFromRole,
  dateInputToUTC,
  utcToDateInput,
} from "~/lib/utils";
import {
  normalizeAndValidateEmail,
  normalizeAndValidatePhoneNumber,
  validateEmail,
  validatePhoneNumber,
} from "~/lib/validate";
import type { NextPageWithLayout } from "~/pages/_app";
import { authOptions, type User } from "~/server/auth";

interface IParams extends ParsedUrlQuery {
  id: string;
  returnUrl?: string;
}

// ⚠️ SSR
export async function getServerSideProps(context: GetServerSidePropsContext) {
  const { id } = context.params as IParams;
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
    // if (entityId !== "create") {
    //   const data = await getOpportunityById(entityId, context);
    //   await queryClient.prefetchQuery({
    //     queryKey: ["opportunity", entityId],
    //     queryFn: () => data,
    //   });
    // }
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
      theme: theme,
      error: errorCode,
    },
  };
}

// 👇 PAGE COMPONENT: Link Create/Edit
// this page acts as a create (/links/create) or edit page (/links/:id) based on the [entityId] route param
const LinkDetails: NextPageWithLayout<{
  id: string;
  user: User;
  theme: string;
  error?: number;
}> = ({ id, error }) => {
  const router = useRouter();
  const { returnUrl } = router.query;

  // 👇 Parse querystring for default values
  const qs = router.query;

  const initialFormData: LinkRequestCreateVerify = {
    name: typeof qs.name === "string" ? qs.name : "",
    description: typeof qs.description === "string" ? qs.description : "",
    entityType: typeof qs.entityType === "string" ? qs.entityType : "",
    entityId: typeof qs.entityId === "string" ? qs.entityId : "",
    usagesLimit:
      typeof qs.usagesLimit === "string" && qs.usagesLimit !== ""
        ? Number(qs.usagesLimit)
        : null,
    dateEnd:
      typeof qs.dateEnd === "string" && qs.dateEnd !== "" ? qs.dateEnd : null,
    distributionList: Array.isArray(qs.distributionList)
      ? qs.distributionList
      : typeof qs.distributionList === "string" && qs.distributionList !== ""
        ? [qs.distributionList]
        : [],
    includeQRCode:
      typeof qs.includeQRCode === "string" && qs.includeQRCode !== ""
        ? qs.includeQRCode === "true"
        : null,
    lockToDistributionList:
      typeof qs.lockToDistributionList === "string"
        ? qs.lockToDistributionList === "true"
        : false,
  };

  const queryClient = useQueryClient();

  const formRef1 = useRef<HTMLFormElement>(null);
  const formRef2 = useRef<HTMLFormElement>(null);
  const formRef3 = useRef<HTMLFormElement>(null);

  const [saveChangesDialogVisible, setSaveChangesDialogVisible] =
    useState(false);
  const [lastStepBeforeSaveChangesDialog, setLastStepBeforeSaveChangesDialog] =
    useState<number | null>(null);
  const modalContext = useConfirmationModalContext();

  const linkEntityTypes: SelectOption[] = [
    { value: "0", label: "Opportunity" },
  ];

  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] =
    useState<LinkRequestCreateVerify>(initialFormData);

  const schemaStep1 = z.object({
    name: z
      .string()
      .min(1, "Name is required.")
      .max(255, "Name cannot exceed 255 characters."),
    description: z
      .string()
      .max(500, "Description cannot exceed 500 characters.")
      .optional(),
    entityType: z.string().min(1, "Type is required."),
    entityId: z.string().min(1, "Entity is required."),
  });

  const schemaStep2 = z
    .object({
      usagesLimit: z.union([z.nan(), z.null(), z.number()]).transform((val) => {
        return val === null || Number.isNaN(val as any) ? null : val;
      }),
      dateEnd: z.union([z.string(), z.date(), z.null()]).optional(),
      lockToDistributionList: z.boolean().optional(),
      distributionList: z
        .union([z.array(z.string()), z.null()])
        .optional()
        .transform((items) => {
          // Normalize each email and phone number in the array
          if (!items) return items;

          return items.map((item) => {
            // Try to normalize as email
            const emailResult = normalizeAndValidateEmail(item);
            if (emailResult.isValid && emailResult.normalizedEmail) {
              return emailResult.normalizedEmail;
            }

            // Try to normalize as phone number
            const phoneResult = normalizeAndValidatePhoneNumber(item);
            if (phoneResult.isValid && phoneResult.normalizedNumber) {
              return phoneResult.normalizedNumber;
            }

            // Return original if can't normalize
            return item;
          });
        }),
    })
    .superRefine((data, ctx) => {
      // If lockToDistributionList is true, then distributionList is required
      if (
        data.lockToDistributionList &&
        (data.distributionList == null || data.distributionList?.length < 1)
      ) {
        ctx.addIssue({
          message: "Please enter at least one email address or phone number.",
          code: z.ZodIssueCode.custom,
          path: ["distributionList"],
        });
      }

      // Check all distribution list entries for valid format (email or phone)
      if (data.distributionList && data.distributionList.length > 0) {
        const invalidEntries = data.distributionList.filter(
          (userName: string) =>
            !(validateEmail(userName) || validatePhoneNumber(userName)),
        );

        if (invalidEntries.length > 0) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Please enter valid email addresses (name@gmail.com) or phone numbers (+27125555555).\n\nInvalid entries: ${invalidEntries.join(", ")}`,
            path: ["distributionList"],
          });
        }

        // Count emails and phone numbers
        const emails = data.distributionList.filter((item) =>
          validateEmail(item),
        );
        const phoneNumbers = data.distributionList.filter((item) =>
          validatePhoneNumber(item),
        );

        // Enforce limits on emails (max 10,000)
        if (emails.length > 10000) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Maximum of 10,000 email addresses allowed. You currently have ${emails.length} emails.`,
            path: ["distributionList"],
          });
        }

        // Enforce limits on phone numbers (max 100)
        if (phoneNumbers.length > 100) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Maximum of 100 phone numbers allowed. You currently have ${phoneNumbers.length} phone numbers.`,
            path: ["distributionList"],
          });
        }
      }

      // If lockToDistributionList is false and dateEnd is not null, validate that dateEnd is not in the past
      if (!data.lockToDistributionList && data.dateEnd !== null) {
        const now = new Date();
        const dateEnd = data.dateEnd ? new Date(data.dateEnd) : undefined;
        if (dateEnd) {
          // If dateEnd is today (any time), allow it
          const isToday =
            dateEnd.getFullYear() === now.getFullYear() &&
            dateEnd.getMonth() === now.getMonth() &&
            dateEnd.getDate() === now.getDate();
          if (!isToday && dateEnd < now) {
            ctx.addIssue({
              message: "The expiry date must be in the future.",
              code: z.ZodIssueCode.custom,
              path: ["dateEnd"],
            });
          }
        }
      }

      // If not limited to distribution list, must specify either usage limit or end date
      if (
        !data.lockToDistributionList &&
        data.usagesLimit == null &&
        data.dateEnd == null
      ) {
        ctx.addIssue({
          message:
            "If not limited to the distribution list, you must specify either a usage limit or an expiry date.",
          code: z.ZodIssueCode.custom,
          path: ["lockToDistributionList"],
        });
      }
    });

  const schemaStep3 = z.object({});

  const {
    register: registerStep1,
    handleSubmit: handleSubmitStep1,
    formState: formStateStep1,
    control: controlStep1,
    reset: resetStep1,
    watch: watchStep1,
    getValues,
    setValue,
  } = useForm({
    mode: "all",
    resolver: zodResolver(schemaStep1),
    defaultValues: formData,
  });
  const watchEntityType = watchStep1("entityType");
  const watchEntityId = watchStep1("entityId");

  const {
    register: registerStep2,
    handleSubmit: handleSubmitStep2,
    formState: formStateStep2,
    control: controlStep2,
    reset: resetStep2,
    watch: watchStep2,
  } = useForm({
    mode: "all",
    resolver: zodResolver(schemaStep2),
    defaultValues: formData,
  });
  const watchLockToDistributionList = watchStep2("lockToDistributionList");

  const {
    handleSubmit: handleSubmitStep3,
    formState: formStateStep3,

    reset: resetStep3,
  } = useForm({
    mode: "all",
    resolver: zodResolver(schemaStep3),
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

  //* SAVE CHANGE DIALOG
  const onClick_Menu = useCallback(
    (nextStep: number) => {
      let isDirtyStep = false;
      if (step === 1 && isDirtyStep1) isDirtyStep = true;
      else if (step === 2 && isDirtyStep2) isDirtyStep = true;
      else if (step === 3 && isDirtyStep3) isDirtyStep = true;

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
    setSaveChangesDialogVisible(false);
    setLastStepBeforeSaveChangesDialog(null);
    if (lastStepBeforeSaveChangesDialog) {
      setStep(lastStepBeforeSaveChangesDialog);
    }
  }, [
    formData,
    resetStep1,
    resetStep2,
    resetStep3,
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
    }
  }, [formRef1, formRef2, formRef3, setSaveChangesDialogVisible, step]);

  const onSubmit = useCallback(
    async (data: LinkRequestCreateVerify) => {
      // confirm dialog
      const result = await modalContext.showConfirmation(
        "",
        <div
          key="confirm-dialog-content"
          className="flex h-full flex-col space-y-2"
        >
          <div className="flex flex-row items-center gap-2">
            <IoMdWarning className="text-warning h-6 w-6" />
            <p className="text-lg">Publish</p>
          </div>

          <div className="text-md text-gray-dark flex flex-col gap-3 leading-6 md:text-sm">
            <p>Are you sure you want to publish your link?</p>

            <p>
              {data.lockToDistributionList
                ? "This link requires manual activation because it has a distribution list."
                : "This link will be auto-activated if the usage limit or expiry date has been met."}
            </p>
            <p>Once published, link details cannot be changed later.</p>
          </div>
        </div>,
      );
      if (!result) return;

      setIsLoading(true);

      try {
        let message = "";

        //  convert dates to string in format "YYYY-MM-DD"
        data.dateEnd = data.dateEnd
          ? moment(data.dateEnd).format(DATE_FORMAT_SYSTEM)
          : null;

        // HACK: api want nulls and not empty arrays...
        if (data.distributionList?.length == 0) data.distributionList = null;

        //  clear distributionList if not locked
        if (!data.lockToDistributionList) data.distributionList = null;
        else {
          data.usagesLimit = null;
          data.dateEnd = null;
        }

        // update api
        await createLinkInstantVerify(data);

        // invalidate cache
        // this will match all queries with the following prefixes ['Links', id] (list data) & ['Links_TotalCount', id] (tab counts)
        await queryClient.invalidateQueries({
          queryKey: ["Links", id],
          exact: false,
        });
        await queryClient.invalidateQueries({
          queryKey: ["Links_TotalCount", id],
          exact: false,
        });

        message = "Link created";
        toast(message, {
          type: "success",
          toastId: "link",
        });
        console.log(message); // e2e
      } catch (error) {
        toast(<ApiErrors error={error as AxiosError} />, {
          type: "error",
          toastId: "link",
          autoClose: false,
          icon: false,
        });

        setIsLoading(false);

        return;
      }

      setIsLoading(false);

      // redirect to returnUrl if present, else to list after create
      if (returnUrl) {
        void router.push(returnUrl.toString());
      } else {
        void router.push(`/organisations/${id}/links`);
      }
    },
    [setIsLoading, id, queryClient, router, modalContext, returnUrl],
  );

  // form submission handler
  const onSubmitStep = useCallback(
    async (step: number, data: FieldValues) => {
      // set form data
      const model = {
        ...formData,
        ...(data as LinkRequestCreateVerify),
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
    ],
  );

  //  look up the opportunity when watchEntityId changes (for link preview)
  const [selectedOpportuntity, setSelectedOpportuntity] =
    useState<OpportunityInfo | null>(null);

  useEffect(() => {
    if (!watchEntityId) return;

    if (watchEntityType == "0") {
      // get opportunity
      getOpportunityInfoByIdAdminOrgAdminOrUser(watchEntityId).then((res) => {
        // set state
        setSelectedOpportuntity(res);
      });
    }
  }, [watchEntityId, watchEntityType, setSelectedOpportuntity]);

  // load data asynchronously for the opportunities dropdown (debounced)
  const loadOpportunities = debounce(
    (inputValue: string, callback: (options: any) => void) => {
      if (inputValue.length < 3) inputValue = "";

      const cacheKey = [
        "opportunities",
        {
          organization: id,
          titleContains: inputValue,
          published: true,
          verificationMethod: VerificationMethod.Manual,
        },
      ];

      // try to get data from cache
      const cachedData =
        queryClient.getQueryData<OpportunitySearchResultsInfo>(cacheKey);

      if (cachedData) {
        const options = cachedData.items.map((item) => ({
          value: item.id,
          label: item.title,
        }));
        callback(options);
      } else {
        // if not in cache, fetch data
        searchCriteriaOpportunities({
          opportunities: [],
          organizations: [id],
          countries: null,
          titleContains: inputValue,
          published: true,
          verificationMethod: null,
          verificationEnabled: true,
          pageNumber: 1,
          pageSize: PAGE_SIZE_MEDIUM,
        }).then((data) => {
          const options = data.items.map((item) => ({
            value: item.id,
            label: item.title,
          }));
          callback(options);

          // save data to cache
          queryClient.setQueryData(cacheKey, data);
        });
      }
    },
    1000,
  );

  // Helper function to normalize distribution list values - only normalize valid entries
  const normalizeDistributionList = (values: string[]): string[] => {
    if (!values || values.length === 0) return values;

    return Array.from(
      new Set(
        values.map((value) => {
          // Skip empty or whitespace-only entries
          if (!value || value.trim() === "") {
            return value;
          }

          // Try email normalization first - only apply if valid
          const emailResult = normalizeAndValidateEmail(value);
          if (emailResult.isValid && emailResult.normalizedEmail) {
            return emailResult.normalizedEmail;
          }

          // Try phone normalization - only apply if valid
          const phoneResult = normalizeAndValidatePhoneNumber(value);
          if (phoneResult.isValid && phoneResult.normalizedNumber) {
            return phoneResult.normalizedNumber;
          }

          // Return original if not valid
          return value;
        }),
      ),
    );
  };

  if (error) {
    if (error === 401) return <Unauthenticated />;
    else if (error === 403) return <Unauthorized />;
    else return <InternalServerError />;
  }

  return (
    <>
      <Head>
        <title>Yoma | 🔗 Create Link</title>
      </Head>

      <PageBackground />

      {isLoading && <Loading />}

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
          <div className="bg-green flex flex-row p-4 shadow-lg">
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
          <div className="flex flex-col items-center justify-center gap-4">
            <div className="border-green-dark -mt-11 flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-full bg-white shadow-lg">
              <FaExclamationTriangle className="text-yellow h-8 w-8" />
            </div>

            <div className="font-semibold">
              Your recent changes have not been saved!
            </div>

            <div className="bg-gray mt-4 rounded-lg p-4 text-center md:w-[450px]">
              Please make sure to save your changes to prevent any loss of data.
            </div>

            <div className="mt-4 flex justify-center gap-4 px-4">
              <button
                type="button"
                className="btn border-purple text-purple w-52 rounded-full bg-white normal-case"
                onClick={onClickContinueWithoutSaving}
              >
                <span className="ml-1">Continue without saving</span>
              </button>

              <button
                type="button"
                className="btn bg-purple hover:bg-purple-light w-52 rounded-full text-white normal-case"
                onClick={onClickSaveAndContinue}
              >
                <p className="text-white">Save and continue</p>
              </button>
            </div>
          </div>
        </div>
      </CustomModal>

      {/* PAGE */}
      <div className="z-10 container mt-20 max-w-7xl overflow-hidden px-2 py-4">
        {/* BREADCRUMB */}
        <div className="flex flex-row items-center text-xs text-white">
          <Link
            className="hover:text-gray flex items-center justify-center font-bold"
            href={getSafeUrl(
              returnUrl?.toString(),
              `/organisations/${id}/links`,
            )}
          >
            <IoMdArrowRoundBack className="bg-theme mr-2 inline-block h-4 w-4" />
            Links
          </Link>
          <div className="mx-2 font-bold">|</div>
          Create
        </div>

        <h3 className="mt-2 mb-6 font-bold text-white">New link</h3>

        <div className="flex flex-col gap-4 md:flex-row">
          {/* LEFT VERTICAL MENU */}
          <ul className="menu shadow-custom hidden h-max w-60 flex-none gap-3 rounded-lg bg-white p-4 font-semibold md:flex md:justify-center">
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
                Limits
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
                  className={`bg-gray-dark mr-2 rounded-full px-1.5 py-0.5 text-xs font-medium text-white ${
                    formStateStep1.isValid &&
                    formStateStep2.isValid &&
                    formStateStep3.isValid
                      ? "bg-green"
                      : "bg-gray-dark"
                  }`}
                >
                  3
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
                case "Limits":
                  onClick_Menu(2);
                  break;
                case "Preview":
                  onClick_Menu(3);
                  break;

                default:
                  onClick_Menu(1);
                  break;
              }
            }}
          >
            <option>General</option>
            <option>Limits</option>
            <option>Preview</option>
          </select>

          {/* FORMS */}
          <div className="shadow-custom flex w-full grow flex-col items-center overflow-hidden rounded-lg bg-white">
            <div className="flex w-full flex-col px-2 py-4 md:p-8">
              {step === 1 && (
                <>
                  <div className="mb-4 flex flex-col">
                    <h5 className="font-bold tracking-wider">General</h5>
                    <p className="my-2 text-sm">
                      Share a link or QR code with Youth, which they can click
                      to auto-verify their completion of an opportunity.
                    </p>
                  </div>

                  <form
                    ref={formRef1}
                    className="flex flex-col gap-4"
                    onSubmit={handleSubmitStep1((data) =>
                      onSubmitStep(2, data),
                    )}
                  >
                    <fieldset className="fieldset">
                      <label className="flex flex-col">
                        <div className="label-text font-bold">Type</div>
                        <div className="label-text-alt my-2">
                          Select the type of entity you want to create a link
                          for.
                        </div>
                      </label>

                      <Controller
                        control={controlStep1}
                        name="entityType"
                        render={({ field: { onChange, value } }) => (
                          <Select
                            instanceId="entityType"
                            classNames={{
                              control: () => "input !border-gray",
                            }}
                            options={linkEntityTypes}
                            onChange={(val) => onChange(val?.value)}
                            value={linkEntityTypes?.find(
                              (c) => c.value === value,
                            )}
                            styles={{
                              placeholder: (base) => ({
                                ...base,
                                color: "#A3A6AF",
                              }),
                            }}
                            inputId="input_entityType" // e2e
                          />
                        )}
                      />

                      {formStateStep1.errors.entityType && (
                        <label className="label -mb-5">
                          <span className="label-text-alt text-red-500 italic">
                            {`${formStateStep1.errors.entityType.message}`}
                          </span>
                        </label>
                      )}
                    </fieldset>

                    {watchEntityType == "0" && (
                      <fieldset className="fieldset">
                        <label className="flex flex-col">
                          <div className="label-text font-bold">
                            Opportunity
                          </div>
                          <div className="label-text-alt my-2">
                            Which opportunity do you want to create a link for?
                          </div>
                        </label>
                        <Controller
                          name="entityId"
                          control={controlStep1}
                          render={({ field: { onChange } }) => (
                            <Async
                              instanceId="entityId"
                              classNames={{
                                control: () => "input",
                              }}
                              isMulti={false}
                              defaultOptions={true} // calls loadOpportunities for initial results when clicking on the dropdown
                              cacheOptions
                              loadOptions={loadOpportunities}
                              onChange={(val) => {
                                onChange(val?.value);
                              }}
                              value={
                                selectedOpportuntity
                                  ? {
                                      value: selectedOpportuntity.id,
                                      label: selectedOpportuntity.title,
                                    }
                                  : []
                              }
                              placeholder="Opportunity"
                            />
                          )}
                        />

                        {formStateStep1.errors.entityId && (
                          <label className="label">
                            <span className="label-text-alt text-red-500 italic">
                              {`${formStateStep1.errors.entityId.message}`}
                            </span>
                          </label>
                        )}
                      </fieldset>
                    )}

                    {watchEntityType == "1" && <>Job TODO</>}

                    <fieldset className="fieldset">
                      <label className="flex flex-col">
                        <div className="label-text font-bold">Name</div>
                        <div className="label-text-alt my-2">
                          This name will be visible to you, and in the link
                          preview.
                        </div>
                      </label>
                      <input
                        type="text"
                        className="input border-gray focus:border-gray rounded-md focus:outline-none"
                        placeholder="Name"
                        {...registerStep1("name")}
                        contentEditable
                      />
                      {formStateStep1.errors.name && (
                        <label className="label -mb-5">
                          <span className="label-text-alt text-red-500 italic">
                            {`${formStateStep1.errors.name.message}`}
                          </span>
                        </label>
                      )}
                    </fieldset>

                    <fieldset className="fieldset">
                      <label className="flex flex-col">
                        <div className="label-text font-bold">Description</div>
                        <div className="label-text-alt my-2">
                          This description will be visible to you, and in the
                          link preview.
                        </div>
                      </label>
                      <textarea
                        className="input textarea border-gray focus:border-gray h-32 rounded-md text-[1rem] leading-tight focus:outline-none"
                        placeholder="Description"
                        {...registerStep1("description")}
                      />
                      {formStateStep1.errors.description && (
                        <label className="label">
                          <span className="label-text-alt text-red-500 italic">
                            {`${formStateStep1.errors.description.message}`}
                          </span>
                        </label>
                      )}
                    </fieldset>

                    {/* BUTTONS */}
                    <div className="my-4 flex flex-row items-center justify-center gap-2 md:justify-end md:gap-4">
                      <button
                        type="button"
                        className="btn btn-warning grow md:w-1/3 md:grow-0"
                        onClick={() => {
                          if (returnUrl) {
                            router.push(returnUrl.toString());
                          } else {
                            router.push(`/organisations/${id}/links`);
                          }
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="btn btn-success grow md:w-1/3 md:grow-0"
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
                    <h5 className="font-bold tracking-wider">Limit</h5>
                    <p className="my-2 text-sm">
                      Set limits on the link, ensure it is not scanned by
                      incorrect participants.
                    </p>
                  </div>
                  <form
                    ref={formRef2}
                    className="flex flex-col gap-4"
                    onSubmit={handleSubmitStep2((data) =>
                      onSubmitStep(3, data),
                    )}
                  >
                    {/* LOCK TO DISTRIBUTION LIST */}
                    <fieldset className="fieldset">
                      <div className="label-text font-bold">Limited Link</div>
                      <label
                        htmlFor="lockToDistributionList"
                        className="label w-full cursor-pointer justify-normal"
                      >
                        <input
                          {...registerStep2(`lockToDistributionList`)}
                          type="checkbox"
                          id="lockToDistributionList"
                          className="checkbox-secondary checkbox"
                        />
                        <span className="label-text ml-4 whitespace-break-spaces">
                          Only email addresses (maximum 10,000) or phone numbers
                          (maximum 100) listed below will be able to use this
                          link.
                        </span>
                      </label>

                      {formStateStep2.errors.lockToDistributionList && (
                        <label className="label">
                          <span className="label-text-alt text-red-500 italic">
                            {`${formStateStep2.errors.lockToDistributionList.message}`}
                          </span>
                        </label>
                      )}
                    </fieldset>

                    {!watchLockToDistributionList && (
                      <>
                        {/* USAGE LIMIT */}
                        <fieldset className="fieldset">
                          <label className="flex flex-col">
                            <div className="label-text font-bold">
                              Number of participants
                            </div>
                            <div className="label-text-alt my-2">
                              Limit the number of times the link can be used.
                            </div>
                          </label>
                          <input
                            type="number"
                            className="input border-gray focus:border-gray disabled:border-gray-light disabled:text-gray rounded-md focus:outline-none"
                            placeholder="Enter number"
                            {...registerStep2("usagesLimit", {
                              valueAsNumber: true,
                            })}
                            disabled={watchLockToDistributionList ?? false}
                            min={1}
                            max={MAX_INT32}
                          />

                          <FormMessage messageType={FormMessageType.Warning}>
                            This link can be claimed by anyone who receives it.
                            Participants can send between one another to claim.
                            Consider using a limited link, or create multiple
                            links to reduce risk.
                          </FormMessage>

                          {formStateStep2.errors.usagesLimit && (
                            <label className="label -mb-5">
                              <span className="label-text-alt text-red-500 italic">
                                {`${formStateStep2.errors.usagesLimit.message}`}
                              </span>
                            </label>
                          )}
                        </fieldset>

                        {/* EXPIRY DATE */}
                        <fieldset className="fieldset">
                          <label className="flex flex-col">
                            <div className="label-text font-bold">
                              Expiry date
                            </div>
                            <div className="label-text-alt my-2">
                              Choose a date you want this link to expire.
                            </div>
                          </label>

                          <Controller
                            control={controlStep2}
                            name="dateEnd"
                            render={({ field: { onChange, value } }) => (
                              <input
                                type="date"
                                className="input border-gray focus:border-gray rounded-md focus:outline-none"
                                onBlur={(e) => {
                                  // Only validate and convert when user finishes editing
                                  if (e.target.value) {
                                    onChange(dateInputToUTC(e.target.value));
                                  } else {
                                    onChange("");
                                  }
                                }}
                                defaultValue={utcToDateInput(value || "")}
                                id="input_dateEnd" // e2e
                              />
                            )}
                          />

                          {formStateStep2.errors.dateEnd ? (
                            <label className="label -mb-5">
                              <span className="label-text-alt text-red-500 italic">
                                {`${formStateStep2.errors.dateEnd.message}`}
                              </span>
                            </label>
                          ) : (
                            <FormMessage messageType={FormMessageType.Info}>
                              {watchStep2("dateEnd") &&
                              moment(watchStep2("dateEnd")).isSame(
                                moment(),
                                "day",
                              )
                                ? "This link will expire at midnight today (23:59 AM)."
                                : "This link will expire at the end of the day on the selected date."}
                            </FormMessage>
                          )}
                        </fieldset>
                      </>
                    )}

                    {watchLockToDistributionList && (
                      <>
                        <fieldset className="fieldset">
                          <label className="flex flex-col">
                            <div className="label-text font-bold">
                              Participants
                            </div>
                          </label>

                          <Controller
                            name="distributionList"
                            control={controlStep2}
                            render={({ field: { onChange, value } }) => (
                              <CreatableSelect
                                isMulti
                                className="w-full"
                                onChange={(val) => {
                                  // when pasting multiple values, split them by DELIMETER_PASTE_MULTI and remove duplicates
                                  const userNames = Array.from(
                                    new Set(
                                      val
                                        .flatMap((item) =>
                                          item.value.split(
                                            DELIMETER_PASTE_MULTI,
                                          ),
                                        )
                                        .map((item) => item.trim())
                                        .filter((item) => item !== ""),
                                    ),
                                  );
                                  // Normalize the values
                                  const normalizedValues =
                                    normalizeDistributionList(userNames);
                                  onChange(normalizedValues);
                                }}
                                onBlur={() => {
                                  // Normalize existing values on blur
                                  const currentValues =
                                    getValues("distributionList") || [];
                                  const normalizedValues =
                                    normalizeDistributionList(currentValues);
                                  setValue(
                                    "distributionList",
                                    normalizedValues,
                                    {
                                      shouldValidate: true,
                                      shouldDirty: true,
                                    },
                                  );
                                }}
                                value={value?.map((val: any) => ({
                                  label: val,
                                  value: val,
                                }))}
                              />
                            )}
                          />

                          {formStateStep2.errors.distributionList && (
                            <label className="label">
                              <span
                                className="label-text-alt whitespace-break-spaces text-red-500 italic"
                                dangerouslySetInnerHTML={{
                                  __html:
                                    formStateStep2.errors.distributionList.message
                                      ?.toString()
                                      .replace(/\n/g, "<br/>") || "",
                                }}
                              />
                            </label>
                          )}

                          <FormMessage messageType={FormMessageType.Warning}>
                            Participants will have to click on the link in the
                            notification and claim their completion.
                          </FormMessage>
                        </fieldset>
                      </>
                    )}

                    {/* BUTTONS */}
                    <div className="my-4 flex items-center justify-center gap-2 md:justify-end md:gap-4">
                      <button
                        type="button"
                        className="btn btn-warning grow md:w-1/3 md:grow-0"
                        onClick={() => {
                          onClick_Menu(1);
                        }}
                      >
                        Back
                      </button>

                      <button
                        type="submit"
                        className="btn btn-success grow md:w-1/3 md:grow-0"
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
                    <h5 className="font-bold">Preview</h5>
                    <p className="my-2 text-sm">
                      Review your link before publishing it.
                    </p>
                  </div>

                  <form
                    ref={formRef3}
                    className="flex flex-col gap-4"
                    onSubmit={handleSubmitStep3((data) =>
                      onSubmitStep(4, data),
                    )}
                  >
                    {/* TYPE */}
                    <fieldset className="fieldset">
                      <div className="flex flex-col">
                        <div className="label-text font-bold">Type</div>

                        <div className="label label-text pl-0 text-sm">
                          {
                            linkEntityTypes?.find(
                              (x) => x.value == formData.entityType,
                            )?.label
                          }
                        </div>

                        {formStateStep1.errors.entityType && (
                          <label className="label">
                            <span className="label-text-alt text-red-500 italic">
                              {`${formStateStep1.errors.entityType.message}`}
                            </span>
                          </label>
                        )}
                      </div>
                    </fieldset>

                    {/* LINK PREVIEW */}
                    <fieldset className="fieldset">
                      <div className="flex flex-col">
                        <div className="label-text font-bold">
                          Social Preview
                        </div>
                        <div className="label label-text pl-0 text-sm">
                          This is how your link will look on social media:
                        </div>
                      </div>
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
                          <span className="label-text-alt text-red-500 italic">
                            {`${formStateStep1.errors.entityId.message}`}
                          </span>
                        </label>
                      )}
                    </fieldset>

                    {/* USAGE */}
                    <fieldset className="fieldset">
                      <div className="flex flex-col">
                        <div className="label-text font-bold">Limits</div>

                        {!formData.lockToDistributionList && (
                          <>
                            {/* USAGES LIMIT */}
                            <label className="label label-text pl-0 text-sm">
                              {formData.usagesLimit ? (
                                <div className="flex flex-row gap-1">
                                  Limited to
                                  <div className="font-semibold text-black">
                                    {formData.usagesLimit}
                                  </div>
                                  participant
                                  {formData.usagesLimit !== 1 ? "s" : ""}
                                </div>
                              ) : (
                                "No limit"
                              )}
                            </label>

                            {/* EXPIRY DATE */}
                            <label className="label label-text pl-0 text-sm">
                              {formData.dateEnd && (
                                <div className="flex flex-row gap-1">
                                  Expires on
                                  <Moment
                                    format={DATE_FORMAT_HUMAN}
                                    className="font-semibold text-black"
                                  >
                                    {formData.dateEnd}
                                  </Moment>
                                </div>
                              )}
                              {!formData.dateEnd && "No expiry date"}
                            </label>
                          </>
                        )}

                        {formData.lockToDistributionList && (
                          <div className="flex flex-col gap-2">
                            {/* LIMITED TO PARTICIPANTS */}
                            <label className="label label-text pl-0 text-sm">
                              <div className="flex flex-row gap-1">
                                Limited to the following
                                {(formData.distributionList?.length ?? 0) >
                                  1 && (
                                  <div className="font-semibold text-black underline">
                                    {formData.distributionList?.length}
                                  </div>
                                )}{" "}
                                participant
                                {formData.distributionList?.length !== 1
                                  ? "s"
                                  : ""}
                                {": "}
                              </div>
                            </label>

                            {/* PARTICIPANTS */}
                            {(formData.distributionList?.length ?? 0) > 0 && (
                              <label className="label label-text pt-0 pl-0 text-xs">
                                <div className="flex flex-row flex-wrap gap-1">
                                  {formData.distributionList?.map(
                                    (item, index) => (
                                      <div
                                        key={index}
                                        className="badge bg-gray !font-normal"
                                      >
                                        {item}
                                      </div>
                                    ),
                                  )}
                                </div>
                              </label>
                            )}
                          </div>
                        )}
                      </div>
                    </fieldset>

                    {/* BUTTONS */}
                    <div className="my-4 flex items-center justify-center gap-4 md:justify-end">
                      <button
                        type="button"
                        className="btn btn-warning grow md:w-1/3 md:grow-0"
                        onClick={() => {
                          onClick_Menu(2);
                        }}
                      >
                        Back
                      </button>
                      <button
                        type="submit"
                        className="btn btn-success disabled:bg-gray-light grow md:w-1/3 md:grow-0"
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

LinkDetails.getLayout = function getLayout(page: ReactElement) {
  return <MainLayout>{page}</MainLayout>;
};

// 👇 return theme from component properties. this is set server-side (getServerSideProps)
LinkDetails.theme = function getTheme(page: ReactElement<{ theme: string }>) {
  return page.props.theme;
};

export default LinkDetails;
