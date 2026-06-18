import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { useAtomValue, useSetAtom } from "jotai";
import Image from "next/image";
import iconClock from "public/images/icon-clock.svg";
import iconDifficulty from "public/images/icon-difficulty.svg";
import iconLanguage from "public/images/icon-language.svg";
import iconLocation from "public/images/icon-location.svg";
import iconOpen from "public/images/icon-open.svg";
import iconSkills from "public/images/icon-skills.svg";
import iconSuccess from "public/images/icon-success.png";
import iconTopics from "public/images/icon-topics.svg";
import iconUpload from "public/images/icon-upload.svg";
import { useCallback, useEffect, useRef, useState } from "react";
import { FaExclamationTriangle, FaInfoCircle } from "react-icons/fa";
import { FcKey } from "react-icons/fc";
import {
  IoMdBookmark,
  IoMdCheckmark,
  IoMdClose,
  IoMdShare,
} from "react-icons/io";
import { toast } from "react-toastify";
import { SettingType } from "~/api/models/common";
import type { MyOpportunityResponseVerify } from "~/api/models/myOpportunity";
import { type OpportunityInfo } from "~/api/models/opportunity";
import {
  getVerificationStatus,
  isOpportunitySaved,
  performActionCancel,
  performActionNavigateExternalLink,
  removeMySavedOpportunity,
  saveMyOpportunity,
} from "~/api/services/myOpportunities";
import { updateSettings } from "~/api/services/user";
import { AvatarImage } from "~/components/AvatarImage";
import PublicBadges from "~/components/Opportunity/Badges/PublicBadges";
import ZltoRewardBadge from "~/components/Opportunity/Badges/ZltoRewardBadge";
import {
  getTypeConfig,
  OpportunityEngagementTypeBadge,
  OpportunityMetaTextRow,
  OpportunityOrgCountriesRow,
  OpportunityTypeBadge,
} from "~/components/Opportunity/opportunityTypeTheme";
import { OpportunityCompletionEdit } from "~/components/Opportunity/OpportunityCompletionEdit";
import Share from "~/components/Opportunity/Share";
import { SignInButton } from "~/components/SignInButton";
import { ApiErrors } from "~/components/Status/ApiErrors";
import { InternalServerError } from "~/components/Status/InternalServerError";
import { Loading } from "~/components/Status/Loading";
import { Unauthenticated } from "~/components/Status/Unauthenticated";
import { Unauthorized } from "~/components/Status/Unauthorized";
import { OPPORTUNITY_QUERY_KEYS } from "~/hooks/useOpportunityMutations";
import analytics from "~/lib/analytics";
import {
  OPPORTUNITY_DETAILS_DESIGN_V2,
  SETTING_USER_POPUP_LEAVINGYOMA,
} from "~/lib/constants";
import { userProfileAtom } from "~/lib/store";
import { type User } from "~/server/auth";
import CustomModal from "../Common/CustomModal";
import FormCheckbox from "../Common/FormCheckbox";
import { Editor } from "../RichText/Editor";

// this component is used by the public opportunity page,
// as well as the opportuntity preview on the Create/Edit Opportunity page
const OpportunityPublicDetails: React.FC<{
  user: User | null;
  opportunityInfo: OpportunityInfo;
  error?: number;
  preview: boolean;
}> = ({ user, opportunityInfo, error, preview }) => {
  const queryClient = useQueryClient();
  const hasTrackedView = useRef(false);
  // Per-type theming for the new (V2) details design (badge, CTA, accent).
  const typeConfig = getTypeConfig(opportunityInfo?.type);
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
  const [isLoading, setIsLoading] = useState(false);
  const userProfile = useAtomValue(userProfileAtom);
  const setUserProfile = useSetAtom(userProfileAtom);

  const { data: verificationStatus, isLoading: verificationStatusIsLoading } =
    useQuery<MyOpportunityResponseVerify | null>({
      queryKey: OPPORTUNITY_QUERY_KEYS.verificationStatus(opportunityInfo.id),
      queryFn: () => {
        if (
          !!user &&
          !!opportunityInfo &&
          opportunityInfo.verificationEnabled &&
          opportunityInfo.verificationMethod == "Manual"
        ) {
          return getVerificationStatus(opportunityInfo.id);
        } else return null;
      },
      enabled: !error && !preview,
    });

  useEffect(() => {
    if (!user) return;

    // ensure opportunity is published and status is not 'Inactive' (avoid API 400 error)
    if (!(opportunityInfo.published && opportunityInfo.status != "Inactive"))
      return;

    isOpportunitySaved(opportunityInfo.id).then((res) => {
      setIsOppSaved(!!res);
    });
  }, [user, isOppSaved, opportunityInfo]);

  // 👀 anonymous users: show login dialog (opportunity details are blurred)
  useEffect(() => {
    if (!user) {
      setLoginDialogVisible(true);
      return;
    }
  }, [user]);

  // 📊 ANALYTICS: track opportunity view (only once per component mount)
  useEffect(() => {
    if (!preview && opportunityInfo.id && !hasTrackedView.current) {
      analytics.opportunity.viewed(opportunityInfo.id, opportunityInfo.title);
      hasTrackedView.current = true;
    }
  }, [opportunityInfo.id, opportunityInfo.title, preview]);

  //#region Event Handlers
  const onUpdateSavedOpportunity = useCallback(() => {
    if (!user) {
      setLoginDialogVisible(true);
      analytics.trackEvent("opportunity_save_login_required", {
        opportunityId: opportunityInfo.id,
        opportunityTitle: opportunityInfo.title,
      });
      return;
    }

    if (isOppSaved) {
      removeMySavedOpportunity(opportunityInfo.id)
        .then(() => {
          setIsOppSaved(false);
          toast.success("Opportunity removed from saved");

          // 📊 ANALYTICS: track opportunity unsaved
          analytics.opportunity.unsaved(
            opportunityInfo.id,
            opportunityInfo.title,
          );
        })
        .catch((error) => {
          analytics.trackError(error as Error, {
            errorType: "opportunity_unsave_error",
            opportunityId: opportunityInfo.id,
          });

          toast(<ApiErrors error={error as AxiosError} />, {
            type: "error",
            autoClose: false,
            icon: false,
          });
        });
    } else {
      saveMyOpportunity(opportunityInfo.id)
        .then(() => {
          setIsOppSaved(true);
          toast.success("Opportunity saved");

          // 📊 ANALYTICS: track opportunity saved
          analytics.opportunity.saved(
            opportunityInfo.id,
            opportunityInfo.title,
          );
        })
        .catch((error) => {
          analytics.trackError(error as Error, {
            errorType: "opportunity_save_error",
            opportunityId: opportunityInfo.id,
          });

          toast(<ApiErrors error={error as AxiosError} />, {
            type: "error",
            autoClose: false,
            icon: false,
          });
        });
    }
  }, [opportunityInfo.id, opportunityInfo.title, user, isOppSaved]);

  const onProceedToOpportunity = useCallback(async () => {
    if (!opportunityInfo.url) return;

    // Open a blank tab immediately from the user-click handler to avoid popup blockers.
    // The tab will be navigated to the resolved URL once the API responds.
    const win = window.open("", "_blank");

    let redirectUrl = opportunityInfo.url;

    if (user && opportunityInfo.syncedInfo?.syncType === "Pull") {
      try {
        const result = await performActionNavigateExternalLink(
          opportunityInfo.id,
        );
        if (result?.url) redirectUrl = result.url;
      } catch {
        // fall back to opportunityInfo.url on error
      }
    }

    if (win) {
      win.location.href = redirectUrl;
    } else {
      window.open(redirectUrl, "_blank");
    }

    // 📊 ANALYTICS: track external link navigation
    analytics.opportunity.externalLinkClicked(
      opportunityInfo.id,
      opportunityInfo.title,
      redirectUrl,
    );
  }, [
    opportunityInfo.id,
    opportunityInfo.url,
    opportunityInfo.title,
    opportunityInfo.syncedInfo,
    user,
  ]);

  const onGoToOpportunity = useCallback(async () => {
    const settingDontShowAgain = userProfile?.settings?.items.find(
      (x) => x.key === SETTING_USER_POPUP_LEAVINGYOMA,
    )?.value;

    // 📊 ANALYTICS: track "Go to opportunity" button click
    analytics.trackEvent("opportunity_go_to_clicked", {
      opportunityId: opportunityInfo.id,
      opportunityTitle: opportunityInfo.title,
    });

    if (settingDontShowAgain) {
      await onProceedToOpportunity();
    } else {
      setGotoOpportunityDialogVisible(true);
    }
  }, [
    userProfile,
    onProceedToOpportunity,
    opportunityInfo.id,
    opportunityInfo.title,
  ]);

  const onOpportunityCompleted = useCallback(async () => {
    setCompleteOpportunityDialogVisible(false);
    setCompleteOpportunitySuccessDialogVisible(true);

    // 📊 ANALYTICS: track opportunity completion
    analytics.opportunity.completed(opportunityInfo.id, opportunityInfo.title);

    // invalidate queries
    await queryClient.invalidateQueries({
      queryKey: OPPORTUNITY_QUERY_KEYS.verificationStatus(opportunityInfo.id),
    });
  }, [opportunityInfo.id, opportunityInfo.title, queryClient]);

  const onOpportunityCancel = useCallback(async () => {
    setIsLoading(true);

    try {
      // call api
      await performActionCancel(opportunityInfo.id);

      // 📊 ANALYTICS: track opportunity cancellation
      analytics.opportunity.cancelled(
        opportunityInfo.id,
        opportunityInfo.title,
      );

      // invalidate queries
      await queryClient.invalidateQueries({
        queryKey: OPPORTUNITY_QUERY_KEYS.verificationStatus(opportunityInfo.id),
      });

      // toast
      toast.success("Your application has been canceled");

      setCancelOpportunityDialogVisible(false);
    } catch (error) {
      console.error(error);
      toast.error(
        "We're could not cancel your application at this time. Please try refreshing this page or try again later.",
        {
          autoClose: false,
        },
      );
    } finally {
      setIsLoading(false);
    }
  }, [opportunityInfo.id, opportunityInfo.title, queryClient]);

  const onShareOpportunity = useCallback(() => {
    setShareOpportunityDialogVisible(true);

    // 📊 ANALYTICS: track share dialog opened
    analytics.opportunity.shared(
      opportunityInfo.id,
      opportunityInfo.title,
      "dialog_opened",
    );
  }, [
    setShareOpportunityDialogVisible,
    opportunityInfo.id,
    opportunityInfo.title,
  ]);

  const onUpdateLeavingYomaSetting = useCallback(
    async (value: boolean) => {
      await updateSettings({
        settings: {
          [SETTING_USER_POPUP_LEAVINGYOMA]: value,
        },
      });

      // 📊 ANALYTICS: track "Don't show again" checkbox interaction
      analytics.trackEvent("opportunity_dont_show_again_toggled", {
        opportunityId: opportunityInfo.id,
        opportunityTitle: opportunityInfo.title,
        dontShowAgain: value,
        action: value ? "checked" : "unchecked",
      });

      // update this setting in the userprofile atom
      if (userProfile?.settings) {
        const setting = userProfile.settings.items.find(
          (x) => x.key === SETTING_USER_POPUP_LEAVINGYOMA,
        );

        if (setting) {
          setting.value = value;
        } else {
          userProfile.settings.items.push({
            key: SETTING_USER_POPUP_LEAVINGYOMA,
            type: SettingType.Boolean,
            value: value,
          });
        }

        // update atom
        setUserProfile(userProfile);
      }
    },
    [userProfile, setUserProfile, opportunityInfo.id, opportunityInfo.title],
  );
  //#endregion Event Handlers

  if (error) {
    if (error === 401) return <Unauthenticated />;
    else if (error === 403) return <Unauthorized />;
    else return <InternalServerError />;
  }

  return (
    <>
      {!preview && (
        <>
          {/* LOGIN DIALOG */}
          <CustomModal
            isOpen={loginDialogVisible}
            shouldCloseOnOverlayClick={false}
            onRequestClose={() => {
              setLoginDialogVisible(false);
            }}
            className="inset-2 top-1/2 right-auto bottom-auto left-1/2 h-[350px] w-[280px] -translate-x-1/2 -translate-y-1/2 rounded-2xl md:max-h-[350px] md:w-[600px]"
          >
            <div className="flex h-full flex-col gap-2 overflow-y-auto pb-8">
              <div className="bg-theme flex h-16 flex-row p-4 shadow-lg"></div>
              <div className="flex flex-col items-center justify-center gap-4 px-6 pb-8 text-center md:px-12">
                <div className="border-purple-dark -mt-8 flex items-center justify-center rounded-full bg-white p-2 shadow-lg">
                  <FcKey className="size-8 md:size-10" />
                </div>

                <div className="flex flex-col gap-2 text-center">
                  <div className="text-xl font-semibold tracking-wide md:text-2xl">
                    Login Required
                  </div>
                  <div className="md:text-md text-sm">
                    Please login to see this opportunity.
                  </div>
                </div>

                <div className="mt-8 flex grow gap-4">
                  <SignInButton className="md:w-[150px]" />
                </div>
              </div>
            </div>
          </CustomModal>

          {/* GO-TO OPPORTUNITY DIALOG */}
          <CustomModal
            isOpen={gotoOpportunityDialogVisible}
            shouldCloseOnOverlayClick={false}
            onRequestClose={() => {
              setGotoOpportunityDialogVisible(false);
            }}
            className={`md:max-h-[500px] md:w-[600px]`}
          >
            <div className="flex h-full flex-col gap-2 overflow-y-auto">
              <div className="bg-green flex flex-row p-4 shadow-lg">
                <h1 className="grow"></h1>
                <button
                  type="button"
                  className="btn btn-circle text-gray-dark hover:bg-gray"
                  onClick={() => {
                    setGotoOpportunityDialogVisible(false);
                  }}
                >
                  <IoMdClose className="h-6 w-6"></IoMdClose>
                </button>
              </div>

              <div className="flex flex-col items-center justify-center gap-4">
                <div className="border-green-dark -mt-11 flex h-18 w-18 items-center justify-center rounded-full bg-white shadow-lg">
                  <FaExclamationTriangle className="text-yellow h-8 w-8" />
                </div>

                <div className="w-full space-y-4 px-4 text-center">
                  <div className="font-semibold">You are now leaving Yoma!</div>
                  <div className="bg-gray mt-2 flex items-start gap-2 rounded-lg p-3 text-left text-sm">
                    <FaInfoCircle className="text-blue mt-0.5 h-4 w-4 shrink-0" />
                    <span>
                      You&apos;ll be redirected to{" "}
                      <strong>
                        {opportunityInfo?.syncedInfo?.partners?.[0]?.partner ??
                          opportunityInfo.organizationName}
                      </strong>{" "}
                      to continue this opportunity.{" "}
                      {opportunityInfo.syncedInfo?.syncType === "Pull" && (
                        <>
                          Your enrolment and completion may happen on their
                          platform, and Yoma will sync your completion where
                          supported.
                        </>
                      )}
                    </span>
                  </div>

                  {opportunityInfo.verificationEnabled &&
                    opportunityInfo.verificationMethod == "Manual" && (
                      <div className="mt-2 flex items-start gap-2 rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-left text-sm">
                        <FaExclamationTriangle className="text-yellow mt-0.5 h-4 w-4 shrink-0" />
                        <span>
                          Remember to{" "}
                          <strong>upload your completion certificate</strong> on
                          this page upon finishing to earn your achievement
                          {(opportunityInfo.zltoRewardEstimate ?? 0) > 0 && (
                            <>
                              {" "}
                              &amp;{" "}
                              <strong>
                                {opportunityInfo.zltoRewardEstimate} ZLTO
                              </strong>
                            </>
                          )}
                          .
                        </span>
                      </div>
                    )}

                  <div className="mt-2 flex items-start gap-2 rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-left text-sm">
                    <FaExclamationTriangle className="text-yellow mt-0.5 h-4 w-4 shrink-0" />
                    <span>
                      Be mindful of external sites&apos; privacy policy and keep
                      your data private.
                    </span>
                  </div>

                  <div className="text-gray-dark text-sm italic md:text-base">
                    <FormCheckbox
                      id="dontShowAgain"
                      label="Do not show this message again"
                      inputProps={{
                        onChange: (e) => {
                          onUpdateLeavingYomaSetting(e.target.checked).then(
                            () => null,
                          );
                        },
                      }}
                    />
                  </div>
                </div>

                <div className="my-3 flex w-full grow flex-col justify-center gap-4 px-4 md:flex-row">
                  <button
                    type="button"
                    className="btn bg-green hover:bg-green-dark order-first text-white normal-case md:order-last md:flex-1"
                    onClick={onProceedToOpportunity}
                    disabled={!opportunityInfo.url}
                  >
                    <Image
                      src={iconOpen}
                      alt="Icon Open"
                      width={20}
                      className="h-auto"
                      sizes="100vw"
                      priority={true}
                    />
                    <span className="ml-1">Proceed</span>
                  </button>

                  <button
                    type="button"
                    className={
                      "btn border-green text-green hover:bg-green-dark rounded-full bg-white normal-case hover:border-transparent hover:text-white md:flex-1" +
                      `${
                        isOppSaved
                          ? " bg-yellow-light text-yellow hover:bg-yellow-light hover:text-yellow border-none"
                          : ""
                      }`
                    }
                    onClick={onUpdateSavedOpportunity}
                  >
                    <IoMdBookmark size="20" />

                    <span className="ml-1">
                      {isOppSaved ? "Opportunty saved" : "Save opportunity"}
                    </span>
                  </button>

                  {/* <button
                    type="button"
                    className="btn border-green text-green hover:bg-green-dark order-last rounded-full bg-white normal-case hover:border-transparent hover:text-white md:order-first md:flex-1"
                    onClick={() => setGotoOpportunityDialogVisible(false)}
                  >
                    <IoMdClose size="20"></IoMdClose>
                    Close
                  </button> */}
                </div>
              </div>
            </div>
          </CustomModal>

          {/* UPLOAD/COMPLETE OPPORTUNITY DIALOG */}
          <CustomModal
            isOpen={completeOpportunityDialogVisible}
            shouldCloseOnOverlayClick={false}
            onRequestClose={() => {
              setCompleteOpportunityDialogVisible(false);
            }}
            className={`md:max-h-[900px] md:w-[700px]`}
          >
            <OpportunityCompletionEdit
              id="op-complete"
              opportunityInfo={opportunityInfo}
              onClose={() => {
                setCompleteOpportunityDialogVisible(false);
              }}
              onSave={onOpportunityCompleted}
            />
          </CustomModal>

          {/* COMPLETE SUCCESS DIALOG */}
          <CustomModal
            isOpen={completeOpportunitySuccessDialogVisible}
            shouldCloseOnOverlayClick={false}
            onRequestClose={() => {
              setCompleteOpportunitySuccessDialogVisible(false);
            }}
            className={`md:max-h-[410px] md:w-[600px]`}
          >
            <div className="flex w-full flex-col gap-2">
              <div className="bg-green flex flex-row p-4 shadow-lg">
                <h1 className="grow"></h1>
                <button
                  type="button"
                  className="btn btn-circle text-gray-dark hover:bg-gray"
                  onClick={() => {
                    setCompleteOpportunitySuccessDialogVisible(false);
                  }}
                >
                  <IoMdClose className="h-6 w-6"></IoMdClose>
                </button>
              </div>
              <div className="flex flex-col items-center justify-center gap-4">
                <div className="border-green-dark -mt-11 flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-full bg-white p-1 shadow-lg">
                  <Image
                    src={iconSuccess}
                    alt="Icon Success"
                    width={35}
                    className="h-auto"
                    sizes="100vw"
                    priority={true}
                  />
                </div>

                <h3>Your application has been submitted!</h3>

                <div className="rounded-lg p-4 text-center">
                  <strong>{opportunityInfo.organizationName}</strong> is busy
                  reviewing your submission. Once approved, the opportunity will
                  be automatically added to your CV. This may take between{" "}
                  <span className="text-blue decoration-blue font-bold text-nowrap underline decoration-2">
                    3-4 business days
                  </span>
                  .
                </div>
                <div className="mt-4 flex grow gap-4">
                  <button
                    type="button"
                    className="btn border-green text-green hover:bg-green-dark rounded-full bg-white normal-case hover:text-white md:w-[200px]"
                    onClick={() =>
                      setCompleteOpportunitySuccessDialogVisible(false)
                    }
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </CustomModal>

          {/* CANCEL OPPORTUNITY COMPLETION DIALOG */}
          <CustomModal
            isOpen={cancelOpportunityDialogVisible}
            shouldCloseOnOverlayClick={false}
            onRequestClose={() => {
              setCancelOpportunityDialogVisible(false);
            }}
            className={`md:max-h-[450px] md:w-[600px]`}
          >
            {isLoading && <Loading />}

            <div className="flex flex-col gap-2">
              <div className="bg-green flex flex-row p-4 shadow-lg">
                <h1 className="grow"></h1>
                <button
                  type="button"
                  className="btn btn-circle text-gray-dark hover:bg-gray"
                  onClick={() => {
                    setCancelOpportunityDialogVisible(false);
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
                  Your application is pending verification.
                </div>

                <div className="rounded-lg p-4 text-center md:w-[450px]">
                  <strong>{opportunityInfo.organizationName}</strong> is busy
                  reviewing your submission. Once approved, the opportunity will
                  be automatically added to your CV. If you would like to cancel
                  your application and delete all uploaded files, click the
                  button below.
                </div>
                <div className="mt-4 flex grow gap-4">
                  <button
                    type="button"
                    className="btn border-green text-green hover:bg-green-dark rounded-full bg-white normal-case hover:text-white md:w-[200px]"
                    onClick={onOpportunityCancel}
                    disabled={isLoading}
                  >
                    Cancel submission & Delete all files
                  </button>
                </div>
              </div>
            </div>
          </CustomModal>

          {/* SHARE OPPORTUNITY DIALOG */}
          {opportunityInfo && (
            <CustomModal
              isOpen={shareOpportunityDialogVisible}
              shouldCloseOnOverlayClick={false}
              onRequestClose={() => {
                setShareOpportunityDialogVisible(false);
              }}
              className={`md:max-h-[550px] md:w-[700px]`}
            >
              <Share
                opportunity={opportunityInfo}
                onClose={() => setShareOpportunityDialogVisible(false)}
              />
            </CustomModal>
          )}
        </>
      )}

      {opportunityInfo && (
        <div
          className={`flex flex-col gap-4 ${!preview && !user ? "blur-xs" : ""}`}
        >
          <div
            className={`relative flex grow flex-col rounded-lg bg-white p-4 shadow-lg md:p-6`}
            // className={`relative flex grow flex-col rounded-lg bg-white p-4 shadow-lg md:p-6 ${
            //   OPPORTUNITY_DETAILS_DESIGN_V2
            //     ? `border-t-4 ${typeConfig.accentClassName}`
            //     : ""
            // }`}
          >
            <div className="flex items-start gap-3">
              <div className="min-w-0 flex-1">
                <h4 className="font-family-nunito line-clamp-2 text-xl font-bold text-black md:text-2xl">
                  {opportunityInfo.title}
                </h4>

                {OPPORTUNITY_DETAILS_DESIGN_V2 ? (
                  <div className="mt-1">
                    <OpportunityOrgCountriesRow data={opportunityInfo} />
                  </div>
                ) : (
                  <h6 className="text-gray-dark mt-1 text-sm">
                    By {opportunityInfo.organizationName}
                  </h6>
                )}
              </div>

              <div className="shrink-0">
                <AvatarImage
                  icon={opportunityInfo.organizationLogoURL ?? null}
                  alt="Company Logo"
                  size={60}
                />
              </div>
            </div>

            {/* BADGES */}
            {OPPORTUNITY_DETAILS_DESIGN_V2 ? (
              <div className="mt-4 mb-2 flex flex-col gap-2 md:my-2">
                <div className="flex flex-row flex-wrap items-center gap-2">
                  <OpportunityTypeBadge
                    data={opportunityInfo}
                    className={typeConfig.badgeClassName}
                  />
                  <OpportunityEngagementTypeBadge
                    data={opportunityInfo}
                    className={"bg-gray-light text-gray-dark"}
                  />
                  {opportunityInfo.zltoRewardEstimate != null && (
                    <ZltoRewardBadge
                      amount={opportunityInfo.zltoRewardEstimate}
                      showToolTips={true}
                    />
                  )}
                </div>
                <OpportunityMetaTextRow data={opportunityInfo} />
              </div>
            ) : (
              <PublicBadges opportunity={opportunityInfo} showToolTips={true} />
            )}

            {/* BUTTONS */}
            <div className="mt-2 flex flex-col gap-4 md:flex-row">
              <div className="flex grow flex-col gap-4 md:flex-row">
                {opportunityInfo.url &&
                  opportunityInfo.status !== "Expired" && (
                    <button
                      type="button"
                      className={`btn btn-sm bg-green hover:bg-green-dark disabled:bg-green h-10 w-full rounded-full text-sm text-white normal-case md:w-[250px]`}
                      title="Clicking this button will take you to an external site to continue this opportunity. Remember to return to this page to upload your completion certificate and earn your achievement!"
                      // className={`btn btn-sm h-10 w-full rounded-full text-sm normal-case md:w-[250px] ${
                      //   OPPORTUNITY_DETAILS_DESIGN_V2
                      //     ? typeConfig.ctaClassName
                      //     : "bg-green hover:bg-green-dark disabled:bg-green text-white disabled:border-0 disabled:text-white"
                      // }`}
                      onClick={onGoToOpportunity}
                      disabled={preview}
                    >
                      <Image
                        src={iconOpen}
                        alt="Icon Open"
                        width={20}
                        className="h-auto"
                        sizes="100vw"
                        priority={true}
                      />

                      <span className="ml-1">
                        {OPPORTUNITY_DETAILS_DESIGN_V2
                          ? typeConfig.gotoExternalLinkButtonText
                          : "Go to opportunity"}
                      </span>
                    </button>
                  )}

                {/* only show upload button if verification is enabled and method is manual */}
                {opportunityInfo.verificationEnabled &&
                  opportunityInfo.verificationMethod == "Manual" && (
                    <>
                      {/* only show completion button if start date has been reached,
                      not yet completed or rejected */}
                      {new Date(opportunityInfo.dateStart) < new Date() &&
                        (verificationStatus == null ||
                          verificationStatus == undefined ||
                          verificationStatus.status == "None" ||
                          verificationStatus.status == "Rejected") &&
                        !opportunityInfo.participantLimitReached &&
                        !verificationStatusIsLoading && (
                          <button
                            type="button"
                            className="btn border-green text-green btn-sm hover:bg-green-dark h-10 w-full rounded-full bg-white text-sm normal-case hover:text-white md:w-[280px]"
                            title="Upload your completion files to earn your achievement and have this opportunity added to your CV."
                            onClick={() => {
                              // 📊 ANALYTICS: track "Upload completion files" button click
                              analytics.trackEvent(
                                "opportunity_upload_files_clicked",
                                {
                                  opportunityId: opportunityInfo.id,
                                  opportunityTitle: opportunityInfo.title,
                                },
                              );

                              if (user) {
                                setCompleteOpportunityDialogVisible(true);
                              } else {
                                setLoginDialogVisible(true);
                              }
                            }}
                          >
                            <Image
                              src={iconUpload}
                              alt="Icon Upload"
                              width={20}
                              className="h-auto"
                              sizes="100vw"
                              priority={true}
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
                            className="btn border-green text-green btn-sm hover:bg-green-dark h-10 w-full rounded-full bg-white text-sm normal-case hover:text-white md:w-[250px]"
                            title="Your submission is currently under review. If you would like to cancel your application and delete all uploaded files, click the button to see cancellation options."
                            onClick={() => {
                              // 📊 ANALYTICS: track "Pending verification" button click
                              analytics.trackEvent(
                                "opportunity_pending_verification_clicked",
                                {
                                  opportunityId: opportunityInfo.id,
                                  opportunityTitle: opportunityInfo.title,
                                },
                              );

                              setCancelOpportunityDialogVisible(true);
                            }}
                          >
                            Pending verification
                            <IoMdClose className="mt-[2px] ml-1 h-4 w-4" />
                          </button>
                        )}

                      {verificationStatus &&
                        verificationStatus.status == "Completed" && (
                          <div
                            className="md:text-md border-green text-green flex h-10 items-center justify-center rounded-full border bg-white px-4 text-center text-sm font-bold"
                            title="You have completed this opportunity!"
                          >
                            Completed
                            <IoMdCheckmark
                              strikethroughThickness={2}
                              overlineThickness={2}
                              underlineThickness={2}
                              className="ml-1 h-4 w-4"
                            />
                          </div>
                        )}
                    </>
                  )}
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  className={`btn btn-sm h-10 w-full shrink flex-nowrap rounded-full text-sm normal-case md:max-w-[120px] ${
                    isOppSaved
                      ? "border-yellow bg-yellow-light text-yellow"
                      : "border-green text-green hover:bg-green-dark bg-white hover:text-white"
                  }`}
                  title="Save this opportunity to easily find it later from your profile page."
                  onClick={onUpdateSavedOpportunity}
                  disabled={
                    !(
                      opportunityInfo.published &&
                      opportunityInfo.status == "Active"
                    ) || preview
                  }
                >
                  <IoMdBookmark className="mr-1 h-5 w-5" />

                  {isOppSaved ? "Saved" : "Save"}
                </button>

                <button
                  type="button"
                  className="btn border-green text-green btn-sm hover:bg-green-dark h-10 w-full shrink flex-nowrap rounded-full bg-white text-sm normal-case hover:text-white md:max-w-[120px]"
                  title="Share this opportunity with your friends and network to help more people discover it!"
                  onClick={onShareOpportunity}
                  // ensure opportunity is published and active (user logged in check is done in function)
                  disabled={
                    !(
                      opportunityInfo.published &&
                      opportunityInfo.status == "Active"
                    ) || preview
                  }
                >
                  <IoMdShare className="mr-1 h-5 w-5" />
                  Share
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4 md:flex-row">
            <div className="grow rounded-lg bg-white p-2 shadow-lg md:w-[66%]">
              <Editor value={opportunityInfo.description} readonly={true} />
            </div>
            <div className="flex flex-col gap-2 rounded-lg shadow-lg md:w-[33%]">
              <div className="divide-gray flex flex-col divide-y rounded-lg bg-white p-4 md:p-6">
                {(opportunityInfo.skills?.length ?? 0) > 0 && (
                  <div className="pb-4 first:pt-0 last:pb-0">
                    <div className="mt-2 flex flex-row items-center gap-1 text-sm font-bold">
                      <Image
                        src={iconSkills}
                        alt="Icon Skills"
                        width={20}
                        className="h-auto"
                        sizes="100vw"
                        priority={true}
                      />
                      <span className="ml-1">Skills you will learn</span>
                    </div>
                    <div className="my-2 flex flex-wrap gap-1">
                      {opportunityInfo.skills?.map((item) => (
                        <div
                          key={item.id}
                          className="badge bg-green px-2 py-1 text-white"
                        >
                          {item.name}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {opportunityInfo.commitmentIntervalCount != null &&
                  opportunityInfo.commitmentInterval && (
                    <div className="py-4 first:pt-0 last:pb-0">
                      <div className="flex flex-row items-center gap-1 text-sm font-bold">
                        <Image
                          src={iconClock}
                          alt="Icon Clock"
                          width={23}
                          className="h-auto"
                          sizes="100vw"
                          priority={true}
                        />

                        <span className="ml-1">
                          How much time you will need
                        </span>
                      </div>

                      <div className="my-2 text-sm">
                        {`This task should not take you more than ${
                          opportunityInfo.commitmentIntervalCount
                        } ${opportunityInfo.commitmentInterval}${
                          opportunityInfo.commitmentIntervalCount > 1
                            ? "s. "
                            : ". "
                        }`}
                        <br />
                        <p className="mt-2">
                          The estimated times provided are just a guideline. You
                          have as much time as you need to complete the tasks at
                          your own pace. Focus on engaging with the materials
                          and doing your best without feeling rushed by the time
                          estimates.
                        </p>
                      </div>
                    </div>
                  )}
                {(opportunityInfo.categories?.length ?? 0) > 0 && (
                  <div className="py-4 first:pt-0 last:pb-0">
                    <div className="flex flex-row items-center gap-1 text-sm font-bold">
                      <Image
                        src={iconTopics}
                        alt="Icon Topics"
                        width={20}
                        className="h-auto"
                        sizes="100vw"
                        priority={true}
                      />

                      <span className="ml-1">Topics</span>
                    </div>
                    <div className="my-2 flex flex-wrap gap-1">
                      {opportunityInfo.categories?.map((item) => (
                        <div
                          key={item.id}
                          className="badge bg-green h-full min-h-6 rounded-md border-0 py-1 text-xs font-semibold text-white"
                        >
                          {item.name}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {(opportunityInfo.languages?.length ?? 0) > 0 && (
                  <div className="py-4 first:pt-0 last:pb-0">
                    <div className="flex flex-row items-center gap-1 text-sm font-bold">
                      <Image
                        src={iconLanguage}
                        alt="Icon Language"
                        width={20}
                        className="h-auto"
                        sizes="100vw"
                        priority={true}
                      />

                      <span className="ml-1">Languages</span>
                    </div>
                    <div className="my-2 flex flex-wrap gap-1">
                      {opportunityInfo.languages?.map((item) => (
                        <div
                          key={item.id}
                          className="badge bg-green h-full min-h-6 rounded-md border-0 py-1 text-xs font-semibold text-white"
                        >
                          {item.name}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {!!opportunityInfo.difficulty && (
                  <div className="py-4 first:pt-0 last:pb-0">
                    <div className="flex flex-row items-center gap-1 text-sm font-bold">
                      <Image
                        src={iconDifficulty}
                        alt="Icon Difficulty"
                        width={20}
                        className="h-auto"
                        sizes="100vw"
                        priority={true}
                      />

                      <span className="ml-1">Course difficulty</span>
                    </div>
                    <div className="my-2 text-sm">
                      {opportunityInfo.difficulty}
                    </div>
                  </div>
                )}
                {(opportunityInfo.countries?.length ?? 0) > 0 && (
                  <div className="pt-4 first:pt-0">
                    <div className="flex flex-row items-center gap-1 text-sm font-bold">
                      <Image
                        src={iconLocation}
                        alt="Icon Location"
                        width={20}
                        className="h-auto"
                        sizes="100vw"
                        priority={true}
                      />

                      <span className="ml-1">Countries</span>
                    </div>
                    <div className="my-2 flex flex-wrap gap-1">
                      {opportunityInfo.countries?.map((country) => (
                        <div
                          key={country.id}
                          className="badge bg-green h-full min-h-6 rounded-md border-0 py-1 text-xs font-semibold text-white"
                        >
                          {country.name}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default OpportunityPublicDetails;
