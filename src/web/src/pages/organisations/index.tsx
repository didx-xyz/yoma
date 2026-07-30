import {
  keepPreviousData,
  QueryClient,
  dehydrate,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { type GetServerSidePropsContext } from "next";
import { getServerSession } from "next-auth";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useCallback, useMemo, type ReactElement } from "react";
import { FaPlusCircle } from "react-icons/fa";
import { IoIosAdd, IoIosSettings } from "react-icons/io";
import { OrganizationStatus } from "~/api/models/opportunity";
import type {
  OrganizationSearchFilter,
  OrganizationSearchResults,
} from "~/api/models/organisation";
import { getOrganisations } from "~/api/services/organisations";
import DropdownMenu from "~/components/Common/DropdownMenu";
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
  getFilterKeyParts,
  isSearchPerformed as getIsSearchPerformed,
  parseStatusTab,
  type ListPageRouterQuery,
} from "~/components/Common/ListPage/listPageFilter";
import MainLayout from "~/components/Layout/Main";
import NoRowsMessage from "~/components/NoRowsMessage";
import { OrganisationCardComponent } from "~/components/Organisation/OrganisationCardComponent";
import {
  ORGANISATION_FILTER_SPEC,
  ORGANISATION_STATUS_PARAM,
  parseOrganisationFilterFromQuery,
} from "~/components/Organisation/organisationFilter";
import { PageBackground } from "~/components/PageBackground";
import { InternalServerError } from "~/components/Status/InternalServerError";
import { Unauthenticated } from "~/components/Status/Unauthenticated";
import { Unauthorized } from "~/components/Status/Unauthorized";
import {
  PAGE_SIZE,
  ROLE_ADMIN,
  ROLE_ORG_ADMIN,
  THEME_BLUE,
  THEME_GREEN,
} from "~/lib/constants";
import { config } from "~/lib/react-query-config";
import { getSafeUrl } from "~/lib/utils";
import { type NextPageWithLayout } from "~/pages/_app";
import { type User, authOptions } from "~/server/auth";

// ⚠️ SSR
export async function getServerSideProps(context: GetServerSidePropsContext) {
  const { returnUrl } = context.query;
  const session = await getServerSession(context.req, context.res, authOptions);
  const queryClient = new QueryClient(config);
  const errorCode = null;

  // 👇 ensure authenticated
  if (!session) {
    return {
      props: {
        error: 401,
      },
    };
  }

  // 👇 set theme based on role
  let theme;

  if (session?.user?.roles.includes(ROLE_ADMIN)) {
    theme = THEME_BLUE;
  } else if (session?.user?.roles.includes(ROLE_ORG_ADMIN)) {
    theme = THEME_GREEN;
  } else {
    return {
      props: {
        error: 401,
        theme: THEME_GREEN,
      },
    };
  }

  // NB: the filters are driven by the querystring (router.query), not by props
  return {
    props: {
      dehydratedState: dehydrate(queryClient),
      theme: theme,
      error: errorCode,
      returnUrl: returnUrl ?? null,
      user: session?.user ?? null,
    },
  };
}

/**
 * Status-tab count: the list search with `pageSize: 1`, so the badge honours the search term.
 * Pass `null` as `status` for the "All" tab.
 */
function useOrganisationCountQuery(
  searchFilter: OrganizationSearchFilter,
  status: string | null,
  keyParts: string,
  options?: { enabled?: boolean },
) {
  return useQuery<number>({
    // NB: prefix kept as-is — /organisations/[id]/verify invalidates on it
    queryKey: ["Organisations_TotalCount", status, keyParts],
    queryFn: () =>
      getOrganisations({
        ...searchFilter,
        pageNumber: 1,
        pageSize: 1,
        statuses: status !== null ? [status] : null,
      }).then((data) => data.totalCount ?? 0),
    enabled: options?.enabled ?? true,
    // keeps the tab badges stable (no blink) while a new count loads
    placeholderData: keepPreviousData,
  });
}

const Organisations: NextPageWithLayout<{
  theme: string;
  error?: number;
  returnUrl?: string;
  user: User;
}> = ({ error, returnUrl, user }) => {
  const router = useRouter();
  const queryClient = useQueryClient();

  // 👇 filters are driven by the querystring
  const routerQuery = router.query as ListPageRouterQuery;
  const status = useMemo(
    () => parseStatusTab(routerQuery, ORGANISATION_FILTER_SPEC),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [router.query],
  );

  const searchFilter = useMemo<OrganizationSearchFilter>(
    () => parseOrganisationFilterFromQuery(routerQuery, PAGE_SIZE),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [router.query],
  );

  const isSearchPerformed = useMemo(
    () => getIsSearchPerformed(routerQuery, ORGANISATION_FILTER_SPEC),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [router.query],
  );

  const filterKeyParts = useMemo(
    () => getFilterKeyParts(routerQuery, ORGANISATION_FILTER_SPEC),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [router.query],
  );

  const {
    data: searchResults,
    isLoading: isLoadingSearchResults,
    isPlaceholderData: isShowingPreviousResults,
  } = useQuery<OrganizationSearchResults>({
    // NB: prefix kept as-is — /organisations/[id]/verify invalidates on it
    queryKey: ["Organisations", filterKeyParts],
    queryFn: () => getOrganisations(searchFilter),
    enabled: !error,
    // the previous page stays visible (dimmed) while the next one loads
    placeholderData: keepPreviousData,
  });

  // status tab counts — these honour the applied search term
  const countsEnabled = !error;
  const { data: totalCountAll } = useOrganisationCountQuery(
    searchFilter,
    null,
    filterKeyParts,
    { enabled: countsEnabled },
  );
  const { data: totalCountActive } = useOrganisationCountQuery(
    searchFilter,
    OrganizationStatus.Active.toString(),
    filterKeyParts,
    { enabled: countsEnabled },
  );
  const { data: totalCountInactive } = useOrganisationCountQuery(
    searchFilter,
    OrganizationStatus.Inactive.toString(),
    filterKeyParts,
    { enabled: countsEnabled },
  );
  const { data: totalCountDeclined } = useOrganisationCountQuery(
    searchFilter,
    OrganizationStatus.Declined.toString(),
    filterKeyParts,
    { enabled: countsEnabled },
  );
  const { data: totalCountDeleted } = useOrganisationCountQuery(
    searchFilter,
    OrganizationStatus.Deleted.toString(),
    filterKeyParts,
    { enabled: countsEnabled },
  );

  const tabCounts = useMemo(
    () => ({
      all: totalCountAll,
      [OrganizationStatus[OrganizationStatus.Active]]: totalCountActive,
      [OrganizationStatus[OrganizationStatus.Inactive]]: totalCountInactive,
      [OrganizationStatus[OrganizationStatus.Declined]]: totalCountDeclined,
      [OrganizationStatus[OrganizationStatus.Deleted]]: totalCountDeleted,
    }),
    [
      totalCountAll,
      totalCountActive,
      totalCountInactive,
      totalCountDeclined,
      totalCountDeleted,
    ],
  );

  // 🎈 FUNCTIONS
  const redirectWithSearchFilterParams = useCallback(
    (filter: OrganizationSearchFilter) => {
      let url = "/organisations";
      const params = buildListPageQueryString(filter, ORGANISATION_FILTER_SPEC);
      if (params != null && params.size > 0)
        url = `/organisations?${params.toString()}`;

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
        ORGANISATION_FILTER_SPEC,
      ),
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
      // NB: no manual encoding — URLSearchParams encodes, the router decodes
      redirectWithSearchFilterParams({
        ...searchFilter,
        pageNumber: 1,
        valueContains: query.length > 2 ? query : null,
      });
    },
    [searchFilter, redirectWithSearchFilterParams],
  );

  const updateStatus = useCallback(async () => {
    // invalidate queries
    // this will match all queries with the following prefixes 'Organisations' (list data) & 'Organisations_TotalCount' (tab counts)
    await queryClient.invalidateQueries({
      queryKey: ["Organisations"],
      exact: false,
    });
    await queryClient.invalidateQueries({
      queryKey: ["Organisations_TotalCount"],
      exact: false,
    });
  }, [queryClient]);

  if (error) {
    if (error === 401) return <Unauthenticated />;
    else if (error === 403) return <Unauthorized />;
    else return <InternalServerError />;
  }

  return (
    <>
      <Head>
        <title>Yoma | 🏢 Organisations</title>
      </Head>

      <PageBackground className="h-[14.8rem] md:h-[18.4rem]" />

      <div className="z-10 container mt-14 max-w-7xl px-2 py-8 md:mt-[7rem]">
        <div className="flex flex-col gap-4 py-4">
          <h3 className="mt-3 mb-6 flex items-center text-xl font-semibold tracking-normal whitespace-nowrap text-white md:mt-0 md:mb-9 md:text-3xl">
            🏢 Organisations
          </h3>

          {/* TABBED NAVIGATION */}
          <ListPageStatusTabs
            basePath="/organisations"
            baseParams={tabBaseParams}
            statusSpec={ORGANISATION_STATUS_PARAM}
            status={status}
            counts={tabCounts}
            idPrefix="organisation"
          />

          {/* SEARCH & ACTIONS */}
          {/* NB: no Filters button — status is this page's only filter and the tabs own it */}
          <ListPageSearchToolbar
            defaultValue={searchFilter.valueContains}
            onSearch={onSearchInputSubmit}
          >
            <DropdownMenu
              label="Actions"
              triggerIcon={<IoIosSettings className="h-5 w-5" />}
              // sized & coloured to match the search button next to it
              className="w-full md:w-40"
              buttonClassName={LIST_PAGE_TOOLBAR_BUTTON_CLASSES}
              items={[
                {
                  label: "Add organisation",
                  href: `/organisations/register${`?returnUrl=${encodeURIComponent(
                    getSafeUrl(returnUrl?.toString(), router.asPath),
                  )}`}`,
                  icon: <FaPlusCircle className="h-4 w-4" />,
                  id: "btnCreateOrganisation", // e2e
                },
              ]}
            />
          </ListPageSearchToolbar>
        </div>

        {/* MAIN CONTENT */}
        <ListPageResults
          isLoading={isLoadingSearchResults}
          isShowingPreviousResults={isShowingPreviousResults}
          id="results"
        >
          <div className="rounded-lg md:p-4">
            {/* NO RESULTS */}
            {searchResults && searchResults.totalCount === 0 && (
              <div className="flex h-fit flex-col items-center rounded-lg bg-white pb-8 md:pb-16">
                <NoRowsMessage
                  title={"No organisations found"}
                  description={
                    isSearchPerformed || status !== null
                      ? "Please try refining your search query."
                      : "This is where you will find all the organisations that have registered."
                  }
                />

                {!isSearchPerformed && status === null && (
                  <Link
                    href={`/organisations/register${`?returnUrl=${encodeURIComponent(
                      getSafeUrl(returnUrl?.toString(), router.asPath),
                    )}`}`}
                    className="bg-theme btn btn-primary rounded-3xl border-0 px-16 brightness-105 hover:brightness-110"
                    id="btnCreateOrganisation" // e2e
                  >
                    <IoIosAdd className="mr-1 h-5 w-5" />
                    Add organisation
                  </Link>
                )}
              </div>
            )}

            {/* RESULTS */}
            {searchResults && searchResults.items.length > 0 && (
              <>
                <div className="grid w-full place-items-center">
                  <div className="xs:grid-cols-1 grid w-full grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {searchResults.items.map((item) => (
                      <OrganisationCardComponent
                        key={`OrganisationCardComponent_${item.id}`}
                        item={item}
                        user={user}
                        onUpdateStatus={updateStatus}
                        returnUrl={router.asPath}
                      />
                    ))}
                  </div>
                </div>

                {/* PAGINATION */}
                <ListPagePagination
                  currentPage={searchFilter.pageNumber ?? 1}
                  totalItems={searchResults?.totalCount ?? 0}
                  pageSize={PAGE_SIZE}
                  onClick={handlePagerChange}
                  isShowingPreviousResults={isShowingPreviousResults}
                  className="mt-2"
                />
              </>
            )}
          </div>
        </ListPageResults>
      </div>
    </>
  );
};

Organisations.getLayout = function getLayout(page: ReactElement) {
  return <MainLayout>{page}</MainLayout>;
};

// 👇 return theme from component properties. this is set server-side (getServerSideProps)
Organisations.theme = function getTheme(page: ReactElement<{ theme: string }>) {
  return page.props.theme;
};

export default Organisations;
