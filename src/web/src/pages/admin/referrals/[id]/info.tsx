import { QueryClient, dehydrate, useQuery } from "@tanstack/react-query";
import axios from "axios";
import { type GetServerSidePropsContext } from "next";
import { getServerSession } from "next-auth";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { type ParsedUrlQuery } from "querystring";
import { type ReactElement } from "react";
import { IoMdArrowRoundBack } from "react-icons/io";
import { Program } from "~/api/models/referrals";
import { getReferralProgramById } from "~/api/services/referrals";
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
import { ProgramCard } from "~/components/Referrals/ProgramCard";
import { ProgramImage } from "~/components/Referrals/ProgramImage";
import { InternalServerError } from "~/components/Status/InternalServerError";
import { Loading } from "~/components/Status/Loading";
import { Unauthenticated } from "~/components/Status/Unauthenticated";
import { Unauthorized } from "~/components/Status/Unauthorized";
import { config } from "~/lib/react-query-config";
import { getSafeUrl, getThemeFromRole } from "~/lib/utils";
import type { NextPageWithLayout } from "~/pages/_app";
import { authOptions, type User } from "~/server/auth";

interface IParams extends ParsedUrlQuery {
  id: string;
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const { id } = context.params as IParams;
  const session = await getServerSession(context.req, context.res, authOptions);
  const queryClient = new QueryClient(config);
  let errorCode = null;

  if (!session) {
    return {
      props: {
        error: 401,
      },
    };
  }

  const theme = getThemeFromRole(session);

  try {
    const programData = await getReferralProgramById(id, context);
    await queryClient.prefetchQuery({
      queryKey: ["referralProgram", id],
      queryFn: () => programData,
    });
  } catch (error) {
    console.log("Error fetching referral program data:", error);
    if (axios.isAxiosError(error) && error.response?.status) {
      if (error.response.status === 404) {
        return {
          notFound: true,
          props: { theme: theme },
        };
      } else errorCode = error.response.status;
    } else errorCode = 500;
  }

  return {
    props: {
      dehydratedState: dehydrate(queryClient),
      user: session?.user ?? null,
      id: id ?? null,
      theme,
      error: errorCode,
    },
  };
}

const ReferralProgramInfo: NextPageWithLayout<{
  id: string;
  user: User;
  theme: string;
  error?: number;
}> = ({ id, error }) => {
  const router = useRouter();
  const { returnUrl } = router.query;

  const { data: program, isLoading } = useQuery<Program>({
    queryKey: ["referralProgram", id],
    queryFn: () => getReferralProgramById(id),
    enabled: !error,
  });

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
            {/* Program Image */}
            <div className="flex-shrink-0">
              <ProgramImage
                imageURL={program?.imageURL}
                name={program?.name ?? "Program"}
                size={60}
                className="border-2 border-gray-200"
              />
            </div>

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
                ]}
              />
            )}
          </div>

          {/* Program Card Preview */}
          {program && (
            <>
              <div>
                <h6 className="text-sm font-semibold">Program Card Preview</h6>
                <p className="text-xs text-gray-600">
                  This is how your program appears to users
                </p>
                <div className="flex justify-center py-4">
                  <ProgramCard data={program} />
                </div>
              </div>

              <AdminProgramInfo
                program={program}
                filterOptions={[
                  ProgramInfoFilterOptions.PROGRAM_INFO,
                  ProgramInfoFilterOptions.COMPLETION_REWARDS,
                  ProgramInfoFilterOptions.ZLTO_REWARDS,
                  ProgramInfoFilterOptions.FEATURES,
                  ProgramInfoFilterOptions.PATHWAY,
                ]}
              />
            </>
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
              href={`/admin/referrals/${id}${returnUrl ? `?returnUrl=${encodeURIComponent(getSafeUrl("", router.asPath))}` : ""}`}
              className="btn btn-primary btn-sm rounded-full px-8 normal-case"
            >
              Edit Program
            </Link>
            <Link
              href={`/admin/referrals/${id}/links${returnUrl ? `?returnUrl=${encodeURIComponent(getSafeUrl("", router.asPath))}` : ""}`}
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

ReferralProgramInfo.theme = function getTheme(
  page: ReactElement<{ theme: string }>,
) {
  return page.props.theme;
};

export default ReferralProgramInfo;
