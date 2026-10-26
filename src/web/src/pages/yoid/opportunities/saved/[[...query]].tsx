import { useQuery } from "@tanstack/react-query";
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
import {
  LoadingStatus,
  OpportunityGridSkeleton,
} from "~/components/YoID/YoIDSkeletons";
import YoIDOpportunities from "~/components/Layout/YoIDOpportunities";
import { OpportunityListItem } from "~/components/MyOpportunity/OpportunityListItem";
import { IoHeartOutline } from "react-icons/io5";
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

  // 🔔 pager change event — the page number goes into the URL; `usePagerScroll` brings the
  // results back into view once it comes back
  const resultsRef = usePagerScroll(pageNumber);
  const handlePagerChange = useCallback(
    (value: number) => {
      // redirect
      void router.push(
        {
          pathname: `/yoid/opportunities/saved`,
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
        <title>Yoma | Saved Opportunities</title>
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
              icon={<IoHeartOutline />}
              toneClass={TONE.blue}
              title="Nothing saved yet"
              description="Tap Save on any opportunity to keep it here for later."
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
                label="Saved opportunities"
              />

              {/* GRID */}
              <div className={CARD_GRID_CLASS}>
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

MyOpportunitiesSaved.getLayout = function getLayout(page: ReactElement) {
  return <YoIDOpportunities>{page}</YoIDOpportunities>;
};

export default MyOpportunitiesSaved;
