import { QueryClient, dehydrate, useQuery } from "@tanstack/react-query";
import axios from "axios";
import { type GetServerSidePropsContext } from "next";
import { getServerSession } from "next-auth";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useCallback, useState, type ReactElement } from "react";
import { IoMdCopy } from "react-icons/io";
import {
  ReferralLinkStatus,
  type ReferralLinkSearchFilterAdmin,
  type ReferralLinkSearchResults,
  type Program,
} from "~/api/models/referrals";
import {
  searchReferralLinksAdmin,
  getReferralProgramById,
} from "~/api/services/referrals";
import CustomSlider from "~/components/Carousel/CustomSlider";
import MainLayout from "~/components/Layout/Main";
import NoRowsMessage from "~/components/NoRowsMessage";
import { PageBackground } from "~/components/PageBackground";
import { PaginationButtons } from "~/components/PaginationButtons";
import {
  ReferralLinkFilterOptions,
  ReferralLinkSearchFilters,
} from "~/components/Referrals/ReferralLinkSearchFilter";
import { ReferralLinkActions } from "~/components/Referrals/ReferralLinkActions";
import { InternalServerError } from "~/components/Status/InternalServerError";
import { LoadingSkeleton } from "~/components/Status/LoadingSkeleton";
import { Unauthenticated } from "~/components/Status/Unauthenticated";
import { Unauthorized } from "~/components/Status/Unauthorized";
import { DATE_FORMAT_HUMAN, PAGE_SIZE, THEME_BLUE } from "~/lib/constants";
import { config } from "~/lib/react-query-config";
import { getSafeUrl, getThemeFromRole } from "~/lib/utils";
import { type NextPageWithLayout } from "~/pages/_app";
import { authOptions } from "~/server/auth";
import Moment from "react-moment";
import { toast } from "react-toastify";

// Helper function to get total count from usageCounts dictionary
const getTotalFromUsageCounts = (
  usageCounts: Record<string, number> | null | undefined,
): number => {
  if (!usageCounts) return 0;
  return Object.values(usageCounts).reduce((sum, count) => sum + count, 0);
};

// ⚠️ SSR
export async function getServerSideProps(context: GetServerSidePropsContext) {
  const { id, query, page, status, valueContains, userId, returnUrl } =
    context.query;
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
  const theme = getThemeFromRole(session);

  // 👇 ensure id is provided
  if (!id) {
    return {
      notFound: true,
      props: { theme: theme },
    };
  }

  try {
    // 👇 prefetch queries on server
    const searchFilter: ReferralLinkSearchFilterAdmin = {
      pageNumber: page ? parseInt(page.toString()) : 1,
      pageSize: PAGE_SIZE,
      programId: id.toString(),
      userId: userId?.toString() ?? null,
      statuses: status ? [status.toString() as ReferralLinkStatus] : null,
      valueContains: valueContains?.toString() ?? null,
    };

    const [linksData, programData] = await Promise.all([
      searchReferralLinksAdmin(searchFilter, context),
      getReferralProgramById(id.toString(), context),
    ]);

    await queryClient.prefetchQuery({
      queryKey: [
        "referralLinks",
        `${id}_${query?.toString()}_${page?.toString()}_${status?.toString()}_${valueContains?.toString()}_${userId?.toString()}`,
      ],
      queryFn: () => linksData,
    });

    await queryClient.prefetchQuery({
      queryKey: ["referralProgram", id.toString()],
      queryFn: () => programData,
    });
  } catch (error) {
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
      id: id.toString(),
      query: query ?? null,
      page: page ?? null,
      status: status ?? null,
      valueContains: valueContains ?? null,
      userId: userId ?? null,
      theme: theme,
      error: errorCode,
      returnUrl: returnUrl ?? null,
    },
  };
}

const ReferralLinks: NextPageWithLayout<{
  id: string;
  query?: string;
  page?: string;
  theme: string;
  error?: number;
  status?: string;
  valueContains?: string;
  userId?: string;
  returnUrl?: string;
}> = ({ id, query, page, status, valueContains, userId, error, returnUrl }) => {
  const router = useRouter();

  // search filter state
  const [searchFilter, setSearchFilter] =
    useState<ReferralLinkSearchFilterAdmin>({
      pageNumber: page ? parseInt(page.toString()) : 1,
      pageSize: PAGE_SIZE,
      programId: id,
      userId: userId ?? null,
      statuses: status ? [status as ReferralLinkStatus] : null,
      valueContains: valueContains ?? null,
    });

  // 👇 use prefetched queries from server
  const { data: program } = useQuery<Program>({
    queryKey: ["referralProgram", id],
    queryFn: () => getReferralProgramById(id),
    enabled: !error,
  });

  const { data: searchResults, isLoading: isLoadingSearchResults } =
    useQuery<ReferralLinkSearchResults>({
      queryKey: [
        "referralLinks",
        `${id}_${query?.toString()}_${page?.toString()}_${status?.toString()}_${valueContains?.toString()}_${userId?.toString()}`,
      ],
      queryFn: () => searchReferralLinksAdmin(searchFilter),
      enabled: !error,
    });

  // Get counts by status
  const { data: totalCountAll } = useQuery<number>({
    queryKey: ["referralLinks", "totalCount", id, null],
    queryFn: () => {
      const filter: ReferralLinkSearchFilterAdmin = {
        pageNumber: 1,
        pageSize: PAGE_SIZE,
        programId: id,
        userId: null,
        statuses: null,
        valueContains: null,
      };
      return searchReferralLinksAdmin(filter).then(
        (data) => data.totalCount ?? 0,
      );
    },
    enabled: !error,
  });

  const { data: totalCountActive } = useQuery<number>({
    queryKey: ["referralLinks", "totalCount", id, ReferralLinkStatus.Active],
    queryFn: () => {
      const filter: ReferralLinkSearchFilterAdmin = {
        pageNumber: 1,
        pageSize: PAGE_SIZE,
        programId: id,
        userId: null,
        statuses: [ReferralLinkStatus.Active],
        valueContains: null,
      };
      return searchReferralLinksAdmin(filter).then(
        (data) => data.totalCount ?? 0,
      );
    },
    enabled: !error,
  });

  const { data: totalCountCancelled } = useQuery<number>({
    queryKey: ["referralLinks", "totalCount", id, ReferralLinkStatus.Cancelled],
    queryFn: () => {
      const filter: ReferralLinkSearchFilterAdmin = {
        pageNumber: 1,
        pageSize: PAGE_SIZE,
        programId: id,
        userId: null,
        statuses: [ReferralLinkStatus.Cancelled],
        valueContains: null,
      };
      return searchReferralLinksAdmin(filter).then(
        (data) => data.totalCount ?? 0,
      );
    },
    enabled: !error,
  });

  const { data: totalCountLimitReached } = useQuery<number>({
    queryKey: [
      "referralLinks",
      "totalCount",
      id,
      ReferralLinkStatus.LimitReached,
    ],
    queryFn: () => {
      const filter: ReferralLinkSearchFilterAdmin = {
        pageNumber: 1,
        pageSize: PAGE_SIZE,
        programId: id,
        userId: null,
        statuses: [ReferralLinkStatus.LimitReached],
        valueContains: null,
      };
      return searchReferralLinksAdmin(filter).then(
        (data) => data.totalCount ?? 0,
      );
    },
    enabled: !error,
  });

  const { data: totalCountExpired } = useQuery<number>({
    queryKey: ["referralLinks", "totalCount", id, ReferralLinkStatus.Expired],
    queryFn: () => {
      const filter: ReferralLinkSearchFilterAdmin = {
        pageNumber: 1,
        pageSize: PAGE_SIZE,
        programId: id,
        userId: null,
        statuses: [ReferralLinkStatus.Expired],
        valueContains: null,
      };
      return searchReferralLinksAdmin(filter).then(
        (data) => data.totalCount ?? 0,
      );
    },
    enabled: !error,
  });

  // 🎈 FUNCTIONS
  const getSearchFilterAsQueryString = useCallback(
    (searchFilter: ReferralLinkSearchFilterAdmin) => {
      if (!searchFilter) return null;

      const params = new URLSearchParams();

      if (
        searchFilter.pageNumber !== null &&
        searchFilter.pageNumber !== undefined &&
        searchFilter.pageNumber !== 1
      )
        params.append("page", searchFilter.pageNumber.toString());

      if (searchFilter.valueContains)
        params.append("valueContains", searchFilter.valueContains);

      if (searchFilter.userId) params.append("userId", searchFilter.userId);

      if (searchFilter.statuses && searchFilter.statuses.length > 0) {
        const status = searchFilter.statuses[0];
        if (status) params.append("status", status);
      }

      if (params.size === 0) return null;
      return params;
    },
    [],
  );

  const redirectWithSearchFilterParams = useCallback(
    (filter: ReferralLinkSearchFilterAdmin) => {
      let url = `/admin/referrals/${id}/links`;
      const params = getSearchFilterAsQueryString(filter);
      if (params != null && params.size > 0)
        url = `${url}?${params.toString()}`;

      if (url != router.asPath)
        void router.push(url, undefined, { scroll: false });
    },
    [router, id, getSearchFilterAsQueryString],
  );

  //#region Event Handlers
  const handlePagerChange = useCallback(
    (value: number) => {
      const newFilter = { ...searchFilter, pageNumber: value };
      setSearchFilter(newFilter);
      redirectWithSearchFilterParams(newFilter);
    },
    [searchFilter, redirectWithSearchFilterParams],
  );

  const handleSubmitFilter = useCallback(
    (val: ReferralLinkSearchFilterAdmin) => {
      const newFilter = {
        ...searchFilter,
        ...val,
        pageNumber: 1, // reset to first page
      };
      setSearchFilter(newFilter);
      redirectWithSearchFilterParams(newFilter);
    },
    [searchFilter, redirectWithSearchFilterParams],
  );

  const handleCopyLink = useCallback((url: string) => {
    navigator.clipboard.writeText(url);
    toast.success("URL copied to clipboard!", { autoClose: 2000 });
  }, []);
  //#endregion Event Handlers

  if (error) {
    if (error === 401) return <Unauthenticated />;
    else if (error === 403) return <Unauthorized />;
    else return <InternalServerError />;
  }

  return (
    <>
      <Head>
        <title>Yoma | 🔗 Referral Links</title>
      </Head>

      <PageBackground className="h-[14.3rem] md:h-[18.4rem]" />

      <div className="z-10 container mt-14 max-w-7xl px-2 py-8 md:mt-[7rem]">
        <div className="flex flex-col gap-4 py-4">
          {/* BREADCRUMB */}
          <nav className="flex text-sm text-white" aria-label="Breadcrumb">
            <ol className="inline-flex items-center space-x-1 overflow-hidden whitespace-nowrap md:space-x-3">
              <li className="inline-flex items-center">
                <Link
                  href={`/admin/referrals${returnUrl ? `?returnUrl=${encodeURIComponent(returnUrl)}` : ""}`}
                  className="hover:text-gray inline-flex items-center"
                >
                  Referral Programs
                </Link>
              </li>
              <li>
                <div className="flex items-center">
                  <span className="mx-2">/</span>
                  <span className="text-gray max-w-[200px] truncate">
                    {program?.name ?? "..."}
                  </span>
                </div>
              </li>
              <li aria-current="page">
                <div className="flex items-center">
                  <span className="mx-2">/</span>
                  <span className="text-gray">Referral Links</span>
                </div>
              </li>
            </ol>
          </nav>

          <h3 className="flex items-center text-xl font-semibold tracking-normal whitespace-nowrap text-white md:text-3xl">
            🔗 Referral Links
          </h3>

          {/* TABBED NAVIGATION */}
          <CustomSlider sliderClassName="!gap-6">
            <Link
              href={`/admin/referrals/${id}/links`}
              role="tab"
              className={`border-b-4 py-2 whitespace-nowrap text-white ${
                !status
                  ? "border-orange"
                  : "hover:border-orange hover:text-gray"
              }`}
            >
              All
              {(totalCountAll ?? 0) > 0 && (
                <div className="badge bg-warning my-auto ml-2 p-1 text-[12px] font-semibold text-white">
                  {totalCountAll}
                </div>
              )}
            </Link>
            <Link
              href={`/admin/referrals/${id}/links?status=${ReferralLinkStatus.Active}`}
              role="tab"
              className={`border-b-4 py-2 whitespace-nowrap text-white ${
                status === ReferralLinkStatus.Active
                  ? "border-orange"
                  : "hover:border-orange hover:text-gray"
              }`}
            >
              Active
              {(totalCountActive ?? 0) > 0 && (
                <div className="badge bg-warning my-auto ml-2 p-1 text-[12px] font-semibold text-white">
                  {totalCountActive}
                </div>
              )}
            </Link>
            <Link
              href={`/admin/referrals/${id}/links?status=${ReferralLinkStatus.Cancelled}`}
              role="tab"
              className={`border-b-4 py-2 whitespace-nowrap text-white ${
                status === ReferralLinkStatus.Cancelled
                  ? "border-orange"
                  : "hover:border-orange hover:text-gray"
              }`}
            >
              Cancelled
              {(totalCountCancelled ?? 0) > 0 && (
                <div className="badge bg-warning my-auto ml-2 p-1 text-[12px] font-semibold text-white">
                  {totalCountCancelled}
                </div>
              )}
            </Link>
            <Link
              href={`/admin/referrals/${id}/links?status=${ReferralLinkStatus.LimitReached}`}
              role="tab"
              className={`border-b-4 py-2 whitespace-nowrap text-white ${
                status === ReferralLinkStatus.LimitReached
                  ? "border-orange"
                  : "hover:border-orange hover:text-gray"
              }`}
            >
              Limit Reached
              {(totalCountLimitReached ?? 0) > 0 && (
                <div className="badge bg-warning my-auto ml-2 p-1 text-[12px] font-semibold text-white">
                  {totalCountLimitReached}
                </div>
              )}
            </Link>
            <Link
              href={`/admin/referrals/${id}/links?status=${ReferralLinkStatus.Expired}`}
              role="tab"
              className={`border-b-4 py-2 whitespace-nowrap text-white ${
                status === ReferralLinkStatus.Expired
                  ? "border-orange"
                  : "hover:border-orange hover:text-gray"
              }`}
            >
              Expired
              {(totalCountExpired ?? 0) > 0 && (
                <div className="badge bg-warning my-auto ml-2 p-1 text-[12px] font-semibold text-white">
                  {totalCountExpired}
                </div>
              )}
            </Link>
          </CustomSlider>

          {/* FILTERS */}
          <ReferralLinkSearchFilters
            searchFilter={searchFilter}
            filterOptions={[ReferralLinkFilterOptions.VALUECONTAINS]}
            onSubmit={handleSubmitFilter}
          />
        </div>

        {/* MAIN CONTENT */}
        {isLoadingSearchResults && (
          <div className="flex h-fit flex-col items-center rounded-lg bg-white p-8 md:pb-16">
            <LoadingSkeleton />
          </div>
        )}

        {!isLoadingSearchResults && (
          <div className="md:shadow-custom rounded-lg md:bg-white md:p-4">
            {/* NO ROWS */}
            {searchResults && searchResults.items?.length === 0 && (
              <div className="flex h-fit flex-col items-center rounded-lg bg-white pb-8 md:pb-16">
                <NoRowsMessage
                  title={"No referral links found"}
                  description={
                    status
                      ? "No links with this status."
                      : "No referral links have been created for this program yet."
                  }
                />
              </div>
            )}

            {/* RESULTS */}
            {searchResults && searchResults.items?.length > 0 && (
              <>
                {/* MOBILE */}
                <div className="flex flex-col gap-4 md:hidden">
                  {searchResults.items.map((link) => (
                    <div
                      key={`sm_${link.id}`}
                      className="shadow-custom flex flex-col justify-between gap-4 rounded-lg bg-white p-4"
                    >
                      <div className="border-gray-light flex flex-row items-center gap-2 border-b-2 pb-2">
                        <div className="flex-grow">
                          <p className="line-clamp-1 text-start font-semibold">
                            {link.name}
                          </p>
                        </div>
                        <ReferralLinkActions
                          link={link}
                          returnUrl={getSafeUrl(
                            returnUrl?.toString(),
                            router.asPath,
                          )}
                        />
                      </div>

                      <div className="text-gray-dark flex flex-col gap-2">
                        {/* Status */}
                        <div className="flex justify-between">
                          <p className="text-sm tracking-wider">Status</p>
                          <span
                            className={`badge ${
                              link.status === ReferralLinkStatus.Active
                                ? "bg-green-light text-green"
                                : link.status === ReferralLinkStatus.Cancelled
                                  ? "bg-gray-light text-gray-dark"
                                  : link.status ===
                                      ReferralLinkStatus.LimitReached
                                    ? "bg-yellow-tint text-yellow"
                                    : "bg-orange-light text-orange"
                            }`}
                          >
                            {link.status}
                          </span>
                        </div>

                        {/* URL */}
                        <div className="flex flex-row justify-between gap-1">
                          <p className="text-sm tracking-wider">URL</p>
                          <div className="flex items-center gap-2">
                            <a
                              href={link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue max-w-60 truncate text-sm underline"
                            >
                              {link.url}
                            </a>
                            <button
                              onClick={() => handleCopyLink(link.url)}
                              className="btn btn-xs"
                            >
                              <IoMdCopy className="h-4 w-4" />
                            </button>
                          </div>
                        </div>

                        {/* Referrer */}
                        <div className="flex flex-row justify-between gap-1">
                          <p className="text-sm tracking-wider">Referrer</p>
                          <div className="text-end text-sm">
                            <div className="font-semibold">
                              {link.userDisplayName}
                            </div>
                            {link.userEmail && (
                              <div className="text-gray-dark text-xs">
                                {link.userEmail}
                              </div>
                            )}
                            {link.userPhoneNumber && (
                              <div className="text-gray-dark text-xs">
                                {link.userPhoneNumber}
                              </div>
                            )}
                            {link.blocked && (
                              <div className="text-error mt-1 flex items-center gap-1 text-xs font-semibold">
                                <span>⚠️</span>
                                <span>
                                  Blocked on{" "}
                                  {link.blockedDate ? (
                                    <span className="text-gray-dark text-xs whitespace-nowrap">
                                      <Moment
                                        format={DATE_FORMAT_HUMAN}
                                        utc={true}
                                      >
                                        {link.blockedDate}
                                      </Moment>
                                    </span>
                                  ) : (
                                    "N/A"
                                  )}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Statistics */}
                        <div className="flex justify-between">
                          <p className="text-sm tracking-wider">Pending</p>
                          <span className="text-sm font-semibold">
                            {getTotalFromUsageCounts(link.usageCounts)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <p className="text-sm tracking-wider">Completed</p>
                          <span className="text-sm font-semibold">
                            {getTotalFromUsageCounts(link.usageCounts)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <p className="text-sm tracking-wider">Expired</p>
                          <span className="text-sm font-semibold">
                            {link.expiredTotal ?? 0}
                          </span>
                        </div>

                        {/* Created Date */}
                        {/* <div className="flex justify-between">
                          <p className="text-sm tracking-wider">Created</p>
                          <span className="text-sm">
                            <Moment format="DD MMM YYYY" utc={true}>
                              {link.dateCreated}
                            </Moment>
                          </span>
                        </div> */}
                      </div>
                    </div>
                  ))}
                </div>

                {/* DESKTOP */}
                <table className="border-gray-light hidden w-full border-separate rounded-lg border-x-2 border-t-2 md:table">
                  <thead>
                    <tr className="border-gray text-gray-dark">
                      <th className="border-gray-light border-b-2 !py-4">
                        Name
                      </th>
                      <th className="border-gray-light border-b-2">Referrer</th>
                      <th className="border-gray-light border-b-2">Status</th>
                      <th className="border-gray-light border-b-2">URL</th>
                      <th className="border-gray-light border-b-2">
                        Statistics
                      </th>
                      {/* <th className="border-gray-light border-b-2">Created</th> */}
                      <th className="border-gray-light border-b-2 text-center">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {searchResults.items.map((link) => (
                      <tr key={`md_${link.id}`}>
                        <td className="border-gray-light border-b-2 !align-top">
                          <p className="font-semibold">{link.name}</p>
                        </td>
                        <td className="border-gray-light border-b-2 !align-top">
                          <div className="flex flex-col gap-1 text-xs">
                            <div className="font-semibold">
                              {link.userDisplayName}
                            </div>
                            {link.userEmail && (
                              <div className="text-gray-dark">
                                {link.userEmail}
                              </div>
                            )}
                            {link.userPhoneNumber && (
                              <div className="text-gray-dark">
                                {link.userPhoneNumber}
                              </div>
                            )}
                            {link.blocked && (
                              <div className="text-red mt-1 flex items-center gap-1 font-semibold">
                                <span>⚠️</span>
                                <span>
                                  Blocked on{" "}
                                  {link.blockedDate ? (
                                    <span className="text-xs whitespace-nowrap text-black">
                                      <Moment
                                        format={DATE_FORMAT_HUMAN}
                                        utc={true}
                                      >
                                        {link.blockedDate}
                                      </Moment>
                                    </span>
                                  ) : (
                                    "N/A"
                                  )}
                                </span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="border-gray-light border-b-2 !align-top">
                          <span
                            className={`badge ${
                              link.status === "Active"
                                ? "bg-green-light text-green"
                                : link.status === "Cancelled"
                                  ? "bg-gray-light text-gray-dark"
                                  : link.status === "LimitReached"
                                    ? "bg-yellow-tint text-yellow"
                                    : "bg-orange-light text-orange"
                            }`}
                          >
                            {link.status}
                          </span>
                        </td>
                        <td className="border-gray-light border-b-2 !align-top">
                          <div className="flex items-center gap-2">
                            <a
                              href={link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue max-w-60 truncate text-sm underline"
                            >
                              {link.url}
                            </a>
                            <button
                              onClick={() => handleCopyLink(link.url)}
                              className="btn btn-xs"
                              title="Copy link"
                            >
                              <IoMdCopy className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                        <td className="border-gray-light text-gray-dark border-b-2 !align-top">
                          <div className="flex flex-col gap-1 text-xs">
                            <div className="flex gap-2">
                              <span className="text-gray-dark w-20 font-bold">
                                Pending:
                              </span>
                              <span>
                                {getTotalFromUsageCounts(link.usageCounts)}
                              </span>
                            </div>
                            <div className="flex gap-2">
                              <span className="text-gray-dark w-20 font-bold">
                                Completed:
                              </span>
                              <span className="font-semibold">
                                {getTotalFromUsageCounts(link.usageCounts)}
                              </span>
                            </div>
                            <div className="flex gap-2">
                              <span className="text-gray-dark w-20 font-bold">
                                Expired:
                              </span>
                              <span>{link.expiredTotal ?? 0}</span>
                            </div>
                          </div>
                        </td>
                        {/*  <td className="border-gray-light border-b-2 !align-top">
                          <span className="text-sm">
                            <Moment format="DD MMM YYYY" utc={true}>
                              {link.dateCreated}
                            </Moment>
                          </span>
                        </td>*/}
                        <td className="border-gray-light border-b-2 text-center !align-top">
                          <ReferralLinkActions
                            link={link}
                            returnUrl={getSafeUrl(
                              returnUrl?.toString(),
                              router.asPath,
                            )}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* PAGINATION */}
                <div className="mt-4 flex justify-center">
                  <PaginationButtons
                    currentPage={searchFilter.pageNumber ?? 1}
                    totalItems={searchResults?.totalCount ?? 0}
                    pageSize={PAGE_SIZE}
                    onClick={handlePagerChange}
                  />
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </>
  );
};

ReferralLinks.getLayout = function getLayout(page: ReactElement) {
  return <MainLayout>{page}</MainLayout>;
};

ReferralLinks.theme = function getTheme() {
  return THEME_BLUE;
};

export default ReferralLinks;
