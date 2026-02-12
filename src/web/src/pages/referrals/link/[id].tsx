import { QueryClient, dehydrate, useQuery } from "@tanstack/react-query";
import { useAtomValue } from "jotai";
import { type GetServerSidePropsContext } from "next";
import { getServerSession } from "next-auth";
import Head from "next/head";
import { type ReactElement, useState } from "react";
import { FaShareAlt } from "react-icons/fa";
import type { ProgramInfo, ReferralLink } from "~/api/models/referrals";
import type { UserProfile } from "~/api/models/user";
import {
  getReferralLinkById,
  getReferralProgramInfoByLinkId,
} from "~/api/services/referrals";
import { getUserProfile } from "~/api/services/user";
import Breadcrumb from "~/components/Breadcrumb";
import Suspense from "~/components/Common/Suspense";
import MainLayout from "~/components/Layout/Main";
import NoRowsMessage from "~/components/NoRowsMessage";
import { ReferralBlockedView } from "~/components/Referrals/ReferralBlockedView";
import { ReferralShareModal } from "~/components/Referrals/ReferralShareModal";
import { ReferralStatsSmallLink } from "~/components/Referrals/ReferralStatsSmallLink";
import { ReferrerReferralsList } from "~/components/Referrals/ReferrerReferralsList";
import { LoadingInline } from "~/components/Status/LoadingInline";
import { handleUserSignIn } from "~/lib/authUtils";
import { config } from "~/lib/react-query-config";
import { currentLanguageAtom, userProfileAtom } from "~/lib/store";
import { authOptions } from "~/server/auth";
import { type NextPageWithLayout } from "../../_app";

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

  let userProfileServer: UserProfile | null = null;
  try {
    userProfileServer = await getUserProfile(context);
  } catch (e) {
    console.error("Failed to fetch user profile", e);
  }

  const queryClient = new QueryClient(config);

  await queryClient.prefetchQuery({
    queryKey: ["ReferralLink", linkId],
    queryFn: () => getReferralLinkById(linkId, false, context),
  });

  await queryClient.prefetchQuery({
    queryKey: ["ReferralProgramInfoByLink", linkId],
    queryFn: () => getReferralProgramInfoByLinkId(linkId, context),
  });

  return {
    props: {
      dehydratedState: dehydrate(queryClient),
      user: session?.user ?? null,
      linkId,
      userProfileServer,
    },
  };
}

const ReferralLinkPage: NextPageWithLayout<{
  linkId: string;
  error?: number;
  userProfileServer?: UserProfile | null;
}> = ({ linkId, error, userProfileServer }) => {
  const currentLanguage = useAtomValue(currentLanguageAtom);
  const userProfileClient = useAtomValue(userProfileAtom);
  const userProfile = userProfileServer ?? userProfileClient;
  const isBlocked = userProfile?.referral?.blocked ?? false;

  const { data: link, isLoading: linkLoading } = useQuery<ReferralLink>({
    queryKey: ["ReferralLink", linkId],
    queryFn: () => getReferralLinkById(linkId, false),
    enabled: !!linkId && !error,
  });

  const { data: program, isLoading: programLoading } = useQuery<ProgramInfo>({
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

  return (
    <>
      <Head>
        <title>Yoma | 🔗 Referral Link</title>
      </Head>

      <div className="mx-auto mt-18 mb-4 w-full px-4 lg:max-w-4xl">
        <Suspense
          isLoading={linkLoading || programLoading}
          loader={
            <LoadingInline
              classNameSpinner="md:h-32 md:w-32 h-16 w-16 border-orange"
              className="h-52 flex-col"
            />
          }
        >
          {/* BREADCRUMB */}
          <Breadcrumb
            className="text-base-content/70 mb-4 text-[10px] font-semibold tracking-wide md:text-xs"
            items={[
              { title: "❤️ Referrals", url: "/referrals" },
              {
                title: link?.name ?? "",
                selected: true,
              },
            ]}
          />

          {isBlocked ? (
            <ReferralBlockedView userProfile={userProfile} />
          ) : (
            <div className="flex flex-col gap-6">
              {/* Welcome: Refer a friend */}
              <div className="flex flex-col items-center justify-center">
                <NoRowsMessage
                  title="Link details"
                  subTitle="Good things are better when shared. Invite your friends to Yoma and help them start their journey."
                  description={`When your friend signs up and completes the onboarding requirements, you both win rewards!${program?.completionWindowInDays && program.completionWindowInDays > 0 ? ` Just remember: your friend has ${program.completionWindowInDays} days to use your link before it expires.` : ""}`}
                  icon={"🔗"}
                  className="max-w-3xl !bg-transparent"
                />

                {/* BUTTON */}
                {link?.status === "Active" && (
                  <button
                    type="button"
                    className="btn btn-sm bg-orange gap-2 text-white hover:brightness-110 disabled:opacity-50"
                    onClick={() => setIsShareModalOpen(true)}
                  >
                    <FaShareAlt className="h-4 w-4" />
                    Share your link
                  </button>
                )}
              </div>

              {link && <ReferralStatsSmallLink link={link} />}

              <ReferralShareModal
                isOpen={isShareModalOpen}
                onClose={() => setIsShareModalOpen(false)}
                link={link || null}
                rewardAmount={program?.zltoRewardReferee}
              />

              <div className="flex flex-col gap-2">
                <div className="font-family-nunito font-semibold text-black">
                  Referral list
                </div>

                <ReferrerReferralsList linkId={linkId} />
              </div>
            </div>
          )}
        </Suspense>
      </div>
    </>
  );
};

ReferralLinkPage.getLayout = function getLayout(page: ReactElement) {
  return <MainLayout>{page}</MainLayout>;
};

export default ReferralLinkPage;
