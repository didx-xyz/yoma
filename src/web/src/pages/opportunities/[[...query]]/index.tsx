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
import type { Country, Language } from "~/api/models/lookups";
import type {
  OpportunityCategory,
  OpportunitySearchCriteriaCommitmentInterval,
  OpportunitySearchCriteriaZltoReward,
  OpportunitySearchFilter,
  OpportunitySearchResultsInfo,
  OpportunityType,
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
import { IoMdOptions } from "react-icons/io";

// This function gets called at build time on server-side.
// It may be called again, on a serverless function, if
// revalidation is enabled and a new request comes in
export const getStaticProps: GetStaticProps = async () => {
  const opportunities_trending = await searchOpportunities({
    pageNumber: 1,
    pageSize: 4,
    categories: null,
    includeExpired: false,
    countries: null,
    languages: null,
    types: null,
    valueContains: null,
    commitmentIntervals: null,
    mostViewed: true,
    organizations: null,
    zltoRewardRanges: null,
  });
  const opportunities_learning = await searchOpportunities({
    pageNumber: 1,
    pageSize: 4,
    categories: null,
    includeExpired: false,
    countries: null,
    languages: null,
    types: OPPORTUNITY_TYPES_LEARNING,
    valueContains: null,
    commitmentIntervals: null,
    mostViewed: null,
    organizations: null,
    zltoRewardRanges: null,
  });
  const opportunities_tasks = await searchOpportunities({
    pageNumber: 1,
    pageSize: 4,
    categories: null,
    includeExpired: false,
    countries: null,
    languages: null,
    types: OPPORTUNITY_TYPES_TASK,
    valueContains: null,
    commitmentIntervals: null,
    mostViewed: null,
    organizations: null,
    zltoRewardRanges: null,
  });
  const opportunities_allOpportunities = await searchOpportunities({
    pageNumber: 1,
    pageSize: 8,
    categories: null,
    includeExpired: false,
    countries: null,
    languages: null,
    types: null,
    valueContains: null,
    commitmentIntervals: null,
    mostViewed: null,
    organizations: null,
    zltoRewardRanges: null,
  });
  const lookups_categories = await getOpportunityCategories();
  const lookups_countries = await getOpportunityCountries();
  const lookups_languages = await getOpportunityLanguages();
  const lookups_organisations = await getOpportunityOrganizations();
  const lookups_types = await getOpportunityTypes();
  const lookups_commitmentIntervals = await getCommitmentIntervals();
  const lookups_zltoRewardRanges = await getZltoRewardRanges();

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
      // Next.js will attempt to re-generate the page:
      // - When a request comes in
      // - At most once every 300 seconds
      revalidate: 300,
    },
  };
};

export const getStaticPaths: GetStaticPaths = () => {
  return {
    paths: [],
    fallback: "blocking",
  };
};

interface InputProps {
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
}

const Opportunities: NextPageWithLayout<InputProps> = ({
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
  const myRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

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
    expired,
  } = router.query;

  const [opportunitySearchFilter, setOpportunitySearchFilter] =
    useState<OpportunitySearchFilter>({
      pageNumber: page ? parseInt(page.toString()) : 1,
      pageSize: PAGE_SIZE,
      categories: null,
      includeExpired: expired ? Boolean(expired) : null,
      countries: null,
      languages: null,
      types: null,
      valueContains: query?.toString() ?? null,
      commitmentIntervals: null,
      mostViewed: null,
      organizations: null,
      zltoRewardRanges: null,
    });

  // memo for isSearchExecuted based on filter parameters
  const isSearchExecuted = useMemo<boolean>(() => {
    return (
      query != undefined ||
      categories != undefined ||
      countries != undefined ||
      languages != undefined ||
      types != undefined ||
      commitmentIntervals != undefined ||
      organizations != undefined ||
      zltoRewardRanges != undefined ||
      mostViewed != undefined ||
      expired != undefined
    );
  }, [
    query,
    categories,
    countries,
    languages,
    types,
    commitmentIntervals,
    organizations,
    zltoRewardRanges,
    mostViewed,
    expired,
  ]);

  const getSearchFilterAsQueryString = useCallback(
    (opportunitySearchFilter: OpportunitySearchFilter) => {
      if (!opportunitySearchFilter) return null;

      // construct querystring parameters from filter
      const params = new URLSearchParams();
      if (
        opportunitySearchFilter.valueContains !== undefined &&
        opportunitySearchFilter.valueContains !== null
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
        opportunitySearchFilter?.includeExpired !== undefined &&
        opportunitySearchFilter?.includeExpired !== null &&
        opportunitySearchFilter?.includeExpired === true
      )
        params.append("expired", "true");
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

  // QUERY: SEARCH RESULTS
  // the filter values from the querystring are mapped to it's corresponding id
  const { data: searchResults, isLoading } =
    useQuery<OpportunitySearchResultsInfo>({
      // queryKey: [`OpportunitiesSearch_${query?.toString()}_${page?.toString()}_${categories}`],
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
        expired,
      ],
      queryFn: async () =>
        await searchOpportunities({
          pageNumber: page ? parseInt(page.toString()) : 1,
          pageSize: PAGE_SIZE,
          valueContains: query?.toString() ?? null,
          includeExpired: expired ? Boolean(expired) : null,
          mostViewed: mostViewed ? Boolean(mostViewed) : null,
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
      enabled: isSearchExecuted, // only run query if search is executed
    });

  useEffect(() => {
    if (isSearchExecuted)
      setOpportunitySearchFilter({
        pageNumber: page ? parseInt(page.toString()) : 1,
        pageSize: PAGE_SIZE,
        valueContains: query?.toString() ?? null,
        includeExpired: expired ? Boolean(expired) : null,
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
      });
  }, [
    setOpportunitySearchFilter,
    isSearchExecuted,
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
    expired,
  ]);

  // memo for results info based on filter parameters
  const searchFilterText = useMemo(() => {
    if (!searchResults) {
      return "0 results";
    }

    const { totalCount } = searchResults;
    const resultText = totalCount === 1 ? "result" : "results";
    const countText = `${totalCount} ${resultText}`;

    const filterText = [
      opportunitySearchFilter.valueContains &&
        `'${opportunitySearchFilter.valueContains}'`,
      opportunitySearchFilter.mostViewed && `'Trending'`,
      opportunitySearchFilter.includeExpired && `'Expired'`,
      opportunitySearchFilter.categories?.map((c) => `'${c}'`)?.join(", "),
      opportunitySearchFilter.countries?.map((c) => `'${c}'`)?.join(", "),
      opportunitySearchFilter.languages?.map((c) => `'${c}'`).join(", "),
      opportunitySearchFilter.types?.map((c) => `'${c}'`).join(", "),
      opportunitySearchFilter.organizations?.map((c) => `'${c}'`).join(", "),
      // opportunitySearchFilter.commitmentIntervals
      //   ?.map((c) => `'${c}'`)
      //   .join(", "),
      // opportunitySearchFilter.zltoRewardRanges?.map((c) => `'${c}'`).join(", "),
    ]
      .filter(Boolean)
      .join(", ");

    return `${countText} for ${filterText}`;
  }, [opportunitySearchFilter, searchResults]);

  const redirectWithSearchFilterParams = useCallback(
    (item: OpportunitySearchFilter) => {
      let url = "/opportunities";
      const params = getSearchFilterAsQueryString(item);
      if (params != null && params.size > 0)
        url = `/opportunities?${params.toString()}`;

      if (url != router.asPath)
        void router.push(url, undefined, { scroll: false });
    },
    [router, getSearchFilterAsQueryString],
  );

  const onSearchInputSubmit = useCallback(
    (query: string) => {
      if (query && query.length > 2) {
        // uri encode the search value
        const searchValueEncoded = encodeURIComponent(query);
        query = searchValueEncoded;

        opportunitySearchFilter.valueContains = query;
        redirectWithSearchFilterParams(opportunitySearchFilter);
      } else void router.push("/opportunities", undefined, { scroll: false });
    },
    [router, opportunitySearchFilter, redirectWithSearchFilterParams],
  );

  const [filterFullWindowVisible, setFilterFullWindowVisible] = useState(false);
  const smallDisplay = useAtomValue(smallDisplayAtom);

  // disable full-size search filters when resizing to larger screens
  useEffect(() => {
    if (!smallDisplay) setFilterFullWindowVisible(false);
  }, [smallDisplay]);

  // FILTER POPUP HANDLERS
  const onCloseFilter = useCallback(() => {
    setFilterFullWindowVisible(false);
  }, [setFilterFullWindowVisible]);

  const onSubmitFilter = useCallback(
    (val: OpportunitySearchFilter) => {
      setFilterFullWindowVisible(false);
      setOpportunitySearchFilter(val);
      redirectWithSearchFilterParams(val);
    },
    [
      setFilterFullWindowVisible,
      setOpportunitySearchFilter,
      redirectWithSearchFilterParams,
    ],
  );

  const onClearFilter = useCallback(() => {
    void router.push("/opportunities", undefined, { scroll: true });
  }, [router]);

  // 🧮 calculated fields
  const currentPage = useMemo(() => {
    return page ? parseInt(page as string) : 1;
  }, [page]);

  // 🔔 change events
  const handlePagerChange = useCallback(
    (value: number) => {
      opportunitySearchFilter.pageNumber = value;
      redirectWithSearchFilterParams(opportunitySearchFilter);
    },
    [opportunitySearchFilter, redirectWithSearchFilterParams],
  );

  // scroll to results when search is executed
  useEffect(() => {
    if (isSearchExecuted) {
      setTimeout(() => {
        const element = document.getElementById("results");
        element?.scrollIntoView({ behavior: "smooth" });
      }, 500);
    }
  }, [isSearchExecuted]);

  return (
    <>
      <Head>
        <title>Yoma | Opportunities</title>
      </Head>

      <PageBackground />

      {isSearchExecuted && isLoading && <Loading />}

      <div ref={myRef} />

      {/* POPUP FILTER */}
      <ReactModal
        isOpen={filterFullWindowVisible}
        shouldCloseOnOverlayClick={true}
        onRequestClose={() => {
          setFilterFullWindowVisible(false);
        }}
        className={`fixed bottom-0 left-0 right-0 top-0 flex-grow overflow-y-scroll rounded-lg bg-white animate-in fade-in md:m-auto md:max-h-[600px] md:w-[800px]`}
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
          cancelButtonText="Close"
          submitButtonText="Done"
          onCancel={onCloseFilter}
          onSubmit={onSubmitFilter}
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
                placeholder="What are you looking for today?"
                defaultValue={query as string}
              />
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  setFilterFullWindowVisible(!filterFullWindowVisible);
                }}
              >
                <IoMdOptions className="h-5 w-5" />
              </button>
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
            clearButtonText="Clear"
            onClear={onClearFilter}
            onSubmit={onSubmitFilter}
            onOpenFilterFullWindow={() => {
              setFilterFullWindowVisible(!filterFullWindowVisible);
            }}
            isSearchExecuted={isSearchExecuted}
          />
        </div>

        {/* NO SEARCH, SHOW LANDING PAGE (POPULAR, LATEST, ALL etc)*/}
        {!isSearchExecuted && (
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
              <OpportunityRow
                id="opportunities_allOpportunities"
                title="All Opportunities"
                data={opportunities_allOpportunities}
              />
            )}

            {/* RECENTLY VIEWED */}

            {/* <div className="flex flex-col gap-2 py-4 sm:flex-row">
          <h3 className="flex flex-grow text-white">Opportunities</h3>

          <div className="flex gap-2 sm:justify-end">
            <SearchInput defaultValue={query as string} onSearch={onSearch} />

            <Link
              href="/organisations/register"
              className="flex w-40 flex-row items-center justify-center whitespace-nowrap rounded-full bg-green-dark p-1 text-xs text-white"
            >
              <IoMdAdd className="h-5 w-5" />
              Add organisation
            </Link>
          </div>
        </div> */}
          </div>
        )}

        {/* SEARCH EXECUTED, SHOW RESULTS */}
        {isSearchExecuted && (
          <div
            id="results"
            className="flex flex-col items-center rounded-lg p-4"
          >
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
                  title={searchFilterText}
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
