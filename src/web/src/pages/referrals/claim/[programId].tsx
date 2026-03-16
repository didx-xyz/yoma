import { QueryClient, dehydrate } from "@tanstack/react-query";
import { useAtomValue, useSetAtom } from "jotai";
import { type GetServerSidePropsContext } from "next";
import { getServerSession } from "next-auth";
import Head from "next/head";
import { useRouter } from "next/router";
import { useCallback, useEffect, useState, type ReactElement } from "react";
import { IoGift, IoTimeOutline, IoTrophyOutline } from "react-icons/io5";
import type { UserProfile } from "~/api/models/user";
import {
  claimReferralLinkAsReferee,
  getReferralProgramInfoByLinkId,
} from "~/api/services/referrals";
import { getUserProfile } from "~/api/services/user";
import MainLayout from "~/components/Layout/Main";
import NoRowsMessage from "~/components/NoRowsMessage";
import { AlternativeActions } from "~/components/Referrals/AlternativeActions";
import { BecomeReferrerCTA } from "~/components/Referrals/BecomeReferrerCTA";
import { ReferralInfoCard } from "~/components/Referrals/ReferralInfoCard";
import { ReferralMainColumns } from "~/components/Referrals/ReferralMainColumns";
import { ReferralShell } from "~/components/Referrals/ReferralShell";
import { ReferralStatCard } from "~/components/Referrals/ReferralStatCard";
import { ReferralTasksCard } from "~/components/Referrals/ReferralTasksCard";
import { ReferralTopCard } from "~/components/Referrals/ReferralTopCard";
import { LoadingInline } from "~/components/Status/LoadingInline";
import { ProfileCompletionWizard } from "~/components/User/ProfileCompletionWizard";
import {
  REFERRAL_PROGRAM_QUERY_KEYS,
  useReferralProgramInfoByLinkQuery,
} from "~/hooks/useReferralProgramMutations";
import analytics from "~/lib/analytics";
import { escapeHtml, parseApiError } from "~/lib/apiErrorUtils";
import { handleUserSignIn } from "~/lib/authUtils";
import { THEME_WHITE } from "~/lib/constants";
import { config } from "~/lib/react-query-config";
import { currentLanguageAtom, userProfileAtom } from "~/lib/store";
import { cleanTextForMetaTag } from "~/lib/utils";
import { getProfileCompletionStep } from "~/lib/utils/profile";
import { authOptions } from "~/server/auth";
import { type NextPageWithLayout } from "../../_app";

const getErrorSearchText = (error: any): string => {
  const data = error?.response?.data;

  if (typeof data === "string") return data;

  if (data && typeof data === "object") {
    try {
      return JSON.stringify(data);
    } catch {
      return "";
    }
  }

  return "";
};

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const session = await getServerSession(context.req, context.res, authOptions);

  const { programId } = context.params!;
  const { linkId } = context.query;

  if (!programId || typeof programId !== "string") {
    return {
      notFound: true,
    };
  }

  if (!linkId || typeof linkId !== "string") {
    return {
      props: {
        error: "Link ID is required",
        programId,
        isAuthenticated: !!session,
      },
    };
  }

  const queryClient = new QueryClient(config);

  try {
    // Prefetch program info using the new endpoint that accepts linkId
    await queryClient.fetchQuery({
      queryKey: REFERRAL_PROGRAM_QUERY_KEYS.infoByLink(linkId),
      queryFn: () => getReferralProgramInfoByLinkId(linkId, context),
    });

    // If user is authenticated, check profile completion status
    if (session) {
      try {
        // Get user profile to check completion status
        const userProfile = await getUserProfile(context);
        const completionStep = getProfileCompletionStep(userProfile);

        // If profile is not complete, return props to show profile completion wizard
        // Don't attempt claim server-side as settings and photo steps are optional
        if (completionStep !== "complete") {
          return {
            props: {
              dehydratedState: dehydrate(queryClient),
              linkId,
              programId,
              isAuthenticated: true,
              needsProfileCompletion: true,
              userProfile,
            },
          };
        }

        // Profile is complete, but don't claim server-side
        // Let client-side handle claim to show loading state
        return {
          props: {
            dehydratedState: dehydrate(queryClient),
            linkId,
            programId,
            isAuthenticated: true,
            needsProfileCompletion: false,
            userProfile,
          },
        };
      } catch (error: any) {
        console.error("Error checking user profile:", error);
        // Return authenticated state, let client handle
        return {
          props: {
            dehydratedState: dehydrate(queryClient),
            linkId,
            programId,
            isAuthenticated: true,
          },
        };
      }
    }

    return {
      props: {
        dehydratedState: dehydrate(queryClient),
        linkId,
        programId,
        isAuthenticated: !!session,
      },
    };
  } catch (error) {
    console.error("Error fetching referral program:", error);
    return {
      props: {
        error: "Program not found or unavailable",
        linkId,
        programId,
        isAuthenticated: !!session,
      },
    };
  }
}

const ReferralClaimPage: NextPageWithLayout<{
  linkId: string;
  programId: string;
  isAuthenticated: boolean;
  error?: string;
  needsProfileCompletion?: boolean;
  userProfile?: UserProfile;
}> = ({
  linkId,
  programId,
  isAuthenticated,
  error: serverError,
  needsProfileCompletion,
  userProfile: serverUserProfile,
}) => {
  const router = useRouter();
  const [claiming, setClaiming] = useState(false);
  const [claimingAfterProfile, setClaimingAfterProfile] = useState(false);
  const [claimError, setClaimError] = useState<any>(null);
  const [claimAttempted, setClaimAttempted] = useState(false);
  const currentLanguage = useAtomValue(currentLanguageAtom);
  const userProfile = useAtomValue(userProfileAtom);
  const setUserProfile = useSetAtom(userProfileAtom);

  // Update atom with server-side user profile if available
  useEffect(() => {
    if (serverUserProfile && !userProfile) {
      setUserProfile(serverUserProfile);
    }
  }, [serverUserProfile, userProfile, setUserProfile]);

  // Fetch program data
  const {
    data: program,
    error: programError,
    isLoading: programLoading,
  } = useReferralProgramInfoByLinkQuery(linkId, { enabled: !serverError });

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

  const performClaim = useCallback(async () => {
    // Prevent multiple claim attempts
    if (claimAttempted) return;

    setClaimAttempted(true);
    setClaimingAfterProfile(true);
    setClaimError(null);
    try {
      await claimReferralLinkAsReferee(linkId);

      // Refresh user profile to include new referral data
      // This ensures UserMenu shows the referee dashboard link
      const updatedProfile = await getUserProfile();
      setUserProfile(updatedProfile);

      // Scroll to top before redirect
      window.scrollTo({ top: 0, behavior: "smooth" });

      // Successfully claimed - redirect to referee progress page
      await router.push(`/referrals/progress/${programId}?claimed=true`);
    } catch (error: any) {
      // Scroll to top to show error
      window.scrollTo({ top: 0, behavior: "smooth" });

      // Store the full error object for parsing
      setClaimError(error);

      setClaimingAfterProfile(false);
    }
  }, [linkId, programId, router, claimAttempted, setUserProfile]);

  // Watch for profile updates (from global profile completion wizard)
  // and retry claim when profile becomes complete
  useEffect(() => {
    const checkProfileAndClaim = async () => {
      if (
        isAuthenticated &&
        userProfile &&
        !claimAttempted &&
        !claimingAfterProfile &&
        program &&
        !claimError
      ) {
        const completionStep = getProfileCompletionStep(userProfile);
        if (completionStep === "complete") {
          // Profile is now complete, attempt claim
          performClaim();
        }
      }
    };

    checkProfileAndClaim();
  }, [
    userProfile,
    isAuthenticated,
    claimAttempted,
    claimingAfterProfile,
    program,
    claimError,
    performClaim,
  ]);

  const handleProfileComplete = useCallback(() => {
    // After profile completion, perform the claim
    performClaim();
  }, [performClaim]);

  // Auto-claim when authenticated and profile is complete
  useEffect(() => {
    if (
      isAuthenticated &&
      needsProfileCompletion === false &&
      !claimingAfterProfile &&
      !claimAttempted &&
      program &&
      !claimError
    ) {
      performClaim();
    }
  }, [
    isAuthenticated,
    needsProfileCompletion,
    claimingAfterProfile,
    claimAttempted,
    program,
    claimError,
    performClaim,
  ]);

  // Loading state
  if (programLoading || claimingAfterProfile) {
    return (
      <div className="mt-40 justify-center">
        <LoadingInline
          classNameSpinner="h-8 w-8 border-t-2 border-b-2 border-orange md:h-16 md:w-16 md:border-t-4 md:border-b-4"
          classNameLabel={"text-sm font-semibold md:text-base"}
          label={
            claimingAfterProfile
              ? "Claiming your referral..."
              : "Please wait..."
          }
        />
      </div>
    );
  }

  // Error states
  if (serverError || programError || !program) {
    const referralUnavailableDescription = `
      <div class="text-center mt-8">
        <h3 class="text-[10px] md:text-xs font-semibold text-gray-900 mb-2">What might have happened?</h3>
        <ul class="text-left text-[10px] md:text-xs ml-6 list-disc space-y-1 text-gray-700">
          <li>The link may have expired or reached its usage limit</li>
          <li>The person who shared it may have cancelled it</li>
          <li>The referral program may no longer be active</li>
          <li>The link URL might be incorrect</li>
        </ul>
      </div>
    `;

    return (
      <div className="container mx-auto mt-20 flex max-w-5xl flex-col gap-8 px-4 py-8">
        <NoRowsMessage
          title="Referral Link Unavailable"
          subTitle="This referral link is invalid, expired, or has been removed."
          description={referralUnavailableDescription}
          icon={"⚠️"}
          className="w-full !bg-transparent"
        />

        <BecomeReferrerCTA />

        <AlternativeActions />
      </div>
    );
  }

  // Claim error state - user is authenticated but claim failed
  if (claimError && program) {
    const { errors: customErrors, message: errorMessage } =
      parseApiError(claimError);

    const hasCustomErrors = customErrors.length > 0;
    const fallbackMessage =
      "Failed to claim referral link. You may have already claimed it or are not eligible.";
    const safeErrorMessage = errorMessage || fallbackMessage;
    const rawErrorText = getErrorSearchText(claimError);

    // Check if user already claimed this link - redirect to progress page
    const alreadyClaimed =
      customErrors.some((error) => /already claimed/i.test(error.message)) ||
      /already claimed/i.test(safeErrorMessage) ||
      /already claimed|you already claimed|still pending/i.test(rawErrorText);

    if (alreadyClaimed) {
      router.push(`/referrals/progress/${programId}`);
      return (
        <div className="flex min-h-screen items-center justify-center">
          <LoadingInline
            classNameSpinner="h-8 w-8 border-t-2 border-b-2 border-orange md:h-16 md:w-16 md:border-t-4 md:border-b-4"
            classNameLabel={"text-sm font-semibold md:text-lg"}
            label="Redirecting to your progress page..."
          />
        </div>
      );
    }

    const isCountryRestricted =
      customErrors.some((error) => /country/i.test(error.message)) ||
      /country/i.test(safeErrorMessage);

    const claimErrorReasons = hasCustomErrors
      ? customErrors.map((error) =>
          escapeHtml(error.message || "Unknown reason"),
        )
      : [
          "You&apos;ve already claimed this referral link",
          "You don&apos;t meet the program requirements",
          "The link has reached its maximum number of claims",
          "The link has expired",
          "You may have already claimed a different referral for this program",
        ];

    const claimErrorDescription = `
      <div class="text-center mt-8">
        <h3 class="text-[10px] md:text-xs font-semibold text-gray-900 mb-2">${
          hasCustomErrors ? "" : "Common reasons this might happen:"
        }</h3>
        <ul class="text-left text-[10px] md:text-xs ml-6 list-disc space-y-1 text-gray-700">
          ${claimErrorReasons
            .slice(0, 6)
            .map((reason) => `<li>${reason}</li>`)
            .join("\n")}
        </ul>
      </div>
    `;

    return (
      <div className="container mx-auto mt-18 flex max-w-3xl flex-col gap-4 px-4 py-8">
        <NoRowsMessage
          icon={"⚠️"}
          title={
            isCountryRestricted
              ? "Referral Not Available"
              : "Unable to Claim Referral Link"
          }
          subTitle={
            !hasCustomErrors
              ? safeErrorMessage
              : isCountryRestricted
                ? "This referral link can’t be claimed from your country."
                : undefined
          }
          description={claimErrorDescription}
          className="w-full !bg-transparent"
        />

        <BecomeReferrerCTA />

        <AlternativeActions />
      </div>
    );
  }

  // Main claim page
  const rewardAmount = program?.zltoRewardReferee;

  const title = rewardAmount
    ? `Join me on Yoma and earn ${rewardAmount} ZLTO!`
    : "Join me on Yoma!";

  const description = rewardAmount
    ? `Join me on Yoma and earn ${rewardAmount} ZLTO! Sign up to build your digital CV and access opportunities.`
    : "Join me on Yoma! Sign up to build your digital CV and access opportunities.";

  const safeTitle = cleanTextForMetaTag(title, 60);
  const safeDescription = cleanTextForMetaTag(description, 160);
  const imageUrl = program?.imageURL || "";

  return (
    <>
      <Head>
        <title>{`Yoma | Ambassador Referrals | ${program.name}`}</title>
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
        title={program.name}
        breadcrumbLabel="Referrals"
        //programImageUrl={program?.imageURL || undefined}
        headerBackgroundMode="color"
        headerBackgroundColorClassName="bg-orange"
        onBack={() => router.push("/referrals")}
      >
        <ReferralTopCard
          program={program}
          rewardsReferrer={false}
          rewardsReferee={true}
          cta={
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
              {!isAuthenticated
                ? "Login to claim"
                : needsProfileCompletion
                  ? "Complete profile to claim"
                  : "Claiming referral..."}
            </button>
          }
        />

        <ReferralMainColumns
          left={
            <>
              <ReferralInfoCard>
                <p>
                  Welcome to Yoma! You were invited to join{" "}
                  <strong>{program.name}</strong>.
                  {(program.zltoRewardReferee || 0) > 0 ? (
                    <>
                      {" "}
                      Complete the below pathway and get the opportunity to win{" "}
                      <strong>{program.zltoRewardReferee}</strong> Zlto.
                    </>
                  ) : (
                    <> Complete the below pathway to complete this programme.</>
                  )}
                </p>

                <p>{program.description}</p>
              </ReferralInfoCard>

              {isAuthenticated && needsProfileCompletion && (
                <div className="rounded-xl bg-white p-4 shadow md:p-5">
                  <ProfileCompletionWizard
                    userProfile={userProfile || serverUserProfile || null}
                    onComplete={handleProfileComplete}
                    showHeader={false}
                  />
                </div>
              )}

              <ReferralTasksCard model={program.pathway} />
            </>
          }
          right={
            <>
              <ReferralStatCard
                icon={<IoTrophyOutline className="h-5 w-5" />}
                header="Reward"
                description={
                  (program.zltoRewardReferee || 0) > 0
                    ? `${program.zltoRewardReferee} Zlto`
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
            </>
          }
        />
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
