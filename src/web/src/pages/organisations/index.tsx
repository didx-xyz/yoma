import {
  QueryClient,
  dehydrate,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { type GetServerSidePropsContext } from "next";
import { getServerSession } from "next-auth";
import Head from "next/head";
import { useRouter } from "next/router";
import { useCallback, useMemo, type ReactElement } from "react";
import MainLayout from "~/components/Layout/Main";
import { type User, authOptions } from "~/server/auth";
import { OrganizationStatus } from "~/api/models/opportunity";
import { type NextPageWithLayout } from "~/pages/_app";
import Link from "next/link";
import { PageBackground } from "~/components/PageBackground";
import { IoIosAdd } from "react-icons/io";
import { SearchInput } from "~/components/SearchInput";
import NoRowsMessage from "~/components/NoRowsMessage";
import {
  PAGE_SIZE,
  ROLE_ADMIN,
  ROLE_ORG_ADMIN,
  THEME_BLUE,
  THEME_GREEN,
} from "~/lib/constants";
import { PaginationButtons } from "~/components/PaginationButtons";
import { Unauthorized } from "~/components/Status/Unauthorized";
import { config } from "~/lib/react-query-config";
import { getSafeUrl } from "~/lib/utils";
import axios from "axios";
import { InternalServerError } from "~/components/Status/InternalServerError";
import { Unauthenticated } from "~/components/Status/Unauthenticated";
import { getOrganisations } from "~/api/services/organisations";
import type { SelectOption } from "~/api/models/lookups";
import type { OrganizationSearchFilter } from "~/api/models/organisation";
import { OrganisationCardComponent } from "~/components/Organisation/OrganisationCardComponent";

// ⚠️ SSR
export async function getServerSideProps(context: GetServerSidePropsContext) {
  const { query, page, status, returnUrl } = context.query;
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

  try {
    //NB: removed due to 502 bad gateway error
    // 👇 prefetch queries on server
    // get the totalCount for each status from the getOrganisations function
    // await Promise.all([
    //   queryClient.prefetchQuery({
    //     queryKey: ["Organisations_TotalCount", null],
    //     queryFn: () =>
    //       getOrganisations(
    //         {
    //           pageNumber: 1,
    //           pageSize: 1,
    //           valueContains: null,
    //           statuses: null,
    //         },
    //         context,
    //       ).then((data) => data.totalCount ?? 0),
    //   }),
    //   queryClient.prefetchQuery({
    //     queryKey: ["Organisations_TotalCount", OrganizationStatus.Active],
    //     queryFn: () =>
    //       getOrganisations(
    //         {
    //           pageNumber: 1,
    //           pageSize: 1,
    //           valueContains: null,
    //           statuses: [OrganizationStatus.Active],
    //         },
    //         context,
    //       ).then((data) => data.totalCount ?? 0),
    //   }),
    //   queryClient.prefetchQuery({
    //     queryKey: ["Organisations_TotalCount", OrganizationStatus.Inactive],
    //     queryFn: () =>
    //       getOrganisations(
    //         {
    //           pageNumber: 1,
    //           pageSize: 1,
    //           valueContains: null,
    //           statuses: [OrganizationStatus.Inactive],
    //         },
    //         context,
    //       ).then((data) => data.totalCount ?? 0),
    //   }),
    //   queryClient.prefetchQuery({
    //     queryKey: ["Organisations_TotalCount", OrganizationStatus.Declined],
    //     queryFn: () =>
    //       getOrganisations(
    //         {
    //           pageNumber: 1,
    //           pageSize: 1,
    //           valueContains: null,
    //           statuses: [OrganizationStatus.Declined],
    //         },
    //         context,
    //       ).then((data) => data.totalCount ?? 0),
    //   }),
    //   queryClient.prefetchQuery({
    //     queryKey: ["Organisations_TotalCount", OrganizationStatus.Deleted],
    //     queryFn: () =>
    //       getOrganisations(
    //         {
    //           pageNumber: 1,
    //           pageSize: 1,
    //           valueContains: null,
    //           statuses: [OrganizationStatus.Deleted],
    //         },
    //         context,
    //       ).then((data) => data.totalCount ?? 0),
    //   }),
    // ]);
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
      theme: theme,
      error: errorCode,
      returnUrl: returnUrl ?? null,
      user: session?.user ?? null,
    },
  };
}

const Organisations: NextPageWithLayout<{
  query?: string;
  page?: string;
  status?: string;
  theme: string;
  error?: number;
  returnUrl?: string;
  user: User;
}> = ({ query, page, status, error, returnUrl, user }) => {
  const router = useRouter();
  const queryClient = useQueryClient();

  const lookups_statuses = useMemo<SelectOption[]>(
    () => [
      { value: "0", label: "Inactive" },
      { value: "1", label: "Active" },
      { value: "2", label: "Declined" },
      { value: "3", label: "Deleted" },
    ],
    [],
  );

  // search filter state
  const searchFilter = useMemo(
    () => ({
      pageNumber: page ? parseInt(page.toString()) : 1,
      pageSize: PAGE_SIZE,
      valueContains: query?.toString() ?? "",
      statuses:
        status != undefined
          ? lookups_statuses
              .filter((y) => y.label.toLowerCase() === status.toLowerCase())
              .map((item) => item.value)
          : null,
      organizations: null,
    }),
    [page, query, status, lookups_statuses],
  );

  // 👇 use prefetched queries from server
  const { data: totalCountAll } = useQuery<number>({
    queryKey: ["Organisations_TotalCount", null],
    queryFn: () =>
      getOrganisations({
        pageNumber: 1,
        pageSize: 1,
        valueContains: null,
        statuses: null,
        organizations: null,
      }).then((data) => data.totalCount ?? 0),
    enabled: !error,
  });
  const { data: totalCountActive } = useQuery<number>({
    queryKey: ["Organisations_TotalCount", OrganizationStatus.Active],
    queryFn: () =>
      getOrganisations({
        pageNumber: 1,
        pageSize: 1,
        valueContains: null,
        statuses: [OrganizationStatus.Active],
        organizations: null,
      }).then((data) => data.totalCount ?? 0),
    enabled: !error,
  });
  const { data: totalCountInactive } = useQuery<number>({
    queryKey: ["Organisations_TotalCount", OrganizationStatus.Inactive],
    queryFn: () =>
      getOrganisations({
        pageNumber: 1,
        pageSize: 1,
        valueContains: null,
        statuses: [OrganizationStatus.Inactive],
        organizations: null,
      }).then((data) => data.totalCount ?? 0),
    enabled: !error,
  });
  const { data: totalCountDeclined } = useQuery<number>({
    queryKey: ["Organisations_TotalCount", OrganizationStatus.Declined],
    queryFn: () =>
      getOrganisations({
        pageNumber: 1,
        pageSize: 1,
        valueContains: null,
        statuses: [OrganizationStatus.Declined],
        organizations: null,
      }).then((data) => data.totalCount ?? 0),
    enabled: !error,
  });
  const { data: totalCountDeleted } = useQuery<number>({
    queryKey: ["Organisations_TotalCount", OrganizationStatus.Deleted],
    queryFn: () =>
      getOrganisations({
        pageNumber: 1,
        pageSize: 1,
        valueContains: null,
        statuses: [OrganizationStatus.Deleted],
        organizations: null,
      }).then((data) => data.totalCount ?? 0),
    enabled: !error,
  });
  // this is not prefetched on the server
  const { data: searchResults } = useQuery({
    queryKey: ["Organisations", searchFilter],
    queryFn: () => getOrganisations(searchFilter),
    enabled: !error,
  });

  // 🎈 FUNCTIONS
  const getSearchFilterAsQueryString = useCallback(
    (filter: OrganizationSearchFilter) => {
      if (!filter) return null;

      // construct querystring parameters from filter
      const params = new URLSearchParams();
      if (
        filter.valueContains !== undefined &&
        filter.valueContains !== null &&
        filter.valueContains.length > 0
      )
        params.append("query", filter.valueContains);

      if (
        filter?.statuses !== undefined &&
        filter?.statuses !== null &&
        filter?.statuses.length > 0
      )
        params.append(
          "status",
          filter?.statuses
            .map(
              (status) =>
                lookups_statuses.find((item) => item.value === status)?.label,
            )
            .join("|"),
        );

      if (
        filter.pageNumber !== null &&
        filter.pageNumber !== undefined &&
        filter.pageNumber !== 1
      )
        params.append("page", filter.pageNumber.toString());

      if (params.size === 0) return null;
      return params;
    },
    [lookups_statuses],
  );

  const redirectWithSearchFilterParams = useCallback(
    (filter: OrganizationSearchFilter) => {
      let url = "/organisations";
      const params = getSearchFilterAsQueryString(filter);
      if (params != null && params.size > 0)
        url = `/organisations?${params.toString()}`;

      if (url != router.asPath)
        void router.push(url, undefined, { scroll: false });
    },
    [router, getSearchFilterAsQueryString],
  );

  // 🔔 CHANGE EVENTS
  const handlePagerChange = useCallback(
    (value: number) => {
      searchFilter.pageNumber = value;
      redirectWithSearchFilterParams(searchFilter);
    },
    [searchFilter, redirectWithSearchFilterParams],
  );

  const onSearchInputSubmit = useCallback(
    (query: string) => {
      if (query && query.length > 2) {
        // uri encode the search value
        const searchValueEncoded = encodeURIComponent(query);
        query = searchValueEncoded;
      }

      searchFilter.valueContains = query;
      redirectWithSearchFilterParams(searchFilter);
    },
    [searchFilter, redirectWithSearchFilterParams],
  );

  const updateStatus = useCallback(async () => {
    // invalidate cache
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
        <title>Yoma | Organisations</title>
      </Head>

      <PageBackground className="h-[14.5rem] md:h-[18rem]" />

      <div className="container z-10 mt-14 max-w-7xl px-2 py-8 md:mt-[7rem]">
        <div className="flex flex-col gap-4 py-4">
          <h3 className="mb-6 mt-3 flex items-center text-3xl font-semibold tracking-normal text-white md:mb-9 md:mt-0">
            Organisations
          </h3>

          {/* TABBED NAVIGATION */}
          <div className="z-10 flex justify-center md:justify-start">
            <div className="flex w-full gap-2">
              {/* LEFT BUTTON MOBILE */}
              <div className="-ml-1 mb-1 flex items-center md:hidden">
                <button
                  className="ease-bounce focus:outline-none active:scale-90"
                  onClick={() => {
                    const tabList = document.querySelector('[role="tablist"]');
                    if (tabList) {
                      tabList.scrollLeft -= 100;
                    }
                  }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-8 w-8 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                </button>
              </div>

              {/* TABS */}
              <div
                className="tabs tabs-bordered w-full gap-2 overflow-x-scroll md:overflow-hidden"
                role="tablist"
              >
                <div className="border-b border-transparent text-center text-sm font-medium text-gray-dark">
                  <ul className="-mb-px flex w-full justify-between gap-4 overflow-x-auto md:justify-start md:gap-0">
                    <li className="md:w-24">
                      <Link
                        href={`/organisations`}
                        className={`inline-block h-10 w-full whitespace-nowrap rounded-t-lg border-b-4 py-2 text-white duration-300 ${
                          !status
                            ? "active border-orange"
                            : "border-transparent hover:border-gray hover:text-gray"
                        }`}
                        role="tab"
                      >
                        All
                        {(totalCountAll ?? 0) > 0 && (
                          <div className="badge my-auto ml-2 bg-warning p-1 text-[12px] font-semibold text-white">
                            {totalCountAll}
                          </div>
                        )}
                      </Link>
                    </li>
                    <li className="md:w-24">
                      <Link
                        href={`/organisations?status=Active`}
                        className={`inline-block h-10 w-full whitespace-nowrap rounded-t-lg border-b-4 py-2 text-white duration-300 ${
                          status === "Active"
                            ? "active border-orange"
                            : "border-transparent hover:border-gray hover:text-gray"
                        }`}
                        role="tab"
                      >
                        Active
                        {(totalCountActive ?? 0) > 0 && (
                          <div className="badge my-auto ml-2 bg-warning p-1 text-[12px] font-semibold text-white">
                            {totalCountActive}
                          </div>
                        )}
                      </Link>
                    </li>
                    <li className="md:w-24">
                      <Link
                        href={`/organisations?status=Inactive`}
                        className={`inline-block h-10 w-full whitespace-nowrap rounded-t-lg border-b-4 py-2 text-white duration-300 ${
                          status === "Inactive"
                            ? "active border-orange"
                            : "border-transparent hover:border-gray hover:text-gray"
                        }`}
                        role="tab"
                      >
                        Pending
                        {(totalCountInactive ?? 0) > 0 && (
                          <div className="badge my-auto ml-2 bg-warning p-1 text-[12px] font-semibold text-white">
                            {totalCountInactive}
                          </div>
                        )}
                      </Link>
                    </li>
                    <li className="md:w-24">
                      <Link
                        href={`/organisations?status=Declined`}
                        className={`inline-block h-10 w-full whitespace-nowrap rounded-t-lg border-b-4 py-2 text-white duration-300 ${
                          status === "Declined"
                            ? "active border-orange"
                            : "border-transparent hover:border-gray hover:text-gray"
                        }`}
                        role="tab"
                      >
                        Declined
                        {(totalCountDeclined ?? 0) > 0 && (
                          <div className="badge my-auto ml-2 bg-warning p-1 text-[12px] font-semibold text-white">
                            {totalCountDeclined}
                          </div>
                        )}
                      </Link>
                    </li>
                    <li className="md:w-24">
                      <Link
                        href={`/organisations?status=Deleted`}
                        className={`inline-block h-10 w-full whitespace-nowrap rounded-t-lg border-b-4 py-2 text-white duration-300 ${
                          status === "Deleted"
                            ? "active border-orange"
                            : "border-transparent hover:border-gray hover:text-gray"
                        }`}
                        role="tab"
                      >
                        Deleted
                        {(totalCountDeleted ?? 0) > 0 && (
                          <div className="badge my-auto ml-2 bg-warning p-1 text-[12px] font-semibold text-white">
                            {totalCountDeleted}
                          </div>
                        )}
                      </Link>
                    </li>
                  </ul>
                </div>
              </div>

              {/* RIGHT BUTTON MOBILE */}
              <div className="-mr-1 mb-1 flex items-center md:hidden">
                <button
                  className="ease-bounce focus:outline-none active:scale-90"
                  onClick={() => {
                    const tabList = document.querySelector('[role="tablist"]');
                    if (tabList) {
                      tabList.scrollLeft += 100;
                    }
                  }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-8 w-8 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* SEARCH INPUT */}
          <div className="flex w-full flex-grow items-center justify-between gap-4 sm:justify-end">
            <SearchInput defaultValue={query} onSearch={onSearchInputSubmit} />

            <Link
              href={`/organisations/register${`?returnUrl=${encodeURIComponent(
                getSafeUrl(returnUrl?.toString(), router.asPath),
              )}`}`}
              className="bg-theme btn btn-circle btn-secondary btn-sm h-fit w-fit whitespace-nowrap !border-none p-1 text-xs text-white shadow-custom brightness-105 md:p-2 md:px-4"
              id="btnCreateOpportunity" // e2e
            >
              <IoIosAdd className="h-7 w-7 md:h-5 md:w-5" />
              <span className="hidden md:inline">Add organisation</span>
            </Link>
          </div>
        </div>

        <div className="rounded-lg md:p-4">
          {/* NO RESULTS */}
          {searchResults && searchResults.totalCount === 0 && (
            <div className="flex h-fit flex-col items-center rounded-lg bg-white pb-8 md:pb-16">
              <NoRowsMessage
                title={"No organisations found"}
                description={"Please try refining your search query."}
              />

              {!status && (
                <Link
                  href={`/organisations/register${`?returnUrl=${encodeURIComponent(
                    getSafeUrl(returnUrl?.toString(), router.asPath),
                  )}`}`}
                  className="bg-theme btn btn-primary rounded-3xl border-0 px-16 brightness-105 hover:brightness-110"
                  id="btnCreateOpportunity" // e2e
                >
                  <IoIosAdd className="mr-1 h-5 w-5" />
                  Add organisation
                </Link>
              )}
            </div>
          )}

          {/* RESULTS */}
          {searchResults && searchResults.items.length > 0 && (
            <div className="grid w-full place-items-center">
              <div className="xs:grid-cols-1 grid w-full grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {searchResults.items.map((item: any) => (
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
          )}

          {/* PAGINATION */}
          <div className="mt-2 grid place-items-center justify-center">
            <PaginationButtons
              currentPage={page ? parseInt(page) : 1}
              totalItems={searchResults?.totalCount ?? 0}
              pageSize={PAGE_SIZE}
              onClick={handlePagerChange}
              showPages={false}
              showInfo={true}
            />
          </div>
        </div>
      </div>
    </>
  );
};

Organisations.getLayout = function getLayout(page: ReactElement) {
  return <MainLayout>{page}</MainLayout>;
};

// 👇 return theme from component properties. this is set server-side (getServerSideProps)
Organisations.theme = function getTheme(page: ReactElement<{ theme: string }>) {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return page.props.theme;
};

export default Organisations;
