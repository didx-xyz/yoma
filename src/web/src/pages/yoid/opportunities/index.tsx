import { useQuery, useQueryClient } from "@tanstack/react-query";
import { type GetServerSidePropsContext } from "next";
import { getServerSession } from "next-auth";
import Head from "next/head";
import Link from "next/link";
import { useCallback, type ReactElement } from "react";
import {
  Action,
  VerificationStatus,
  type MyOpportunitySearchFilter,
  type MyOpportunitySearchResults,
} from "~/api/models/myOpportunity";
import { searchMyOpportunities } from "~/api/services/myOpportunities";
import Breadcrumb from "~/components/Breadcrumb";
import FormMessage, { FormMessageType } from "~/components/Common/FormMessage";
import Suspense from "~/components/Common/Suspense";
import YoIDTabbed from "~/components/Layout/YoIDTabbed";
import OpportunitiesCarousel, {
  DisplayType,
} from "~/components/MyOpportunity/OpportunitiesCarousel";
import { InternalServerError } from "~/components/Status/InternalServerError";
import { Unauthenticated } from "~/components/Status/Unauthenticated";
import { Unauthorized } from "~/components/Status/Unauthorized";
import { PAGE_SIZE_MINIMUM } from "~/lib/constants";
import type { NextPageWithLayout } from "~/pages/_app";
import { authOptions } from "~/server/auth";

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const session = await getServerSession(context.req, context.res, authOptions);
  const errorCode = null;

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
      error: errorCode,
    },
  };
}

const MyOpportunitiesOverview: NextPageWithLayout<{
  error?: number;
}> = ({ error }) => {
  const queryClient = useQueryClient();

  const {
    data: completedData,
    error: completedError,
    isLoading: completedIsLoading,
  } = useQuery({
    queryKey: ["MyOpportunities", "Completed", 1],
    queryFn: () =>
      searchMyOpportunities({
        action: Action.Verification,
        verificationStatuses: [VerificationStatus.Completed],
        pageNumber: 1,
        pageSize: PAGE_SIZE_MINIMUM,
      }),
    enabled: !error,
  });

  const {
    data: pendingData,
    error: pendingError,
    isLoading: pendingIsLoading,
  } = useQuery({
    queryKey: ["MyOpportunities", "Pending", 1],
    queryFn: () =>
      searchMyOpportunities({
        action: Action.Verification,
        verificationStatuses: [VerificationStatus.Pending],
        pageNumber: 1,
        pageSize: PAGE_SIZE_MINIMUM,
      }),
    enabled: !error,
  });

  const {
    data: rejectedData,
    error: rejectedError,
    isLoading: rejectedIsLoading,
  } = useQuery({
    queryKey: ["MyOpportunities", "Rejected", 1],
    queryFn: () =>
      searchMyOpportunities({
        action: Action.Verification,
        verificationStatuses: [VerificationStatus.Rejected],
        pageNumber: 1,
        pageSize: PAGE_SIZE_MINIMUM,
      }),
    enabled: !error,
  });

  const {
    data: savedData,
    error: savedError,
    isLoading: savedIsLoading,
  } = useQuery({
    queryKey: ["MyOpportunities", "Saved", 1],
    queryFn: () =>
      searchMyOpportunities({
        action: Action.Saved,
        verificationStatuses: null,
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

  const completedLoadData = useCallback(
    async (startRow: number) => {
      if (startRow > (completedData?.totalCount ?? 0)) {
        return {
          items: [],
          totalCount: 0,
        };
      }

      const pageNumber = Math.ceil(startRow / PAGE_SIZE_MINIMUM);

      return fetchDataAndUpdateCache(
        ["MyOpportunities", "Completed", pageNumber.toString()],
        {
          action: Action.Verification,
          verificationStatuses: [VerificationStatus.Completed],
          pageNumber: pageNumber,
          pageSize: PAGE_SIZE_MINIMUM,
        },
      );
    },
    [completedData, fetchDataAndUpdateCache],
  );

  const pendingLoadData = useCallback(
    async (startRow: number) => {
      if (startRow > (pendingData?.totalCount ?? 0)) {
        return {
          items: [],
          totalCount: 0,
        };
      }

      const pageNumber = Math.ceil(startRow / PAGE_SIZE_MINIMUM);

      return fetchDataAndUpdateCache(
        ["MyOpportunities", "Pending", pageNumber.toString()],
        {
          action: Action.Verification,
          verificationStatuses: [VerificationStatus.Pending],
          pageNumber: pageNumber,
          pageSize: PAGE_SIZE_MINIMUM,
        },
      );
    },
    [pendingData, fetchDataAndUpdateCache],
  );

  const rejectedLoadData = useCallback(
    async (startRow: number) => {
      if (startRow > (rejectedData?.totalCount ?? 0)) {
        return {
          items: [],
          totalCount: 0,
        };
      }

      const pageNumber = Math.ceil(startRow / PAGE_SIZE_MINIMUM);

      return fetchDataAndUpdateCache(
        ["MyOpportunities", "Rejected", pageNumber.toString()],
        {
          action: Action.Verification,
          verificationStatuses: [VerificationStatus.Rejected],
          pageNumber: pageNumber,
          pageSize: PAGE_SIZE_MINIMUM,
        },
      );
    },
    [rejectedData, fetchDataAndUpdateCache],
  );

  const savedLoadData = useCallback(
    async (startRow: number) => {
      if (startRow > (savedData?.totalCount ?? 0)) {
        return {
          items: [],
          totalCount: 0,
        };
      }

      const pageNumber = Math.ceil(startRow / PAGE_SIZE_MINIMUM);

      return fetchDataAndUpdateCache(
        ["MyOpportunities", "Saved", pageNumber.toString()],
        {
          action: Action.Saved,
          verificationStatuses: null,
          pageNumber: pageNumber,
          pageSize: PAGE_SIZE_MINIMUM,
        },
      );
    },
    [savedData, fetchDataAndUpdateCache],
  );
  //#endregion carousels

  if (error) {
    if (error === 401) return <Unauthenticated />;
    else if (error === 403) return <Unauthorized />;
    else return <InternalServerError />;
  }

  return (
    <>
      <Head>
        <title>Yoma | 🏆 Opportunities</title>
      </Head>

      <div className="flex w-full flex-col gap-4">
        <div className="text-xs font-bold tracking-wider text-black md:text-base">
          <Breadcrumb
            items={[
              { title: "💳 Yo-ID", url: "/yoid" },
              {
                title: "🏆 Opportunities",
                selected: true,
              },
            ]}
          />
        </div>

        <FormMessage messageType={FormMessageType.Info}>
          Just completed an opportunity? Click
          <Link
            className="mx-1 font-bold text-green hover:underline"
            href="/yoid/opportunities/add"
          >
            here
          </Link>
          to add it.
        </FormMessage>

        <div className="flex flex-col gap-4 rounded-lg bg-white p-4">
          {/* COMPLETED */}
          <Suspense isLoading={completedIsLoading} error={completedError}>
            <OpportunitiesCarousel
              id={`myopportunities_completed`}
              title="✅ Completed"
              description="Opportunities that you have completed"
              data={completedData!}
              loadData={completedLoadData}
              viewAllUrl="/yoid/opportunities/completed"
              displayType={DisplayType.Completed}
            />
          </Suspense>

          {/* PENDING */}
          <Suspense isLoading={pendingIsLoading} error={pendingError}>
            <OpportunitiesCarousel
              id={`myopportunities_pending`}
              title="🕒 Pending"
              description="Opportunities that are pending verification"
              data={pendingData!}
              loadData={pendingLoadData}
              viewAllUrl="/yoid/opportunities/pending"
              displayType={DisplayType.Pending}
            />
          </Suspense>

          {/* REJECTED */}
          <Suspense isLoading={rejectedIsLoading} error={rejectedError}>
            <OpportunitiesCarousel
              id={`myopportunities_rejected`}
              title="❌ Rejected"
              description="Opportunities that have been rejected"
              data={rejectedData!}
              loadData={rejectedLoadData}
              viewAllUrl="/yoid/opportunities/rejected"
              displayType={DisplayType.Rejected}
            />
          </Suspense>

          {/* SAVED */}
          <Suspense isLoading={savedIsLoading} error={savedError}>
            <OpportunitiesCarousel
              id={`myopportunities_saved`}
              title="💗 Saved"
              description="Opportunities that you have saved"
              data={savedData!}
              loadData={savedLoadData}
              viewAllUrl="/yoid/opportunities/saved"
              displayType={DisplayType.Saved}
            />
          </Suspense>
        </div>
      </div>
    </>
  );
};

MyOpportunitiesOverview.getLayout = function getLayout(page: ReactElement) {
  return <YoIDTabbed>{page}</YoIDTabbed>;
};

export default MyOpportunitiesOverview;
