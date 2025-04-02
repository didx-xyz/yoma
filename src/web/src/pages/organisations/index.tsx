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
import CustomSlider from "~/components/Carousel/CustomSlider";

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
        <title>Yoma | Organisations</title>
      </Head>

      <PageBackground className="h-[14.8rem] md:h-[18.4rem]" />

      <div className="z-10 container mt-14 max-w-7xl px-2 py-8 md:mt-[7rem]">
        <div className="flex flex-col gap-4 py-4">
          <h3 className="mt-3 mb-6 flex items-center text-3xl font-semibold tracking-normal text-white md:mt-0 md:mb-9">
            Organisations
          </h3>

          {/* TABBED NAVIGATION */}
          <CustomSlider sliderClassName="!gap-6">
            <a
              role="tab"
              className={`border-b-4 py-2 whitespace-nowrap text-white ${
                status === null
                  ? "active border-orange"
                  : "hover:border-gray hover:text-gray border-transparent"
              }`}
              onClick={() => router.push("/organisations")}
            >
              All{" "}
              {(totalCountAll ?? 0) > 0 && (
                <div className="badge bg-warning my-auto ml-2 p-1 text-[12px] font-semibold text-white">
                  {totalCountAll}
                </div>
              )}
            </a>
            <a
              role="tab"
              className={`border-b-4 py-2 whitespace-nowrap text-white ${
                status === "Active"
                  ? "active border-orange"
                  : "hover:border-gray hover:text-gray border-transparent"
              }`}
              onClick={() => router.push("/organisations?status=Active")}
            >
              Active{" "}
              {(totalCountActive ?? 0) > 0 && (
                <div className="badge bg-warning my-auto ml-2 p-1 text-[12px] font-semibold text-white">
                  {totalCountActive}
                </div>
              )}
            </a>
            <a
              role="tab"
              className={`border-b-4 py-2 font-semibold whitespace-nowrap text-white ${
                status === "Inactive"
                  ? "active border-orange"
                  : "hover:border-gray hover:text-gray border-transparent"
              }`}
              onClick={() => router.push("/organisations?status=Inactive")}
            >
              Pending
              {(totalCountInactive ?? 0) > 0 && (
                <div className="badge bg-warning my-auto ml-2 p-1 text-[12px] font-semibold text-white">
                  {totalCountInactive}
                </div>
              )}
            </a>
            <a
              role="tab"
              className={`border-b-4 py-2 font-semibold whitespace-nowrap text-white ${
                status === "Declined"
                  ? "active border-orange"
                  : "hover:border-gray hover:text-gray border-transparent"
              }`}
              onClick={() => router.push("/organisations?status=Declined")}
            >
              Declined{" "}
              {(totalCountDeclined ?? 0) > 0 && (
                <div className="badge bg-warning my-auto ml-2 p-1 text-[12px] font-semibold text-white">
                  {totalCountDeclined}
                </div>
              )}
            </a>
            <a
              role="tab"
              className={`border-b-4 py-2 font-semibold whitespace-nowrap text-white ${
                status === "Deleted"
                  ? "active border-orange"
                  : "hover:border-gray hover:text-gray border-transparent"
              }`}
              onClick={() => router.push("/organisations?status=Deleted")}
            >
              Deleted
              {(totalCountDeleted ?? 0) > 0 && (
                <div className="badge bg-warning my-auto ml-2 p-1 text-[12px] font-semibold text-white">
                  {totalCountDeleted}
                </div>
              )}
            </a>
          </CustomSlider>

          {/* SEARCH INPUT */}
          <div className="flex w-full grow items-center justify-between gap-4 sm:justify-end">
            <SearchInput defaultValue={query} onSearch={onSearchInputSubmit} />

            <Link
              href={`/organisations/register${`?returnUrl=${encodeURIComponent(
                getSafeUrl(returnUrl?.toString(), router.asPath),
              )}`}`}
              className="bg-theme btn btn-circle btn-secondary btn-sm shadow-custom h-fit w-fit !border-none p-1 text-xs whitespace-nowrap text-white brightness-105 md:p-2 md:px-4"
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
  return page.props.theme;
};

export default Organisations;
