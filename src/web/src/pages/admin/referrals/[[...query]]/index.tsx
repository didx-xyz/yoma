import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { type GetServerSidePropsContext } from "next";
import { getServerSession } from "next-auth";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import {
  useCallback,
  useMemo,
  useRef,
  useState,
  type ReactElement,
} from "react";
import { FaPlusCircle } from "react-icons/fa";
import { IoIosSettings } from "react-icons/io";
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
import CustomModal from "~/components/Common/CustomModal";
import DropdownMenu from "~/components/Common/DropdownMenu";
import ListPageFilterBadges from "~/components/Common/ListPage/ListPageFilterBadges";
import {
  ListPagePagination,
  ListPageResults,
} from "~/components/Common/ListPage/ListPageResults";
import ListPageSearchToolbar, {
  LIST_PAGE_TOOLBAR_BUTTON_CLASSES,
} from "~/components/Common/ListPage/ListPageSearchToolbar";
import ListPageStatusTabs from "~/components/Common/ListPage/ListPageStatusTabs";
import {
  buildListPageQueryString,
  getAppliedFilterCount,
  getFilterKeyParts,
  isSearchPerformed as getIsSearchPerformed,
  parseStatusTab,
  type ListPageRouterQuery,
} from "~/components/Common/ListPage/listPageFilter";
import { NoImage } from "~/components/Common/NoImage";
import MainLayout from "~/components/Layout/Main";
import NoRowsMessage from "~/components/NoRowsMessage";
import { PageBackground } from "~/components/PageBackground";
import { AdminReferralProgramActions } from "~/components/Referrals/AdminReferralProgramActions";
import ReferralProgramAdminFilterVertical, {
  ReferralProgramFilterOptions,
} from "~/components/Referrals/ReferralProgramAdminFilterVertical";
import {
  isReferralProgramFilterMappingReady,
  mapReferralProgramFilterToApi,
  parseReferralProgramFilterFromQuery,
  REFERRAL_PROGRAM_FILTER_SPEC,
  REFERRAL_PROGRAM_STATUS_PARAM,
} from "~/components/Referrals/referralProgramAdminFilter";
import { ProgramStatusBadge } from "~/components/Referrals/ProgramStatusBadge";
import { InternalServerError } from "~/components/Status/InternalServerError";
import { Unauthenticated } from "~/components/Status/Unauthenticated";
import { Unauthorized } from "~/components/Status/Unauthorized";
import {
  useReferralProgramCountQuery,
  useReferralProgramsAdminQuery,
} from "~/hooks/useReferralProgramMutations";
import { DATE_FORMAT_HUMAN, PAGE_SIZE, THEME_BLUE } from "~/lib/constants";
import { getSafeUrl, utcToDateInput } from "~/lib/utils";
import { type NextPageWithLayout } from "~/pages/_app";
import { authOptions } from "~/server/auth";

const getErrorStatus = (error: unknown): number | null => {
  if (!axios.isAxiosError(error)) return null;
  return error.response?.status ?? null;
};

// SSR is used only to establish auth state — the filters come from router.query.
export async function getServerSideProps(context: GetServerSidePropsContext) {
  const session = await getServerSession(context.req, context.res, authOptions);
  const { returnUrl } = context.query;

  if (!session) {
    return {
      props: {
        error: 401,
      },
    };
  }

  return {
    props: {
      returnUrl: returnUrl ?? null,
      error: null,
    },
  };
}

const ReferralPrograms: NextPageWithLayout<{
  returnUrl?: string;
  error?: number | null;
}> = ({ returnUrl, error }) => {
  const router = useRouter();
  const myRef = useRef<HTMLDivElement>(null);
  const [filterFullWindowVisible, setFilterFullWindowVisible] = useState(false);

  // 👇 filters are driven by the querystring
  const routerQuery = router.query as ListPageRouterQuery;
  const status = useMemo(
    () => parseStatusTab(routerQuery, REFERRAL_PROGRAM_FILTER_SPEC),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [router.query],
  );

  // display (name-based) filter — what the filter modal and the badges bind to
  const searchFilter = useMemo<ProgramSearchFilterAdmin>(
    () => parseReferralProgramFilterFromQuery(routerQuery, PAGE_SIZE),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [router.query],
  );

  const isSearchPerformed = useMemo(
    () => getIsSearchPerformed(routerQuery, REFERRAL_PROGRAM_FILTER_SPEC),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [router.query],
  );

  const appliedFilterCount = useMemo(
    () => getAppliedFilterCount(searchFilter, REFERRAL_PROGRAM_FILTER_SPEC),
    [searchFilter],
  );

  //#region LOOKUPS
  const { data: lookups_countries } = useQuery<Country[]>({
    queryKey: ["countries"],
    queryFn: () => getCountries(),
    enabled: !error,
  });
  //#endregion LOOKUPS

  // the filter values from the querystring are mapped to their corresponding id's
  const apiFilter = useMemo<ProgramSearchFilterAdmin>(
    () =>
      mapReferralProgramFilterToApi(searchFilter, {
        countries: lookups_countries,
      }),
    [searchFilter, lookups_countries],
  );

  // only search once the lookups needed to map the applied filters have loaded
  const filterMappingReady = useMemo(
    () =>
      isReferralProgramFilterMappingReady(searchFilter, {
        countries: lookups_countries,
      }),
    [searchFilter, lookups_countries],
  );

  const filterKeyParts = useMemo(
    () => getFilterKeyParts(routerQuery, REFERRAL_PROGRAM_FILTER_SPEC),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [router.query],
  );

  const {
    data: searchResults,
    isLoading: isLoadingSearchResults,
    isPlaceholderData: isShowingPreviousResults,
    error: searchResultsError,
  } = useReferralProgramsAdminQuery(apiFilter, filterKeyParts, {
    enabled: !error && filterMappingReady,
  });

  // status tab counts — these honour every applied filter
  const countsEnabled = !error && filterMappingReady;
  const { data: totalCountAll } = useReferralProgramCountQuery(
    apiFilter,
    null,
    filterKeyParts,
    { enabled: countsEnabled },
  );
  const { data: totalCountActive } = useReferralProgramCountQuery(
    apiFilter,
    ProgramStatus[ProgramStatus.Active],
    filterKeyParts,
    { enabled: countsEnabled },
  );
  const { data: totalCountInactive } = useReferralProgramCountQuery(
    apiFilter,
    ProgramStatus[ProgramStatus.Inactive],
    filterKeyParts,
    { enabled: countsEnabled },
  );
  const { data: totalCountExpired } = useReferralProgramCountQuery(
    apiFilter,
    ProgramStatus[ProgramStatus.Expired],
    filterKeyParts,
    { enabled: countsEnabled },
  );
  const { data: totalCountDeleted } = useReferralProgramCountQuery(
    apiFilter,
    ProgramStatus[ProgramStatus.Deleted],
    filterKeyParts,
    { enabled: countsEnabled },
  );
  const { data: totalCountLimitReached } = useReferralProgramCountQuery(
    apiFilter,
    ProgramStatus[ProgramStatus.LimitReached],
    filterKeyParts,
    { enabled: countsEnabled },
  );
  const { data: totalCountUnCompletable } = useReferralProgramCountQuery(
    apiFilter,
    ProgramStatus[ProgramStatus.UnCompletable],
    filterKeyParts,
    { enabled: countsEnabled },
  );

  const tabCounts = useMemo(
    () => ({
      all: totalCountAll,
      [ProgramStatus[ProgramStatus.Active]]: totalCountActive,
      [ProgramStatus[ProgramStatus.Inactive]]: totalCountInactive,
      [ProgramStatus[ProgramStatus.Expired]]: totalCountExpired,
      [ProgramStatus[ProgramStatus.Deleted]]: totalCountDeleted,
      [ProgramStatus[ProgramStatus.LimitReached]]: totalCountLimitReached,
      [ProgramStatus[ProgramStatus.UnCompletable]]: totalCountUnCompletable,
    }),
    [
      totalCountAll,
      totalCountActive,
      totalCountInactive,
      totalCountExpired,
      totalCountDeleted,
      totalCountLimitReached,
      totalCountUnCompletable,
    ],
  );

  const resolvedError =
    error ?? getErrorStatus(searchResultsError) ?? undefined;

  // 🎈 FUNCTIONS
  const redirectWithSearchFilterParams = useCallback(
    (filter: ProgramSearchFilterAdmin) => {
      let url = `/admin/referrals`;
      const params = buildListPageQueryString(
        filter,
        REFERRAL_PROGRAM_FILTER_SPEC,
      );
      if (params != null && params.size > 0)
        url = `${url}?${params.toString()}`;

      if (url != router.asPath)
        void router.push(url, undefined, { scroll: false });
    },
    [router],
  );

  // querystring of the current filters excluding status & paging (used by the tabs)
  const tabBaseParams = useMemo(
    () =>
      buildListPageQueryString(
        { ...searchFilter, statuses: null },
        REFERRAL_PROGRAM_FILTER_SPEC,
      ),
    [searchFilter],
  );

  //#region Event Handlers
  const handlePagerChange = useCallback(
    (value: number) => {
      redirectWithSearchFilterParams({ ...searchFilter, pageNumber: value });
    },
    [searchFilter, redirectWithSearchFilterParams],
  );

  const onSearchInputSubmit = useCallback(
    (query: string) => {
      redirectWithSearchFilterParams({
        ...searchFilter,
        pageNumber: 1,
        valueContains: query.length > 2 ? query : null,
      });
    },
    [searchFilter, redirectWithSearchFilterParams],
  );

  const onCloseFilter = useCallback(() => {
    setFilterFullWindowVisible(false);
  }, []);

  const onSubmitFilter = useCallback(
    (filter: ProgramSearchFilterAdmin) => {
      setFilterFullWindowVisible(false);
      // the status tab is preserved; paging is reset when filters change
      redirectWithSearchFilterParams({
        ...filter,
        statuses: filter.statuses ?? searchFilter.statuses,
        pageNumber: 1,
      });
    },
    [redirectWithSearchFilterParams, searchFilter.statuses],
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
        <title>Yoma | 🎯 Referral Programs</title>
      </Head>

      <PageBackground className="h-[14.3rem] md:h-[18.4rem]" />

      {/* REFERENCE FOR FILTER POPUP: fix menu z-index issue */}
      <div ref={myRef} />

      {/* POPUP FILTER */}
      <CustomModal
        isOpen={filterFullWindowVisible}
        shouldCloseOnOverlayClick={true}
        onRequestClose={onCloseFilter}
        className={`md:max-h-[400px] md:w-[600px]`}
      >
        {lookups_countries && (
          <div className="flex h-full flex-col gap-2 overflow-y-auto">
            <ReferralProgramAdminFilterVertical
              htmlRef={myRef.current!}
              searchFilter={searchFilter}
              lookups_countries={lookups_countries}
              onCancel={onCloseFilter}
              onSubmit={onSubmitFilter}
              filterOptions={[
                ReferralProgramFilterOptions.COUNTRIES,
                ReferralProgramFilterOptions.DATE_RANGE,
              ]}
            />
          </div>
        )}
      </CustomModal>

      <div className="z-10 container mt-14 max-w-7xl px-2 py-8 md:mt-[7rem]">
        <div className="flex flex-col gap-4 py-4">
          <h3 className="mt-3 mb-6 flex items-center text-xl font-semibold tracking-normal whitespace-nowrap text-white md:mt-0 md:mb-9 md:text-3xl">
            🎯 Referral Programs
          </h3>

          {/* TABBED NAVIGATION */}
          <ListPageStatusTabs
            basePath="/admin/referrals"
            baseParams={tabBaseParams}
            statusSpec={REFERRAL_PROGRAM_STATUS_PARAM}
            status={status}
            counts={tabCounts}
            idPrefix="referral_program"
          />

          {/* SEARCH & FILTERS */}
          <ListPageSearchToolbar
            defaultValue={searchFilter.valueContains}
            onSearch={onSearchInputSubmit}
            openFilter={setFilterFullWindowVisible}
            appliedFilterCount={appliedFilterCount}
          >
            <DropdownMenu
              label="Actions"
              triggerIcon={<IoIosSettings className="h-5 w-5" />}
              // sized & coloured to match the Filters button next to it
              className="w-full md:w-40"
              buttonClassName={LIST_PAGE_TOOLBAR_BUTTON_CLASSES}
              items={[
                {
                  label: "Create Program",
                  href: `/admin/referrals/create${`?returnUrl=${encodeURIComponent(
                    getSafeUrl(returnUrl?.toString(), router.asPath),
                  )}`}`,
                  icon: <FaPlusCircle className="h-4 w-4" />,
                  id: "btnCreateProgram",
                },
              ]}
            />
          </ListPageSearchToolbar>

          {/* APPLIED FILTER BADGES */}
          {appliedFilterCount > 0 && (
            <ListPageFilterBadges<ProgramSearchFilterAdmin>
              searchFilter={searchFilter}
              spec={REFERRAL_PROGRAM_FILTER_SPEC}
              onSubmit={onSubmitFilter}
              className="-ml-2"
              resolveValue={(key, value) => {
                if (key === "dateStart")
                  return `From ${utcToDateInput(value as string) || value}`;
                if (key === "dateEnd")
                  return `To ${utcToDateInput(value as string) || value}`;
                return value;
              }}
            />
          )}
        </div>

        {/* MAIN CONTENT */}
        <ListPageResults
          isLoading={isLoadingSearchResults}
          isShowingPreviousResults={isShowingPreviousResults}
          id="results"
        >
          {/* NO ROWS */}
          {searchResults && searchResults.items?.length === 0 && (
            <div className="flex h-fit flex-col items-center rounded-lg bg-white pb-8 md:pb-16">
              <NoRowsMessage
                title={"No referral programs found"}
                description={
                  isSearchPerformed
                    ? "Please try refining your search query."
                    : status !== null
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
                    <div className="flex flex-row items-center gap-2 pb-2">
                      {/* Program Image */}
                      {program.imageURL ? (
                        <Image
                          src={program.imageURL}
                          alt={program.name}
                          width={48}
                          height={48}
                          className="shrink-0 rounded-lg border border-gray-200 bg-white object-cover shadow-md"
                          style={{
                            width: "48px",
                            height: "48px",
                            minWidth: "48px",
                            minHeight: "48px",
                          }}
                        />
                      ) : (
                        <div
                          className="shrink-0 overflow-hidden rounded-lg border border-gray-200 shadow-md"
                          style={{ width: "48px", height: "48px" }}
                        >
                          <NoImage iconOnly />
                        </div>
                      )}

                      <div className="flex min-w-0 flex-1 flex-col">
                        <div className="flex min-w-0 items-center gap-2">
                          <Link
                            href={`/admin/referrals/${program.id}/info${`?returnUrl=${encodeURIComponent(
                              getSafeUrl(returnUrl?.toString(), router.asPath),
                            )}`}`}
                            className="min-w-0 flex-1 truncate text-start font-semibold"
                          >
                            {program.name}
                          </Link>
                          {program.isDefault && (
                            <span className="badge bg-blue-light badge-sm text-blue flex-shrink-0">
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
                            {program.completionLimit?.toLocaleString("en-US") ??
                              "No limit"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <p className="text-sm tracking-wider">Completed</p>
                          <span className="text-xs text-gray-500">
                            {program.completionTotal?.toLocaleString("en-US") ??
                              0}
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

                      {/* Ambassadors */}
                      {(program.referrerLimit !== null ||
                        (program.referrerTotal ?? 0) > 0) && (
                        <div className="border-gray-light flex flex-col gap-1 border-t pt-2">
                          <p className="text-[10px] font-semibold tracking-wider text-gray-400 uppercase">
                            Ambassadors
                          </p>
                          {program.referrerLimit !== null && (
                            <div className="flex justify-between">
                              <p className="text-sm tracking-wider">Limit</p>
                              <span className="text-xs text-gray-500">
                                {program.referrerLimit.toLocaleString("en-US")}
                              </span>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <p className="text-sm tracking-wider">Total</p>
                            <span className="text-xs text-gray-500">
                              {program.referrerTotal?.toLocaleString("en-US") ??
                                0}
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
                                {program.zltoRewardPool.toLocaleString("en-US")}
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
                              <p className="text-sm tracking-wider">Pathway</p>
                            </div>
                          )}
                          {program.isDefault && (
                            <div className="flex items-center gap-1">
                              <IoStarOutline className="text-green h-4 w-4 shrink-0" />
                              <p className="text-sm tracking-wider">Default</p>
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
              <table className="border-gray-light hidden w-full border-separate rounded-lg bg-white md:table">
                <thead>
                  <tr className="border-gray text-gray-dark">
                    <th className="border-gray-light !py-4">
                      Referral Program
                    </th>
                    <th className="border-gray-light">Referees</th>
                    <th className="border-gray-light">Ambassadors</th>
                    <th className="border-gray-light">ZLTO Rewards</th>
                    <th className="border-gray-light">Features</th>
                    <th className="border-gray-light">Status</th>
                    <th className="border-gray-light text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {searchResults.items.map((program) => (
                    <tr key={`md_${program.id}`}>
                      <td className="border-gray-light border-t-2 !align-top">
                        <div className="flex flex-row gap-4">
                          <Link
                            href={`/admin/referrals/${program.id}/info${`?returnUrl=${encodeURIComponent(
                              getSafeUrl(returnUrl?.toString(), router.asPath),
                            )}`}`}
                            className="flex justify-center"
                          >
                            {program.imageURL ? (
                              <Image
                                src={program.imageURL}
                                alt={program.name}
                                width={60}
                                height={60}
                                className="rounded-lg bg-white object-cover shadow-md"
                                style={{
                                  width: "60px",
                                  height: "60px",
                                  minWidth: "60px",
                                  minHeight: "60px",
                                }}
                              />
                            ) : (
                              <div
                                className="overflow-hidden rounded-lg bg-white shadow-md"
                                style={{ width: "60px", height: "60px" }}
                              >
                                <NoImage iconOnly />
                              </div>
                            )}
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
                      <td className="border-gray-light text-gray-dark border-t-2 !align-top">
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
                      <td className="border-gray-light text-gray-dark border-t-2 !align-top">
                        <div className="flex flex-col gap-1 text-xs">
                          {program.referrerLimit !== null && (
                            <div className="flex gap-2">
                              <span className="text-gray-dark w-10 font-bold">
                                Limit:
                              </span>
                              <span>
                                {program.referrerLimit.toLocaleString("en-US")}
                              </span>
                            </div>
                          )}
                          <div className="flex gap-2">
                            <span className="text-gray-dark w-10 font-bold">
                              Total:
                            </span>
                            <span>
                              {program.referrerTotal?.toLocaleString("en-US") ??
                                0}
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
                      <td className="border-gray-light text-gray-dark border-t-2 !align-top">
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
                      <td className="border-gray-light border-t-2 !align-top">
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
                      <td className="border-gray-light border-t-2 !align-top">
                        <ProgramStatusBadge status={program.status} />
                      </td>
                      <td className="border-gray-light border-t-2 !align-top">
                        <div className="flex flex-row items-center justify-center gap-2">
                          <AdminReferralProgramActions
                            program={program}
                            returnUrl={router.asPath}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* PAGINATION */}
              <ListPagePagination
                currentPage={searchFilter.pageNumber ?? 1}
                totalItems={searchResults?.totalCount ?? 0}
                pageSize={PAGE_SIZE}
                onClick={handlePagerChange}
                isShowingPreviousResults={isShowingPreviousResults}
              />
            </>
          )}
        </ListPageResults>
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
