import { useQuery, useQueryClient } from "@tanstack/react-query";
import { type GetServerSidePropsContext } from "next";
import { getServerSession } from "next-auth";
import { type ParsedUrlQuery } from "querystring";
import { useCallback, type ReactElement } from "react";
import {
  Action,
  MyOpportunitySearchFilter,
  MyOpportunitySearchResults,
  VerificationStatus,
} from "~/api/models/myOpportunity";
import { searchMyOpportunities } from "~/api/services/myOpportunities";
import Suspense from "~/components/Common/Suspense";
import YoIDTabbed from "~/components/Layout/YoIDTabbed";
import OpportunitiesCarousel from "~/components/MyOpportunity/OpportunitiesCarousel";
import { InternalServerError } from "~/components/Status/InternalServerError";
import { Unauthenticated } from "~/components/Status/Unauthenticated";
import { Unauthorized } from "~/components/Status/Unauthorized";
import { PAGE_SIZE_MINIMUM } from "~/lib/constants";
import { NextPageWithLayout } from "~/pages/_app";
import { authOptions } from "~/server/auth";

interface IParams extends ParsedUrlQuery {
  query?: string;
  page?: string;
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const session = await getServerSession(context.req, context.res, authOptions);
  let errorCode = null;

  // 👇 ensure authenticated
  if (!session) {
    return {
      props: {
        error: 401,
      },
    };
  }

  return {
    props: {
      user: session?.user ?? null,
      error: errorCode,
    },
  };
}

const MyOpportunitiesOverview: NextPageWithLayout<{
  user?: any;
  error?: number;
}> = ({ user, error }) => {
  const queryClient = useQueryClient();

  const {
    data: dataMyOpportunitiesCompleted,
    error: dataMyOpportunitiesCompletedError,
    isLoading: dataMyOpportunitiesCompletedIsLoading,
  } = useQuery({
    queryKey: ["MyOpportunities", "Completed"],
    queryFn: () =>
      searchMyOpportunities({
        action: Action.Verification,
        verificationStatuses: [VerificationStatus.Completed],
        pageNumber: 1,
        pageSize: PAGE_SIZE_MINIMUM,
      }),
    enabled: !error,
  });

  //#region carousels
  const fetchDataAndUpdateCache = useCallback(
    async (
      queryKey: string[],
      filter: MyOpportunitySearchFilter,
    ): Promise<MyOpportunitySearchResults> => {
      const cachedData =
        queryClient.getQueryData<MyOpportunitySearchResults>(queryKey);

      if (cachedData) {
        return cachedData;
      }

      const data = await searchMyOpportunities(filter);

      queryClient.setQueryData(queryKey, data);

      return data;
    },
    [queryClient],
  );

  const loadDataCompleted = useCallback(
    async (startRow: number) => {
      if (startRow > (dataMyOpportunitiesCompleted?.totalCount ?? 0)) {
        return {
          items: [],
          totalCount: 0,
        };
      }

      const pageNumber = Math.ceil(startRow / PAGE_SIZE_MINIMUM);

      return fetchDataAndUpdateCache(["trending", pageNumber.toString()], {
        action: Action.Verification,
        verificationStatuses: [VerificationStatus.Completed],
        pageNumber: pageNumber,
        pageSize: PAGE_SIZE_MINIMUM,
      });
    },
    [dataMyOpportunitiesCompleted, fetchDataAndUpdateCache],
  );
  //#endregion carousels

  if (error) {
    if (error === 401) return <Unauthenticated />;
    else if (error === 403) return <Unauthorized />;
    else return <InternalServerError />;
  }

  return (
    <div
      className="overflow-hiddenx w-full"
      //className="flex flex-col gap-4 overflow-hidden"
      //className="mt-14x px-2x py-1x md:mt-20x md:py-4x containerx md:max-w-6xlx w-fullx z-10 overflow-hidden"
    >
      {/* <h6 className="font-bold tracking-wider">Completed opportunities 👍</h6> */}

      <Suspense
        isReady={!!dataMyOpportunitiesCompleted}
        isLoading={dataMyOpportunitiesCompletedIsLoading}
        error={dataMyOpportunitiesCompletedError}
      >
        <OpportunitiesCarousel
          id={`myopportunities_completed`}
          title="Completed ✅"
          description="Opportunities that you have completed"
          data={dataMyOpportunitiesCompleted!}
          loadData={loadDataCompleted}
          viewAllUrl="/yoid/opportunities/completed"
        />
      </Suspense>
    </div>
  );
};

MyOpportunitiesOverview.getLayout = function getLayout(page: ReactElement) {
  return <YoIDTabbed>{page}</YoIDTabbed>;
};

export default MyOpportunitiesOverview;
