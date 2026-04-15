import axios from "axios";
import { type GetServerSidePropsContext } from "next";
import { getServerSession } from "next-auth";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useCallback, useMemo, type ReactElement } from "react";
import {
  IoIosCheckmarkCircle,
  IoMdArrowRoundBack,
  IoMdClose,
} from "react-icons/io";
import { IoChevronForward } from "react-icons/io5";
import Moment from "react-moment";
import {
  ReferralLinkUsageStatus,
  type ReferralLinkUsageSearchFilterAdmin,
} from "~/api/models/referrals";
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
import {
  useReferralAdminLinkByIdQuery,
  useReferralLinkUsageCountQuery,
  useReferralLinkUsagesAdminQuery,
  useReferralProgramByIdQuery,
} from "~/hooks/useReferralProgramMutations";
import { DATE_FORMAT_HUMAN, PAGE_SIZE, THEME_BLUE } from "~/lib/constants";
import { getSafeUrl } from "~/lib/utils";
import { type NextPageWithLayout } from "~/pages/_app";
import { authOptions } from "~/server/auth";

const getErrorStatus = (error: unknown): number | null => {
  if (!axios.isAxiosError(error)) return null;
  return error.response?.status ?? null;
};

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const { id, linkId } = context.params as { id: string; linkId: string };
  const {
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

  if (!session) {
    return {
      props: {
        error: 401,
      },
    };
  }

  return {
    props: {
      id: id ?? null,
      linkId: linkId ?? null,
      query: query ?? null,
      page: page ?? null,
      status: status ?? null,
      userIdReferee: userIdReferee ?? null,
      userIdReferrer: userIdReferrer ?? null,
      dateStart: dateStart ?? null,
      dateEnd: dateEnd ?? null,
      returnUrl: returnUrl ?? null,
      error: null,
    },
  };
}

const ReferralLinkUsage: NextPageWithLayout<{
  id: string;
  linkId: string;
  query?: string;
  page?: string;
  status?: string;
  userIdReferee?: string;
  userIdReferrer?: string;
  dateStart?: string;
  dateEnd?: string;
  returnUrl?: string;
  error?: number | null;
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
  returnUrl,
  error,
}) => {
  const router = useRouter();
  const searchFilter = useMemo<ReferralLinkUsageSearchFilterAdmin>(
    () => ({
      pageNumber: page ? parseInt(page.toString()) : 1,
      pageSize: PAGE_SIZE,
      linkId,
      programId: id,
      statuses: status ? [status as ReferralLinkUsageStatus] : null,
      userIdReferee: userIdReferee ?? null,
      userIdReferrer: userIdReferrer ?? null,
      dateStart: dateStart ?? null,
      dateEnd: dateEnd ?? null,
    }),
    [
      dateEnd,
      dateStart,
      id,
      linkId,
      page,
      status,
      userIdReferee,
      userIdReferrer,
    ],
  );

  const { data: program, error: programError } = useReferralProgramByIdQuery(
    id,
    {
      enabled: !error && !!id && !!linkId,
    },
  );

  const { data: link, error: linkError } = useReferralAdminLinkByIdQuery(
    linkId,
    {
      enabled: !error && !!id && !!linkId,
    },
  );

  const searchResultsKey = `${linkId}_${query?.toString()}_${page?.toString()}_${status?.toString()}_${userIdReferee?.toString()}_${userIdReferrer?.toString()}_${dateStart?.toString()}_${dateEnd?.toString()}`;

  const {
    data: searchResults,
    isLoading: isLoadingSearchResults,
    error: searchResultsError,
  } = useReferralLinkUsagesAdminQuery(searchFilter, searchResultsKey, {
    enabled: !error && !!id && !!linkId,
  });

  // Get counts by status (preserving linkId context)
  const { data: totalCountAll } = useReferralLinkUsageCountQuery(
    linkId,
    id,
    null,
    {
      enabled: !error && !!id && !!linkId,
    },
  );
  const { data: totalCountPending } = useReferralLinkUsageCountQuery(
    linkId,
    id,
    ReferralLinkUsageStatus.Pending,
    {
      enabled: !error && !!id && !!linkId,
    },
  );
  const { data: totalCountCompleted } = useReferralLinkUsageCountQuery(
    linkId,
    id,
    ReferralLinkUsageStatus.Completed,
    {
      enabled: !error && !!id && !!linkId,
    },
  );
  const { data: totalCountExpired } = useReferralLinkUsageCountQuery(
    linkId,
    id,
    ReferralLinkUsageStatus.Expired,
    {
      enabled: !error && !!id && !!linkId,
    },
  );

  const resolvedError =
    error ??
    getErrorStatus(searchResultsError) ??
    getErrorStatus(programError) ??
    getErrorStatus(linkError) ??
    undefined;

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

      if (returnUrl) {
        const separator = url.includes("?") ? "&" : "?";
        url = `${url}${separator}returnUrl=${encodeURIComponent(returnUrl.toString())}`;
      }

      if (url != router.asPath)
        void router.push(url, undefined, { scroll: false });
    },
    [router, id, linkId, getSearchFilterAsQueryString, returnUrl],
  );

  //#region Event Handlers
  const handlePagerChange = useCallback(
    (value: number) => {
      const newFilter = { ...searchFilter, pageNumber: value };
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
      redirectWithSearchFilterParams(newFilter);
    },
    [searchFilter, redirectWithSearchFilterParams],
  );
  //#endregion Event Handlers

  if (resolvedError) {
    if (resolvedError === 401) return <Unauthenticated />;
    else if (resolvedError === 403) return <Unauthorized />;
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
          <div className="flex flex-row items-center gap-2 text-xs text-white">
            <Link
              className="hover:text-gray flex max-w-[200px] min-w-0 items-center font-bold"
              href={getSafeUrl(
                returnUrl?.toString(),
                `/admin/referrals/${program?.id}/links`,
              )}
            >
              <IoMdArrowRoundBack className="mr-2 inline-block h-4 w-4 shrink-0" />
              <span className="truncate">Referral Links</span>
            </Link>

            <IoChevronForward className="h-4 w-4 shrink-0" />
            <span className="max-w-[200px] min-w-0 truncate">
              Usage ({link?.name})
            </span>
          </div>

          <h3 className="flex items-center text-xl font-semibold tracking-normal whitespace-nowrap text-white md:text-3xl">
            🔗 Referral Link Usage
          </h3>

          {/* TABBED NAVIGATION */}
          <CustomSlider sliderClassName="!gap-6">
            <Link
              href={`/admin/referrals/${id}/links/${linkId}/usage${returnUrl ? `?returnUrl=${encodeURIComponent(returnUrl.toString())}` : ""}`}
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
              href={`/admin/referrals/${id}/links/${linkId}/usage?status=${ReferralLinkUsageStatus.Pending}${returnUrl ? `&returnUrl=${encodeURIComponent(returnUrl.toString())}` : ""}`}
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
              href={`/admin/referrals/${id}/links/${linkId}/usage?status=${ReferralLinkUsageStatus.Completed}${returnUrl ? `&returnUrl=${encodeURIComponent(returnUrl.toString())}` : ""}`}
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
              href={`/admin/referrals/${id}/links/${linkId}/usage?status=${ReferralLinkUsageStatus.Expired}${returnUrl ? `&returnUrl=${encodeURIComponent(returnUrl.toString())}` : ""}`}
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
          <>
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
                      <div className="flex flex-row items-center gap-2">
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
                          returnUrl={getSafeUrl(router.asPath, "")}
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

                        {/* Username */}
                        {usage.username && (
                          <div className="flex justify-between">
                            <p className="text-sm tracking-wider">Username</p>
                            <span className="text-sm">{usage.username}</span>
                          </div>
                        )}

                        {/* Phone Number */}
                        {usage.userPhoneNumber && (
                          <div className="flex justify-between">
                            <p className="text-sm tracking-wider">Phone</p>
                            <span className="flex items-center gap-1 text-sm">
                              {usage.userPhoneNumber}
                              {usage.userPhoneNumberConfirmed && (
                                <IoIosCheckmarkCircle className="text-green h-4 w-4" />
                              )}
                            </span>
                          </div>
                        )}

                        {/* Email Verified */}
                        {usage.userEmail &&
                          usage.userEmailConfirmed !== null && (
                            <div className="flex justify-between">
                              <p className="text-sm tracking-wider">
                                Email Verified
                              </p>
                              {usage.userEmailConfirmed ? (
                                <IoIosCheckmarkCircle className="text-green h-5 w-5" />
                              ) : (
                                <IoMdClose className="text-gray-dark h-5 w-5" />
                              )}
                            </div>
                          )}

                        {/* YoID Onboarded */}
                        {usage.userYoIDOnboarded !== null && (
                          <div className="flex justify-between">
                            <p className="text-sm tracking-wider">
                              YoID Onboarded
                            </p>
                            {usage.userYoIDOnboarded ? (
                              <IoIosCheckmarkCircle className="text-green h-5 w-5" />
                            ) : (
                              <IoMdClose className="text-gray-dark h-5 w-5" />
                            )}
                          </div>
                        )}

                        {/* Dates */}
                        <div className="flex justify-between">
                          <p className="text-sm tracking-wider">Claimed</p>
                          <span className="text-sm">
                            {usage.dateClaimed ? (
                              <Moment format="DD MMM YYYY" utc={true}>
                                {usage.dateClaimed}
                              </Moment>
                            ) : (
                              "N/A"
                            )}
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
                <table className="border-gray-light hidden w-full border-separate rounded-lg bg-white md:table">
                  <thead>
                    <tr className="border-gray text-gray-dark">
                      <th className="border-gray-light !py-4">User</th>
                      <th className="border-gray-light">Status</th>
                      <th className="border-gray-light">User Details</th>
                      <th className="border-gray-light">Dates</th>
                      <th className="border-gray-light text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {searchResults.items.map((usage) => (
                      <tr key={`md_${usage.id}`}>
                        <td className="border-gray-light border-t-2 !align-top">
                          <div className="flex flex-col">
                            <Link
                              href={`/admin/referrals/${usage.programId}/links/${usage.linkId}/usage/${usage.id}/info${
                                returnUrl
                                  ? `?returnUrl=${encodeURIComponent(getSafeUrl(router.asPath, ""))}`
                                  : ""
                              }`}
                              className="block max-w-[200px] truncate font-semibold text-blue-600 hover:underline"
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
                        <td className="border-gray-light border-t-2 !align-top">
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
                        <td className="border-gray-light border-t-2 !align-top">
                          <div className="flex flex-col gap-1 text-xs">
                            {usage.username && (
                              <div className="flex gap-2">
                                <span className="text-gray-dark w-24 font-bold">
                                  Username:
                                </span>
                                <span>{usage.username}</span>
                              </div>
                            )}
                            {usage.userEmail && (
                              <div className="flex items-center gap-2">
                                <span className="text-gray-dark w-24 font-bold">
                                  Email:
                                </span>
                                <span className="flex items-center gap-1">
                                  {usage.userEmailConfirmed && (
                                    <IoIosCheckmarkCircle className="text-green h-4 w-4" />
                                  )}
                                </span>
                              </div>
                            )}
                            {usage.userPhoneNumber && (
                              <div className="flex items-center gap-2">
                                <span className="text-gray-dark w-24 font-bold">
                                  Phone:
                                </span>
                                <span className="flex items-center gap-1">
                                  {usage.userPhoneNumberConfirmed && (
                                    <IoIosCheckmarkCircle className="text-green h-4 w-4" />
                                  )}
                                </span>
                              </div>
                            )}
                            {usage.userYoIDOnboarded !== null && (
                              <div className="flex items-center gap-2">
                                <span className="text-gray-dark w-24 font-bold">
                                  YoID:
                                </span>
                                <span className="flex items-center gap-1">
                                  {usage.userYoIDOnboarded ? (
                                    <IoIosCheckmarkCircle className="text-green h-4 w-4" />
                                  ) : (
                                    <IoMdClose className="text-gray-dark h-4 w-4" />
                                  )}
                                </span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="border-gray-light border-t-2 !align-top">
                          <div className="flex flex-col gap-1 text-xs">
                            <div className="flex gap-2">
                              <span className="text-gray-dark w-20 font-bold">
                                Claimed:
                              </span>
                              {usage.dateClaimed ? (
                                <span>
                                  <Moment format={DATE_FORMAT_HUMAN} utc={true}>
                                    {usage.dateClaimed}
                                  </Moment>
                                </span>
                              ) : (
                                <span>N/A</span>
                              )}
                            </div>
                            {usage.dateCompleted && (
                              <div className="flex gap-2">
                                <span className="text-gray-dark w-20 font-bold">
                                  Completed:
                                </span>
                                <span className="font-semibold">
                                  <Moment format={DATE_FORMAT_HUMAN} utc={true}>
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
                        <td className="border-gray-light border-t-2 !align-top whitespace-nowrap">
                          <div className="flex flex-row items-center justify-center gap-2">
                            <AdminReferralLinkUsageActions
                              usage={usage}
                              returnUrl={getSafeUrl(router.asPath, "")}
                            />
                          </div>
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
          </>
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
