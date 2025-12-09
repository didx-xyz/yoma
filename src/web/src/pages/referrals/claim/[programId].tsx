import { QueryClient, dehydrate, useQuery } from "@tanstack/react-query";
import { useAtomValue, useSetAtom } from "jotai";
import { type GetServerSidePropsContext } from "next";
import { getServerSession } from "next-auth";
import Head from "next/head";
import { useRouter } from "next/router";
import { useCallback, useEffect, useState, type ReactElement } from "react";
import { IoGift, IoWarningOutline } from "react-icons/io5";
import type { ErrorResponseItem } from "~/api/models/common";
import type { ProgramInfo } from "~/api/models/referrals";
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
import { LoadingInline } from "~/components/Status/LoadingInline";
import { ProfileCompletionWizard } from "~/components/User/ProfileCompletionWizard";
import analytics from "~/lib/analytics";
import { handleUserSignIn } from "~/lib/authUtils";
import { config } from "~/lib/react-query-config";
import { currentLanguageAtom, userProfileAtom } from "~/lib/store";
import { cleanTextForMetaTag } from "~/lib/utils";
import { getProfileCompletionStep } from "~/lib/utils/profile";
import { authOptions } from "~/server/auth";
import { type NextPageWithLayout } from "../../_app";

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
    await queryClient.prefetchQuery({
      queryKey: ["ReferralProgramByLink", linkId],
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
  } = useQuery<ProgramInfo>({
    queryKey: ["ReferralProgramByLink", linkId],
    queryFn: () => getReferralProgramInfoByLinkId(linkId),
    enabled: !serverError && !!linkId,
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

      // Successfully claimed - redirect to referee dashboard
      await router.push(`/yoid/referee/${programId}?claimed=true`);
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
      <div class="text-center mt-10">
        <h3 class="text-xs md:text-sm font-bold text-gray-900 mb-2">What might have happened?</h3>
        <ul class="text-left text-xs md:text-sm ml-6 list-disc space-y-2 text-gray-700">
          <li>The link may have expired or reached its usage limit</li>
          <li>The person who shared it may have cancelled it</li>
          <li>The referral program may no longer be active</li>
          <li>The link URL might be incorrect</li>
        </ul>
      </div>
    `;

    return (
      <div className="container mx-auto mt-20 flex max-w-5xl flex-col gap-8 px-4 py-8">
        <div className="flex items-center justify-center">
          <NoRowsMessage
            title="Referral Link Unavailable"
            subTitle="This referral link is invalid, expired, or has been removed."
            description={referralUnavailableDescription}
            icon={<IoWarningOutline className="h-6 w-6 text-red-500" />}
            className="max-w-3xl !bg-transparent"
          />
        </div>

        <BecomeReferrerCTA />

        <AlternativeActions />
      </div>
    );
  }

  // Claim error state - user is authenticated but claim failed
  if (claimError && program) {
    // Parse errors from the API response
    const customErrors = claimError.response?.data as ErrorResponseItem[];
    const hasCustomErrors =
      Array.isArray(customErrors) && customErrors.length > 0;
    const errorMessage =
      claimError?.response?.data?.message ||
      "Failed to claim referral link. You may have already claimed it or are not eligible.";

    // Check if user already claimed this link - redirect to dashboard
    const alreadyClaimedError = customErrors?.find((error) =>
      error.message?.includes("You already claimed this link"),
    );
    if (alreadyClaimedError) {
      router.push(`/yoid/referee/${programId}`);
      return (
        <div className="flex min-h-screen items-center justify-center">
          <LoadingInline
            classNameSpinner="h-8 w-8 border-t-2 border-b-2 border-orange md:h-16 md:w-16 md:border-t-4 md:border-b-4"
            classNameLabel={"text-sm font-semibold md:text-lg"}
            label="Redirecting to your dashboard..."
          />
        </div>
      );
    }

    const claimErrorReasons = hasCustomErrors
      ? (customErrors ?? []).map((error) => error.message || "Unknown reason")
      : [
          "You&apos;ve already claimed this referral link",
          "You don&apos;t meet the program requirements",
          "The link has reached its maximum number of claims",
          "The link has expired",
          "You may have already claimed a different referral for this program",
        ];

    const claimErrorDescription = `
      <div class="text-center mt-10">
        <h3 class="text-xs md:text-sm font-bold text-gray-900 mb-2">${hasCustomErrors ? "Reasons:" : "Common reasons this might happen:"}</h3>
        <ul class="text-left text-xs md:text-sm ml-6 list-disc space-y-2 text-gray-700">
          ${claimErrorReasons.map((reason) => `<li>${reason}</li>`).join("")}
        </ul>
      </div>
    `;

    return (
      <div className="container mx-auto mt-20 flex max-w-5xl flex-col gap-8 px-4 py-8">
        <div className="flex items-center justify-center">
          <NoRowsMessage
            icon={<IoWarningOutline className="h-6 w-6 text-red-500" />}
            title="Unable to Claim Referral Link"
            subTitle={!hasCustomErrors ? errorMessage : undefined}
            description={claimErrorDescription}
            className="max-w-3xl !bg-transparent"
          />
        </div>

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
        <title>{safeTitle}</title>
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

      <div className="container mx-auto mt-20 flex max-w-5xl flex-col gap-8 px-4 py-8">
        {/* Welcome: Referee */}
        {!isAuthenticated && (
          <div className="flex items-center justify-center">
            <div className="flex flex-col">
              <NoRowsMessage
                title="You've been invited!"
                description="Click the button below to join Yoma and earn rewards when you complete the program requirements."
                icon={"❤️"}
                className="max-w-3xl !bg-transparent"
              />

              {program.proofOfPersonhoodRequired && (
                <div className="text-gray-dark text-center text-xs md:text-sm">
                  Please login using <strong>Social Media</strong>{" "}
                  (Google/Facebook) or scroll to the bottom and register with a{" "}
                  <strong>Phone Number</strong>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Profile Completion Wizard - Only show if user is authenticated but profile is incomplete */}
        {isAuthenticated && needsProfileCompletion && (
          <ProfileCompletionWizard
            userProfile={userProfile || serverUserProfile || null}
            onComplete={handleProfileComplete}
            showHeader={false}
          />
        )}

        {/* CTA Section */}
        {!isAuthenticated && (
          <div className="flex flex-col items-center">
            <button
              type="button"
              onClick={handleClaim}
              disabled={claiming}
              className="btn btn-warning gap-2 px-8 text-white shadow-lg transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-2xl disabled:opacity-50 disabled:hover:scale-100"
            >
              {claiming && (
                <LoadingInline
                  classNameSpinner="h-4 w-4 md:h-6 md:w-6"
                  classNameLabel="hidden"
                />
              )}
              {!claiming && <IoGift className="h-6 w-6" />}
              <p>Join Yoma!</p>
            </button>
          </div>
        )}
      </div>
    </>
  );
};

ReferralClaimPage.getLayout = function getLayout(page: ReactElement) {
  return <MainLayout>{page}</MainLayout>;
};

export default ReferralClaimPage;
