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
import { useCallback, useEffect, useState } from "react";
import { FaExclamationTriangle } from "react-icons/fa";
import { FcKey } from "react-icons/fc";
import {
  IoMdBookmark,
  IoMdCheckmark,
  IoMdClose,
  IoMdShare,
} from "react-icons/io";
import Moment from "react-moment";
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
import { OpportunityCompletionEdit } from "~/components/Opportunity/OpportunityCompletionEdit";
import Share from "~/components/Opportunity/Share";
import { SignInButton } from "~/components/SignInButton";
import { ApiErrors } from "~/components/Status/ApiErrors";
import { InternalServerError } from "~/components/Status/InternalServerError";
import { Unauthenticated } from "~/components/Status/Unauthenticated";
import { Unauthorized } from "~/components/Status/Unauthorized";
import {
  DATE_FORMAT_HUMAN,
  GA_ACTION_OPPORTUNITY_CANCELED,
  GA_ACTION_OPPORTUNITY_COMPLETED,
  GA_ACTION_OPPORTUNITY_FOLLOWEXTERNAL,
  GA_CATEGORY_OPPORTUNITY,
  SETTING_USER_POPUP_LEAVINGYOMA,
} from "~/lib/constants";
import { trackGAEvent } from "~/lib/google-analytics";
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
  const userProfile = useAtomValue(userProfileAtom);
  const setUserProfile = useSetAtom(userProfileAtom);

  const { data: verificationStatus, isLoading: verificationStatusIsLoading } =
    useQuery<MyOpportunityResponseVerify | null>({
      queryKey: ["verificationStatus", opportunityInfo.id],
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

  //#region Event Handlers
  const onUpdateSavedOpportunity = useCallback(() => {
    if (!user) {
      setLoginDialogVisible(true);
      return;
    }

    if (isOppSaved) {
      removeMySavedOpportunity(opportunityInfo.id)
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
      saveMyOpportunity(opportunityInfo.id)
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
  }, [opportunityInfo.id, user, isOppSaved]);

  const onProceedToOpportunity = useCallback(async () => {
    if (!opportunityInfo.url) return;

    window.open(opportunityInfo.url, "_blank");

    // record action if user is logged in
    if (user) {
      await performActionNavigateExternalLink(opportunityInfo.id);
    }

    // 📊 GOOGLE ANALYTICS: track event
    trackGAEvent(
      GA_CATEGORY_OPPORTUNITY,
      GA_ACTION_OPPORTUNITY_FOLLOWEXTERNAL,
      opportunityInfo.url,
    );
  }, [opportunityInfo.id, opportunityInfo.url, user]);

  const onGoToOpportunity = useCallback(async () => {
    const settingDontShowAgain = userProfile?.settings?.items.find(
      (x) => x.key === SETTING_USER_POPUP_LEAVINGYOMA,
    )?.value;

    if (settingDontShowAgain) await onProceedToOpportunity();
    else setGotoOpportunityDialogVisible(true);
  }, [userProfile, onProceedToOpportunity]);

  const onOpportunityCompleted = useCallback(async () => {
    setCompleteOpportunityDialogVisible(false);
    setCompleteOpportunitySuccessDialogVisible(true);

    // 📊 GOOGLE ANALYTICS: track event
    trackGAEvent(GA_CATEGORY_OPPORTUNITY, GA_ACTION_OPPORTUNITY_COMPLETED, "");

    // invalidate queries
    await queryClient.invalidateQueries({
      queryKey: ["verificationStatus", opportunityInfo.id],
    });
  }, [opportunityInfo.id, queryClient]);

  const onOpportunityCancel = useCallback(async () => {
    // call api
    await performActionCancel(opportunityInfo.id);

    // 📊 GOOGLE ANALYTICS: track event
    trackGAEvent(GA_CATEGORY_OPPORTUNITY, GA_ACTION_OPPORTUNITY_CANCELED, "");

    // invalidate queries
    await queryClient.invalidateQueries({
      queryKey: ["verificationStatus", opportunityInfo.id],
    });

    // toast
    toast.success("Your application has been canceled");

    setCancelOpportunityDialogVisible(false);
  }, [opportunityInfo.id, queryClient]);

  const onShareOpportunity = useCallback(() => {
    setShareOpportunityDialogVisible(true);
  }, [setShareOpportunityDialogVisible]);

  const onUpdateLeavingYomaSetting = useCallback(
    async (value: boolean) => {
      await updateSettings({
        settings: {
          [SETTING_USER_POPUP_LEAVINGYOMA]: value,
        },
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
    [userProfile, setUserProfile],
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
            className={`md:max-h-[350px] md:w-[500px]`}
          >
            <div className="flex h-full flex-col gap-2 overflow-y-auto pb-8">
              <div className="flex flex-row bg-green p-4 shadow-lg">
                <h1 className="flex-grow"></h1>
                <button
                  type="button"
                  className="btn rounded-full border-0 bg-white p-3 text-gray-dark hover:bg-gray"
                  onClick={() => {
                    setLoginDialogVisible(false);
                  }}
                >
                  <IoMdClose className="h-6 w-6"></IoMdClose>
                </button>
              </div>
              <div className="flex flex-col items-center justify-center gap-4">
                <div className="-mt-8 flex h-12 w-12 animate-bounce-once items-center justify-center rounded-full bg-white shadow-lg">
                  <FcKey className="mr-px h-7 w-7 text-white" />
                </div>

                <h5 className="animate-bounce-once">
                  Please sign-in to continue
                </h5>

                <div className="mt-8 flex flex-grow gap-4">
                  <button
                    type="button"
                    className="btn rounded-full border-purple bg-white normal-case text-purple md:w-[150px]"
                    onClick={() => setLoginDialogVisible(false)}
                  >
                    <IoMdClose className="h-5 w-5 text-purple" /> Cancel
                  </button>

                  <SignInButton className="btn transform gap-2 border-0 border-none bg-purple px-4 shadow-lg transition-all duration-300 ease-in-out hover:bg-purple-light hover:brightness-95 disabled:animate-pulse disabled:!cursor-wait disabled:bg-purple-light md:w-[150px]" />
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
            <div className="pb-10x flex h-full flex-col gap-2 overflow-y-auto">
              <div className="flex flex-row bg-green p-4 shadow-lg">
                <h1 className="flex-grow"></h1>
                <button
                  type="button"
                  className="btn rounded-full border-0 bg-white p-3 text-gray-dark hover:bg-gray"
                  onClick={() => {
                    setGotoOpportunityDialogVisible(false);
                  }}
                >
                  <IoMdClose className="h-6 w-6"></IoMdClose>
                </button>
              </div>
              <div className="flex flex-col items-center justify-center gap-4 p-4 md:p-0">
                <div className="-mt-8 flex h-12 w-12 items-center justify-center rounded-full border-green-dark bg-white shadow-lg">
                  <FaExclamationTriangle className="h-7 w-7 text-yellow" />
                </div>

                <h3 className="animate-bounce-once">
                  You are now leaving Yoma!
                </h3>

                <div className="mt-4 rounded-lg bg-gray p-4 text-center md:w-[450px]">
                  Remember to{" "}
                  <strong>upload your completion certificate</strong> on this
                  page upon finishing to <strong>earn your ZLTO</strong>.
                </div>

                <div className="text-center md:w-[450px]">
                  Be mindful of external sites&apos; privacy policy and keep
                  your data private.
                </div>

                {user && (
                  <div className="italic text-gray-dark">
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
                )}

                <div className="mt-6 flex w-full flex-grow flex-col justify-center gap-4 md:flex-row">
                  {user && (
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
                    >
                      <IoMdBookmark style={{ width: "20px", height: "20px" }} />

                      <span className="ml-1">
                        {isOppSaved ? "Opportunty saved" : "Save opportunity"}
                      </span>
                    </button>
                  )}

                  <button
                    type="button"
                    className="btn btn-primary normal-case text-white md:w-[250px]"
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
            animationStyle="spin"
          >
            <div className="flex w-full flex-col gap-2">
              <div className="flex flex-row bg-green p-4 shadow-lg">
                <h1 className="flex-grow"></h1>
                <button
                  type="button"
                  className="btn rounded-full border-0 bg-white p-3 text-gray-dark hover:bg-gray"
                  onClick={() => {
                    setCompleteOpportunitySuccessDialogVisible(false);
                  }}
                >
                  <IoMdClose className="h-6 w-6"></IoMdClose>
                </button>
              </div>
              <div className="flex flex-col items-center justify-center gap-4">
                <div className="-mt-11 flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-full border-green-dark bg-white p-1 shadow-lg">
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

                <div className="rounded-lg p-4 text-center md:w-[450px]">
                  <strong>{opportunityInfo.organizationName}</strong> is busy
                  reviewing your submission. Once approved, the opportunity will
                  be automatically added to your CV. This may take between{" "}
                  <span className="font-bold text-blue underline decoration-blue decoration-2">
                    3-4 business days
                  </span>
                  .
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
            <div className="flex flex-col gap-2">
              <div className="flex flex-row bg-green p-4 shadow-lg">
                <h1 className="flex-grow"></h1>
                <button
                  type="button"
                  className="btn rounded-full border-0 bg-white p-3 text-gray-dark hover:bg-gray"
                  onClick={() => {
                    setCancelOpportunityDialogVisible(false);
                  }}
                >
                  <IoMdClose className="h-6 w-6"></IoMdClose>
                </button>
              </div>
              <div className="flex flex-col items-center justify-center gap-4">
                <div className="-mt-8 flex h-12 w-12 items-center justify-center rounded-full border-green-dark bg-white shadow-lg">
                  <FaExclamationTriangle className="h-7 w-7 text-yellow" />
                </div>

                <h3 className="animate-bounce-once">
                  Your application is pending verification.
                </h3>

                <div className="rounded-lg p-4 text-center md:w-[450px]">
                  <strong>{opportunityInfo.organizationName}</strong> is busy
                  reviewing your submission. Once approved, the opportunity will
                  be automatically added to your CV. If you would like to cancel
                  your application and delete all uploaded files, click the
                  button below.
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
          </CustomModal>

          {/* SHARE OPPORTUNITY DIALOG */}
          {opportunityInfo && (
            <CustomModal
              isOpen={shareOpportunityDialogVisible}
              shouldCloseOnOverlayClick={false}
              onRequestClose={() => {
                setShareOpportunityDialogVisible(false);
              }}
              className={`md:max-h-[520px] md:w-[700px]`}
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
        <div className="flex flex-col gap-4">
          <div className="relative flex flex-grow flex-row gap-1 rounded-lg bg-white p-4 shadow-lg md:p-6">
            <div className="flex flex-grow flex-col gap-1">
              <div className="flex flex-grow flex-col">
                <div className="relative flex justify-start">
                  <h4 className="max-w-[215px] text-xl font-semibold leading-7 text-black md:max-w-[1125px] md:text-2xl md:leading-8">
                    {opportunityInfo.title}
                  </h4>
                  <div className="absolute -right-2 -top-2 md:right-0 md:top-0">
                    <AvatarImage
                      icon={opportunityInfo.organizationLogoURL ?? null}
                      alt="Company Logo"
                      size={60}
                    />
                  </div>
                </div>

                <h6 className="max-w-[215px] text-sm text-gray-dark md:max-w-[1125px]">
                  By {opportunityInfo.organizationName}
                </h6>

                {/* BADGES */}
                <PublicBadges opportunity={opportunityInfo} />

                {/* DATES */}
                {opportunityInfo.status == "Active" && (
                  <div className="flex flex-col text-sm text-gray-dark">
                    <div>
                      {opportunityInfo.dateStart && (
                        <>
                          <span className="mr-2 font-bold">Starts:</span>
                          <span className="text-xs tracking-widest text-black">
                            <Moment format={DATE_FORMAT_HUMAN} utc={true}>
                              {opportunityInfo.dateStart}
                            </Moment>
                          </span>
                        </>
                      )}
                    </div>
                    <div>
                      {opportunityInfo.dateEnd && (
                        <>
                          <span className="mr-2 font-bold">Ends:</span>
                          <span className="text-xs tracking-widest text-black">
                            <Moment format={DATE_FORMAT_HUMAN} utc={true}>
                              {opportunityInfo.dateEnd}
                            </Moment>
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* BUTTONS */}
                <div className="mt-4 flex flex-col gap-4 md:flex-row">
                  <div className="flex flex-grow flex-col gap-4 md:flex-row">
                    {opportunityInfo.url &&
                      opportunityInfo.status !== "Expired" && (
                        <button
                          type="button"
                          className="btn btn-sm h-10 w-full rounded-full bg-green normal-case text-white hover:bg-green-dark disabled:border-0 disabled:bg-green disabled:text-white md:w-[250px]"
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

                          <span className="ml-1">Go to opportunity</span>
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
                                className="btn btn-sm h-10 w-full rounded-full border-green bg-white normal-case text-green hover:bg-green-dark hover:text-white md:w-[280px]"
                                onClick={() =>
                                  user
                                    ? setCompleteOpportunityDialogVisible(true)
                                    : setLoginDialogVisible(true)
                                }
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
                                className="btn btn-sm h-10 w-full rounded-full border-0 bg-gray-light normal-case text-gray-dark hover:bg-green-dark hover:text-white md:w-[250px]"
                                onClick={() =>
                                  setCancelOpportunityDialogVisible(true)
                                }
                              >
                                Pending verification
                                <IoMdClose className="ml-1 mt-[2px] h-4 w-4 text-gray-dark" />
                              </button>
                            )}

                          {verificationStatus &&
                            verificationStatus.status == "Completed" && (
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

                  <div className="flex gap-2">
                    <button
                      type="button"
                      className={
                        "btn btn-sm h-10 w-full flex-shrink flex-nowrap rounded-full border-gray-dark normal-case text-gray-dark disabled:text-gray-dark md:max-w-[120px] " +
                        ` ${
                          isOppSaved
                            ? "border-yellow bg-yellow-light text-yellow"
                            : "bg-white hover:bg-green-dark hover:text-white"
                        }`
                      }
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
                      className="btn btn-sm h-10 w-full flex-shrink flex-nowrap rounded-full border-gray-dark bg-white normal-case text-gray-dark hover:bg-green-dark hover:text-white disabled:text-gray-dark md:max-w-[120px]"
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
            </div>
          </div>

          <div className="flex flex-col gap-4 md:flex-row">
            <div className="flex-grow rounded-lg bg-white p-2 shadow-lg md:w-[66%]">
              <Editor value={opportunityInfo.description} readonly={true} />
            </div>
            <div className="flex flex-col gap-2 rounded-lg shadow-lg md:w-[33%]">
              <div className="flex flex-col gap-1 rounded-lg bg-white p-4 md:p-6">
                <div>
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
                <div className="divider mt-2" />
                <div>
                  <div className="flex flex-row items-center gap-1 text-sm font-bold">
                    <Image
                      src={iconClock}
                      alt="Icon Clock"
                      width={23}
                      className="h-auto"
                      sizes="100vw"
                      priority={true}
                    />

                    <span className="ml-1">How much time you will need</span>
                  </div>

                  <div className="my-2 text-sm">
                    {`This task should not take you more than ${
                      opportunityInfo.commitmentIntervalCount
                    } ${opportunityInfo.commitmentInterval}${
                      opportunityInfo.commitmentIntervalCount > 1 ? "s. " : ". "
                    }`}
                    <br />
                    <p className="mt-2">
                      The estimated times provided are just a guideline. You
                      have as much time as you need to complete the tasks at
                      your own pace. Focus on engaging with the materials and
                      doing your best without feeling rushed by the time
                      estimates.
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
                        className="badge h-full min-h-6 rounded-md border-0 bg-green py-1 text-xs font-semibold text-white"
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
                        className="badge h-full min-h-6 rounded-md border-0 bg-green py-1 text-xs font-semibold text-white"
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
                <div className="divider mt-1" />
                <div>
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
                        className="badge h-full min-h-6 rounded-md border-0 bg-green py-1 text-xs font-semibold text-white"
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
  );
};

export default OpportunityPublicDetails;
