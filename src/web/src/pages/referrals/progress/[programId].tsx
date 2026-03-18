import { useAtom } from "jotai";
import { useSession } from "next-auth/react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useMemo, type ReactElement } from "react";
import { IoOpenOutline } from "react-icons/io5";
import { toast } from "react-toastify";
import { type ProgramInfo, type ReferralLinkUsageInfo } from "~/api/models/referrals";
import MainLayout from "~/components/Layout/Main";
import NoRowsMessage from "~/components/NoRowsMessage";
import { ReferralShell } from "~/components/Referrals/ReferralShell";
import { ReferralProgramPagePreview } from "~/components/Referrals/ReferralProgramPagePreview";
import { RefereeWelcomeModal } from "~/components/Referrals/RefereeWelcomeModal";
import { LoadingInline } from "~/components/Status/LoadingInline";
import { Unauthenticated } from "~/components/Status/Unauthenticated";
import {
  useReferralLinkUsageByProgramIdQuery,
  useReferralProgramInfoQuery,
} from "~/hooks/useReferralProgramMutations";
import { parseApiError } from "~/lib/apiErrorUtils";
import { THEME_WHITE } from "~/lib/constants";
import { handleUserSignOut } from "~/lib/authUtils";
import { hasDismissedRefereeWelcomeModalAtom } from "~/lib/store";
import { getSafeUrl } from "~/lib/utils";
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

  if (!(popRequired && !popCompleted)) {
    return null;
  }

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

const RefereeDashboard: NextPageWithLayout = () => {
  const router = useRouter();
  const { status: sessionStatus } = useSession();
  const [hasDismissedWelcomeModal, setHasDismissedWelcomeModal] = useAtom(
    hasDismissedRefereeWelcomeModalAtom,
  );
  const programId =
    typeof router.query.programId === "string" ? router.query.programId : "";

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
  } = useReferralLinkUsageByProgramIdQuery(programId, {
    enabled: sessionStatus === "authenticated" && router.isReady && !!programId,
    refetchInterval: 30000,
  });

  const {
    data: program,
    error: programError,
    isLoading: programLoading,
  } = useReferralProgramInfoQuery(programId, {
    enabled: sessionStatus === "authenticated" && router.isReady && !!programId,
  });

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

  if (sessionStatus === "loading") {
    return (
      <ReferralShell
        title="Referral programme"
        breadcrumbLabel="Referrals"
        headerBackgroundMode="color"
        headerBackgroundColorClassName="bg-orange"
        onBack={() => router.push("/referrals")}
        isLoading={true}
      >
        <></>
      </ReferralShell>
    );
  }

  if (sessionStatus === "unauthenticated") {
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
    (router.isReady && !programId) || Boolean(usageError) || Boolean(programError);

  const pageErrorMessage = (() => {
    if (router.isReady && !programId) {
      return "Referral programme not found.";
    }

    if (usageError) {
      const { errors, message } = parseApiError(usageError);
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
        isLoading={
          !hasPageError && (!router.isReady || usageLoading || programLoading)
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
        ) : !usage || !program ? (
          <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-4 rounded-xl bg-white p-6 text-center shadow">
            <NoRowsMessage
              icon={"⚠️"}
              title="Referral Not Found"
              description="You don't have an active referral for this program."
              className="w-full !bg-transparent"
            />
          </div>
        ) : (
          <ReferralProgramPagePreview
            program={program}
            referrerDisplayName={usage.userDisplayNameReferrer}
            showProofOfPersonhoodAction={usage.status === "Pending"}
            proofOfPersonhoodAction={
              <RefereeProofOfPersonhoodAction usage={usage} program={program} />
            }
            progressModel={usage.pathway}
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
