import { QueryClient, dehydrate, useQuery } from "@tanstack/react-query";
import { useAtomValue, useSetAtom } from "jotai";
import { type GetServerSidePropsContext } from "next";
import { getServerSession } from "next-auth";
import Head from "next/head";
import { useRouter } from "next/router";
import { useCallback, useEffect, useState, type ReactElement } from "react";
import { IoLockClosed, IoWarning } from "react-icons/io5";
import type { ErrorResponseItem } from "~/api/models/common";
import type { ProgramInfo } from "~/api/models/referrals";
import type { UserProfile } from "~/api/models/user";
import {
  claimReferralLinkAsReferee,
  getReferralProgramInfoByLinkId,
} from "~/api/services/referrals";
import { getUserProfile } from "~/api/services/user";
import MainLayout from "~/components/Layout/Main";
import { AlternativeActions } from "~/components/Referrals/AlternativeActions";
import { BecomeReferrerCTA } from "~/components/Referrals/BecomeReferrerCTA";
import { HelpReferee } from "~/components/Referrals/HelpReferee";
import { RefereeImportantInfo } from "~/components/Referrals/RefereeImportantInfo";
import { RefereeProgramDetails } from "~/components/Referrals/RefereeProgramDetails";
import { RefereeRequirements } from "~/components/Referrals/RefereeRequirements";
import { LoadingInline } from "~/components/Status/LoadingInline";
import { ProfileCompletionWizard } from "~/components/User/ProfileCompletionWizard";
import analytics from "~/lib/analytics";
import { handleUserSignIn } from "~/lib/authUtils";
import { config } from "~/lib/react-query-config";
import { currentLanguageAtom, userProfileAtom } from "~/lib/store";
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
  if (serverUserProfile && !userProfile) {
    setUserProfile(serverUserProfile);
  }

  // Fetch program data using the new endpoint with linkId
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
    analytics.trackEvent("link_clain_login_button_clicked", {
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
      <div className="flex min-h-screen items-center justify-center">
        <LoadingInline
          classNameSpinner="h-32 w-32 border-t-4 border-b-4 border-orange"
          classNameLabel={"text-lg font-semibold"}
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
    return (
      <div className="container mx-auto mt-16 max-w-5xl px-4 py-12">
        {/* Error Hero Section */}
        <div className="mb-8 rounded-xl border-4 border-orange-300 bg-gradient-to-br from-orange-50 via-yellow-50 to-white p-8 shadow-xl">
          <div className="mb-6 flex flex-col items-center gap-4 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-red-400 shadow-lg">
              <IoWarning className="h-12 w-12 text-white" />
            </div>
            <div>
              <h1 className="mb-2 text-lg font-bold text-orange-900 md:text-2xl">
                Referral Link Unavailable
              </h1>
              <p className="text-sm text-gray-700 md:text-base">
                This referral link is invalid, expired, or has been removed.
              </p>
            </div>
          </div>

          <div className="rounded-lg border-2 border-orange-200 bg-white p-6">
            <h3 className="mb-3 text-lg font-bold text-gray-900">
              What might have happened?
            </h3>
            <ul className="ml-6 list-disc space-y-2 text-sm text-gray-700">
              <li>The link may have expired or reached its usage limit</li>
              <li>The person who shared it may have cancelled it</li>
              <li>The referral program may no longer be active</li>
              <li>The link URL might be incorrect</li>
            </ul>
          </div>
        </div>

        {/* Become a Referrer Section */}
        <div className="mb-8">
          <BecomeReferrerCTA />
        </div>

        {/* Alternative Actions */}
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

    return (
      <div className="container mx-auto mt-16 max-w-5xl px-4 py-12">
        {/* Claim Error Hero Section */}
        <div className="mb-8 rounded-xl border-4 border-red-300 bg-gradient-to-br from-red-50 via-orange-50 to-white p-8 shadow-xl">
          <div className="mb-6 flex flex-col items-center gap-4 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-red-400 to-orange-400 shadow-lg">
              <IoWarning className="h-12 w-12 text-white" />
            </div>
            <div>
              <h1 className="mb-2 text-lg font-bold text-red-900 md:text-2xl">
                Unable to Claim Referral Link
              </h1>
              {!hasCustomErrors && (
                <p className="text-sm text-gray-700 md:text-base">
                  {errorMessage}
                </p>
              )}
            </div>
          </div>

          <div className="rounded-lg border-2 border-red-200 bg-white p-6">
            <h3 className="mb-3 text-lg font-bold text-gray-900">
              {hasCustomErrors
                ? "Reasons:"
                : "Common reasons this might happen:"}
            </h3>
            <ul className="ml-6 list-disc space-y-2 text-sm text-gray-700">
              {hasCustomErrors ? (
                // Show custom errors from API
                customErrors.map((error, index) => (
                  <li key={index}>{error.message}</li>
                ))
              ) : (
                // Show default reasons
                <>
                  <li>You&apos;ve already claimed this referral link</li>
                  <li>You don&apos;t meet the program requirements</li>
                  <li>The link has reached its maximum number of claims</li>
                  <li>The link has expired</li>
                  <li>
                    You may have already claimed a different referral for this
                    program
                  </li>
                </>
              )}
            </ul>
          </div>
        </div>

        {/* Become a Referrer Section */}
        <div className="mb-8">
          <BecomeReferrerCTA />
        </div>

        {/* Alternative Actions */}
        <AlternativeActions />
      </div>
    );
  }

  // Main claim page
  return (
    <>
      <Head>
        <title>Join {program.name} | Yoma Referral</title>
        <meta
          name="description"
          content={`Join ${program.name} through a friend&apos;s referral link and earn rewards!`}
        />
      </Head>

      <div className="container mx-auto mt-20 flex max-w-5xl flex-col gap-8 px-4 py-8">
        {/* Hero Section */}
        <div className="rounded-xl border-4 border-orange-200 bg-gradient-to-br from-orange-50 via-yellow-50 to-white p-8 shadow-xl">
          <div className="flex flex-col items-center gap-4 md:flex-row md:justify-between">
            {!isAuthenticated && (
              <div className="flex flex-1 flex-col gap-2">
                <h1 className="text-lg font-bold text-orange-900 md:text-xl">
                  🎁 You&apos;ve Been Invited!
                </h1>
                <p className="mb-2x text-sm text-gray-700">
                  A friend has invited you to join the following program:
                </p>
                <RefereeProgramDetails
                  program={program}
                  perspective="referee"
                  isExpanded={false}
                />
              </div>
            )}

            {isAuthenticated && needsProfileCompletion && (
              <div className="flex flex-1 flex-col gap-2">
                <h1 className="text-lg font-bold text-orange-900 md:text-xl">
                  🎁 Almost there!
                </h1>
                <p className="mb-2x text-sm text-gray-700">
                  Complete your profile to join the following program:
                </p>
                <RefereeProgramDetails
                  program={program}
                  perspective="referee"
                  isExpanded={false}
                />
              </div>
            )}
          </div>
        </div>

        {/* Profile Completion Wizard - Only show if user is authenticated but profile is incomplete */}
        {needsProfileCompletion && (
          <ProfileCompletionWizard
            userProfile={userProfile || serverUserProfile || null}
            onComplete={handleProfileComplete}
            showHeader={true}
          />
        )}

        {(!isAuthenticated || (isAuthenticated && !needsProfileCompletion)) && (
          <>
            {/* How It Works - Referee Perspective */}
            <HelpReferee isExpanded={!isAuthenticated} program={program} />

            {/* Requirements Section */}
            <RefereeRequirements
              program={program}
              isExpanded={!isAuthenticated}
            />

            {/* Important Information */}
            <RefereeImportantInfo
              program={program}
              isExpanded={!isAuthenticated || needsProfileCompletion}
            />
          </>
        )}

        {/* CTA Section */}
        {!isAuthenticated && (
          <div className="rounded-xl border-4 border-orange-300 bg-gradient-to-br from-orange-100 to-yellow-100 p-6 shadow-2xl">
            <div className="flex flex-col items-center gap-4 md:flex-row md:justify-between">
              <div>
                <h3 className="text-xl font-bold text-orange-900">
                  Ready to Get Started?
                </h3>
                <p className="text-sm text-gray-700">
                  {isAuthenticated
                    ? "Claim this referral link to begin your journey"
                    : "Create an account to claim this link"}
                </p>
              </div>
              <button
                type="button"
                onClick={handleClaim}
                disabled={claiming}
                className="btn btn-warning btn-lg gap-2 px-8 text-white shadow-lg transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-2xl disabled:opacity-50 disabled:hover:scale-100"
              >
                {claiming && (
                  <LoadingInline
                    classNameSpinner="  h-6 w-6"
                    classNameLabel="hidden"
                  />
                )}
                {!claiming && <IoLockClosed className="h-6 w-6" />}
                <p>Claim Your Spot Now!</p>
              </button>
            </div>
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
