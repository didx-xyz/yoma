import type { GetServerSidePropsContext } from "next";
import { getServerSession } from "next-auth";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import iconZlto from "public/images/icon-zlto.svg";
import {
  useCallback,
  useMemo,
  useRef,
  useState,
  type ReactElement,
} from "react";
import { FaDownload } from "react-icons/fa";
import { IoMdPerson } from "react-icons/io";
import {
  Status,
  type OpportunitySearchFilterAdmin,
  type OpportunityType,
} from "~/api/models/opportunity";
import { getOpportunityTypes } from "~/api/services/opportunities";
import {
  useAdminOpportunityCategoriesQuery,
  useAdminOpportunityCountriesQuery,
  useAdminOpportunityLanguagesQuery,
  useAdminOpportunityOrganisationsQuery,
  useAdminOpportunitiesSearchQuery,
  useOpportunityCustomFieldDefinitionsQuery,
  useOpportunityStatusCountQuery,
} from "~/hooks/useOpportunityMutations";
import CustomModal from "~/components/Common/CustomModal";
import DropdownMenu from "~/components/Common/DropdownMenu";
import MainLayout from "~/components/Layout/Main";
import NoRowsMessage from "~/components/NoRowsMessage";
import OpportunityExport from "~/components/Opportunity/Admin/OpportunityExport";
import OpportunityAdminFilterBadges from "~/components/Opportunity/Admin/OpportunityAdminFilterBadges";
import OpportunityAdminSearchToolbar from "~/components/Opportunity/Admin/OpportunityAdminSearchToolbar";
import OpportunityAdminStatusTabs from "~/components/Opportunity/Admin/OpportunityAdminStatusTabs";
import {
  filterToQueryString,
  getAppliedFilterCount,
  getFilterKeyParts,
  isFilterMappingReady,
  isSearchPerformed as getIsSearchPerformed,
  mapFilterToApi,
  OPPORTUNITY_ADMIN_FILTER_OPTIONS_ALL_ORGS,
  parseFilterFromQuery,
  parseStatusParam,
  type OpportunityAdminRouterQuery,
} from "~/components/Opportunity/Admin/opportunityAdminFilter";
import {
  OpportunityActions,
  OpportunityActionOptions,
} from "~/components/Opportunity/OpportunityActions";
import PullSyncBadge from "~/components/Opportunity/Badges/PullSyncBadge";
import { OpportunityAdminFilterVertical } from "~/components/Opportunity/OpportunityAdminFilterVertical";
import OpportunityStatus from "~/components/Opportunity/OpportunityStatus";
import { PageBackground } from "~/components/PageBackground";
import { PaginationButtons } from "~/components/PaginationButtons";
import { InternalServerError } from "~/components/Status/InternalServerError";
import { LoadingInline } from "~/components/Status/LoadingInline";
import { LoadingSkeleton } from "~/components/Status/LoadingSkeleton";
import { Unauthenticated } from "~/components/Status/Unauthenticated";
import { Unauthorized } from "~/components/Status/Unauthorized";
import { PAGE_SIZE, ROLE_ADMIN, THEME_BLUE } from "~/lib/constants";
import { type NextPageWithLayout } from "~/pages/_app";
import { authOptions } from "~/server/auth";

// ⚠️ SSR
export async function getServerSideProps(context: GetServerSidePropsContext) {
  // 👇 ensure authenticated and authorized
  const session = await getServerSession(context.req, context.res, authOptions);
  if (!session) {
    return {
      props: {
        error: 401,
      },
    };
  }
  if (!session.user?.roles?.includes(ROLE_ADMIN)) {
    return {
      props: {
        error: 403,
      },
    };
  }

  const lookups_types = await getOpportunityTypes(context);

  return {
    props: {
      lookups_types,
    },
  };
}

const OpportunitiesAdmin: NextPageWithLayout<{
  lookups_types: OpportunityType[];
  error?: number;
}> = ({ lookups_types, error }) => {
  const router = useRouter();
  const myRef = useRef<HTMLDivElement>(null);
  const [filterFullWindowVisible, setFilterFullWindowVisible] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);

  // 👇 filters are driven by the querystring (shared vocabulary with the org-admin page)
  const routerQuery = router.query as OpportunityAdminRouterQuery;
  const { query, status: statusParam } = routerQuery;
  const status = useMemo(() => parseStatusParam(statusParam), [statusParam]);

  // display (name-based) filter — what the filter modal and the badges bind to
  const searchFilter = useMemo<OpportunitySearchFilterAdmin>(
    () => parseFilterFromQuery(routerQuery, PAGE_SIZE),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [router.query],
  );

  const isSearchPerformed = useMemo(
    () => getIsSearchPerformed(routerQuery),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [router.query],
  );

  const appliedFilterCount = useMemo(
    () => getAppliedFilterCount(searchFilter),
    [searchFilter],
  );

  //#region LOOKUPS
  // definitions are keyed on the selected types, so they refetch when types change
  const { data: lookups_customFieldDefinitions } =
    useOpportunityCustomFieldDefinitionsQuery(searchFilter.types ?? null, {
      enabled: !error,
    });

  const { data: lookups_categories } = useAdminOpportunityCategoriesQuery(
    null,
    { enabled: !error },
  );

  const { data: lookups_countries } = useAdminOpportunityCountriesQuery(null, {
    enabled: !error,
  });

  const { data: lookups_languages } = useAdminOpportunityLanguagesQuery(null, {
    enabled: !error,
  });

  const { data: lookups_organisations } = useAdminOpportunityOrganisationsQuery(
    { enabled: !error },
  );
  //#endregion LOOKUPS

  // the filter values from the querystring are mapped to their corresponding id's
  const apiFilter = useMemo<OpportunitySearchFilterAdmin>(
    () =>
      mapFilterToApi(searchFilter, {
        types: lookups_types,
        categories: lookups_categories,
        countries: lookups_countries,
        languages: lookups_languages,
        organisations: lookups_organisations,
      }),
    [
      searchFilter,
      lookups_types,
      lookups_categories,
      lookups_countries,
      lookups_languages,
      lookups_organisations,
    ],
  );

  // only search once the lookups needed to map the applied filters have loaded
  const filterMappingReady = useMemo(
    () =>
      isFilterMappingReady(searchFilter, {
        types: lookups_types,
        categories: lookups_categories,
        countries: lookups_countries,
        languages: lookups_languages,
        organisations: lookups_organisations,
      }),
    [
      searchFilter,
      lookups_types,
      lookups_categories,
      lookups_countries,
      lookups_languages,
      lookups_organisations,
    ],
  );

  const filterKeyParts = useMemo(
    () => getFilterKeyParts(routerQuery),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [router.query],
  );

  // QUERY: SEARCH RESULTS
  const {
    data: searchResults,
    isLoading: isLoadingSearchResults,
    isPlaceholderData: isShowingPreviousResults,
  } = useAdminOpportunitiesSearchQuery(apiFilter, [filterKeyParts], {
    enabled: !error && filterMappingReady,
  });

  // status tab counts — these honour every applied filter
  const countsEnabled = !error && filterMappingReady;
  const { data: totalCountAll } = useOpportunityStatusCountQuery(
    null,
    apiFilter,
    null,
    filterKeyParts,
    { enabled: countsEnabled },
  );
  const { data: totalCountActive } = useOpportunityStatusCountQuery(
    null,
    apiFilter,
    Status.Active,
    filterKeyParts,
    { enabled: countsEnabled },
  );
  const { data: totalCountInactive } = useOpportunityStatusCountQuery(
    null,
    apiFilter,
    Status.Inactive,
    filterKeyParts,
    { enabled: countsEnabled },
  );
  const { data: totalCountExpired } = useOpportunityStatusCountQuery(
    null,
    apiFilter,
    Status.Expired,
    filterKeyParts,
    { enabled: countsEnabled },
  );
  const { data: totalCountDeleted } = useOpportunityStatusCountQuery(
    null,
    apiFilter,
    Status.Deleted,
    filterKeyParts,
    { enabled: countsEnabled },
  );

  const tabCounts = useMemo(
    () => ({
      all: totalCountAll,
      [Status.Active]: totalCountActive,
      [Status.Inactive]: totalCountInactive,
      [Status.Expired]: totalCountExpired,
      [Status.Deleted]: totalCountDeleted,
    }),
    [
      totalCountAll,
      totalCountActive,
      totalCountInactive,
      totalCountExpired,
      totalCountDeleted,
    ],
  );

  // 🎈 FUNCTIONS
  const redirectWithSearchFilterParams = useCallback(
    (filter: OpportunitySearchFilterAdmin) => {
      let url = "/admin/opportunities";
      const params = filterToQueryString(filter);
      if (params != null && params.size > 0)
        url = `/admin/opportunities?${params.toString()}`;

      if (url != router.asPath)
        void router.push(url, undefined, { scroll: false });
    },
    [router],
  );

  // querystring of the current filters excluding status & paging (used by the tabs)
  const tabBaseParams = useMemo(
    () => filterToQueryString({ ...searchFilter, statuses: null }),
    [searchFilter],
  );

  // 🔔 CHANGE EVENTS
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

  // filter popup handlers
  const onCloseFilter = useCallback(() => {
    setFilterFullWindowVisible(false);
  }, [setFilterFullWindowVisible]);

  const onSubmitFilter = useCallback(
    (filter: OpportunitySearchFilterAdmin) => {
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

  const onClearFilter = useCallback(() => {
    setFilterFullWindowVisible(false);
    void router.push("/admin/opportunities", undefined, { scroll: false });
  }, [router]);

  if (error) {
    if (error === 401) return <Unauthenticated />;
    else if (error === 403) return <Unauthorized />;
    else return <InternalServerError />;
  }

  return (
    <>
      <Head>
        <title>Yoma | 🏆 Opportunities</title>
      </Head>

      <PageBackground className="h-[14.3rem] md:h-[18.4rem]" />

      {/* POPUP FILTER */}
      <CustomModal
        isOpen={filterFullWindowVisible}
        shouldCloseOnOverlayClick={true}
        onRequestClose={() => {
          setFilterFullWindowVisible(false);
        }}
        className={`md:max-h-[600px] md:w-[800px]`}
      >
        {lookups_countries && lookups_languages && lookups_organisations && (
          <div className="flex h-full flex-col gap-2 overflow-y-auto">
            <OpportunityAdminFilterVertical
              htmlRef={myRef.current!}
              searchFilter={searchFilter}
              lookups_categories={lookups_categories ?? []}
              lookups_countries={lookups_countries}
              lookups_languages={lookups_languages}
              lookups_types={lookups_types}
              lookups_organisations={lookups_organisations}
              lookups_publishedStates={[]}
              lookups_statuses={[]} // status is owned by the tabs
              lookups_customFieldDefinitions={lookups_customFieldDefinitions}
              submitButtonText="Apply Filters"
              onCancel={onCloseFilter}
              onSubmit={onSubmitFilter}
              onClear={onClearFilter}
              clearButtonText="Clear All Filters"
              filterOptions={OPPORTUNITY_ADMIN_FILTER_OPTIONS_ALL_ORGS}
            />
          </div>
        )}
      </CustomModal>

      {/* EXPORT DIALOG */}
      <CustomModal
        isOpen={exportDialogOpen}
        shouldCloseOnOverlayClick={true}
        onRequestClose={() => {
          setExportDialogOpen(false);
        }}
        className={`md:max-h-[740px] md:w-[600px]`}
      >
        <OpportunityExport
          totalCount={searchResults?.totalCount ?? 0}
          searchFilter={apiFilter} // the export endpoint expects id's, not names
          onClose={() => setExportDialogOpen(false)}
          onSave={() => setExportDialogOpen(false)}
        />
      </CustomModal>

      {/* REFERENCE FOR FILTER POPUP: fix menu z-index issue */}
      <div ref={myRef} />

      <div className="z-10 container mt-14 max-w-7xl px-2 py-8 md:mt-[7rem]">
        <div className="flex flex-col gap-4 py-4">
          <h3 className="mt-3 mb-6 flex items-center text-xl font-semibold tracking-normal whitespace-nowrap text-white md:mt-0 md:mb-9 md:text-3xl">
            🏆 Opportunities
          </h3>

          {/* TABBED NAVIGATION */}
          <OpportunityAdminStatusTabs
            basePath="/admin/opportunities"
            baseParams={tabBaseParams}
            status={status}
            counts={tabCounts}
          />

          {/* SEARCH & FILTERS */}
          <OpportunityAdminSearchToolbar
            defaultValue={query?.toString() ?? null}
            onSearch={onSearchInputSubmit}
            openFilter={setFilterFullWindowVisible}
            appliedFilterCount={appliedFilterCount}
          >
            <DropdownMenu
              label="Actions"
              items={[
                {
                  label: "Export",
                  onClick: () => setExportDialogOpen(true),
                  icon: <FaDownload className="h-4 w-4" />,
                },
              ]}
            />
          </OpportunityAdminSearchToolbar>

          {/* APPLIED FILTER BADGES */}
          {appliedFilterCount > 0 && (
            <OpportunityAdminFilterBadges
              searchFilter={searchFilter}
              lookups_customFieldDefinitions={lookups_customFieldDefinitions}
              onSubmit={onSubmitFilter}
              className="-ml-2"
            />
          )}
        </div>

        {/* MAIN CONTENT */}
        {isLoadingSearchResults && (
          <div className="flex h-fit flex-col items-center rounded-lg bg-white p-8 md:pb-16">
            <LoadingSkeleton />
          </div>
        )}

        {/* SEARCH RESULTS */}
        {/* the previous page stays visible (dimmed) while the next one loads, so paging
            never changes the page height and never moves the scroll position */}
        {!isLoadingSearchResults && (
          <div
            id="results"
            className={`transition-opacity ${
              isShowingPreviousResults ? "opacity-50" : ""
            }`}
          >
            {/* <div className="rounded-lg bg-transparent md:bg-white md:p-4"> */}
            {/* NO ROWS */}
            {(!searchResults || searchResults.items?.length === 0) &&
              !isSearchPerformed &&
              status === null && (
                <div className="flex h-fit flex-col items-center rounded-lg bg-white pb-8 md:pb-16">
                  <NoRowsMessage
                    title={"You will find your opportunities here"}
                    description={
                      "This is where you will find all the awesome opportunities that have been created."
                    }
                  />
                </div>
              )}
            {(!searchResults || searchResults.items?.length === 0) &&
              (isSearchPerformed || status !== null) && (
                <div className="flex h-fit flex-col items-center rounded-lg bg-white pb-8 md:pb-16">
                  <NoRowsMessage
                    title={"No opportunities found"}
                    description={"Please try refining your search query."}
                  />
                </div>
              )}

            {/* RESULTS */}
            {searchResults && searchResults.items?.length > 0 && (
              <>
                {/* MOBILE */}
                <div className="flex flex-col gap-4 md:hidden">
                  {searchResults.items.map((opportunity) => (
                    <div
                      key={`sm_${opportunity.id}`}
                      className="shadow-custom flex flex-col justify-between gap-4 rounded-lg bg-white p-4"
                    >
                      <div className="border-gray-light flex flex-row gap-2 border-b-2 pb-2">
                        <span title={opportunity.title} className="w-full">
                          <Link
                            href={`/organisations/${opportunity.organizationId}/opportunities/${opportunity.id}/info?returnUrl=${encodeURIComponent(router.asPath)}`}
                            className="line-clamp-1 text-start font-semibold"
                          >
                            {opportunity.title}
                          </Link>
                          <PullSyncBadge opportunity={opportunity} />
                        </span>
                        <OpportunityActions
                          opportunity={opportunity}
                          user={{ roles: [ROLE_ADMIN] }}
                          organizationId={opportunity.organizationId}
                          returnUrl={router.asPath}
                          actionOptions={[
                            OpportunityActionOptions.EDIT_DETAILS,
                            OpportunityActionOptions.DOWNLOAD_COMPLETION_FILES,
                            OpportunityActionOptions.COPY_EXTERNAL_LINK,
                            OpportunityActionOptions.VIEW_ATTENDANCE_LINKS,
                            OpportunityActionOptions.CREATE_ATTENDANCE_LINK,
                            OpportunityActionOptions.MAKE_ACTIVE,
                            OpportunityActionOptions.MAKE_INACTIVE,
                            OpportunityActionOptions.MAKE_VISIBLE,
                            OpportunityActionOptions.MAKE_HIDDEN,
                            OpportunityActionOptions.MARK_FEATURED,
                            OpportunityActionOptions.UNMARK_FEATURED,
                            OpportunityActionOptions.DELETE,
                          ]}
                        />
                      </div>

                      <div className="text-gray-dark flex flex-col gap-2">
                        {/* ZLTO Reward */}
                        <div className="flex justify-between">
                          <p className="text-sm tracking-wider">ZLTO</p>
                          <div className="flex flex-col gap-2">
                            {opportunity.zltoReward == null && (
                              <span
                                className={`badge bg-orange-light text-orange px-4`}
                              >
                                <span className="ml-1 text-xs">Disabled</span>
                              </span>
                            )}
                            {opportunity.zltoReward != null && (
                              <span
                                className={`badge bg-gray-light text-gray-dark min-w-20 px-4`}
                              >
                                <Image
                                  src={iconZlto}
                                  alt="Zlto icon"
                                  width={16}
                                  className="h-auto"
                                />
                                <span className="ml-1 text-xs">
                                  {opportunity.zltoReward}
                                </span>
                              </span>
                            )}
                          </div>
                        </div>

                        {/* ZLTO Reward Cumulative */}
                        <div className="flex justify-between">
                          <p className="text-sm tracking-wider">
                            ZLTO Cumulative
                          </p>
                          <div className="flex flex-col gap-2">
                            <span
                              className={`badge bg-gray-light text-gray-dark min-w-20 px-4`}
                            >
                              <Image
                                src={iconZlto}
                                alt="Zlto icon"
                                width={16}
                                className="h-auto"
                              />
                              <span className="ml-1 text-xs">
                                {opportunity.zltoRewardCumulative ?? 0}
                              </span>
                            </span>
                          </div>
                        </div>

                        {/* Participants */}
                        <div className="flex justify-between">
                          <p className="text-sm tracking-wider">Participants</p>
                          <span
                            className={`badge min-w-20 ${opportunity.participantCountTotal > 0 ? "bg-green-light text-green" : "bg-gray-light text-gray-dark"}`}
                          >
                            <IoMdPerson className="h-4 w-4" />
                            <span className="ml-1 text-xs">
                              {opportunity.participantCountTotal}
                            </span>
                          </span>
                        </div>

                        {/* Status */}
                        <div className="flex justify-between">
                          <p className="text-sm tracking-wider">Status</p>
                          <div className="flex justify-start gap-2">
                            <OpportunityStatus
                              status={opportunity?.status?.toString()}
                            />
                          </div>
                        </div>

                        {/* Visible */}
                        <div className="flex justify-between">
                          <p className="text-sm tracking-wider">Visible</p>
                          <div className="flex justify-start gap-2">
                            {opportunity?.hidden ? (
                              <span className="badge bg-yellow-tint text-yellow w-20">
                                Hidden
                              </span>
                            ) : (
                              <span className="badge bg-green-light text-green w-20">
                                Visible
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* DESKTOP */}
                <table className="border-gray-light hidden border-separate rounded-lg bg-white md:table md:table-auto">
                  <thead>
                    <tr className="!border-gray-light text-gray-dark">
                      <th className="border-gray-light border-b-2 !py-4">
                        Title
                      </th>
                      <th className="border-gray-light border-b-2">ZLTO</th>
                      <th className="border-gray-light border-b-2">
                        ZLTO Cumulative
                      </th>
                      <th className="border-gray-light border-b-2">
                        Participants
                      </th>
                      <th className="border-gray-light border-b-2">Status</th>
                      <th className="border-gray-light border-b-2">Visible</th>
                      <th className="border-gray-light border-b-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {searchResults.items.map((opportunity) => (
                      <tr key={`md_${opportunity.id}`}>
                        <td className="border-gray-light border-b-2">
                          <span
                            className="tooltip tooltip-top tooltip-secondary"
                            data-tip={opportunity.title}
                          >
                            <Link
                              href={`/organisations/${opportunity.organizationId}/opportunities/${opportunity.id}/info?returnUrl=${encodeURIComponent(router.asPath)}`}
                              className="line-clamp-1 text-start"
                            >
                              {opportunity.title}
                            </Link>
                          </span>
                          <PullSyncBadge opportunity={opportunity} />
                        </td>
                        <td className="border-gray-light w-28 border-b-2 text-center">
                          {opportunity.zltoReward == null && (
                            <span
                              className={`badge bg-orange-light text-orange px-4`}
                            >
                              <span className="ml-1 text-xs">Disabled</span>
                            </span>
                          )}
                          {opportunity.zltoReward != null && (
                            <span
                              className={`badge bg-gray-light text-gray-dark px-4`}
                            >
                              <Image
                                src={iconZlto}
                                alt="Zlto icon"
                                width={16}
                                className="h-auto"
                              />
                              <span className="ml-1 text-xs">
                                {opportunity.zltoReward}
                              </span>
                            </span>
                          )}
                        </td>
                        <td className="border-gray-light w-28 border-b-2 text-center">
                          <span
                            className={`badge bg-gray-light text-gray-dark px-4`}
                          >
                            <Image
                              src={iconZlto}
                              alt="Zlto icon"
                              width={16}
                              className="h-auto"
                            />
                            <span className="ml-1 text-xs">
                              {opportunity.zltoRewardCumulative ?? 0}
                            </span>
                          </span>
                        </td>
                        <td className="border-gray-light border-b-2 text-center">
                          <span
                            className={`badge ${opportunity.participantCountTotal > 0 ? "bg-green-light text-green" : "bg-gray-light text-gray-dark"}`}
                          >
                            {opportunity.participantCountTotal}
                          </span>
                        </td>
                        <td className="border-gray-light border-b-2 text-center">
                          <OpportunityStatus
                            status={opportunity?.status?.toString()}
                          />
                        </td>
                        <td className="border-gray-light border-b-2 text-center">
                          {opportunity?.hidden ? (
                            <span className="badge bg-yellow-tint text-yellow w-20">
                              Hidden
                            </span>
                          ) : (
                            <span className="badge bg-green-light text-green w-20">
                              Visible
                            </span>
                          )}
                        </td>
                        <td className="border-gray-light border-b-2 whitespace-nowrap">
                          <div className="flex flex-row items-center justify-center gap-2">
                            {/* ACTIONS */}
                            <OpportunityActions
                              opportunity={opportunity}
                              user={{ roles: [ROLE_ADMIN] }}
                              organizationId={opportunity.organizationId}
                              returnUrl={router.asPath}
                              actionOptions={[
                                OpportunityActionOptions.EDIT_DETAILS,
                                OpportunityActionOptions.DOWNLOAD_COMPLETION_FILES,
                                OpportunityActionOptions.COPY_EXTERNAL_LINK,
                                OpportunityActionOptions.VIEW_ATTENDANCE_LINKS,
                                OpportunityActionOptions.CREATE_ATTENDANCE_LINK,
                                OpportunityActionOptions.MAKE_ACTIVE,
                                OpportunityActionOptions.MAKE_INACTIVE,
                                OpportunityActionOptions.MAKE_VISIBLE,
                                OpportunityActionOptions.MAKE_HIDDEN,
                                OpportunityActionOptions.MARK_FEATURED,
                                OpportunityActionOptions.UNMARK_FEATURED,
                                OpportunityActionOptions.DELETE,
                              ]}
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* PAGINATION */}
                <div className="mt-4 grid place-items-center justify-center">
                  <PaginationButtons
                    currentPage={searchFilter.pageNumber ?? 1}
                    totalItems={searchResults.totalCount as number}
                    pageSize={PAGE_SIZE}
                    showPages={false}
                    showInfo={true}
                    onClick={handlePagerChange}
                  />

                  {/* fetching the next page: the rows above stay put (dimmed), so this
                      is the only progress affordance. Fixed height = no layout shift. */}
                  <div className="flex h-6 items-center">
                    {isShowingPreviousResults && (
                      <LoadingInline
                        classNameSpinner="h-4 w-4 border-purple"
                        classNameLabel="text-xs text-gray-dark"
                        className="gap-2"
                        label="Updating..."
                      />
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </>
  );
};

OpportunitiesAdmin.getLayout = function getLayout(page: ReactElement) {
  return <MainLayout>{page}</MainLayout>;
};

OpportunitiesAdmin.theme = function getTheme() {
  return THEME_BLUE;
};

export default OpportunitiesAdmin;
