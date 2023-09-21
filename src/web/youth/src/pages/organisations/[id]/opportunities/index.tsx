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

interface IParams extends ParsedUrlQuery {
  id: string;
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const { id } = context.params as IParams;
  const session = await getServerSession(context.req, context.res, authOptions);

  const queryClient = new QueryClient();
  if (session) {
    // 👇 prefetch queries (on server)
    await queryClient.prefetchQuery(["opportunities", id], () =>
      getOpportunitiesAdmin(
        {
          organizations: [id],
          pageNumber: 1,
          pageSize: 10,
          startDate: null,
          endDate: null,
          statuses: null,
          types: null,
          categories: null,
          languages: null,
          countries: null,
          valueContains: null,
        },
        context,
      ),
    );
  }

  return {
    props: {
      dehydratedState: dehydrate(queryClient),
      user: session?.user ?? null, // (required for 'withAuth' HOC component)
      id: id,
    },
  };
}

const Opportunities: NextPageWithLayout<{ id: string }> = (id) => {
  const router = useRouter();

  // 👇 use prefetched queries (from server)
  const { data: opportunities } = useQuery<OpportunitySearchResults[]>({
    queryKey: ["opportunities", id],
  });

  const handleAddOpportunity = () => {
    void router.push("/organisations/${id}/opportunities/create");
  };

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
      <div className="container">
        <div className="flex flex-row py-4">
          <h3 className="flex flex-grow">Opportunities</h3>
          <div className="flex justify-end">
            <button
              type="button"
              className="btn btn-success btn-sm"
              onClick={handleAddOpportunity}
            >
              Create New
            </button>
          </div>
        </div>

        <div className="rounded-lg bg-white p-4">
          {/* NO ROWS */}
          {opportunities && opportunities.length === 0 && (
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
          <>{JSON.stringify(opportunities)}</>
          {opportunities && opportunities.length > 0 && (
            <>{JSON.stringify(opportunities)}</>

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
