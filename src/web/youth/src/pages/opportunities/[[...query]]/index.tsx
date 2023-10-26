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
import { IoMdOptions } from "react-icons/io";
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
import { OpportunityCategoryHorizontalCard } from "~/components/Opportunity/OpportunityCategoryHorizontalCard";
import { OpportunityRow } from "~/components/Opportunity/OpportunityRow";
import { PageBackground } from "~/components/PageBackground";
import { SearchInputLarge } from "~/components/SearchInputLarge";
import { smallDisplayAtom } from "~/lib/store";
import { type NextPageWithLayout } from "~/pages/_app";
import { OpportunityFilterVertical } from "~/components/Opportunity/OpportunityFilterVertical";
import { PAGE_SIZE } from "~/lib/constants";
import { useQuery } from "@tanstack/react-query";
import NoRowsMessage from "~/components/NoRowsMessage";
import { OpportunityFilterHorizontal } from "~/components/Opportunity/OpportunityFilterHorizontal";
import iconNextArrow from "public/images/icon-next-arrow.svg";
import { toBase64, shimmer } from "~/lib/image";
import Image from "next/image";
import { Loading } from "~/components/Status/Loading";
import { PaginationButtons } from "~/components/PaginationButtons";

// This function gets called at build time on server-side.
// It may be called again, on a serverless function, if
// revalidation is enabled and a new request comes in
export const getStaticProps: GetStaticProps = async () => {
  const opportunities_popular = await searchOpportunities({
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
  const opportunities_latestCourses = await searchOpportunities({
    pageNumber: 1,
    pageSize: 4,
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
  const opportunities_allCourses = await searchOpportunities({
    pageNumber: 1,
    pageSize: 4,
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
      opportunities_popular,
      opportunities_latestCourses,
      opportunities_allCourses,
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
  opportunities_popular: OpportunitySearchResultsInfo;
  opportunities_latestCourses: OpportunitySearchResultsInfo;
  opportunities_allCourses: OpportunitySearchResultsInfo;
  lookups_categories: OpportunityCategory[];
  lookups_countries: Country[];
  lookups_languages: Language[];
  lookups_organisations: OrganizationInfo[];
  lookups_types: OpportunityType[];
  lookups_commitmentIntervals: OpportunitySearchCriteriaCommitmentInterval[];
  lookups_zltoRewardRanges: OpportunitySearchCriteriaZltoReward[];
}

const Opportunities: NextPageWithLayout<InputProps> = ({
  opportunities_popular,
  opportunities_latestCourses,
  opportunities_allCourses,
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
  } = router.query;

  const [opportunitySearchFilter, setOpportunitySearchFilter] =
    useState<OpportunitySearchFilter>({
      pageNumber: page ? parseInt(page.toString()) : 1,
      pageSize: PAGE_SIZE,
      categories: null,
      includeExpired: false,
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
      mostViewed != undefined
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
        opportunitySearchFilter.pageNumber !== null &&
        opportunitySearchFilter.pageNumber !== undefined &&
        opportunitySearchFilter.pageNumber !== 1
      )
        params.append("page", opportunitySearchFilter.pageNumber.toString());
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

      if (params.size === 0) return null;
      return params;
    },
    [],
  );

  // memo for results info based on filter parameters
  const searchFilterText = useMemo<string>(() => {
    let result = "";
    if (opportunitySearchFilter.valueContains != undefined)
      result = `'${opportunitySearchFilter.valueContains}'`;
    if (
      opportunitySearchFilter.mostViewed != undefined &&
      opportunitySearchFilter.mostViewed
    )
      result += ` 'Most Viewed'`;

    const params = getSearchFilterAsQueryString(opportunitySearchFilter);
    if (params != null && params.size > 0) {
      // exclude page and mostViewed from param count
      params.delete("page");
      params.delete("mostViewed");
      if (params != null && params.size > 0) {
        if (result.length > 0) result += " and ";
        const plural = params.size > 1 ? "s" : "";
        result += ` ${params.size} filter${plural}`;
      }
    }
    return result;
  }, [opportunitySearchFilter, getSearchFilterAsQueryString]);

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
      ],
      queryFn: async () =>
        await searchOpportunities({
          // pageNumber: page ? parseInt(page.toString()) : 1,
          // pageSize: PAGE_SIZE,
          // categories:
          //   categories != undefined ? categories?.toString().split(",") : null,
          // includeExpired: false,
          // countries:
          //   countries != undefined ? countries?.toString().split(",") : null,
          // languages:
          //   languages != undefined ? languages?.toString().split(",") : null,
          // types: types != undefined ? types?.toString().split(",") : null,
          // valueContains: query?.toString() ?? null,
          // commitmentIntervals: null, // commitmentIntervals as string[],
          // mostViewed: mostViewed ? Boolean(mostViewed) : null,
          // organizations:
          //   organizations != undefined
          //     ? organizations?.toString().split(",")
          //     : null,
          // zltoRewardRanges: null, // zltoRewardRanges as string[],
          pageNumber: page ? parseInt(page.toString()) : 1,
          pageSize: PAGE_SIZE,
          // categories is string[] of category names. lookup each category name in the lookups_categories array and return the id
          categories:
            categories != undefined
              ? categories
                  ?.toString()
                  .split(",")
                  .map((x) => {
                    const cat = lookups_categories.find((y) => y.name === x);
                    return cat ? cat?.id : "";
                  })
                  .filter((x) => x != "")
              : null,
          includeExpired: false,
          countries:
            countries != undefined ? countries?.toString().split(",") : null,
          languages:
            languages != undefined ? languages?.toString().split(",") : null,
          types: types != undefined ? types?.toString().split(",") : null,
          valueContains: query?.toString() ?? null,
          commitmentIntervals: null, // commitmentIntervals as string[],
          mostViewed: mostViewed ? Boolean(mostViewed) : null,
          organizations:
            organizations != undefined
              ? organizations?.toString().split(",")
              : null,
          zltoRewardRanges: null, // zltoRewardRanges as string[],
        }),
      enabled: isSearchExecuted, // only run query if search is executed
    });

  useEffect(() => {
    if (isSearchExecuted)
      setOpportunitySearchFilter({
        pageNumber: page ? parseInt(page.toString()) : 1,
        pageSize: PAGE_SIZE,
        categories:
          categories != undefined ? categories?.toString().split(",") : [],
        includeExpired: false,
        countries:
          countries != undefined && countries != null
            ? countries?.toString().split(",")
            : [],
        languages:
          languages != undefined ? languages?.toString().split(",") : [],
        types: types != undefined ? types?.toString().split(",") : [],
        valueContains: query?.toString() ?? null,
        commitmentIntervals: [], // commitmentIntervals as string[],
        mostViewed: mostViewed ? Boolean(mostViewed) : null,
        organizations:
          organizations != undefined
            ? organizations?.toString().split(",")
            : [],
        zltoRewardRanges: [], // zltoRewardRanges as string[],
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
  ]);

  const redirectSearchFilter = useCallback(
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

  const onSearch = useCallback(
    (query: string) => {
      if (query && query.length > 2) {
        // uri encode the search value
        const searchValueEncoded = encodeURIComponent(query);
        query = searchValueEncoded;

        opportunitySearchFilter.valueContains = query;
        redirectSearchFilter(opportunitySearchFilter);
      } else void router.push("/opportunities", undefined, { scroll: false });
    },
    [router, opportunitySearchFilter, redirectSearchFilter],
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
      redirectSearchFilter(val);
    },
    [
      setFilterFullWindowVisible,
      setOpportunitySearchFilter,
      redirectSearchFilter,
    ],
  );

  const onClickCategoryFilter = useCallback(
    (cat: OpportunityCategory) => {
      setOpportunitySearchFilter((prev) => {
        if (!prev.categories) prev.categories = [];
        if (prev.categories.includes(cat.id)) {
          prev.categories = prev.categories.filter((x) => x !== cat.id);
        } else {
          prev.categories.push(cat.name);
        }
        return prev;
      });
      redirectSearchFilter(opportunitySearchFilter);
    },
    [opportunitySearchFilter, setOpportunitySearchFilter, redirectSearchFilter],
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
      redirectSearchFilter(opportunitySearchFilter);

      // scroll to the top of the page
      //window.scrollTo(0, 0);
    },
    [opportunitySearchFilter, redirectSearchFilter],
  );

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
        className={`fixed bottom-0 left-0 right-0 top-0 flex-grow overflow-scroll rounded-lg bg-white animate-in fade-in md:m-auto md:max-h-[600px] md:w-[800px]`}
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

      <div className="container z-10 max-w-7xl px-2 py-1 md:py-4">
        <div className="flex flex-col gap-2 pb-2 pt-8 text-white">
          <h3 className="flex flex-grow flex-wrap items-center justify-center">
            Find <span className="mx-2 text-orange">opportunities</span> to
            <span className="mx-2 text-orange">unlock</span> your future.
          </h3>
          <h5 className="text-center">
            A learning opportunity is a self-paced online course that you can
            finish at your convenience.
          </h5>
          <div className="my-4 md:items-center md:justify-center">
            <div className="flex flex-row items-center justify-center gap-2">
              <SearchInputLarge
                onSearch={onSearch}
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
                <IoMdOptions className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>

        {/* CATEGORIES */}
        <div className="hidden flex-col md:flex">
          {lookups_categories && lookups_categories.length > 0 && (
            <div className="flex-col items-center justify-center gap-2 pb-8">
              <div className="flex justify-center gap-2">
                <div className="flex gap-2 overflow-hidden md:w-[800px]">
                  {lookups_categories.map((item) => (
                    <OpportunityCategoryHorizontalCard
                      key={item.id}
                      data={item}
                      selected={opportunitySearchFilter.categories?.includes(
                        item.name,
                      )}
                      onClick={onClickCategoryFilter}
                    />
                  ))}
                </div>
                {/* VIEW ALL: OPEN FILTERS */}
                <button
                  type="button"
                  onClick={() => {
                    setFilterFullWindowVisible(!filterFullWindowVisible);
                  }}
                  className="flex h-[140px] w-[140px] flex-col items-center rounded-lg bg-white p-2"
                >
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-center">
                      <Image
                        src={iconNextArrow}
                        alt="Icon View All"
                        width={60}
                        height={60}
                        sizes="100vw"
                        priority={true}
                        placeholder="blur"
                        blurDataURL={`data:image/svg+xml;base64,${toBase64(
                          shimmer(288, 182),
                        )}`}
                        style={{
                          // borderTopLeftRadius:
                          //   showGreenTopBorder === true ? "none" : "8px",
                          // borderTopRightRadius:
                          //   showGreenTopBorder === true ? "none" : "8px",
                          width: "60px",
                          height: "60px",
                        }}
                      />
                    </div>

                    <div className="flex flex-grow flex-row">
                      <div className="flex flex-grow flex-col gap-1">
                        <h1 className="h-10 overflow-hidden text-ellipsis text-center text-sm font-semibold text-black">
                          View all
                          <br />
                          Topics
                        </h1>
                      </div>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          )}
          {/* FILTER ROW: LABEL AND DROPDOWN FILTERS (SELECT) FOR COUNTRIES, LANGUAGES, TYPE, ORGANISATIONS ETC */}
          <div className="mb-4 flex flex-row">
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
              submitButtonText="Done"
              onClear={onClearFilter}
              onSubmit={onSubmitFilter}
            />
          </div>
        </div>

        {/* NO SEARCH, SHOW LANDING PAGE (POPULAR, LATEST, ALL etc)*/}
        {!isSearchExecuted && (
          <div className="flex flex-col gap-8">
            {/* POPULAR */}
            {(opportunities_popular?.totalCount ?? 0) > 0 && (
              <OpportunityRow
                id="opportunities_popular"
                title="Popular 🔥"
                data={opportunities_popular}
                viewAllUrl="/opportunities?mostViewed=true"
              />
            )}

            {/* LATEST COURCES */}
            {(opportunities_latestCourses?.totalCount ?? 0) > 0 && (
              <OpportunityRow
                id="opportunities_latestCourses"
                title="Latest courses 📚"
                data={opportunities_latestCourses}
              />
            )}

            {/* ALL COURSES */}
            {(opportunities_allCourses?.totalCount ?? 0) > 0 && (
              <OpportunityRow
                id="opportunities_allCourses"
                title="All courses"
                data={opportunities_allCourses}
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
          <>
            {/* SEARCH RESULTS */}
            <div className="items-centerx rounded-lgx bg-whitex p-4x flex flex-col">
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
                    title={`${searchResults.totalCount} results for ${searchFilterText}`}
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
          </>
        )}
      </div>
    </>
  );
};

Opportunities.getLayout = function getLayout(page: ReactElement) {
  return <MainLayout>{page}</MainLayout>;
};

export default Opportunities;
