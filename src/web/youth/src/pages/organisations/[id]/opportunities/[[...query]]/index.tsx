import { QueryClient, dehydrate, useQuery } from "@tanstack/react-query";
import { type GetServerSidePropsContext } from "next";
import { getServerSession } from "next-auth";
import Head from "next/head";
import { useRouter } from "next/router";
import { useCallback, type ReactElement } from "react";
import { getOpportunitiesAdmin } from "~/api/services/opportunities";
import MainLayout from "~/components/Layout/Main";
import withAuth from "~/context/withAuth";
import { authOptions } from "~/server/auth";
import { type OpportunitySearchResults } from "~/api/models/opportunity";
import { NextPageWithLayout } from "~/pages/_app";
import { ParsedUrlQuery } from "querystring";
import Link from "next/link";
import { PageBackground } from "~/components/PageBackground";
import { IoIosAdd } from "react-icons/io";
import { SearchInput } from "~/components/SearchInput";
import NoRowsMessage from "~/components/NoRowsMessage";

interface IParams extends ParsedUrlQuery {
  id: string;
  query?: string;
  page?: string;
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const { id } = context.params as IParams;
  const { query, page } = context.query;

  const session = await getServerSession(context.req, context.res, authOptions);

  const queryClient = new QueryClient();
  if (session) {
    // 👇 prefetch queries (on server)
    await queryClient.prefetchQuery(
      [`OpportunitiesActive_${id}_${query?.toString()}_${page?.toString()}`],
      () =>
        getOpportunitiesAdmin(
          {
            organizations: [id],
            pageNumber: page ? parseInt(page.toString()) : 1,
            pageSize: 10,
            startDate: null,
            endDate: null,
            statuses: null,
            types: null,
            categories: null,
            languages: null,
            countries: null,
            valueContains: query as any,
          },
          context,
        ),
    );
  }

  return {
    props: {
      dehydratedState: dehydrate(queryClient),
      user: session?.user ?? null, // (required for 'withAuth' HOC component)
      id: id ?? null,
      query: query ?? null,
      page: page ?? null,
    },
  };
}

const Opportunities: NextPageWithLayout<{
  id: string;
  query?: string;
  page?: string;
}> = ({ id, query, page }) => {
  const router = useRouter();

  // 👇 use prefetched queries (from server)
  const { data: opportunities } = useQuery<OpportunitySearchResults>({
    queryKey: [
      `OpportunitiesActive_${id}_${query?.toString()}_${page?.toString()}`,
    ],
    queryFn: () =>
      getOpportunitiesAdmin({
        organizations: [id],
        pageNumber: page ? parseInt(page.toString()) : 1,
        pageSize: 10,
        startDate: null,
        endDate: null,
        statuses: null,
        types: null,
        categories: null,
        languages: null,
        countries: null,
        valueContains: query as any,
      }),
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
    [router],
  );

  return (
    <>
      <Head>
        <title>Yoma Partner | Opportunities</title>
      </Head>

      <PageBackground />

      <div className="container z-10 max-w-5xl px-2 py-8">
        <div className="flex flex-col gap-2 py-4 sm:flex-row">
          <h3 className="flex flex-grow text-white">Opportunities</h3>

          <div className="flex gap-2 sm:justify-end">
            <SearchInput defaultValue={query} onSearch={onSearch} />

            <Link
              href={`/organisations/${id}/opportunities/create`}
              className="flex w-40 flex-row items-center justify-center whitespace-nowrap rounded-full bg-green-dark p-1 text-xs text-white"
            >
              <IoIosAdd className="h-5 w-5 mr-1" />
              Add opportunity
            </Link>
          </div>
        </div>

        <div className="rounded-lg bg-white p-4">
          {/* NO ROWS */}
          {opportunities && opportunities.items?.length === 0 && !query && (
            <NoRowsMessage
              title={"No opportunities found"}
              description={"Opportunities that you add will be displayed here."}
            />
          )}
          {opportunities && opportunities.items?.length === 0 && query && (
            <NoRowsMessage
              title={"No opportunities found"}
              description={"Please try refining your search query."}
            />
          )}

          {/* GRID */}
          {opportunities && opportunities.items?.length > 0 && (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Opportunity title</th>
                    <th>Reward</th>
                    <th>Url</th>
                    <th>Participants</th>
                  </tr>
                </thead>
                <tbody>
                  {opportunities.items.map((opportunity) => (
                    <tr key={opportunity.id}>
                      <td>
                        <Link
                          href={`/organisations/${id}/opportunities/${opportunity.id}/info`}
                        >
                          {opportunity.title}
                        </Link>
                      </td>
                      <td>
                        <>
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
                        </>
                      </td>
                      <td>{opportunity.url}</td>
                      <td>{opportunity.participantCount}</td>
                      {/* <td>{opportunity.ver}</td>  */}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            // <ReactDataGrid
            //   columns={[
            //     { key: "title", name: "Title" },
            //     { key: "type", name: "Type" },
            //     { key: "skills", name: "Skills", renderCell: SkillsFormatter },
            //     { key: "status", name: "Status", renderCell: StatusFormatter },
            //     { key: "zltoReward", name: "ZLTO" },
            //     {
            //       key: "unverifiedCredentials",
            //       name: "Participants (verifications)",
            //       renderCell: UnverifiedCredentialsFormatter,
            //     },
            //     { key: "opportunityURL", name: "Short Link" },
            //     { key: "opportunityURL1", name: "Magic Link" },
            //     {
            //       key: "opportunityURL2",
            //       name: "Manage",
            //       renderCell: ManageFormatter,
            //       cellClass: "flex justify-center items-center",
            //     },
            //   ]}
            //   rows={opportunities}
            // />
          )}
        </div>
      </div>
    </>
  );
};

Opportunities.getLayout = function getLayout(page: ReactElement) {
  return <MainLayout>{page}</MainLayout>;
};

export default withAuth(Opportunities);
