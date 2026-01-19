import { QueryClient, dehydrate, useQuery } from "@tanstack/react-query";
import axios from "axios";
import { type GetServerSidePropsContext } from "next";
import { getServerSession } from "next-auth";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useCallback, useState, type ReactElement } from "react";
import { FaPlusCircle } from "react-icons/fa";
import { IoIosCheckmarkCircle, IoMdClose } from "react-icons/io";
import Moment from "react-moment";
import {
  ProgramStatus,
  type ProgramSearchFilterAdmin,
  type ProgramSearchResults,
} from "~/api/models/referrals";
import { searchReferralPrograms } from "~/api/services/referrals";
import CustomSlider from "~/components/Carousel/CustomSlider";
import MainLayout from "~/components/Layout/Main";
import NoRowsMessage from "~/components/NoRowsMessage";
import { PageBackground } from "~/components/PageBackground";
import { PaginationButtons } from "~/components/PaginationButtons";
import { AdminReferralProgramActions } from "~/components/Referrals/AdminReferralProgramActions";
import {
  ReferralFilterOptions,
  ReferralProgramSearchFilters,
} from "~/components/Referrals/AdminReferralProgramSearchFilter";
import { ProgramImage } from "~/components/Referrals/ProgramImage";
import { ProgramStatusBadge } from "~/components/Referrals/ProgramStatusBadge";
import { InternalServerError } from "~/components/Status/InternalServerError";
import { LoadingSkeleton } from "~/components/Status/LoadingSkeleton";
import { Unauthenticated } from "~/components/Status/Unauthenticated";
import { Unauthorized } from "~/components/Status/Unauthorized";
import { DATE_FORMAT_HUMAN, PAGE_SIZE, THEME_BLUE } from "~/lib/constants";
import { config } from "~/lib/react-query-config";
import { getSafeUrl, getThemeFromRole } from "~/lib/utils";
import { type NextPageWithLayout } from "~/pages/_app";
import { authOptions } from "~/server/auth";

// ⚠️ SSR
export async function getServerSideProps(context: GetServerSidePropsContext) {
  const { query, page, status, valueContains, returnUrl, dateStart, dateEnd } =
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

  try {
    // 👇 prefetch queries on server
    const searchFilter: ProgramSearchFilterAdmin = {
      pageNumber: page ? parseInt(page.toString()) : 1,
      pageSize: PAGE_SIZE,
      valueContains: valueContains?.toString() ?? null,
      statuses: status ? [status.toString()] : null,
      dateStart: dateStart?.toString() ?? null,
      dateEnd: dateEnd?.toString() ?? null,
    };
    const data = await searchReferralPrograms(searchFilter, context);

    await queryClient.prefetchQuery({
      queryKey: [
        "referralPrograms",
        `${query?.toString()}_${page?.toString()}_${status?.toString()}_${valueContains?.toString()}_${dateStart?.toString()}_${dateEnd?.toString()}`,
      ],
      queryFn: () => data,
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
      query: query ?? null,
      page: page ?? null,
      status: status ?? null,
      valueContains: valueContains ?? null,
      dateStart: dateStart ?? null,
      dateEnd: dateEnd ?? null,
      theme: theme,
      error: errorCode,
      returnUrl: returnUrl ?? null,
    },
  };
}

const ReferralPrograms: NextPageWithLayout<{
  query?: string;
  page?: string;
  theme: string;
  error?: number;
  status?: string;
  valueContains?: string;
  opportunities?: string;
  dateStart?: string;
  dateEnd?: string;
  returnUrl?: string;
}> = ({
  query,
  page,
  status,
  valueContains,
  dateStart,
  dateEnd,
  error,
  returnUrl,
}) => {
  const router = useRouter();

  // search filter state
  const [searchFilter, setSearchFilter] = useState<ProgramSearchFilterAdmin>({
    pageNumber: page ? parseInt(page.toString()) : 1,
    pageSize: PAGE_SIZE,
    valueContains: valueContains ?? null,
    statuses: status ? [status] : null,
    dateStart: dateStart ?? null,
    dateEnd: dateEnd ?? null,
  });

  // 👇 use prefetched queries from server
  const { data: searchResults, isLoading: isLoadingSearchResults } =
    useQuery<ProgramSearchResults>({
      queryKey: [
        "referralPrograms",
        `${query?.toString()}_${page?.toString()}_${status?.toString()}_${valueContains?.toString()}_${dateStart?.toString()}_${dateEnd?.toString()}`,
      ],
      queryFn: () => searchReferralPrograms(searchFilter),
      enabled: !error,
    });

  // Get counts by status (without additional filters)
  const { data: totalCountAll } = useQuery<number>({
    queryKey: ["referralPrograms", "totalCount", null],
    queryFn: () => {
      const filter: ProgramSearchFilterAdmin = {
        pageNumber: 1,
        pageSize: PAGE_SIZE,
        valueContains: null,
        statuses: null,
        dateStart: null,
        dateEnd: null,
      };
      return searchReferralPrograms(filter).then(
        (data) => data.totalCount ?? 0,
      );
    },
    enabled: !error,
  });

  const { data: totalCountActive } = useQuery<number>({
    queryKey: ["referralPrograms", "totalCount", ProgramStatus.Active],
    queryFn: () => {
      const filter: ProgramSearchFilterAdmin = {
        pageNumber: 1,
        pageSize: PAGE_SIZE,
        valueContains: null,
        statuses: [ProgramStatus.Active],
        dateStart: null,
        dateEnd: null,
      };
      return searchReferralPrograms(filter).then(
        (data) => data.totalCount ?? 0,
      );
    },
    enabled: !error,
  });

  const { data: totalCountInactive } = useQuery<number>({
    queryKey: ["referralPrograms", "totalCount", ProgramStatus.Inactive],
    queryFn: () => {
      const filter: ProgramSearchFilterAdmin = {
        pageNumber: 1,
        pageSize: PAGE_SIZE,
        valueContains: null,
        statuses: [ProgramStatus.Inactive],
        dateStart: null,
        dateEnd: null,
      };
      return searchReferralPrograms(filter).then(
        (data) => data.totalCount ?? 0,
      );
    },
    enabled: !error,
  });

  const { data: totalCountExpired } = useQuery<number>({
    queryKey: ["referralPrograms", "totalCount", ProgramStatus.Expired],
    queryFn: () => {
      const filter: ProgramSearchFilterAdmin = {
        pageNumber: 1,
        pageSize: PAGE_SIZE,
        valueContains: null,
        statuses: [ProgramStatus.Expired],
        dateStart: null,
        dateEnd: null,
      };
      return searchReferralPrograms(filter).then(
        (data) => data.totalCount ?? 0,
      );
    },
    enabled: !error,
  });

  const { data: totalCountDeleted } = useQuery<number>({
    queryKey: ["referralPrograms", "totalCount", ProgramStatus.Deleted],
    queryFn: () => {
      const filter: ProgramSearchFilterAdmin = {
        pageNumber: 1,
        pageSize: PAGE_SIZE,
        valueContains: null,
        statuses: [ProgramStatus.Deleted],
        dateStart: null,
        dateEnd: null,
      };
      return searchReferralPrograms(filter).then(
        (data) => data.totalCount ?? 0,
      );
    },
    enabled: !error,
  });

  const { data: totalCountLimitReached } = useQuery<number>({
    queryKey: ["referralPrograms", "totalCount", ProgramStatus.LimitReached],
    queryFn: () => {
      const filter: ProgramSearchFilterAdmin = {
        pageNumber: 1,
        pageSize: PAGE_SIZE,
        valueContains: null,
        statuses: [ProgramStatus.LimitReached],
        dateStart: null,
        dateEnd: null,
      };
      return searchReferralPrograms(filter).then(
        (data) => data.totalCount ?? 0,
      );
    },
    enabled: !error,
  });

  const { data: totalCountUnCompletable } = useQuery<number>({
    queryKey: ["referralPrograms", "totalCount", ProgramStatus.UnCompletable],
    queryFn: () => {
      const filter: ProgramSearchFilterAdmin = {
        pageNumber: 1,
        pageSize: PAGE_SIZE,
        valueContains: null,
        statuses: [ProgramStatus.UnCompletable],
        dateStart: null,
        dateEnd: null,
      };
      return searchReferralPrograms(filter).then(
        (data) => data.totalCount ?? 0,
      );
    },
    enabled: !error,
  });

  // 🎈 FUNCTIONS
  const getSearchFilterAsQueryString = useCallback(
    (searchFilter: ProgramSearchFilterAdmin) => {
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

      if (searchFilter.statuses && searchFilter.statuses.length > 0) {
        const status = searchFilter.statuses[0];
        if (status) params.append("status", status.toString());
      }

      if (searchFilter.dateStart)
        params.append("dateStart", searchFilter.dateStart);

      if (searchFilter.dateEnd) params.append("dateEnd", searchFilter.dateEnd);

      if (params.size === 0) return null;
      return params;
    },
    [],
  );

  const redirectWithSearchFilterParams = useCallback(
    (filter: ProgramSearchFilterAdmin) => {
      let url = `/admin/referrals`;
      const params = getSearchFilterAsQueryString(filter);
      if (params != null && params.size > 0)
        url = `${url}?${params.toString()}`;

      if (url != router.asPath)
        void router.push(url, undefined, { scroll: false });
    },
    [router, getSearchFilterAsQueryString],
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

  const onSearchInputSubmit = useCallback(
    (filter: ProgramSearchFilterAdmin) => {
      const newFilter = { ...filter, pageNumber: 1 };
      setSearchFilter(newFilter);
      redirectWithSearchFilterParams(newFilter);
    },
    [redirectWithSearchFilterParams],
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
        <title>Yoma | 🎯 Referral Programs</title>
      </Head>

      <PageBackground className="h-[14.3rem] md:h-[18.4rem]" />

      <div className="z-10 container mt-14 max-w-7xl px-2 py-8 md:mt-[7rem]">
        <div className="flex flex-col gap-4 py-4">
          <h3 className="mt-3 mb-6 flex items-center text-xl font-semibold tracking-normal whitespace-nowrap text-white md:mt-0 md:mb-9 md:text-3xl">
            🎯 Referral Programs
          </h3>

          {/* TABBED NAVIGATION */}
          <CustomSlider sliderClassName="!gap-6">
            <Link
              href={`/admin/referrals`}
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
              href={`/admin/referrals?status=Active`}
              role="tab"
              className={`border-b-4 py-2 whitespace-nowrap text-white ${
                status === "Active"
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
              href={`/admin/referrals?status=Inactive`}
              role="tab"
              className={`border-b-4 py-2 whitespace-nowrap text-white ${
                status === "Inactive"
                  ? "border-orange"
                  : "hover:border-orange hover:text-gray"
              }`}
            >
              Inactive
              {(totalCountInactive ?? 0) > 0 && (
                <div className="badge bg-warning my-auto ml-2 p-1 text-[12px] font-semibold text-white">
                  {totalCountInactive}
                </div>
              )}
            </Link>
            <Link
              href={`/admin/referrals?status=Expired`}
              role="tab"
              className={`border-b-4 py-2 whitespace-nowrap text-white ${
                status === "Expired"
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
            <Link
              href={`/admin/referrals?status=Deleted`}
              role="tab"
              className={`border-b-4 py-2 whitespace-nowrap text-white ${
                status === "Deleted"
                  ? "border-orange"
                  : "hover:border-orange hover:text-gray"
              }`}
            >
              Deleted
              {(totalCountDeleted ?? 0) > 0 && (
                <div className="badge bg-warning my-auto ml-2 p-1 text-[12px] font-semibold text-white">
                  {totalCountDeleted}
                </div>
              )}
            </Link>
            <Link
              href={`/admin/referrals?status=LimitReached`}
              role="tab"
              className={`border-b-4 py-2 whitespace-nowrap text-white ${
                status === "LimitReached"
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
              href={`/admin/referrals?status=UnCompletable`}
              role="tab"
              className={`border-b-4 py-2 whitespace-nowrap text-white ${
                status === "UnCompletable"
                  ? "border-orange"
                  : "hover:border-orange hover:text-gray"
              }`}
            >
              Uncompletable
              {(totalCountUnCompletable ?? 0) > 0 && (
                <div className="badge bg-warning my-auto ml-2 p-1 text-[12px] font-semibold text-white">
                  {totalCountUnCompletable}
                </div>
              )}
            </Link>
          </CustomSlider>

          <div className="flex w-full grow flex-col items-center justify-between gap-4 sm:justify-end md:flex-row">
            {/* FILTER */}
            <ReferralProgramSearchFilters
              searchFilter={searchFilter}
              filterOptions={[
                ReferralFilterOptions.VALUECONTAINS,
                ReferralFilterOptions.DATERANGE,
              ]}
              onSubmit={onSearchInputSubmit}
            />
            {/* ADD BUTTON */}
            <Link
              href={`/admin/referrals/create${`?returnUrl=${encodeURIComponent(
                getSafeUrl(returnUrl?.toString(), router.asPath),
              )}`}`}
              className="bg-theme btn btn-circle btn-sm w-fit p-1 px-4 text-xs"
            >
              <FaPlusCircle className="h-4 w-4" /> Create Program
            </Link>
          </div>
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
                  title={"No referral programs found"}
                  description={
                    status
                      ? "No programs with this status."
                      : "Create your first referral program to start incentivizing referrals."
                  }
                />
              </div>
            )}

            {/* RESULTS */}
            {searchResults && searchResults.items?.length > 0 && (
              <>
                {/* MOBILE */}
                <div className="flex flex-col gap-4 md:hidden">
                  {searchResults.items.map((program) => (
                    <div
                      key={`sm_${program.id}`}
                      className="shadow-custom flex flex-col justify-between gap-4 rounded-lg bg-white p-4"
                    >
                      <div className="border-gray-light flex flex-row items-center gap-2 border-b-2 pb-2">
                        {/* Program Image */}
                        <ProgramImage
                          imageURL={program.imageURL}
                          name={program.name}
                          size={48}
                          className="border border-gray-200 bg-white"
                        />
                        <div className="flex min-w-0 flex-1 flex-col">
                          <div className="flex min-w-0 items-center gap-2">
                            <Link
                              href={`/admin/referrals/${program.id}/info${`?returnUrl=${encodeURIComponent(
                                getSafeUrl(
                                  returnUrl?.toString(),
                                  router.asPath,
                                ),
                              )}`}`}
                              className="min-w-0 flex-1 truncate text-start font-semibold"
                            >
                              {program.name}
                            </Link>
                            {program.isDefault && (
                              <span className="badge badge-sm bg-blue-light text-blue flex-shrink-0">
                                Default
                              </span>
                            )}
                          </div>

                          {program.description && (
                            <p className="text-gray-dark mt-0.5 line-clamp-2 text-xs">
                              {program.description}
                            </p>
                          )}
                        </div>
                        <AdminReferralProgramActions
                          program={program}
                          returnUrl={router.asPath}
                        />
                      </div>

                      <div className="text-gray-dark flex flex-col gap-2">
                        {/* Status */}
                        <div className="flex justify-between">
                          <p className="text-sm tracking-wider">Status</p>
                          <ProgramStatusBadge status={program.status} />
                        </div>

                        {/* Program Cap */}
                        <div className="flex justify-between">
                          <p className="text-sm tracking-wider">Program Cap</p>
                          <span className="text-xs text-gray-500">
                            {program.completionLimit?.toLocaleString("en-US") ??
                              "No limit"}
                          </span>
                        </div>

                        {/* Completions */}
                        <div className="flex justify-between">
                          <p className="text-sm tracking-wider">Completions</p>
                          <span className="text-xs text-gray-500">
                            {program.completionTotal?.toLocaleString("en-US") ??
                              0}
                          </span>
                        </div>

                        {/* Completion Balance */}
                        {program.completionBalance !== null && (
                          <div className="flex justify-between">
                            <p className="text-sm tracking-wider">Remaining</p>
                            <span className="text-xs text-gray-500">
                              {program.completionBalance?.toLocaleString(
                                "en-US",
                              )}
                            </span>
                          </div>
                        )}

                        {/* ZLTO Pool */}
                        <div className="flex justify-between">
                          <p className="text-sm tracking-wider">ZLTO</p>
                          {program.zltoRewardPool ? (
                            <div className="flex flex-col items-end gap-1">
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs text-gray-500">
                                  {program.zltoRewardPool.toLocaleString(
                                    "en-US",
                                  )}{" "}
                                  pool
                                </span>
                              </div>
                              {program.zltoRewardBalance !== null && (
                                <span className="text-xs text-gray-500">
                                  {program.zltoRewardBalance.toLocaleString(
                                    "en-US",
                                  )}{" "}
                                  left
                                </span>
                              )}
                              {program.zltoRewardCumulative !== null && (
                                <span className="text-xs text-gray-500">
                                  {program.zltoRewardCumulative.toLocaleString(
                                    "en-US",
                                  )}{" "}
                                  used
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-gray-500">
                              Not set
                            </span>
                          )}
                        </div>

                        {/* Features */}
                        <div className="flex justify-between">
                          <p className="text-sm tracking-wider">
                            Proof of Personhood
                          </p>
                          {program.proofOfPersonhoodRequired ? (
                            <IoIosCheckmarkCircle className="text-green h-5 w-5" />
                          ) : (
                            <IoMdClose className="text-gray-dark h-5 w-5" />
                          )}
                        </div>

                        <div className="flex justify-between">
                          <p className="text-sm tracking-wider">
                            Pathway Required
                          </p>
                          {program.pathwayRequired ? (
                            <IoIosCheckmarkCircle className="text-green h-5 w-5" />
                          ) : (
                            <IoMdClose className="text-gray-dark h-5 w-5" />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* DESKTOP */}
                <table className="border-gray-light hidden w-full border-separate rounded-lg border-x-2 border-t-2 md:table">
                  <thead>
                    <tr className="border-gray text-gray-dark">
                      <th className="border-gray-light border-b-2 !py-4">
                        Referral Program
                      </th>
                      <th className="border-gray-light border-b-2">Status</th>
                      <th className="border-gray-light border-b-2">
                        Caps & Completions
                      </th>
                      <th className="border-gray-light border-b-2">
                        ZLTO Rewards
                      </th>
                      <th className="border-gray-light border-b-2">Features</th>
                      <th className="border-gray-light border-b-2 text-center">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {searchResults.items.map((program) => (
                      <tr key={`md_${program.id}`}>
                        <td className="border-gray-light border-b-2 !align-top">
                          <div className="flex flex-row gap-4">
                            <Link
                              href={`/admin/referrals/${program.id}/info${`?returnUrl=${encodeURIComponent(
                                getSafeUrl(
                                  returnUrl?.toString(),
                                  router.asPath,
                                ),
                              )}`}`}
                              className="flex justify-center"
                            >
                              <ProgramImage
                                imageURL={program.imageURL}
                                name={program.name}
                                size={60}
                                className="bg-white"
                              />
                            </Link>

                            <div className="flex flex-col">
                              {/* <div className="flex flex-row"> */}
                              <Link
                                href={`/admin/referrals/${program.id}/info${`?returnUrl=${encodeURIComponent(
                                  getSafeUrl(
                                    returnUrl?.toString(),
                                    router.asPath,
                                  ),
                                )}`}`}
                                className={`max-w-56 truncate font-medium whitespace-nowrap text-black underline`}
                              >
                                {program.name}
                              </Link>
                              {/* {program.isDefault && (
                                  <span className="badge badge-sm bg-blue-light text-blue ml-2">
                                    Default
                                  </span>
                                )} */}
                              {/* </div> */}
                              <p className="line-clamp-1 max-w-56 truncate text-sm">
                                {program.description}
                              </p>

                              <div className="text-gray-dark mt-2 flex flex-row items-center gap-4 text-xs">
                                <span className="font-bold">Starts:</span>
                                <span className="font-semibold text-black">
                                  <Moment format={DATE_FORMAT_HUMAN} utc={true}>
                                    {program.dateStart}
                                  </Moment>
                                </span>
                                {program.dateEnd && (
                                  <>
                                    <span className="font-bold">Ends:</span>
                                    <span className="font-semibold text-black">
                                      <Moment
                                        format={DATE_FORMAT_HUMAN}
                                        utc={true}
                                      >
                                        {program.dateEnd}
                                      </Moment>
                                    </span>
                                  </>
                                )}

                                {/* {program.isDefault && (
                                  <span className="badge badge-sm bg-blue-light text-blue ml-2">
                                    Default
                                  </span>
                                )} */}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="border-gray-light flex flex-col border-b-2 !align-top">
                          <div className="flex flex-col gap-2">
                            {program.isDefault && (
                              <span className="badge badge-sm bg-blue-light text-blue">
                                Default
                              </span>
                            )}
                            <ProgramStatusBadge status={program.status} />
                          </div>
                        </td>
                        <td className="border-gray-light text-gray-dark border-b-2 !align-top">
                          <div className="flex flex-col gap-1 text-xs">
                            <div className="flex gap-2">
                              <span className="text-gray-dark w-14 font-bold">
                                Cap:
                              </span>
                              <span>
                                {program.completionLimit?.toLocaleString(
                                  "en-US",
                                ) ?? "N/A"}
                              </span>
                            </div>
                            <div className="flex gap-2">
                              <span className="text-gray-dark w-14 font-bold">
                                Done:
                              </span>
                              <span>
                                {program.completionTotal?.toLocaleString(
                                  "en-US",
                                ) ?? 0}
                              </span>
                            </div>
                            {program.completionBalance !== null && (
                              <div className="flex gap-2">
                                <span className="text-gray-dark w-14 font-bold">
                                  Left:
                                </span>
                                <span>
                                  {program.completionBalance.toLocaleString(
                                    "en-US",
                                  )}
                                </span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="border-gray-light text-gray-dark border-b-2 !align-top">
                          <div className="flex flex-col gap-1 text-xs">
                            {program.zltoRewardPool ? (
                              <>
                                <div className="flex gap-2">
                                  <span className="text-gray-dark w-14 font-bold">
                                    Pool:
                                  </span>
                                  <span>
                                    {program.zltoRewardPool.toLocaleString(
                                      "en-US",
                                    )}
                                  </span>
                                </div>
                                {program.zltoRewardBalance !== null && (
                                  <div className="flex gap-2">
                                    <span className="text-gray-dark w-14 font-bold">
                                      Left:
                                    </span>
                                    <span>
                                      {program.zltoRewardBalance.toLocaleString(
                                        "en-US",
                                      )}
                                    </span>
                                  </div>
                                )}
                                {program.zltoRewardCumulative !== null && (
                                  <div className="flex gap-2">
                                    <span className="text-gray-dark w-14 font-bold">
                                      Used:
                                    </span>
                                    <span>
                                      {program.zltoRewardCumulative.toLocaleString(
                                        "en-US",
                                      )}
                                    </span>
                                  </div>
                                )}
                              </>
                            ) : (
                              <span className="text-gray-400">
                                No ZLTO rewards
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="border-gray-light border-b-2 !align-top">
                          <div className="flex flex-col gap-1 text-xs">
                            <div className="flex items-center gap-1">
                              {program.proofOfPersonhoodRequired ? (
                                <IoIosCheckmarkCircle className="text-green h-4 w-4" />
                              ) : (
                                <IoMdClose className="text-gray-dark h-4 w-4" />
                              )}
                              <span className="text-gray-dark font-semibold">
                                Proof Of Personhood
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              {program.pathwayRequired ? (
                                <IoIosCheckmarkCircle className="text-green h-4 w-4" />
                              ) : (
                                <IoMdClose className="text-gray-dark h-4 w-4" />
                              )}
                              <span className="text-gray-dark font-semibold">
                                Pathway
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="border-gray-light border-b-2 text-center !align-top">
                          <AdminReferralProgramActions
                            program={program}
                            returnUrl={router.asPath}
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
                    showInfo={true}
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

ReferralPrograms.getLayout = function getLayout(page: ReactElement) {
  return <MainLayout>{page}</MainLayout>;
};

ReferralPrograms.theme = function getTheme() {
  return THEME_BLUE;
};

export default ReferralPrograms;
