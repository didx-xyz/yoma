import { useQueryClient } from "@tanstack/react-query";
import { type AxiosError } from "axios";
import { useAtomValue } from "jotai";
import { useSession } from "next-auth/react";
import Head from "next/head";
import { useRouter } from "next/router";
import { type ReactElement, useCallback, useState } from "react";
import { IoLinkOutline } from "react-icons/io5";
import { toast } from "react-toastify";
import { ProgramStatus } from "~/api/models/referrals";
import { createReferralLink } from "~/api/services/referrals";
import MainLayout from "~/components/Layout/Main";
import NoRowsMessage from "~/components/NoRowsMessage";
import { ReferralProgramDetailsContent } from "~/components/Referrals/ReferralProgramDetailsContent";
import { ReferralShell } from "~/components/Referrals/ReferralShell";
// import { ReferrerCreateLinkModal } from "~/components/Referrals/ReferrerCreateLinkModal";
import { ApiErrors } from "~/components/Status/ApiErrors";
import { LoadingInline } from "~/components/Status/LoadingInline";
import { parseApiError } from "~/lib/apiErrorUtils";
import analytics from "~/lib/analytics";
import { handleUserSignIn } from "~/lib/authUtils";
import {
  REFERRAL_PROGRAM_QUERY_KEYS,
  useReferralProgramInfoQuery,
} from "~/hooks/useReferralProgramMutations";
import { THEME_WHITE } from "~/lib/constants";
import { currentLanguageAtom } from "~/lib/store";
import type { NextPageWithLayout } from "~/pages/_app";

const generateReferralLinkName = (programName: string) => {
  const now = new Date();
  const stamp = now
    .toISOString()
    .replace(/[-:.TZ]/g, "")
    .slice(0, 14);
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  const suffix = `${stamp}-${rand}`;

  const base = (programName || "Program").trim();
  const maxBaseLength = 150 - (suffix.length + 1);
  const safeBase = base.slice(0, Math.max(10, maxBaseLength)).trim();

  return `${safeBase} ${suffix}`;
};

const ReferralProgramDetails: NextPageWithLayout = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { status: sessionStatus } = useSession();
  const [isButtonLoading, setIsButtonLoading] = useState(false);
  const currentLanguage = useAtomValue(currentLanguageAtom);
  const programId =
    typeof router.query.programId === "string" ? router.query.programId : "";
  const hasProgramId = router.isReady && programId.length > 0;

  const {
    data: program,
    isLoading,
    error: programError,
  } = useReferralProgramInfoQuery(programId, {
    enabled: hasProgramId,
  });
  const hasPageError =
    (router.isReady && !programId) || Boolean(programError) || false;

  const pageErrorMessage = (() => {
    if (router.isReady && !programId) {
      return "Referral programme not found.";
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

  const programStatusName =
    typeof program?.status === "number"
      ? ProgramStatus[program.status]
      : `${program?.status ?? ""}`;

  const isCreateLinkDisabledByStatus = [
    "inactive",
    "expired",
    "limitreached",
    "deleted",
  ].includes(programStatusName.toLowerCase());

  const handleCreateLink = useCallback(async () => {
    if (sessionStatus === "loading") {
      return;
    }

    if (sessionStatus !== "authenticated") {
      setIsButtonLoading(true);

      analytics.trackEvent("login_button_clicked", {
        language: currentLanguage,
        buttonLocation: "referral_program_details",
      });

      try {
        await handleUserSignIn(currentLanguage);
      } finally {
        setIsButtonLoading(false);
      }

      return;
    }

    if (!program) {
      return;
    }

    const currentProgram = program;

    setIsButtonLoading(true);

    try {
      const link = await createReferralLink({
        programId: currentProgram.id,
        name: generateReferralLinkName(currentProgram.name),
        description: null,
        includeQRCode: false,
      });

      await queryClient.invalidateQueries({
        queryKey: REFERRAL_PROGRAM_QUERY_KEYS.userLinksAll(),
      });

      if (link?.id) {
        await router.push(`/referrals/link/${link.id}?shareToast=1`);
        return;
      }

      await router.push(`/referrals`);
    } catch (error) {
      toast(<ApiErrors error={error as AxiosError} />, {
        type: "error",
        toastId: `link-submit-${currentProgram.id}`,
        autoClose: false,
        icon: false,
      });
    } finally {
      setIsButtonLoading(false);
    }
  }, [currentLanguage, program, queryClient, router, sessionStatus]);

  return (
    <>
      <Head>
        <title>{`Yoma | Refer a friend ❤️ | ${program?.name ?? "Programme Details"}`}</title>
        <meta
          name="description"
          content={program?.summary ?? "Referral programme details"}
        />
      </Head>

      <ReferralShell
        title={program?.name ?? "Referral programme"}
        breadcrumbLabel="Referral Programmes"
        //programImageUrl={program?.imageURL || undefined}
        headerBackgroundMode="color"
        headerBackgroundColorClassName="bg-orange"
        onBack={() => router.back()}
        isLoading={
          !hasPageError && (!router.isReady || isLoading || hasProgramId)
            ? !program
            : false
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
        ) : program ? (
          <ReferralProgramDetailsContent
            program={program}
            cta={
              <button
                type="button"
                className="btn btn-sm bg-green hover:bg-green-dark disabled:!bg-green h-10 rounded-full border-0 px-5 text-white normal-case disabled:!pointer-events-auto disabled:!cursor-not-allowed disabled:!text-white disabled:opacity-80"
                onClick={handleCreateLink}
                disabled={
                  isButtonLoading ||
                  sessionStatus === "loading" ||
                  isCreateLinkDisabledByStatus
                }
              >
                {isButtonLoading || sessionStatus === "loading" ? (
                  <LoadingInline
                    classNameSpinner="h-4 w-4"
                    classNameLabel="hidden"
                  />
                ) : (
                  <IoLinkOutline className="h-4 w-4" />
                )}
                Create link
              </button>
            }
          />
        ) : null}
      </ReferralShell>

      {/*
        Deprecated for the program-details create-link flow.
        Keep this modal wiring commented for potential reinstatement later.
      {program && (
        <ReferrerCreateLinkModal
          programs={[program]}
          selectedProgram={program}
          existingLinksCount={0}
          showProgramDetails={true}
          isOpen={createLinkModalVisible}
          onClose={() => {
            setCreateLinkModalVisible(false);
          }}
          onSuccess={async (link) => {
            await queryClient.invalidateQueries({
              queryKey: REFERRAL_PROGRAM_QUERY_KEYS.userLinksAll(),
            });

            if (link?.id) {
              await router.push(`/referrals/link/${link.id}`);
              return;
            }

            await router.push(`/referrals`);
          }}
        />
      )}
      */}
    </>
  );
};

ReferralProgramDetails.getLayout = function getLayout(page: ReactElement) {
  return <MainLayout>{page}</MainLayout>;
};

ReferralProgramDetails.theme = function getTheme() {
  return THEME_WHITE;
};

export default ReferralProgramDetails;
