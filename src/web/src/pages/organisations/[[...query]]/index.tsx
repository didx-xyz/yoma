import { QueryClient, dehydrate, useQuery } from "@tanstack/react-query";
import { type GetServerSidePropsContext } from "next";
import { getServerSession } from "next-auth";
import Head from "next/head";
import { useRouter } from "next/router";
import { useCallback, useState, type ReactElement } from "react";
import MainLayout from "~/components/Layout/Main";
import { User, authOptions } from "~/server/auth";
import { Status } from "~/api/models/opportunity";
import { type NextPageWithLayout } from "~/pages/_app";
import { type ParsedUrlQuery } from "querystring";
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
import { getSafeUrl, getThemeFromRole } from "~/lib/utils";
import axios from "axios";
import { InternalServerError } from "~/components/Status/InternalServerError";
import { Unauthenticated } from "~/components/Status/Unauthenticated";
import { getOrganisations } from "~/api/services/organisations";
import { SelectOption } from "~/api/models/lookups";
import {
  OrganizationSearchFilter,
  OrganizationSearchResults,
} from "~/api/models/organisation";
import { OrganisationCardComponent } from "~/components/Organisation/OrganisationCardComponent";

interface IParams extends ParsedUrlQuery {
  id: string;
  query?: string;
  page?: string;
  status?: string;
}

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
    // 👇 prefetch queries on server
    // const data = await getOrganisations(
    //   {
    //     pageNumber: page ? parseInt(page.toString()) : 1,
    //     pageSize: PAGE_SIZE,
    //     valueContains: query?.toString() ?? "",
    //     statuses:
    //       status === "active"
    //         ? [Status.Active]
    //         : status === "inactive"
    //           ? [Status.Inactive]
    //           : status === "expired"
    //             ? [Status.Expired]
    //             : status === "deleted"
    //               ? [Status.Deleted]
    //               : null,
    //   },
    //   context,
    // );
    // await queryClient.prefetchQuery({
    //   queryKey: ["Organisations", query, page, status],
    //   queryFn: () => data,
    // });
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
      // dehydratedState: dehydrate(queryClient),
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

  const lookups_statuses: SelectOption[] = [
    { value: "0", label: "Active" },
    { value: "1", label: "Deleted" },
    { value: "2", label: "Expired" },
    { value: "3", label: "Inactive" },
  ];

  // search filter state
  const [searchFilter, setSearchFilter] = useState<OrganizationSearchFilter>({
    pageNumber: page ? parseInt(page.toString()) : 1,
    pageSize: PAGE_SIZE,
    valueContains: query?.toString() ?? "",
    statuses:
      status != undefined
        ? lookups_statuses
            .filter((y) => y.label === status)
            .map((item) => item.value)
        : null,
  });

  // 👇 use prefetched queries from server
  const { data: searchResults } = useQuery<OrganizationSearchResults>({
    queryKey: ["Organisations", query, page, status],
    queryFn: () => getOrganisations(searchFilter),
    enabled: !error,
  });

  const onSearch = useCallback(
    (query: string) => {
      if (query && query.length > 2) {
        // uri encode the search value
        const queryEncoded = encodeURIComponent(query);

        // redirect to the search page
        void router.push(
          `/organisations?query=${queryEncoded}${
            status ? `&status=${status}` : ""
          }`,
        );
      } else {
        void router.push(`/organisations${status ? `?status=${status}` : ""}`);
      }
    },
    [router, status],
  );

  // 🔔 pager change event
  const handlePagerChange = useCallback(
    (value: number) => {
      // redirect
      void router.push({
        pathname: `/organisations`,
        query: { query: query, page: value, status: status },
      });

      // reset scroll position
      window.scrollTo(0, 0);
    },
    [query, router, status],
  );

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
              {/* TABS */}
              <div
                className="tabs tabs-bordered w-full gap-2 overflow-x-scroll md:overflow-hidden"
                role="tablist"
              >
                <div className="border-b border-transparent text-center text-sm font-medium text-gray-dark">
                  <ul className="overflow-x-hiddem -mb-px flex w-full justify-center gap-0 md:justify-start">
                    <li className="w-1/5 md:w-20">
                      <Link
                        href={`/organisations`}
                        className={`inline-block w-full rounded-t-lg border-b-4 py-2 text-white duration-300 ${
                          !status
                            ? "active border-orange"
                            : "border-transparent hover:border-gray hover:text-gray"
                        }`}
                        role="tab"
                      >
                        All
                      </Link>
                    </li>
                    <li className="w-1/5 md:w-20">
                      <Link
                        href={`/organisations?status=active`}
                        className={`inline-block w-full rounded-t-lg border-b-4 py-2 text-white duration-300 ${
                          status === "active"
                            ? "active border-orange"
                            : "border-transparent hover:border-gray hover:text-gray"
                        }`}
                        role="tab"
                      >
                        Active
                      </Link>
                    </li>
                    <li className="w-1/5 md:w-20">
                      <Link
                        href={`/organisations?status=inactive`}
                        className={`inline-block w-full rounded-t-lg border-b-4 py-2 text-white duration-300 ${
                          status === "inactive"
                            ? "active border-orange"
                            : "border-transparent hover:border-gray hover:text-gray"
                        }`}
                        role="tab"
                      >
                        Inactive
                      </Link>
                    </li>
                    <li className="w-1/5 md:w-20">
                      <Link
                        href={`/organisations?status=expired`}
                        className={`inline-block w-full rounded-t-lg border-b-4 py-2 text-white duration-300 ${
                          status === "expired"
                            ? "active border-orange"
                            : "border-transparent hover:border-gray hover:text-gray"
                        }`}
                        role="tab"
                      >
                        Expired
                      </Link>
                    </li>
                    <li className="w-1/5 md:w-20">
                      <Link
                        href={`/organisations?status=deleted`}
                        className={`inline-block w-full rounded-t-lg border-b-4 py-2 text-white duration-300 ${
                          status === "deleted"
                            ? "active border-orange"
                            : "border-transparent hover:border-gray hover:text-gray"
                        }`}
                        role="tab"
                      >
                        Deleted
                      </Link>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* SEARCH INPUT */}
          <div className="flex w-full flex-grow items-center justify-between gap-4 sm:justify-end">
            <SearchInput defaultValue={query} onSearch={onSearch} />

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
        searchFilter: {JSON.stringify(searchFilter)}
        <div className="rounded-lg md:bg-white md:p-4 md:shadow-custom">
          {/* NO ROWS */}
          {searchResults && searchResults.items?.length === 0 && !query && (
            <div className="flex h-fit flex-col items-center rounded-lg bg-white pb-8 md:pb-16">
              <NoRowsMessage
                title={"You will find your active opportunities here"}
                description={
                  "This is where you will find all the awesome opportunities you have shared"
                }
              />

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
            </div>
          )}
          {searchResults && searchResults.items?.length === 0 && query && (
            <div className="flex flex-col place-items-center py-32">
              <NoRowsMessage
                title={"No organisations found"}
                description={"Please try refining your search query."}
              />
            </div>
          )}

          {/* GRID */}
          {searchResults && searchResults.items.length > 0 && (
            <div className="grid w-full place-items-center">
              <div className="xs:grid-cols-1 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {searchResults.items.map((item: any) => (
                  <OrganisationCardComponent
                    key={`OrganisationCardComponent_${item.id}`}
                    item={item}
                    user={user}
                  />
                ))}
              </div>
            </div>
          )}

          <div className="mt-2 grid place-items-center justify-center">
            {/* PAGINATION */}
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
Organisations.theme = function getTheme(page: ReactElement) {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return page.props.theme;
};

export default Organisations;
