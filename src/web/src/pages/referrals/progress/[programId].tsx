import { QueryClient, dehydrate, useQuery } from "@tanstack/react-query";
import { type GetServerSidePropsContext } from "next";
import { getServerSession } from "next-auth";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, type ReactElement } from "react";
import { IoArrowForward, IoWarningOutline } from "react-icons/io5";
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
import Suspense from "~/components/Common/Suspense";
import MainLayout from "~/components/Layout/Main";
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
import FormMessage, { FormMessageType } from "~/components/Common/FormMessage";

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
      router.replace(`/referrals/progress/${programId}`, undefined, {
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

  return (
    <>
      <Head>
        <title>
          Yoma | 🎯 Referral Progress | {program?.name || "Loading..."}
        </title>
      </Head>

      <div className="mx-auto mt-18 mb-10 w-full px-4 lg:max-w-4xl">
        <Suspense
          isLoading={usageLoading || programLoading}
          loader={
            <LoadingInline
              classNameSpinner="md:h-32 md:w-32 h-16 w-16 border-orange"
              className="h-52 flex-col"
            />
          }
        >
          {serverError || usageError || programError || !usage || !program ? (
            <div className="flex flex-col gap-8">
              <div className="flex items-center justify-center">
                <NoRowsMessage
                  title="Referral Not Found"
                  subTitle="You don't have an active referral for this program."
                  description={`
                  <div class="text-center mt-10">
                    <h3 class="text-xs md:text-sm font-bold text-gray-900 mb-2">What might have happened?</h3>
                    <ul class="text-left text-xs md:text-sm ml-6 list-disc space-y-2 text-gray-700">
                      <li>You may not have claimed a referral link for this program yet</li>
                      <li>Your referral may have expired or been completed</li>
                      <li>The program may no longer be active</li>
                      <li>The program ID in the URL might be incorrect</li>
                    </ul>
                  </div>
                `}
                  icon={<IoWarningOutline className="h-6 w-6 text-red-500" />}
                  className="max-w-3xl !bg-transparent"
                />
              </div>

              <BecomeReferrerCTA />

              <AlternativeActions />
            </div>
          ) : (
            <>
              {/* BREADCRUMB */}
              <Breadcrumb
                className="text-base-content/70 mb-4 text-[10px] font-semibold tracking-wide md:text-xs"
                items={[
                  { title: "❤️ Referrals", url: "/referrals" },
                  {
                    title: program.name,
                    selected: true,
                  },
                ]}
              />

              {/* STATUS BANNER */}
              <RefereeStatusBanner usage={usage} program={program} />

              {/* TODO: components */}

              {/* NEXT ACTION (PENDING) */}
              {usage.status === "Pending" &&
                (() => {
                  const nextAction = getNextAction(usage, program);
                  const popRequired = program.proofOfPersonhoodRequired;
                  const popCompleted =
                    usage.proofOfPersonhoodCompleted ?? false;

                  // Show POP verification next action if required and not completed
                  const showPOPAction = popRequired && !popCompleted;

                  // If pathway required, show next action
                  return (
                    <div className="flex flex-col gap-4">
                      {/* Proof of Personhood Verification */}
                      {showPOPAction && (
                        <div
                          id="next-action-pop"
                          className="border-base-300 bg-base-100 rounded-xl border p-4 shadow-sm md:p-5"
                        >
                          <div className="flex items-start gap-3 md:gap-4">
                            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md bg-gray-50 text-lg md:h-12 md:w-12">
                              🔐
                            </div>

                            <div className="min-w-0 flex-1">
                              <h2 className="font-family-nunito text-base-content text-xs font-semibold md:text-sm">
                                Verify your identity
                              </h2>
                              <p className="text-base-content/60 mt-1 line-clamp-2 text-[10px] leading-snug md:text-xs">
                                Choose one verification method to continue:
                              </p>
                            </div>
                          </div>

                          <div className="mt-3 flex flex-col space-y-3 md:flex-row md:items-stretch md:gap-4 md:space-y-0">
                            <div className="bg-base-200 flex flex-1 flex-col rounded-lg p-3">
                              <h5 className="text-base-content text-xs font-semibold md:text-sm">
                                Phone verification
                              </h5>
                              <ul className="text-base-content/70 mt-2 ml-5 list-disc space-y-1 text-[10px] md:text-xs">
                                <li>Add a phone number in your profile</li>
                                <li>You&apos;ll be asked to sign in again</li>
                              </ul>
                              <div className="mt-auto pt-3">
                                <Link
                                  href={`/user/profile?returnUrl=${encodeURIComponent(
                                    getSafeUrl(router.asPath, "/yoid"),
                                  )}`}
                                  className="btn btn-sm bg-orange w-full gap-2 text-white hover:brightness-110 md:w-auto md:min-w-[180px]"
                                >
                                  <IoArrowForward className="h-4 w-4" />
                                  Go to Profile
                                </Link>
                              </div>
                            </div>

                            <div className="bg-base-200 flex flex-1 flex-col rounded-lg p-3">
                              <h5 className="text-base-content text-xs font-semibold md:text-sm">
                                Social sign-in
                              </h5>
                              <ul className="text-base-content/70 mt-2 ml-5 list-disc space-y-1 text-[10px] md:text-xs">
                                <li>Sign in with Google or Facebook</li>
                                <li>
                                  Use the same email to keep your progress
                                </li>
                              </ul>
                              <div className="mt-auto pt-3">
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleUserSignOut(
                                      true,
                                      false,
                                      getSafeUrl(router.asPath, "/yoid"),
                                    )
                                  }
                                  className="btn btn-sm bg-orange w-full gap-2 text-white hover:brightness-110 md:w-auto md:min-w-[180px]"
                                >
                                  <IoArrowForward className="h-4 w-4" />
                                  Continue with Social
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Pathway Next Action */}
                      {nextAction && (
                        <div
                          id="next-action"
                          className="border-base-300 bg-base-100 rounded-xl border p-4 shadow-sm md:p-5"
                        >
                          <div className="flex items-start gap-3 md:gap-4">
                            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md bg-gray-50 text-lg md:h-12 md:w-12">
                              🚀
                            </div>

                            <div className="min-w-0 flex-1">
                              <h2 className="font-family-nunito text-base-content text-xs font-semibold md:text-sm">
                                {nextAction.step.name}
                              </h2>

                              <TaskInstructionHeader
                                tasksLength={nextAction.tasks.length}
                                rule={nextAction.step.rule}
                                orderMode={nextAction.step.orderMode}
                                isCompleted={false}
                                color="orange"
                                variant="compact"
                                hideIcon
                              />
                            </div>
                          </div>

                          <div className="mt-3 space-y-3">
                            <div className="border-base-300 bg-base-100 overflow-visible rounded-lg border px-4">
                              <PathwayTasksList
                                tasks={nextAction.tasks.map((task, index) => ({
                                  id: task.id,
                                  entityType:
                                    "Opportunity" as PathwayTaskEntityType,
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
                                color="orange"
                                opportunityVariant="compact"
                              />
                            </div>

                            <FormMessage messageType={FormMessageType.Info}>
                              Click a task above →{" "}
                              <strong>Go to Opportunity</strong> → complete it.
                              Then upload proof via{" "}
                              <strong>Upload your completion files</strong>.
                            </FormMessage>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}

              {/* NEXT ACTION (COMPLETED/EXPIRED) */}
              {usage.status !== "Pending" && (
                <div id="next-action" className="flex flex-col gap-4">
                  <BecomeReferrerCTA />

                  <AlternativeActions />
                </div>
              )}
            </>
          )}
        </Suspense>
      </div>
    </>
  );
};

RefereeDashboard.getLayout = function getLayout(page: ReactElement) {
  return <MainLayout>{page}</MainLayout>;
};

export default RefereeDashboard;
