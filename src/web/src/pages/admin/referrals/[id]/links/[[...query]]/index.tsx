import axios from "axios";
import { type GetServerSidePropsContext } from "next";
import { getServerSession } from "next-auth";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useCallback, useMemo, type ReactElement } from "react";
import { IoMdArrowRoundBack, IoMdCopy } from "react-icons/io";
import Moment from "react-moment";
import { toast } from "react-toastify";
import {
  ReferralLinkStatus,
  type ReferralLinkSearchFilterAdmin,
} from "~/api/models/referrals";
import CustomSlider from "~/components/Carousel/CustomSlider";
import MainLayout from "~/components/Layout/Main";
import NoRowsMessage from "~/components/NoRowsMessage";
import { PageBackground } from "~/components/PageBackground";
import { PaginationButtons } from "~/components/PaginationButtons";
import { AdminReferralLinkActions } from "~/components/Referrals/AdminReferralLinkActions";
import {
  ReferralLinkFilterOptions,
  ReferralLinkSearchFilters,
} from "~/components/Referrals/AdminReferralLinkSearchFilter";
import { InternalServerError } from "~/components/Status/InternalServerError";
import { LoadingSkeleton } from "~/components/Status/LoadingSkeleton";
import { Unauthenticated } from "~/components/Status/Unauthenticated";
import { Unauthorized } from "~/components/Status/Unauthorized";
import {
  useReferralLinkCountQuery,
  useReferralLinksAdminQuery,
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
  const { id } = context.params as { id: string };
  const { query, page, status, valueContains, userId, returnUrl } =
    context.query;
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
      query: query ?? null,
      page: page ?? null,
      status: status ?? null,
      valueContains: valueContains ?? null,
      userId: userId ?? null,
      returnUrl: returnUrl ?? null,
      error: null,
    },
  };
}

const ReferralLinks: NextPageWithLayout<{
  id: string;
  query?: string;
  page?: string;
  status?: string;
  valueContains?: string;
  userId?: string;
  returnUrl?: string;
  error?: number | null;
}> = ({ id, query, page, status, valueContains, userId, returnUrl, error }) => {
  const router = useRouter();
  const searchFilter = useMemo<ReferralLinkSearchFilterAdmin>(
    () => ({
      pageNumber: page ? parseInt(page.toString()) : 1,
      pageSize: PAGE_SIZE,
      programId: id,
      userId: userId ?? null,
      statuses: status ? [status as ReferralLinkStatus] : null,
      valueContains: valueContains ?? null,
    }),
    [id, page, status, userId, valueContains],
  );

  const { data: program, error: programError } = useReferralProgramByIdQuery(
    id,
    {
      enabled: !error && !!id,
    },
  );

  const searchResultsKey = `${id}_${query?.toString()}_${page?.toString()}_${status?.toString()}_${valueContains?.toString()}_${userId?.toString()}`;

  const {
    data: searchResults,
    isLoading: isLoadingSearchResults,
    error: searchResultsError,
  } = useReferralLinksAdminQuery(searchFilter, searchResultsKey, {
    enabled: !error && !!id,
  });

  // Get counts by status
  const { data: totalCountAll } = useReferralLinkCountQuery(id, null, {
    enabled: !error && !!id,
  });
  const { data: totalCountActive } = useReferralLinkCountQuery(
    id,
    ReferralLinkStatus.Active,
    { enabled: !error && !!id },
  );
  const { data: totalCountCancelled } = useReferralLinkCountQuery(
    id,
    ReferralLinkStatus.Cancelled,
    { enabled: !error && !!id },
  );
  const { data: totalCountLimitReached } = useReferralLinkCountQuery(
    id,
    ReferralLinkStatus.LimitReached,
    { enabled: !error && !!id },
  );
  const { data: totalCountExpired } = useReferralLinkCountQuery(
    id,
    ReferralLinkStatus.Expired,
    { enabled: !error && !!id },
  );

  const resolvedError =
    error ??
    getErrorStatus(searchResultsError) ??
    getErrorStatus(programError) ??
    undefined;

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

      if (returnUrl) {
        const separator = url.includes("?") ? "&" : "?";
        url = `${url}${separator}returnUrl=${encodeURIComponent(returnUrl.toString())}`;
      }

      if (url != router.asPath)
        void router.push(url, undefined, { scroll: false });
    },
    [router, id, getSearchFilterAsQueryString, returnUrl],
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
    (val: ReferralLinkSearchFilterAdmin) => {
      const newFilter = {
        ...searchFilter,
        ...val,
        pageNumber: 1, // reset to first page
      };
      redirectWithSearchFilterParams(newFilter);
    },
    [searchFilter, redirectWithSearchFilterParams],
  );

  const handleCopyLink = useCallback((url: string) => {
    navigator.clipboard.writeText(url);
    toast.success("URL copied to clipboard!", { autoClose: 2000 });
  }, []);
  //#endregion Event Handlers

  if (resolvedError) {
    if (resolvedError === 401) return <Unauthenticated />;
    else if (resolvedError === 403) return <Unauthorized />;
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
          <div className="flex flex-row items-center gap-2 text-xs text-white">
            <Link
              className="hover:text-gray flex max-w-[200px] min-w-0 items-center font-bold"
              href={getSafeUrl(
                returnUrl?.toString(),
                `/admin/referrals/${program?.id}/info`,
              )}
            >
              <IoMdArrowRoundBack className="mr-2 inline-block h-4 w-4 shrink-0" />
              <span className="truncate">{program?.name}</span>
            </Link>

            <div className="font-bold">|</div>
            <span className="max-w-[200px] min-w-0 truncate">
              Referral Links
            </span>
          </div>

          <h3 className="flex items-center text-xl font-semibold tracking-normal whitespace-nowrap text-white md:text-3xl">
            🔗 Referral Links
          </h3>

          {/* TABBED NAVIGATION */}
          <CustomSlider sliderClassName="!gap-6">
            <Link
              href={`/admin/referrals/${id}/links${returnUrl ? `?returnUrl=${encodeURIComponent(returnUrl.toString())}` : ""}`}
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
              href={`/admin/referrals/${id}/links?status=${ReferralLinkStatus.Active}${returnUrl ? `&returnUrl=${encodeURIComponent(returnUrl.toString())}` : ""}`}
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
              href={`/admin/referrals/${id}/links?status=${ReferralLinkStatus.Cancelled}${returnUrl ? `&returnUrl=${encodeURIComponent(returnUrl.toString())}` : ""}`}
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
              href={`/admin/referrals/${id}/links?status=${ReferralLinkStatus.LimitReached}${returnUrl ? `&returnUrl=${encodeURIComponent(returnUrl.toString())}` : ""}`}
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
              href={`/admin/referrals/${id}/links?status=${ReferralLinkStatus.Expired}${returnUrl ? `&returnUrl=${encodeURIComponent(returnUrl.toString())}` : ""}`}
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
          <>
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
                      <div className="flex flex-row items-center gap-2">
                        <div className="min-w-0 flex-grow">
                          <Link
                            href={`/admin/referrals/${id}/links/${link.id}/usage?returnUrl=${encodeURIComponent(router.asPath)}`}
                            className="line-clamp-1 block truncate text-start font-semibold hover:underline"
                          >
                            {link.name}
                          </Link>
                        </div>
                        <AdminReferralLinkActions
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
                        <div className="flex flex-row items-center justify-between gap-1">
                          <p className="text-sm tracking-wider">URL</p>
                          <div className="flex min-w-0 items-center gap-2">
                            <a
                              href={link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue hidden max-w-60 truncate text-sm underline md:block"
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
                        <div className="flex flex-row items-center justify-between gap-1">
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
                          <p className="text-sm tracking-wider">Completed</p>
                          <span className="text-sm font-semibold">
                            {link.completionTotal ?? 0}
                          </span>
                        </div>
                        {link.programCompletionLimitReferee !== null &&
                          link.completionBalance !== null && (
                            <div className="flex justify-between">
                              <p className="text-sm tracking-wider">
                                Remaining
                              </p>
                              <span className="text-sm font-semibold">
                                {link.completionBalance}
                              </span>
                            </div>
                          )}
                        <div className="flex justify-between">
                          <p className="text-sm tracking-wider">Pending</p>
                          <span className="text-sm font-semibold">
                            {link.pendingTotal ?? 0}
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
                <table className="border-gray-light hidden w-full border-separate rounded-lg bg-white md:table">
                  <thead>
                    <tr className="border-gray text-gray-dark">
                      <th className="border-gray-light !py-4">Name</th>
                      <th className="border-gray-light">Referrer</th>
                      <th className="border-gray-light">Status</th>
                      <th className="border-gray-light">URL</th>
                      <th className="border-gray-light">Statistics</th>
                      <th className="border-gray-light text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {searchResults.items.map((link) => (
                      <tr key={`md_${link.id}`}>
                        <td className="border-gray-light border-t-2 !align-top">
                          <Link
                            href={`/admin/referrals/${id}/links/${link.id}/usage?returnUrl=${encodeURIComponent(router.asPath)}`}
                            className="block max-w-[200px] truncate font-semibold text-blue-600 hover:underline"
                          >
                            {link.name}
                          </Link>
                        </td>
                        <td className="border-gray-light border-t-2 !align-top">
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
                        <td className="border-gray-light border-t-2 !align-top">
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
                        <td className="border-gray-light border-t-2 !align-top">
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
                        <td className="border-gray-light text-gray-dark border-t-2 !align-top">
                          <div className="flex flex-col gap-1 text-xs">
                            <div className="flex gap-2">
                              <span className="text-gray-dark w-20 font-bold">
                                Completed:
                              </span>
                              <span className="font-semibold">
                                {link.completionTotal ?? 0}
                              </span>
                            </div>
                            {link.programCompletionLimitReferee !== null &&
                              link.completionBalance !== null && (
                                <div className="flex gap-2">
                                  <span className="text-gray-dark w-20 font-bold">
                                    Remaining:
                                  </span>
                                  <span className="font-semibold">
                                    {link.completionBalance}
                                  </span>
                                </div>
                              )}
                            <div className="flex gap-2">
                              <span className="text-gray-dark w-20 font-bold">
                                Pending:
                              </span>
                              <span>{link.pendingTotal ?? 0}</span>
                            </div>
                            <div className="flex gap-2">
                              <span className="text-gray-dark w-20 font-bold">
                                Expired:
                              </span>
                              <span>{link.expiredTotal ?? 0}</span>
                            </div>
                          </div>
                        </td>
                        <td className="border-gray-light border-t-2 !align-top whitespace-nowrap">
                          <div className="flex flex-row items-center justify-center gap-2">
                            <AdminReferralLinkActions
                              link={link}
                              returnUrl={getSafeUrl(
                                returnUrl?.toString(),
                                router.asPath,
                              )}
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

ReferralLinks.getLayout = function getLayout(page: ReactElement) {
  return <MainLayout>{page}</MainLayout>;
};

ReferralLinks.theme = function getTheme() {
  return THEME_BLUE;
};

export default ReferralLinks;
