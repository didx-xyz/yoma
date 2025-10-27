import { QueryClient, dehydrate, useQuery } from "@tanstack/react-query";
import axios from "axios";
import { type GetServerSidePropsContext } from "next";
import { getServerSession } from "next-auth";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { type ParsedUrlQuery } from "querystring";
import { type ReactElement } from "react";
import "react-datepicker/dist/react-datepicker.css";
import { IoMdArrowRoundBack } from "react-icons/io";
import Moment from "react-moment";
import type { ReferralLinkUsageInfo } from "~/api/models/referrals";
import { getReferralLinkUsageById } from "~/api/services/referrals";
import MainLayout from "~/components/Layout/Main";
import { PageBackground } from "~/components/PageBackground";
import { InternalServerError } from "~/components/Status/InternalServerError";
import { Loading } from "~/components/Status/Loading";
import { Unauthenticated } from "~/components/Status/Unauthenticated";
import { Unauthorized } from "~/components/Status/Unauthorized";
import { config } from "~/lib/react-query-config";
import { DATE_FORMAT_HUMAN } from "~/lib/constants";
import { getSafeUrl, getThemeFromRole } from "~/lib/utils";
import type { NextPageWithLayout } from "~/pages/_app";
import { authOptions, type User } from "~/server/auth";
import { ProgramPathwayViewComponent } from "~/components/Referrals/ProgramPathwayView";

interface IParams extends ParsedUrlQuery {
  id: string;
  linkId: string;
  usageId: string;
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const { usageId } = context.params as IParams;
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
    const usageData = await getReferralLinkUsageById(usageId, context);
    await queryClient.prefetchQuery({
      queryKey: ["referralLinkUsage", usageId],
      queryFn: () => usageData,
    });
  } catch (error) {
    console.log("Error fetching referral link usage data:", error);
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
      usageId: usageId ?? null,
      theme,
      error: errorCode,
    },
  };
}

const ReferralLinkUsageInfo: NextPageWithLayout<{
  usageId: string;
  user: User;
  theme: string;
  error?: number;
}> = ({ usageId, error }) => {
  const router = useRouter();
  const { returnUrl, id, linkId } = router.query;

  const { data: usage, isLoading } = useQuery<ReferralLinkUsageInfo>({
    queryKey: ["referralLinkUsage", usageId],
    queryFn: () => getReferralLinkUsageById(usageId),
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
        <title>{`Yoma | ${usage?.userDisplayName || "Usage Details"}`}</title>
      </Head>

      <PageBackground />

      <div className="z-10 container mt-20 max-w-5xl px-2 py-8">
        <div className="flex flex-row text-xs text-white">
          <Link
            className="hover:text-gray flex items-center justify-center font-bold"
            href={getSafeUrl(
              returnUrl?.toString(),
              `/admin/referrals/${id}/links/${linkId}`,
            )}
          >
            <IoMdArrowRoundBack className="mr-2 inline-block h-4 w-4" />
            Back to Link
          </Link>
          <div className="mx-2 font-bold">|</div>
          <span className="max-w-[600px] overflow-hidden text-ellipsis whitespace-nowrap">
            Usage Details
          </span>
        </div>

        <div className="animate-fade-in mx-auto mt-5 space-y-6 rounded-2xl bg-white p-6 shadow-md">
          {/* Header */}
          <div className="flex flex-row items-start justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-2xl font-bold">Link Usage Details</h1>
              <p className="mt-2 text-gray-500">
                Track the progress of this referral link usage
              </p>
            </div>
          </div>

          {/* Usage Information */}
          <section>
            <h2 className="mb-2 flex items-center gap-2 text-lg font-semibold">
              📋 Usage Information
            </h2>
            <div className="overflow-x-auto">
              <div className="grid overflow-hidden rounded-lg border border-gray-200 md:grid-cols-2">
                <div className="flex">
                  <div className="w-40 border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700">
                    Status
                  </div>
                  <div className="flex-1 border border-gray-200 px-4 py-2 text-sm hover:bg-gray-100">
                    {usage?.status ? (
                      <span
                        className={`badge ${
                          usage.status === "Completed"
                            ? "bg-green-light text-green"
                            : usage.status === "Pending"
                              ? "bg-yellow-tint text-yellow"
                              : usage.status === "Expired"
                                ? "bg-orange-light text-orange"
                                : "bg-gray-light text-gray-dark"
                        }`}
                      >
                        {usage.status}
                      </span>
                    ) : (
                      "Not set"
                    )}
                  </div>
                </div>

                <div className="flex">
                  <div className="w-40 border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700">
                    Progress
                  </div>
                  <div className="flex-1 border border-gray-200 px-4 py-2 text-sm hover:bg-gray-100">
                    {usage?.percentComplete !== null &&
                    usage?.percentComplete !== undefined ? (
                      <div className="flex items-center gap-2">
                        <div className="flex-1">
                          <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                            <div
                              className="bg-green h-full transition-all"
                              style={{ width: `${usage.percentComplete}%` }}
                            />
                          </div>
                        </div>
                        <span className="font-semibold">
                          {usage.percentComplete}%
                        </span>
                      </div>
                    ) : (
                      "0%"
                    )}
                  </div>
                </div>

                <div className="flex">
                  <div className="w-40 border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700">
                    Program
                  </div>
                  <div className="flex-1 border border-gray-200 px-4 py-2 text-sm hover:bg-gray-100">
                    <Link
                      href={`/admin/referrals/${usage?.programId}/info${returnUrl ? `?returnUrl=${encodeURIComponent(returnUrl.toString())}` : ""}`}
                      className="text-blue-600 hover:underline"
                    >
                      {usage?.programName ?? "N/A"}
                    </Link>
                  </div>
                </div>

                <div className="flex">
                  <div className="w-40 border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700">
                    Referral Link
                  </div>
                  <div className="flex-1 border border-gray-200 px-4 py-2 text-sm hover:bg-gray-100">
                    {/* <Link
                      href={`/admin/referrals/${usage?.programId}/links/${usage?.linkId}${returnUrl ? `?returnUrl=${encodeURIComponent(returnUrl.toString())}` : ""}`}
                      className="text-blue-600 hover:underline"
                    >
                      {usage?.linkName ?? "N/A"}
                    </Link> */}
                    <div>{usage?.linkName ?? "N/A"}</div>
                  </div>
                </div>

                <div className="flex">
                  <div className="w-40 border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700">
                    Date Claimed
                  </div>
                  <div className="flex-1 border border-gray-200 px-4 py-2 text-sm hover:bg-gray-100">
                    {usage?.dateClaimed ? (
                      <Moment format={DATE_FORMAT_HUMAN} utc={true}>
                        {usage.dateClaimed}
                      </Moment>
                    ) : (
                      "N/A"
                    )}
                  </div>
                </div>

                <div className="flex">
                  <div className="w-40 border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700">
                    Date Completed
                  </div>
                  <div className="flex-1 border border-gray-200 px-4 py-2 text-sm hover:bg-gray-100">
                    {usage?.dateCompleted ? (
                      <Moment format={DATE_FORMAT_HUMAN} utc={true}>
                        {usage.dateCompleted}
                      </Moment>
                    ) : (
                      "Not completed"
                    )}
                  </div>
                </div>

                <div className="flex">
                  <div className="w-40 border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700">
                    Date Expired
                  </div>
                  <div className="flex-1 border border-gray-200 px-4 py-2 text-sm hover:bg-gray-100">
                    {usage?.dateExpired ? (
                      <Moment format={DATE_FORMAT_HUMAN} utc={true}>
                        {usage.dateExpired}
                      </Moment>
                    ) : (
                      "Not expired"
                    )}
                  </div>
                </div>

                <div className="flex">
                  <div className="w-40 border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700">
                    Proof of Personhood
                  </div>
                  <div className="flex-1 border border-gray-200 px-4 py-2 text-sm hover:bg-gray-100">
                    {usage?.proofOfPersonhoodCompleted ? (
                      <span className="flex items-center gap-2">
                        <span className="badge badge-success badge-sm">
                          ✓ Completed
                        </span>
                        {usage.proofOfPersonhoodMethod && (
                          <span className="text-gray-600">
                            ({usage.proofOfPersonhoodMethod})
                          </span>
                        )}
                      </span>
                    ) : (
                      <span className="text-gray-500">Not completed</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Referee Information */}
          <section>
            <h2 className="mb-2 flex items-center gap-2 text-lg font-semibold">
              👤 Referee Information
            </h2>
            <div className="overflow-x-auto">
              <div className="grid overflow-hidden rounded-lg border border-gray-200 md:grid-cols-2">
                <div className="flex">
                  <div className="w-40 border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700">
                    Name
                  </div>
                  <div className="flex-1 border border-gray-200 px-4 py-2 text-sm hover:bg-gray-100">
                    <Link
                      href={`/admin/users/${usage?.userId}${returnUrl ? `?returnUrl=${encodeURIComponent(returnUrl.toString())}` : ""}`}
                      className="text-blue-600 hover:underline"
                    >
                      {usage?.userDisplayName ?? "N/A"}
                    </Link>
                  </div>
                </div>

                <div className="flex">
                  <div className="w-40 border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700">
                    Email
                  </div>
                  <div className="flex-1 border border-gray-200 px-4 py-2 text-sm hover:bg-gray-100">
                    {usage?.userEmail ?? "N/A"}
                  </div>
                </div>

                <div className="flex md:col-span-2">
                  <div className="w-40 border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700">
                    Phone
                  </div>
                  <div className="flex-1 border border-gray-200 px-4 py-2 text-sm hover:bg-gray-100">
                    {usage?.userPhoneNumber ?? "N/A"}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Referrer Information */}
          <section>
            <h2 className="mb-2 flex items-center gap-2 text-lg font-semibold">
              🔗 Referrer Information
            </h2>
            <div className="overflow-x-auto">
              <div className="grid overflow-hidden rounded-lg border border-gray-200 md:grid-cols-2">
                <div className="flex">
                  <div className="w-40 border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700">
                    Name
                  </div>
                  <div className="flex-1 border border-gray-200 px-4 py-2 text-sm hover:bg-gray-100">
                    {usage?.userIdReferrer ? (
                      <Link
                        href={`/admin/users/${usage.userIdReferrer}${returnUrl ? `?returnUrl=${encodeURIComponent(returnUrl.toString())}` : ""}`}
                        className="text-blue-600 hover:underline"
                      >
                        {usage.userDisplayNameReferrer ?? "N/A"}
                      </Link>
                    ) : (
                      (usage?.userDisplayNameReferrer ?? "N/A")
                    )}
                  </div>
                </div>

                <div className="flex">
                  <div className="w-40 border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700">
                    Email
                  </div>
                  <div className="flex-1 border border-gray-200 px-4 py-2 text-sm hover:bg-gray-100">
                    {usage?.userEmailReferrer ?? "N/A"}
                  </div>
                </div>

                <div className="flex md:col-span-2">
                  <div className="w-40 border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700">
                    Phone
                  </div>
                  <div className="flex-1 border border-gray-200 px-4 py-2 text-sm hover:bg-gray-100">
                    {usage?.userPhoneNumberReferrer ?? "N/A"}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Pathway Progress */}
          {usage?.pathway && (
            <section>
              <h2 className="mb-2 flex items-center gap-2 text-lg font-semibold">
                🛤️ Engagement Pathway Progress
              </h2>
              <div className="overflow-x-auto">
                <ProgramPathwayViewComponent pathway={usage.pathway} />
              </div>
            </section>
          )}

          {/* Actions */}
          <div className="flex flex-row justify-center gap-4 pt-4">
            <Link
              href={getSafeUrl(
                returnUrl?.toString(),
                `/admin/referrals/${id}/links/${linkId}`,
              )}
              className="btn btn-warning btn-md rounded-full px-8 normal-case"
            >
              Back to Link
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

ReferralLinkUsageInfo.getLayout = function getLayout(page: ReactElement) {
  return <MainLayout>{page}</MainLayout>;
};

ReferralLinkUsageInfo.theme = function getTheme(
  page: ReactElement<{ theme: string }>,
) {
  return page.props.theme;
};

export default ReferralLinkUsageInfo;
