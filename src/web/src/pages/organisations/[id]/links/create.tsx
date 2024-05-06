import { zodResolver } from "@hookform/resolvers/zod";
import { captureException } from "@sentry/nextjs";
import { QueryClient, dehydrate, useQueryClient } from "@tanstack/react-query";
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
import { Controller, useForm, type FieldValues } from "react-hook-form";
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
import { IoMdArrowRoundBack } from "react-icons/io";
import CreatableSelect from "react-select/creatable";
import type { NextPageWithLayout } from "~/pages/_app";
import {
  DATE_FORMAT_HUMAN,
  DATE_FORMAT_SYSTEM,
  PAGE_SIZE_MEDIUM,
  GA_ACTION_OPPORTUNITY_LINK_CREATE,
  GA_CATEGORY_OPPORTUNITY_LINK,
  MAX_INT32,
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
import { AvatarImage } from "~/components/AvatarImage";
import type {
  OpportunityInfo,
  OpportunitySearchResultsInfo,
} from "~/api/models/opportunity";
import axios from "axios";
import { InternalServerError } from "~/components/Status/InternalServerError";
import { Unauthenticated } from "~/components/Status/Unauthenticated";
import { useDisableBodyScroll } from "~/hooks/useDisableBodyScroll";
import { validateEmail } from "~/lib/validate";
import type { LinkRequestCreateVerify } from "~/api/models/actionLinks";
import { createLinkInstantVerify } from "~/api/services/actionLinks";

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
  const queryClient = useQueryClient();

  const formRef1 = useRef<HTMLFormElement>(null);
  const formRef2 = useRef<HTMLFormElement>(null);
  const formRef3 = useRef<HTMLFormElement>(null);
  const formRef4 = useRef<HTMLFormElement>(null);

  const [saveChangesDialogVisible, setSaveChangesDialogVisible] =
    useState(false);
  const [lastStepBeforeSaveChangesDialog, setLastStepBeforeSaveChangesDialog] =
    useState<number | null>(null);

  const linkEntityTypes: SelectOption[] = [
    { value: "0", label: "Opportunity" },
  ];

  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<LinkRequestCreateVerify>({
    name: "",
    description: "",
    entityType: "",
    entityId: "",
    usagesLimit: null,
    dateEnd: null,
    distributionList: [],
    includeQRCode: null,
    lockToDistributionList: false,
  });

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
        // eslint-disable-next-line
        return val === null || Number.isNaN(val as any) ? null : val;
      }),
      dateEnd: z.union([z.string(), z.date(), z.null()]).optional(),
      lockToDistributionList: z.boolean().optional(),
    })
    .refine(
      (data) => {
        // if not locked to the distribution list, you must specify either a usage limit or an end date.
        return (
          data.lockToDistributionList ||
          (data.usagesLimit !== null && data.usagesLimit > 0) ||
          data.dateEnd
        );
      },
      {
        message:
          "If not limited to the distribution list, you must specify either a usage limit or an expiry date.",
        path: ["lockToDistributionList"],
      },
    );

  const schemaStep3 = z
    .object({
      distributionList: z.array(z.string().email()).optional(),
    })
    .refine(
      (data) => {
        // distributionList is required if lockToDistributionList is true
        return (
          !formData.lockToDistributionList ||
          (data.distributionList?.length ?? 0) > 0
        );
      },
      {
        message: "Please enter at least one email address.",
        path: ["distributionList"],
      },
    )
    .refine(
      (data) => {
        // validate all items are valid email addresses
        return data.distributionList?.every((email) => validateEmail(email));
      },
      {
        message:
          "Please enter valid email addresses e.g. name@domain.com. One or more email address are wrong.",
        path: ["distributionList"],
      },
    );
  // .transform((val) => {
  //   // If lockToDistributionList is true, set usagesLimit to the count of the distribution list

  //   if (formData.lockToDistributionList) {
  //     setFormData((prev) => ({
  //       ...prev,
  //       usagesLimit: val.distributionList?.length ?? 0,
  //     }));
  //   }
  // });
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
    resolver: zodResolver(schemaStep2),
    defaultValues: formData,
  });
  const watchLockToDistributionList = watchStep2("lockToDistributionList");

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
      else if (step === 4 && isDirtyStep4) isDirtyStep = true;

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
    async (data: LinkRequestCreateVerify) => {
      setIsLoading(true);

      try {
        let message = "";

        // dismiss all toasts
        toast.dismiss();

        //  convert dates to string in format "YYYY-MM-DD"
        data.dateEnd = data.dateEnd
          ? moment(data.dateEnd).format(DATE_FORMAT_SYSTEM)
          : null;

        //HACK: api want nulls and not empty arrays...
        if (data.distributionList?.length == 0) data.distributionList = null;

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

        captureException(error);
        setIsLoading(false);

        return;
      }

      setIsLoading(false);

      // redirect to list after create
      void router.push(`/organisations/${id}/links`);
    },
    [setIsLoading, id, queryClient, router],
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
      if (step === 5) {
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
  const [selectedOpportuntity, setSelectedOpportuntity] =
    useState<OpportunityInfo | null>(null);

  useEffect(() => {
    if (!watchEntityId) return;

    if (watchEntityType == "0") {
      // opportunity
      getOpportunityInfoByIdAdminOrgAdminOrUser(watchEntityId).then((res) => {
        // set state
        setSelectedOpportuntity(res);

        // if name & description is empty in formData, then default these values from the opportunity title & decription
        // resetStep1((prev) => ({
        //   ...prev,
        //   name: prev?.name || res.title,
        //   description: prev?.description || res.description,
        // }));
      });
    }
  }, [
    watchEntityId,
    watchEntityType,
    setSelectedOpportuntity /*, resetStep1*/,
  ]);

  if (error) {
    if (error === 401) return <Unauthenticated />;
    else if (error === 403) return <Unauthorized />;
    else return <InternalServerError />;
  }

  // load data asynchronously for the opportunities dropdown (debounced)
  const loadOpportunities = debounce(
    (inputValue: string, callback: (options: any) => void) => {
      if (inputValue.length < 3) inputValue = "";

      const cacheKey = [
        "opportunities",
        { organization: id, titleContains: inputValue },
      ];

      // Try to get data from cache
      const cachedData =
        queryClient.getQueryData<OpportunitySearchResultsInfo>(cacheKey);

      if (cachedData) {
        const options = cachedData.items.map((item) => ({
          value: item.id,
          label: item.title,
        }));
        callback(options);
      } else {
        // If not in cache, fetch data
        searchCriteriaOpportunities({
          opportunities: [],
          organization: id,
          titleContains: inputValue,
          pageNumber: 1,
          pageSize: PAGE_SIZE_MEDIUM,
        }).then((data) => {
          const options = data.items.map((item) => ({
            value: item.id,
            label: item.title,
          }));
          callback(options);

          // Save data to cache
          queryClient.setQueryData(cacheKey, data);
        });
      }
    },
    1000,
  );

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
          <Link
            className="flex items-center justify-center font-bold hover:text-gray"
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

        <h3 className="mb-6 mt-2 font-bold text-white">New link</h3>

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
                Usage
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
                Share
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
                    formStateStep3.isValid &&
                    formStateStep4.isValid
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
                case "Usage":
                  onClick_Menu(2);
                  break;
                case "Share":
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
            <option>Usage</option>
            <option>Share</option>
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
                      Share a link or QR code with Youth, which they can click
                      to auto-verify their completion of an opportunity.
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
                          <span className="label-text-alt italic text-red-500">
                            {`${formStateStep1.errors.entityType.message}`}
                          </span>
                        </label>
                      )}
                    </div>

                    {watchEntityType == "0" && (
                      <div className="form-control">
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
                            <span className="label-text-alt italic text-red-500">
                              {`${formStateStep1.errors.entityId.message}`}
                            </span>
                          </label>
                        )}

                        {selectedOpportuntity &&
                          !(
                            selectedOpportuntity.verificationEnabled &&
                            selectedOpportuntity.verificationMethod == "Manual"
                          ) && (
                            <label className="label">
                              <span className="label-text-alt italic text-red-500">
                                This opportunity does not support manual
                                verification. Please select another opportunity.
                              </span>
                            </label>
                          )}

                        {selectedOpportuntity?.published === false && (
                          <label className="label">
                            <span className="label-text-alt italic text-red-500">
                              This opportunity has not been published. Please
                              select another opportunity.
                            </span>
                          </label>
                        )}
                      </div>
                    )}

                    {watchEntityType == "1" && <>Job TODO</>}

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
                      <Link
                        className="btn btn-warning flex-grow md:w-1/3 md:flex-grow-0"
                        href={getSafeUrl(
                          returnUrl?.toString(),
                          `/organisations/${id}/links`,
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
                    <h5 className="font-bold tracking-wider">Usage</h5>
                    <p className="my-2 text-sm">
                      This section pertains to how many times the link can be
                      used, and when it will expire.
                    </p>
                  </div>

                  <form
                    ref={formRef2}
                    className="flex flex-col gap-4"
                    onSubmit={handleSubmitStep2((data) =>
                      onSubmitStep(3, data),
                    )}
                  >
                    {/* USAGE LIMIT */}
                    <div className="form-control">
                      <label className="flex flex-col">
                        <div className="label-text font-bold">Usage limit</div>
                        <div className="label-text-alt my-2">
                          Limit the number of times the link can be used.
                        </div>
                      </label>
                      <input
                        type="number"
                        className="input input-bordered rounded-md border-gray focus:border-gray focus:outline-none disabled:border-gray-light disabled:text-gray"
                        placeholder="Enter number"
                        {...registerStep2("usagesLimit", {
                          valueAsNumber: true,
                        })}
                        disabled={watchLockToDistributionList ?? false}
                        min={1}
                        max={MAX_INT32}
                      />
                      {formStateStep2.errors.usagesLimit && (
                        <label className="label -mb-5">
                          <span className="label-text-alt italic text-red-500">
                            {`${formStateStep2.errors.usagesLimit.message}`}
                          </span>
                        </label>
                      )}
                    </div>

                    {/* EXPIRY DATE */}
                    <div className="form-control">
                      <label className="flex flex-col">
                        <div className="label-text font-bold">Expiry date</div>
                        <div className="label-text-alt my-2">
                          Choose a date you want this link to expire.
                        </div>
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

                    {/* LOCK TO DISTRIBUTION LIST */}
                    <div className="form-control">
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
                        <span className="label-text ml-4">
                          Limit to a specific distribution list (Step 3)
                        </span>
                      </label>

                      {formStateStep2.errors.lockToDistributionList && (
                        <label className="label -mb-5">
                          <span className="label-text-alt italic text-red-500">
                            {`${formStateStep2.errors.lockToDistributionList.message}`}
                          </span>
                        </label>
                      )}
                    </div>

                    {/* BUTTONS */}
                    <div className="my-4 flex items-center justify-center gap-2 md:justify-end md:gap-4">
                      <button
                        type="button"
                        className="btn btn-warning flex-grow md:w-1/3 md:flex-grow-0"
                        onClick={() => {
                          setStep(1);
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
                    <h5 className="font-bold tracking-wider">Share</h5>
                    <p className="my-2 text-sm">
                      Share this link via email with Youth! This will send an
                      email to Youth with the ability for them to click and
                      receive the credential.
                    </p>{" "}
                    <p className="my-2 text-sm">
                      Note: Participants will have to click on the link in the
                      email and claim their completion.
                    </p>
                  </div>

                  <form
                    ref={formRef3}
                    className="flex flex-col gap-4"
                    onSubmit={handleSubmitStep3((data) =>
                      onSubmitStep(4, data),
                    )}
                  >
                    <div className="form-control">
                      <label className="label font-bold">
                        <span className="label-text">Participants</span>
                      </label>

                      <Controller
                        name="distributionList"
                        control={controlStep3}
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        render={({ field: { onChange, value } }) => (
                          <CreatableSelect
                            isMulti
                            className="form-control mb-2 w-full"
                            // eslint-disable-next-line
                            onChange={(val) =>
                              onChange(val.map((c) => c.value))
                            }
                            value={value?.map((val: any) => ({
                              label: val,
                              value: val,
                            }))}
                          />
                        )}
                      />

                      {formStateStep3.errors.distributionList && (
                        <label className="label font-bold">
                          <span className="label-text-alt italic text-red-500">
                            {/* eslint-disable-next-line @typescript-eslint/restrict-template-expressions */}
                            {`${formStateStep3.errors.distributionList.message}`}
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
                          setStep(2);
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
                    ref={formRef4}
                    className="flex flex-col gap-4"
                    onSubmit={handleSubmitStep4((data) =>
                      onSubmitStep(5, data),
                    )}
                  >
                    {/* TYPE */}
                    <div className="form-control">
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
                    </div>

                    {/* LINK PREVIEW */}
                    <div className="form-control">
                      <label className="flex flex-col">
                        <div className="label-text font-semibold">
                          Social Preview
                        </div>
                        <div className="label-text-alt my-2">
                          This is how your link will look on social media:
                        </div>
                      </label>
                      {formData.entityType == "0" && (
                        <div className="flex w-full flex-col rounded-lg border-2 border-dotted border-gray p-4">
                          <div className="flex gap-4">
                            <AvatarImage
                              icon={
                                selectedOpportuntity?.organizationLogoURL ??
                                null
                              }
                              alt={`${selectedOpportuntity?.organizationName} Logo`}
                              size={60}
                            />

                            <div className="flex max-w-[200px] flex-col gap-1 sm:max-w-[480px] md:max-w-[420px]">
                              <h4 className="overflow-hidden text-ellipsis whitespace-nowrap text-sm font-semibold leading-7 text-black md:text-xl md:leading-8">
                                {formData.name}
                              </h4>
                              <h6 className=" overflow-hidden text-ellipsis whitespace-nowrap text-xs text-gray-dark">
                                {formData.description}
                              </h6>
                            </div>
                          </div>
                        </div>
                      )}
                      {formStateStep1.errors.entityId && (
                        <label className="label">
                          <span className="label-text-alt italic text-red-500">
                            {`${formStateStep1.errors.entityId.message}`}
                          </span>
                        </label>
                      )}
                    </div>

                    {/* USAGE */}
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text font-semibold">Usage</span>
                      </label>

                      {/* LIMIT */}
                      {!formData.lockToDistributionList && (
                        <label className="label label-text text-sm">
                          {formData.usagesLimit ? (
                            <div className="flex flex-row gap-1">
                              Limited to
                              <div className="font-semibold text-black">
                                {formData.usagesLimit}
                              </div>
                              participant{formData.usagesLimit !== 1 ? "s" : ""}
                            </div>
                          ) : (
                            "No limit"
                          )}
                        </label>
                      )}

                      {formData.lockToDistributionList && (
                        <label className="label label-text text-sm">
                          <div className="flex flex-row gap-1">
                            Limited to
                            <div className="font-semibold text-black">
                              {formData.distributionList?.length}
                            </div>
                            participant
                            {formData.distributionList?.length !== 1
                              ? "s"
                              : ""}{" "}
                            in the distribution list (see Sharing)
                          </div>
                        </label>
                      )}

                      {formStateStep2.errors.usagesLimit && (
                        <label className="label">
                          <span className="label-text-alt italic text-red-500">
                            {`${formStateStep2.errors.usagesLimit.message}`}
                          </span>
                        </label>
                      )}

                      {/* EXPIRY DATE */}
                      <label className="label label-text text-sm">
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
                      {formStateStep1.errors.dateEnd && (
                        <label className="label">
                          <span className="label-text-alt italic text-red-500">
                            {`${formStateStep1.errors.dateEnd.message}`}
                          </span>
                        </label>
                      )}
                    </div>

                    {/* SHARING */}
                    <div className="form-control">
                      <div className="flex flex-col">
                        <label className="label-text font-bold">Sharing</label>

                        <label className="label label-text text-sm">
                          {(formData.distributionList?.length ?? 0) > 0 && (
                            <>
                              This link will be emailed to{" "}
                              {formData.distributionList?.length} participant
                              {formData.distributionList?.length !== 1
                                ? "s"
                                : ""}
                              :
                            </>
                          )}
                          {(formData.distributionList?.length ?? 0) === 0 &&
                            "No sharing"}
                        </label>
                      </div>

                      {(formData.distributionList?.length ?? 0) > 0 && (
                        <label className="label label-text pt-0 text-xs ">
                          <ul className="list-none">
                            {formData.distributionList?.map((item, index) => (
                              <li key={index}>{item}</li>
                            ))}
                          </ul>
                        </label>
                      )}

                      {formStateStep3.errors.distributionList && (
                        <label className="label -mb-5">
                          <span className="label-text-alt italic text-red-500">
                            {`${formStateStep3.errors.distributionList.message}`}
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
                          setStep(3);
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

LinkDetails.getLayout = function getLayout(page: ReactElement) {
  return <MainLayout>{page}</MainLayout>;
};

// 👇 return theme from component properties. this is set server-side (getServerSideProps)
LinkDetails.theme = function getTheme(page: ReactElement) {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return page.props.theme;
};

export default LinkDetails;
