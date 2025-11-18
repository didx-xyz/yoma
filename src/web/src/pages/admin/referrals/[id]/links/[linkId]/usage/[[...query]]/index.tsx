import { QueryClient, dehydrate, useQuery } from "@tanstack/react-query";
import axios from "axios";
import { type GetServerSidePropsContext } from "next";
import { getServerSession } from "next-auth";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useCallback, useState, type ReactElement } from "react";
import { IoIosCheckmarkCircle, IoMdClose } from "react-icons/io";
import Moment from "react-moment";
import {
  ReferralLinkUsageStatus,
  type Program,
  type ReferralLink,
  type ReferralLinkUsageSearchFilterAdmin,
  type ReferralLinkUsageSearchResults,
} from "~/api/models/referrals";
import {
  getReferralLinkById,
  getReferralProgramById,
  searchReferralLinkUsagesAdmin,
} from "~/api/services/referrals";
import CustomSlider from "~/components/Carousel/CustomSlider";
import MainLayout from "~/components/Layout/Main";
import NoRowsMessage from "~/components/NoRowsMessage";
import { PageBackground } from "~/components/PageBackground";
import { PaginationButtons } from "~/components/PaginationButtons";
import { AdminReferralLinkUsageActions } from "~/components/Referrals/AdminReferralLinkUsageActions";
import {
  ReferralLinkUsageFilterOptions,
  ReferralLinkUsageSearchFilters,
} from "~/components/Referrals/AdminReferralLinkUsageSearchFilter";
import { InternalServerError } from "~/components/Status/InternalServerError";
import { LoadingSkeleton } from "~/components/Status/LoadingSkeleton";
import { Unauthenticated } from "~/components/Status/Unauthenticated";
import { Unauthorized } from "~/components/Status/Unauthorized";
import { PAGE_SIZE, THEME_BLUE } from "~/lib/constants";
import { config } from "~/lib/react-query-config";
import { getSafeUrl, getThemeFromRole } from "~/lib/utils";
import { type NextPageWithLayout } from "~/pages/_app";
import { authOptions } from "~/server/auth";

// ⚠️ SSR
export async function getServerSideProps(context: GetServerSidePropsContext) {
  const {
    id,
    linkId,
    query,
    page,
    status,
    userIdReferee,
    userIdReferrer,
    dateStart,
    dateEnd,
    returnUrl,
  } = context.query;
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

  // 👇 ensure id and linkId are provided
  if (!id || !linkId) {
    return {
      notFound: true,
      props: { theme: theme },
    };
  }

  try {
    // 👇 prefetch queries on server
    const searchFilter: ReferralLinkUsageSearchFilterAdmin = {
      pageNumber: page ? parseInt(page.toString()) : 1,
      pageSize: PAGE_SIZE,
      linkId: linkId.toString(),
      programId: id.toString(),
      statuses: status ? [status.toString() as ReferralLinkUsageStatus] : null,
      userIdReferee: userIdReferee?.toString() ?? null,
      userIdReferrer: userIdReferrer?.toString() ?? null,
      dateStart: dateStart?.toString() ?? null,
      dateEnd: dateEnd?.toString() ?? null,
    };

    const [usagesData, programData, linkData] = await Promise.all([
      searchReferralLinkUsagesAdmin(searchFilter, context),
      getReferralProgramById(id.toString(), context),
      getReferralLinkById(linkId.toString(), false, context),
    ]);

    await queryClient.prefetchQuery({
      queryKey: [
        "referralLinkUsages",
        `${linkId}_${query?.toString()}_${page?.toString()}_${status?.toString()}_${userIdReferee?.toString()}_${userIdReferrer?.toString()}_${dateStart?.toString()}_${dateEnd?.toString()}`,
      ],
      queryFn: () => usagesData,
    });

    await queryClient.prefetchQuery({
      queryKey: ["referralProgram", id.toString()],
      queryFn: () => programData,
    });

    await queryClient.prefetchQuery({
      queryKey: ["referralLink", linkId.toString()],
      queryFn: () => linkData,
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
      linkId: linkId.toString(),
      query: query ?? null,
      page: page ?? null,
      status: status ?? null,
      userIdReferee: userIdReferee ?? null,
      userIdReferrer: userIdReferrer ?? null,
      dateStart: dateStart ?? null,
      dateEnd: dateEnd ?? null,
      theme: theme,
      error: errorCode,
      returnUrl: returnUrl ?? null,
    },
  };
}

const ReferralLinkUsage: NextPageWithLayout<{
  id: string;
  linkId: string;
  query?: string;
  page?: string;
  theme: string;
  error?: number;
  status?: string;
  userIdReferee?: string;
  userIdReferrer?: string;
  dateStart?: string;
  dateEnd?: string;
  returnUrl?: string;
}> = ({
  id,
  linkId,
  query,
  page,
  status,
  userIdReferee,
  userIdReferrer,
  dateStart,
  dateEnd,
  error,
  returnUrl,
}) => {
  const router = useRouter();

  // search filter state
  const [searchFilter, setSearchFilter] =
    useState<ReferralLinkUsageSearchFilterAdmin>({
      pageNumber: page ? parseInt(page.toString()) : 1,
      pageSize: PAGE_SIZE,
      linkId: linkId,
      programId: id,
      statuses: status ? [status as ReferralLinkUsageStatus] : null,
      userIdReferee: userIdReferee ?? null,
      userIdReferrer: userIdReferrer ?? null,
      dateStart: dateStart ?? null,
      dateEnd: dateEnd ?? null,
    });

  // 👇 use prefetched queries from server
  const { data: program } = useQuery<Program>({
    queryKey: ["referralProgram", id],
    queryFn: () => getReferralProgramById(id),
    enabled: !error,
  });

  const { data: link } = useQuery<ReferralLink>({
    queryKey: ["referralLink", linkId],
    queryFn: () => getReferralLinkById(linkId),
    enabled: !error,
  });

  const { data: searchResults, isLoading: isLoadingSearchResults } =
    useQuery<ReferralLinkUsageSearchResults>({
      queryKey: [
        "referralLinkUsages",
        `${linkId}_${query?.toString()}_${page?.toString()}_${status?.toString()}_${userIdReferee?.toString()}_${userIdReferrer?.toString()}_${dateStart?.toString()}_${dateEnd?.toString()}`,
      ],
      queryFn: () => searchReferralLinkUsagesAdmin(searchFilter),
      enabled: !error,
    });

  // Get counts by status (preserving linkId context)
  const { data: totalCountAll } = useQuery<number>({
    queryKey: ["referralLinkUsages", "totalCount", linkId, null],
    queryFn: () => {
      const filter: ReferralLinkUsageSearchFilterAdmin = {
        pageNumber: 1,
        pageSize: PAGE_SIZE,
        linkId: linkId,
        programId: id,
        statuses: null,
        userIdReferee: null,
        userIdReferrer: null,
        dateStart: null,
        dateEnd: null,
      };
      return searchReferralLinkUsagesAdmin(filter).then(
        (data) => data.totalCount ?? 0,
      );
    },
    enabled: !error,
  });

  const { data: totalCountPending } = useQuery<number>({
    queryKey: [
      "referralLinkUsages",
      "totalCount",
      linkId,
      ReferralLinkUsageStatus.Pending,
    ],
    queryFn: () => {
      const filter: ReferralLinkUsageSearchFilterAdmin = {
        pageNumber: 1,
        pageSize: PAGE_SIZE,
        linkId: linkId,
        programId: id,
        statuses: [ReferralLinkUsageStatus.Pending],
        userIdReferee: null,
        userIdReferrer: null,
        dateStart: null,
        dateEnd: null,
      };
      return searchReferralLinkUsagesAdmin(filter).then(
        (data) => data.totalCount ?? 0,
      );
    },
    enabled: !error,
  });

  const { data: totalCountCompleted } = useQuery<number>({
    queryKey: [
      "referralLinkUsages",
      "totalCount",
      linkId,
      ReferralLinkUsageStatus.Completed,
    ],
    queryFn: () => {
      const filter: ReferralLinkUsageSearchFilterAdmin = {
        pageNumber: 1,
        pageSize: PAGE_SIZE,
        linkId: linkId,
        programId: id,
        statuses: [ReferralLinkUsageStatus.Completed],
        userIdReferee: null,
        userIdReferrer: null,
        dateStart: null,
        dateEnd: null,
      };
      return searchReferralLinkUsagesAdmin(filter).then(
        (data) => data.totalCount ?? 0,
      );
    },
    enabled: !error,
  });

  const { data: totalCountExpired } = useQuery<number>({
    queryKey: [
      "referralLinkUsages",
      "totalCount",
      linkId,
      ReferralLinkUsageStatus.Expired,
    ],
    queryFn: () => {
      const filter: ReferralLinkUsageSearchFilterAdmin = {
        pageNumber: 1,
        pageSize: PAGE_SIZE,
        linkId: linkId,
        programId: id,
        statuses: [ReferralLinkUsageStatus.Expired],
        userIdReferee: null,
        userIdReferrer: null,
        dateStart: null,
        dateEnd: null,
      };
      return searchReferralLinkUsagesAdmin(filter).then(
        (data) => data.totalCount ?? 0,
      );
    },
    enabled: !error,
  });

  // 🎈 FUNCTIONS
  const getSearchFilterAsQueryString = useCallback(
    (searchFilter: ReferralLinkUsageSearchFilterAdmin) => {
      if (!searchFilter) return null;

      const params = new URLSearchParams();

      if (
        searchFilter.pageNumber !== null &&
        searchFilter.pageNumber !== undefined &&
        searchFilter.pageNumber !== 1
      )
        params.append("page", searchFilter.pageNumber.toString());

      if (searchFilter.userIdReferee)
        params.append("userIdReferee", searchFilter.userIdReferee);

      if (searchFilter.userIdReferrer)
        params.append("userIdReferrer", searchFilter.userIdReferrer);

      if (searchFilter.dateStart)
        params.append("dateStart", searchFilter.dateStart);

      if (searchFilter.dateEnd) params.append("dateEnd", searchFilter.dateEnd);

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
    (filter: ReferralLinkUsageSearchFilterAdmin) => {
      let url = `/admin/referrals/${id}/links/${linkId}/usage`;
      const params = getSearchFilterAsQueryString(filter);
      if (params != null && params.size > 0)
        url = `${url}?${params.toString()}`;

      if (url != router.asPath)
        void router.push(url, undefined, { scroll: false });
    },
    [router, id, linkId, getSearchFilterAsQueryString],
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
    (val: ReferralLinkUsageSearchFilterAdmin) => {
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
  //#endregion Event Handlers

  if (error) {
    if (error === 401) return <Unauthenticated />;
    else if (error === 403) return <Unauthorized />;
    else return <InternalServerError />;
  }

  return (
    <>
      <Head>
        <title>Yoma | 🔗 Referral Link Usage</title>
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
              <li>
                <div className="flex items-center">
                  <span className="mx-2">/</span>
                  <Link
                    href={`/admin/referrals/${id}/links${returnUrl ? `?returnUrl=${encodeURIComponent(returnUrl)}` : ""}`}
                    className="hover:text-gray"
                  >
                    Referral Links
                  </Link>
                </div>
              </li>
              <li>
                <div className="flex items-center">
                  <span className="mx-2">/</span>
                  <span className="text-gray max-w-[200px] truncate">
                    {link?.name ?? "..."}
                  </span>
                </div>
              </li>
              <li aria-current="page">
                <div className="flex items-center">
                  <span className="mx-2">/</span>
                  <span className="text-gray">Usage</span>
                </div>
              </li>
            </ol>
          </nav>

          <h3 className="flex items-center text-xl font-semibold tracking-normal whitespace-nowrap text-white md:text-3xl">
            🔗 Referral Link Usage
          </h3>

          {/* TABBED NAVIGATION */}
          <CustomSlider sliderClassName="!gap-6">
            <Link
              href={`/admin/referrals/${id}/links/${linkId}/usage`}
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
              href={`/admin/referrals/${id}/links/${linkId}/usage?status=${ReferralLinkUsageStatus.Pending}`}
              role="tab"
              className={`border-b-4 py-2 whitespace-nowrap text-white ${
                status === ReferralLinkUsageStatus.Pending
                  ? "border-orange"
                  : "hover:border-orange hover:text-gray"
              }`}
            >
              Pending
              {(totalCountPending ?? 0) > 0 && (
                <div className="badge bg-warning my-auto ml-2 p-1 text-[12px] font-semibold text-white">
                  {totalCountPending}
                </div>
              )}
            </Link>
            <Link
              href={`/admin/referrals/${id}/links/${linkId}/usage?status=${ReferralLinkUsageStatus.Completed}`}
              role="tab"
              className={`border-b-4 py-2 whitespace-nowrap text-white ${
                status === ReferralLinkUsageStatus.Completed
                  ? "border-orange"
                  : "hover:border-orange hover:text-gray"
              }`}
            >
              Completed
              {(totalCountCompleted ?? 0) > 0 && (
                <div className="badge bg-warning my-auto ml-2 p-1 text-[12px] font-semibold text-white">
                  {totalCountCompleted}
                </div>
              )}
            </Link>
            <Link
              href={`/admin/referrals/${id}/links/${linkId}/usage?status=${ReferralLinkUsageStatus.Expired}`}
              role="tab"
              className={`border-b-4 py-2 whitespace-nowrap text-white ${
                status === ReferralLinkUsageStatus.Expired
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
          <ReferralLinkUsageSearchFilters
            searchFilter={searchFilter}
            filterOptions={[ReferralLinkUsageFilterOptions.DATERANGE]}
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
                  title={"No link usage found"}
                  description={
                    status
                      ? "No usage with this status."
                      : "This referral link hasn't been used yet."
                  }
                />
              </div>
            )}

            {/* RESULTS */}
            {searchResults && searchResults.items?.length > 0 && (
              <>
                {/* MOBILE */}
                <div className="flex flex-col gap-4 md:hidden">
                  {searchResults.items.map((usage) => (
                    <div
                      key={`sm_${usage.id}`}
                      className="shadow-custom flex flex-col justify-between gap-4 rounded-lg bg-white p-4"
                    >
                      <div className="border-gray-light flex flex-row items-center gap-2 border-b-2 pb-2">
                        <div className="flex-grow">
                          <Link
                            href={`/admin/referrals/${usage.programId}/links/${usage.linkId}/usage/${usage.id}/info${
                              returnUrl
                                ? `?returnUrl=${encodeURIComponent(getSafeUrl(returnUrl?.toString(), router.asPath))}`
                                : ""
                            }`}
                            className="line-clamp-1 text-start font-semibold text-blue-600 hover:underline"
                          >
                            {usage.userDisplayName}
                          </Link>
                          {usage.userEmail && (
                            <p className="text-gray-dark text-sm">
                              {usage.userEmail}
                            </p>
                          )}
                        </div>
                        <AdminReferralLinkUsageActions
                          usage={usage}
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
                              usage.status === ReferralLinkUsageStatus.Completed
                                ? "bg-green-light text-green"
                                : usage.status ===
                                    ReferralLinkUsageStatus.Expired
                                  ? "bg-orange-light text-orange"
                                  : "bg-yellow-tint text-yellow"
                            }`}
                          >
                            {usage.status}
                          </span>
                        </div>

                        {/* Progress */}
                        {usage.percentComplete !== null && (
                          <div className="flex justify-between">
                            <p className="text-sm tracking-wider">Progress</p>
                            <span className="badge bg-blue-light text-blue">
                              {usage.percentComplete}%
                            </span>
                          </div>
                        )}

                        {/* Proof of Personhood */}
                        <div className="flex justify-between">
                          <p className="text-sm tracking-wider">
                            Proof of Personhood
                          </p>
                          {usage.proofOfPersonhoodCompleted ? (
                            <IoIosCheckmarkCircle className="text-green h-5 w-5" />
                          ) : (
                            <IoMdClose className="text-gray-dark h-5 w-5" />
                          )}
                        </div>

                        {/* Pathways */}
                        <div className="flex justify-between">
                          <p className="text-sm tracking-wider">
                            Pathways Completed
                          </p>
                          {usage.pathwayCompleted ? (
                            <IoIosCheckmarkCircle className="text-green h-5 w-5" />
                          ) : (
                            <IoMdClose className="text-gray-dark h-5 w-5" />
                          )}
                        </div>

                        {/* Dates */}
                        <div className="flex justify-between">
                          <p className="text-sm tracking-wider">Claimed</p>
                          <span className="text-sm">
                            <Moment format="DD MMM YYYY" utc={true}>
                              {usage.dateClaimed}
                            </Moment>
                          </span>
                        </div>

                        {usage.dateCompleted && (
                          <div className="flex justify-between">
                            <p className="text-sm tracking-wider">Completed</p>
                            <span className="text-sm">
                              <Moment format="DD MMM YYYY" utc={true}>
                                {usage.dateCompleted}
                              </Moment>
                            </span>
                          </div>
                        )}

                        {usage.dateExpired && (
                          <div className="flex justify-between">
                            <p className="text-sm tracking-wider">Expired</p>
                            <span className="text-sm">
                              <Moment format="DD MMM YYYY" utc={true}>
                                {usage.dateExpired}
                              </Moment>
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* DESKTOP */}
                <table className="border-gray-light hidden w-full border-separate rounded-lg border-x-2 border-t-2 md:table">
                  <thead>
                    <tr className="border-gray text-gray-dark">
                      <th className="border-gray-light border-b-2 !py-4">
                        User
                      </th>
                      <th className="border-gray-light border-b-2">Status</th>
                      <th className="border-gray-light border-b-2">Progress</th>
                      <th className="border-gray-light border-b-2">
                        Verification
                      </th>
                      <th className="border-gray-light border-b-2">Dates</th>
                      <th className="border-gray-light border-b-2 text-center">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {searchResults.items.map((usage) => (
                      <tr key={`md_${usage.id}`}>
                        <td className="border-gray-light border-b-2 !align-top">
                          <div className="flex flex-col">
                            <Link
                              href={`/admin/referrals/${usage.programId}/links/${usage.linkId}/usage/${usage.id}/info${
                                returnUrl
                                  ? `?returnUrl=${encodeURIComponent(getSafeUrl(returnUrl?.toString(), router.asPath))}`
                                  : ""
                              }`}
                              className="font-semibold text-blue-600 hover:underline"
                            >
                              {usage.userDisplayName}
                            </Link>
                            {usage.userEmail && (
                              <p className="text-gray-dark text-sm">
                                {usage.userEmail}
                              </p>
                            )}
                            {usage.userPhoneNumber && (
                              <p className="text-gray-dark text-sm">
                                {usage.userPhoneNumber}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="border-gray-light border-b-2 !align-top">
                          <span
                            className={`badge ${
                              usage.status === ReferralLinkUsageStatus.Completed
                                ? "bg-green-light text-green"
                                : usage.status ===
                                    ReferralLinkUsageStatus.Expired
                                  ? "bg-orange-light text-orange"
                                  : "bg-yellow-tint text-yellow"
                            }`}
                          >
                            {usage.status}
                          </span>
                        </td>
                        <td className="border-gray-light border-b-2 !align-top">
                          {usage.percentComplete !== null ? (
                            <div className="flex flex-col gap-1">
                              <span className="badge bg-blue-light text-blue">
                                {usage.percentComplete}%
                              </span>
                              {usage.pathway && (
                                <p className="text-gray-dark text-xs">
                                  {usage.pathway.stepsCompleted} /{" "}
                                  {usage.pathway.stepsTotal} steps
                                </p>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-dark text-sm">-</span>
                          )}
                        </td>
                        <td className="border-gray-light border-b-2 !align-top">
                          <div className="flex flex-col gap-1 text-xs">
                            <div className="flex items-center gap-1">
                              {usage.proofOfPersonhoodCompleted ? (
                                <IoIosCheckmarkCircle className="text-green h-4 w-4" />
                              ) : (
                                <IoMdClose className="text-gray-dark h-4 w-4" />
                              )}
                              <span className="text-gray-dark font-semibold">
                                Proof of Personhood
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              {usage.pathwayCompleted ? (
                                <IoIosCheckmarkCircle className="text-green h-4 w-4" />
                              ) : (
                                <IoMdClose className="text-gray-dark h-4 w-4" />
                              )}
                              <span className="text-gray-dark font-semibold">
                                Pathways
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="border-gray-light border-b-2 !align-top">
                          <div className="flex flex-col gap-1 text-xs">
                            <div className="flex gap-2">
                              <span className="text-gray-dark w-20 font-bold">
                                Claimed:
                              </span>
                              <span>
                                <Moment format="DD MMM YYYY" utc={true}>
                                  {usage.dateClaimed}
                                </Moment>
                              </span>
                            </div>
                            {usage.dateCompleted && (
                              <div className="flex gap-2">
                                <span className="text-gray-dark w-20 font-bold">
                                  Completed:
                                </span>
                                <span className="font-semibold">
                                  <Moment format="DD MMM YYYY" utc={true}>
                                    {usage.dateCompleted}
                                  </Moment>
                                </span>
                              </div>
                            )}
                            {usage.dateExpired && (
                              <div className="flex gap-2">
                                <span className="text-gray-dark w-20 font-bold">
                                  Expired:
                                </span>
                                <span>
                                  <Moment format="DD MMM YYYY" utc={true}>
                                    {usage.dateExpired}
                                  </Moment>
                                </span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="border-gray-light border-b-2 text-center !align-top">
                          <AdminReferralLinkUsageActions
                            usage={usage}
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

ReferralLinkUsage.getLayout = function getLayout(page: ReactElement) {
  return <MainLayout>{page}</MainLayout>;
};

ReferralLinkUsage.theme = function getTheme() {
  return THEME_BLUE;
};

export default ReferralLinkUsage;
