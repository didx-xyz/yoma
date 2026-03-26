import { useAtomValue, useSetAtom } from "jotai";
import { useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import Head from "next/head";
import { useRouter } from "next/router";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactElement,
} from "react";
import { IoGift, IoTimeOutline, IoTrophyOutline } from "react-icons/io5";
import { toast } from "react-toastify";
import { UserProfile } from "~/api/models/user";
import {
  claimAsReferee,
  claimAsRefereeInitiate,
} from "~/api/services/referrals";
import { getUserProfile } from "~/api/services/user";
import MainLayout from "~/components/Layout/Main";
import NoRowsMessage from "~/components/NoRowsMessage";
import { ReferralInfoCard } from "~/components/Referrals/ReferralInfoCard";
import { ReferralMainColumns } from "~/components/Referrals/ReferralMainColumns";
import { ReferralShell } from "~/components/Referrals/ReferralShell";
import { ReferralStatCard } from "~/components/Referrals/ReferralStatCard";
import { ReferralTasksCard } from "~/components/Referrals/ReferralTasksCard";
import { ReferralTopCard } from "~/components/Referrals/ReferralTopCard";
import { Editor } from "~/components/RichText/Editor";
import { LoadingInline } from "~/components/Status/LoadingInline";
import {
  UserProfileFilterOptions,
  UserProfileForm,
} from "~/components/User/UserProfileForm";
import { useReferralProgramInfoByLinkQuery } from "~/hooks/useReferralProgramMutations";
import analytics from "~/lib/analytics";
import { parseApiError } from "~/lib/apiErrorUtils";
import { handleUserSignIn } from "~/lib/authUtils";
import { THEME_WHITE } from "~/lib/constants";
import { currentLanguageAtom, userProfileAtom } from "~/lib/store";
import { cleanTextForMetaTag } from "~/lib/utils";
import { isUserProfileCompleted } from "~/lib/utils/profile";
import { REFERRAL_LINK_USAGES_REFEREE_QUERY_KEY } from "~/hooks/useRefereeReferrals";
import { type NextPageWithLayout } from "../../_app";

const ReferralClaimPage: NextPageWithLayout = () => {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { status: sessionStatus } = useSession();
  const [claiming, setClaiming] = useState(false);
  const [claimingAfterProfile, setClaimingAfterProfile] = useState(false);
  const [claimError, setClaimError] = useState<any>(null);
  const [claimAttempted, setClaimAttempted] = useState(false);
  const [initiateCheckCompleted, setInitiateCheckCompleted] = useState(false);
  const [initiateCheckLoading, setInitiateCheckLoading] = useState(false);
  const [redirectingToProgress, setRedirectingToProgress] = useState(false);
  const currentLanguage = useAtomValue(currentLanguageAtom);
  const userProfile = useAtomValue(userProfileAtom);
  const setUserProfile = useSetAtom(userProfileAtom);
  const hasShownClaimWelcomeToastRef = useRef(false);
  const redirectInFlightRef = useRef(false);
  const programId =
    typeof router.query.programId === "string" ? router.query.programId : "";
  const linkId =
    typeof router.query.linkId === "string" ? router.query.linkId : "";
  const isAuthenticated = sessionStatus === "authenticated";
  const needsProfileCompletion =
    isAuthenticated && userProfile
      ? !isUserProfileCompleted(userProfile)
      : undefined;

  // Fetch program data
  const {
    data: program,
    error: programError,
    isLoading: programLoading,
  } = useReferralProgramInfoByLinkQuery(linkId, {
    enabled: router.isReady && !!linkId,
  });

  const handleClaim = useCallback(async () => {
    setClaiming(true);

    // 📊 ANALYTICS: track login button click
    analytics.trackEvent("referral_claim_login_button_clicked", {
      language: currentLanguage,
      buttonLocation: "general", // can be customized per usage
    });

    // log in with keycloak
    await handleUserSignIn(currentLanguage);
  }, [currentLanguage]);

  const redirectToProgress = useCallback(async () => {
    if (redirectInFlightRef.current) return;
    redirectInFlightRef.current = true;
    setRedirectingToProgress(true);

    window.scrollTo({ top: 0, behavior: "smooth" });
    await router.push(`/referrals/progress/${programId}`);
  }, [programId, router]);

  const performClaim = useCallback(async () => {
    // Prevent multiple claim attempts
    if (claimAttempted) return;

    setClaimAttempted(true);
    setClaimingAfterProfile(true);
    setClaimError(null);
    try {
      await claimAsReferee(linkId);

      // Refresh user profile to include new referral data
      // This ensures UserMenu shows the referee dashboard link
      const updatedProfile = await getUserProfile();
      setUserProfile(updatedProfile);
      await queryClient.invalidateQueries({
        queryKey: [REFERRAL_LINK_USAGES_REFEREE_QUERY_KEY],
      });

      // Successfully claimed - redirect to referee progress page
      await redirectToProgress();
    } catch (error: any) {
      // Scroll to top to show error
      window.scrollTo({ top: 0, behavior: "smooth" });

      // Store the full error object for parsing
      setClaimError(error);

      setClaimingAfterProfile(false);
    }
  }, [linkId, claimAttempted, queryClient, redirectToProgress, setUserProfile]);

  const handleProfileSubmit = useCallback(
    (updatedUserProfile: UserProfile) => {
      setUserProfile(updatedUserProfile);

      if (!isUserProfileCompleted(updatedUserProfile)) {
        return;
      }

      if (initiateCheckCompleted && !initiateCheckLoading) {
        void performClaim();
      }
    },
    [
      initiateCheckCompleted,
      initiateCheckLoading,
      performClaim,
      setUserProfile,
    ],
  );

  useEffect(() => {
    setClaimError(null);
    setClaimAttempted(false);
    setClaimingAfterProfile(false);
    setInitiateCheckCompleted(false);
    setInitiateCheckLoading(false);
    setRedirectingToProgress(false);
    hasShownClaimWelcomeToastRef.current = false;
    redirectInFlightRef.current = false;
  }, [linkId, programId]);

  useEffect(() => {
    if (!isAuthenticated || !router.isReady || !linkId || !programId) {
      return;
    }

    let cancelled = false;

    const initiateClaim = async () => {
      setInitiateCheckLoading(true);
      try {
        await claimAsRefereeInitiate(linkId);

        if (!cancelled) {
          const updatedProfile = await getUserProfile();
          setUserProfile(updatedProfile);
          await queryClient.invalidateQueries({
            queryKey: [REFERRAL_LINK_USAGES_REFEREE_QUERY_KEY],
          });
        }

        if (!cancelled && needsProfileCompletion === false) {
          await performClaim();
          return;
        }
      } catch (error) {
        if (!cancelled) {
          setClaimError(error);
        }
      } finally {
        if (!cancelled) {
          setInitiateCheckLoading(false);
          setInitiateCheckCompleted(true);
        }
      }
    };

    void initiateClaim();

    return () => {
      cancelled = true;
    };
  }, [
    isAuthenticated,
    router.isReady,
    linkId,
    programId,
    needsProfileCompletion,
    performClaim,
    queryClient,
    setUserProfile,
  ]);

  const shouldShowInlineProfile =
    isAuthenticated && needsProfileCompletion === true;

  useEffect(() => {
    if (!shouldShowInlineProfile || hasShownClaimWelcomeToastRef.current) {
      return;
    }

    hasShownClaimWelcomeToastRef.current = true;

    toast.info(
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <span className="text-lg">⭐</span>
          <strong>Welcome to Yoma!</strong>
        </div>
        <div className="text-sm">
          Please complete your profile to join the programme.
        </div>
        <div className="flex flex-1 justify-center">
          <button
            onClick={() => toast.dismiss("claim-profile-completion-reminder")}
            className="btn btn-sm bg-orange w-fullx mt-2 w-32 text-white hover:brightness-110"
          >
            Ok
          </button>
        </div>
      </div>,
      {
        autoClose: false,
        closeButton: true,
        icon: false,
        toastId: "claim-profile-completion-reminder",
        onClose: () => {},
        style: {
          backgroundColor: "#41204b",
          boxShadow:
            "0 20px 45px rgba(0, 0, 0, 0.45), 0 8px 20px rgba(0, 0, 0, 0.3)",
        },
      },
    );
  }, [shouldShowInlineProfile]);

  useEffect(() => {
    if (shouldShowInlineProfile) {
      return;
    }

    toast.dismiss("claim-profile-completion-reminder");
  }, [shouldShowInlineProfile]);

  const isPageLoading =
    (!claimError && programLoading) ||
    claimingAfterProfile ||
    redirectingToProgress ||
    (!shouldShowInlineProfile &&
      (initiateCheckLoading || sessionStatus === "loading"));
  const hasPageError =
    (router.isReady && (!programId || !linkId)) ||
    Boolean(programError) ||
    (!isPageLoading && router.isReady && !program);

  const pageErrorMessage = (() => {
    if (router.isReady && !linkId) return "Link ID is required";
    if (router.isReady && !programId)
      return "Referral programme not found or unavailable";
    if (programError) {
      const { errors, message } = parseApiError(programError);
      return (
        errors
          .map((e) => e.message)
          .filter(Boolean)
          .join(" · ") ||
        message ||
        null
      );
    }
    return null;
  })();

  const pageErrorContent = hasPageError ? (
    <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-4 rounded-xl bg-white p-6 text-center shadow">
      <NoRowsMessage
        title="Referral Link Unavailable"
        description={
          pageErrorMessage ??
          "This referral link is invalid, expired, or has been removed."
        }
        icon={"⚠️"}
        className="w-full !bg-transparent"
      />
    </div>
  ) : null;

  // Claim error state
  let claimErrorContent: React.ReactNode = null;
  if (claimError && program) {
    const { errors, message, status } = parseApiError(claimError);
    const errorMessage =
      errors
        .map((e) => e.message)
        .filter(Boolean)
        .join(" · ") ||
      message ||
      "Unable to claim this referral link.";

    if (
      /already claimed this link|already completed program/i.test(errorMessage)
    ) {
      claimErrorContent = (
        <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-4 rounded-xl bg-white p-6 text-center shadow">
          <NoRowsMessage
            icon={"⚠️"}
            title="Referral Link Unavailable"
            description="You have already claimed this link."
            className="w-full !bg-transparent"
          />
        </div>
      );
    } else if (
      /already participated|already claimed link .*still pending|still pending/i.test(
        errorMessage,
      )
    ) {
      claimErrorContent = (
        <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-4 rounded-xl bg-white p-6 text-center shadow">
          <NoRowsMessage
            icon={"⚠️"}
            title="Referral Link Unavailable"
            description="You have already claimed this programme using another referral link."
            className="w-full !bg-transparent"
          />
        </div>
      );
    } else if (
      /completion limit|reached its completion limit/i.test(errorMessage)
    ) {
      claimErrorContent = (
        <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-4 rounded-xl bg-white p-6 text-center shadow">
          <NoRowsMessage
            icon={"⚠️"}
            title="Programme Full"
            description="This referral programme has reached its completion limit and can no longer be claimed."
            className="w-full !bg-transparent"
          />
        </div>
      );
    } else if (/expired/i.test(errorMessage)) {
      claimErrorContent = (
        <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-4 rounded-xl bg-white p-6 text-center shadow">
          <NoRowsMessage
            icon={"⚠️"}
            title="Referral Link Unavailable"
            description="This referral link has expired and can no longer be claimed."
            className="w-full !bg-transparent"
          />
        </div>
      );
    } else if (/abandoned/i.test(errorMessage)) {
      claimErrorContent = (
        <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-4 rounded-xl bg-white p-6 text-center shadow">
          <NoRowsMessage
            icon={"⚠️"}
            title="Referral Link Unavailable"
            description="This referral claim is no longer available. Please use a new referral link to try again."
            className="w-full !bg-transparent"
          />
        </div>
      );
    } else if (status !== 404) {
      claimErrorContent = (
        <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-4 rounded-xl bg-white p-6 text-center shadow">
          <NoRowsMessage
            icon={"⚠️"}
            title="Unable to Claim Referral Link"
            description={errorMessage}
            className="w-full !bg-transparent"
          />
        </div>
      );
    }
  }

  // Main claim page
  const rewardAmount = program?.zltoRewardRefereeEstimate;

  const pageTitle = rewardAmount
    ? `Join me on Yoma and earn ${rewardAmount} ZLTO!`
    : "Join me on Yoma!";

  const pageDescription = rewardAmount
    ? `Join me on Yoma and earn ${rewardAmount} ZLTO! Sign up to build your digital CV and access opportunities.`
    : "Join me on Yoma! Sign up to build your digital CV and access opportunities.";

  const safeTitle = cleanTextForMetaTag(pageTitle, 60);
  const safeDescription = cleanTextForMetaTag(pageDescription, 160);
  const imageUrl = program?.imageURL || "";

  return (
    <>
      <Head>
        <title>{`Yoma | Ambassador Referrals | ${program?.name ?? "Referral"}`}</title>
        <meta name="description" content={safeDescription} />

        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content={safeTitle} />
        <meta property="og:description" content={safeDescription} />
        {imageUrl && <meta property="og:image" content={imageUrl} />}

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={safeTitle} />
        <meta name="twitter:description" content={safeDescription} />
        {imageUrl && <meta name="twitter:image" content={imageUrl} />}
      </Head>

      <ReferralShell
        title={program?.name ?? "Referral"}
        breadcrumbLabel="Referrals"
        //programImageUrl={program?.imageURL || undefined}
        headerBackgroundMode="color"
        headerBackgroundColorClassName="bg-orange"
        onBack={() => router.push("/referrals")}
        isLoading={!hasPageError && (!router.isReady || isPageLoading)}
      >
        {pageErrorContent ? (
          pageErrorContent
        ) : claimErrorContent ? (
          claimErrorContent
        ) : program ? (
          <>
            <ReferralTopCard
              program={program}
              title={program.name}
              subTitle={
                isAuthenticated && needsProfileCompletion
                  ? "Complete your profile to join the programme."
                  : (program.summary ?? program.description)
              }
              rewardsReferrer={false}
              rewardsReferee={true}
              hideBadges={isAuthenticated} // hide badges for unauthenticated users as they won't be able to understand them without the program detail
              cta={
                <>
                  {!isAuthenticated && (
                    <button
                      type="button"
                      onClick={!isAuthenticated ? handleClaim : undefined}
                      disabled={isAuthenticated || claiming}
                      className="btn btn-sm bg-green hover:bg-green-dark disabled:!bg-green h-10 rounded-full border-0 px-5 text-white normal-case disabled:!text-white disabled:opacity-100"
                    >
                      {claiming ? (
                        <LoadingInline
                          classNameSpinner="h-4 w-4"
                          classNameLabel="hidden"
                        />
                      ) : (
                        <IoGift className="h-4 w-4" />
                      )}
                      Login to claim
                    </button>
                  )}
                </>
              }
            />

            <ReferralMainColumns
              left={
                <>
                  <ReferralInfoCard>
                    <div className="space-y-4">
                      {/* PROFILE COMPLETION (inline) */}
                      {isAuthenticated && needsProfileCompletion ? (
                        <UserProfileForm
                          userProfile={userProfile}
                          onSubmit={handleProfileSubmit}
                          submitButtonText="Save profile and continue"
                          filterOptions={[
                            UserProfileFilterOptions.FIRSTNAME,
                            UserProfileFilterOptions.SURNAME,
                            UserProfileFilterOptions.COUNTRY,
                            UserProfileFilterOptions.EDUCATION,
                            UserProfileFilterOptions.GENDER,
                            UserProfileFilterOptions.DATEOFBIRTH,
                          ]}
                        />
                      ) : null}

                      {/* PROGRAM DESCRIPTION */}
                      {!isAuthenticated && (
                        <div className="-mx-3 -my-5">
                          <Editor
                            value={program.description ?? program.summary ?? ""}
                            readonly={true}
                          />
                        </div>
                      )}
                    </div>
                  </ReferralInfoCard>

                  {program.pathwayRequired &&
                    !(isAuthenticated && needsProfileCompletion) && (
                      <ReferralTasksCard
                        model={program.pathway}
                        preview={true}
                      />
                    )}
                </>
              }
              right={
                <div className="flex flex-col gap-2 rounded-xl bg-white p-4 shadow">
                  <ReferralStatCard
                    icon={<IoTrophyOutline className="h-5 w-5" />}
                    header="Reward"
                    description={
                      (program.zltoRewardRefereeEstimate || 0) > 0
                        ? `${program.zltoRewardRefereeEstimate} Zlto`
                        : "No reward"
                    }
                    className="bg-purple-dark text-white [&_.referral-stat-card-description]:text-white/90 [&_.referral-stat-card-header]:text-white [&_.referral-stat-card-icon-wrap]:bg-white/20 [&_.referral-stat-card-icon-wrap]:text-white"
                  />

                  <ReferralStatCard
                    icon={<IoTimeOutline className="h-5 w-5" />}
                    header="Time requirement"
                    description={
                      program.completionWindowInDays
                        ? `${program.completionWindowInDays} day${program.completionWindowInDays === 1 ? "" : "s"}`
                        : "No time limit"
                    }
                  />
                </div>
              }
            />
          </>
        ) : null}
      </ReferralShell>
    </>
  );
};

ReferralClaimPage.getLayout = function getLayout(page: ReactElement) {
  return <MainLayout>{page}</MainLayout>;
};

ReferralClaimPage.theme = function getTheme() {
  return THEME_WHITE;
};

export default ReferralClaimPage;
