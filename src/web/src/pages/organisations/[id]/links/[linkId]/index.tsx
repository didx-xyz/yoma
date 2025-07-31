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
import {
  LinkSearchResultsUsage,
  LinkUsageStatus,
} from "~/api/models/actionLinks";
import { searchLinkUsage } from "~/api/services/actionLinks";
import MainLayout from "~/components/Layout/Main";
import { PageBackground } from "~/components/PageBackground";
import { InternalServerError } from "~/components/Status/InternalServerError";
import { Unauthenticated } from "~/components/Status/Unauthenticated";
import { Unauthorized } from "~/components/Status/Unauthorized";
import { DATE_FORMAT_HUMAN } from "~/lib/constants";
import { config } from "~/lib/react-query-config";
import { getSafeUrl, getThemeFromRole } from "~/lib/utils";
import type { NextPageWithLayout } from "~/pages/_app";
import { authOptions, type User } from "~/server/auth";

interface IParams extends ParsedUrlQuery {
  id: string;
  linkId: string;
}

// ⚠️ SSR
export async function getServerSideProps(context: GetServerSidePropsContext) {
  const { id, linkId } = context.params as IParams;
  const session = await getServerSession(context.req, context.res, authOptions);
  const queryClient = new QueryClient(config);
  let errorCode = null;

  // 👇 ensure authenticated
  if (!session) {
    return {
      props: {
        error: 401,
      },
    };
  }

  // 👇 set theme based on role
  const theme = getThemeFromRole(session, id);

  try {
    // 👇 prefetch link details
    const linkData = await searchLinkUsage(
      {
        id: linkId,
        usage: LinkUsageStatus.All,
        valueContains: null,
        pageNumber: null,
        pageSize: null,
      },
      context,
    );
    await queryClient.prefetchQuery({
      queryKey: ["link", linkId],
      queryFn: () => linkData,
    });
  } catch (error) {
    console.log("Error fetching link data:", error);
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
      id,
      linkId,
      theme,
      error: errorCode,
    },
  };
}

const LinkOverview: NextPageWithLayout<{
  id: string;
  linkId: string;
  user: User;
  theme: string;
  error?: number;
}> = ({ id, linkId, error }) => {
  const router = useRouter();
  const { returnUrl } = router.query;

  // 👇 fetch link details
  const { data: link } = useQuery<LinkSearchResultsUsage>({
    queryKey: ["link", linkId],
    enabled: !error,
  });

  if (error) {
    if (error === 401) return <Unauthenticated />;
    else if (error === 403) return <Unauthorized />;
    else return <InternalServerError />;
  }

  return (
    <>
      <Head>
        <title>{`Yoma Admin | ${link?.link?.name || "Link Details"}`}</title>
      </Head>

      <PageBackground />

      <div className="z-10 container mt-20 max-w-5xl px-2 py-8">
        {/* BREADCRUMB */}
        <div className="flex flex-row text-xs text-white">
          <Link
            className="hover:text-gray flex items-center justify-center font-bold"
            href={getSafeUrl(
              returnUrl?.toString(),
              `/organisations/${id}/links`,
            )}
          >
            <IoMdArrowRoundBack className="mr-2 inline-block h-4 w-4" />
            Links
          </Link>
          <div className="mx-2 font-bold">|</div>
          <span className="max-w-[600px] overflow-hidden text-ellipsis whitespace-nowrap">
            {link?.link?.name}
          </span>
        </div>

        {/* LINK DETAILS */}
        <div className="animate-fade-in mx-auto mt-5 space-y-6 rounded-2xl bg-white p-6 shadow-md">
          {/* Title */}
          <div>
            <h1 className="text-2xl font-bold">{link?.link?.name}</h1>
            <p className="text-gray-500">{link?.link?.description}</p>
          </div>

          {/* Link Information */}
          <section>
            <h2 className="mb-2 flex items-center gap-2 text-lg font-semibold">
              📄 Link Information
            </h2>
            <div className="overflow-x-auto">
              <div className="grid overflow-hidden rounded-lg border border-gray-200 md:grid-cols-2">
                {/* Status */}
                <div className="flex">
                  <div className="w-40 border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700">
                    Status
                  </div>
                  <div className="flex-1 border border-gray-200 px-4 py-2 text-sm text-ellipsis whitespace-nowrap hover:bg-gray-100">
                    {link?.link?.status === "Active" ? (
                      <span className="text-green-600">✅ Active</span>
                    ) : (
                      <span className="text-red-600">
                        ❌ {link?.link?.status?.toString()}
                      </span>
                    )}
                  </div>
                </div>
                {/* Action */}
                <div className="flex">
                  <div className="w-40 border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700">
                    Action
                  </div>
                  <div className="flex-1 border border-gray-200 px-4 py-2 text-sm text-ellipsis whitespace-nowrap hover:bg-gray-100">
                    {link?.link?.action === "Share" ? "🔗 Share" : "✅ Verify"}
                  </div>
                </div>
                {/* Entity Type */}
                {link?.link?.entityType === "Opportunity" ? (
                  <div className="flex">
                    <div className="w-40 border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700">
                      Opportunity
                    </div>
                    <div className="flex-1 border border-gray-200 px-4 py-2 text-sm hover:bg-gray-50">
                      {link?.link?.entityTitle}
                    </div>
                  </div>
                ) : (
                  <div className="flex">
                    <div className="w-40 border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700">
                      Entity Type
                    </div>
                    <div className="flex-1 border border-gray-200 px-4 py-2 text-sm hover:bg-gray-50">
                      {link?.link?.entityType}
                    </div>
                  </div>
                )}
                {/* Organisation */}
                <div className="flex">
                  <div className="w-40 border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700">
                    Organisation
                  </div>
                  <div className="flex-1 border border-gray-200 px-4 py-2 text-sm hover:bg-gray-50">
                    {link?.link?.entityOrganizationName}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Link Access */}
          <section>
            <h2 className="mb-2 flex items-center gap-2 text-lg font-semibold">
              🔗 Link Access
            </h2>
            <div className="overflow-x-auto">
              <div className="grid overflow-hidden rounded-lg border border-gray-200 md:grid-cols-2">
                {/* URL */}
                <div className="flex">
                  <div className="w-40 border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700">
                    URL
                  </div>
                  <div className="flex-1 border border-gray-200 px-4 py-2 text-sm text-ellipsis whitespace-nowrap hover:bg-gray-100">
                    <a
                      className="text-blue-600 underline"
                      href={link?.link?.uRL}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={link?.link?.uRL}
                    >
                      {link?.link?.uRL}
                    </a>
                  </div>
                </div>
                {/* Short URL */}
                <div className="flex">
                  <div className="w-40 border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700">
                    Short URL
                  </div>
                  <div className="flex-1 border border-gray-200 px-4 py-2 text-sm text-ellipsis whitespace-nowrap hover:bg-gray-100">
                    <a
                      className="text-blue-600 underline"
                      href={link?.link?.shortURL}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={link?.link?.shortURL}
                    >
                      {link?.link?.shortURL}
                    </a>
                  </div>
                </div>
                {/* QR Code */}
                {/* <div className="flex">
                  <div className="w-40 border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700">
                    QR Code
                  </div>
                  <div className="flex-1 border border-gray-200 px-4 py-2 text-sm">
                    {link?.link?.qrCodeBase64 ? (
                      <img
                        src={`data:image/png;base64,${link.link.qrCodeBase64}`}
                        alt="QR Code"
                        className="inline-block h-8 w-8"
                      />
                    ) : (
                      <span className="text-gray-400">❌ NA</span>
                    )}
                  </div>
                </div> */}
                {/* Distribution List */}
                {link?.link?.distributionList && (
                  <div className="flex md:col-span-2">
                    <div className="w-40 border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700">
                      Distribution List
                    </div>
                    <div
                      className="flex-1 border border-gray-200 px-4 py-2 text-sm text-ellipsis whitespace-nowrap hover:bg-gray-100"
                      title={link?.link?.distributionList?.join(", ")}
                    >
                      {link?.link?.distributionList?.length > 0
                        ? link?.link?.distributionList.join(", ")
                        : "None"}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Usage Overview */}
          <section>
            <h2 className="mb-2 flex items-center gap-2 text-lg font-semibold">
              📊 Usage Overview
            </h2>
            <div className="overflow-x-auto">
              <div className="grid overflow-hidden rounded-lg border border-gray-200 md:grid-cols-2">
                {/* Used */}
                <div className="flex">
                  <div className="w-40 border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700">
                    Used
                  </div>
                  <div className="flex-1 border border-gray-200 px-4 py-2 text-sm text-ellipsis whitespace-nowrap hover:bg-gray-100">
                    {`${link?.link?.usagesTotal ?? 0} / ${link?.link?.usagesLimit ?? "∞"}`}
                  </div>
                </div>
                {/* Available */}
                <div className="flex">
                  <div className="w-40 border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700">
                    Available
                  </div>
                  <div className="flex-1 border border-gray-200 px-4 py-2 text-sm text-ellipsis whitespace-nowrap hover:bg-gray-100">
                    {link?.link?.usagesAvailable ?? "N/A"}
                  </div>
                </div>
                {/* Expires */}
                <div className="flex">
                  <div className="w-40 border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700">
                    Expires
                  </div>
                  <div className="flex-1 border border-gray-200 px-4 py-2 text-sm text-ellipsis whitespace-nowrap hover:bg-gray-100">
                    {link?.link?.dateEnd ? (
                      <Moment format={DATE_FORMAT_HUMAN} utc={true}>
                        {link.link.dateEnd}
                      </Moment>
                    ) : (
                      <span className="text-gray-400">❌ NA</span>
                    )}
                  </div>
                </div>
                {/* Created */}
                <div className="flex">
                  <div className="w-40 border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700">
                    Created
                  </div>
                  <div className="flex-1 border border-gray-200 px-4 py-2 text-sm text-ellipsis whitespace-nowrap hover:bg-gray-100">
                    <Moment format={DATE_FORMAT_HUMAN} utc={true}>
                      {link?.link?.dateCreated}
                    </Moment>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Usage Details */}
          <section>
            <h2 className="mb-2 flex items-center gap-2 text-lg font-semibold">
              🧾 Usage Details
            </h2>
            {link?.items && link.items.length > 0 ? (
              <div className="overflow-x-auto">
                <div className="overflow-hiddenx rounded-lg border border-gray-200">
                  <table className="min-w-full table-fixed border-collapse text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        {[
                          "User",
                          "Email",
                          "Phone",
                          "Country",
                          "Age",
                          "Claimed",
                          "Date",
                        ].map((heading) => (
                          <th
                            key={heading}
                            className="border border-gray-200 px-4 py-2 text-left font-medium text-gray-700"
                          >
                            {heading}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {link.items.map((item, idx) => (
                        <tr
                          key={item.userId ?? idx}
                          className="hover:bg-gray-100"
                        >
                          <td className="border border-gray-200 px-4 py-2">
                            {item.displayName ?? item.username}
                          </td>
                          <td className="border border-gray-200 px-4 py-2">
                            {item.email ?? "—"}
                          </td>
                          <td className="border border-gray-200 px-4 py-2">
                            {item.phoneNumber ?? "—"}
                          </td>
                          <td className="border border-gray-200 px-4 py-2">
                            {item.country ?? "—"}
                          </td>
                          <td className="border border-gray-200 px-4 py-2">
                            {item.age ?? "—"}
                          </td>
                          <td className="border border-gray-200 px-4 py-2">
                            {item.claimed ? (
                              <span className="text-green-600">✅ Yes</span>
                            ) : (
                              <span className="text-red-500">❌ No</span>
                            )}
                          </td>
                          <td className="border border-gray-200 px-4 py-2">
                            {item.dateClaimed ? (
                              <Moment format={DATE_FORMAT_HUMAN} utc={true}>
                                {item.dateClaimed}
                              </Moment>
                            ) : (
                              "—"
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="text-gray-500">No usage data available.</div>
            )}
          </section>
        </div>
      </div>
    </>
  );
};

LinkOverview.getLayout = function getLayout(page: ReactElement) {
  return <MainLayout>{page}</MainLayout>;
};

LinkOverview.theme = function getTheme(page: ReactElement<{ theme: string }>) {
  return page.props.theme;
};

export default LinkOverview;
