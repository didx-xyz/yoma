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
  IoIosArrowBack,
  IoMdPause,
  IoMdPlay,
  IoMdBookmark,
} from "react-icons/io";
import type { NextPageWithLayout } from "~/pages/_app";
import ReactModal from "react-modal";
import iconUpload from "public/images/icon-upload.svg";
import iconOpen from "public/images/icon-open.svg";
import iconClock from "public/images/icon-clock.svg";
import iconUser from "public/images/icon-user.svg";
import iconZlto from "public/images/icon-zlto.svg";
import iconBookmark from "public/images/icon-bookmark.svg";
import iconShare from "public/images/icon-share.svg";
import iconDifficulty from "public/images/icon-difficulty.svg";
import iconLanguage from "public/images/icon-language.svg";
import iconTopics from "public/images/icon-topics.svg";
import iconSkills from "public/images/icon-skills.svg";
import iconBell from "public/images/icon-bell.webp";
import iconSmiley from "public/images/icon-smiley.webp";
import iconSuccess from "public/images/icon-success.webp";
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
import { RoundedImage } from "~/components/RoundedImage";
import { useRouter } from "next/router";

interface IParams extends ParsedUrlQuery {
  id: string;
  opportunityId: string;
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const { opportunityId } = context.params as IParams;
  const queryClient = new QueryClient(config);
  const session = await getServerSession(context.req, context.res, authOptions);

  let dataOpportunityInfo: OpportunityInfo | null = null;
  let dataVerificationStatus: MyOpportunityResponseVerify | null = null;

  try {
    // 👇 prefetch queries on server
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

    // 👇 perform viewed action
    if (dataOpportunityInfo.published)
      await performActionViewed(opportunityId, context);

    return {
      props: {
        dehydratedState: dehydrate(queryClient),
        user: session?.user ?? null,
        opportunityId: opportunityId,
      },
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 404) {
        // Return a 404 page if the status code is 404
        return {
          notFound: true,
          props: {}, // you can pass your error message here
        };
      }
      // other server errors will be thrown by the client queries
    }

    return {
      props: {
        dehydratedState: dehydrate(queryClient),
        user: session?.user ?? null,
        opportunityId: opportunityId,
      },
    };
  }
}

const OpportunityDetails: NextPageWithLayout<{
  opportunityId: string;
  user: User;
}> = ({ opportunityId, user }) => {
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
  const [isOppSaved, setIsOppSaved] = useState(false);
  const router = useRouter();

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

  // memo for spots left i.e participantLimit - participantCountTotal
  const spotsLeft = useMemo(() => {
    const participantLimit = opportunity?.participantLimit ?? 0;
    const participantCountTotal = opportunity?.participantCountTotal ?? 0;
    return Math.max(participantLimit - participantCountTotal, 0);
  }, [opportunity]);

  useEffect(() => {
    if (user) {
      isOpportunitySaved(opportunityId).then((res) => {
        setIsOppSaved(!!res);
      });
    }
  }, [user, isOppSaved, opportunityId]);

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

  return (
    <>
      <PageBackground />

      <div className="container z-10 mt-28 max-w-7xl px-2 py-4">
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
                <div className="flex-grow overflow-hidden text-ellipsis whitespace-nowrap text-sm">
                  <ul>
                    <li className="inline">
                      <button
                        className="text-white hover:text-gray"
                        onClick={() => router.back()}
                      >
                        <IoIosArrowBack className="mr-3 inline-block h-6 w-6 rounded-full bg-purple-shade pr-[2px]" />
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
                className={`fixed bottom-0 left-0 right-0 top-0 flex-grow overflow-hidden bg-white animate-in fade-in md:m-auto md:max-h-[480px] md:w-[600px] md:rounded-3xl`}
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
                  <div className="flex flex-col items-center justify-center gap-4 p-2 md:p-0">
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
                    <div className="mt-4 flex flex-grow justify-center gap-4">
                      <button
                        type="button"
                        className={
                          "btn rounded-full border-purple bg-white normal-case text-purple md:w-[250px]" +
                          `${
                            isOppSaved
                              ? " border-yellow bg-yellow-light text-yellow"
                              : ""
                          }`
                        }
                        onClick={onUpdateSavedOpportunity}
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
                        className="btn rounded-full bg-purple normal-case text-white md:w-[250px]"
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
                <div className="flex flex-col gap-2">
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
                    <div className="w-[450px] rounded-lg p-4 text-center">
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
                className={`fixed bottom-0 left-0 right-0 top-0 flex-grow overflow-y-scroll bg-white animate-in fade-in md:m-auto md:max-h-[450px] md:w-[600px] md:overflow-y-clip md:rounded-3xl`}
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
                    <div className="w-[450px] rounded-lg p-4 text-center">
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

              {opportunity && (
                <div className="flex flex-col gap-4">
                  <div className="relative flex flex-grow flex-row gap-1 rounded-lg bg-white p-6 shadow-lg">
                    <div className="flex flex-grow flex-col gap-1">
                      <div className="flex flex-grow flex-col">
                        <h4 className="text-2xl font-semibold text-black">
                          {opportunity.title}
                        </h4>

                        <h6 className="text-sm text-gray-dark">
                          By {opportunity.organizationName}
                        </h6>

                        {/* BADGES */}
                        <div className="my-2 flex flex-row gap-1 text-xs font-bold text-green-dark">
                          <div className="badge h-6 whitespace-nowrap rounded-md border-none bg-green-light text-green">
                            <Image
                              src={iconClock}
                              alt="Icon Clock"
                              width={20}
                              height={20}
                              sizes="100vw"
                              priority={true}
                              style={{ width: "20px", height: "20px" }}
                            />

                            <span className="ml-1 text-xs">{`${
                              opportunity.commitmentIntervalCount
                            } ${opportunity.commitmentInterval}${
                              opportunity.commitmentIntervalCount > 1 ? "s" : ""
                            }`}</span>
                          </div>
                          {spotsLeft > 0 && (
                            <div className="badge h-6 whitespace-nowrap rounded-md border-none bg-green-light text-green">
                              <Image
                                src={iconUser}
                                alt="Icon User"
                                width={18}
                                height={18}
                                sizes="100vw"
                                priority={true}
                                style={{ width: "18px", height: "18px" }}
                              />
                              <span className="ml-1 text-xs">
                                {spotsLeft} spots left
                              </span>
                            </div>
                          )}
                          {opportunity?.type && (
                            <div className="badge h-6 rounded-md border-none bg-[#E7E8F5] text-[#5F65B9]">
                              <Image
                                src={iconTopics}
                                alt="Icon Type"
                                width={18}
                                height={18}
                                sizes="100vw"
                                priority={true}
                                style={{ width: "18px", height: "18px" }}
                              />
                              <span className="ml-1 text-xs">
                                {opportunity.type}
                              </span>
                            </div>
                          )}
                          {(opportunity.zltoReward ?? 0) > 0 && (
                            <div className="badge h-6 whitespace-nowrap rounded-md border-none bg-yellow-light text-yellow">
                              <Image
                                src={iconZlto}
                                alt="Icon Zlto"
                                width={18}
                                height={18}
                                sizes="100vw"
                                priority={true}
                                style={{ width: "18px", height: "18px" }}
                              />
                              <span className="ml-1 text-xs">
                                {opportunity.zltoReward}
                              </span>
                            </div>
                          )}

                          {/* STATUS BADGES */}
                          {opportunity?.status == "Active" && (
                            <>
                              {new Date(opportunity.dateStart) > new Date() && (
                                <div className="badge h-6 rounded-md border-none bg-orange-light text-xs text-orange">
                                  <IoMdPause />
                                  <p className="ml-1">Not started</p>
                                </div>
                              )}
                              {new Date(opportunity.dateStart) < new Date() && (
                                <div className="badge h-6 rounded-md border-none bg-purple-soft text-xs font-semibold text-purple-shade">
                                  <IoMdPlay />
                                  <span className="ml-1">Started</span>
                                </div>
                              )}
                            </>
                          )}
                          {opportunity?.status == "Expired" && (
                            <div className="badge h-6 rounded-md border-none bg-red-100 text-xs font-semibold text-error">
                              <IoMdClose className="h-4 w-4" />
                              <span className="ml-1">Expired</span>
                            </div>
                          )}
                        </div>

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
                        <div className="mt-4 grid grid-cols-1 gap-2 lg:grid-cols-2">
                          <div className="flex flex-grow gap-4">
                            <button
                              type="button"
                              className="btn btn-xs rounded-full bg-green normal-case text-white md:btn-sm hover:bg-green-dark md:h-10 md:w-[250px]"
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
                                        className="btn btn-xs rounded-full border-green bg-white normal-case text-green md:btn-sm hover:bg-green-dark hover:text-white md:h-10"
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
                                        className="btn btn-xs rounded-full border-0 bg-gray-light normal-case text-gray-dark md:btn-sm hover:bg-green-dark hover:text-white md:h-10"
                                        onClick={() =>
                                          setCancelOpportunityDialogVisible(
                                            true,
                                          )
                                        }
                                      >
                                        Pending verification
                                        <IoMdClose className="ml-1 h-4 w-4 text-gray-dark" />
                                      </button>
                                    )}

                                  {verificationStatus &&
                                    verificationStatus.status ==
                                      "Completed" && (
                                      <div className="md:text-md flex items-center justify-center rounded-full border border-purple bg-white px-4 text-center text-xs font-bold text-purple">
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
                          <div className="flex gap-4 md:justify-end lg:justify-end">
                            <button
                              type="button"
                              // className="btn btn-xs border-gray-dark text-gray-dark md:btn-sm hover:bg-green-dark rounded-full bg-white normal-case hover:text-white md:h-10"
                              // className={`btn btn-xs border-gray-dark text-gray-dark md:btn-sm hover:bg-green-dark rounded-full bg-white normal-case hover:text-white md:h-10 ${
                              //   isOppSaved
                              //     ? "bg-green-dark text-white"
                              //     : "bg-yellow text-black"
                              // }`}
                              className={
                                "btn btn-xs rounded-full border-gray-dark normal-case text-gray-dark md:btn-sm md:h-10" +
                                ` ${
                                  isOppSaved
                                    ? "border-yellow bg-yellow-light text-yellow"
                                    : "bg-white hover:bg-green-dark hover:text-white"
                                }`
                              }
                              onClick={onUpdateSavedOpportunity}
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
                              className="btn btn-xs rounded-full border-gray-dark bg-white normal-case text-gray-dark md:btn-sm hover:bg-green-dark hover:text-white md:h-10"
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

                    {/* COMPANY LOGO */}
                    <RoundedImage
                      icon={opportunity?.organizationLogoURL ?? iconSuccess}
                      alt="Company Logo"
                      imageWidth={60}
                      imageHeight={60}
                    />
                  </div>

                  <div className="flex flex-col gap-4 md:flex-row">
                    <div className="flex-grow rounded-lg bg-white p-6 shadow-lg md:w-[66%]">
                      <div style={{ whiteSpace: "pre-wrap" }}>
                        {opportunity?.description}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 rounded-lg shadow-lg md:w-[33%]">
                      <div className="flex flex-col gap-1 rounded-lg bg-white p-6">
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
                          <div className="my-2 text-sm">{`This task should not take you more than ${opportunity?.commitmentIntervalCount} ${opportunity?.commitmentInterval}${
                            opportunity?.commitmentIntervalCount > 1 ? "s" : ""
                          }`}</div>
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
