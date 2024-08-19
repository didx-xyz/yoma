import { QueryClient, dehydrate, useQuery } from "@tanstack/react-query";
import { type GetServerSidePropsContext } from "next";
import { getServerSession } from "next-auth";
import Head from "next/head";
import router from "next/router";
import { type ParsedUrlQuery } from "querystring";
import { useCallback, type ReactElement } from "react";
import { Action, VerificationStatus } from "~/api/models/myOpportunity";
import { searchMyOpportunities } from "~/api/services/myOpportunities";
import Suspense from "~/components/Common/Suspense";
import YoIDOpportunities from "~/components/Layout/YoIDOpportunities";
import { OpportunityListItem } from "~/components/MyOpportunity/OpportunityListItem";
import NoRowsMessage from "~/components/NoRowsMessage";
import { PaginationButtons } from "~/components/PaginationButtons";
import { PaginationInfoComponent } from "~/components/PaginationInfo";
import { Unauthorized } from "~/components/Status/Unauthorized";
import { PAGE_SIZE } from "~/lib/constants";
import { config } from "~/lib/react-query-config";
import { authOptions } from "~/server/auth";
import { type NextPageWithLayout } from "../../../_app";

interface IParams extends ParsedUrlQuery {
  query?: string;
  page?: string;
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const session = await getServerSession(context.req, context.res, authOptions);

  // 👇 ensure authenticated
  if (!session) {
    return {
      props: {
        error: "Unauthorized",
      },
    };
  }

  const queryClient = new QueryClient(config);
  const { id } = context.params as IParams;
  const { query, page } = context.query;
  const pageNumber = page ? parseInt(page.toString()) : 1;

  // 👇 prefetch queries on server
  await queryClient.prefetchQuery({
    queryKey: ["MyOpportunities_Pending", pageNumber],
    queryFn: () =>
      searchMyOpportunities(
        {
          action: Action.Verification,
          verificationStatuses: [VerificationStatus.Pending],
          pageNumber: pageNumber,
          pageSize: PAGE_SIZE,
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
      pageNumber: pageNumber,
    },
  };
}

const MyOpportunitiesPending: NextPageWithLayout<{
  query?: string;
  pageNumber: number;
  error: string;
}> = ({ query, pageNumber, error }) => {
  // 👇 use prefetched queries from server
  const {
    data: data,
    error: dataError,
    isLoading: dataIsLoading,
  } = useQuery({
    queryKey: [`MyOpportunities_Pending`, pageNumber],
    queryFn: () =>
      searchMyOpportunities({
        action: Action.Verification,
        verificationStatuses: [VerificationStatus.Pending],
        pageNumber: pageNumber,
        pageSize: PAGE_SIZE,
      }),
    enabled: !error,
  });

  // 🔔 pager change event
  const handlePagerChange = useCallback(
    (value: number) => {
      // redirect
      void router.push({
        pathname: `/yoid/opportunities/pending`,
        query: { ...(query && { query }), ...(value && { page: value }) },
      });
    },
    [query],
  );

  if (error) return <Unauthorized />;

  return (
    <>
      <Head>
        <title>Yoma | ⌚ Pending Opportunities</title>
      </Head>

      <Suspense isLoading={dataIsLoading} error={dataError}>
        {/* NO ROWS */}
        {!data?.items?.length && (
          <div className="flex justify-center rounded-lg bg-white p-8 text-center">
            <NoRowsMessage
              title={"You don't have any pending opportunities."}
              description={
                "Once you've completed an opportunity, it will undergo verification and will be displayed here for your reference."
              }
            />
          </div>
        )}

        {/* GRID */}
        {!!data?.items?.length && (
          <div className="flex flex-col gap-4">
            {/* PAGINATION INFO */}
            <PaginationInfoComponent
              currentPage={pageNumber}
              itemCount={data?.items ? data.items.length : 0}
              totalItems={data?.totalCount ?? 0}
              pageSize={PAGE_SIZE}
              query={null}
            />

            {/* GRID */}
            <div className="flex flex-col gap-4">
              {data.items.map((item, index) => (
                <OpportunityListItem
                  key={index}
                  data={item}
                  displayDate={item.dateModified ?? ""}
                />
              ))}
            </div>

            {/* PAGINATION BUTTONS */}
            <div className="mt-2 grid place-items-center justify-center">
              <PaginationButtons
                currentPage={pageNumber}
                totalItems={data?.totalCount ?? 0}
                pageSize={PAGE_SIZE}
                onClick={handlePagerChange}
                showPages={false}
                showInfo={true}
              />
            </div>
          </div>
        )}
      </Suspense>
    </>
  );
};

MyOpportunitiesPending.getLayout = function getLayout(page: ReactElement) {
  return <YoIDOpportunities>{page}</YoIDOpportunities>;
};

export default MyOpportunitiesPending;
