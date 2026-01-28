import { QueryClient, dehydrate, useQuery } from "@tanstack/react-query";
import { type GetServerSidePropsContext } from "next";
import { getServerSession } from "next-auth";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, type ReactElement } from "react";
import {
  IoArrowForward,
  IoCart,
  IoGift,
  IoHeart,
  IoRocket,
  IoShareSocial,
  IoStorefront,
  IoTrophy,
  IoWarning,
  IoWarningOutline,
} from "react-icons/io5";
import { toast } from "react-toastify";
import type {
  PathwayTaskEntityType,
  ProgramInfo,
  ReferralLinkUsageInfo,
} from "~/api/models/referrals";
import {
  getReferralLinkUsageByProgramIdAsReferee,
  getReferralProgramInfoById,
} from "~/api/services/referrals";
import Breadcrumb from "~/components/Breadcrumb";
import MainLayout from "~/components/Layout/Main";
import YoIDLayout from "~/components/Layout/YoID";
import NoRowsMessage from "~/components/NoRowsMessage";
import { AlternativeActions } from "~/components/Referrals/AlternativeActions";
import { BecomeReferrerCTA } from "~/components/Referrals/BecomeReferrerCTA";
import {
  PathwayTasksList,
  TaskInstructionHeader,
} from "~/components/Referrals/InstructionHeaders";
import { getNextAction } from "~/components/Referrals/RefereeProgressTracker";
import { RefereeStatusBanner } from "~/components/Referrals/RefereeStatusBanner";
import { LoadingInline } from "~/components/Status/LoadingInline";
import { Unauthenticated } from "~/components/Status/Unauthenticated";
import { handleUserSignOut } from "~/lib/authUtils";
import { config } from "~/lib/react-query-config";
import { getSafeUrl } from "~/lib/utils";
import { authOptions } from "~/server/auth";
import { type NextPageWithLayout } from "../../_app";

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const session = await getServerSession(context.req, context.res, authOptions);

  // 👇 ensure authenticated
  if (!session) {
    return {
      props: {
        error: 401,
      },
    };
  }

  const { programId } = context.params!;

  if (!programId || typeof programId !== "string") {
    return {
      notFound: true,
    };
  }

  const queryClient = new QueryClient(config);

  try {
    // Prefetch program and usage data
    await queryClient.prefetchQuery({
      queryKey: ["RefereeUsage", programId],
      queryFn: () =>
        getReferralLinkUsageByProgramIdAsReferee(programId, context),
    });

    await queryClient.prefetchQuery({
      queryKey: ["ReferralProgram", programId],
      queryFn: () => getReferralProgramInfoById(programId, context),
    });

    return {
      props: {
        dehydratedState: dehydrate(queryClient),
        programId,
        user: session?.user ?? null,
      },
    };
  } catch (error) {
    console.error("Error fetching referee data:", error);
    return {
      props: {
        error: "Failed to load referral information",
        programId,
        user: session?.user ?? null,
      },
    };
  }
}

const RefereeDashboard: NextPageWithLayout<{
  programId: string;
  error?: number;
}> = ({ programId, error: serverError }) => {
  const router = useRouter();

  const panelClassName =
    "mb-4 rounded-xl border border-base-300 bg-base-100 p-4 shadow-sm md:p-5";

  // Show success message if user just claimed the link
  useEffect(() => {
    if (router.query.claimed === "true") {
      toast.success("Successfully claimed! Welcome to the program. 🎉");
      // Remove the query parameter
      router.replace(`/yoid/referee/${programId}`, undefined, {
        shallow: true,
      });
    }
  }, [router, programId]);

  // Fetch usage data
  const {
    data: usage,
    error: usageError,
    isLoading: usageLoading,
  } = useQuery<ReferralLinkUsageInfo>({
    queryKey: ["RefereeUsage", programId],
    queryFn: () => getReferralLinkUsageByProgramIdAsReferee(programId),
    enabled: !serverError,
    refetchInterval: 30000, // Refetch every 30 seconds to get updated progress
  });

  // Fetch program data
  const {
    data: program,
    error: programError,
    isLoading: programLoading,
  } = useQuery<ProgramInfo>({
    queryKey: ["ReferralProgram", programId],
    queryFn: () => getReferralProgramInfoById(programId),
    enabled: !serverError,
  });

  // Check if we're redirecting to Keycloak for authentication
  const isRedirectingToKeycloak = router.query.signInAgain === "true";

  if (serverError === 401) {
    // If redirecting to Keycloak, show loading instead of unauthenticated
    if (isRedirectingToKeycloak) {
      return (
        <div className="container mx-auto mt-20 flex max-w-3xl flex-col gap-8 py-8">
          <LoadingInline
            classNameSpinner="h-8 w-8 border-t-2 border-b-2 border-orange md:h-16 md:w-16 md:border-t-4 md:border-b-4"
            classNameLabel={"text-sm font-semibold md:text-base"}
            label="Redirecting to sign in..."
          />
        </div>
      );
    }
    return <Unauthenticated />;
  }

  if (usageLoading || programLoading) {
    return (
      <div className="container mx-auto flex max-w-3xl flex-col gap-8 py-8">
        <LoadingInline
          classNameSpinner="h-8 w-8 border-t-2 border-b-2 border-orange md:h-16 md:w-16 md:border-t-4 md:border-b-4"
          classNameLabel={"text-sm font-semibold md:text-base"}
          label="Please wait..."
        />
      </div>
    );
  }

  if (serverError || usageError || programError || !usage || !program) {
    const refereeErrorDescription = `
      <div class="text-center mt-10">
        <h3 class="text-xs md:text-sm font-bold text-gray-900 mb-2">What might have happened?</h3>
        <ul class="text-left text-xs md:text-sm ml-6 list-disc space-y-2 text-gray-700">
          <li>You may not have claimed a referral link for this program yet</li>
          <li>Your referral may have expired or been completed</li>
          <li>The program may no longer be active</li>
          <li>The program ID in the URL might be incorrect</li>
        </ul>
      </div>
    `;

    return (
      <div className="container mx-auto flex max-w-3xl flex-col gap-8 py-8">
        <div className="flex items-center justify-center">
          <NoRowsMessage
            title="Referral Not Found"
            subTitle="You don't have an active referral for this program."
            description={refereeErrorDescription}
            icon={<IoWarningOutline className="h-6 w-6 text-red-500" />}
            className="max-w-3xl !bg-transparent"
          />
        </div>

        <BecomeReferrerCTA />

        <AlternativeActions />
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Yoma | My Referral Progress | {program.name}</title>
      </Head>

      <div className="w-full lg:max-w-3xl">
        {/* BREADCRUMB */}
        <div className="text-base-content/70 mb-4 text-[10px] font-semibold tracking-wide md:text-xs">
          <Breadcrumb
            items={[
              { title: "💳 Yo-ID", url: "/yoid" },
              {
                title: "My Referral",
                selected: true,
              },
            ]}
          />
        </div>

        {/* STATUS BANNER */}
        <RefereeStatusBanner usage={usage} program={program} />

        {/* NEXT ACTION (PENDING) */}
        {usage.status === "Pending" &&
          (() => {
            const nextAction = getNextAction(usage, program);
            const popRequired = program.proofOfPersonhoodRequired;
            const popCompleted = usage.proofOfPersonhoodCompleted ?? false;

            // Show POP verification next action if required and not completed
            const showPOPAction = popRequired && !popCompleted;

            // If pathway required, show next action
            return (
              <>
                {/* Proof of Personhood Verification */}
                {showPOPAction && (
                  <div id="next-action-pop" className={panelClassName}>
                    <div className="flex items-start gap-3 md:gap-4">
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md bg-green-50 md:h-12 md:w-12">
                        <IoArrowForward className="h-5 w-5 text-green-600 md:h-6 md:w-6" />
                      </div>

                      <div className="min-w-0">
                        <h2 className="font-family-nunito text-base-content text-xs font-semibold md:text-sm">
                          Next step
                        </h2>
                        <p className="text-base-content/60 text-[10px] md:text-xs">
                          Verify your identity
                        </p>
                      </div>
                    </div>

                    <div className="mt-4">
                      <p className="text-base-content/60 text-[10px] md:text-xs">
                        Choose one method:
                      </p>

                      <div className="mt-3 space-y-3">
                        <div className="bg-base-200 rounded-lg p-3">
                          <h5 className="text-base-content text-xs font-semibold md:text-sm">
                            Phone verification
                          </h5>
                          <ul className="text-base-content/70 mt-2 ml-5 list-disc space-y-1 text-[10px] md:text-xs">
                            <li>Add a phone number in your profile</li>
                            <li>You&apos;ll be asked to sign in again</li>
                          </ul>
                          <div className="mt-3">
                            <Link
                              href={`/user/profile?returnUrl=${encodeURIComponent(
                                getSafeUrl(router.asPath, "/yoid"),
                              )}`}
                              className="btn btn-xs gap-2 border-green-300 bg-green-50 text-green-700 hover:bg-green-100"
                            >
                              <IoArrowForward className="h-4 w-4" />
                              Go to Profile
                            </Link>
                          </div>
                        </div>

                        <div className="bg-base-200 rounded-lg p-3">
                          <h5 className="text-base-content text-xs font-semibold md:text-sm">
                            Social sign-in
                          </h5>
                          <ul className="text-base-content/70 mt-2 ml-5 list-disc space-y-1 text-[10px] md:text-xs">
                            <li>Sign in with Google or Facebook</li>
                            <li>Use the same email to keep your progress</li>
                          </ul>
                          <div className="mt-3">
                            <button
                              type="button"
                              onClick={() =>
                                handleUserSignOut(
                                  true,
                                  false,
                                  getSafeUrl(router.asPath, "/yoid"),
                                )
                              }
                              className="btn btn-xs min-w-0 gap-2 border-green-300 bg-green-50 text-green-700 hover:bg-green-100"
                            >
                              <IoArrowForward className="h-4 w-4 flex-shrink-0" />
                              <span className="truncate">
                                Continue with Social
                              </span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* OR Divider */}
                {showPOPAction && nextAction && (
                  <div className="my-4 flex items-center gap-3">
                    <div className="bg-base-300 h-px flex-1" />
                    <span className="text-base-content/50 text-[10px] font-semibold md:text-xs">
                      OR
                    </span>
                    <div className="bg-base-300 h-px flex-1" />
                  </div>
                )}

                {/* Pathway Next Action */}
                {nextAction && (
                  <div id="next-action" className={panelClassName}>
                    <div className="flex items-center gap-3 md:gap-4">
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md bg-green-50 md:h-12 md:w-12">
                        <IoArrowForward className="h-5 w-5 text-green-600 md:h-6 md:w-6" />
                      </div>

                      <div className="min-w-0">
                        <h2 className="font-family-nunito text-base-content text-xs font-semibold md:text-sm">
                          Next step: {nextAction.step.name}
                        </h2>

                        <TaskInstructionHeader
                          tasksLength={nextAction.tasks.length}
                          rule={nextAction.step.rule}
                          orderMode={nextAction.step.orderMode}
                          isCompleted={false}
                          color="blue"
                          variant="compact"
                          hideIcon
                        />
                      </div>
                    </div>

                    <div className="mt-4 space-y-3">
                      <div className="bg-base-100 rounded-lg border border-green-200 p-3">
                        <PathwayTasksList
                          tasks={nextAction.tasks.map((task, index) => ({
                            id: task.id,
                            entityType: "Opportunity" as PathwayTaskEntityType,
                            completed: task.completed,
                            isCompletable: task.isCompletable,
                            opportunity: task.opportunityId
                              ? {
                                  id: task.opportunityId,
                                  title: task.opportunityTitle,
                                  description: null,
                                  type: null,
                                  organizationId: null,
                                  organizationName: null,
                                  organizationLogoURL: null,
                                  summary: null,
                                  dateStart: null,
                                  dateEnd: null,
                                  url: null,
                                  zltoReward: null,
                                  yomaReward: null,
                                }
                              : null,
                            order: index,
                            orderDisplay: index + 1,
                            dateCompleted: null,
                            nonCompletableReason: null,
                          }))}
                          rule={nextAction.step.rule}
                          orderMode={nextAction.step.orderMode}
                          showActionButtons={false}
                          showBullets={false}
                          showBadges={false}
                          showTaskConnectors={false}
                          color="white"
                          opportunityVariant="compact"
                        />
                      </div>

                      <div className="text-base-content/60 flex items-center gap-2 text-[10px] md:text-xs">
                        <span className="bg-base-100 mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full border border-blue-200 text-[10px] font-bold text-blue-700">
                          !
                        </span>
                        <span className="min-w-0">
                          Click a task above → Go to Opportunity → complete it.
                          Then upload proof via “Upload your completion files”.
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </>
            );
          })()}

        {/* NEXT ACTION (COMPLETED) */}
        {usage.status === "Completed" && (
          <div id="next-action" className={panelClassName}>
            <div className="flex items-start gap-3 md:gap-4">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md bg-green-50 md:h-12 md:w-12">
                <IoGift className="h-5 w-5 text-green-700 md:h-6 md:w-6" />
              </div>

              <div className="min-w-0">
                <h2 className="font-family-nunito text-base-content text-xs font-semibold md:text-sm">
                  What&apos;s next
                </h2>
                <p className="text-base-content/60 text-[10px] md:text-xs">
                  You completed the program — but don&apos;t stop here!
                </p>
              </div>
            </div>

            <div className="divide-base-200 mt-4 divide-y">
              <div className="flex flex-col gap-3 py-3 md:flex-row md:items-center md:justify-between">
                <div className="flex min-w-0 items-start gap-2">
                  <IoTrophy className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-700 opacity-80" />
                  <div className="min-w-0">
                    <div className="text-base-content text-xs font-semibold md:text-sm">
                      View your wallet
                    </div>
                    <div className="text-base-content/60 text-[10px] md:text-xs">
                      See your achievements and credentials.
                    </div>
                  </div>
                </div>

                <Link
                  href="/yoid/wallet"
                  className="btn btn-sm gap-2 border-green-300 bg-green-50 text-green-700 hover:bg-green-100"
                >
                  <IoTrophy className="h-4 w-4" />
                  View Wallet
                </Link>
              </div>

              {program.zltoRewardReferee && (
                <div className="flex flex-col gap-3 py-3 md:flex-row md:items-center md:justify-between">
                  <div className="flex min-w-0 items-start gap-2">
                    <IoCart className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-700 opacity-80" />
                    <div className="min-w-0">
                      <div className="text-base-content text-xs font-semibold md:text-sm">
                        Spend your ZLTO
                      </div>
                      <div className="text-base-content/60 text-[10px] md:text-xs">
                        Explore the marketplace.
                      </div>
                    </div>
                  </div>

                  <Link
                    href="/marketplace"
                    className="btn btn-sm gap-2 border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100"
                  >
                    <IoStorefront className="h-4 w-4" />
                    Marketplace
                  </Link>
                </div>
              )}

              <div className="flex flex-col gap-3 py-3 md:flex-row md:items-center md:justify-between">
                <div className="flex min-w-0 items-start gap-2">
                  <IoRocket className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-700 opacity-80" />
                  <div className="min-w-0">
                    <div className="text-base-content text-xs font-semibold md:text-sm">
                      Find opportunities
                    </div>
                    <div className="text-base-content/60 text-[10px] md:text-xs">
                      Keep building skills and earning ZLTO.
                    </div>
                  </div>
                </div>

                <Link
                  href="/opportunities"
                  className="btn btn-sm gap-2 border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100"
                >
                  <IoRocket className="h-4 w-4" />
                  Explore
                </Link>
              </div>

              <div className="flex flex-col gap-3 py-3 md:flex-row md:items-center md:justify-between">
                <div className="flex min-w-0 items-start gap-2">
                  <IoHeart className="mt-0.5 h-4 w-4 flex-shrink-0 text-pink-700 opacity-80" />
                  <div className="min-w-0">
                    <div className="text-base-content text-xs font-semibold md:text-sm">
                      Become a referrer
                    </div>
                    <div className="text-base-content/60 text-[10px] md:text-xs">
                      Share opportunities and earn rewards.
                    </div>
                  </div>
                </div>

                <Link
                  href="/yoid/referrals"
                  className="btn btn-sm gap-2 border-pink-300 bg-pink-50 text-pink-700 hover:bg-pink-100"
                >
                  <IoShareSocial className="h-4 w-4" />
                  Start Referring
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* NEXT ACTION (EXPIRED) */}
        {usage.status === "Expired" && (
          <div id="next-action" className={panelClassName}>
            <div className="flex items-start gap-3 md:gap-4">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md bg-orange-50 md:h-12 md:w-12">
                <IoWarning className="h-5 w-5 text-orange-700 md:h-6 md:w-6" />
              </div>

              <div className="min-w-0">
                <h2 className="font-family-nunito text-base-content text-xs font-semibold md:text-sm">
                  Program expired
                </h2>
                <p className="text-base-content/60 text-[10px] md:text-xs">
                  You can still earn ZLTO and build skills.
                </p>
              </div>
            </div>

            <div className="divide-base-200 mt-4 divide-y">
              <div className="flex flex-col gap-3 py-3 md:flex-row md:items-center md:justify-between">
                <div className="flex min-w-0 items-start gap-2">
                  <IoRocket className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-700 opacity-80" />
                  <div className="min-w-0">
                    <div className="text-base-content text-xs font-semibold md:text-sm">
                      Explore opportunities
                    </div>
                    <div className="text-base-content/60 text-[10px] md:text-xs">
                      Find active programs to join.
                    </div>
                  </div>
                </div>

                <Link
                  href="/opportunities"
                  className="btn btn-sm gap-2 border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100"
                >
                  <IoRocket className="h-4 w-4" />
                  Explore
                </Link>
              </div>

              <div className="flex flex-col gap-3 py-3 md:flex-row md:items-center md:justify-between">
                <div className="flex min-w-0 items-start gap-2">
                  <IoHeart className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-700 opacity-80" />
                  <div className="min-w-0">
                    <div className="text-base-content text-xs font-semibold md:text-sm">
                      Become a referrer
                    </div>
                    <div className="text-base-content/60 text-[10px] md:text-xs">
                      Share opportunities and earn rewards.
                    </div>
                  </div>
                </div>

                <Link
                  href="/yoid/referrals"
                  className="btn btn-sm gap-2 border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100"
                >
                  <IoShareSocial className="h-4 w-4" />
                  Start Referring
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

RefereeDashboard.getLayout = function getLayout(page: ReactElement) {
  if ((page.props as any).error === 401) {
    return <MainLayout>{page}</MainLayout>;
  }
  return <YoIDLayout>{page}</YoIDLayout>;
};

export default RefereeDashboard;
