import axios from "axios";
import { useSession } from "next-auth/react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { type ReactElement } from "react";
import { IoMdArrowRoundBack } from "react-icons/io";
import MainLayout from "~/components/Layout/Main";
import { PageBackground } from "~/components/PageBackground";
import {
  AdminProgramInfo,
  ProgramInfoFilterOptions,
} from "~/components/Referrals/AdminProgramInfo";
import {
  AdminReferralProgramActions,
  ReferralProgramActionOptions,
} from "~/components/Referrals/AdminReferralProgramActions";
import { InternalServerError } from "~/components/Status/InternalServerError";
import { Loading } from "~/components/Status/Loading";
import { Unauthenticated } from "~/components/Status/Unauthenticated";
import { Unauthorized } from "~/components/Status/Unauthorized";
import { useReferralProgramByIdQuery } from "~/hooks/useReferralProgramMutations";
import { THEME_BLUE } from "~/lib/constants";
import { getSafeUrl } from "~/lib/utils";
import type { NextPageWithLayout } from "~/pages/_app";
const ReferralProgramInfo: NextPageWithLayout = () => {
  const router = useRouter();
  const { status: sessionStatus } = useSession();
  const { returnUrl } = router.query;
  const id = typeof router.query.id === "string" ? router.query.id : "";

  const {
    data: program,
    isLoading,
    error: programError,
  } = useReferralProgramByIdQuery(id, {
    enabled: sessionStatus === "authenticated" && router.isReady && !!id,
  });

  const error = axios.isAxiosError(programError)
    ? (programError.response?.status ?? 500)
    : null;

  if (sessionStatus === "loading" || !router.isReady) return <Loading />;

  if (sessionStatus === "unauthenticated") return <Unauthenticated />;

  if (error) {
    if (error === 401) return <Unauthenticated />;
    else if (error === 403) return <Unauthorized />;
    else return <InternalServerError />;
  }

  if (isLoading) return <Loading />;

  return (
    <>
      <Head>
        <title>{`Yoma | ${program?.name || "Program Details"}`}</title>
      </Head>

      <PageBackground />

      <div className="z-10 container mt-20 max-w-5xl px-2 py-8">
        {/* BREADCRUMB */}
        <div className="flex flex-row items-center gap-2 text-xs text-white">
          <Link
            className="hover:text-gray flex max-w-[200px] min-w-0 items-center font-bold"
            href={getSafeUrl(returnUrl?.toString(), `/admin/referrals`)}
          >
            <IoMdArrowRoundBack className="mr-2 inline-block h-4 w-4 shrink-0" />
            <span className="truncate">Referral Programs</span>
          </Link>

          <div className="font-bold">|</div>
          <span className="max-w-[200px] min-w-0 truncate">
            {program?.name}
          </span>
        </div>

        <div className="animate-fade-in mx-auto mt-5 space-y-6 rounded-2xl bg-white p-6 shadow-md">
          <div className="flex flex-row items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex min-w-0 items-center gap-2">
                <h1 className="truncate text-base font-bold md:text-lg">
                  {program?.name ?? "N/A"}
                </h1>
                {program?.isDefault && (
                  <span className="badge badge-primary">Default</span>
                )}
              </div>
              <p className="truncate text-xs text-gray-500 md:text-sm">
                {program?.description ?? "No description provided"}
              </p>
            </div>

            {program && (
              <AdminReferralProgramActions
                program={program}
                returnUrl={router.asPath}
                actionOptions={[
                  ReferralProgramActionOptions.ACTIVATE,
                  ReferralProgramActionOptions.INACTIVATE,
                  ReferralProgramActionOptions.EDIT,
                  ReferralProgramActionOptions.VIEW_LINKS,
                  ReferralProgramActionOptions.DELETE,
                  ReferralProgramActionOptions.TOGGLE_HIDDEN,
                ]}
              />
            )}
          </div>

          {program && (
            <AdminProgramInfo
              program={program}
              filterOptions={[
                ProgramInfoFilterOptions.PREVIEW,
                ProgramInfoFilterOptions.PROGRAM_INFO,
                ProgramInfoFilterOptions.COMPLETION_REWARDS,
                ProgramInfoFilterOptions.FEATURES,
                ProgramInfoFilterOptions.PATHWAY,
                ProgramInfoFilterOptions.ANALYTICS,
              ]}
            />
          )}

          {/* Link Usage */}
          <div className="flex flex-col justify-center gap-4 pt-4 md:flex-row">
            <Link
              href={getSafeUrl(returnUrl?.toString(), `/admin/referrals`)}
              className="btn btn-warning btn-sm rounded-full px-8 normal-case"
            >
              Back to List
            </Link>
            <Link
              href={`/admin/referrals/${id}?returnUrl=${encodeURIComponent(getSafeUrl("", router.asPath))}`}
              className="btn btn-primary btn-sm rounded-full px-8 normal-case"
            >
              Edit Program
            </Link>
            <Link
              href={`/admin/referrals/${id}/links?returnUrl=${encodeURIComponent(getSafeUrl("", router.asPath))}`}
              className="btn btn-secondary btn-sm rounded-full px-8 normal-case"
            >
              View Referral Links
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

ReferralProgramInfo.getLayout = function getLayout(page: ReactElement) {
  return <MainLayout>{page}</MainLayout>;
};

ReferralProgramInfo.theme = function getTheme() {
  return THEME_BLUE;
};

export default ReferralProgramInfo;
