import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { useAtomValue, useSetAtom } from "jotai";
import { useRouter } from "next/router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FaExclamationTriangle, FaInfoCircle } from "react-icons/fa";
import { FcKey } from "react-icons/fc";
import {
  IoMdBookmark,
  IoMdCheckmark,
  IoMdClose,
  IoMdOpen,
  IoMdShare,
  IoMdWarning,
} from "react-icons/io";
import {
  IoAlertCircleOutline,
  IoArrowUp,
  IoBalloon,
  IoBulbOutline,
  IoClose,
  IoIdCardOutline,
  IoLanguageOutline,
  IoLocationOutline,
  IoPricetagsOutline,
  IoShieldCheckmarkOutline,
  IoSparkles,
  IoStorefrontOutline,
  IoTimeOutline,
  IoTrashOutline,
  IoWalletOutline,
} from "react-icons/io5";
import Link from "next/link";
import moment from "moment";
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
import { BTN_OUTLINE_GREEN } from "~/components/Common/buttonStyles";
import { DialogStep } from "~/components/Common/DialogStep";
import ZltoRewardBadge from "~/components/Opportunity/Badges/ZltoRewardBadge";
import {
  getCommitmentDisplay,
  getTypeConfig,
  OpportunityEngagementTypeBadge,
  OpportunityMetaTextRow,
  OpportunityOrgCountriesRow,
  OpportunityTypeBadge,
} from "~/components/Opportunity/opportunityTypeTheme";
import {
  typeBadgeClass,
  typeBandClass,
  typeOutlineClass,
} from "~/lib/typeColours";
import { OpportunityCompletionEdit } from "~/components/Opportunity/OpportunityCompletionEdit";
import {
  DIALOG_BODY,
  DIALOG_CLOSE,
  DIALOG_EYEBROW,
  DIALOG_HEADING,
  DIALOG_ICON_CIRCLE,
  DIALOG_PRIMARY,
  DIALOG_SECONDARY,
} from "~/components/Opportunity/dialog";
import { OpportunityCoreDetails } from "~/components/Opportunity/OpportunityCoreDetails";
import { DetailHeaderCard } from "~/components/Opportunity/TabbedDetails/DetailHeaderCard";
import { TONE } from "~/components/Opportunity/TabbedDetails/DetailDisclosure";
import { OpportunityDetailSections } from "~/components/Opportunity/TabbedDetails/OpportunityDetailSections";
import { isCashOutClosed } from "~/components/Opportunity/TabbedDetails/detailSectionCopy";
import { OpportunityCustomFieldsSection } from "~/components/Opportunity/OpportunityCustomFieldsSection";
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
  CUSTOM_FIELDS_ENABLED,
  DATE_FORMAT_HUMAN,
  OPPORTUNITY_TYPE_NANE_JOB,
  SETTING_USER_POPUP_LEAVINGYOMA,
} from "~/lib/constants";
import { userProfileAtom } from "~/lib/store";
import { useConfirmationModalContext } from "~/context/modalConfirmationContext";
import { isUserProfileCompleted } from "~/lib/utils/profile";
import { type User } from "~/server/auth";
import CustomModal from "../Common/CustomModal";
import DetailSection from "../Common/DetailSection";
import FormCheckbox from "../Common/FormCheckbox";
import { Editor } from "../RichText/Editor";

// 🔐 actions that anonymous users may attempt, but that require an authenticated user.
// the action is round-tripped through login (see RETURN_ACTION_PARAM) so it can be resumed afterwards
type LoginRequiredAction = "go" | "save" | "complete";

const LOGIN_REQUIRED_ACTIONS: LoginRequiredAction[] = [
  "go",
  "save",
  "complete",
];

// query string parameter used to resume the action the user attempted whilst anonymous
const RETURN_ACTION_PARAM = "returnAction";

const LOGIN_REQUIRED_MESSAGES: Record<LoginRequiredAction, string> = {
  go: "Please login or register to continue to this opportunity. Your participation and rewards are linked to your Yoma account.",
  save: "Please login or register to save this opportunity to your profile.",
  complete:
    "Please login or register to upload your completion files for this opportunity.",
};

// this component is used by the public opportunity page,
// as well as the opportuntity preview on the Create/Edit Opportunity page
const OpportunityPublicDetails: React.FC<{
  user: User | null;
  opportunityInfo: OpportunityInfo;
  error?: number;
  preview: boolean;
  /**
   * `tabbed` = the round-7 single-column layout (anchor tabs, sticky bar, disclosure sections,
   * `TabbedDetails/`); `classic` = the two-column layout before it. Same actions, dialogs and
   * rules; only the body (and the header's button arrangement) changes.
   *
   * Default: the release kill-switch picks it (2026-10-01, Jason) — `CUSTOM_FIELDS_ENABLED`
   * on → tabbed, off → classic — so the public page and the editor preview follow the flag
   * from this one place.
   */
  layout?: "classic" | "tabbed";
}> = ({
  user,
  opportunityInfo,
  error,
  preview,
  layout = CUSTOM_FIELDS_ENABLED ? "tabbed" : "classic",
}) => {
  const queryClient = useQueryClient();
  const modalContext = useConfirmationModalContext();
  const router = useRouter();
  const hasTrackedView = useRef(false);
  const hasResumedActionRef = useRef(false);
  const headerCardRef = useRef<HTMLDivElement>(null);
  // The type's labels and CTA copy; its colours come from `lib/typeColours`.
  const typeConfig = getTypeConfig(opportunityInfo?.type);
  // The completion dialogs' icon circle: the type's band tint with the icon in the type colour.
  const typeTint = `${typeBandClass(opportunityInfo?.type)} ${typeOutlineClass(opportunityInfo?.type)}`;
  const [loginDialogVisible, setLoginDialogVisible] = useState(false);
  const [loginDialogAction, setLoginDialogAction] =
    useState<LoginRequiredAction | null>(null);
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
  // 🔐 `user` is server-rendered (getServerSideProps), but userProfile is fetched client-side
  // by Global.tsx, so there is a window on every page load where the user is logged in and
  // the profile is still null. Treat "not loaded yet" as "not usable" so the partner hand-off
  // fails closed rather than slipping through that window.
  // Note: isUserProfileCompleted returns null (not false) for a null profile, hence `!== true`.
  const profileReadyForPartnerHandoff =
    isUserProfileCompleted(userProfile) === true;
  const blockPartnerHandoff = !!user && !profileReadyForPartnerHandoff;

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
  const submissionSyncInfo =
    verificationStatus?.syncedInfo ?? opportunityInfo.syncedInfo ?? null;
  const commitmentDisplay = getCommitmentDisplay(opportunityInfo);
  let commitmentSummary = "";
  if (commitmentDisplay?.totalHours != null) {
    const commitmentHoursPluralSuffix =
      commitmentDisplay.totalHours === 1 ? "" : "s";
    commitmentSummary = `${commitmentDisplay.totalHours} total hour${commitmentHoursPluralSuffix}`;
  } else if (commitmentDisplay?.label) {
    commitmentSummary = commitmentDisplay.label;
  }
  const partnerSourceLabel =
    submissionSyncInfo?.partners
      ?.map((partner) => partner.partner)
      .join(", ") || "an external partner";
  const isPartnerManagedPendingSubmission =
    verificationStatus?.status == "Pending" &&
    (submissionSyncInfo?.syncType === "Pull" ||
      submissionSyncInfo?.locked === true);
  const externalLinkButtonText =
    opportunityInfo.type === "Learning" &&
    isPartnerManagedPendingSubmission &&
    verificationStatus?.percentComplete != null
      ? "Continue learning"
      : typeConfig.gotoExternalLinkButtonText;

  useEffect(() => {
    if (!user) return;

    // ensure opportunity is published and status is not 'Inactive' (avoid API 400 error)
    if (!(opportunityInfo.published && opportunityInfo.status != "Inactive"))
      return;

    isOpportunitySaved(opportunityInfo.id).then((res) => {
      setIsOppSaved(!!res);
    });
  }, [user, isOppSaved, opportunityInfo]);

  // 📊 ANALYTICS: track opportunity view (only once per component mount)
  useEffect(() => {
    if (!preview && opportunityInfo.id && !hasTrackedView.current) {
      analytics.opportunity.viewed(opportunityInfo.id, opportunityInfo.title);
      hasTrackedView.current = true;
    }
  }, [opportunityInfo.id, opportunityInfo.title, preview]);

  //#region Event Handlers
  // 🔐 anonymous users may browse the whole page; the login prompt is only raised
  // when they attempt an action that requires an account
  const showLoginDialog = useCallback(
    (action: LoginRequiredAction) => {
      setLoginDialogAction(action);
      setLoginDialogVisible(true);

      // 📊 ANALYTICS: track which action raised the login prompt
      analytics.trackEvent("opportunity_login_required", {
        opportunityId: opportunityInfo.id,
        opportunityTitle: opportunityInfo.title,
        action: action,
      });
    },
    [opportunityInfo.id, opportunityInfo.title],
  );

  const closeLoginDialog = useCallback(() => {
    setLoginDialogVisible(false);
    setLoginDialogAction(null);

    // 📊 ANALYTICS: track dismissal of the login prompt
    analytics.trackEvent("opportunity_login_required_dismissed", {
      opportunityId: opportunityInfo.id,
      opportunityTitle: opportunityInfo.title,
      action: loginDialogAction,
    });
  }, [opportunityInfo.id, opportunityInfo.title, loginDialogAction]);

  // return the user to this opportunity after login, with the attempted action
  // so that it can be resumed (see the resume effect below)
  const loginCallbackUrl = useMemo(() => {
    if (!loginDialogAction || typeof window === "undefined") return undefined;

    const url = new URL(window.location.href);
    url.searchParams.set(RETURN_ACTION_PARAM, loginDialogAction);
    return url.href;
  }, [loginDialogAction]);

  const saveOpportunity = useCallback(() => {
    saveMyOpportunity(opportunityInfo.id)
      .then(() => {
        setIsOppSaved(true);
        toast.success("Opportunity saved");

        // 📊 ANALYTICS: track opportunity saved
        analytics.opportunity.saved(opportunityInfo.id, opportunityInfo.title);
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
  }, [opportunityInfo.id, opportunityInfo.title]);

  const onUpdateSavedOpportunity = useCallback(() => {
    if (!user) {
      showLoginDialog("save");
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
      saveOpportunity();
    }
  }, [
    opportunityInfo.id,
    opportunityInfo.title,
    user,
    isOppSaved,
    showLoginDialog,
    saveOpportunity,
  ]);

  const onProceedToOpportunity = useCallback(async () => {
    if (!opportunityInfo.url) return;

    // 🔐 the partner platform stays unreachable until the user is logged in
    if (!user) {
      showLoginDialog("go");
      return;
    }

    // 🔐 partners register/authenticate the user with their Yoma profile details (first name,
    // surname, country), so the hand-off must not run against an incomplete profile.
    // The button is already disabled in this state - this is a backstop in case it is ever
    // driven from somewhere that does not honour `disabled`. Global.tsx raises the
    // "complete your profile" dialog, so there is nothing to surface here.
    if (blockPartnerHandoff) return;

    // Open a blank tab immediately from the user-click handler to avoid popup blockers.
    // The tab will be navigated to the resolved URL once the API responds.
    const win = window.open("", "_blank");

    let redirectUrl = opportunityInfo.url;

    if (opportunityInfo.syncedInfo?.syncType === "Pull") {
      try {
        const result = await performActionNavigateExternalLink(
          opportunityInfo.id,
        );
        if (result?.url) redirectUrl = result.url;
      } catch (error) {
        // This call pre-authenticates the user with the partner. Falling back to the raw
        // opportunity url would drop them on the partner platform unregistered, so surface
        // the failure instead of handing off silently.
        win?.close();

        analytics.trackError(error as Error, {
          errorType: "opportunity_external_link_preauth_error",
          opportunityId: opportunityInfo.id,
        });

        toast(<ApiErrors error={error as AxiosError} />, {
          type: "error",
          autoClose: false,
          icon: false,
        });

        return;
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
    blockPartnerHandoff,
    showLoginDialog,
  ]);

  const onGoToOpportunity = useCallback(async () => {
    // 📊 ANALYTICS: track "Go to opportunity" button click
    analytics.trackEvent("opportunity_go_to_clicked", {
      opportunityId: opportunityInfo.id,
      opportunityTitle: opportunityInfo.title,
    });

    // 🔐 anonymous users: prompt for login/registration instead of engaging with the opportunity
    if (!user) {
      showLoginDialog("go");
      return;
    }

    // 🔐 backstop, as above: never open the "leaving Yoma" dialog for a profile the partner
    // cannot register. The button carrying this handler is already disabled in this state.
    if (blockPartnerHandoff) return;

    const settingDontShowAgain = userProfile?.settings?.items.find(
      (x) => x.key === SETTING_USER_POPUP_LEAVINGYOMA,
    )?.value;

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
    user,
    blockPartnerHandoff,
    showLoginDialog,
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

  // "Delete files" withdraws the pending submission and deletes its uploads (Jason,
  // 2026-10-22): ask through the shared confirmation dialog first, then run the unchanged
  // delete path. Cancel in the dialog leaves the pending-verification dialog open.
  const onOpportunityCancel = useCallback(async () => {
    if (isPartnerManagedPendingSubmission) {
      toast.info(
        `This submission is managed by ${partnerSourceLabel} and cannot be cancelled or deleted in Yoma.`,
      );
      return;
    }

    const confirmed = await modalContext.showConfirmation(
      "",
      <div
        key="confirm-dialog-content"
        className="flex h-full flex-col space-y-2 text-gray-500"
      >
        <div className="flex flex-row items-center gap-2">
          <IoMdWarning className="text-warning h-6 w-6" />
          <p className="text-lg">Delete files?</p>
        </div>

        <div>
          <p className="text-sm leading-6">
            This withdraws your submission and{" "}
            <strong>permanently deletes</strong> everything you uploaded for
            this opportunity.
            <br />
            This cannot be undone.
          </p>
        </div>
      </div>,
    );
    if (!confirmed) return;

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
  }, [
    isPartnerManagedPendingSubmission,
    modalContext,
    opportunityInfo.id,
    opportunityInfo.title,
    partnerSourceLabel,
    queryClient,
  ]);

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

  // 🔐 resume the action the user attempted whilst anonymous, after they logged in / registered
  useEffect(() => {
    if (preview || !user || !router.isReady || hasResumedActionRef.current)
      return;

    const queryValue = router.query[RETURN_ACTION_PARAM];
    const action = Array.isArray(queryValue) ? queryValue[0] : queryValue;

    if (!LOGIN_REQUIRED_ACTIONS.includes(action as LoginRequiredAction)) return;

    hasResumedActionRef.current = true;

    // remove the parameter so the action is not repeated on refresh or when sharing the url
    const query = { ...router.query };
    delete query[RETURN_ACTION_PARAM];
    void router.replace({ pathname: router.pathname, query }, undefined, {
      shallow: true,
    });

    // 📊 ANALYTICS: track resumption of the action that required login
    analytics.trackEvent("opportunity_login_required_resumed", {
      opportunityId: opportunityInfo.id,
      opportunityTitle: opportunityInfo.title,
      action: action,
    });

    switch (action as LoginRequiredAction) {
      case "go":
        // always confirm via the dialog: navigating to the partner platform straight from
        // this effect (i.e. not from a click) would be blocked as a popup
        setGotoOpportunityDialogVisible(true);
        break;
      case "complete":
        setCompleteOpportunityDialogVisible(true);
        break;
      case "save":
        // the user may already have saved it before (e.g. from the search results), so check first
        isOpportunitySaved(opportunityInfo.id)
          .then((saved) => {
            if (saved) setIsOppSaved(true);
            else saveOpportunity();
          })
          .catch(() => saveOpportunity());
        break;
    }
  }, [
    preview,
    user,
    router,
    opportunityInfo.id,
    opportunityInfo.title,
    saveOpportunity,
  ]);

  // The header card's buttons, declared once so the classic and the tabbed (round 7) layouts
  // arrange the SAME elements — handlers, conditions and copy cannot drift apart. Where the
  // tabbed layout sizes a button its own way (round 10: 48px, Save and Share as circles on
  // mobile), the WHOLE class string is picked by layout, so the classic strings are untouched.
  const tabbed = layout === "tabbed";
  const goToButton = opportunityInfo.url &&
    opportunityInfo.status !== "Expired" && (
      <button
        type="button"
        className={
          tabbed
            ? // below 360px, less padding and tight lines: the longest labels take 2 lines in 48px
              "btn btn-sm bg-green hover:bg-green-dark disabled:bg-green h-12 w-full rounded-full px-6 text-sm leading-tight text-white normal-case max-[359px]:px-2 md:w-auto md:whitespace-nowrap"
            : `btn btn-sm bg-green hover:bg-green-dark disabled:bg-green h-10 w-full rounded-full text-sm text-white normal-case md:w-[250px]`
        }
        title="Clicking this button will take you to an external site to continue this opportunity. Remember to return to this page to upload your completion certificate and earn your achievement!"
        onClick={onGoToOpportunity}
        disabled={preview || blockPartnerHandoff}
      >
        <IoMdOpen className="mr-1 h-5 w-5" />
        {externalLinkButtonText}
      </button>
    );
  // "Upload your completion files": manual verification with at least one verification type
  // (the API's own admin rule; an opportunity with none is a data inconsistency it rejects with
  // 500, so no dead-end button — 2026-10-21), started, not yet completed or rejected. Shown in
  // the header card and, from round 3 (2026-10-21), in the sticky bars too.
  const canUploadCompletion =
    opportunityInfo.verificationEnabled &&
    opportunityInfo.verificationMethod == "Manual" &&
    (opportunityInfo.verificationTypes?.length ?? 0) > 0 &&
    new Date(opportunityInfo.dateStart) < new Date() &&
    (verificationStatus == null ||
      verificationStatus.status == "None" ||
      verificationStatus.status == "Rejected") &&
    !opportunityInfo.participantLimitReached &&
    !verificationStatusIsLoading;
  const onUploadCompletionFiles = () => {
    // 📊 ANALYTICS: track "Upload completion files" button click
    analytics.trackEvent("opportunity_upload_files_clicked", {
      opportunityId: opportunityInfo.id,
      opportunityTitle: opportunityInfo.title,
    });

    if (user) {
      setCompleteOpportunityDialogVisible(true);
    } else {
      showLoginDialog("complete");
    }
  };
  // "Pending verification": the youth's completion is under review. One control, in the header
  // card and (from 2026-10-21) both sticky bars; it opens the pending dialog below.
  const isPendingVerification = verificationStatus?.status == "Pending";
  const pendingVerificationLabel =
    isPartnerManagedPendingSubmission &&
    verificationStatus?.percentComplete != null
      ? `Pending verification (${verificationStatus.percentComplete}%)`
      : "Pending verification";
  const pendingVerificationTitle = isPartnerManagedPendingSubmission
    ? `This submission is read-only while pending${verificationStatus?.percentComplete != null ? ` and is ${verificationStatus.percentComplete}% complete` : ""}, so Yoma does not offer cancel or delete actions here.`
    : "Your submission is currently under review. If you would like to cancel your application and delete all uploaded files, click the button to see cancellation options.";
  const onPendingVerification = () => {
    // 📊 ANALYTICS: track "Pending verification" button click
    analytics.trackEvent("opportunity_pending_verification_clicked", {
      opportunityId: opportunityInfo.id,
      opportunityTitle: opportunityInfo.title,
    });

    setCancelOpportunityDialogVisible(true);
  };
  // "Completed": the date comes with the verification status, so no extra request
  const completedOn = verificationStatus?.dateCompleted
    ? moment(verificationStatus.dateCompleted)
    : null;
  const completedTip =
    completedOn && completedOn.isValid()
      ? `Well done — you completed this on ${completedOn.format(DATE_FORMAT_HUMAN)}`
      : "Well done — you completed this opportunity";
  const isCompleted = verificationStatus?.status == "Completed";
  // The "Completed" chip: header card and (2026-10-22, beside Upload / Pending) the sticky bars.
  // Tooltip on hover/focus/tap; tabIndex so keyboard and touch users reach it. Left on md+: in
  // the header the chip sits at the card's right edge, where a top tip clips.
  const completedChip = (className: string) => (
    <span
      className={`tooltip tooltip-top md:tooltip-left tooltip-secondary before:text-[0.6875rem] ${className}`}
      data-tip={completedTip}
    >
      <div
        className="border-green text-green flex h-full items-center justify-center rounded-full border bg-white px-4 text-center text-sm font-bold"
        title={completedTip}
        aria-label={completedTip}
        tabIndex={0}
        role="note"
      >
        Completed
        <IoMdCheckmark
          strikethroughThickness={2}
          overlineThickness={2}
          underlineThickness={2}
          className="ml-1 h-4 w-4"
        />
      </div>
    </span>
  );
  const completionButtons = opportunityInfo.verificationEnabled && (
    <>
      {canUploadCompletion && (
        <button
          type="button"
          className={
            tabbed
              ? // outline green like Save and Share, at Go to programme's 48px (H3, 2026-10-21)
                `${BTN_OUTLINE_GREEN} h-12 w-full px-5 text-sm md:w-auto`
              : `${BTN_OUTLINE_GREEN} h-10 w-full text-sm md:w-[280px]`
          }
          title="Upload your completion files to earn your achievement and have this opportunity added to your CV."
          onClick={onUploadCompletionFiles}
        >
          <IoArrowUp className="mr-1 h-5 w-5" />
          Upload your completion files
        </button>
      )}

      {isPendingVerification && (
        <button
          type="button"
          className="btn border-green text-green btn-sm hover:bg-green-dark h-10 w-full rounded-full bg-white text-sm normal-case hover:text-white md:w-[250px]"
          title={pendingVerificationTitle}
          onClick={onPendingVerification}
        >
          <FaInfoCircle className="h-4 w-4 shrink-0" />
          {pendingVerificationLabel}
        </button>
      )}

      {isCompleted && completedChip("md:text-md h-10")}
    </>
  );
  const saveButton = (
    <button
      type="button"
      className={`${
        tabbed
          ? "btn btn-sm h-12 w-12 min-w-12 shrink-0 flex-nowrap rounded-full px-0 text-sm normal-case md:w-auto md:px-5"
          : "btn btn-sm h-10 w-full shrink flex-nowrap rounded-full text-sm normal-case md:max-w-[120px]"
      } ${
        isOppSaved
          ? "border-yellow bg-yellow-light text-yellow"
          : "border-green text-green hover:bg-green-dark bg-white hover:text-white"
      }`}
      title="Save this opportunity to easily find it later from your profile page."
      // tabbed: icon-only below md, so the name comes from here, not the long title
      aria-label={tabbed ? (isOppSaved ? "Saved" : "Save") : undefined}
      onClick={onUpdateSavedOpportunity}
      disabled={
        !(opportunityInfo.published && opportunityInfo.status == "Active") ||
        preview
      }
    >
      <IoMdBookmark className={`h-5 w-5 ${tabbed ? "md:mr-1" : "mr-1"}`} />

      <span className={tabbed ? "hidden md:inline" : undefined}>
        {isOppSaved ? "Saved" : "Save"}
      </span>
    </button>
  );
  const shareButton = (
    <button
      type="button"
      className={
        tabbed
          ? "btn border-green text-green btn-sm hover:bg-green-dark h-12 w-12 min-w-12 shrink-0 flex-nowrap rounded-full bg-white px-0 text-sm normal-case hover:text-white md:w-auto md:px-5"
          : "btn border-green text-green btn-sm hover:bg-green-dark h-10 w-full shrink flex-nowrap rounded-full bg-white text-sm normal-case hover:text-white md:max-w-[120px]"
      }
      title="Share this opportunity with your friends and network to help more people discover it!"
      aria-label={tabbed ? "Share" : undefined}
      onClick={onShareOpportunity}
      // ensure opportunity is published and active (user logged in check is done in function)
      disabled={
        !(opportunityInfo.published && opportunityInfo.status == "Active") ||
        preview
      }
    >
      <IoMdShare className={`h-5 w-5 ${tabbed ? "md:mr-1" : "mr-1"}`} />
      <span className={tabbed ? "hidden md:inline" : undefined}>Share</span>
    </button>
  );
  // The sticky bar's and the mobile bottom bar's compact set (tabbed layout only): 50px in the
  // mobile bottom bar, 40px in the desktop sticky panel. Upload — or, once the completion is
  // under review, Pending verification (Jason, 2026-10-21) — is an outline button beside them
  // on desktop and a link on its own line under them on mobile (2026-10-21).
  const barActions = (
    <>
      {canUploadCompletion && (
        <button
          type="button"
          className={`${BTN_OUTLINE_GREEN} hidden h-10 px-4 text-sm md:inline-flex`}
          onClick={onUploadCompletionFiles}
        >
          <IoArrowUp className="mr-1 h-4 w-4" />
          Upload your completion files
        </button>
      )}
      {isPendingVerification && (
        <button
          type="button"
          className={`${BTN_OUTLINE_GREEN} hidden h-10 px-4 text-sm md:inline-flex`}
          title={pendingVerificationTitle}
          onClick={onPendingVerification}
        >
          <IoTimeOutline className="mr-1 h-4 w-4" />
          {pendingVerificationLabel}
        </button>
      )}
      {isCompleted && completedChip("hidden h-10 md:inline-block")}
      {opportunityInfo.url && opportunityInfo.status !== "Expired" && (
        <button
          type="button"
          className="btn btn-sm bg-green hover:bg-green-dark disabled:bg-green h-[50px] grow rounded-full px-5 text-sm text-white normal-case md:h-10 md:grow-0"
          onClick={onGoToOpportunity}
          disabled={preview || blockPartnerHandoff}
        >
          {externalLinkButtonText}
        </button>
      )}
      <button
        type="button"
        aria-label={isOppSaved ? "Saved" : "Save"}
        className={`btn btn-sm h-[50px] w-[50px] shrink-0 rounded-full px-0 md:h-10 md:w-10 ${
          isOppSaved
            ? "border-yellow bg-yellow-light text-yellow"
            : "border-green text-green hover:bg-green-dark bg-white hover:text-white"
        }`}
        onClick={onUpdateSavedOpportunity}
        disabled={
          !(opportunityInfo.published && opportunityInfo.status == "Active") ||
          preview
        }
      >
        <IoMdBookmark className="h-5 w-5" />
      </button>
      <button
        type="button"
        aria-label="Share"
        className="btn border-green text-green btn-sm hover:bg-green-dark h-[50px] w-[50px] shrink-0 rounded-full bg-white px-0 hover:text-white md:h-10 md:w-10"
        onClick={onShareOpportunity}
        disabled={
          !(opportunityInfo.published && opportunityInfo.status == "Active") ||
          preview
        }
      >
        <IoMdShare className="h-5 w-5" />
      </button>
      {canUploadCompletion && (
        <button
          type="button"
          className="text-green hover:text-green-dark inline-flex h-8 basis-full items-center justify-center text-sm font-semibold underline md:hidden"
          onClick={onUploadCompletionFiles}
        >
          <IoArrowUp className="mr-1 h-4 w-4" />
          Upload your completion files
        </button>
      )}
      {isPendingVerification && (
        <button
          type="button"
          className="text-green hover:text-green-dark inline-flex h-8 basis-full items-center justify-center text-sm font-semibold underline md:hidden"
          title={pendingVerificationTitle}
          onClick={onPendingVerification}
        >
          <IoTimeOutline className="mr-1 h-4 w-4" />
          {pendingVerificationLabel}
        </button>
      )}
      {isCompleted && completedChip("h-8 basis-full md:hidden")}
    </>
  );

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
            shouldCloseOnOverlayClick={true}
            onRequestClose={closeLoginDialog}
            className={`md:max-h-[360px] md:w-[600px]`}
          >
            <div className="flex h-full flex-col gap-2 overflow-y-auto pb-8">
              <div className="bg-theme flex flex-row items-center p-4 shadow-lg">
                <h1 className="grow"></h1>
                <button
                  type="button"
                  className="btn btn-circle text-gray-dark hover:bg-gray"
                  title="Close"
                  onClick={closeLoginDialog}
                >
                  <IoMdClose className="h-5 w-5"></IoMdClose>
                </button>
              </div>
              <div className="flex flex-col items-center justify-center gap-4 px-6 pb-8 text-center md:px-12">
                <div className="border-purple-dark -mt-8 flex items-center justify-center rounded-full bg-white p-2 shadow-lg">
                  <FcKey className="size-8 md:size-10" />
                </div>

                <div className="flex flex-col gap-2 text-center">
                  <div className="text-xl font-semibold tracking-wide md:text-2xl">
                    Login Required
                  </div>
                  <div className="md:text-md text-sm">
                    {loginDialogAction
                      ? LOGIN_REQUIRED_MESSAGES[loginDialogAction]
                      : "Please login or register to continue."}
                  </div>
                </div>

                <div className="mt-6 mb-2 flex w-full flex-col-reverse justify-center gap-4 md:flex-row">
                  <button
                    type="button"
                    className="btn border-green text-green hover:bg-green w-full bg-white hover:text-white md:flex-1"
                    onClick={closeLoginDialog}
                  >
                    <IoMdClose className="mr-2 h-5 w-5" />
                    Close Window
                  </button>

                  <SignInButton
                    className="!bg-green w-full hover:brightness-125! md:flex-1"
                    callbackUrl={loginCallbackUrl}
                    showLabel={true}
                  />
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
                  <IoMdClose className="h-5 w-5"></IoMdClose>
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

                <div className="my-3 flex w-full flex-col-reverse justify-center gap-4 px-4 md:flex-row">
                  <button
                    type="button"
                    className="btn border-green text-green hover:bg-green-dark w-full bg-white hover:text-white md:flex-1"
                    onClick={() => setGotoOpportunityDialogVisible(false)}
                  >
                    <IoMdClose className="mr-2 h-5 w-5" />
                    Close Window
                  </button>

                  <button
                    type="button"
                    className="btn bg-green hover:bg-green-dark w-full text-white md:flex-1"
                    onClick={onProceedToOpportunity}
                    disabled={!opportunityInfo.url || blockPartnerHandoff}
                  >
                    <IoMdOpen className="mr-2 h-5 w-5" />
                    Proceed
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
            className={`md:max-h-[calc(100vh-3rem)] md:w-[700px]`}
            animationStyle="rise"
          >
            <OpportunityCompletionEdit
              id="op-complete"
              opportunityInfo={opportunityInfo}
              typeTint={typeTint}
              onClose={() => {
                setCompleteOpportunityDialogVisible(false);
              }}
              onSave={onOpportunityCompleted}
            />
          </CustomModal>

          {/* COMPLETE SUCCESS DIALOG — the detail page's language (Jason, 2026-10-21): the type's
              tint behind an io5 icon, a Nunito heading, what happens next, one primary button */}
          <CustomModal
            isOpen={completeOpportunitySuccessDialogVisible}
            shouldCloseOnOverlayClick={false}
            onRequestClose={() => {
              setCompleteOpportunitySuccessDialogVisible(false);
            }}
            className={`md:max-h-[600px] md:w-[600px]`}
            animationStyle="rise"
          >
            <div className={DIALOG_BODY}>
              <div className="flex justify-end p-3">
                <button
                  type="button"
                  aria-label="Close"
                  className={DIALOG_CLOSE}
                  onClick={() => {
                    setCompleteOpportunitySuccessDialogVisible(false);
                  }}
                >
                  <IoClose className="h-5 w-5" />
                </button>
              </div>
              <div className="flex flex-col items-center gap-5 px-6 pb-8 text-center md:px-12">
                {/* the balloon's circle pops in with a soft ring in the type colour, then the
                    sparkle in the type colour wiggles twice; static under reduced motion */}
                <div
                  className={`${DIALOG_ICON_CIRCLE} ${typeOutlineClass(opportunityInfo.type)} bg-orange-light motion-safe:animate-bounce-once relative ring-4 ring-current/20`}
                >
                  <IoBalloon aria-hidden className="text-orange h-10 w-10" />
                  <IoSparkles
                    aria-hidden
                    className="absolute -top-1 -right-1 h-6 w-6 motion-safe:animate-[wiggle_0.8s_ease-in-out_0.5s_2]"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <h3 className={DIALOG_HEADING}>Submitted!</h3>
                  <p className="text-gray-dark text-sm md:text-base">
                    <strong className="text-black">
                      {opportunityInfo.organizationName}
                    </strong>{" "}
                    will now check your completion of{" "}
                    <strong className="text-black">
                      {opportunityInfo.title}
                    </strong>
                    .
                  </p>
                </div>

                <div className="w-full text-left">
                  <h4 className={DIALOG_EYEBROW}>What happens next</h4>
                  <ul className="mt-2 flex flex-col gap-3">
                    <DialogStep
                      icon={<IoShieldCheckmarkOutline className="h-5 w-5" />}
                      toneClass={TONE.green}
                      title="Verification"
                      note={`${opportunityInfo.organizationName} reviews what you sent. This usually takes 3–4 business days.`}
                    />
                    <DialogStep
                      icon={<IoIdCardOutline className="h-5 w-5" />}
                      toneClass={TONE.blue}
                      title="Your credential"
                      note="Once approved, a credential is added to your Yo-ID Passport and the opportunity to your CV."
                    />
                    {(opportunityInfo.zltoRewardEstimate ?? 0) > 0 && (
                      <DialogStep
                        icon={<IoWalletOutline className="h-5 w-5" />}
                        toneClass={TONE.gold}
                        title="ZLTO"
                        note={`${opportunityInfo.zltoRewardEstimate} ZLTO goes into your Wallet once it's approved.`}
                      />
                    )}
                  </ul>
                </div>

                <button
                  type="button"
                  className={`${DIALOG_PRIMARY} md:w-[240px]`}
                  onClick={() =>
                    setCompleteOpportunitySuccessDialogVisible(false)
                  }
                >
                  Done
                </button>
              </div>
            </div>
          </CustomModal>

          {/* PENDING VERIFICATION DIALOG — the same treatment: what pending means, when to expect
              a result, the link to Yo-ID → Opportunities → Pending, and (own submissions only)
              the way to withdraw it (Jason, 2026-10-21) */}
          <CustomModal
            isOpen={cancelOpportunityDialogVisible}
            shouldCloseOnOverlayClick={false}
            onRequestClose={() => {
              setCancelOpportunityDialogVisible(false);
            }}
            className={`md:max-h-[610px] md:w-[600px]`}
            animationStyle="rise"
          >
            {isLoading && <Loading />}

            <div className={DIALOG_BODY}>
              <div className="flex justify-end p-3">
                <button
                  type="button"
                  aria-label="Close"
                  className={DIALOG_CLOSE}
                  onClick={() => {
                    setCancelOpportunityDialogVisible(false);
                  }}
                >
                  <IoClose className="h-5 w-5" />
                </button>
              </div>
              <div className="flex flex-col items-center gap-5 px-6 pb-8 text-center md:px-12">
                <div className={`${DIALOG_ICON_CIRCLE} ${typeTint}`}>
                  <IoTimeOutline aria-hidden className="h-10 w-10" />
                </div>
                <div className="flex flex-col gap-2">
                  <h3 className={DIALOG_HEADING}>Pending verification</h3>
                  <p className="text-gray-dark text-sm md:text-base">
                    {isPartnerManagedPendingSubmission ? (
                      <>
                        <strong className="text-black">
                          {partnerSourceLabel}
                        </strong>{" "}
                        manages this submission, so it is read-only in Yoma
                        while it is pending.
                        {verificationStatus?.percentComplete != null && (
                          <>
                            {" "}
                            Progress reported so far:{" "}
                            <strong className="text-black">
                              {verificationStatus.percentComplete}%
                            </strong>
                            .
                          </>
                        )}
                      </>
                    ) : (
                      <>
                        <strong className="text-black">
                          {opportunityInfo.organizationName}
                        </strong>{" "}
                        is reviewing your completion. What you sent can&apos;t
                        be changed while it is under review.
                      </>
                    )}
                  </p>
                </div>

                <div className="w-full text-left">
                  <h4 className={DIALOG_EYEBROW}>What to expect</h4>
                  <ul className="mt-2 flex flex-col gap-3">
                    <DialogStep
                      icon={<IoShieldCheckmarkOutline className="h-5 w-5" />}
                      toneClass={TONE.green}
                      title="A result within 3–4 business days"
                      note="Most reviews finish in that time. Once approved, your credential appears in your Yo-ID Passport and the opportunity on your CV."
                    />
                    <DialogStep
                      icon={<IoTimeOutline className="h-5 w-5" />}
                      toneClass={TONE.blue}
                      title="Track it in your Yo-ID"
                      note={
                        <Link
                          href="/yoid/opportunities/pending"
                          className="text-green font-semibold underline"
                        >
                          See your pending opportunities
                        </Link>
                      }
                    />
                  </ul>
                </div>

                {!isPartnerManagedPendingSubmission && (
                  <div className="border-yellow bg-orange-light flex w-full items-start gap-2 rounded-xl border p-3 text-left text-xs">
                    <IoAlertCircleOutline className="text-yellow mt-0.5 h-4 w-4 shrink-0" />
                    <span>
                      <strong>Delete files</strong> withdraws your submission
                      and permanently deletes everything you uploaded for this
                      opportunity.
                    </span>
                  </div>
                )}

                <div className="flex w-full flex-col-reverse justify-center gap-3 md:flex-row">
                  {!isPartnerManagedPendingSubmission && (
                    <button
                      type="button"
                      className={`${DIALOG_SECONDARY} md:flex-1`}
                      onClick={onOpportunityCancel}
                      disabled={isLoading}
                    >
                      <IoTrashOutline className="mr-2 h-5 w-5" />
                      Delete files
                    </button>
                  )}
                  <button
                    type="button"
                    className={`${DIALOG_PRIMARY} md:flex-1`}
                    onClick={() => setCancelOpportunityDialogVisible(false)}
                  >
                    Close
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
        <div className="flex flex-col gap-4">
          {layout === "tabbed" ? (
            <DetailHeaderCard ref={headerCardRef} opportunity={opportunityInfo}>
              {/* BUTTONS — the same elements (see goToButton above). Round 10: the call to
                  action, Save and Share together, Upload right-aligned (on its own line when
                  the row is too narrow, e.g. 768); on mobile Save and Share are circles beside
                  the call to action, and Upload sits below */}
              <div className="mt-5 flex flex-col gap-2.5 md:flex-row md:flex-wrap md:items-center">
                <div className="flex items-center gap-2.5">
                  {goToButton && (
                    <div className="min-w-0 grow md:grow-0">{goToButton}</div>
                  )}
                  <div className="flex shrink-0 gap-2.5 max-md:ml-auto">
                    {saveButton}
                    {shareButton}
                  </div>
                </div>
                <div className="flex flex-col gap-2 empty:hidden md:ml-auto md:flex-row md:items-center">
                  {completionButtons}
                </div>
              </div>
              {preview && (
                <p className="text-purple mt-2 text-xs font-semibold">
                  Buttons are inactive in preview.
                </p>
              )}
            </DetailHeaderCard>
          ) : (
            <div
              ref={headerCardRef}
              className="relative flex grow flex-col rounded-lg bg-white p-4 shadow-lg md:p-6"
            >
              <div className="flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <h4 className="font-family-nunito line-clamp-2 text-xl font-bold text-black md:text-2xl">
                    {opportunityInfo.title}
                  </h4>

                  <div className="mt-1">
                    <OpportunityOrgCountriesRow data={opportunityInfo} />
                  </div>
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
              <div className="mt-4 mb-2 flex flex-col gap-2 md:my-2">
                <div className="flex flex-row flex-wrap items-center gap-2">
                  <OpportunityTypeBadge
                    data={opportunityInfo}
                    className={typeBadgeClass(opportunityInfo.type)}
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

              {/* BUTTONS — one set of elements, two arrangements (see goToButton above) */}
              <div className="mt-2 flex flex-col gap-4 md:flex-row">
                <div className="flex grow flex-col gap-4 md:flex-row">
                  {goToButton}
                  {completionButtons}
                </div>

                <div className="flex gap-2">
                  {saveButton}
                  {shareButton}
                </div>
              </div>
            </div>
          )}

          {layout === "tabbed" ? (
            <OpportunityDetailSections
              opportunity={opportunityInfo}
              headerRef={headerCardRef}
              barActions={barActions}
              preview={preview}
              // signed in, a ZLTO incentive's cash-out line follows the youth's own Cash Out;
              // the editor preview shows what any youth sees
              cashOutClosed={!preview && isCashOutClosed(userProfile?.payout)}
            />
          ) : (
            <div className="flex flex-col gap-4 md:flex-row">
              <div className="grow rounded-lg bg-white p-2 shadow-lg md:w-[66%]">
                <Editor value={opportunityInfo.description} readonly={true} />
              </div>
              <div className="flex flex-col gap-2 rounded-lg shadow-lg md:w-[33%]">
                <div className="divide-gray flex flex-col divide-y rounded-lg bg-white p-4 md:p-6">
                  {(opportunityInfo.skills?.length ?? 0) > 0 && (
                    <DetailSection
                      // a Job's skills are its requirements, never awarded on completion
                      title={
                        opportunityInfo.type === OPPORTUNITY_TYPE_NANE_JOB
                          ? "Skills required"
                          : "Skills you will learn"
                      }
                      icon={<IoBulbOutline className="text-green h-5 w-5" />}
                      className="pb-4 first:pt-0 last:pb-0"
                    >
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
                    </DetailSection>
                  )}
                  {/* Commitment copy comes from master's `commitmentSummary` (total hours when
                      the API knows them, else the interval label), rendered in this branch's
                      shared DetailSection rather than master's hand-rolled block. */}
                  {commitmentSummary && (
                    <DetailSection
                      title="How much time you will need"
                      icon={<IoTimeOutline className="text-green h-5 w-5" />}
                    >
                      <div className="my-2 text-sm">
                        {`This task should not take you more than ${commitmentSummary}.`}
                        <br />
                        <p className="mt-2">
                          The estimated times provided are just a guideline. You
                          have as much time as you need to complete the tasks at
                          your own pace. Focus on engaging with the materials
                          and doing your best without feeling rushed by the time
                          estimates.
                        </p>
                      </div>
                    </DetailSection>
                  )}
                  {(opportunityInfo.categories?.length ?? 0) > 0 && (
                    <DetailSection
                      title="Topics"
                      icon={
                        <IoPricetagsOutline className="text-green h-5 w-5" />
                      }
                    >
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
                    </DetailSection>
                  )}
                  {(opportunityInfo.languages?.length ?? 0) > 0 && (
                    <DetailSection
                      title="Languages"
                      icon={
                        <IoLanguageOutline className="text-green h-5 w-5" />
                      }
                    >
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
                    </DetailSection>
                  )}
                  {/* informational provider text — not the owning organisation */}
                  {!!opportunityInfo.provider?.trim() && (
                    <DetailSection
                      title="Provider"
                      icon={
                        <IoStorefrontOutline className="text-green h-5 w-5" />
                      }
                    >
                      <div className="badge bg-green my-2 h-full min-h-6 rounded-md border-0 py-1 text-xs font-semibold text-white">
                        {opportunityInfo.provider}
                      </div>
                    </DetailSection>
                  )}
                  {(opportunityInfo.countries?.length ?? 0) > 0 && (
                    <DetailSection
                      title="Countries"
                      icon={
                        <IoLocationOutline className="text-green h-5 w-5" />
                      }
                      className="pt-4 first:pt-0"
                    >
                      <div className="my-2 flex flex-wrap gap-1">
                        {opportunityInfo.countries?.map((country) => {
                          // optional place within the country: "City, Region"
                          const place = [country.city, country.region]
                            .filter(Boolean)
                            .join(", ");

                          return (
                            <div
                              key={country.id}
                              className="badge bg-green h-full min-h-6 rounded-md border-0 py-1 text-xs font-semibold text-white"
                            >
                              {place
                                ? `${country.name} — ${place}`
                                : country.name}
                            </div>
                          );
                        })}
                      </div>
                    </DetailSection>
                  )}

                  {/* incentive, accessibility, age range, groups, SDGs — as on the admin info page */}
                  <OpportunityCoreDetails opportunity={opportunityInfo} />

                  {/* CUSTOM FIELDS (definition-driven, read-only) */}
                  <OpportunityCustomFieldsSection
                    type={opportunityInfo.type}
                    values={opportunityInfo.customFields}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default OpportunityPublicDetails;
