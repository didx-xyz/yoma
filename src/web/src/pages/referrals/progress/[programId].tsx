import { QueryClient, dehydrate, useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useAtom } from "jotai";
import { type GetServerSidePropsContext } from "next";
import { useSession } from "next-auth/react";
import { getServerSession } from "next-auth";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useMemo, type ReactElement } from "react";
import { IoOpenOutline, IoWarningOutline } from "react-icons/io5";
import { toast } from "react-toastify";
import {
  ProgramStatus,
  type ProgramInfo,
  type ReferralLinkUsageInfo,
} from "~/api/models/referrals";
import {
  getReferralLinkUsageByProgramIdAsReferee,
  getReferralProgramInfoById,
} from "~/api/services/referrals";
import MainLayout from "~/components/Layout/Main";
import NoRowsMessage from "~/components/NoRowsMessage";
import { ReferralShell } from "~/components/Referrals/new/ReferralShell";
import { ReferralProgramPagePreview } from "~/components/Referrals/new/ReferralProgramPagePreview";
import { AlternativeActions } from "~/components/Referrals/AlternativeActions";
import { BecomeReferrerCTA } from "~/components/Referrals/BecomeReferrerCTA";
import { RefereeWelcomeModal } from "~/components/Referrals/RefereeWelcomeModal";
import { LoadingInline } from "~/components/Status/LoadingInline";
import { Unauthenticated } from "~/components/Status/Unauthenticated";
import { config } from "~/lib/react-query-config";
import { THEME_WHITE } from "~/lib/constants";
import { handleUserSignOut } from "~/lib/authUtils";
import { hasDismissedRefereeWelcomeModalAtom } from "~/lib/store";
import { getSafeUrl } from "~/lib/utils";
import { authOptions } from "~/server/auth";
import { type NextPageWithLayout } from "../../_app";

interface RefereeProofOfPersonhoodActionProps {
  usage: ReferralLinkUsageInfo;
  program: ProgramInfo;
}

const RefereeProofOfPersonhoodAction: React.FC<
  RefereeProofOfPersonhoodActionProps
> = ({ usage, program }) => {
  const router = useRouter();
  const popRequired = program.proofOfPersonhoodRequired;
  const popCompleted = usage.proofOfPersonhoodCompleted ?? false;

  //TODO: commented out for testing
  //   if (!(popRequired && !popCompleted)) {
  //     return null;
  //   }

  return (
    <div
      id="next-action-pop"
      className="space-y-3 rounded-lg border border-gray-200 bg-white px-4 py-3"
    >
      <div>
        <p className="text-lg font-semibold text-black">
          Verify your personhood
        </p>
        <p className="text-gray-dark mt-1 text-sm">
          Choose one option to verify your identity and continue with the
          programme.
        </p>
      </div>

      <div className="flex flex-col items-center gap-3 rounded-lg border border-gray-200 bg-white px-3 py-3 md:flex-row">
        <div className="w-full min-w-0 pr-3">
          <p className="truncate text-base font-semibold text-black">
            Phone verification
          </p>
          <p className="text-gray-dark text-sm">
            Add a phone number in your profile. You&apos;ll be asked to sign in
            again.
          </p>
        </div>

        <Link
          href={`/user/profile?returnUrl=${encodeURIComponent(getSafeUrl(router.asPath, "/yoid"))}`}
          className="btn btn-sm bg-green hover:bg-green-dark h-9 w-[160px] rounded-full border-0 px-5 text-white normal-case"
        >
          <IoOpenOutline className="h-4 w-4" />
          Go to Profile
        </Link>
      </div>
      <div className="flex flex-col items-center gap-3 rounded-lg border border-gray-200 bg-white px-3 py-3 md:flex-row">
        <div className="w-full min-w-0 pr-3">
          <p className="truncate text-base font-semibold text-black">
            Social sign-in
          </p>
          <p className="text-gray-dark text-sm">
            Sign in with Google or Facebook. Use the same email to keep your
            progress.
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            handleUserSignOut(true, false, getSafeUrl(router.asPath, "/yoid"))
          }
          className="btn btn-sm bg-green hover:bg-green-dark h-9 w-[160px] rounded-full border-0 px-5 text-white normal-case"
        >
          <IoOpenOutline className="h-4 w-4" />
          Continue
        </button>
      </div>
    </div>
  );
};

//TODO: remove
const parseMockProgramStatus = (
  value: string | string[] | undefined,
): ProgramStatus | null => {
  if (!value) return null;

  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw) return null;

  const numeric = Number(raw);
  if (!Number.isNaN(numeric) && ProgramStatus[numeric] !== undefined) {
    return numeric as ProgramStatus;
  }

  const matchedKey = Object.keys(ProgramStatus).find(
    (key) =>
      Number.isNaN(Number(key)) && key.toLowerCase() === raw.toLowerCase(),
  );

  if (!matchedKey) return null;
  return ProgramStatus[
    matchedKey as keyof typeof ProgramStatus
  ] as ProgramStatus;
};

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const session = await getServerSession(context.req, context.res, authOptions);

  if (!session) {
    return {
      props: {
        error: 401,
      },
    };
  }

  const { programId } = context.params!;
  const mockStatus = parseMockProgramStatus(context.query.mockStatus);

  if (!programId || typeof programId !== "string") {
    return {
      notFound: true,
    };
  }

  const queryClient = new QueryClient(config);
  let errorCode: number | null = null;

  try {
    await queryClient.fetchQuery({
      queryKey: ["RefereeUsage", programId],
      queryFn: () =>
        getReferralLinkUsageByProgramIdAsReferee(programId, context),
    });

    const program = await queryClient.fetchQuery({
      queryKey: ["ReferralProgram", programId],
      queryFn: () => getReferralProgramInfoById(programId, context),
    });

    if (program && mockStatus !== null) {
      program.status = mockStatus;
      queryClient.setQueryData(["ReferralProgram", programId], program);
    }

    return {
      props: {
        dehydratedState: dehydrate(queryClient),
        programId,
        user: session?.user ?? null,
      },
    };
  } catch (error) {
    console.error("Error fetching referee data:", error);
    if (axios.isAxiosError(error) && error.response?.status) {
      errorCode = error.response.status;
    } else {
      errorCode = 500;
    }
    return {
      props: {
        error: errorCode,
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
  const { status: sessionStatus } = useSession();
  const [hasDismissedWelcomeModal, setHasDismissedWelcomeModal] = useAtom(
    hasDismissedRefereeWelcomeModalAtom,
  );

  useEffect(() => {
    if (router.query.claimed === "true") {
      toast.success("Successfully claimed! Welcome to the program. 🎉");
      router.replace(`/referrals/progress/${programId}`, undefined, {
        shallow: true,
      });
    }
  }, [router, programId]);

  const {
    data: usage,
    error: usageError,
    isLoading: usageLoading,
  } = useQuery<ReferralLinkUsageInfo>({
    queryKey: ["RefereeUsage", programId],
    queryFn: () => getReferralLinkUsageByProgramIdAsReferee(programId),
    enabled: !serverError,
    refetchInterval: 30000,
  });

  const {
    data: program,
    error: programError,
    isLoading: programLoading,
  } = useQuery<ProgramInfo>({
    queryKey: ["ReferralProgram", programId],
    queryFn: () => getReferralProgramInfoById(programId),
    enabled: !serverError,
  });

  //TODO: remove
  const mockedPathwayProgress = useMemo(() => {
    if (!usage?.pathway) return null;

    return {
      ...usage.pathway,
      completed: false,
      stepsCompleted: 1,
      percentComplete: 50,
      steps: usage.pathway.steps.map((step, stepIndex) => ({
        ...step,
        completed: stepIndex === 0,
        dateCompleted: stepIndex === 0 ? new Date().toISOString() : null,
        tasksCompleted: stepIndex === 0 ? step.tasksTotal : 0,
        percentComplete: stepIndex === 0 ? 100 : 0,
        tasks: step.tasks.map((task) => ({
          ...task,
          completed: stepIndex === 0,
          dateCompleted: stepIndex === 0 ? new Date().toISOString() : null,
        })),
      })),
    };
  }, [usage?.pathway]);

  const isRedirectingToKeycloak = router.query.signInAgain === "true";

  const timeInfo = useMemo(() => {
    if (!usage?.dateClaimed || !program?.completionWindowInDays) return null;

    const claimedDate = new Date(usage.dateClaimed);
    const expiryDate = new Date(claimedDate);
    expiryDate.setDate(expiryDate.getDate() + program.completionWindowInDays);

    const now = new Date();
    const remainingMs = expiryDate.getTime() - now.getTime();
    const remainingDays = Math.ceil(remainingMs / (1000 * 60 * 60 * 24));

    return {
      days: remainingDays,
      expiryDate,
    };
  }, [usage?.dateClaimed, program?.completionWindowInDays]);

  if (serverError === 401) {
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

  const hasPageError =
    Boolean(serverError) || Boolean(usageError) || Boolean(programError);

  const welcomeUserName = usage?.userDisplayName?.trim() || "there";

  return (
    <>
      <Head>
        <title>{`Yoma | Refer a friend ❤️ | ${program?.name ?? "Progress"}`}</title>
      </Head>

      <ReferralShell
        title={program?.name || "Referral programme"}
        breadcrumbLabel="Referrals"
        //programImageUrl={program?.imageURL || undefined}
        headerBackgroundMode="color"
        headerBackgroundColorClassName="bg-orange"
        onBack={() => router.push("/referrals")}
        isLoading={!hasPageError && (usageLoading || programLoading)}
      >
        {hasPageError ? (
          <div className="flex min-h-[50vh] items-center justify-center px-2 pb-8">
            <div className="flex w-full max-w-2xl flex-col items-center gap-4 rounded-xl bg-white p-6 text-center shadow md:p-10">
              <h2 className="text-2xl font-bold text-black">Oops!</h2>
              <p className="text-gray-dark">
                We&apos;re experiencing some technical difficulties at the
                moment. Our team has been notified and is working on it.
              </p>
              <p className="text-gray-dark">
                Please check back in a few moments.
              </p>
              <button
                type="button"
                className="btn btn-success mt-2 rounded-3xl px-8 text-white"
                onClick={() => router.back()}
              >
                Take me back
              </button>
            </div>
          </div>
        ) : !usage || !program ? (
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
          <ReferralProgramPagePreview
            program={program}
            referrerDisplayName={usage.userDisplayNameReferrer}
            showProofOfPersonhoodAction={usage.status === "Pending"}
            proofOfPersonhoodAction={
              <RefereeProofOfPersonhoodAction usage={usage} program={program} />
            }
            progressModel={
              // TODO: hardcode mocked data here
              mockedPathwayProgress
            }
            percentComplete={usage.percentComplete ?? 0}
            timeRemainingDescription={
              timeInfo
                ? `${timeInfo.days} day${timeInfo.days === 1 ? "" : "s"} · Complete by ${timeInfo.expiryDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
                : "No time limit"
            }
          />
        )}
      </ReferralShell>

      <RefereeWelcomeModal
        isOpen={Boolean(
          sessionStatus === "authenticated" &&
            !hasDismissedWelcomeModal &&
            usage &&
            program &&
            !hasPageError,
        )}
        onClose={() => {
          setHasDismissedWelcomeModal(true);
        }}
        userName={welcomeUserName}
        programName={program?.name ?? "this programme"}
      />
    </>
  );
};

RefereeDashboard.getLayout = function getLayout(page: ReactElement) {
  return <MainLayout>{page}</MainLayout>;
};

RefereeDashboard.theme = function getTheme() {
  return THEME_WHITE;
};

export default RefereeDashboard;
