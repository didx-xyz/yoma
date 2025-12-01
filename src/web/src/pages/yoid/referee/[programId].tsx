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
import { AlternativeActions } from "~/components/Referrals/AlternativeActions";
import { BecomeReferrerCTA } from "~/components/Referrals/BecomeReferrerCTA";
import {
  PathwayTasksList,
  TaskInstructionHeader,
} from "~/components/Referrals/InstructionHeaders";
import { getNextAction } from "~/components/Referrals/RefereeProgressTracker";
import { RefereeStatusBanner } from "~/components/Referrals/RefereeStatusBanner";
import NoRowsMessage from "~/components/NoRowsMessage";
import { LoadingInline } from "~/components/Status/LoadingInline";
import { Unauthenticated } from "~/components/Status/Unauthenticated";
import { config } from "~/lib/react-query-config";
import { authOptions } from "~/server/auth";
import { handleUserSignOut } from "~/lib/authUtils";
import { type NextPageWithLayout } from "../../_app";
import { getSafeUrl } from "~/lib/utils";

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

  if (serverError === 401) return <Unauthenticated />;

  if (usageLoading || programLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingInline
          classNameSpinner="h-8 w-8 border-t-2 border-b-2 border-orange md:h-16 md:w-16 md:border-t-4 md:border-b-4"
          classNameLabel={"text-sm font-semibold md:text-lg"}
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
      <div className="container mx-auto mt-20 flex max-w-5xl flex-col gap-8 px-4 py-8">
        <div className="flex items-center justify-center">
          <NoRowsMessage
            title="Referral Not Found"
            subTitle="You don't have an active referral for this program."
            description={refereeErrorDescription}
            icon={<IoWarningOutline className="h-6 w-6 text-red-500" />}
            className="max-w-3xl !bg-transparent"
          />
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
                title: "My Referral",
                selected: true,
              },
            ]}
          />
        </div>

        {/* STATUS BANNER */}
        <RefereeStatusBanner usage={usage} program={program} />

        {/* <div className="mt-4 w-full break-all"> {JSON.stringify(usage)}</div> */}
        {/* PROGRESS TRACKER */}
        {/* <RefereeProgressTracker usage={usage} program={program} /> */}

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
                  <div
                    id="next-action-pop"
                    className="shadow-custom mb-6 rounded-lg border-2 border-orange-300 bg-gradient-to-br from-orange-50 to-white p-6"
                  >
                    <div className="mb-6 flex items-start gap-4 md:gap-6">
                      {/* Icon */}
                      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-white shadow-lg ring-4 ring-white/50 md:h-16 md:w-16">
                        <IoArrowForward className="h-6 w-6 text-orange-500 md:h-8 md:w-8" />
                      </div>

                      {/* Text */}
                      <div className="flex flex-col justify-center pt-1">
                        <h2 className="text-sm font-semibold text-orange-900 md:text-lg">
                          Your Next Step
                        </h2>
                        <p className="text-gray-dark text-xs md:text-sm">
                          Verify Your Identity
                        </p>
                      </div>
                    </div>
                    <div>
                      {/* Verification Instructions */}
                      <div className="space-y-4">
                        <div>
                          <p className="text-gray-dark mb-3 text-xs md:text-sm">
                            Choose one of the following methods:
                          </p>
                          <div className="space-y-3">
                            <div className="rounded-md border border-blue-300 bg-white p-3">
                              <h5 className="mb-2 text-sm font-semibold text-blue-900 md:text-base">
                                Option 1: Phone Number Verification
                              </h5>
                              <ul className="text-gray-dark ml-5 list-disc space-y-1 text-xs md:text-sm">
                                <li>
                                  Add a phone number to your account on the
                                  profile page
                                </li>
                                <li>
                                  <strong>Note:</strong> This will require you
                                  to sign in again
                                </li>
                              </ul>
                              <div className="mt-3">
                                <Link
                                  href={`/user/profile?returnUrl=${encodeURIComponent(
                                    getSafeUrl(router.asPath, "/yoid"),
                                  )}`}
                                  className="btn btn-secondary btn-sm gap-2"
                                >
                                  <IoArrowForward className="h-4 w-4" />
                                  Go to Profile
                                </Link>
                              </div>
                            </div>
                            <div className="rounded-md border border-blue-300 bg-white p-3">
                              <h5 className="mb-2 text-sm font-semibold text-blue-900 md:text-base">
                                Option 2: Social Media Account
                              </h5>
                              <ul className="text-gray-dark ml-5 list-disc space-y-1 text-xs md:text-sm">
                                <li>
                                  Link your social media account
                                  (Google/Facebook)
                                </li>

                                <li>
                                  <strong>Note:</strong> If you use a different
                                  email, you will be recognized as a new user
                                  and will lose any progress made so far
                                </li>
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
                                  className="btn btn-secondary btn-sm min-w-0 gap-2"
                                >
                                  <IoArrowForward className="h-4 w-4 flex-shrink-0" />
                                  <span className="truncate">
                                    Sign in with Social Media
                                  </span>
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* OR Divider */}
                {showPOPAction && nextAction && (
                  <div className="mb-6 flex items-center gap-4">
                    <div className="h-px flex-1 bg-gray-300" />
                    <span className="text-sm font-bold text-gray-500">OR</span>
                    <div className="h-px flex-1 bg-gray-300" />
                  </div>
                )}

                {/* Pathway Next Action */}
                {nextAction && (
                  <div
                    id="next-action"
                    className="shadow-custom mb-6 rounded-lg border-2 border-orange-300 bg-gradient-to-br from-orange-50 to-white p-6"
                  >
                    <div className="mb-6 flex items-start gap-4 md:gap-6">
                      {/* Icon */}
                      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-white shadow-lg ring-4 ring-white/50 md:h-16 md:w-16">
                        <IoArrowForward className="h-6 w-6 text-orange-500 md:h-8 md:w-8" />
                      </div>

                      {/* Text */}
                      <div className="flex min-w-0 flex-col justify-center pt-1">
                        <h2 className="text-sm font-semibold text-orange-900 md:text-lg">
                          Your Next Step
                        </h2>
                        <p className="text-gray-dark truncate text-xs md:text-sm">
                          {nextAction.step.name}
                        </p>
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
                        showActionButtons={false}
                        showBullets={false}
                        showBadges={false}
                        color="green"
                      />
                      {/* Helpful Tips */}
                      <div className="mt-2 rounded-lg border-2 border-green-200 bg-green-50 p-4">
                        <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-green-900 md:text-lg">
                          <IoInformationCircle className="h-6 w-6 text-green-500" />
                          How to Complete
                        </h4>
                        <ol className="ml-5 list-decimal space-y-1 text-xs text-green-900 md:text-sm">
                          <li>
                            <strong>Complete</strong> the above tasks
                          </li>
                          <li>
                            <strong>Upload proof of completion</strong> on the
                            opportunity page
                          </li>
                          <li>
                            <strong>Wait for verification</strong> - you&apos;ll
                            be notified when approved
                          </li>
                        </ol>
                      </div>
                    </div>
                  </div>
                )}
              </>
            );
          })()}

        {/* NEXT ACTION (COMPLETED) */}
        {usage.status === "Completed" && (
          <div
            id="next-action"
            className="shadow-custom mb-6 rounded-lg border-2 border-orange-300 bg-gradient-to-br from-orange-50 to-white p-6"
          >
            <div className="mb-6 flex items-start gap-4 md:gap-6">
              {/* Icon */}
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-white shadow-lg ring-4 ring-white/50 md:h-16 md:w-16">
                <IoGift className="h-6 w-6 text-orange-500 md:h-8 md:w-8" />
              </div>

              {/* Text */}
              <div className="flex flex-col justify-center pt-1">
                <h2 className="text-sm font-semibold text-orange-900 md:text-lg">
                  What&apos;s Next?
                </h2>
                <p className="text-gray-dark text-xs md:text-sm">
                  {program.zltoRewardReferee ? (
                    <>
                      Your <strong>{program.zltoRewardReferee} ZLTO</strong> has
                      been added to your wallet! Your journey doesn&apos;t have
                      to end here.
                    </>
                  ) : (
                    <>
                      You have gained valuable skills which are stored as
                      credentials in your wallet. Your journey doesn&apos;t have
                      to end here.
                    </>
                  )}
                </p>
              </div>
            </div>
            <div>
              <div className="space-y-4">
                {/* View Dashboard */}
                <div className="rounded-lg border-2 border-green-200 bg-green-50 p-4">
                  <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-green-900 md:text-lg">
                    <IoTrophy className="h-5 w-5 text-green-600" />
                    View Your Achievements
                  </h4>
                  <p className="text-gray-dark mb-3 text-xs md:text-sm">
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
                    <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-purple-900 md:text-lg">
                      <IoCart className="h-5 w-5 text-purple-600" />
                      Spend Your ZLTO
                    </h4>
                    <p className="text-gray-dark mb-3 text-xs md:text-sm">
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
                  <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-blue-900 md:text-lg">
                    <IoRocket className="h-5 w-5 text-blue-600" />
                    Explore Other Opportunities
                  </h4>
                  <p className="text-gray-dark mb-3 text-xs md:text-sm">
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
                  <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-yellow-900 md:text-lg">
                    <IoShareSocial className="h-5 w-5 text-yellow-600" />
                    Become a Referrer
                  </h4>
                  <p className="text-gray-dark mb-3 text-xs md:text-sm">
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
            <div className="mb-6 flex items-start gap-4 md:gap-6">
              {/* Icon */}
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-white shadow-lg ring-4 ring-white/50 md:h-16 md:w-16">
                <IoWarning className="h-6 w-6 text-orange-500 md:h-8 md:w-8" />
              </div>

              {/* Text */}
              <div className="flex flex-col justify-center pt-1">
                <h2 className="text-sm font-semibold text-orange-900 md:text-lg">
                  Don&apos;t Give Up!
                </h2>

                <p className="text-gray-dark text-xs md:text-sm">
                  This program may have expired, but your journey doesn&apos;t
                  have to end here. There are plenty of other ways to earn ZLTO
                  and grow!
                </p>
              </div>
            </div>
            <div>
              <div className="space-y-4">
                {/* Explore Opportunities */}
                <div className="rounded-lg border-2 border-blue-200 bg-blue-50 p-4">
                  <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-blue-900 md:text-lg">
                    <IoRocket className="h-5 w-5 text-blue-600" />
                    Explore Other Opportunities
                  </h4>
                  <p className="text-gray-dark mb-3 text-xs md:text-sm">
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
                  <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-yellow-900 md:text-lg">
                    <IoShareSocial className="h-5 w-5 text-yellow-600" />
                    Become a Referrer
                  </h4>
                  <p className="text-gray-dark mb-3 text-xs md:text-sm">
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
  if ((page.props as any).error === 401) {
    return <MainLayout>{page}</MainLayout>;
  }
  return <YoIDLayout>{page}</YoIDLayout>;
};

export default RefereeDashboard;
