import { useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useAtomValue } from "jotai";
import { type GetServerSidePropsContext } from "next";
import { getServerSession } from "next-auth";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import iconZlto from "public/images/icon-zlto.svg";
import { type ParsedUrlQuery } from "querystring";
import {
  useCallback,
  useMemo,
  useRef,
  useState,
  type ReactElement,
} from "react";
import { FaDownload, FaPlusCircle, FaRocket, FaUpload } from "react-icons/fa";
import { IoIosAdd, IoIosSettings, IoIosWarning } from "react-icons/io";
import {
  Status,
  type OpportunitySearchFilterAdmin,
} from "~/api/models/opportunity";
import CustomModal from "~/components/Common/CustomModal";
import DropdownMenu from "~/components/Common/DropdownMenu";
import MainLayout from "~/components/Layout/Main";
import NoRowsMessage from "~/components/NoRowsMessage";
import OpportunityExport from "~/components/Opportunity/Admin/OpportunityExport";
import { OpportunityImport } from "~/components/Opportunity/Admin/OpportunityImport";
import OpportunityAdminFilterBadges from "~/components/Opportunity/Admin/OpportunityAdminFilterBadges";
import OpportunityAdminSearchToolbar, {
  OPPORTUNITY_ADMIN_TOOLBAR_BUTTON_CLASSES,
} from "~/components/Opportunity/Admin/OpportunityAdminSearchToolbar";
import OpportunityAdminStatusTabs from "~/components/Opportunity/Admin/OpportunityAdminStatusTabs";
import {
  filterToQueryString,
  getAppliedFilterCount,
  getFilterKeyParts,
  isFilterMappingReady,
  isSearchPerformed as getIsSearchPerformed,
  mapFilterToApi,
  OPPORTUNITY_ADMIN_FILTER_OPTIONS,
  parseFilterFromQuery,
  parseStatusParam,
  type OpportunityAdminRouterQuery,
} from "~/components/Opportunity/Admin/opportunityAdminFilter";
import {
  OpportunityActionOptions,
  OpportunityActions,
} from "~/components/Opportunity/OpportunityActions";
import { OpportunityAdminFilterVertical } from "~/components/Opportunity/OpportunityAdminFilterVertical";
import PullSyncBadge from "~/components/Opportunity/Badges/PullSyncBadge";
import OpportunityStatus from "~/components/Opportunity/OpportunityStatus";
import { PageBackground } from "~/components/PageBackground";
import { PaginationButtons } from "~/components/PaginationButtons";
import { InternalServerError } from "~/components/Status/InternalServerError";
import LimitedFunctionalityBadge from "~/components/Status/LimitedFunctionalityBadge";
import { LoadingInline } from "~/components/Status/LoadingInline";
import { LoadingSkeleton } from "~/components/Status/LoadingSkeleton";
import { Unauthenticated } from "~/components/Status/Unauthenticated";
import { Unauthorized } from "~/components/Status/Unauthorized";
import {
  OPPORTUNITY_QUERY_KEYS,
  useAdminOpportunityCategoriesQuery,
  useAdminOpportunityCountriesQuery,
  useAdminOpportunityLanguagesQuery,
  useOpportunityCustomFieldDefinitionsQuery,
  useOpportunityStatusCountQuery,
  useOpportunityTypesQuery,
  useOrgOpportunitiesListQuery,
} from "~/hooks/useOpportunityMutations";
import { PAGE_SIZE } from "~/lib/constants";
import { currentOrganisationInactiveAtom } from "~/lib/store";
import { getSafeUrl, getThemeFromRole } from "~/lib/utils";
import { type NextPageWithLayout } from "~/pages/_app";
import { authOptions, type User } from "~/server/auth";

interface IParams extends ParsedUrlQuery {
  id: string;
}

const getErrorStatus = (error: unknown): number | null => {
  if (!axios.isAxiosError(error)) return null;
  return error.response?.status ?? null;
};

// ⚠️ SSR
export async function getServerSideProps(context: GetServerSidePropsContext) {
  const { id } = context.params as IParams;
  const { returnUrl } = context.query;
  const session = await getServerSession(context.req, context.res, authOptions);

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

  return {
    props: {
      id: id,
      theme: theme,
      error: null,
      returnUrl: returnUrl ?? null,
      user: session?.user ?? null,
    },
  };
}

const Opportunities: NextPageWithLayout<{
  id: string;
  theme: string;
  error?: number;
  returnUrl?: string;
  user?: User | null;
}> = ({ id, error, returnUrl, user }) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const myRef = useRef<HTMLDivElement>(null);
  const currentOrganisationInactive = useAtomValue(
    currentOrganisationInactiveAtom,
  );
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [filterFullWindowVisible, setFilterFullWindowVisible] = useState(false);

  // 👇 filters are driven by the querystring (shared vocabulary with /admin/opportunities)
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
  const { data: lookups_types } = useOpportunityTypesQuery({ enabled: !error });

  // NB: the admin lookups require the organisation(s) for the org-admin role
  const orgScope = useMemo(() => [id], [id]);
  const { data: lookups_categories } = useAdminOpportunityCategoriesQuery(
    orgScope,
    { enabled: !error },
  );
  const { data: lookups_countries } = useAdminOpportunityCountriesQuery(
    orgScope,
    { enabled: !error },
  );
  const { data: lookups_languages } = useAdminOpportunityLanguagesQuery(
    orgScope,
    { enabled: !error },
  );

  // definitions are keyed on the selected types, so they refetch when types change
  const { data: lookups_customFieldDefinitions } =
    useOpportunityCustomFieldDefinitionsQuery(searchFilter.types ?? null, {
      enabled: !error,
    });
  //#endregion LOOKUPS

  // the filter values from the querystring are mapped to their corresponding id's
  const apiFilter = useMemo<OpportunitySearchFilterAdmin>(
    () =>
      mapFilterToApi(
        searchFilter,
        {
          types: lookups_types,
          categories: lookups_categories,
          countries: lookups_countries,
          languages: lookups_languages,
        },
        id,
      ),
    [
      searchFilter,
      id,
      lookups_types,
      lookups_categories,
      lookups_countries,
      lookups_languages,
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
      }),
    [
      searchFilter,
      lookups_types,
      lookups_categories,
      lookups_countries,
      lookups_languages,
    ],
  );

  // 👇 use prefetched queries from server
  // NB: these queries (with ['opportunities', id]) will be invalidated by create/edit operations on other pages
  const countKeyParts = useMemo(
    () => getFilterKeyParts(routerQuery),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [router.query],
  );

  const {
    data: searchResults,
    isLoading: isLoadingSearchResults,
    isPlaceholderData: isShowingPreviousResults,
    error: searchResultsError,
  } = useOrgOpportunitiesListQuery(id, apiFilter, countKeyParts, {
    enabled: !error && filterMappingReady,
  });
  const resolvedError =
    error ?? getErrorStatus(searchResultsError) ?? undefined;

  // status tab counts — these honour every applied filter
  const countsEnabled = !error && filterMappingReady;
  const { data: totalCountAll } = useOpportunityStatusCountQuery(
    id,
    apiFilter,
    null,
    countKeyParts,
    { enabled: countsEnabled },
  );
  const { data: totalCountActive } = useOpportunityStatusCountQuery(
    id,
    apiFilter,
    Status.Active,
    countKeyParts,
    { enabled: countsEnabled },
  );
  const { data: totalCountInactive } = useOpportunityStatusCountQuery(
    id,
    apiFilter,
    Status.Inactive,
    countKeyParts,
    { enabled: countsEnabled },
  );
  const { data: totalCountExpired } = useOpportunityStatusCountQuery(
    id,
    apiFilter,
    Status.Expired,
    countKeyParts,
    { enabled: countsEnabled },
  );
  const { data: totalCountDeleted } = useOpportunityStatusCountQuery(
    id,
    apiFilter,
    Status.Deleted,
    countKeyParts,
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
      let url = `/organisations/${id}/opportunities`;
      const params = filterToQueryString(filter);
      if (params != null && params.size > 0)
        url = `${url}?${params.toString()}`;

      if (url != router.asPath)
        void router.push(url, undefined, { scroll: false });
    },
    [id, router],
  );

  // querystring of the current filters excluding status & paging (used by the tabs)
  const tabBaseParams = useMemo(
    () => filterToQueryString({ ...searchFilter, statuses: null }),
    [searchFilter],
  );

  //#region Event Handlers
  const onSearch = useCallback(
    (query: string) => {
      redirectWithSearchFilterParams({
        ...searchFilter,
        pageNumber: 1,
        valueContains: query.length > 2 ? query : null,
      });
    },
    [searchFilter, redirectWithSearchFilterParams],
  );

  const handlePagerChange = useCallback(
    (value: number) => {
      redirectWithSearchFilterParams({ ...searchFilter, pageNumber: value });
    },
    [searchFilter, redirectWithSearchFilterParams],
  );

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

  //#endregion Event Handlers

  if (resolvedError) {
    if (resolvedError === 401) return <Unauthenticated />;
    else if (resolvedError === 403) return <Unauthorized />;
    else return <InternalServerError />;
  }

  return (
    <>
      <Head>
        <title>Yoma | 🏆 Opportunities</title>
      </Head>

      <PageBackground className="h-[14.3rem] md:h-[18.4rem]" />

      {/* REFERENCE FOR FILTER POPUP: fix menu z-index issue */}
      <div ref={myRef} />

      {/* POPUP FILTER */}
      <CustomModal
        isOpen={filterFullWindowVisible}
        shouldCloseOnOverlayClick={true}
        onRequestClose={() => {
          setFilterFullWindowVisible(false);
        }}
        className={`md:max-h-[500px] md:w-[600px]`}
      >
        {lookups_types && lookups_countries && lookups_languages && (
          <div className="flex h-full flex-col gap-2 overflow-y-auto">
            <OpportunityAdminFilterVertical
              htmlRef={myRef.current!}
              searchFilter={searchFilter}
              lookups_categories={lookups_categories ?? []}
              lookups_countries={lookups_countries}
              lookups_languages={lookups_languages}
              lookups_types={lookups_types}
              lookups_organisations={[]} // org-scoped page: not applicable
              lookups_publishedStates={[]}
              lookups_statuses={[]} // status is owned by the tabs
              lookups_customFieldDefinitions={lookups_customFieldDefinitions}
              onCancel={() => setFilterFullWindowVisible(false)}
              onSubmit={onSubmitFilter}
              filterOptions={OPPORTUNITY_ADMIN_FILTER_OPTIONS}
            />
          </div>
        )}
      </CustomModal>

      {/* IMPORT DIALOG */}
      <CustomModal
        isOpen={importDialogOpen}
        shouldCloseOnOverlayClick={false}
        onRequestClose={() => {
          setImportDialogOpen(false);
        }}
        className={`md:max-h-[650px] md:w-[700px]`}
      >
        <OpportunityImport
          id={id}
          onClose={() => {
            setImportDialogOpen(false);
          }}
          onSave={async () => {
            // invalidate queries
            //NB: this is the query on the opportunities page
            await queryClient.invalidateQueries({
              queryKey: OPPORTUNITY_QUERY_KEYS.list(id),
            });
            await queryClient.invalidateQueries({
              queryKey: OPPORTUNITY_QUERY_KEYS.adminSearchAll(),
            });
          }}
        />
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

      <div className="z-10 container mt-14 max-w-7xl px-2 py-8 md:mt-[7rem]">
        <div className="flex flex-col gap-4 py-4">
          <h3 className="mt-3 mb-6 flex items-center text-xl font-semibold tracking-normal whitespace-nowrap text-white md:mt-0 md:mb-9 md:text-3xl">
            🏆 Opportunities <LimitedFunctionalityBadge />
          </h3>

          {/* TABBED NAVIGATION */}
          <OpportunityAdminStatusTabs
            basePath={`/organisations/${id}/opportunities`}
            baseParams={tabBaseParams}
            status={status}
            counts={tabCounts}
          />

          {/* SEARCH & FILTERS */}
          <OpportunityAdminSearchToolbar
            defaultValue={query?.toString() ?? null}
            onSearch={onSearch}
            openFilter={setFilterFullWindowVisible}
            appliedFilterCount={appliedFilterCount}
          >
            <DropdownMenu
              label="Actions"
              triggerIcon={<IoIosSettings className="h-5 w-5" />}
              // sized & coloured to match the Filters button next to it
              className="w-full md:w-40"
              buttonClassName={OPPORTUNITY_ADMIN_TOOLBAR_BUTTON_CLASSES}
              items={[
                {
                  label: "Create Opportunity",
                  href: `/organisations/${id}/opportunities/create${`?returnUrl=${encodeURIComponent(
                    getSafeUrl(returnUrl?.toString(), router.asPath),
                  )}`}`,
                  icon: <FaPlusCircle className="h-4 w-4" />,
                  disabled: currentOrganisationInactive,
                  id: "btnCreateOpportunity",
                },
                {
                  label: "Import",
                  onClick: () => {
                    setImportDialogOpen(true);
                  },
                  icon: <FaUpload className="h-4 w-4" />,
                  disabled: currentOrganisationInactive,
                },
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

        {!isLoadingSearchResults && (
          <>
            {/* NO ROWS */}
            {searchResults &&
              searchResults.items?.length === 0 &&
              !isSearchPerformed &&
              status === null && (
                <div className="flex h-fit flex-col items-center rounded-lg bg-white pb-8 md:pb-16">
                  <NoRowsMessage
                    title={"Ready to share amazing opportunities?"}
                    description={
                      "Create your first opportunity and start making a positive impact in your community"
                    }
                    icon={<FaRocket className="text-warning size-6" />}
                  />
                  {currentOrganisationInactive ? (
                    <span className="btn bg-purple btn-primary rounded-3xl px-16 brightness-75">
                      Add opportunity (disabled)
                    </span>
                  ) : (
                    <Link
                      href={`/organisations/${id}/opportunities/create${`?returnUrl=${encodeURIComponent(
                        getSafeUrl(returnUrl?.toString(), router.asPath),
                      )}`}`}
                      className="bg-theme btn btn-primary rounded-3xl border-0 px-16 brightness-105 hover:brightness-110"
                      id="btnCreateOpportunity" // e2e
                    >
                      <IoIosAdd className="mr-1 h-5 w-5" />
                      Add opportunity
                    </Link>
                  )}
                </div>
              )}
            {searchResults &&
              searchResults.items?.length === 0 &&
              (isSearchPerformed || status !== null) && (
                <div className="py-32x flex flex-col place-items-center">
                  <NoRowsMessage
                    title={"No opportunities found"}
                    description={"Please try refining your search query."}
                  />
                </div>
              )}

            {/* RESULTS */}
            {searchResults && searchResults.items?.length > 0 && (
              // the previous page stays visible (dimmed) while the next one loads, so
              // paging never changes the page height and never moves the scroll position
              <div
                className={`transition-opacity ${
                  isShowingPreviousResults ? "opacity-50" : ""
                }`}
              >
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
                            href={`/organisations/${id}/opportunities/${opportunity.id}/info${`?returnUrl=${encodeURIComponent(
                              getSafeUrl(returnUrl?.toString(), router.asPath),
                            )}`}`}
                            className="line-clamp-1 text-start font-semibold"
                          >
                            {opportunity.title}
                          </Link>
                          <PullSyncBadge opportunity={opportunity} />
                        </span>

                        <OpportunityActions
                          opportunity={opportunity}
                          user={user ?? undefined}
                          organizationId={id}
                          returnUrl={getSafeUrl(
                            returnUrl?.toString(),
                            router.asPath,
                          )}
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

                        <div className="flex justify-between">
                          <p className="text-sm tracking-wider">Views</p>
                          <span
                            className={`badge min-w-20 ${
                              opportunity.countViewed > 0
                                ? "bg-green-light text-green"
                                : "bg-gray-light text-gray-dark"
                            }`}
                          >
                            <span className="text-xs">
                              {opportunity.countViewed}
                            </span>
                          </span>
                        </div>

                        <div className="flex justify-between">
                          <p className="text-sm tracking-wider">Clicks</p>
                          <span
                            className={`badge min-w-20 ${
                              opportunity.countNavigatedExternalLink > 0
                                ? "bg-green-light text-green"
                                : "bg-gray-light text-gray-dark"
                            }`}
                          >
                            <span className="text-xs">
                              {opportunity.countNavigatedExternalLink}
                            </span>
                          </span>
                        </div>

                        <div className="flex justify-between">
                          <p className="text-sm tracking-wider">Completions</p>
                          <span
                            className={`badge min-w-20 ${
                              opportunity.participantCountCompleted > 0
                                ? "bg-green-light text-green"
                                : "bg-gray-light text-gray-dark"
                            }`}
                          >
                            <span className="text-xs">
                              {opportunity.participantCountCompleted}
                            </span>
                          </span>
                        </div>

                        {/* Pending */}
                        <div className="flex justify-between">
                          <p className="text-sm tracking-wider">Pending</p>
                          {opportunity.participantCountPending > 0 ? (
                            <Link
                              href={`/organisations/${id}/verifications?opportunity=${opportunity.id}&verificationStatus=Pending`}
                              className="badge bg-orange-light text-orange min-w-20"
                            >
                              <IoIosWarning className="h-4 w-4" />
                              <span className="ml-1 text-xs">
                                {opportunity.participantCountPending}
                              </span>
                            </Link>
                          ) : (
                            <span className="badge bg-gray-light text-gray-dark min-w-20">
                              <span className="text-xs">
                                {opportunity.participantCountPending}
                              </span>
                            </span>
                          )}
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
                    <tr className="border-gray text-gray-dark">
                      <th className="border-gray-light !py-4">Title</th>
                      <th className="border-gray-light">ZLTO</th>
                      <th className="border-gray-light">Views</th>
                      <th className="border-gray-light">Clicks</th>
                      <th className="border-gray-light">Completions</th>
                      <th className="border-gray-light">Pending</th>
                      <th className="border-gray-light">Status</th>
                      <th className="border-gray-light">Visible</th>
                      <th className="border-gray-light">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {searchResults.items.map((opportunity) => (
                      <tr key={`md_${opportunity.id}`}>
                        <td className="border-gray-light max-w-[200px] border-t-2 !py-4">
                          <Link
                            title={opportunity.title}
                            href={`/organisations/${id}/opportunities/${opportunity.id}/info${`?returnUrl=${encodeURIComponent(
                              getSafeUrl(returnUrl?.toString(), router.asPath),
                            )}`}`}
                            className="text-gray-dark block max-w-[180px] overflow-hidden text-sm text-ellipsis whitespace-nowrap underline"
                          >
                            {opportunity.title}
                          </Link>
                          <PullSyncBadge opportunity={opportunity} />
                        </td>
                        <td className="border-gray-light border-t-2">
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
                        <td className="border-gray-light border-t-2">
                          <span
                            className={`badge ${opportunity.countViewed > 0 ? "bg-green-light text-green" : "bg-gray-light text-gray-dark"}`}
                          >
                            <span className="text-xs">
                              {opportunity.countViewed}
                            </span>
                          </span>
                        </td>
                        <td className="border-gray-light border-t-2">
                          <span
                            className={`badge ${opportunity.countNavigatedExternalLink > 0 ? "bg-green-light text-green" : "bg-gray-light text-gray-dark"}`}
                          >
                            {opportunity.countNavigatedExternalLink}
                          </span>
                        </td>
                        <td className="border-gray-light border-t-2">
                          <span
                            className={`badge ${opportunity.participantCountCompleted > 0 ? "bg-green-light text-green" : "bg-gray-light text-gray-dark"}`}
                          >
                            {opportunity.participantCountCompleted}
                          </span>
                        </td>
                        <td className="border-gray-light border-t-2">
                          {opportunity.participantCountPending > 0 ? (
                            <Link
                              href={`/organisations/${id}/verifications?opportunity=${opportunity.id}&verificationStatus=Pending`}
                              className="badge bg-orange-light text-orange"
                            >
                              <IoIosWarning className="h-4 w-4" />
                              <span className="ml-1 text-xs">
                                {opportunity.participantCountPending}
                              </span>
                            </Link>
                          ) : (
                            <span className="badge bg-gray-light text-gray-dark">
                              <span className="text-xs">
                                {opportunity.participantCountPending}
                              </span>
                            </span>
                          )}
                        </td>
                        <td className="border-gray-light border-t-2">
                          <OpportunityStatus
                            status={opportunity?.status?.toString()}
                          />
                        </td>
                        <td className="border-gray-light border-t-2">
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
                        <td className="border-gray-light border-t-2 whitespace-nowrap">
                          <div className="flex flex-row items-center justify-center gap-2">
                            {/* ACTIONS */}
                            <OpportunityActions
                              opportunity={opportunity}
                              user={user ?? undefined}
                              organizationId={id}
                              returnUrl={getSafeUrl(
                                returnUrl?.toString(),
                                router.asPath,
                              )}
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
                <div className="mt-2 grid place-items-center justify-center">
                  <PaginationButtons
                    currentPage={searchFilter.pageNumber ?? 1}
                    totalItems={searchResults?.totalCount ?? 0}
                    pageSize={PAGE_SIZE}
                    onClick={handlePagerChange}
                    showPages={false}
                    showInfo={true}
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
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
};

Opportunities.getLayout = function getLayout(page: ReactElement) {
  return <MainLayout>{page}</MainLayout>;
};

// 👇 return theme from component properties. this is set server-side (getServerSideProps)
Opportunities.theme = function getTheme(page: ReactElement<{ theme: string }>) {
  return page.props.theme;
};

export default Opportunities;
