import {
  QueryClient,
  dehydrate,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { type GetServerSidePropsContext } from "next";
import { type ParsedUrlQuery } from "querystring";
import {
  useState,
  type ReactElement,
  useMemo,
  useCallback,
  useEffect,
} from "react";
import { type OpportunityInfo } from "~/api/models/opportunity";
import {
  getOpportunityInfoById,
  getOpportunityInfoByIdAdminOrgAdminOrUser,
} from "~/api/services/opportunities";
import MainLayout from "~/components/Layout/Main";
import { PageBackground } from "~/components/PageBackground";
import {
  IoMdCheckmark,
  IoMdClose,
  IoMdFingerPrint,
  IoMdArrowRoundBack,
  IoMdPlay,
  IoMdBookmark,
  IoMdPerson,
  IoIosBook,
  IoMdCalendar,
  IoMdCloudUpload,
} from "react-icons/io";
import { IoCopy, IoQrCode, IoEllipsisHorizontalOutline } from "react-icons/io5";
import type { NextPageWithLayout } from "~/pages/_app";
import ReactModal from "react-modal";
import iconUpload from "public/images/icon-upload.svg";
import iconOpen from "public/images/icon-open.svg";
import iconClock from "public/images/icon-clock.svg";
import iconZlto from "public/images/icon-zlto.svg";
import iconBookmark from "public/images/icon-bookmark.svg";
import iconShare from "public/images/icon-share.svg";
import iconDifficulty from "public/images/icon-difficulty.svg";
import iconLanguage from "public/images/icon-language.svg";
import iconTopics from "public/images/icon-topics.svg";
import iconSkills from "public/images/icon-skills.svg";
import iconBell from "public/images/icon-bell.webp";
import iconLocation from "public/images/icon-location.svg";
import iconSmiley from "public/images/icon-smiley.webp";
import Image from "next/image";
import {
  getVerificationStatus,
  performActionViewed,
  performActionCancel,
  saveMyOpportunity,
  isOpportunitySaved,
  removeMySavedOpportunity,
} from "~/api/services/myOpportunities";
import { toast } from "react-toastify";
import { OpportunityCompletionEdit } from "~/components/Opportunity/OpportunityCompletionEdit";
import { signIn } from "next-auth/react";
import { fetchClientEnv } from "~/lib/utils";
import type { MyOpportunityResponseVerify } from "~/api/models/myOpportunity";
import { getServerSession } from "next-auth";
import { type User, authOptions } from "~/server/auth";
import { ApiErrors } from "~/components/Status/ApiErrors";
import type { AxiosError } from "axios";
import { InternalServerError } from "~/components/Status/InternalServerError";
import axios from "axios";
import { LoadingInline } from "~/components/Status/LoadingInline";
import {
  DATE_FORMAT_HUMAN,
  GA_ACTION_OPPORTUNITY_CANCELED,
  GA_ACTION_OPPORTUNITY_COMPLETED,
  GA_ACTION_OPPORTUNITY_FOLLOWEXTERNAL,
  GA_ACTION_USER_LOGIN_BEFORE,
  GA_CATEGORY_OPPORTUNITY,
  GA_CATEGORY_USER,
} from "~/lib/constants";
import Moment from "react-moment";
import { config } from "~/lib/react-query-config";
import { trackGAEvent } from "~/lib/google-analytics";
import { AvatarImage } from "~/components/AvatarImage";
import { useRouter } from "next/router";
import { Unauthenticated } from "~/components/Status/Unauthenticated";
import { Unauthorized } from "~/components/Status/Unauthorized";
import { set } from "nprogress";
import Badges from "~/components/Opportunity/Badges";

interface IParams extends ParsedUrlQuery {
  id: string;
  opportunityId: string;
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const { opportunityId } = context.params as IParams;
  const queryClient = new QueryClient(config);
  const session = await getServerSession(context.req, context.res, authOptions);
  let errorCode = null;

  try {
    // 👇 prefetch queries on server
    let dataOpportunityInfo: OpportunityInfo | null = null;
    let dataVerificationStatus: MyOpportunityResponseVerify | null = null;

    if (session) {
      // authenticated user (user may be an admin, orgDamin or the user has completed the opportunitiy)
      dataOpportunityInfo = await getOpportunityInfoByIdAdminOrgAdminOrUser(
        opportunityId,
        context,
      );
    } else {
      // anonymous user (can see published and active opportunities only)
      dataOpportunityInfo = await getOpportunityInfoById(
        opportunityId,
        false,
        context,
      );
    }

    if (session)
      dataVerificationStatus = await getVerificationStatus(
        opportunityId,
        context,
      );

    await Promise.all([
      queryClient.prefetchQuery({
        queryKey: ["opportunityInfo", opportunityId],
        queryFn: () => dataOpportunityInfo,
      }),
      queryClient.prefetchQuery({
        queryKey: ["verificationStatus", opportunityId],
        queryFn: () => dataVerificationStatus ?? null,
      }),
    ]);

    // 👇 perform viewed action (authenticated users only)
    if (session && dataOpportunityInfo.published)
      await performActionViewed(opportunityId, context);
  } catch (error) {
    console.error("Error fetching data in getServerSideProps", error);
    if (axios.isAxiosError(error) && error.response?.status) {
      if (error.response.status === 404) {
        return {
          notFound: true,
        };
      } else errorCode = error.response.status;
    } else errorCode = 500;
  }

  return {
    props: {
      dehydratedState: dehydrate(queryClient),
      user: session?.user ?? null,
      opportunityId: opportunityId,
      error: errorCode,
    },
  };
}

const OpportunityDetails: NextPageWithLayout<{
  opportunityId: string;
  user: User;
  error?: number;
}> = ({ opportunityId, user, error }) => {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [loginDialogVisible, setLoginDialogVisible] = useState(false);
  const [gotoOpportunityDialogVisible, setGotoOpportunityDialogVisible] =
    useState(false);
  const [
    completeOpportunityDialogVisible,
    setCompleteOpportunityDialogVisible,
  ] = useState(false);
  const [
    completeOpportunitySuccessDialogVisible,
    setCompleteOpportunitySuccessDialogVisible,
  ] = useState(false);
  const [cancelOpportunityDialogVisible, setCancelOpportunityDialogVisible] =
    useState(false);
  const [shareOpportunityDialogVisible, setShareOpportunityDialogVisible] =
    useState(false);
  const [isOppSaved, setIsOppSaved] = useState(false);

  const {
    data: opportunity,
    error: serverError,
    isLoading: dataIsLoading,
  } = useQuery<OpportunityInfo>({
    queryKey: ["opportunityInfo", opportunityId],
    queryFn: () => {
      if (user) {
        // authenticated user (user may be an admin, orgDamin or the user has completed the opportunitiy)
        return getOpportunityInfoByIdAdminOrgAdminOrUser(opportunityId);
      } else {
        // anonymous user (can see published and active opportunities only)
        return getOpportunityInfoById(opportunityId, false);
      }
    },
  });

  const { data: verificationStatus, isLoading: verificationStatusIsLoading } =
    useQuery<MyOpportunityResponseVerify | null>({
      queryKey: ["verificationStatus", opportunityId],
      queryFn: () => {
        if (
          !!user &&
          !!opportunity &&
          serverError == null &&
          opportunity.verificationEnabled &&
          opportunity.verificationMethod == "Manual"
        ) {
          return getVerificationStatus(opportunityId);
        } else return null;
      },
    });

  useEffect(() => {
    if (!user) return;

    // ensure opportunity is published and status is not 'Inactive' (avoid API 400 error)
    if (!(opportunity?.published && opportunity?.status != "Inactive")) return;

    isOpportunitySaved(opportunity.id).then((res) => {
      setIsOppSaved(!!res);
    });
  }, [user, isOppSaved, opportunity]);

  // CLICK HANDLERS
  const onUpdateSavedOpportunity = useCallback(() => {
    if (!user) {
      toast.warning("You need to be logged in to save an opportunity");
      return;
    }

    if (isOppSaved) {
      removeMySavedOpportunity(opportunityId)
        .then(() => {
          setIsOppSaved(false);
          toast.success("Opportunity removed from saved");
        })
        .catch((error) => {
          toast(<ApiErrors error={error as AxiosError} />, {
            type: "error",
            autoClose: false,
            icon: false,
          });
        });
    } else {
      saveMyOpportunity(opportunityId)
        .then(() => {
          setIsOppSaved(true);
          toast.success("Opportunity saved");
        })
        .catch((error) => {
          toast(<ApiErrors error={error as AxiosError} />, {
            type: "error",
            autoClose: false,
            icon: false,
          });
        });
    }
  }, [opportunityId, user, isOppSaved]);

  const onGoToOpportunity = useCallback(() => {
    if (!opportunity?.url) return;

    window.open(opportunity?.url, "_blank");

    // 📊 GOOGLE ANALYTICS: track event
    trackGAEvent(
      GA_CATEGORY_OPPORTUNITY,
      GA_ACTION_OPPORTUNITY_FOLLOWEXTERNAL,
      opportunity?.url,
    );
  }, [opportunity?.url]);

  const [isButtonLoading, setIsButtonLoading] = useState(false);
  const onLogin = useCallback(async () => {
    setIsButtonLoading(true);

    // 📊 GOOGLE ANALYTICS: track event
    trackGAEvent(
      GA_CATEGORY_USER,
      GA_ACTION_USER_LOGIN_BEFORE,
      "User Logging In. Redirected to External Authentication Provider",
    );

    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    signIn(
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      ((await fetchClientEnv()).NEXT_PUBLIC_KEYCLOAK_DEFAULT_PROVIDER ||
        "") as string,
    );
  }, [setIsButtonLoading]);

  const onOpportunityCompleted = useCallback(async () => {
    setCompleteOpportunityDialogVisible(false);
    setCompleteOpportunitySuccessDialogVisible(true);

    // 📊 GOOGLE ANALYTICS: track event
    trackGAEvent(GA_CATEGORY_OPPORTUNITY, GA_ACTION_OPPORTUNITY_COMPLETED, "");

    // invalidate queries
    await queryClient.invalidateQueries({
      queryKey: ["verificationStatus", opportunityId],
    });
  }, [opportunityId, queryClient]);

  const onOpportunityCancel = useCallback(async () => {
    // call api
    await performActionCancel(opportunityId);

    // 📊 GOOGLE ANALYTICS: track event
    trackGAEvent(GA_CATEGORY_OPPORTUNITY, GA_ACTION_OPPORTUNITY_CANCELED, "");

    // invalidate queries
    await queryClient.invalidateQueries({
      queryKey: ["verificationStatus", opportunityId],
    });

    // toast
    toast.success("Your application has been canceled");

    setCancelOpportunityDialogVisible(false);
  }, [opportunityId, queryClient]);

  const onShareOpportunity = useCallback(() => {
    if (!user) {
      toast.warning("You need to be logged in to save an opportunity");
      return;
    }
    setShareOpportunityDialogVisible(true);
  }, [user, setShareOpportunityDialogVisible]);

  const [showQRCode, setShowQRCode] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(
      "Lorem ipsum dolor sit amet, consectetuer adipiscing elit.",
    );
    alert("URL copied to clipboard!");
  };
  const generateQRCode = () => {
    setShowQRCode(true);
  };

  if (error) {
    if (error === 401) return <Unauthenticated />;
    else if (error === 403) return <Unauthorized />;
    else return <InternalServerError />;
  }

  return (
    <>
      <PageBackground />

      <div className="container z-10 mt-16 max-w-7xl px-2 py-4 md:mt-20">
        <>
          {/* ERROR */}
          {serverError && (
            <div className="flex items-center justify-center">
              <InternalServerError />
            </div>
          )}

          {/* LOADING */}
          {dataIsLoading && (
            <div className="flex items-center justify-center">
              <div className="flex h-[300px] w-full max-w-md flex-col items-center justify-center gap-1 rounded-lg bg-white">
                <LoadingInline />
              </div>
            </div>
          )}

          {/* MAIN CONTENT */}
          {!serverError && (
            <>
              <div className="flex flex-col gap-2 py-6 sm:flex-row">
                <div className="flex-grow overflow-hidden text-ellipsis px-2 text-sm md:whitespace-nowrap">
                  <ul>
                    <li className="inline">
                      <button
                        className="inline text-white hover:text-gray "
                        onClick={() => router.back()}
                      >
                        <IoMdArrowRoundBack className="mb-[2px] mr-1 inline h-4 w-4" />
                        Opportunities
                      </button>
                    </li>
                    <li className="inline">
                      <p className="mx-2 inline font-semibold text-white">|</p>
                    </li>
                    <li className="inline">
                      <div className="inline max-w-[600px] text-white">
                        {opportunity?.title}
                      </div>
                    </li>
                  </ul>
                </div>
              </div>

              {/* LOGIN DIALOG */}
              <ReactModal
                isOpen={loginDialogVisible}
                shouldCloseOnOverlayClick={false}
                onRequestClose={() => {
                  setLoginDialogVisible(false);
                }}
                className={`fixed bottom-0 left-0 right-0 top-0 flex-grow overflow-hidden bg-white animate-in fade-in md:m-auto md:max-h-[300px] md:w-[450px] md:rounded-3xl`}
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
                        setLoginDialogVisible(false);
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

                    <h5>Please login to continue</h5>

                    <div className="mt-4 flex flex-grow gap-4">
                      <button
                        type="button"
                        className="btn rounded-full border-purple bg-white normal-case text-purple md:w-[150px]"
                        onClick={() => setLoginDialogVisible(false)}
                      >
                        <Image
                          src={iconBookmark}
                          alt="Icon Bookmark"
                          width={20}
                          height={20}
                          sizes="100vw"
                          priority={true}
                          style={{ width: "20px", height: "20px" }}
                        />

                        <span className="ml-1">Cancel</span>
                      </button>

                      <button
                        type="button"
                        className="btn rounded-full bg-purple normal-case text-white hover:bg-purple-light md:w-[150px]"
                        onClick={onLogin}
                      >
                        {isButtonLoading && (
                          <span className="loading loading-spinner loading-md mr-2 text-warning"></span>
                        )}
                        {!isButtonLoading && (
                          <IoMdFingerPrint className="h-5 w-5 text-white" />
                        )}
                        <p className="text-white">Login</p>
                      </button>
                    </div>
                  </div>
                </div>
              </ReactModal>

              {/* GO-TO OPPORTUNITY DIALOG */}
              <ReactModal
                isOpen={gotoOpportunityDialogVisible}
                shouldCloseOnOverlayClick={false}
                onRequestClose={() => {
                  setGotoOpportunityDialogVisible(false);
                }}
                className={`fixed bottom-0 left-0 right-0 top-0 flex-grow overflow-hidden bg-white animate-in fade-in md:m-auto md:max-h-[440px] md:w-[600px] md:rounded-3xl`}
                portalClassName={"fixed z-40"}
                overlayClassName="fixed inset-0 bg-overlay"
              >
                <div className="flex h-full flex-col gap-2 overflow-y-auto pb-10">
                  <div className="flex flex-row bg-green p-4 shadow-lg">
                    <h1 className="flex-grow"></h1>
                    <button
                      type="button"
                      className="btn rounded-full border-green-dark bg-green-dark p-3 text-white"
                      onClick={() => {
                        setGotoOpportunityDialogVisible(false);
                      }}
                    >
                      <IoMdClose className="h-6 w-6"></IoMdClose>
                    </button>
                  </div>
                  <div className="flex flex-col items-center justify-center gap-4 p-4 md:p-0">
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
                    <h3>You are now leaving Yoma</h3>
                    <div className="rounded-lg bg-gray p-4 text-center md:w-[450px]">
                      Remember to{" "}
                      <strong>upload your completion certificate</strong> on
                      this page upon finishing to{" "}
                      <strong>earn your ZLTO</strong>.
                    </div>
                    {/* <div>Don’t show me this message again</div> */}
                    <div className="text-center md:w-[450px]">
                      Be mindful of external sites&apos; privacy policy and keep
                      your data private.
                    </div>
                    <div className="mt-4 flex w-full flex-grow flex-col justify-center gap-4 md:flex-row">
                      <button
                        type="button"
                        className={
                          "btn btn-outline rounded-full border-purple bg-white normal-case text-purple hover:text-purple md:w-[250px]" +
                          `${
                            isOppSaved
                              ? " border-none bg-yellow-light text-yellow hover:bg-yellow-light hover:text-yellow"
                              : ""
                          }`
                        }
                        onClick={onUpdateSavedOpportunity}
                        // ensure user is logged in and opportunity is published and active
                        // disabled={
                        //   !user ||
                        //   !(
                        //     opportunity?.published &&
                        //     opportunity?.status != "Inactive" &&
                        //     new Date(opportunity?.dateStart) > new Date()
                        //   )
                        // }
                      >
                        <IoMdBookmark
                          style={{ width: "20px", height: "20px" }}
                        />

                        <span className="ml-1">
                          {isOppSaved ? "Opportunty saved" : "Save opportunity"}
                        </span>
                      </button>
                      <button
                        type="button"
                        className="btn btn-primary normal-case text-white md:w-[250px]"
                        onClick={onGoToOpportunity}
                        disabled={!opportunity?.url}
                      >
                        <Image
                          src={iconOpen}
                          alt="Icon Open"
                          width={20}
                          height={20}
                          sizes="100vw"
                          priority={true}
                          style={{ width: "20px", height: "20px" }}
                        />

                        <span className="ml-1">Proceed</span>
                      </button>
                    </div>
                  </div>
                </div>
              </ReactModal>

              {/* UPLOAD/COMPLETE OPPORTUNITY DIALOG */}
              <ReactModal
                isOpen={completeOpportunityDialogVisible}
                shouldCloseOnOverlayClick={false}
                onRequestClose={() => {
                  setCompleteOpportunityDialogVisible(false);
                }}
                className={`fixed bottom-0 left-0 right-0 top-0 flex-grow overflow-hidden bg-white animate-in fade-in md:m-auto md:max-h-[650px] md:w-[600px] md:rounded-3xl`}
                portalClassName={"fixed z-40"}
                overlayClassName="fixed inset-0 bg-overlay"
              >
                <OpportunityCompletionEdit
                  id="op-complete"
                  opportunityInfo={opportunity}
                  onClose={() => {
                    setCompleteOpportunityDialogVisible(false);
                  }}
                  onSave={onOpportunityCompleted}
                />
              </ReactModal>

              {/* COMPLETE SUCCESS DIALOG */}
              <ReactModal
                isOpen={completeOpportunitySuccessDialogVisible}
                shouldCloseOnOverlayClick={false}
                onRequestClose={() => {
                  setCompleteOpportunitySuccessDialogVisible(false);
                }}
                className={`fixed bottom-0 left-0 right-0 top-0 flex-grow overflow-hidden bg-white animate-in fade-in md:m-auto md:max-h-[400px] md:w-[600px] md:rounded-3xl`}
                portalClassName={"fixed z-40"}
                overlayClassName="fixed inset-0 bg-overlay"
              >
                <div className="flex w-full flex-col gap-2">
                  <div className="flex flex-row bg-green p-4 shadow-lg">
                    <h1 className="flex-grow"></h1>
                    <button
                      type="button"
                      className="btn rounded-full border-green-dark bg-green-dark p-3 text-white"
                      onClick={() => {
                        setCompleteOpportunitySuccessDialogVisible(false);
                      }}
                    >
                      <IoMdClose className="h-6 w-6"></IoMdClose>
                    </button>
                  </div>
                  <div className="flex flex-col items-center justify-center gap-4">
                    <div className="-mt-8 flex h-12 w-12 items-center justify-center rounded-full border-green-dark bg-white shadow-lg">
                      <Image
                        src={iconSmiley}
                        alt="Icon Smiley"
                        width={28}
                        height={28}
                        sizes="100vw"
                        priority={true}
                        style={{ width: "28px", height: "28px" }}
                      />
                    </div>
                    <h3>Submitted!</h3>
                    <div className="rounded-lg p-4 text-center md:w-[450px]">
                      <strong>{opportunity?.organizationName}</strong> is busy
                      reviewing your submission. Once approved, the opportunity
                      will be automatically added to your CV.
                    </div>
                    <div className="mt-4 flex flex-grow gap-4">
                      <button
                        type="button"
                        className="btn rounded-full border-purple bg-white normal-case text-purple md:w-[200px]"
                        onClick={() =>
                          setCompleteOpportunitySuccessDialogVisible(false)
                        }
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </div>
              </ReactModal>

              {/* CANCEL OPPORTUNITY COMPLETION DIALOG */}
              <ReactModal
                isOpen={cancelOpportunityDialogVisible}
                shouldCloseOnOverlayClick={false}
                onRequestClose={() => {
                  setCancelOpportunityDialogVisible(false);
                }}
                className={`fixed bottom-0 left-0 right-0 top-0 flex-grow overflow-y-scroll bg-white animate-in fade-in md:m-auto md:max-h-[450px] md:w-[600px] md:overflow-y-hidden md:rounded-3xl`}
                portalClassName={"fixed z-40"}
                overlayClassName="fixed inset-0 bg-overlay"
              >
                <div className="flex flex-col gap-2">
                  <div className="flex flex-row bg-green p-4 shadow-lg">
                    <h1 className="flex-grow"></h1>
                    <button
                      type="button"
                      className="btn rounded-full border-green-dark bg-green-dark p-3 text-white"
                      onClick={() => {
                        setCancelOpportunityDialogVisible(false);
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
                    <h3>Your application is pending verification.</h3>
                    <div className="rounded-lg p-4 text-center md:w-[450px]">
                      <strong>{opportunity?.organizationName}</strong> is busy
                      reviewing your submission. Once approved, the opportunity
                      will be automatically added to your CV. If you would like
                      to cancel your application and delete all uploaded files,
                      click the button below.
                    </div>
                    <div className="mt-4 flex flex-grow gap-4">
                      <button
                        type="button"
                        className="btn rounded-full border-purple bg-white normal-case text-purple md:w-[200px]"
                        onClick={onOpportunityCancel}
                      >
                        Cancel submission & Delete all files
                      </button>
                    </div>
                  </div>
                </div>
              </ReactModal>

              {/* SHARE OPPORTUNITY DIALOG */}
              <ReactModal
                isOpen={shareOpportunityDialogVisible}
                shouldCloseOnOverlayClick={false}
                onRequestClose={() => {
                  setShareOpportunityDialogVisible(false);
                }}
                className={`fixed bottom-0 left-0 right-0 top-0 flex-grow overflow-hidden bg-white animate-in fade-in md:m-auto md:max-h-[650px] md:w-[600px] md:rounded-3xl`}
                portalClassName={"fixed z-40"}
                overlayClassName="fixed inset-0 bg-overlay"
              >
                {/* <div className="flex flex-col gap-2"> */}
                <div className="flex h-full flex-col gap-2 overflow-y-auto">
                  <div className="flex flex-row bg-green p-4 shadow-lg">
                    <h1 className="flex-grow"></h1>
                    <button
                      type="button"
                      className="btn rounded-full border-green-dark bg-green-dark p-3 text-white"
                      onClick={() => {
                        setShareOpportunityDialogVisible(false);
                      }}
                    >
                      <IoMdClose className="h-6 w-6"></IoMdClose>
                    </button>
                  </div>

                  <div className="flex flex-col items-center justify-center gap-4 p-8">
                    <div className="-mt-16 flex h-12 w-12 items-center justify-center rounded-full border-green-dark bg-white shadow-lg">
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

                    <h3>Share this opportunity!</h3>

                    {/* OPPORTUNITY DETAILS (smaller) */}
                    <div className="flex w-full flex-col rounded-lg border-2 border-dotted border-gray p-4">
                      <div className="flex gap-4">
                        <div className="">
                          <AvatarImage
                            icon={opportunity?.organizationLogoURL ?? null}
                            alt="Company Logo"
                            size={60}
                            // sizeMobile={42}
                          />
                        </div>
                        <div className="flex max-w-xs flex-col gap-1">
                          <h4 className="text-lgx overflow-hidden   text-ellipsis whitespace-nowrap font-semibold leading-7 text-black md:text-xl md:leading-8">
                            {opportunity?.title}
                          </h4>
                          <h6 className=" overflow-hidden text-ellipsis whitespace-nowrap text-xs text-gray-dark">
                            By {opportunity?.organizationName}
                          </h6>
                        </div>
                      </div>

                      {/* BADGES */}
                      <Badges opportunity={opportunity} />

                      {/* DATES */}
                      {/* {opportunity?.status == "Active" && (
                        <div className="flex flex-col text-sm text-gray-dark">
                          <div>
                            {opportunity.dateStart && (
                              <>
                                <span className="mr-2 font-bold">Starts:</span>
                                <span className="text-xs tracking-widest text-black">
                                  <Moment format={DATE_FORMAT_HUMAN} utc={true}>
                                    {opportunity.dateStart}
                                  </Moment>
                                </span>
                              </>
                            )}
                          </div>
                          <div>
                            {opportunity.dateEnd && (
                              <>
                                <span className="mr-2 font-bold">Ends:</span>
                                <span className="text-xs tracking-widest text-black">
                                  <Moment format={DATE_FORMAT_HUMAN} utc={true}>
                                    {opportunity.dateEnd}
                                  </Moment>
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      )} */}
                    </div>

                    {/* BUTTONS */}
                    <div className="grid w-full grid-cols-2 gap-4">
                      <button
                        onClick={copyToClipboard}
                        className="flex w-full items-center gap-2 rounded-xl border-[1px] border-gray px-4 py-3 text-lg font-semibold text-black"
                      >
                        <IoCopy className="mr-2 h-6 w-6" />
                        Copy Link
                      </button>
                      <button
                        onClick={generateQRCode}
                        className="flex w-full items-center gap-2 rounded-xl border-[1px] border-gray px-4 py-3 text-lg font-semibold text-black"
                      >
                        <IoQrCode className="mr-2 h-6 w-6" />
                        Generate QR Code
                      </button>
                      <button
                        onClick={() => {
                          if (navigator.share) {
                            navigator
                              .share({
                                title: "Page Title",
                                text: "Page description",
                                url: "https://example.com", // replace with your URL
                              })
                              .then(() => console.log("Successful share"))
                              .catch((error) =>
                                console.log("Error sharing", error),
                              );
                          } else {
                            console.log("Share not supported on this browser");
                          }
                        }}
                        className="text-black-100 flex w-60 items-center gap-2 rounded-xl border-[1px] border-gray px-4 py-3 text-lg font-semibold"
                      >
                        <IoEllipsisHorizontalOutline className="mr-2 h-6 w-6 text-black" />
                        More options
                      </button>
                    </div>

                    {showQRCode && (
                      // <img
                      //   src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
                      //     url,
                      //   )}`}
                      //   alt="QR Code"
                      // />
                      <>TODO:</>
                    )}
                  </div>
                </div>
              </ReactModal>

              {opportunity && (
                <div className="flex flex-col gap-4">
                  <div className="relative flex flex-grow flex-row gap-1 rounded-lg bg-white p-4 shadow-lg md:p-6">
                    <div className="flex flex-grow flex-col gap-1">
                      <div className="flex flex-grow flex-col">
                        <div className="relative flex justify-start">
                          <h4 className="max-w-[215px] text-xl font-semibold leading-7 text-black md:max-w-[1125px] md:text-2xl md:leading-8">
                            {opportunity.title}
                          </h4>
                          <div className="absolute -right-2 -top-2 md:right-0 md:top-0">
                            <AvatarImage
                              icon={opportunity?.organizationLogoURL ?? null}
                              alt="Company Logo"
                              size={60}
                              // sizeMobile={42}
                            />
                          </div>
                        </div>

                        <h6 className="max-w-[215px] text-sm text-gray-dark md:max-w-[1125px]">
                          By {opportunity.organizationName}
                        </h6>

                        {/* BADGES */}
                        <Badges opportunity={opportunity} />

                        {/* DATES */}
                        {opportunity.status == "Active" && (
                          <div className="flex flex-col text-sm text-gray-dark">
                            <div>
                              {opportunity.dateStart && (
                                <>
                                  <span className="mr-2 font-bold">
                                    Starts:
                                  </span>
                                  <span className="text-xs tracking-widest text-black">
                                    <Moment
                                      format={DATE_FORMAT_HUMAN}
                                      utc={true}
                                    >
                                      {opportunity.dateStart}
                                    </Moment>
                                  </span>
                                </>
                              )}
                            </div>
                            <div>
                              {opportunity.dateEnd && (
                                <>
                                  <span className="mr-2 font-bold">Ends:</span>
                                  <span className="text-xs tracking-widest text-black">
                                    <Moment
                                      format={DATE_FORMAT_HUMAN}
                                      utc={true}
                                    >
                                      {opportunity.dateEnd}
                                    </Moment>
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        )}

                        {/* BUTTONS */}
                        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
                          <div className="flex flex-grow flex-col gap-4 md:flex-row">
                            {opportunity.url && (
                              <button
                                type="button"
                                className="btn btn-sm h-10 w-full rounded-full bg-green normal-case text-white hover:bg-green-dark md:w-[250px]"
                                onClick={() =>
                                  setGotoOpportunityDialogVisible(true)
                                }
                              >
                                <Image
                                  src={iconOpen}
                                  alt="Icon Open"
                                  width={20}
                                  height={20}
                                  sizes="100vw"
                                  priority={true}
                                  style={{ width: "20px", height: "20px" }}
                                />

                                <span className="ml-1">Go to opportunity</span>
                              </button>
                            )}

                            {/* only show upload button if verification is enabled and method is manual */}
                            {opportunity.verificationEnabled &&
                              opportunity.verificationMethod == "Manual" && (
                                <>
                                  {/* only show completion button if start date has been reached,
                                   not yet completed or rejected */}
                                  {new Date(opportunity.dateStart) <
                                    new Date() &&
                                    (verificationStatus == null ||
                                      verificationStatus == undefined ||
                                      verificationStatus.status == "None" ||
                                      verificationStatus.status ==
                                        "Rejected") &&
                                    !verificationStatusIsLoading && (
                                      <button
                                        type="button"
                                        className="btn btn-sm h-10 w-full rounded-full border-green bg-white normal-case text-green hover:bg-green-dark hover:text-white md:w-[280px]"
                                        onClick={() =>
                                          user
                                            ? setCompleteOpportunityDialogVisible(
                                                true,
                                              )
                                            : setLoginDialogVisible(true)
                                        }
                                      >
                                        <Image
                                          src={iconUpload}
                                          alt="Icon Upload"
                                          width={20}
                                          height={20}
                                          sizes="100vw"
                                          priority={true}
                                          style={{
                                            width: "20px",
                                            height: "20px",
                                          }}
                                        />

                                        <span className="ml-1">
                                          Upload your completion files
                                        </span>
                                      </button>
                                    )}
                                  {verificationStatus &&
                                    verificationStatus.status == "Pending" && (
                                      <button
                                        type="button"
                                        className="btn btn-sm h-10 w-full rounded-full border-0 bg-gray-light normal-case text-gray-dark hover:bg-green-dark hover:text-white md:w-[250px]"
                                        onClick={() =>
                                          setCancelOpportunityDialogVisible(
                                            true,
                                          )
                                        }
                                      >
                                        Pending verification
                                        <IoMdClose className="ml-1 mt-[2px] h-4 w-4 text-gray-dark" />
                                      </button>
                                    )}

                                  {verificationStatus &&
                                    verificationStatus.status ==
                                      "Completed" && (
                                      <div className="md:text-md flex h-10 items-center justify-center rounded-full border border-purple bg-white px-4 text-center text-sm font-bold text-purple">
                                        Completed
                                        <IoMdCheckmark
                                          strikethroughThickness={2}
                                          overlineThickness={2}
                                          underlineThickness={2}
                                          className="ml-1 h-4 w-4 text-green"
                                        />
                                      </div>
                                    )}
                                </>
                              )}
                          </div>

                          <div className="flex justify-between gap-2 md:justify-end md:gap-4 lg:justify-end">
                            <button
                              type="button"
                              className={
                                "btn btn-sm h-10 w-full flex-shrink rounded-full border-gray-dark normal-case text-gray-dark md:w-[120px]" +
                                ` ${
                                  isOppSaved
                                    ? "border-yellow bg-yellow-light text-yellow"
                                    : "bg-white hover:bg-green-dark hover:text-white"
                                }`
                              }
                              onClick={onUpdateSavedOpportunity}
                              // ensure user is logged in and opportunity is published and active
                              // disabled={
                              //   !user ||
                              //   !(
                              //     opportunity?.published &&
                              //     opportunity?.status != "Inactive" &&
                              //     new Date(opportunity?.dateStart) > new Date()
                              //   )
                              // }
                            >
                              <IoMdBookmark
                                style={{ width: "20px", height: "20px" }}
                              />

                              <span className="ml-1">
                                {isOppSaved ? "Saved" : "Save"}
                              </span>
                            </button>

                            <button
                              type="button"
                              className="btn btn-sm h-10 w-1/2 flex-shrink rounded-full border-gray-dark bg-white normal-case text-gray-dark hover:bg-green-dark hover:text-white md:w-[120px]"
                              onClick={onShareOpportunity}
                              // ensure opportunity is published and active (user logged in check is done in function)
                              disabled={
                                !(
                                  opportunity?.published &&
                                  opportunity?.status == "Active"
                                )
                              }
                            >
                              <Image
                                src={iconShare}
                                alt="Icon Share"
                                width={20}
                                height={20}
                                sizes="100vw"
                                priority={true}
                                style={{ width: "20px", height: "20px" }}
                              />

                              <span className="ml-1">Share</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-4 md:flex-row">
                    <div className="flex-grow rounded-lg bg-white p-4 shadow-lg md:w-[66%] md:p-6">
                      <div style={{ whiteSpace: "pre-wrap" }}>
                        {opportunity?.description}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 rounded-lg shadow-lg md:w-[33%]">
                      <div className="flex flex-col gap-1 rounded-lg bg-white p-4 md:p-6">
                        <div>
                          <div className="mt-2 flex flex-row items-center gap-1 text-sm font-bold">
                            <Image
                              src={iconSkills}
                              alt="Icon Skills"
                              width={20}
                              height={20}
                              sizes="100vw"
                              priority={true}
                              style={{ width: "20px", height: "20px" }}
                            />

                            <span className="ml-1">Skills you will learn</span>
                          </div>
                          <div className="my-2 flex flex-wrap gap-1">
                            {opportunity?.skills?.map((item) => (
                              <div
                                key={item.id}
                                className="min-h-6 badge h-full bg-green py-1 text-white"
                              >
                                {item.name}
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="divider mt-2" />
                        <div>
                          <div className="flex flex-row items-center gap-1 text-sm font-bold">
                            <Image
                              src={iconClock}
                              alt="Icon Clock"
                              width={23}
                              height={23}
                              sizes="100vw"
                              priority={true}
                              style={{ width: "23px", height: "23px" }}
                            />

                            <span className="ml-1">
                              How much time you will need
                            </span>
                          </div>
                          {/* <div className="my-2 text-sm">{`This task should not take you more than ${opportunity?.commitmentIntervalCount} ${opportunity?.commitmentInterval}`}</div> */}
                          <div className="my-2 text-sm">
                            {`This task should not take you more than ${opportunity?.commitmentIntervalCount} ${opportunity?.commitmentInterval}${
                              opportunity?.commitmentIntervalCount > 1
                                ? "s. "
                                : ". "
                            }`}
                            <br />
                            <p className="mt-2">
                              The estimated times provided are just a guideline.
                              You have as much time as you need to complete the
                              tasks at your own pace. Focus on engaging with the
                              materials and doing your best without feeling
                              rushed by the time estimates.
                            </p>
                          </div>
                        </div>
                        <div className="divider mt-2" />
                        <div>
                          <div className="flex flex-row items-center gap-1 text-sm font-bold">
                            <Image
                              src={iconTopics}
                              alt="Icon Topics"
                              width={20}
                              height={20}
                              sizes="100vw"
                              priority={true}
                              style={{ width: "20px", height: "20px" }}
                            />

                            <span className="ml-1">Topics</span>
                          </div>
                          <div className="my-2 flex flex-wrap gap-1">
                            {opportunity?.categories?.map((item) => (
                              <div
                                key={item.id}
                                className="min-h-6 badge h-full rounded-md border-0 bg-green py-1 text-xs font-semibold text-white"
                              >
                                {item.name}
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="divider mt-2" />
                        <div>
                          <div className="flex flex-row items-center gap-1 text-sm font-bold">
                            <Image
                              src={iconLanguage}
                              alt="Icon Language"
                              width={20}
                              height={20}
                              sizes="100vw"
                              priority={true}
                              style={{ width: "20px", height: "20px" }}
                            />

                            <span className="ml-1">Languages</span>
                          </div>
                          <div className="my-2 flex flex-wrap gap-1">
                            {opportunity?.languages?.map((item) => (
                              <div
                                key={item.id}
                                className="min-h-6 badge h-full rounded-md border-0 bg-green py-1 text-xs font-semibold text-white"
                              >
                                {item.name}
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="divider mt-2" />
                        <div>
                          <div className="flex flex-row items-center gap-1 text-sm font-bold">
                            <Image
                              src={iconDifficulty}
                              alt="Icon Difficulty"
                              width={20}
                              height={20}
                              sizes="100vw"
                              priority={true}
                              style={{ width: "20px", height: "20px" }}
                            />

                            <span className="ml-1">Course difficulty</span>
                          </div>
                          <div className="my-2 text-sm">
                            {opportunity?.difficulty}
                          </div>
                        </div>
                        <div className="divider mt-1" />
                        <div>
                          <div className="flex flex-row items-center gap-1 text-sm font-bold">
                            <Image
                              src={iconLocation}
                              alt="Icon Location"
                              width={20}
                              height={20}
                              sizes="100vw"
                              priority={true}
                              style={{ width: "20px", height: "20px" }}
                            />

                            <span className="ml-1">Countries</span>
                          </div>
                          <div className="my-2 flex flex-wrap gap-1">
                            {opportunity?.countries?.map((country) => (
                              <div
                                key={country.id}
                                className="min-h-6 badge h-full rounded-md border-0 bg-green py-1 text-xs font-semibold text-white"
                              >
                                {country.name}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </>
      </div>
    </>
  );
};

OpportunityDetails.getLayout = function getLayout(page: ReactElement) {
  return <MainLayout>{page}</MainLayout>;
};

export default OpportunityDetails;
