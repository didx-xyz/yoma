import { useQuery, useQueryClient } from "@tanstack/react-query";
import { type GetServerSidePropsContext } from "next";
import { getServerSession } from "next-auth";
import Head from "next/head";
import { useRouter } from "next/router";
import { useCallback, type ReactElement } from "react";
import {
  Action,
  type MyOpportunitySearchFilter,
  type MyOpportunitySearchResults,
} from "~/api/models/myOpportunity";
import { searchMyOpportunities } from "~/api/services/myOpportunities";
import Breadcrumb from "~/components/Breadcrumb";
import FormMessage, { FormMessageType } from "~/components/Common/FormMessage";
import Suspense from "~/components/Common/Suspense";
import YoIDLayout from "~/components/Layout/YoID";
import OpportunitiesCarousel, {
  DisplayType,
} from "~/components/MyOpportunity/OpportunitiesCarousel";
import { SearchInputLarge } from "~/components/SearchInputLarge";
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

const MyOpportunitiesAdd: NextPageWithLayout<{
  error?: number;
}> = ({ error }) => {
  const router = useRouter();
  const queryClient = useQueryClient();

  const {
    data: viewedData,
    error: viewedError,
    isLoading: viewedIsLoading,
  } = useQuery({
    queryKey: ["MyOpportunities", "Viewed", 1],
    queryFn: () =>
      searchMyOpportunities({
        action: Action.Viewed,
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

  const viewedLoadData = useCallback(
    async (startRow: number) => {
      if (startRow > (viewedData?.totalCount ?? 0)) {
        return {
          items: [],
          totalCount: 0,
        };
      }

      const pageNumber = Math.ceil(startRow / PAGE_SIZE_MINIMUM);

      return fetchDataAndUpdateCache(
        ["MyOpportunities", "Viewed", pageNumber.toString()],
        {
          action: Action.Viewed,
          verificationStatuses: null,
          pageNumber: pageNumber,
          pageSize: PAGE_SIZE_MINIMUM,
        },
      );
    },
    [viewedData, fetchDataAndUpdateCache],
  );
  //#endregion carousels

  const onSearchInputSubmit = useCallback(
    (query: string) => {
      if (query && query.length > 2) {
        // uri encode the search value
        const searchValueEncoded = encodeURIComponent(query);
        query = searchValueEncoded;
      } else {
        return;
      }

      let url = "/opportunities";
      const params = new URLSearchParams();

      params.append("query", query);

      if (params != null && params.size > 0)
        url = `/opportunities?${params.toString()}`;

      if (url != router.asPath)
        void router.push(url, undefined, { scroll: false });
    },
    [router],
  );

  if (error) {
    if (error === 401) return <Unauthenticated />;
    else if (error === 403) return <Unauthorized />;
    else return <InternalServerError />;
  }

  return (
    <>
      <Head>
        <title>Yoma | 🏆 Add Opportunity</title>
      </Head>

      <div className="flex w-full flex-col gap-4">
        <h5 className="text-xs font-bold tracking-wider text-black md:text-base">
          <Breadcrumb
            items={[
              { title: "💳 Yo-ID", url: "/yoid" },
              {
                title: "🏆 Opportunities",
                url: "/yoid/opportunities/completed",
              },
              {
                title: "➕ Add",
                selected: true,
              },
            ]}
          />
        </h5>

        <div className="flex w-full flex-col gap-2 rounded-lg bg-white p-4">
          <p className="text-xs md:text-sm">
            🔎 Find an opportunity, and add it to your Yo-ID.
          </p>
          <SearchInputLarge
            onSearch={onSearchInputSubmit}
            maxWidth={400}
            inputClassName="!bg-gray-light !text-black !placeholder-gray-dark"
            buttonClassName="!bg-gray !brightness-95 hover:!brightness-90 !text-gray-dark"
          />
        </div>

        <div className="p-4x flex flex-col gap-4">
          {/* VIEWED */}
          <Suspense isLoading={viewedIsLoading} error={viewedError}>
            <OpportunitiesCarousel
              id={`myopportunities_viewed`}
              title="👀 Recently viewed"
              description="Opportunities that you have viewed recently."
              noRowsDescription="You haven't viewed any opportunities yet."
              data={viewedData!}
              loadData={viewedLoadData}
              displayType={DisplayType.Viewed}
            />
          </Suspense>
        </div>

        <FormMessage
          messageType={FormMessageType.Info}
          classNameLabel="!text-xs md:!text-sm"
        >
          Note: If the opportunity requires verification, you will need to
          submit your proof and wait for approval before it&apos;s added.
        </FormMessage>
      </div>
    </>
  );
};

MyOpportunitiesAdd.getLayout = function getLayout(page: ReactElement) {
  return <YoIDLayout>{page}</YoIDLayout>;
};

export default MyOpportunitiesAdd;
