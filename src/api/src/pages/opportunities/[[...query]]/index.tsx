import { useAtomValue } from "jotai";
import type { GetStaticProps, GetStaticPaths } from "next";
import Head from "next/head";
import { useRouter } from "next/router";
import React, {
  type ReactElement,
  useCallback,
  useState,
  useEffect,
  useRef,
  useMemo,
} from "react";
import ReactModal from "react-modal";
import type { Country, Language, SelectOption } from "~/api/models/lookups";
import {
  PublishedState,
  type OpportunityCategory,
  type OpportunitySearchCriteriaCommitmentInterval,
  type OpportunitySearchCriteriaZltoReward,
  type OpportunitySearchFilterCombined,
  type OpportunitySearchResultsInfo,
  type OpportunityType,
} from "~/api/models/opportunity";
import type { OrganizationInfo } from "~/api/models/organisation";
import {
  getCommitmentIntervals,
  getOpportunityCategories,
  getOpportunityCountries,
  getOpportunityLanguages,
  getOpportunityOrganizations,
  getOpportunityTypes,
  getZltoRewardRanges,
  searchOpportunities,
} from "~/api/services/opportunities";
import MainLayout from "~/components/Layout/Main";
import { OpportunityRow } from "~/components/Opportunity/OpportunityRow";
import { PageBackground } from "~/components/PageBackground";
import { SearchInputLarge } from "~/components/SearchInputLarge";
import { smallDisplayAtom } from "~/lib/store";
import { type NextPageWithLayout } from "~/pages/_app";
import { OpportunityFilterVertical } from "~/components/Opportunity/OpportunityFilterVertical";
import {
  PAGE_SIZE,
  OPPORTUNITY_TYPES_LEARNING,
  OPPORTUNITY_TYPES_TASK,
} from "~/lib/constants";
import { useQuery } from "@tanstack/react-query";
import NoRowsMessage from "~/components/NoRowsMessage";
import { OpportunityFilterHorizontal } from "~/components/Opportunity/OpportunityFilterHorizontal";
import { Loading } from "~/components/Status/Loading";
import { PaginationButtons } from "~/components/PaginationButtons";
import { useSession } from "next-auth/react";
import { OpportunityFilterOptions } from "~/api/models/opportunity";

// 👇 SSG
// This function gets called at build time on server-side.
// It may be called again, on a serverless function, if
// revalidation is enabled and a new request comes in
export const getStaticProps: GetStaticProps = async (context) => {
  const opportunities_trending = await searchOpportunities(
    {
      pageNumber: 1,
      pageSize: 4,
      categories: null,
      countries: null,
      languages: null,
      types: null,
      valueContains: null,
      commitmentIntervals: null,
      mostViewed: true,
      organizations: null,
      zltoRewardRanges: null,
      publishedStates: [PublishedState.Active, PublishedState.NotStarted],
    },
    context,
  );
  const opportunities_learning = await searchOpportunities(
    {
      pageNumber: 1,
      pageSize: 4,
      categories: null,
      countries: null,
      languages: null,
      types: OPPORTUNITY_TYPES_LEARNING,
      valueContains: null,
      commitmentIntervals: null,
      mostViewed: null,
      organizations: null,
      zltoRewardRanges: null,
      publishedStates: [PublishedState.Active, PublishedState.NotStarted],
    },
    context,
  );
  const opportunities_tasks = await searchOpportunities(
    {
      pageNumber: 1,
      pageSize: 4,
      categories: null,
      countries: null,
      languages: null,
      types: OPPORTUNITY_TYPES_TASK,
      valueContains: null,
      commitmentIntervals: null,
      mostViewed: null,
      organizations: null,
      zltoRewardRanges: null,
      publishedStates: [PublishedState.Active, PublishedState.NotStarted],
    },
    context,
  );
  const opportunities_allOpportunities = await searchOpportunities(
    {
      pageNumber: 1,
      pageSize: 10, //NB: page is 10 items (first page only), the PagingButtons control below will allow the user to navigate to the second page
      categories: null,
      countries: null,
      languages: null,
      types: null,
      valueContains: null,
      commitmentIntervals: null,
      mostViewed: null,
      organizations: null,
      zltoRewardRanges: null,
      publishedStates: [PublishedState.Active, PublishedState.NotStarted],
    },
    context,
  );
  const lookups_categories = await getOpportunityCategories(context);
  const lookups_countries = await getOpportunityCountries(context);
  const lookups_languages = await getOpportunityLanguages(context);
  const lookups_organisations = await getOpportunityOrganizations(context);
  const lookups_types = await getOpportunityTypes(context);
  const lookups_commitmentIntervals = await getCommitmentIntervals(context);
  const lookups_zltoRewardRanges = await getZltoRewardRanges(context);

  return {
    props: {
      opportunities_trending,
      opportunities_learning,
      opportunities_tasks,
      opportunities_allOpportunities,
      lookups_categories,
      lookups_countries,
      lookups_languages,
      lookups_organisations,
      lookups_types,
      lookups_commitmentIntervals,
      lookups_zltoRewardRanges,
    },

    // Next.js will attempt to re-generate the page:
    // - When a request comes in
    // - At most once every 300 seconds
    revalidate: 300,
  };
};

export const getStaticPaths: GetStaticPaths = () => {
  return {
    paths: [],
    fallback: "blocking",
  };
};

const Opportunities: NextPageWithLayout<{
  opportunities_trending: OpportunitySearchResultsInfo;
  opportunities_learning: OpportunitySearchResultsInfo;
  opportunities_tasks: OpportunitySearchResultsInfo;
  opportunities_allOpportunities: OpportunitySearchResultsInfo;
  lookups_categories: OpportunityCategory[];
  lookups_countries: Country[];
  lookups_languages: Language[];
  lookups_organisations: OrganizationInfo[];
  lookups_types: OpportunityType[];
  lookups_commitmentIntervals: OpportunitySearchCriteriaCommitmentInterval[];
  lookups_zltoRewardRanges: OpportunitySearchCriteriaZltoReward[];
}> = ({
  opportunities_trending,
  opportunities_learning,
  opportunities_tasks,
  opportunities_allOpportunities,
  lookups_categories,
  lookups_countries,
  lookups_languages,
  lookups_organisations,
  lookups_types,
  lookups_commitmentIntervals,
  lookups_zltoRewardRanges,
}) => {
  const router = useRouter();
  const { data: session } = useSession();
  const myRef = useRef<HTMLDivElement>(null);
  const [filterFullWindowVisible, setFilterFullWindowVisible] = useState(false);
  const smallDisplay = useAtomValue(smallDisplayAtom);

  const lookups_publishedStates: SelectOption[] = [
    { value: "0", label: "Not started" },
    { value: "1", label: "Active" },
    ...(session ? [{ value: "2", label: "Expired" }] : []), // logged in users can see expired
  ];

  // get filter parameters from route
  const {
    query,
    page,
    categories,
    countries,
    languages,
    types,
    commitmentIntervals,
    organizations,
    zltoRewardRanges,
    mostViewed,
    publishedStates,
  } = router.query;

  // memo for isSearchPerformed based on filter parameters
  const isSearchPerformed = useMemo<boolean>(() => {
    return (
      query != undefined ||
      page != undefined ||
      categories != undefined ||
      countries != undefined ||
      languages != undefined ||
      types != undefined ||
      commitmentIntervals != undefined ||
      organizations != undefined ||
      zltoRewardRanges != undefined ||
      mostViewed != undefined ||
      publishedStates != undefined
    );
  }, [
    query,
    page,
    categories,
    countries,
    languages,
    types,
    commitmentIntervals,
    organizations,
    zltoRewardRanges,
    mostViewed,
    publishedStates,
  ]);

  // QUERY: SEARCH RESULTS
  // the filter values from the querystring are mapped to it's corresponding id
  const { data: searchResults, isLoading } =
    useQuery<OpportunitySearchResultsInfo>({
      queryKey: [
        "OpportunitiesSearch",
        query,
        page,
        categories,
        countries,
        languages,
        types,
        commitmentIntervals,
        organizations,
        zltoRewardRanges,
        mostViewed,
        publishedStates,
      ],
      queryFn: async () =>
        await searchOpportunities({
          pageNumber: page ? parseInt(page.toString()) : 1,
          pageSize: PAGE_SIZE,
          valueContains: query ? decodeURIComponent(query.toString()) : null,
          mostViewed: mostViewed ? Boolean(mostViewed) : null,
          // publishedStates:
          //   publishedStates != undefined
          //     ? publishedStates?.toString().split(",")
          //     : null,
          publishedStates:
            publishedStates != undefined
              ? publishedStates
                  ?.toString()
                  .split(",")
                  .map((x) => {
                    const item = lookups_publishedStates.find(
                      (y) => y.label === x,
                    );
                    return item ? item?.value : "";
                  })
                  .filter((x) => x != "")
              : null,
          types:
            types != undefined
              ? types
                  ?.toString()
                  .split(",")
                  .map((x) => {
                    const item = lookups_types.find((y) => y.name === x);
                    return item ? item?.id : "";
                  })
                  .filter((x) => x != "")
              : null,
          categories:
            categories != undefined
              ? categories
                  ?.toString()
                  .split(",")
                  .map((x) => {
                    const item = lookups_categories.find((y) => y.name === x);
                    return item ? item?.id : "";
                  })
                  .filter((x) => x != "")
              : null,
          countries:
            countries != undefined
              ? countries
                  ?.toString()
                  .split(",")
                  .map((x) => {
                    const item = lookups_countries.find((y) => y.name === x);
                    return item ? item?.id : "";
                  })
                  .filter((x) => x != "")
              : null,
          languages:
            languages != undefined
              ? languages
                  ?.toString()
                  .split(",")
                  .map((x) => {
                    const item = lookups_languages.find((y) => y.name === x);
                    return item ? item?.id : "";
                  })
                  .filter((x) => x != "")
              : null,
          organizations:
            organizations != undefined
              ? organizations
                  ?.toString()
                  .split(",")
                  .map((x) => {
                    const item = lookups_organisations.find(
                      (y) => y.name === x,
                    );
                    return item ? item?.id : "";
                  })
                  .filter((x) => x != "")
              : null,
          commitmentIntervals:
            commitmentIntervals != undefined
              ? commitmentIntervals?.toString().split(",")
              : null,
          zltoRewardRanges:
            zltoRewardRanges != undefined
              ? zltoRewardRanges?.toString().split(",")
              : null,
        }),
      enabled: isSearchPerformed, // only run query if search is executed
    });

  // search filter state
  const [opportunitySearchFilter, setOpportunitySearchFilter] =
    useState<OpportunitySearchFilterCombined>({
      pageNumber: page ? parseInt(page.toString()) : 1,
      pageSize: PAGE_SIZE,
      categories: null,
      countries: null,
      languages: null,
      types: null,
      valueContains: null,
      commitmentIntervals: null,
      mostViewed: null,
      organizations: null,
      zltoRewardRanges: null,
      publishedStates: null,
      startDate: null,
      endDate: null,
      statuses: null,
    });

  // sets the filter values from the querystring to the filter state
  useEffect(() => {
    if (isSearchPerformed)
      setOpportunitySearchFilter({
        pageNumber: page ? parseInt(page.toString()) : 1,
        pageSize: PAGE_SIZE,
        valueContains: query ? decodeURIComponent(query.toString()) : null,
        mostViewed: mostViewed ? Boolean(mostViewed) : null,
        types: types != undefined ? types?.toString().split(",") : null,
        categories:
          categories != undefined ? categories?.toString().split(",") : null,
        countries:
          countries != undefined && countries != null
            ? countries?.toString().split(",")
            : null,
        languages:
          languages != undefined ? languages?.toString().split(",") : null,
        organizations:
          organizations != undefined
            ? organizations?.toString().split(",")
            : null,
        commitmentIntervals:
          commitmentIntervals != undefined
            ? commitmentIntervals?.toString().split(",")
            : null,
        zltoRewardRanges:
          zltoRewardRanges != undefined
            ? zltoRewardRanges?.toString().split(",")
            : null,
        publishedStates:
          publishedStates != undefined
            ? publishedStates?.toString().split(",")
            : null,
        startDate: null,
        endDate: null,
        statuses: null,
      });
  }, [
    setOpportunitySearchFilter,
    isSearchPerformed,
    query,
    page,
    categories,
    countries,
    languages,
    types,
    commitmentIntervals,
    organizations,
    zltoRewardRanges,
    mostViewed,
    publishedStates,
  ]);

  // disable full-size search filters when resizing to larger screens
  useEffect(() => {
    if (!smallDisplay) setFilterFullWindowVisible(false);
  }, [smallDisplay]);

  // 📜 scroll to results when search is executed
  // useEffect(() => {
  //   if (searchResults && !isLoading) {
  //     setTimeout(() => {
  //       const element = document.getElementById("results");

  //       if (element) {
  //         window.scrollTo({
  //           top: element.offsetTop - 55,
  //           behavior: "smooth",
  //         });
  //       }
  //     }, 500);
  //   }
  // }, [searchResults, isLoading]);

  const currentPage = useMemo(() => {
    return page ? parseInt(page as string) : 1;
  }, [page]);

  // 🎈 FUNCTIONS
  const getSearchFilterAsQueryString = useCallback(
    (opportunitySearchFilter: OpportunitySearchFilterCombined) => {
      if (!opportunitySearchFilter) return null;

      // construct querystring parameters from filter
      const params = new URLSearchParams();
      if (
        opportunitySearchFilter.valueContains !== undefined &&
        opportunitySearchFilter.valueContains !== null &&
        opportunitySearchFilter.valueContains.length > 0
      )
        params.append("query", opportunitySearchFilter.valueContains);
      if (
        opportunitySearchFilter?.categories?.length !== undefined &&
        opportunitySearchFilter.categories.length > 0
      )
        params.append(
          "categories",
          opportunitySearchFilter.categories.join(","),
        );
      if (
        opportunitySearchFilter?.countries?.length !== undefined &&
        opportunitySearchFilter.countries.length > 0
      )
        params.append("countries", opportunitySearchFilter.countries.join(","));
      if (
        opportunitySearchFilter?.languages?.length !== undefined &&
        opportunitySearchFilter.languages.length > 0
      )
        params.append("languages", opportunitySearchFilter.languages.join(","));
      if (
        opportunitySearchFilter?.types?.length !== undefined &&
        opportunitySearchFilter.types.length > 0
      )
        params.append("types", opportunitySearchFilter.types.join(","));
      if (
        opportunitySearchFilter?.commitmentIntervals?.length !== undefined &&
        opportunitySearchFilter.commitmentIntervals.length > 0
      )
        params.append(
          "commitmentIntervals",
          opportunitySearchFilter.commitmentIntervals.join(","),
        );
      if (
        opportunitySearchFilter?.organizations?.length !== undefined &&
        opportunitySearchFilter.organizations.length > 0
      )
        params.append(
          "organizations",
          opportunitySearchFilter.organizations.join(","),
        );
      if (
        opportunitySearchFilter?.zltoRewardRanges?.length !== undefined &&
        opportunitySearchFilter.zltoRewardRanges.length > 0
      )
        params.append(
          "zltoRewardRanges",
          opportunitySearchFilter.zltoRewardRanges.join(","),
        );
      if (
        opportunitySearchFilter?.mostViewed !== undefined &&
        opportunitySearchFilter?.mostViewed !== null
      )
        params.append(
          "mostViewed",
          opportunitySearchFilter?.mostViewed ? "true" : "false",
        );

      if (
        opportunitySearchFilter?.publishedStates !== undefined &&
        opportunitySearchFilter?.publishedStates !== null &&
        opportunitySearchFilter?.publishedStates.length > 0
      )
        params.append(
          "publishedStates",
          opportunitySearchFilter?.publishedStates.join(","),
        );

      if (
        opportunitySearchFilter.pageNumber !== null &&
        opportunitySearchFilter.pageNumber !== undefined &&
        opportunitySearchFilter.pageNumber !== 1
      )
        params.append("page", opportunitySearchFilter.pageNumber.toString());

      if (params.size === 0) return null;
      return params;
    },
    [],
  );
  const redirectWithSearchFilterParams = useCallback(
    (filter: OpportunitySearchFilterCombined) => {
      let url = "/opportunities";
      const params = getSearchFilterAsQueryString(filter);
      if (params != null && params.size > 0)
        url = `/opportunities?${params.toString()}`;

      if (url != router.asPath)
        void router.push(url, undefined, { scroll: false });
    },
    [router, getSearchFilterAsQueryString],
  );

  // 🔔 CHANGE EVENTS
  const handlePagerChange = useCallback(
    (value: number) => {
      opportunitySearchFilter.pageNumber = value;
      redirectWithSearchFilterParams(opportunitySearchFilter);
    },
    [opportunitySearchFilter, redirectWithSearchFilterParams],
  );

  const onSearchInputSubmit = useCallback(
    (query: string) => {
      if (query && query.length > 2) {
        // uri encode the search value
        const searchValueEncoded = encodeURIComponent(query);
        query = searchValueEncoded;
      }

      opportunitySearchFilter.valueContains = query;
      redirectWithSearchFilterParams(opportunitySearchFilter);
    },
    [opportunitySearchFilter, redirectWithSearchFilterParams],
  );

  // filter popup handlers
  const onCloseFilter = useCallback(() => {
    setFilterFullWindowVisible(false);
  }, [setFilterFullWindowVisible]);

  const onSubmitFilter = useCallback(
    (val: OpportunitySearchFilterCombined) => {
      redirectWithSearchFilterParams(val);
    },
    [redirectWithSearchFilterParams],
  );

  const onClearFilter = useCallback(() => {
    void router.push("/opportunities", undefined, { scroll: true });
  }, [router]);

  return (
    <>
      <Head>
        <title>Yoma | Opportunities</title>
      </Head>

      <PageBackground />

      {isSearchPerformed && isLoading && <Loading />}

      {/* REFERENCE FOR FILTER POPUP: fix menu z-index issue */}
      <div ref={myRef} />

      {/* POPUP FILTER */}
      <ReactModal
        isOpen={filterFullWindowVisible}
        shouldCloseOnOverlayClick={true}
        onRequestClose={() => {
          setFilterFullWindowVisible(false);
        }}
        className={`fixed bottom-0 left-0 right-0 top-0 flex-grow overflow-y-scroll bg-white animate-in fade-in md:m-auto md:max-h-[600px] md:w-[800px]`}
        portalClassName={"fixed z-40"}
        overlayClassName="fixed inset-0 bg-overlay"
      >
        <OpportunityFilterVertical
          htmlRef={myRef.current!}
          opportunitySearchFilter={opportunitySearchFilter}
          lookups_categories={lookups_categories}
          lookups_countries={lookups_countries}
          lookups_languages={lookups_languages}
          lookups_types={lookups_types}
          lookups_organisations={lookups_organisations}
          lookups_commitmentIntervals={lookups_commitmentIntervals}
          lookups_zltoRewardRanges={lookups_zltoRewardRanges}
          lookups_publishedStates={lookups_publishedStates}
          lookups_statuses={[]}
          submitButtonText="Apply Filters"
          onCancel={onCloseFilter}
          onSubmit={(e) => onSubmitFilter(e)}
          onClear={onClearFilter}
          clearButtonText="Clear All Filters"
          filterOptions={[
            OpportunityFilterOptions.CATEGORIES,
            OpportunityFilterOptions.TYPES,
            OpportunityFilterOptions.COUNTRIES,
            OpportunityFilterOptions.LANGUAGES,
            OpportunityFilterOptions.COMMITMENTINTERVALS,
            OpportunityFilterOptions.ZLTOREWARDRANGES,
            OpportunityFilterOptions.ORGANIZATIONS,
            OpportunityFilterOptions.PUBLISHEDSTATES,
          ]}
        />
      </ReactModal>

      <div className="container z-10 mt-20 max-w-7xl px-2 py-1 md:py-4">
        <div className="flex flex-col gap-2 pb-2 pt-8 text-white">
          <h3 className="-mb-1 flex flex-grow flex-wrap items-center justify-center text-xl font-semibold">
            Find <span className="mx-2 text-orange">opportunities</span> to
            <span className="mx-2 text-orange">unlock</span> your future.
          </h3>
          <h6 className="text-center text-[14px] font-normal text-purple-soft">
            A learning opportunity is a self-paced online course that you can
            finish at your convenience.
          </h6>
          <div className="my-4 md:items-center md:justify-center">
            <div className="flex flex-row items-center justify-center gap-2">
              <SearchInputLarge
                onSearch={onSearchInputSubmit}
                placeholder="What are you looking for?"
                defaultValue={
                  query ? decodeURIComponent(query.toString()) : null
                }
                openFilter={setFilterFullWindowVisible}
              />
            </div>
          </div>
        </div>

        {/* FILTER ROW: CATEGORIES DROPDOWN FILTERS (SELECT) FOR COUNTRIES, LANGUAGES, TYPE, ORGANISATIONS ETC  */}
        <div className="mb-4 mt-10 hidden md:flex">
          <OpportunityFilterHorizontal
            htmlRef={myRef.current!}
            opportunitySearchFilter={opportunitySearchFilter}
            lookups_categories={lookups_categories}
            lookups_countries={lookups_countries}
            lookups_languages={lookups_languages}
            lookups_types={lookups_types}
            lookups_organisations={lookups_organisations}
            lookups_commitmentIntervals={lookups_commitmentIntervals}
            lookups_zltoRewardRanges={lookups_zltoRewardRanges}
            lookups_publishedStates={lookups_publishedStates}
            lookups_statuses={[]}
            clearButtonText="Clear"
            onClear={onClearFilter}
            onSubmit={(e) => onSubmitFilter(e)}
            onOpenFilterFullWindow={() => {
              setFilterFullWindowVisible(!filterFullWindowVisible);
            }}
            filterOptions={[
              OpportunityFilterOptions.CATEGORIES,
              OpportunityFilterOptions.TYPES,
              OpportunityFilterOptions.COUNTRIES,
              OpportunityFilterOptions.LANGUAGES,
              OpportunityFilterOptions.COMMITMENTINTERVALS,
              OpportunityFilterOptions.ZLTOREWARDRANGES,
              OpportunityFilterOptions.ORGANIZATIONS,
              OpportunityFilterOptions.PUBLISHEDSTATES,
            ]}
            totalCount={searchResults?.totalCount ?? 0}
          />
        </div>

        {/* NO SEARCH, SHOW LANDING PAGE (POPULAR, LATEST, ALL etc)*/}
        {!isSearchPerformed && (
          <div className="flex flex-col gap-6">
            {/* TRENDING */}
            {(opportunities_trending?.totalCount ?? 0) > 0 && (
              <OpportunityRow
                id="opportunities_trending"
                title="Trending 🔥"
                data={opportunities_trending}
                viewAllUrl="/opportunities?mostViewed=true"
              />
            )}

            {/* LEARNING COURSES */}
            {(opportunities_learning?.totalCount ?? 0) > 0 && (
              <OpportunityRow
                id="opportunities_learning"
                title="Learning Courses 📚"
                data={opportunities_learning}
                viewAllUrl="/opportunities?types=Learning"
              />
            )}

            {/* IMPACT TASKS */}
            {(opportunities_tasks?.totalCount ?? 0) > 0 && (
              <OpportunityRow
                id="opportunities_tasks"
                title="Impact Tasks ⚡"
                data={opportunities_tasks}
                viewAllUrl="/opportunities?types=Task"
              />
            )}

            {/* ALL OPPORTUNITIES */}
            {(opportunities_allOpportunities?.totalCount ?? 0) > 0 && (
              <>
                <OpportunityRow
                  id="opportunities_allOpportunities"
                  title="All Opportunities"
                  data={opportunities_allOpportunities}
                  viewAllUrl="/opportunities?page=1"
                />

                {/* PAGINATION */}
                <div className="mt-2 grid place-items-center justify-center">
                  <PaginationButtons
                    currentPage={page ? parseInt(page.toString()) : 1}
                    totalItems={
                      opportunities_allOpportunities.totalCount as number
                    }
                    pageSize={PAGE_SIZE}
                    showPages={false}
                    showInfo={true}
                    onClick={handlePagerChange}
                  />
                </div>
              </>
            )}
          </div>
        )}

        {/* SEARCH PERFORMED, SHOW RESULTS */}
        {isSearchPerformed && (
          <div id="results" className="flex flex-col items-center rounded-lg">
            <div className="flex w-full flex-col gap-2">
              {/* NO ROWS */}
              {!searchResults ||
                (searchResults.items.length === 0 && (
                  <NoRowsMessage
                    title={"No opportunities found"}
                    description={
                      "Please try refining your search query or filters above."
                    }
                  />
                ))}

              {/* GRID */}
              {searchResults && searchResults.items.length > 0 && (
                <OpportunityRow
                  id="opportunities_search"
                  data={searchResults}
                />
              )}

              {/* PAGINATION */}
              {searchResults && (searchResults.totalCount as number) > 0 && (
                <div className="mt-2 grid place-items-center justify-center">
                  <PaginationButtons
                    currentPage={currentPage}
                    totalItems={searchResults.totalCount as number}
                    pageSize={PAGE_SIZE}
                    showPages={false}
                    showInfo={true}
                    onClick={handlePagerChange}
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

Opportunities.getLayout = function getLayout(page: ReactElement) {
  return <MainLayout>{page}</MainLayout>;
};

export default Opportunities;
