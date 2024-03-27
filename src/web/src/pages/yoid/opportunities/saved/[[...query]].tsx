import { QueryClient, dehydrate, useQuery } from "@tanstack/react-query";
import { type GetServerSidePropsContext } from "next";
import { getServerSession } from "next-auth";
import router from "next/router";
import { useCallback, type ReactElement } from "react";
import { authOptions } from "~/server/auth";
import { type NextPageWithLayout } from "../../../_app";
import { PAGE_SIZE } from "~/lib/constants";
import { type ParsedUrlQuery } from "querystring";
import NoRowsMessage from "~/components/NoRowsMessage";
import { PaginationButtons } from "~/components/PaginationButtons";
import { ApiErrors } from "~/components/Status/ApiErrors";
import { Unauthorized } from "~/components/Status/Unauthorized";
import { searchMyOpportunities } from "~/api/services/myOpportunities";
import { Action, type MyOpportunityInfo } from "~/api/models/myOpportunity";
import YoIDTabbedOpportunities from "~/components/Layout/YoIDTabbedOpportunities";
import { OpportunityListItem } from "~/components/MyOpportunity/OpportunityListItem";
import { PaginationInfoComponent } from "~/components/PaginationInfo";
import { LoadingSkeleton } from "~/components/Status/LoadingSkeleton";
import { config } from "~/lib/react-query-config";

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

  // 👇 prefetch queries on server
  await queryClient.prefetchQuery({
    queryKey: ["MyOpportunities_Saved"],
    queryFn: () =>
      searchMyOpportunities({
        action: Action.Saved,
        verificationStatuses: null,
        pageNumber: page ? parseInt(page.toString()) : 1,
        pageSize: PAGE_SIZE,
      }),
  });

  return {
    props: {
      dehydratedState: dehydrate(queryClient),
      user: session?.user ?? null,
      id: id ?? null,
      query: query ?? null,
      page: page ?? "1",
    },
  };
}

const MyOpportunitiesSaved: NextPageWithLayout<{
  query?: string;
  page?: string;
  error: string;
}> = ({ query, page, error }) => {
  // 👇 use prefetched queries from server
  const {
    data: dataMyOpportunities,
    error: dataMyOpportunitiesError,
    isLoading: dataMyOpportunitiesIsLoading,
  } = useQuery({
    queryKey: [`MyOpportunities_Saved`],
    queryFn: () =>
      searchMyOpportunities({
        action: Action.Saved,
        verificationStatuses: null,
        pageNumber: page ? parseInt(page.toString()) : 1,
        pageSize: PAGE_SIZE,
      }),
    enabled: !error,
  });

  // 🔔 pager change event
  const handlePagerChange = useCallback(
    (value: number) => {
      // redirect
      void router.push({
        pathname: `/yoid/opportunities/saved`,
        query: { query: query, page: value },
      });
    },
    [query],
  );

  const handleOnClickOportunity = useCallback((item: MyOpportunityInfo) => {
    window.open(`/opportunities/${item.opportunityId}`, "_blank");
  }, []);

  if (error) return <Unauthorized />;

  return (
    <div className="flex flex-col gap-4">
      <h6 className="font-bold tracking-wider">
        Saved opportunities <span className="text-red-600">❤</span>
      </h6>

      {/* ERRROR */}
      {dataMyOpportunitiesError && (
        <ApiErrors error={dataMyOpportunitiesError} />
      )}

      {/* LOADING */}
      {dataMyOpportunitiesIsLoading && <LoadingSkeleton />}

      {/* NO ROWS */}
      {dataMyOpportunities && dataMyOpportunities.totalCount === 0 && (
        <div className="flex justify-center rounded-lg bg-white text-center md:p-8">
          <NoRowsMessage
            title={"You don't have any saved opportunities."}
            description={
              "Opportunities you have saved will be listed here for easy access and reference. To save an opportunity, simply click the 'Save' button when viewing the opportunity details. This way, you can quickly find and return to the opportunities that interest you most."
            }
          />
        </div>
      )}

      {dataMyOpportunities && dataMyOpportunities.items?.length > 0 && (
        <div className="flex flex-col gap-4">
          {/* PAGINATION INFO */}
          <PaginationInfoComponent
            currentPage={parseInt(page as string)}
            itemCount={
              dataMyOpportunities?.items ? dataMyOpportunities.items.length : 0
            }
            totalItems={dataMyOpportunities?.totalCount ?? 0}
            pageSize={PAGE_SIZE}
            query={null}
          />
          {/* GRID */}
          <div className="flex flex-col gap-4">
            {dataMyOpportunities.items.map((item, index) => (
              <OpportunityListItem
                key={index}
                data={item}
                onClick={handleOnClickOportunity}
                displayDate={item.dateModified ?? ""}
              />
            ))}
          </div>

          {/* PAGINATION BUTTONS */}
          <div className="mt-2 grid place-items-center justify-center">
            <PaginationButtons
              currentPage={page ? parseInt(page) : 1}
              totalItems={dataMyOpportunities?.totalCount ?? 0}
              pageSize={PAGE_SIZE}
              onClick={handlePagerChange}
              showPages={false}
            />
          </div>
        </div>
      )}
    </div>
  );
};

MyOpportunitiesSaved.getLayout = function getLayout(page: ReactElement) {
  return <YoIDTabbedOpportunities>{page}</YoIDTabbedOpportunities>;
};

export default MyOpportunitiesSaved;
