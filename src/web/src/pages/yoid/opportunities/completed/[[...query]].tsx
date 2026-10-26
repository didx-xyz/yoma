import { useQuery } from "@tanstack/react-query";
import { type GetServerSidePropsContext } from "next";
import { getServerSession } from "next-auth";
import Head from "next/head";
import router from "next/router";
import { type ParsedUrlQuery } from "node:querystring";
import { useCallback, type ReactElement } from "react";
import { Action, VerificationStatus } from "~/api/models/myOpportunity";
import { searchMyOpportunities } from "~/api/services/myOpportunities";
import Suspense from "~/components/Common/Suspense";
import {
  LoadingStatus,
  OpportunityGridSkeleton,
} from "~/components/YoID/YoIDSkeletons";
import YoIDOpportunities from "~/components/Layout/YoIDOpportunities";
import { OpportunityListItem } from "~/components/MyOpportunity/OpportunityListItem";
import { IoCheckmarkCircleOutline } from "react-icons/io5";
import { TONE } from "~/components/Opportunity/TabbedDetails/DetailDisclosure";
import { EmptyState, FIND_OPPORTUNITIES } from "~/components/YoID/EmptyState";
import { Pager } from "~/components/YoID/Pager";
import {
  PAGER_SCROLL_MARGIN_CLASS,
  usePagerScroll,
} from "~/components/YoID/usePagerScroll";
import { PaginationInfoComponent } from "~/components/PaginationInfo";
import { Unauthorized } from "~/components/Status/Unauthorized";
import { CARD_GRID_CLASS } from "~/lib/card";
import { PAGE_SIZE } from "~/lib/constants";
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

  const { id } = context.params as IParams;
  const { query, page } = context.query;
  const pageNumber = page ? Number.parseInt(page.toString()) : 1;

  return {
    props: {
      user: session?.user ?? null,
      id: id ?? null,
      query: query ?? null,
      pageNumber: pageNumber,
    },
  };
}

const MyOpportunitiesCompleted: NextPageWithLayout<{
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
    queryKey: ["MyOpportunities_Completed", pageNumber],
    queryFn: () =>
      searchMyOpportunities({
        action: Action.Verification,
        verificationStatuses: [VerificationStatus.Completed],
        pageNumber: pageNumber,
        pageSize: PAGE_SIZE,
      }),
    enabled: !error,
  });

  // 🔔 pager change event — the page number goes into the URL; `usePagerScroll` brings the
  // results back into view once it comes back
  const resultsRef = usePagerScroll(pageNumber);
  const handlePagerChange = useCallback(
    (value: number) => {
      // redirect
      void router.push(
        {
          pathname: `/yoid/opportunities/completed`,
          query: { ...(query && { query }), ...(value && { page: value }) },
        },
        undefined,
        { scroll: false },
      );
    },
    [query],
  );

  if (error) return <Unauthorized />;

  return (
    <>
      <Head>
        <title>Yoma | Completed Opportunities</title>
      </Head>

      <LoadingStatus when={dataIsLoading} />
      <div ref={resultsRef} className={PAGER_SCROLL_MARGIN_CLASS}>
        <Suspense
          isLoading={dataIsLoading}
          error={dataError}
          loader={<OpportunityGridSkeleton />}
        >
          {/* NO ROWS */}
          {!data?.items?.length && (
            <EmptyState
              variant="page"
              icon={<IoCheckmarkCircleOutline />}
              toneClass={TONE.green}
              title="No completions yet"
              description="Complete an opportunity and once it's verified it shows here, in your Passport and on your CV."
              action={FIND_OPPORTUNITIES}
            />
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
                label="Completed opportunities"
              />

              {/* GRID */}
              <div className={CARD_GRID_CLASS}>
                {data.items.map((item) => (
                  <OpportunityListItem
                    key={item.id}
                    data={item}
                    displayDate={item.dateCompleted ?? ""}
                    config={{
                      displayDateLabel: "Completed",
                      showStatusBadge: true,
                      showPullSyncBadge: false,
                      showProgress: false,
                      showDates: true,
                      showDownloadFiles: true,
                      showComment: true,
                      showSkills: true,
                    }}
                  />
                ))}
              </div>

              {/* PAGER */}
              <div className="mt-2">
                <Pager
                  page={pageNumber}
                  pages={Math.ceil((data.totalCount ?? 0) / PAGE_SIZE)}
                  onChange={handlePagerChange}
                />
              </div>
            </div>
          )}
        </Suspense>
      </div>
    </>
  );
};

MyOpportunitiesCompleted.getLayout = function getLayout(page: ReactElement) {
  return <YoIDOpportunities>{page}</YoIDOpportunities>;
};

export default MyOpportunitiesCompleted;
