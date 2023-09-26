import { QueryClient, dehydrate, useQuery } from "@tanstack/react-query";
import { type GetServerSidePropsContext } from "next";
import { getServerSession } from "next-auth";
import Head from "next/head";
import { useRouter } from "next/router";
import { type ReactElement } from "react";
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

interface IParams extends ParsedUrlQuery {
  id: string;
  query?: string;
  page?: string;
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const { id, query, page } = context.params as IParams;
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
            valueContains: query ?? null,
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
    // queryFn: () =>
    //   getOpportunitiesAdmin(
    //     {
    //       organizations: [id],
    //       pageNumber: 1,
    //       pageSize: 10,
    //       startDate: null,
    //       endDate: null,
    //       statuses: null,
    //       types: null,
    //       categories: null,
    //       languages: null,
    //       countries: null,
    //       valueContains: query,
    //     },
    //     null,
    //   ),
  });

  // const SkillsFormatter = useCallback(
  //   (row: RenderCellProps<FullOpportunityResponseDto>) => {
  //     return row.row.skills.join(", ");
  //   },
  //   [],
  // );

  // const StatusFormatter = useCallback(
  //   (row: RenderCellProps<FullOpportunityResponseDto>) => {
  //     return row.row.endTime && Date.parse(row.row.endTime) < Date.now()
  //       ? "Expired"
  //       : "Active";
  //   },
  //   [],
  // );

  // const UnverifiedCredentialsFormatter = useCallback(
  //   (row: RenderCellProps<FullOpportunityResponseDto>) => {
  //     return row.row.unverifiedCredentials ? (
  //       <div className="grid grid-cols-2 items-center justify-center">
  //         <div>{row.row.unverifiedCredentials}</div>
  //         <Link
  //           href={`/dashboard/verify/${row.row.id}`}
  //           className="btn btn-warning btn-xs flex flex-row flex-nowrap"
  //         >
  //           <FaExclamationTriangle className="text-yellow-700 mr-2 h-4 w-4" />
  //           Verify
  //         </Link>
  //       </div>
  //     ) : (
  //       "n/a"
  //     );
  //   },
  //   [],
  // );

  // const ManageFormatter = useCallback(
  //   (row: RenderCellProps<FullOpportunityResponseDto>) => {
  //     return (
  //       <Link href={`/dashboard/opportunity/${row.row.id}`}>
  //         <IoMdSettings className="h-6 w-6" />
  //       </Link>
  //     );
  //   },
  //   [],
  // );

  return (
    <>
      <Head>
        <title>Yoma Partner | Opportunities</title>
      </Head>
      <PageBackground />
      <div className="container z-10">
        <div className="flex flex-row py-4">
          <h3 className="flex flex-grow">Opportunities</h3>
          <div className="flex justify-end">
            <Link
              href={`/organisations/${id}/opportunities/create`}
              className="bg-green-dark whitespace-nowrap rounded-full text-white"
            >
              <IoIosAdd className="h-5 w-5" />
              Create New
            </Link>
          </div>
        </div>

        <div className="rounded-lg bg-white p-4">
          {/* NO ROWS */}
          {opportunities && opportunities.items?.length === 0 && (
            <div
              style={{
                textAlign: "center",
                padding: "100px",
              }}
            >
              <h3>No data to show</h3>
            </div>
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
