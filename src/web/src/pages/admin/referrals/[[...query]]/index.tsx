import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useSession } from "next-auth/react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useCallback, useEffect, useState, type ReactElement } from "react";
import { FaPlusCircle } from "react-icons/fa";
import {
  IoEyeOffOutline,
  IoGitNetwork,
  IoPersonCircle,
  IoStarOutline,
} from "react-icons/io5";
import Moment from "react-moment";
import type { Country } from "~/api/models/lookups";
import {
  ProgramStatus,
  type ProgramSearchFilterAdmin,
} from "~/api/models/referrals";
import { getCountries } from "~/api/services/lookups";
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
import { Loading } from "~/components/Status/Loading";
import { LoadingSkeleton } from "~/components/Status/LoadingSkeleton";
import { Unauthenticated } from "~/components/Status/Unauthenticated";
import { Unauthorized } from "~/components/Status/Unauthorized";
import {
  useReferralProgramCountQuery,
  useReferralProgramsAdminQuery,
} from "~/hooks/useReferralProgramMutations";
import { DATE_FORMAT_HUMAN, PAGE_SIZE, THEME_BLUE } from "~/lib/constants";
import { getSafeUrl } from "~/lib/utils";
import { type NextPageWithLayout } from "~/pages/_app";

const parseDelimitedQueryParam = (
  value: string | string[] | undefined,
): string[] | null => {
  if (value == null) return null;

  const rawParts = Array.isArray(value) ? value : value.split(/[|,]/);
  const parts = rawParts.map((p) => p.trim()).filter(Boolean);
  return parts.length > 0 ? parts : null;
};

const serializeDelimitedQueryParam = (
  value: string[] | null | undefined,
): string | null => {
  if (!value || value.length === 0) return null;
  return value.join("|");
};

const getErrorStatus = (error: unknown): number | null => {
  if (!axios.isAxiosError(error)) return null;
  return error.response?.status ?? null;
};

const ReferralPrograms: NextPageWithLayout = () => {
  const router = useRouter();
  const { status: sessionStatus } = useSession();
  const query =
    typeof router.query.query === "string" ? router.query.query : undefined;
  const page =
    typeof router.query.page === "string" ? router.query.page : undefined;
  const status =
    typeof router.query.status === "string" ? router.query.status : undefined;
  const valueContains =
    typeof router.query.valueContains === "string"
      ? router.query.valueContains
      : undefined;
  const countries = router.query.countries as string | string[] | undefined;
  const dateStart =
    typeof router.query.dateStart === "string"
      ? router.query.dateStart
      : undefined;
  const dateEnd =
    typeof router.query.dateEnd === "string" ? router.query.dateEnd : undefined;
  const returnUrl =
    typeof router.query.returnUrl === "string"
      ? router.query.returnUrl
      : undefined;

  const parsedCountries = parseDelimitedQueryParam(
    countries as string | string[] | undefined,
  );
  const countriesKeyPart = serializeDelimitedQueryParam(parsedCountries);

  const { data: lookups_countries } = useQuery<Country[]>({
    queryKey: ["countries"],
    queryFn: () => getCountries(),
    enabled: sessionStatus === "authenticated" && router.isReady,
  });

  // search filter state
  const [searchFilter, setSearchFilter] = useState<ProgramSearchFilterAdmin>({
    pageNumber: page ? parseInt(page.toString()) : 1,
    pageSize: PAGE_SIZE,
    countries: parsedCountries,
    valueContains: valueContains ?? null,
    statuses: status ? [status] : null,
    dateStart: dateStart ?? null,
    dateEnd: dateEnd ?? null,
  });

  useEffect(() => {
    if (!router.isReady) return;

    setSearchFilter({
      pageNumber: page ? parseInt(page.toString()) : 1,
      pageSize: PAGE_SIZE,
      countries: parsedCountries,
      valueContains: valueContains ?? null,
      statuses: status ? [status] : null,
      dateStart: dateStart ?? null,
      dateEnd: dateEnd ?? null,
    });
  }, [
    router.isReady,
    page,
    parsedCountries,
    valueContains,
    status,
    dateStart,
    dateEnd,
  ]);

  // 👇 use prefetched queries from server
  const searchResultsKey = `${query?.toString()}_${page?.toString()}_${status?.toString()}_${valueContains?.toString()}_${dateStart?.toString()}_${dateEnd?.toString()}_${countriesKeyPart ?? ""}`;

  const {
    data: searchResults,
    isLoading: isLoadingSearchResults,
    error: searchResultsError,
  } = useReferralProgramsAdminQuery(searchFilter, searchResultsKey, {
    enabled: sessionStatus === "authenticated" && router.isReady,
  });

  // Get counts by status (without additional filters)
  const { data: totalCountAll } = useReferralProgramCountQuery(null, {
    enabled: sessionStatus === "authenticated" && router.isReady,
  });
  const { data: totalCountActive } = useReferralProgramCountQuery(
    ProgramStatus.Active,
    { enabled: sessionStatus === "authenticated" && router.isReady },
  );
  const { data: totalCountInactive } = useReferralProgramCountQuery(
    ProgramStatus.Inactive,
    { enabled: sessionStatus === "authenticated" && router.isReady },
  );
  const { data: totalCountExpired } = useReferralProgramCountQuery(
    ProgramStatus.Expired,
    { enabled: sessionStatus === "authenticated" && router.isReady },
  );
  const { data: totalCountDeleted } = useReferralProgramCountQuery(
    ProgramStatus.Deleted,
    { enabled: sessionStatus === "authenticated" && router.isReady },
  );
  const { data: totalCountLimitReached } = useReferralProgramCountQuery(
    ProgramStatus.LimitReached,
    { enabled: sessionStatus === "authenticated" && router.isReady },
  );
  const { data: totalCountUnCompletable } = useReferralProgramCountQuery(
    ProgramStatus.UnCompletable,
    { enabled: sessionStatus === "authenticated" && router.isReady },
  );

  const error = getErrorStatus(searchResultsError);

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

      if (searchFilter.countries && searchFilter.countries.length > 0)
        params.append("countries", searchFilter.countries.join("|"));

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

  if (sessionStatus === "loading" || !router.isReady) {
    return <Loading />;
  }

  if (sessionStatus === "unauthenticated") {
    return <Unauthenticated />;
  }

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
              lookups_countries={lookups_countries}
              filterOptions={[
                ReferralFilterOptions.VALUECONTAINS,
                ReferralFilterOptions.COUNTRIES,
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
                          className="shrink-0 border border-gray-200 bg-white"
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

                          <p className="text-gray-dark mt-0.5 line-clamp-2 text-xs">
                            {program.summary ?? program.description}
                          </p>
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

                        {/* Caps & Completions */}
                        <div className="border-gray-light flex flex-col gap-1 border-t pt-2">
                          <p className="text-[10px] font-semibold tracking-wider text-gray-400 uppercase">
                            Completions
                          </p>
                          <div className="flex justify-between">
                            <p className="text-sm tracking-wider">Limit</p>
                            <span className="text-xs text-gray-500">
                              {program.completionLimit?.toLocaleString(
                                "en-US",
                              ) ?? "No limit"}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <p className="text-sm tracking-wider">Completed</p>
                            <span className="text-xs text-gray-500">
                              {program.completionTotal?.toLocaleString(
                                "en-US",
                              ) ?? 0}
                            </span>
                          </div>
                          {program.completionBalance !== null && (
                            <div className="flex justify-between">
                              <p className="text-sm tracking-wider">Left</p>
                              <span className="text-xs text-gray-500">
                                {program.completionBalance?.toLocaleString(
                                  "en-US",
                                )}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Referrers */}
                        {(program.referrerLimit !== null ||
                          (program.referrerTotal ?? 0) > 0) && (
                          <div className="border-gray-light flex flex-col gap-1 border-t pt-2">
                            <p className="text-[10px] font-semibold tracking-wider text-gray-400 uppercase">
                              Referrers
                            </p>
                            {program.referrerLimit !== null && (
                              <div className="flex justify-between">
                                <p className="text-sm tracking-wider">Limit</p>
                                <span className="text-xs text-gray-500">
                                  {program.referrerLimit.toLocaleString(
                                    "en-US",
                                  )}
                                </span>
                              </div>
                            )}
                            <div className="flex justify-between">
                              <p className="text-sm tracking-wider">Total</p>
                              <span className="text-xs text-gray-500">
                                {program.referrerTotal?.toLocaleString(
                                  "en-US",
                                ) ?? 0}
                              </span>
                            </div>
                            {program.referrerLimit !== null && (
                              <div className="flex justify-between">
                                <p className="text-sm tracking-wider">Left</p>
                                <span className="text-xs text-gray-500">
                                  {(
                                    program.referrerLimit -
                                    (program.referrerTotal ?? 0)
                                  ).toLocaleString("en-US")}
                                </span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* ZLTO Rewards */}
                        <div className="border-gray-light flex flex-col gap-1 border-t pt-2">
                          <p className="text-[10px] font-semibold tracking-wider text-gray-400 uppercase">
                            ZLTO Rewards
                          </p>
                          {program.zltoRewardPool ? (
                            <>
                              <div className="flex justify-between">
                                <p className="text-sm tracking-wider">Pool</p>
                                <span className="text-xs text-gray-500">
                                  {program.zltoRewardPool.toLocaleString(
                                    "en-US",
                                  )}
                                </span>
                              </div>
                              {program.zltoRewardBalance !== null && (
                                <div className="flex justify-between">
                                  <p className="text-sm tracking-wider">Left</p>
                                  <span className="text-xs text-gray-500">
                                    {program.zltoRewardBalance.toLocaleString(
                                      "en-US",
                                    )}
                                  </span>
                                </div>
                              )}
                              {program.zltoRewardCumulative !== null && (
                                <div className="flex justify-between">
                                  <p className="text-sm tracking-wider">Used</p>
                                  <span className="text-xs text-gray-500">
                                    {program.zltoRewardCumulative.toLocaleString(
                                      "en-US",
                                    )}
                                  </span>
                                </div>
                              )}
                            </>
                          ) : (
                            <span className="text-xs text-gray-500">None</span>
                          )}
                        </div>

                        {/* Features */}
                        {(program.proofOfPersonhoodRequired ||
                          program.pathwayRequired ||
                          program.isDefault ||
                          program.hidden) && (
                          <div className="border-gray-light flex flex-col gap-1 border-t pt-2">
                            <p className="text-[10px] font-semibold tracking-wider text-gray-400 uppercase">
                              Features
                            </p>
                            {program.proofOfPersonhoodRequired && (
                              <div className="flex items-center gap-1">
                                <IoPersonCircle className="text-green h-4 w-4 shrink-0" />
                                <p className="text-sm tracking-wider">
                                  Proof of Personhood
                                </p>
                              </div>
                            )}
                            {program.pathwayRequired && (
                              <div className="flex items-center gap-1">
                                <IoGitNetwork className="text-green h-4 w-4 shrink-0" />
                                <p className="text-sm tracking-wider">
                                  Pathway
                                </p>
                              </div>
                            )}
                            {program.isDefault && (
                              <div className="flex items-center gap-1">
                                <IoStarOutline className="text-green h-4 w-4 shrink-0" />
                                <p className="text-sm tracking-wider">
                                  Default
                                </p>
                              </div>
                            )}
                            {program.hidden && (
                              <div className="flex items-center gap-1">
                                <IoEyeOffOutline className="text-green h-4 w-4 shrink-0" />
                                <p className="text-sm tracking-wider">Hidden</p>
                              </div>
                            )}
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
                        Referral Program
                      </th>
                      <th className="border-gray-light border-b-2">Referees</th>
                      <th className="border-gray-light border-b-2">
                        Referrers
                      </th>
                      <th className="border-gray-light border-b-2">
                        ZLTO Rewards
                      </th>
                      <th className="border-gray-light border-b-2">Features</th>
                      <th className="border-gray-light border-b-2">Status</th>
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

                              <p className="line-clamp-1 max-w-56 truncate text-sm">
                                {program.summary ?? program.description}
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
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="border-gray-light text-gray-dark border-b-2 !align-top">
                          <div className="flex flex-col gap-1 text-xs">
                            <div className="flex gap-2">
                              <span className="text-gray-dark w-10 font-bold">
                                Limit:
                              </span>
                              <span>
                                {program.completionLimit?.toLocaleString(
                                  "en-US",
                                ) ?? "No limit"}
                              </span>
                            </div>
                            <div className="flex gap-2">
                              <span className="text-gray-dark w-16 font-bold">
                                Completed:
                              </span>
                              <span>
                                {program.completionTotal?.toLocaleString(
                                  "en-US",
                                ) ?? 0}
                              </span>
                            </div>
                            {program.completionBalance !== null && (
                              <div className="flex gap-2">
                                <span className="text-gray-dark w-10 font-bold">
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
                            {program.referrerLimit !== null && (
                              <div className="flex gap-2">
                                <span className="text-gray-dark w-10 font-bold">
                                  Limit:
                                </span>
                                <span>
                                  {program.referrerLimit.toLocaleString(
                                    "en-US",
                                  )}
                                </span>
                              </div>
                            )}
                            <div className="flex gap-2">
                              <span className="text-gray-dark w-10 font-bold">
                                Total:
                              </span>
                              <span>
                                {program.referrerTotal?.toLocaleString(
                                  "en-US",
                                ) ?? 0}
                              </span>
                            </div>
                            {program.referrerLimit !== null && (
                              <div className="flex gap-2">
                                <span className="text-gray-dark w-10 font-bold">
                                  Left:
                                </span>
                                <span>
                                  {(
                                    program.referrerLimit -
                                    (program.referrerTotal ?? 0)
                                  ).toLocaleString("en-US")}
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
                              <span className="text-gray-400">None</span>
                            )}
                          </div>
                        </td>
                        <td className="border-gray-light border-b-2 !align-top">
                          <div className="flex flex-col gap-1 text-xs">
                            {program.proofOfPersonhoodRequired && (
                              <div className="flex items-center gap-1">
                                <IoPersonCircle className="text-green h-4 w-4 shrink-0" />
                                <span className="text-gray-dark font-semibold">
                                  Proof of Personhood
                                </span>
                              </div>
                            )}
                            {program.pathwayRequired && (
                              <div className="flex items-center gap-1">
                                <IoGitNetwork className="text-green h-4 w-4 shrink-0" />
                                <span className="text-gray-dark font-semibold">
                                  Pathway
                                </span>
                              </div>
                            )}
                            {program.isDefault && (
                              <div className="flex items-center gap-1">
                                <IoStarOutline className="text-green h-4 w-4 shrink-0" />
                                <span className="text-gray-dark font-semibold">
                                  Default
                                </span>
                              </div>
                            )}
                            {program.hidden && (
                              <div className="flex items-center gap-1">
                                <IoEyeOffOutline className="text-green h-4 w-4 shrink-0" />
                                <span className="text-gray-dark font-semibold">
                                  Hidden
                                </span>
                              </div>
                            )}
                            {!program.proofOfPersonhoodRequired &&
                              !program.pathwayRequired &&
                              !program.isDefault &&
                              !program.hidden && (
                                <span className="text-gray-400">None</span>
                              )}
                          </div>
                        </td>
                        <td className="border-gray-light border-b-2 !align-top">
                          <ProgramStatusBadge status={program.status} />
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
