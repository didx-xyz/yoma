import { QueryClient, dehydrate, useQuery } from "@tanstack/react-query";
import { type GetServerSidePropsContext } from "next";
import { getServerSession } from "next-auth";
import Head from "next/head";
import router from "next/router";
import { type ParsedUrlQuery } from "node:querystring";
import { useCallback, type ReactElement } from "react";
import { IoMdHeart } from "react-icons/io";
import {
  Action,
  VerificationStatus,
  type MyOpportunitySearchResults,
} from "~/api/models/myOpportunity";
import {
  getVerificationStatus,
  searchMyOpportunities,
} from "~/api/services/myOpportunities";
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

const searchSavedOpportunitiesWithProgress = async (
  pageNumber: number,
  context?: GetServerSidePropsContext,
): Promise<MyOpportunitySearchResults> => {
  const savedOpportunities = await searchMyOpportunities(
    {
      action: Action.Saved,
      verificationStatuses: null,
      pageNumber,
      pageSize: PAGE_SIZE,
    },
    context,
  );

  const items = await Promise.all(
    (savedOpportunities.items ?? []).map(async (item) => {
      const verificationStatus = await getVerificationStatus(
        item.opportunityId,
        context,
      );

      const hasVerificationState =
        verificationStatus.status !== VerificationStatus.None &&
        verificationStatus.status !== "None";
      const hasProgress = verificationStatus.percentComplete != null;
      const hasSyncInfo = verificationStatus.syncedInfo != null;

      if (!hasVerificationState && !hasProgress && !hasSyncInfo) {
        return item;
      }

      return {
        ...item,
        verificationStatus:
          verificationStatus.status ?? item.verificationStatus,
        percentComplete:
          verificationStatus.percentComplete ?? item.percentComplete,
        dateCompleted: verificationStatus.dateCompleted ?? item.dateCompleted,
        commentVerification:
          verificationStatus.comment ?? item.commentVerification,
        syncedInfo: verificationStatus.syncedInfo ?? item.syncedInfo,
      };
    }),
  );

  return {
    ...savedOpportunities,
    items,
  };
};

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
  const pageNumber = page ? Number.parseInt(page.toString()) : 1;

  // 👇 prefetch queries on server
  await queryClient.prefetchQuery({
    queryKey: ["MyOpportunities_Saved", pageNumber],
    queryFn: () => searchSavedOpportunitiesWithProgress(pageNumber, context),
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

const MyOpportunitiesSaved: NextPageWithLayout<{
  query?: string;
  pageNumber: number;
  error: string;
}> = ({ query, pageNumber, error }) => {
  // 👇 use prefetched queries from server
  const {
    data,
    error: dataError,
    isLoading: dataIsLoading,
  } = useQuery({
    queryKey: ["MyOpportunities_Saved", pageNumber],
    queryFn: () => searchSavedOpportunitiesWithProgress(pageNumber),
    enabled: !error,
  });

  // 🔔 pager change event
  const handlePagerChange = useCallback(
    (value: number) => {
      // redirect
      void router.push({
        pathname: `/yoid/opportunities/saved`,
        query: { ...(query && { query }), ...(value && { page: value }) },
      });
    },
    [query],
  );

  if (error) return <Unauthorized />;

  return (
    <>
      <Head>
        <title>Yoma | 💗 Saved Opportunities</title>
      </Head>

      <Suspense isLoading={dataIsLoading} error={dataError}>
        {/* NO ROWS */}
        {!data?.items?.length && (
          <div className="flex justify-center rounded-lg bg-white p-8 text-center">
            <NoRowsMessage
              title={"You don't have any saved opportunities."}
              description={
                "Opportunities you have saved will be listed here for easy access and reference. To save an opportunity, simply click the 'Save' button when viewing the opportunity details. This way, you can quickly find and return to the opportunities that interest you most."
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
              {data.items.map((item) => (
                <OpportunityListItem
                  key={item.id}
                  data={item}
                  displayDate={item.dateModified ?? ""}
                  config={{
                    displayDateLabel: "Saved",
                    showStatusBadge: false,
                    showPullSyncBadge: false,
                    showProgress: true,
                    showDates: false,
                    showDownloadFiles: false,
                    showComment: false,
                    showSkills: false,
                    pageContextBadge: {
                      label: "Saved",
                      tooltip:
                        "You saved this opportunity for quick access later.",
                      className:
                        "bg-yellow-50 text-yellow border border-yellow-200",
                      icon: <IoMdHeart className="h-3.5 w-3.5" />,
                    },
                  }}
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

MyOpportunitiesSaved.getLayout = function getLayout(page: ReactElement) {
  return <YoIDOpportunities>{page}</YoIDOpportunities>;
};

export default MyOpportunitiesSaved;
