import {
  QueryClient,
  dehydrate,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import axios from "axios";
import { useAtomValue } from "jotai";
import { type GetServerSidePropsContext } from "next";
import { getServerSession } from "next-auth";
import Head from "next/head";
import { useRouter } from "next/router";
import { type ParsedUrlQuery } from "querystring";
import { type ReactElement, useCallback, useState } from "react";
import { IoLinkOutline } from "react-icons/io5";
import { ProgramStatus, type ProgramInfo } from "~/api/models/referrals";
import { getReferralProgramInfoById } from "~/api/services/referrals";
import MainLayout from "~/components/Layout/Main";
import { ReferralProgramDetailsContent } from "~/components/Referrals/new/ReferralProgramDetailsContent";
import { ReferralShell } from "~/components/Referrals/new/ReferralShell";
import { ReferrerCreateLinkModal } from "~/components/Referrals/ReferrerCreateLinkModal";
import { LoadingInline } from "~/components/Status/LoadingInline";
import analytics from "~/lib/analytics";
import { handleUserSignIn } from "~/lib/authUtils";
import { THEME_WHITE } from "~/lib/constants";
import { config } from "~/lib/react-query-config";
import { currentLanguageAtom } from "~/lib/store";
import type { NextPageWithLayout } from "~/pages/_app";
import { type User, authOptions } from "~/server/auth";

interface IParams extends ParsedUrlQuery {
  programId: string;
}

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
  const { programId } = context.params as IParams;
  const mockStatus = parseMockProgramStatus(context.query.mockStatus);
  const queryClient = new QueryClient(config);
  const session = await getServerSession(context.req, context.res, authOptions);
  let errorCode = null;
  let dataProgramInfo: ProgramInfo | null = null;

  if (!programId) {
    return {
      notFound: true,
    };
  }

  try {
    dataProgramInfo = await queryClient.fetchQuery({
      queryKey: ["ReferralProgramInfo", programId],
      queryFn: () => getReferralProgramInfoById(programId, context),
    });

    if (dataProgramInfo && mockStatus !== null) {
      dataProgramInfo.status = mockStatus;
    }
  } catch (error) {
    console.error(
      "Error fetching referral program in getServerSideProps",
      error,
    );
    if (axios.isAxiosError(error) && error.response?.status) {
      if (error.response.status === 404) {
        return {
          notFound: true,
        };
      } else errorCode = error.response.status;
    } else errorCode = 500;
  }

  return {
    props: {
      dehydratedState: dehydrate(queryClient),
      user: session?.user ?? null,
      programInfo: dataProgramInfo,
      programId,
      error: errorCode,
    },
  };
}

const ReferralProgramDetails: NextPageWithLayout<{
  user: User | null;
  programInfo: ProgramInfo | null;
  programId: string;
  error?: number;
}> = ({ user, programInfo, programId, error }) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isButtonLoading, setIsButtonLoading] = useState(false);
  const [createLinkModalVisible, setCreateLinkModalVisible] = useState(false);
  const currentLanguage = useAtomValue(currentLanguageAtom);

  const handleCreateLink = useCallback(async () => {
    if (user) {
      setCreateLinkModalVisible(true);
      return;
    }

    setIsButtonLoading(true);

    analytics.trackEvent("login_button_clicked", {
      language: currentLanguage,
      buttonLocation: "referral_program_details",
    });

    await handleUserSignIn(currentLanguage);
  }, [currentLanguage, user]);

  const {
    data: program,
    isLoading,
    error: programError,
  } = useQuery<ProgramInfo>({
    queryKey: ["ReferralProgramInfo", programId],
    queryFn: () => getReferralProgramInfoById(programId),
    initialData: programInfo ?? undefined,
    enabled: !!programId && !error,
  });
  const hasPageError = Boolean(error) || Boolean(programError);

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

  return (
    <>
      <Head>
        <title>{`Yoma | Refer a friend ❤️ | ${program?.name ?? "Programme Details"}`}</title>
        <meta
          name="description"
          content={program?.description ?? "Referral programme details"}
        />
      </Head>

      <ReferralShell
        title={program?.name ?? programInfo?.name ?? "Referral programme"}
        breadcrumbLabel="Referral Programmes"
        //programImageUrl={program?.imageURL || undefined}
        headerBackgroundMode="color"
        headerBackgroundColorClassName="bg-orange"
        onBack={() => router.back()}
        isLoading={!hasPageError && (isLoading || !program)}
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
        ) : program ? (
          <ReferralProgramDetailsContent
            program={program}
            cta={
              <button
                type="button"
                className="btn btn-sm bg-green hover:bg-green-dark disabled:!bg-green h-10 rounded-full border-0 px-5 text-white normal-case disabled:!pointer-events-auto disabled:!cursor-not-allowed disabled:!text-white disabled:opacity-80"
                onClick={handleCreateLink}
                disabled={isButtonLoading || isCreateLinkDisabledByStatus}
              >
                {isButtonLoading ? (
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
              queryKey: ["ReferralLinks"],
            });

            if (link?.id) {
              await router.push(`/referrals/link/${link.id}`);
              return;
            }

            await router.push(`/referrals`);
          }}
        />
      )}
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
