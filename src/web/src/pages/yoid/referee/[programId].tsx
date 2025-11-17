import { QueryClient, dehydrate, useQuery } from "@tanstack/react-query";
import { type GetServerSidePropsContext } from "next";
import { getServerSession } from "next-auth";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, type ReactElement } from "react";
import {
  IoArrowForward,
  IoGift,
  IoWarning,
  IoInformationCircle,
  IoRocket,
  IoCart,
  IoTrophy,
  IoShareSocial,
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
import YoIDLayout from "~/components/Layout/YoID";
import { AlternativeActions } from "~/components/Referrals/AlternativeActions";
import { BecomeReferrerCTA } from "~/components/Referrals/BecomeReferrerCTA";
import {
  PathwayTasksList,
  TaskInstructionHeader,
} from "~/components/Referrals/InstructionHeaders";
import {
  RefereeProgressTracker,
  getNextAction,
} from "~/components/Referrals/RefereeProgressTracker";
import { RefereeStatusBanner } from "~/components/Referrals/RefereeStatusBanner";
import { Unauthorized } from "~/components/Status/Unauthorized";
import { config } from "~/lib/react-query-config";
import { authOptions } from "~/server/auth";
import { type NextPageWithLayout } from "../../_app";

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const session = await getServerSession(context.req, context.res, authOptions);

  // 👇 ensure authenticated
  if (!session) {
    return {
      props: {
        error: "Unauthorized",
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
  error?: string;
}> = ({ programId, error: serverError }) => {
  const router = useRouter();

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

  if (serverError === "Unauthorized") return <Unauthorized />;

  if (usageLoading || programLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="loading loading-spinner loading-lg"></div>
      </div>
    );
  }

  if (serverError || usageError || programError || !usage || !program) {
    return (
      <div className="container mx-auto max-w-5xl px-4 py-12">
        {/* Error Message */}
        <div className="mb-8 rounded-xl border-4 border-orange-300 bg-gradient-to-br from-orange-50 via-yellow-50 to-white p-8 shadow-xl">
          <div className="mb-6 flex flex-col items-center gap-4 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-red-400 shadow-lg">
              <IoWarning className="h-12 w-12 text-white" />
            </div>
            <div>
              <h1 className="mb-2 text-2xl font-bold text-orange-900 md:text-4xl">
                Referral Not Found
              </h1>
              <p className="text-gray-700">
                You don&apos;t have an active referral for this program.
              </p>
            </div>
          </div>

          <div className="rounded-lg border-2 border-orange-200 bg-white p-6">
            <h3 className="mb-3 text-lg font-bold text-gray-900">
              What might have happened?
            </h3>
            <ul className="ml-6 list-disc space-y-2 text-sm text-gray-700">
              <li>
                You may not have claimed a referral link for this program yet
              </li>
              <li>Your referral may have expired or been completed</li>
              <li>The program may no longer be active</li>
              <li>The program ID in the URL might be incorrect</li>
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

  return (
    <>
      <Head>
        <title>My Referral Progress | {program.name}</title>
      </Head>

      <div className="w-full lg:max-w-7xl">
        {/* BREADCRUMB */}
        <div className="mb-4 text-xs font-bold tracking-wider text-black md:text-base">
          <Breadcrumb
            items={[
              { title: "💳 Yo-ID", url: "/yoid" },
              {
                title: "🎁 My Referral",
                selected: true,
              },
            ]}
          />
        </div>

        {/* STATUS BANNER */}
        <RefereeStatusBanner usage={usage} program={program} />

        {/* PROGRESS TRACKER */}
        <RefereeProgressTracker usage={usage} program={program} />

        {/* NEXT ACTION (PENDING) */}
        {usage.status === "Pending" &&
          (() => {
            const nextAction = getNextAction(usage, program);

            // If no pathway required and profile complete, show congratulations
            if (
              !program.pathwayRequired &&
              (usage.proofOfPersonhoodCompleted ?? false)
            ) {
              return (
                <div className="shadow-custom mb-6 rounded-lg border-2 border-green-300 bg-gradient-to-br from-green-50 to-white p-6">
                  <div className="mb-4 flex items-start gap-6">
                    <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl bg-white shadow-lg ring-4 ring-white/50">
                      <IoGift className="h-10 w-10 text-green-500" />
                    </div>
                    <div className="flex-1">
                      <div className="mb-2 flex items-center gap-3">
                        <h3 className="text-xl font-bold text-green-900">
                          Congratulations!
                        </h3>
                        <span className="text-xl">🎉</span>
                      </div>
                      <p className="mb-2 text-xs font-semibold tracking-wider text-gray-600 uppercase">
                        All Requirements Complete
                      </p>
                      <p className="text-sm leading-relaxed text-gray-800">
                        You&apos;ve completed all requirements for this referral
                        program!
                        {program.zltoRewardReferee && (
                          <>
                            {" "}
                            You&apos;ll receive {program.zltoRewardReferee} ZLTO
                            once the program is finalized.
                          </>
                        )}
                      </p>
                      {program.zltoRewardReferee && (
                        <div className="mt-4 rounded-lg border-2 border-blue-200 bg-blue-50 p-4">
                          <h4 className="mb-2 flex items-center gap-2 font-bold text-blue-900">
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-amber-600">
                              <IoGift className="h-3 w-3 text-white" />
                            </span>
                            What&apos;s Next?
                          </h4>
                          <p className="text-sm text-gray-700">
                            Once you receive your ZLTO rewards, visit the
                            marketplace to spend them on amazing opportunities
                            and experiences!
                          </p>
                          <Link
                            href="/marketplace"
                            className="btn btn-primary btn-sm mt-3"
                          >
                            Explore Marketplace
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            }

            // If pathway required, show next action
            return nextAction ? (
              <div
                id="next-action"
                className="shadow-custom mb-6 rounded-lg border-2 border-orange-300 bg-gradient-to-br from-orange-50 to-white p-6"
              >
                <div className="mb-4 flex items-start gap-6">
                  <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl bg-white shadow-lg ring-4 ring-white/50">
                    <IoArrowForward className="h-10 w-10 text-orange-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="min-w-0 flex-1">
                      <h2 className="text-xl font-bold text-orange-900">
                        Your Next Step
                      </h2>
                      <p className="mb-2 min-w-0 truncate text-xs font-semibold tracking-wider text-gray-600 uppercase">
                        {nextAction.step.name}
                      </p>
                      {nextAction.step.description && (
                        <p className="min-w-0 truncate text-sm leading-relaxed text-gray-800">
                          {nextAction.step.description}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                <div>
                  {/* Task Instructions */}
                  <TaskInstructionHeader
                    tasksLength={nextAction.tasks.length}
                    rule={nextAction.step.rule}
                    orderMode={nextAction.step.orderMode}
                    isCompleted={false}
                    color="green"
                  />
                  {/* Tasks List */}
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
                    showActionButtons={true}
                    color="green"
                  />
                  {/* Helpful Tips */}
                  <div className="mt-6 rounded-lg border-2 border-green-200 bg-green-50 p-4">
                    <h4 className="mb-3 flex items-center gap-2 font-bold text-green-900">
                      <IoInformationCircle className="h-8 w-8 text-green-500" />
                      How to Complete Your Tasks
                    </h4>
                    <ol className="ml-5 list-decimal space-y-2 text-sm text-green-900">
                      <li>
                        <strong>Click &quot;View Opportunity&quot;</strong>{" "}
                        above to see the full details
                      </li>
                      <li>
                        Read the requirements carefully and complete the
                        activities
                      </li>
                      <li>
                        <strong>Upload proof of completion</strong> (photos,
                        documents, etc.) on the opportunity page
                      </li>
                      <li>
                        Wait for verification - You&apos;ll be notified when
                        someone has reviewed your submission.
                      </li>
                      <li>
                        Check back here to track your progress - the checkmark
                        will appear when verified!{" "}
                        <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-green-500 text-[10px] font-bold text-white">
                          ✓
                        </span>
                      </li>
                    </ol>
                  </div>
                </div>
              </div>
            ) : null;
          })()}

        {/* NEXT ACTION (COMPLETED) */}
        {usage.status === "Completed" && (
          <div
            id="next-action"
            className="shadow-custom mb-6 rounded-lg border-2 border-orange-300 bg-gradient-to-br from-orange-50 to-white p-6"
          >
            <div className="mb-4 flex items-start gap-6">
              <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl bg-white shadow-lg ring-4 ring-white/50">
                <IoGift className="h-10 w-10 text-orange-500" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="min-w-0 flex-1">
                  <h2 className="text-xl font-bold text-orange-900">
                    What&apos;s Next?
                  </h2>
                  <p className="min-w-0 text-sm leading-relaxed text-gray-800">
                    {program.zltoRewardReferee ? (
                      <>
                        Your <strong>{program.zltoRewardReferee} ZLTO</strong>{" "}
                        has been added to your wallet! Your journey doesn&apos;t
                        have to end here.
                      </>
                    ) : (
                      <>
                        You have gained valuable skills which are stored as
                        credentials in your wallet. Your journey doesn&apos;t
                        have to end here.
                      </>
                    )}
                  </p>
                </div>
              </div>
            </div>
            <div>
              <div className="space-y-4">
                {/* View Dashboard */}
                <div className="rounded-lg border-2 border-green-200 bg-green-50 p-4">
                  <h4 className="mb-2 flex items-center gap-2 font-bold text-green-900">
                    <IoTrophy className="h-5 w-5 text-green-600" />
                    View Your Achievements
                  </h4>
                  <p className="mb-3 text-sm text-gray-700">
                    Your achievements, skills and credentials are safely stored
                    in your wallet. View them now!
                  </p>
                  <Link
                    href="/yoid/wallet"
                    className="btn btn-success btn-sm gap-2"
                  >
                    <IoTrophy className="h-4 w-4" />
                    View Dashboard
                  </Link>
                </div>

                {/* Spend ZLTO on Marketplace */}
                {program.zltoRewardReferee && (
                  <div className="rounded-lg border-2 border-purple-200 bg-purple-50 p-4">
                    <h4 className="mb-2 flex items-center gap-2 font-bold text-purple-900">
                      <IoCart className="h-5 w-5 text-purple-600" />
                      Spend Your ZLTO
                    </h4>
                    <p className="mb-3 text-sm text-gray-700">
                      Visit the marketplace to discover amazing opportunities
                      and experiences you can unlock with your ZLTO!
                    </p>
                    <Link
                      href="/marketplace"
                      className="btn btn-primary btn-sm gap-2"
                    >
                      <IoCart className="h-4 w-4" />
                      Explore Marketplace
                    </Link>
                  </div>
                )}

                {/* Explore Opportunities */}
                <div className="rounded-lg border-2 border-blue-200 bg-blue-50 p-4">
                  <h4 className="mb-2 flex items-center gap-2 font-bold text-blue-900">
                    <IoRocket className="h-5 w-5 text-blue-600" />
                    Explore Other Opportunities
                  </h4>
                  <p className="mb-3 text-sm text-gray-700">
                    {program.zltoRewardReferee ? (
                      <>
                        Continue earning more ZLTO and developing new skills
                        through various opportunities.
                      </>
                    ) : (
                      <>
                        Discover opportunities to earn ZLTO and develop valuable
                        skills.
                      </>
                    )}
                  </p>
                  <Link
                    href="/opportunities"
                    className="btn btn-primary btn-sm gap-2"
                  >
                    <IoRocket className="h-4 w-4" />
                    Find Opportunities
                  </Link>
                </div>

                {/* Become a Referrer */}
                <div className="rounded-lg border-2 border-yellow-200 bg-yellow-50 p-4">
                  <h4 className="mb-2 flex items-center gap-2 font-bold text-yellow-900">
                    <IoShareSocial className="h-5 w-5 text-yellow-600" />
                    Become a Referrer
                  </h4>
                  <p className="mb-3 text-sm text-gray-700">
                    {program.zltoRewardReferee ? (
                      <>
                        Love this program? Share the opportunity with others and
                        earn even more ZLTO for every successful referral!
                      </>
                    ) : (
                      <>
                        Share opportunities with others and earn ZLTO for every
                        successful referral!
                      </>
                    )}
                  </p>
                  <Link
                    href="/yoid/referrer"
                    className="btn btn-warning btn-sm gap-2"
                  >
                    <IoShareSocial className="h-4 w-4" />
                    Start Referring & Earn
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* NEXT ACTION (EXPIRED) */}
        {usage.status === "Expired" && (
          <div
            id="next-action"
            className="shadow-custom mb-6 rounded-lg border-2 border-orange-300 bg-gradient-to-br from-orange-50 to-white p-6"
          >
            <div className="mb-4 flex items-start gap-6">
              <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl bg-white shadow-lg ring-4 ring-white/50">
                <IoWarning className="h-10 w-10 text-orange-500" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="mb-4 min-w-0 flex-1">
                  <div className="mb-2">
                    <h2 className="text-xl font-bold text-orange-900">
                      Don&apos;t Give Up! 💪
                    </h2>
                  </div>
                  <p className="mb-2 min-w-0 truncate text-xs font-semibold tracking-wider text-gray-600 uppercase">
                    What&apos;s Next?
                  </p>
                  <p className="min-w-0 text-sm leading-relaxed text-gray-800">
                    This program may have expired, but your journey doesn&apos;t
                    have to end here. There are plenty of other ways to earn
                    ZLTO and grow!
                  </p>
                </div>
              </div>
            </div>
            <div>
              <div className="space-y-4">
                {/* Explore Opportunities */}
                <div className="rounded-lg border-2 border-blue-200 bg-blue-50 p-4">
                  <h4 className="mb-2 flex items-center gap-2 font-bold text-blue-900">
                    <IoRocket className="h-5 w-5 text-blue-600" />
                    Explore Other Opportunities
                  </h4>
                  <p className="mb-3 text-sm text-gray-700">
                    Discover new active opportunities to earn ZLTO and develop
                    valuable skills.
                  </p>
                  <Link
                    href="/opportunities"
                    className="btn btn-primary btn-sm gap-2"
                  >
                    <IoRocket className="h-4 w-4" />
                    Find Opportunities
                  </Link>
                </div>

                {/* Become a Referrer */}
                <div className="rounded-lg border-2 border-yellow-200 bg-yellow-50 p-4">
                  <h4 className="mb-2 flex items-center gap-2 font-bold text-yellow-900">
                    <IoShareSocial className="h-5 w-5 text-yellow-600" />
                    Become a Referrer
                  </h4>
                  <p className="mb-3 text-sm text-gray-700">
                    Turn your experience into earnings! Refer others to active
                    programs and earn ZLTO for every successful referral.
                  </p>
                  <Link
                    href="/yoid/referrer"
                    className="btn btn-warning btn-sm gap-2"
                  >
                    <IoShareSocial className="h-4 w-4" />
                    Start Referring & Earn
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

RefereeDashboard.getLayout = function getLayout(page: ReactElement) {
  return <YoIDLayout>{page}</YoIDLayout>;
};

export default RefereeDashboard;
