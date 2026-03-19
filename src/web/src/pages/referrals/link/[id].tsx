import { useAtomValue } from "jotai";
import { useSession } from "next-auth/react";
import Head from "next/head";
import { useRouter } from "next/router";
import { type ReactElement, useEffect, useState } from "react";
import { FaShareAlt } from "react-icons/fa";
import { IoTimeOutline, IoTrophyOutline } from "react-icons/io5";
import { ProgramStatus, ReferralLinkStatus } from "~/api/models/referrals";
import MainLayout from "~/components/Layout/Main";
import NoRowsMessage from "~/components/NoRowsMessage";
import { ReferralBlockedView } from "~/components/Referrals/ReferralBlockedView";
import { ReferralMainColumns } from "~/components/Referrals/ReferralMainColumns";
import { ReferralShareModal } from "~/components/Referrals/ReferralShareModal";
import { ReferralShell } from "~/components/Referrals/ReferralShell";
import { ReferralStatCard } from "~/components/Referrals/ReferralStatCard";
import { ReferralStatsSmallLink } from "~/components/Referrals/ReferralStatsSmallLink";
import { ReferralTopCard } from "~/components/Referrals/ReferralTopCard";
import { ReferrerReferralsList } from "~/components/Referrals/ReferrerReferralsList";
import { LoadingInline } from "~/components/Status/LoadingInline";
import {
  useReferralLinkByIdQuery,
  useReferralProgramInfoByLinkQuery,
} from "~/hooks/useReferralProgramMutations";
import { parseApiError } from "~/lib/apiErrorUtils";
import { handleUserSignIn } from "~/lib/authUtils";
import { THEME_WHITE } from "~/lib/constants";
import { currentLanguageAtom, userProfileAtom } from "~/lib/store";
import { type NextPageWithLayout } from "../../_app";
const ReferralLinkPage: NextPageWithLayout = () => {
  const router = useRouter();
  const { status: sessionStatus } = useSession();
  const currentLanguage = useAtomValue(currentLanguageAtom);
  const userProfile = useAtomValue(userProfileAtom);
  const isBlocked = userProfile?.referral?.blocked ?? false;
  const linkId = typeof router.query.id === "string" ? router.query.id : "";
  const hasLinkId = router.isReady && linkId.length > 0;

  useEffect(() => {
    if (router.isReady && sessionStatus === "unauthenticated") {
      void handleUserSignIn(currentLanguage);
    }
  }, [currentLanguage, router.isReady, sessionStatus]);

  const {
    data: link,
    isLoading: linkLoading,
    error: linkError,
  } = useReferralLinkByIdQuery(linkId, {
    enabled: sessionStatus === "authenticated" && hasLinkId,
  });

  const {
    data: program,
    isLoading: programLoading,
    error: programError,
  } = useReferralProgramInfoByLinkQuery(linkId, {
    enabled: sessionStatus === "authenticated" && hasLinkId,
  });

  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  if (sessionStatus === "unauthenticated") {
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
    (router.isReady && !linkId) || Boolean(linkError) || Boolean(programError);

  const isProgramActive =
    typeof program?.status === "number"
      ? program.status === ProgramStatus.Active
      : `${program?.status ?? ""}`.toLowerCase() === "active";

  const isShareEnabled =
    isProgramActive && link?.status === ReferralLinkStatus.Active;

  const pageErrorMessage = (() => {
    if (router.isReady && !linkId) {
      return "Referral link not found.";
    }

    if (linkError) {
      const { errors, message } = parseApiError(linkError);
      return (
        errors
          .map((e) => e.message)
          .filter(Boolean)
          .join(" · ") ||
        message ||
        null
      );
    }
    if (programError) {
      const { errors, message } = parseApiError(programError);
      return (
        errors
          .map((e) => e.message)
          .filter(Boolean)
          .join(" · ") ||
        message ||
        null
      );
    }
    return null;
  })();

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
        isLoading={
          !hasPageError &&
          (sessionStatus === "loading" ||
            !router.isReady ||
            linkLoading ||
            programLoading)
        }
      >
        {hasPageError ? (
          <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-4 rounded-xl bg-white p-6 text-center shadow">
            <NoRowsMessage
              icon={"⚠️"}
              title="Something went wrong"
              description={
                pageErrorMessage ??
                "We're experiencing some technical difficulties. Please try again later."
              }
              className="w-full !bg-transparent"
            />
          </div>
        ) : isBlocked ? (
          <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-4 rounded-xl bg-white p-6 text-center shadow">
            <ReferralBlockedView userProfile={userProfile} />
          </div>
        ) : (
          <>
            {program ? (
              <ReferralTopCard
                program={program}
                title={program.name}
                subTitle={program.summary ?? program.description}
                rewardsReferrer={true}
                rewardsReferee={false}
                cta={
                  <button
                    type="button"
                    className="btn btn-sm bg-green hover:bg-green-dark disabled:!bg-green h-10 rounded-full border-0 px-5 text-white normal-case disabled:!pointer-events-auto disabled:!cursor-not-allowed disabled:!text-white disabled:opacity-80"
                    onClick={() => setIsShareModalOpen(true)}
                    disabled={!isShareEnabled}
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
