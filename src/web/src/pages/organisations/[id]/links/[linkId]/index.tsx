import { QueryClient, dehydrate, useQuery } from "@tanstack/react-query";
import axios from "axios";
import { type GetServerSidePropsContext } from "next";
import { getServerSession } from "next-auth";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { type ParsedUrlQuery } from "querystring";
import { useCallback, useState, type ReactElement } from "react";
import "react-datepicker/dist/react-datepicker.css";
import { IoMdArrowRoundBack } from "react-icons/io";
import Moment from "react-moment";
import {
  LinkSearchFilterUsage,
  LinkSearchResultsUsage,
  LinkUsageStatus,
} from "~/api/models/actionLinks";
import { searchLinkUsage } from "~/api/services/actionLinks";
import MainLayout from "~/components/Layout/Main";
import { PageBackground } from "~/components/PageBackground";
import { PaginationButtons } from "~/components/PaginationButtons";
import { InternalServerError } from "~/components/Status/InternalServerError";
import { Unauthenticated } from "~/components/Status/Unauthenticated";
import { Unauthorized } from "~/components/Status/Unauthorized";
import { DATE_FORMAT_HUMAN, PAGE_SIZE } from "~/lib/constants";
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
  const { valueContains, page } = context.query;
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
        pageNumber: page ? parseInt(page.toString()) : 1,
        pageSize: PAGE_SIZE,
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
      id: id ?? null,
      linkId: linkId ?? null,
      valueContains: valueContains ?? null,
      page: page ?? null,
      theme,
      error: errorCode,
    },
  };
}

const LinkOverview: NextPageWithLayout<{
  id: string;
  linkId: string;
  valueContains?: string;
  page?: string;
  user: User;
  theme: string;
  error?: number;
}> = ({ id, linkId, valueContains, page, error }) => {
  const router = useRouter();
  const { returnUrl } = router.query;

  // 👇 fetch link details
  const { data: link } = useQuery<LinkSearchResultsUsage>({
    queryKey: ["link", linkId],
    enabled: !error,
  });

  // search filter state
  const [searchFilter] = useState<LinkSearchFilterUsage>({
    id: linkId,
    usage: LinkUsageStatus.All,
    valueContains: valueContains ?? null,
    pageNumber: page ? parseInt(page) : 1,
    pageSize: PAGE_SIZE,
  });

  // 🎈 FUNCTIONS
  const getSearchFilterAsQueryString = useCallback(
    (searchFilter: LinkSearchFilterUsage) => {
      if (!searchFilter) return null;

      // construct querystring parameters from filter
      const params = new URLSearchParams();

      if (searchFilter?.valueContains)
        params.append("valueContains", searchFilter.valueContains);

      if (
        searchFilter.pageNumber !== null &&
        searchFilter.pageNumber !== undefined &&
        searchFilter.pageNumber !== 1
      )
        params.append("page", searchFilter.pageNumber.toString());

      if (params.size === 0) return null;
      return params;
    },
    [],
  );

  const redirectWithSearchFilterParams = useCallback(
    (filter: LinkSearchFilterUsage) => {
      let url = `/organisations/${id}/links/${linkId}`;

      const params = getSearchFilterAsQueryString(filter);
      if (params != null && params.size > 0) url = `${url}?${params}`;

      if (url != router.asPath)
        void router.push(url, undefined, { scroll: false });
    },
    [id, linkId, router, getSearchFilterAsQueryString],
  );

  // 🔔 pager change event
  const handlePagerChange = useCallback(
    (value: number) => {
      searchFilter.pageNumber = value;
      redirectWithSearchFilterParams(searchFilter);
    },
    [searchFilter, redirectWithSearchFilterParams],
  );

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
            <h1 className="text-2xl font-bold">{link?.link?.name ?? "N/A"}</h1>
            <p className="text-gray-500">{link?.link?.description ?? "N/A"}</p>
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
                    {link?.link?.status ? (
                      link?.link?.status === "Active" ? (
                        <span className="text-green-600">✅ Active</span>
                      ) : (
                        <span className="text-red-600">
                          ❌ {link?.link?.status?.toString()}
                        </span>
                      )
                    ) : (
                      "N/A"
                    )}
                  </div>
                </div>
                {/* Action */}
                <div className="flex">
                  <div className="w-40 border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700">
                    Action
                  </div>
                  <div className="flex-1 border border-gray-200 px-4 py-2 text-sm text-ellipsis whitespace-nowrap hover:bg-gray-100">
                    {link?.link?.action
                      ? link?.link?.action === "Share"
                        ? "Share"
                        : "Verify"
                      : "N/A"}
                  </div>
                </div>
                {/* Entity Type / Opportunity */}
                {link?.link?.entityType === "Opportunity" ? (
                  <div className="flex">
                    <div className="w-40 border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700">
                      Opportunity
                    </div>
                    <div className="flex-1 border border-gray-200 px-4 py-2 text-sm hover:bg-gray-50">
                      {link?.link?.entityTitle ?? "N/A"}
                    </div>
                  </div>
                ) : (
                  <div className="flex">
                    <div className="w-40 border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700">
                      Entity Type
                    </div>
                    <div className="flex-1 border border-gray-200 px-4 py-2 text-sm hover:bg-gray-50">
                      {link?.link?.entityType ?? "N/A"}
                    </div>
                  </div>
                )}
                {/* Organisation */}
                <div className="flex">
                  <div className="w-40 border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700">
                    Organisation
                  </div>
                  <div className="flex-1 border border-gray-200 px-4 py-2 text-sm hover:bg-gray-50">
                    {link?.link?.entityOrganizationName ?? "N/A"}
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
                    {link?.link?.uRL ? (
                      <a
                        className="text-blue-600 underline"
                        href={link?.link?.uRL}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={link?.link?.uRL}
                      >
                        {link?.link?.uRL}
                      </a>
                    ) : (
                      "N/A"
                    )}
                  </div>
                </div>
                {/* Short URL */}
                <div className="flex">
                  <div className="w-40 border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700">
                    Short URL
                  </div>
                  <div className="flex-1 border border-gray-200 px-4 py-2 text-sm text-ellipsis whitespace-nowrap hover:bg-gray-100">
                    {link?.link?.shortURL ? (
                      <a
                        className="text-blue-600 underline"
                        href={link?.link?.shortURL}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={link?.link?.shortURL}
                      >
                        {link?.link?.shortURL}
                      </a>
                    ) : (
                      "N/A"
                    )}
                  </div>
                </div>
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
                        : "N/A"}
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
                    {link?.link?.usagesTotal
                      ? `${link?.link?.usagesTotal} / ${link?.link?.usagesLimit ?? "∞"}`
                      : "N/A"}
                  </div>
                </div>
                {/* Available */}
                <div className="flex">
                  <div className="w-40 border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700">
                    Available
                  </div>
                  <div className="flex-1 border border-gray-200 px-4 py-2 text-sm text-ellipsis whitespace-nowrap hover:bg-gray-100">
                    {link?.link?.usagesAvailable !== undefined &&
                    link?.link?.usagesAvailable !== null
                      ? link?.link?.usagesAvailable
                      : "N/A"}
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
                      "N/A"
                    )}
                  </div>
                </div>
                {/* Created */}
                <div className="flex">
                  <div className="w-40 border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700">
                    Created
                  </div>
                  <div className="flex-1 border border-gray-200 px-4 py-2 text-sm text-ellipsis whitespace-nowrap hover:bg-gray-100">
                    {link?.link?.dateCreated ? (
                      <Moment format={DATE_FORMAT_HUMAN} utc={true}>
                        {link?.link?.dateCreated}
                      </Moment>
                    ) : (
                      "N/A"
                    )}
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
                <div className="rounded-lg border border-gray-200">
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
                            {item.displayName ?? item.username ?? "N/A"}
                          </td>
                          <td className="border border-gray-200 px-4 py-2">
                            {item.email ?? "N/A"}
                          </td>
                          <td className="border border-gray-200 px-4 py-2">
                            {item.phoneNumber ?? "N/A"}
                          </td>
                          <td className="border border-gray-200 px-4 py-2">
                            {item.country ?? "N/A"}
                          </td>
                          <td className="border border-gray-200 px-4 py-2">
                            {item.age ?? "N/A"}
                          </td>
                          <td className="border border-gray-200 px-4 py-2">
                            {item.claimed !== undefined ? (
                              item.claimed ? (
                                <span className="text-green-600">✅ Yes</span>
                              ) : (
                                <span className="text-red-500">❌ No</span>
                              )
                            ) : (
                              "N/A"
                            )}
                          </td>
                          <td className="border border-gray-200 px-4 py-2">
                            {item.dateClaimed ? (
                              <Moment format={DATE_FORMAT_HUMAN} utc={true}>
                                {item.dateClaimed}
                              </Moment>
                            ) : (
                              "N/A"
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* PAGINATION */}
                <div className="mt-2 grid place-items-center justify-center">
                  <PaginationButtons
                    currentPage={page ? parseInt(page) : 1}
                    totalItems={link?.totalCount ?? 0}
                    pageSize={PAGE_SIZE}
                    onClick={handlePagerChange}
                    showPages={false}
                    showInfo={true}
                  />
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
