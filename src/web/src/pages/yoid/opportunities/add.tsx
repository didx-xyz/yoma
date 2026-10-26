import { useInfiniteQuery } from "@tanstack/react-query";
import { type GetServerSidePropsContext } from "next";
import { getServerSession } from "next-auth";
import Head from "next/head";
import { useRouter } from "next/router";
import { useCallback, useMemo, type ReactElement } from "react";
import { Action } from "~/api/models/myOpportunity";
import { searchMyOpportunities } from "~/api/services/myOpportunities";
import { YoIDBreadcrumb } from "~/components/YoID/YoIDBreadcrumb";
import { INTRO_LINK_CLASS, YoIDIntro } from "~/components/YoID/YoIDIntro";
import Link from "next/link";
import {
  LoadingStatus,
  RecentlyViewedSkeleton,
} from "~/components/YoID/YoIDSkeletons";
import { YOID_TABS } from "~/components/YoID/yoidTabs";
import Suspense from "~/components/Common/Suspense";
import YoIDLayout from "~/components/Layout/YoID";
import { OpportunityListItem } from "~/components/MyOpportunity/OpportunityListItem";
import NoRowsMessage from "~/components/NoRowsMessage";
import { SearchInputLarge } from "~/components/SearchInputLarge";
import { InternalServerError } from "~/components/Status/InternalServerError";
import { Unauthenticated } from "~/components/Status/Unauthenticated";
import { Unauthorized } from "~/components/Status/Unauthorized";
import { LoadMore } from "~/components/YoID/LoadMore";
import { formatNumber } from "~/features/discovery/lib/format";
import { CARD_GRID_CLASS } from "~/lib/card";
import {
  OPPORTUNITIES_SEARCH_QUERY_PARAM,
  OPPORTUNITIES_SEARCH_URL,
  PAGE_SIZE,
} from "~/lib/constants";
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

  // Recently viewed accumulates pages (the passport's pattern): a Load more below the grid.
  const {
    data: viewedData,
    error: viewedError,
    isLoading: viewedIsLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isFetchNextPageError,
  } = useInfiniteQuery({
    queryKey: ["MyOpportunities", "Viewed", PAGE_SIZE],
    queryFn: ({ pageParam }) =>
      searchMyOpportunities({
        action: Action.Viewed,
        verificationStatuses: null,
        pageNumber: pageParam,
        pageSize: PAGE_SIZE,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage, pages) =>
      pages.length * PAGE_SIZE < (lastPage.totalCount ?? 0)
        ? pages.length + 1
        : undefined,
    enabled: !error,
  });

  const viewed = useMemo(
    () => viewedData?.pages.flatMap((page) => page.items) ?? [],
    [viewedData],
  );
  const viewedLoaded = viewed.length;
  const viewedTotal = viewedData?.pages.at(-1)?.totalCount ?? viewedLoaded;
  const loadMore = () => void fetchNextPage();

  // The search opens the youth search (discovery while the framework is on) with the words.
  const onSearchInputSubmit = useCallback(
    (query: string) => {
      if (!query || query.length <= 2) return;
      const params = new URLSearchParams({
        [OPPORTUNITIES_SEARCH_QUERY_PARAM]: query,
      });
      const url = `${OPPORTUNITIES_SEARCH_URL}?${params.toString()}`;
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
        <title>Yoma | Add Opportunity</title>
      </Head>

      <div className="flex w-full flex-col gap-4">
        <YoIDBreadcrumb
          trail={[
            {
              title: YOID_TABS.opportunities.label,
              url: YOID_TABS.opportunities.url,
            },
            { title: "Add" },
          ]}
        />

        {/* The intro is its own card; the search sits on the page background under it
            (Jason, 2026-10-21) */}
        <YoIDIntro>
          Find an opportunity and add it to your Yo-ID. Completing one earns you
          credentials in your{" "}
          <Link href={YOID_TABS.passport.url} className={INTRO_LINK_CLASS}>
            Passport
          </Link>{" "}
          and adds to your{" "}
          <Link href={YOID_TABS.skills.url} className={INTRO_LINK_CLASS}>
            Skills
          </Link>
          . Not ready yet? Save it from its page and find it later under{" "}
          <Link href="/yoid/opportunities/saved" className={INTRO_LINK_CLASS}>
            Saved
          </Link>
          . If the opportunity needs verification, submit your proof first; it
          is added once approved.
        </YoIDIntro>
        {/* The search spans the intro card's width on phones; the input is
            white and the submit is discovery's green */}
        <div className="w-full md:max-w-[28rem]">
          <SearchInputLarge
            onSearch={onSearchInputSubmit}
            inputClassName="!bg-white !brightness-100 !text-black !placeholder-gray-dark"
            buttonClassName="!bg-green hover:!bg-green-dark !text-white !brightness-100"
          />
        </div>

        {/* RECENTLY VIEWED — the YoID card in the shared grid, under a rail header */}
        <LoadingStatus when={viewedIsLoading} />
        <Suspense
          isLoading={viewedIsLoading}
          error={viewedData ? undefined : viewedError}
          loader={<RecentlyViewedSkeleton />}
        >
          <section
            aria-labelledby="recently-viewed-heading"
            className="flex flex-col"
          >
            <div className="pb-1">
              <h2
                id="recently-viewed-heading"
                className="font-nunito flex min-w-0 items-start gap-2 text-base font-black tracking-normal md:text-lg"
              >
                Recently viewed
                <span className="text-gray-dark mt-0.5 text-sm font-semibold md:mt-1">
                  {formatNumber(viewedTotal)}
                </span>
              </h2>
              <p className="text-gray-dark line-clamp-2 text-sm">
                Opportunities that you have viewed recently.
              </p>
            </div>

            {viewedLoaded === 0 && (
              <div className="mt-2 flex justify-center rounded-lg bg-white p-8 text-center">
                <NoRowsMessage
                  title={"No recently viewed opportunities"}
                  description={
                    "Opportunities you open will be listed here, so you can add them once you have completed them."
                  }
                />
              </div>
            )}

            {viewedLoaded > 0 && (
              <div className={`${CARD_GRID_CLASS} pt-2`}>
                {viewed.map((item) => (
                  <OpportunityListItem
                    key={item.id}
                    data={item}
                    displayDate={item.dateModified ?? ""}
                    config={{
                      displayDateLabel: "Viewed",
                      showStatusBadge: false,
                      showPullSyncBadge: false,
                      showProgress: false,
                      showDates: true,
                      showDownloadFiles: false,
                      showComment: false,
                      showSkills: false,
                      showCustomFields: false,
                    }}
                  />
                ))}
              </div>
            )}

            {/* LOAD MORE — the next page joins the grid in place */}
            {hasNextPage && (
              <LoadMore
                label="Load more"
                noun="viewed opportunities"
                loaded={viewedLoaded}
                total={viewedTotal}
                loading={isFetchingNextPage}
                failed={isFetchNextPageError}
                onLoadMore={loadMore}
                className="pt-6"
              />
            )}
          </section>
        </Suspense>
      </div>
    </>
  );
};

MyOpportunitiesAdd.getLayout = function getLayout(page: ReactElement) {
  return <YoIDLayout>{page}</YoIDLayout>;
};

export default MyOpportunitiesAdd;
