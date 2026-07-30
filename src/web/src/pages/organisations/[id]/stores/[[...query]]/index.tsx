import { type GetServerSidePropsContext } from "next";
import { getServerSession } from "next-auth";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import type { ParsedUrlQuery } from "querystring";
import {
  useCallback,
  useMemo,
  useRef,
  useState,
  type ReactElement,
} from "react";
import { IoMdCalendar } from "react-icons/io";
import Moment from "react-moment";
import {
  StoreAccessControlRuleStatus,
  type StoreAccessControlRuleSearchFilter,
} from "~/api/models/marketplace";
import CustomModal from "~/components/Common/CustomModal";
import FormMessage, { FormMessageType } from "~/components/Common/FormMessage";
import ListPageFilterBadges from "~/components/Common/ListPage/ListPageFilterBadges";
import {
  ListPagePagination,
  ListPageResults,
} from "~/components/Common/ListPage/ListPageResults";
import ListPageSearchToolbar from "~/components/Common/ListPage/ListPageSearchToolbar";
import ListPageStatusTabs from "~/components/Common/ListPage/ListPageStatusTabs";
import {
  buildListPageQueryString,
  getAppliedFilterCount,
  getFilterKeyParts,
  isSearchPerformed as getIsSearchPerformed,
  parseStatusTab,
  type ListPageRouterQuery,
} from "~/components/Common/ListPage/listPageFilter";
import MainLayout from "~/components/Layout/Main";
import NoRowsMessage from "~/components/NoRowsMessage";
import { PageBackground } from "~/components/PageBackground";
import { InternalServerError } from "~/components/Status/InternalServerError";
import LimitedFunctionalityBadge from "~/components/Status/LimitedFunctionalityBadge";
import { Unauthenticated } from "~/components/Status/Unauthenticated";
import { Unauthorized } from "~/components/Status/Unauthorized";
import { InfoModal } from "~/components/StoreAccessControlRule/InfoModal";
import StoreAccessControlRuleFilterVertical, {
  StoreRuleFilterOptions,
} from "~/components/StoreAccessControlRule/StoreAccessControlRuleFilterVertical";
import {
  isStoreRuleFilterMappingReady,
  mapStoreRuleFilterToApi,
  parseStoreRuleFilterFromQuery,
  STORE_RULE_ORG_ADMIN_FILTER_SPEC,
  STORE_RULE_STATUS_PARAM,
} from "~/components/StoreAccessControlRule/storeAccessControlRuleFilter";
import {
  useStoreRulesSearchQuery,
  useStoreRuleStatusCountQuery,
  useStoreRuleStoresQuery,
} from "~/hooks/useStoreAccessControlRuleMutations";
import { DATE_FORMAT_HUMAN, PAGE_SIZE } from "~/lib/constants";
import { getThemeFromRole } from "~/lib/utils";
import { type NextPageWithLayout } from "~/pages/_app";
import { authOptions } from "~/server/auth";

interface IParams extends ParsedUrlQuery {
  id: string; // org id
}

// ⚠️ SSR
export async function getServerSideProps(context: GetServerSidePropsContext) {
  const { id } = context.params as IParams;
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

  // NB: the filters are driven by the querystring (router.query), not by props
  return {
    props: {
      id: id ?? null,
      theme: theme,
      error: null,
    },
  };
}

const Stores: NextPageWithLayout<{
  id: string;
  theme: string;
  error?: number;
}> = ({ id, error }) => {
  const router = useRouter();
  const myRef = useRef<HTMLDivElement>(null);
  const [infoModalVisible, setInfoModalVisible] = useState(false);
  const [filterFullWindowVisible, setFilterFullWindowVisible] = useState(false);

  // 👇 filters are driven by the querystring (shared vocabulary with /admin/stores)
  const routerQuery = router.query as ListPageRouterQuery;
  const status = useMemo(
    () => parseStatusTab(routerQuery, STORE_RULE_ORG_ADMIN_FILTER_SPEC),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [router.query],
  );

  // display (name-based) filter — what the filter modal and the badges bind to
  const searchFilter = useMemo<StoreAccessControlRuleSearchFilter>(
    () =>
      parseStoreRuleFilterFromQuery(
        routerQuery,
        STORE_RULE_ORG_ADMIN_FILTER_SPEC,
        PAGE_SIZE,
        id,
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [router.query, id],
  );

  const isSearchPerformed = useMemo(
    () => getIsSearchPerformed(routerQuery, STORE_RULE_ORG_ADMIN_FILTER_SPEC),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [router.query],
  );

  const appliedFilterCount = useMemo(
    () => getAppliedFilterCount(searchFilter, STORE_RULE_ORG_ADMIN_FILTER_SPEC),
    [searchFilter],
  );

  //#region LOOKUPS
  const { data: lookups_stores } = useStoreRuleStoresQuery(id, {
    enabled: !error,
  });
  //#endregion LOOKUPS

  // the filter values from the querystring are mapped to their corresponding id's
  const apiFilter = useMemo<StoreAccessControlRuleSearchFilter>(
    () => mapStoreRuleFilterToApi(searchFilter, { stores: lookups_stores }, id),
    [searchFilter, lookups_stores, id],
  );

  // only search once the lookups needed to map the applied filters have loaded
  const filterMappingReady = useMemo(
    () =>
      isStoreRuleFilterMappingReady(
        searchFilter,
        { stores: lookups_stores },
        id,
      ),
    [searchFilter, lookups_stores, id],
  );

  const filterKeyParts = useMemo(
    () => getFilterKeyParts(routerQuery, STORE_RULE_ORG_ADMIN_FILTER_SPEC),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [router.query],
  );

  // QUERY: SEARCH RESULTS
  const {
    data: dataRules,
    isLoading: isLoadingSearchResults,
    isPlaceholderData: isShowingPreviousResults,
  } = useStoreRulesSearchQuery(id, apiFilter, filterKeyParts, {
    enabled: !error && filterMappingReady,
  });

  // status tab counts — these honour every applied filter
  const countsEnabled = !error && filterMappingReady;
  const { data: totalCountAll } = useStoreRuleStatusCountQuery(
    id,
    apiFilter,
    null,
    filterKeyParts,
    { enabled: countsEnabled },
  );
  const { data: totalCountActive } = useStoreRuleStatusCountQuery(
    id,
    apiFilter,
    StoreAccessControlRuleStatus[StoreAccessControlRuleStatus.Active],
    filterKeyParts,
    { enabled: countsEnabled },
  );
  const { data: totalCountInactive } = useStoreRuleStatusCountQuery(
    id,
    apiFilter,
    StoreAccessControlRuleStatus[StoreAccessControlRuleStatus.Inactive],
    filterKeyParts,
    { enabled: countsEnabled },
  );
  const { data: totalCountDeleted } = useStoreRuleStatusCountQuery(
    id,
    apiFilter,
    StoreAccessControlRuleStatus[StoreAccessControlRuleStatus.Deleted],
    filterKeyParts,
    { enabled: countsEnabled },
  );

  const tabCounts = useMemo(
    () => ({
      all: totalCountAll,
      [StoreAccessControlRuleStatus[StoreAccessControlRuleStatus.Active]]:
        totalCountActive,
      [StoreAccessControlRuleStatus[StoreAccessControlRuleStatus.Inactive]]:
        totalCountInactive,
      [StoreAccessControlRuleStatus[StoreAccessControlRuleStatus.Deleted]]:
        totalCountDeleted,
    }),
    [totalCountAll, totalCountActive, totalCountInactive, totalCountDeleted],
  );

  // 🎈 FUNCTIONS
  const redirectWithSearchFilterParams = useCallback(
    (filter: StoreAccessControlRuleSearchFilter) => {
      let url = `/organisations/${id}/stores`;
      const params = buildListPageQueryString(
        filter,
        STORE_RULE_ORG_ADMIN_FILTER_SPEC,
      );
      if (params != null && params.size > 0)
        url = `${url}?${params.toString()}`;

      if (url != router.asPath)
        void router.push(url, undefined, { scroll: false });
    },
    [id, router],
  );

  // querystring of the current filters excluding status & paging (used by the tabs)
  const tabBaseParams = useMemo(
    () =>
      buildListPageQueryString(
        { ...searchFilter, statuses: null },
        STORE_RULE_ORG_ADMIN_FILTER_SPEC,
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

  const onSearch = useCallback(
    (query: string) => {
      redirectWithSearchFilterParams({
        ...searchFilter,
        pageNumber: 1,
        nameContains: query.length > 2 ? query : null,
      });
    },
    [searchFilter, redirectWithSearchFilterParams],
  );

  const onCloseFilter = useCallback(() => {
    setFilterFullWindowVisible(false);
  }, []);

  const onSubmitFilter = useCallback(
    (filter: StoreAccessControlRuleSearchFilter) => {
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

  if (error) {
    if (error === 401) return <Unauthenticated />;
    else if (error === 403) return <Unauthorized />;
    else return <InternalServerError />;
  }

  return (
    <>
      <Head>
        <title>Yoma | 🛒 Marketplace Store Access Rules</title>
      </Head>
      <PageBackground className="h-[14.5rem] md:h-[18rem]" />

      {/* REFERENCE FOR FILTER POPUP: fix menu z-index issue */}
      <div ref={myRef} />

      <InfoModal
        isOpen={infoModalVisible}
        onClose={() => setInfoModalVisible(false)}
      />

      {/* POPUP FILTER */}
      <CustomModal
        isOpen={filterFullWindowVisible}
        shouldCloseOnOverlayClick={true}
        onRequestClose={onCloseFilter}
        className={`md:max-h-[300px] md:w-[400px]`}
      >
        <div className="flex h-full flex-col gap-2 overflow-y-auto">
          <StoreAccessControlRuleFilterVertical
            htmlRef={myRef.current!}
            searchFilter={searchFilter}
            lookups_organisations={[]} // org-scoped page: not applicable
            lookups_stores={lookups_stores ?? []}
            onCancel={onCloseFilter}
            onSubmit={onSubmitFilter}
            filterOptions={[StoreRuleFilterOptions.STORES]}
          />
        </div>
      </CustomModal>

      <div className="z-10 container mt-14 max-w-7xl px-2 py-8 md:mt-[7rem]">
        <div className="flex flex-col gap-4 py-4">
          <h3 className="mt-3 mb-6 flex items-center text-xl font-semibold tracking-normal whitespace-nowrap text-white md:mt-0 md:mb-9 md:text-3xl">
            🛒 Marketplace Store Access Rules <LimitedFunctionalityBadge />
          </h3>

          {/* TABBED NAVIGATION */}
          <ListPageStatusTabs
            basePath={`/organisations/${id}/stores`}
            baseParams={tabBaseParams}
            statusSpec={STORE_RULE_STATUS_PARAM}
            status={status}
            counts={tabCounts}
            idPrefix="store_rule"
          />

          {/* INFO MESSAGE AND OPEN POPUP */}
          <FormMessage messageType={FormMessageType.Info}>
            Marketplace Store Access Rules control the visibility of a ZLTO
            store and its item categories to users. Click{" "}
            <button
              className="text-green underline"
              onClick={() => setInfoModalVisible(true)}
            >
              here
            </button>{" "}
            to learn more.
          </FormMessage>

          {/* SEARCH & FILTERS */}
          {/* NB: no actions — creating a rule is an Admin-role action */}
          <ListPageSearchToolbar
            defaultValue={searchFilter.nameContains}
            onSearch={onSearch}
            openFilter={setFilterFullWindowVisible}
            appliedFilterCount={appliedFilterCount}
          />

          {/* APPLIED FILTER BADGES */}
          {appliedFilterCount > 0 && (
            <ListPageFilterBadges<StoreAccessControlRuleSearchFilter>
              searchFilter={searchFilter}
              spec={STORE_RULE_ORG_ADMIN_FILTER_SPEC}
              onSubmit={onSubmitFilter}
              className="-ml-2"
            />
          )}
        </div>

        {/* MAIN CONTENT */}
        <ListPageResults
          isLoading={isLoadingSearchResults}
          isShowingPreviousResults={isShowingPreviousResults}
          id="results"
        >
          <div className="md:shadow-custom rounded-lg md:bg-white md:p-4">
            {/* NO ROWS */}
            {dataRules && dataRules.items?.length === 0 && (
              <div className="flex h-fit flex-col items-center rounded-lg bg-white">
                <NoRowsMessage
                  title={"No rules found"}
                  description={
                    isSearchPerformed || status !== null
                      ? "Please try refining your search query."
                      : "This is where you will find the store access rules that apply to your organisation."
                  }
                />
              </div>
            )}

            {/* GRID */}
            {dataRules && dataRules.items?.length > 0 && (
              <div className="">
                {/* MOBILE */}
                <div className="flex flex-col gap-4 md:hidden">
                  {dataRules.items.map((item) => (
                    <div
                      key={`grid_xs_${item.id}`}
                      className="shadow-custom rounded-lg bg-white p-4"
                    >
                      <div className="mb-2 flex flex-col">
                        <span className="mt-2 max-w-[340px] truncate text-sm font-semibold">
                          {item.name}
                        </span>

                        <span className="font-semiboldx text-gray-dark max-w-[340px] truncate text-xs">
                          {item.description}
                        </span>
                      </div>

                      <div className="flex flex-col gap-2">
                        <div className="flex flex-row justify-between">
                          <p className="text-xs font-bold tracking-widest">
                            Store
                          </p>
                          {item.store ? (
                            <span className="badge badge-primary">
                              {item.store.name}
                            </span>
                          ) : (
                            "N/A"
                          )}
                        </div>

                        <div className="flex flex-row justify-between">
                          <p className="text-xs font-bold tracking-widest">
                            Store Categories
                          </p>
                          {item.store ? (
                            <div className="flex flex-col">
                              {item?.storeItemCategories?.map((o) => (
                                <div key={o.id}>
                                  <div className="text-gray-dark max-w-[200px] truncate overflow-hidden text-xs font-semibold text-ellipsis whitespace-nowrap">
                                    {o.name}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            "N/A"
                          )}
                        </div>

                        <div className="flex flex-row justify-between">
                          <span className="text-xs font-bold tracking-widest">
                            Age:
                          </span>
                          <span className="text-gray-dark text-xs font-semibold">
                            {item.ageFrom && item.ageTo
                              ? `From ${item.ageFrom} To ${item.ageTo}`
                              : item.ageFrom
                                ? `From ${item.ageFrom}`
                                : item.ageTo
                                  ? `To ${item.ageTo}`
                                  : "No age range specified"}
                          </span>
                        </div>

                        <div className="flex flex-row justify-between">
                          <span className="text-xs font-bold tracking-widest">
                            Gender:
                          </span>
                          <span className="text-gray-dark text-xs font-semibold">
                            {item.gender}
                          </span>
                        </div>

                        <div className="flex flex-row justify-between">
                          <span className="text-xs font-bold tracking-widest">
                            Opportunities:
                          </span>
                          <span>
                            {item?.opportunities?.map((o) => (
                              <div key={o.id} className="w-[200px] truncate">
                                <Link
                                  href={`/organisations/${item.organizationId}/opportunities/${o.id}`}
                                  className="text-gray-dark text-xs font-semibold underline"
                                >
                                  {o.title}
                                </Link>
                              </div>
                            ))}
                          </span>
                        </div>

                        <div className="flex flex-row justify-between">
                          <p className="text-xs font-bold tracking-widest">
                            Date
                          </p>
                          {item.dateModified ? (
                            <span className="badge bg-yellow-light text-yellow">
                              <IoMdCalendar className="h-4 w-4" />
                              <span className="ml-1 text-xs">
                                <Moment format={DATE_FORMAT_HUMAN} utc={true}>
                                  {item.dateModified}
                                </Moment>
                              </span>
                            </span>
                          ) : (
                            "N/A"
                          )}
                        </div>

                        <div className="flex flex-row justify-between">
                          <p className="text-xs font-bold tracking-widest">
                            Status
                          </p>
                          {item.status == "Active" && (
                            <span className="badge bg-blue-light text-blue">
                              Active
                            </span>
                          )}
                          {item.status == "Inactive" && (
                            <span className="badge bg-yellow-tint text-yellow">
                              Inactive
                            </span>
                          )}
                          {item.status == "Deleted" && (
                            <span className="badge bg-green-light text-red-400">
                              Deleted
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* DEKSTOP */}
                <table className="border-gray-light md:table-xs hidden border-separate rounded-lg border-x-2 border-t-2 md:table">
                  <thead>
                    <tr className="border-gray text-gray-dark">
                      <th className="border-gray-light border-b-2 !py-4">
                        Name
                      </th>
                      <th className="border-gray-light border-b-2">
                        Description
                      </th>
                      <th className="border-gray-light border-b-2 !py-4">
                        Store / Item Categories
                      </th>
                      <th className="border-gray-light border-b-2 !py-4">
                        Conditions
                      </th>
                      <th className="border-gray-light border-b-2">Date</th>
                      <th className="border-gray-light border-b-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dataRules.items.map((item) => (
                      <tr key={`grid_md_${item.id}`}>
                        <td className="border-gray-light max-w-[100px] truncate border-b-2 !py-4 !align-top">
                          <div className="overflow-hidden text-ellipsis whitespace-nowrap md:max-w-[100px]">
                            {item.name}
                          </div>
                        </td>

                        <td className="border-gray-light max-w-[100px] truncate border-b-2 !py-4 !align-top">
                          <div className="overflow-hidden text-ellipsis whitespace-nowrap md:max-w-[100px]">
                            {item.description}
                          </div>
                        </td>

                        <td className="border-gray-light max-w-[200px] truncate border-b-2 !py-4 !align-top">
                          <div className="overflow-hidden text-ellipsis whitespace-nowrap md:max-w-[100px]">
                            {item.store.name!}
                          </div>

                          <div className="overflow-hidden text-ellipsis whitespace-nowrap md:max-w-[100px]">
                            {item.storeItemCategories?.map((item, index) => {
                              return (
                                <span
                                  key={`storeItemCategories_${index}`}
                                  className="text-gray-dark text-xs"
                                >
                                  {item.name}
                                </span>
                              );
                            })}
                          </div>
                        </td>

                        <td className="border-gray-light max-w-[200px] truncate border-b-2 !py-4 !align-top">
                          <div className="overflow-hidden text-ellipsis whitespace-nowrap md:max-w-[300px]">
                            <span className="mr-1 font-bold">Age:</span>
                            <span>
                              {item.ageFrom && item.ageTo
                                ? `From ${item.ageFrom} To ${item.ageTo}`
                                : item.ageFrom
                                  ? `From ${item.ageFrom}`
                                  : item.ageTo
                                    ? `To ${item.ageTo}`
                                    : "No age range specified"}
                            </span>
                          </div>

                          <div className="overflow-hidden text-ellipsis whitespace-nowrap">
                            <span className="mr-1 font-bold">Gender:</span>
                            <span>{item.gender}</span>
                          </div>

                          <div className="flex flex-col">
                            <span className="mr-1 font-bold">
                              Opportunities:
                            </span>
                            <span>
                              {item?.opportunities?.map((o) => (
                                <div key={o.id} className="w-[120px] truncate">
                                  <Link
                                    href={`/organisations/${item.organizationId}/opportunities/${o.id}`}
                                    className="text-gray-dark text-xs font-semibold underline"
                                  >
                                    {o.title}
                                  </Link>
                                </div>
                              ))}
                            </span>
                          </div>
                        </td>

                        <td className="border-gray-light border-b-2 !py-4 !align-top">
                          {item.dateModified ? (
                            <span className="badge bg-yellow-light text-yellow">
                              <IoMdCalendar className="h-4 w-4" />
                              <span className="ml-1 text-xs">
                                <Moment format={DATE_FORMAT_HUMAN} utc={true}>
                                  {item.dateModified}
                                </Moment>
                              </span>
                            </span>
                          ) : (
                            "N/A"
                          )}
                        </td>

                        {/* STATUS */}
                        <td className="border-gray-light border-b-2 !py-4 !align-top">
                          {item.status == "Active" && (
                            <span className="badge bg-blue-light text-blue">
                              Active
                            </span>
                          )}
                          {item.status == "Inactive" && (
                            <span className="badge bg-yellow-tint text-yellow">
                              Inactive
                            </span>
                          )}

                          {item.status == "Deleted" && (
                            <span className="badge bg-green-light text-red-400">
                              Deleted
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* PAGINATION */}
                <ListPagePagination
                  currentPage={searchFilter.pageNumber ?? 1}
                  totalItems={dataRules?.totalCount ?? 0}
                  pageSize={PAGE_SIZE}
                  onClick={handlePagerChange}
                  isShowingPreviousResults={isShowingPreviousResults}
                  className="mt-2"
                />
              </div>
            )}
          </div>
        </ListPageResults>
      </div>
    </>
  );
};

Stores.getLayout = function getLayout(page: ReactElement) {
  return <MainLayout>{page}</MainLayout>;
};

// 👇 return theme from component properties. this is set server-side (getServerSideProps)
Stores.theme = function getTheme(page: ReactElement<{ theme: string }>) {
  return page.props.theme;
};

export default Stores;
