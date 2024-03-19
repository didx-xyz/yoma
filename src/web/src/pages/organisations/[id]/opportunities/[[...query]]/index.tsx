import { QueryClient, dehydrate, useQuery } from "@tanstack/react-query";
import { type GetServerSidePropsContext } from "next";
import { getServerSession } from "next-auth";
import Head from "next/head";
import { useRouter } from "next/router";
import { useCallback, type ReactElement } from "react";
import { getOpportunitiesAdmin } from "~/api/services/opportunities";
import MainLayout from "~/components/Layout/Main";
import { type User, authOptions } from "~/server/auth";
import {
  Status,
  type OpportunitySearchResults,
} from "~/api/models/opportunity";
import { type NextPageWithLayout } from "~/pages/_app";
import { type ParsedUrlQuery } from "querystring";
import Link from "next/link";
import { PageBackground } from "~/components/PageBackground";
import { IoIosAdd } from "react-icons/io";
import { SearchInput } from "~/components/SearchInput";
import NoRowsMessage from "~/components/NoRowsMessage";
import { PAGE_SIZE, ROLE_ADMIN } from "~/lib/constants";
import { PaginationButtons } from "~/components/PaginationButtons";
import { Unauthorized } from "~/components/Status/Unauthorized";
import { config } from "~/lib/react-query-config";
import { currentOrganisationInactiveAtom } from "~/lib/store";
import { useAtomValue } from "jotai";
import LimitedFunctionalityBadge from "~/components/Status/LimitedFunctionalityBadge";
import { getThemeFromRole } from "~/lib/utils";

interface IParams extends ParsedUrlQuery {
  id: string;
  query?: string;
  page?: string;
}

// ⚠️ SSR
export async function getServerSideProps(context: GetServerSidePropsContext) {
  const { id } = context.params as IParams;
  const session = await getServerSession(context.req, context.res, authOptions);

  // 👇 ensure authenticated
  if (!session) {
    return {
      props: {
        error: "Unauthorized",
      },
    };
  }

  // 👇 set theme based on role
  const theme = getThemeFromRole(session, id);

  // 👇 prefetch queries on server
  const { query, page } = context.query;
  const queryClient = new QueryClient(config);
  await queryClient.prefetchQuery({
    queryKey: [
      `OpportunitiesActive_${id}_${query?.toString()}_${page?.toString()}`,
    ],
    queryFn: () =>
      getOpportunitiesAdmin(
        {
          organizations: [id],
          pageNumber: page ? parseInt(page.toString()) : 1,
          pageSize: PAGE_SIZE,
          startDate: null,
          endDate: null,
          // admins can see deleted opportunities, org admins can see Active, Expired & Inactive
          statuses: session?.user?.roles.some((x) => x === ROLE_ADMIN)
            ? null
            : [Status.Active, Status.Expired, Status.Inactive],
          types: null,
          categories: null,
          languages: null,
          countries: null,
          valueContains: query?.toString() ?? null,
          commitmentIntervals: null,
          zltoRewardRanges: null,
        },
        context,
      ),
  });

  return {
    props: {
      dehydratedState: dehydrate(queryClient),
      user: session?.user ?? null,
      id: id ?? null,
      query: query ?? null,
      page: page ?? null,
      theme: theme,
    },
  };
}

const Opportunities: NextPageWithLayout<{
  id: string;
  query?: string;
  page?: string;
  user?: User;
  error: string;
  theme: string;
}> = ({ id, query, page, user, error }) => {
  const currentOrganisationInactive = useAtomValue(
    currentOrganisationInactiveAtom,
  );

  const router = useRouter();

  // 👇 use prefetched queries from server
  const { data: opportunities } = useQuery<OpportunitySearchResults>({
    queryKey: [
      `OpportunitiesActive_${id}_${query?.toString()}_${page?.toString()}`,
    ],
    queryFn: () =>
      getOpportunitiesAdmin({
        organizations: [id],
        pageNumber: page ? parseInt(page.toString()) : 1,
        pageSize: PAGE_SIZE,
        startDate: null,
        endDate: null,
        // admins can see deleted opportunities, org admins can see Active, Expired & Inactive
        statuses: user?.roles.some((x) => x === ROLE_ADMIN)
          ? null
          : [Status.Active, Status.Expired, Status.Inactive],
        types: null,
        categories: null,
        languages: null,
        countries: null,
        valueContains: query?.toString() ?? null,
        commitmentIntervals: null,
        zltoRewardRanges: null,
      }),
    enabled: !error,
  });

  const onSearch = useCallback(
    (query: string) => {
      if (query && query.length > 2) {
        // uri encode the search value
        const queryEncoded = encodeURIComponent(query);

        // redirect to the search page
        void router.push(
          `/organisations/${id}/opportunities?query=${queryEncoded}`,
        );
      } else {
        void router.push(`/organisations/${id}/opportunities`);
      }
    },
    [router, id],
  );

  // 🔔 pager change event
  const handlePagerChange = useCallback(
    (value: number) => {
      // redirect
      void router.push({
        pathname: `/organisations/${id}/opportunities`,
        query: { query: query, page: value },
      });

      // reset scroll position
      window.scrollTo(0, 0);
    },
    [query, id, router],
  );

  if (error) return <Unauthorized />;

  return (
    <>
      <Head>
        <title>Yoma | Opportunities</title>
      </Head>

      <PageBackground />

      <div className="container z-10 mt-20 max-w-7xl px-2 py-8">
        <div className="flex flex-col py-4 sm:flex-row">
          <h3 className="flex flex-grow items-center font-semibold text-white">
            Opportunities <LimitedFunctionalityBadge />
          </h3>

          <div className="flex gap-4 sm:justify-end">
            <SearchInput defaultValue={query} onSearch={onSearch} />

            {currentOrganisationInactive ? (
              <span className="bg-theme flex w-56 cursor-not-allowed flex-row items-center justify-center whitespace-nowrap rounded-full p-1 text-xs text-white brightness-75">
                Add opportunity (disabled)
              </span>
            ) : (
              <Link
                href={`/organisations/${id}/opportunities/create`}
                className="bg-theme flex w-40 flex-row items-center justify-center whitespace-nowrap rounded-full p-1 text-xs text-white brightness-105 hover:brightness-110"
                id="btnCreateOpportunity" // e2e
              >
                <IoIosAdd className="mr-1 h-5 w-5" />
                Add opportunity
              </Link>
            )}
          </div>
        </div>

        <div className="rounded-lg bg-white p-4 shadow-custom">
          {/* NO ROWS */}
          {opportunities && opportunities.items?.length === 0 && !query && (
            <div className="flex flex-col place-items-center py-52">
              <NoRowsMessage
                title={"You will find your active opportunities here"}
                description={
                  "This is where you will find all the awesome opportunities you have shared"
                }
              />
              {currentOrganisationInactive ? (
                <span className="btn btn-primary btn-sm mt-10 rounded-3xl bg-purple px-16 brightness-75">
                  Add opportunity (disabled)
                </span>
              ) : (
                <Link
                  href={`/organisations/${id}/opportunities/create`}
                  className="bg-theme btn btn-primary btn-sm mt-10 rounded-3xl border-0 px-16 brightness-105 hover:brightness-110"
                  id="btnCreateOpportunity" // e2e
                >
                  <IoIosAdd className="mr-1 h-5 w-5" />
                  Add opportunity
                </Link>
              )}
            </div>
          )}
          {opportunities && opportunities.items?.length === 0 && query && (
            <div className="flex flex-col place-items-center py-52">
              <NoRowsMessage
                title={"No opportunities found"}
                description={"Please try refining your search query."}
              />
            </div>
          )}

          {/* GRID */}
          {opportunities && opportunities.items?.length > 0 && (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr className="border-gray text-gray-dark">
                    <th>Opportunity title</th>
                    <th>Reward</th>
                    <th>Url</th>
                    <th>Participants</th>
                  </tr>
                </thead>
                <tbody>
                  {opportunities.items.map((opportunity) => (
                    <tr key={opportunity.id} className="border-gray">
                      <td>
                        <Link
                          href={`/organisations/${id}/opportunities/${opportunity.id}/info`}
                        >
                          {opportunity.title}
                        </Link>
                      </td>
                      <td className="w-28">
                        <div className="flex flex-col">
                          {opportunity.zltoReward && (
                            <span className="text-xs">
                              {opportunity.zltoReward} Zlto
                            </span>
                          )}
                          {opportunity.yomaReward && (
                            <span className="text-xs">
                              {opportunity.yomaReward} Yoma
                            </span>
                          )}
                        </div>
                      </td>
                      <td>{opportunity.url}</td>
                      <td>{opportunity.participantCountTotal}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="mt-2 grid place-items-center justify-center">
            {/* PAGINATION */}
            <PaginationButtons
              currentPage={page ? parseInt(page) : 1}
              totalItems={opportunities?.totalCount ?? 0}
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

Opportunities.getLayout = function getLayout(page: ReactElement) {
  return <MainLayout>{page}</MainLayout>;
};

// 👇 return theme from component properties. this is set server-side (getServerSideProps)
Opportunities.theme = function getTheme(page: ReactElement) {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return page.props.theme;
};

export default Opportunities;
