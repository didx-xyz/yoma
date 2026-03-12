import { QueryClient, dehydrate, useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useAtomValue } from "jotai";
import { type GetServerSidePropsContext } from "next";
import { getServerSession } from "next-auth";
import Head from "next/head";
import { useRouter } from "next/router";
import { type ReactElement, useState } from "react";
import { FaShareAlt } from "react-icons/fa";
import { IoTimeOutline, IoTrophyOutline } from "react-icons/io5";
import {
  ProgramStatus,
  type ProgramInfo,
  type ReferralLink,
} from "~/api/models/referrals";
import type { UserProfile } from "~/api/models/user";
import {
  getReferralLinkById,
  getReferralProgramInfoByLinkId,
} from "~/api/services/referrals";
import { getUserProfile } from "~/api/services/user";
import MainLayout from "~/components/Layout/Main";
import { ReferralMainColumns } from "~/components/Referrals/new/ReferralMainColumns";
import { ReferralShell } from "~/components/Referrals/new/ReferralShell";
import { ReferralStatCard } from "~/components/Referrals/new/ReferralStatCard";
import { ReferralTopCard } from "~/components/Referrals/new/ReferralTopCard";
import { ReferralBlockedView } from "~/components/Referrals/ReferralBlockedView";
import { ReferralShareModal } from "~/components/Referrals/ReferralShareModal";
import { ReferralStatsSmallLink } from "~/components/Referrals/ReferralStatsSmallLink";
import { ReferrerReferralsList } from "~/components/Referrals/ReferrerReferralsList";
import { LoadingInline } from "~/components/Status/LoadingInline";
import { handleUserSignIn } from "~/lib/authUtils";
import { THEME_WHITE } from "~/lib/constants";
import { config } from "~/lib/react-query-config";
import { currentLanguageAtom, userProfileAtom } from "~/lib/store";
import { authOptions } from "~/server/auth";
import { type NextPageWithLayout } from "../../_app";

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

  const { id } = context.query;
  const linkId = id as string;
  const mockStatus = parseMockProgramStatus(context.query.mockStatus);

  let userProfileServer: UserProfile | null = null;
  try {
    userProfileServer = await getUserProfile(context);
  } catch (e) {
    console.error("Failed to fetch user profile", e);
  }

  const queryClient = new QueryClient(config);
  let errorCode: number | null = null;

  try {
    await queryClient.fetchQuery({
      queryKey: ["ReferralLink", linkId],
      queryFn: () => getReferralLinkById(linkId, false, context),
    });

    const program = await queryClient.fetchQuery({
      queryKey: ["ReferralProgramInfoByLink", linkId],
      queryFn: () => getReferralProgramInfoByLinkId(linkId, context),
    });

    if (program && mockStatus !== null) {
      program.status = mockStatus;
      queryClient.setQueryData(["ReferralProgramInfoByLink", linkId], program);
    }
  } catch (error) {
    console.error("Failed to fetch referral link page data", error);
    if (axios.isAxiosError(error) && error.response?.status) {
      errorCode = error.response.status;
    } else {
      errorCode = 500;
    }
  }

  return {
    props: {
      dehydratedState: dehydrate(queryClient),
      user: session?.user ?? null,
      linkId,
      userProfileServer,
      error: errorCode,
    },
  };
}

const ReferralLinkPage: NextPageWithLayout<{
  linkId: string;
  error?: number;
  userProfileServer?: UserProfile | null;
}> = ({ linkId, error, userProfileServer }) => {
  const router = useRouter();
  const currentLanguage = useAtomValue(currentLanguageAtom);
  const userProfileClient = useAtomValue(userProfileAtom);
  const userProfile = userProfileServer ?? userProfileClient;
  const isBlocked = userProfile?.referral?.blocked ?? false;

  const {
    data: link,
    isLoading: linkLoading,
    error: linkError,
  } = useQuery<ReferralLink>({
    queryKey: ["ReferralLink", linkId],
    queryFn: () => getReferralLinkById(linkId, false),
    enabled: !!linkId && !error,
  });

  const {
    data: program,
    isLoading: programLoading,
    error: programError,
  } = useQuery<ProgramInfo>({
    queryKey: ["ReferralProgramInfoByLink", linkId],
    queryFn: () => getReferralProgramInfoByLinkId(linkId),
    enabled: !!linkId && !error,
  });

  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  if (error === 401) {
    void handleUserSignIn(currentLanguage);
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingInline
          classNameSpinner="h-8 w-8 border-t-2 border-b-2 border-orange md:h-16 md:w-16 md:border-t-4 md:border-b-4"
          classNameLabel={"text-sm font-semibold md:text-lg"}
          label="Redirecting to login..."
        />
      </div>
    );
  }

  const hasPageError =
    Boolean(error) || Boolean(linkError) || Boolean(programError);

  const programStatusName =
    typeof program?.status === "number"
      ? ProgramStatus[program.status]
      : `${program?.status ?? ""}`;

  const isShareDisabledByStatus = [
    "inactive",
    "expired",
    "limitreached",
    "deleted",
  ].includes(programStatusName.toLowerCase());

  return (
    <>
      <Head>
        <title>{`Yoma | Refer a friend ❤️ | ${program?.name ?? "Link Details"}`}</title>
      </Head>

      <ReferralShell
        title={program?.name ?? link?.programName ?? "Link details"}
        breadcrumbLabel="Referrals"
        //programImageUrl={program?.imageURL || undefined}
        headerBackgroundMode="color"
        headerBackgroundColorClassName="bg-orange"
        onBack={() => router.push("/referrals")}
        isLoading={!hasPageError && (linkLoading || programLoading)}
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
        ) : isBlocked ? (
          <ReferralBlockedView userProfile={userProfile} />
        ) : (
          <>
            {program ? (
              <ReferralTopCard
                program={program}
                rewardsReferrer={true}
                rewardsReferee={false}
                cta={
                  <button
                    type="button"
                    className="btn btn-sm bg-green hover:bg-green-dark disabled:!bg-green h-10 rounded-full border-0 px-5 text-white normal-case disabled:!pointer-events-auto disabled:!cursor-not-allowed disabled:!text-white disabled:opacity-80"
                    onClick={() => setIsShareModalOpen(true)}
                    disabled={isShareDisabledByStatus}
                  >
                    <FaShareAlt className="h-4 w-4" />
                    Share your link
                  </button>
                }
              />
            ) : null}

            <ReferralMainColumns
              left={
                <>
                  <div className="rounded-xl bg-white p-4 shadow md:p-5">
                    {link ? (
                      <div>
                        <ReferralStatsSmallLink link={link} />
                      </div>
                    ) : null}
                  </div>

                  <div className="rounded-xl bg-white p-4 shadow md:p-5">
                    <div className="text-lg font-semibold text-black">
                      My referred friends
                    </div>
                    <div className="mt-3">
                      <ReferrerReferralsList linkId={linkId} />
                    </div>
                  </div>
                </>
              }
              right={
                <div className="flex flex-col gap-2 rounded-xl bg-white p-4 shadow">
                  <ReferralStatCard
                    icon={<IoTrophyOutline className="h-5 w-5" />}
                    header="Reward"
                    description={
                      (program?.zltoRewardReferrer || 0) > 0
                        ? `${program?.zltoRewardReferrer} Zlto`
                        : "No reward"
                    }
                    className="bg-purple-dark [&_.referral-stat-card-description]:text-white [&_.referral-stat-card-header]:text-white [&_.referral-stat-card-icon-wrap]:bg-white/20 [&_.referral-stat-card-icon-wrap]:text-white"
                  />
                  <ReferralStatCard
                    icon={<IoTimeOutline className="h-5 w-5" />}
                    header="Time remaining"
                    description={
                      program?.completionWindowInDays
                        ? `${program.completionWindowInDays} day${program.completionWindowInDays === 1 ? "" : "s"}`
                        : "No time limit"
                    }
                  />
                </div>
              }
            />
          </>
        )}

        <ReferralShareModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          link={link || null}
          rewardAmount={program?.zltoRewardReferee}
        />
      </ReferralShell>
    </>
  );
};

ReferralLinkPage.getLayout = function getLayout(page: ReactElement) {
  return <MainLayout>{page}</MainLayout>;
};

ReferralLinkPage.theme = function getTheme() {
  return THEME_WHITE;
};

export default ReferralLinkPage;
