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
  type OpportunitySearchFilter,
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
import { OpportunitiesGrid } from "~/components/Opportunity/OpportunitiesGrid";
import { PageBackground } from "~/components/PageBackground";
import { SearchInputLarge } from "~/components/SearchInputLarge";
import { screenWidthAtom } from "~/lib/store";
import { type NextPageWithLayout } from "~/pages/_app";
import { OpportunityFilterVertical } from "~/components/Opportunity/OpportunityFilterVertical";
import {
  PAGE_SIZE,
  OPPORTUNITY_TYPES_LEARNING,
  OPPORTUNITY_TYPES_TASK,
  PAGE_SIZE_MINIMUM,
  VIEWPORT_SIZE,
  OPPORTUNITY_TYPES_EVENT,
  OPPORTUNITY_TYPES_OTHER,
  SSG_REVALIDATE,
} from "~/lib/constants";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import NoRowsMessage from "~/components/NoRowsMessage";
import { OpportunityFilterHorizontal } from "~/components/Opportunity/OpportunityFilterHorizontal";
import { Loading } from "~/components/Status/Loading";
import { PaginationButtons } from "~/components/PaginationButtons";
import { useSession } from "next-auth/react";
import { OpportunityFilterOptions } from "~/api/models/opportunity";
import OpportunitiesCarousel from "~/components/Opportunity/OpportunitiesCarousel";
import FilterBadges from "~/components/FilterBadges";
import { useDisableBodyScroll } from "~/hooks/useDisableBodyScroll";

// 👇 SSG
// This page is statically generated at build time on server-side
// so that the initial data needed for the filter options and carousels (first 4 items) are immediately available when the page loads
// after that, client side queries are executed & cached via the queryClient, whenever a search is performed (selecting a filter, clicked most viewed link etc)
// or when more data is requested in the carousels (paging)
export const getStaticProps: GetStaticProps = async (context) => {
  const opportunities_featured = await searchOpportunities(
    {
      pageNumber: 1,
      pageSize: PAGE_SIZE_MINIMUM,
      categories: null,
      countries: null,
      languages: null,
      types: null,
      valueContains: null,
      commitmentIntervals: null,
      mostViewed: null,
      mostCompleted: null,
      organizations: null,
      zltoRewardRanges: null,
      publishedStates: [PublishedState.Active, PublishedState.NotStarted],
      featured: true,
    },
    context,
  );

  const opportunities_trending = await searchOpportunities(
    {
      pageNumber: 1,
      pageSize: PAGE_SIZE_MINIMUM,
      categories: null,
      countries: null,
      languages: null,
      types: null,
      valueContains: null,
      commitmentIntervals: null,
      mostViewed: true,
      mostCompleted: false,
      organizations: null,
      zltoRewardRanges: null,
      publishedStates: [PublishedState.Active, PublishedState.NotStarted],
      featured: null,
    },
    context,
  );

  const opportunities_mostCompleted = await searchOpportunities(
    {
      pageNumber: 1,
      pageSize: PAGE_SIZE_MINIMUM,
      categories: null,
      countries: null,
      languages: null,
      types: null,
      valueContains: null,
      commitmentIntervals: null,
      mostViewed: null,
      mostCompleted: true,
      organizations: null,
      zltoRewardRanges: null,
      publishedStates: [PublishedState.Active, PublishedState.NotStarted],
      featured: null,
    },
    context,
  );

  const opportunities_learning = await searchOpportunities(
    {
      pageNumber: 1,
      pageSize: PAGE_SIZE_MINIMUM,
      categories: null,
      countries: null,
      languages: null,
      types: OPPORTUNITY_TYPES_LEARNING,
      valueContains: null,
      commitmentIntervals: null,
      mostViewed: null,
      mostCompleted: false,
      organizations: null,
      zltoRewardRanges: null,
      publishedStates: [PublishedState.Active, PublishedState.NotStarted],
      featured: null,
    },
    context,
  );

  const opportunities_tasks = await searchOpportunities(
    {
      pageNumber: 1,
      pageSize: PAGE_SIZE_MINIMUM,
      categories: null,
      countries: null,
      languages: null,
      types: OPPORTUNITY_TYPES_TASK,
      valueContains: null,
      commitmentIntervals: null,
      mostViewed: null,
      mostCompleted: false,
      organizations: null,
      zltoRewardRanges: null,
      publishedStates: [PublishedState.Active, PublishedState.NotStarted],
      featured: null,
    },
    context,
  );

  const opportunities_events = await searchOpportunities(
    {
      pageNumber: 1,
      pageSize: PAGE_SIZE_MINIMUM,
      categories: null,
      countries: null,
      languages: null,
      types: OPPORTUNITY_TYPES_EVENT,
      valueContains: null,
      commitmentIntervals: null,
      mostViewed: null,
      mostCompleted: false,
      organizations: null,
      zltoRewardRanges: null,
      publishedStates: [PublishedState.Active, PublishedState.NotStarted],
      featured: null,
    },
    context,
  );

  const opportunities_other = await searchOpportunities(
    {
      pageNumber: 1,
      pageSize: PAGE_SIZE_MINIMUM,
      categories: null,
      countries: null,
      languages: null,
      types: OPPORTUNITY_TYPES_OTHER,
      valueContains: null,
      commitmentIntervals: null,
      mostViewed: null,
      mostCompleted: false,
      organizations: null,
      zltoRewardRanges: null,
      publishedStates: [PublishedState.Active, PublishedState.NotStarted],
      featured: null,
    },
    context,
  );

  const opportunities_allOpportunities = await searchOpportunities(
    {
      pageNumber: 1,
      pageSize: PAGE_SIZE_MINIMUM,
      categories: null,
      countries: null,
      languages: null,
      types: null,
      valueContains: null,
      commitmentIntervals: null,
      mostViewed: null,
      mostCompleted: false,
      organizations: null,
      zltoRewardRanges: null,
      publishedStates: [PublishedState.Active, PublishedState.NotStarted],
      featured: null,
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
      opportunities_featured,
      opportunities_trending,
      opportunities_mostCompleted,
      opportunities_learning,
      opportunities_tasks,
      opportunities_events,
      opportunities_other,
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
    revalidate: SSG_REVALIDATE,
  };
};

export const getStaticPaths: GetStaticPaths = () => {
  return {
    paths: [],
    fallback: "blocking",
  };
};

const Opportunities: NextPageWithLayout<{
  opportunities_featured: OpportunitySearchResultsInfo;
  opportunities_trending: OpportunitySearchResultsInfo;
  opportunities_mostCompleted: OpportunitySearchResultsInfo;
  opportunities_learning: OpportunitySearchResultsInfo;
  opportunities_tasks: OpportunitySearchResultsInfo;
  opportunities_events: OpportunitySearchResultsInfo;
  opportunities_other: OpportunitySearchResultsInfo;
  opportunities_allOpportunities: OpportunitySearchResultsInfo;
  lookups_categories: OpportunityCategory[];
  lookups_countries: Country[];
  lookups_languages: Language[];
  lookups_organisations: OrganizationInfo[];
  lookups_types: OpportunityType[];
  lookups_commitmentIntervals: OpportunitySearchCriteriaCommitmentInterval[];
  lookups_zltoRewardRanges: OpportunitySearchCriteriaZltoReward[];
}> = ({
  opportunities_featured,
  opportunities_trending,
  opportunities_mostCompleted,
  opportunities_learning,
  opportunities_tasks,
  opportunities_events,
  opportunities_other,
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
  const screenWidth = useAtomValue(screenWidthAtom);
  const queryClient = useQueryClient();

  const lookups_publishedStates: SelectOption[] = [
    { value: "0", label: "Not started" },
    { value: "1", label: "Ongoing" },
    ...(session ? [{ value: "2", label: "Expired / Upload Only" }] : []), // logged in users can see expired
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
    mostCompleted,
    featured,
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
      mostCompleted != undefined ||
      featured != undefined ||
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
    mostCompleted,
    featured,
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
        mostCompleted,
        featured,
        publishedStates,
      ],
      queryFn: async () =>
        await searchOpportunities({
          pageNumber: page ? parseInt(page.toString()) : 1,
          pageSize: PAGE_SIZE,
          valueContains: query ? decodeURIComponent(query.toString()) : null,
          mostViewed: mostViewed ? Boolean(mostViewed) : null,
          mostCompleted: mostCompleted ? Boolean(mostCompleted) : null,
          featured: featured ? Boolean(featured) : null,
          publishedStates:
            publishedStates != undefined
              ? // if set, map to id
                publishedStates
                  ?.toString()
                  .split(",")
                  .map((x) => {
                    const item = lookups_publishedStates.find(
                      (y) => y.label === x,
                    );
                    return item ? item?.value : "";
                  })
                  .filter((x) => x != "")
              : // if not set, default to active, not started (and expired if logged in)
                [
                  PublishedState.Active,
                  PublishedState.NotStarted,
                  ...(session ? [PublishedState.Expired] : []),
                ],
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
                  .split("|") // use | delimiter as some languages contain ',' e.g (Catalan, Valencian)
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
      mostCompleted: null,
      featured: null,
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
        mostCompleted: mostCompleted ? Boolean(mostCompleted) : null,
        featured: featured ? Boolean(featured) : null,
        types: types != undefined ? types?.toString().split(",") : null,
        categories:
          categories != undefined ? categories?.toString().split(",") : null,
        countries:
          countries != undefined && countries != null
            ? countries?.toString().split(",")
            : null,
        languages:
          languages != undefined ? languages?.toString().split("|") : null, // use | delimiter as some languages contain ',' e.g (Catalan, Valencian)
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
    mostCompleted,
    featured,
    publishedStates,
  ]);

  // disable full-size search filters when resizing to larger screens
  useEffect(() => {
    if (screenWidth < VIEWPORT_SIZE.MD) setFilterFullWindowVisible(false);
  }, [screenWidth]);

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
        params.append("languages", opportunitySearchFilter.languages.join("|")); // use | delimiter as some languages contain ',' e.g (Catalan, Valencian)
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
        opportunitySearchFilter?.mostCompleted !== undefined &&
        opportunitySearchFilter?.mostCompleted !== null
      )
        params.append(
          "mostCompleted",
          opportunitySearchFilter?.mostCompleted ? "true" : "false",
        );

      if (
        opportunitySearchFilter?.featured !== undefined &&
        opportunitySearchFilter?.featured !== null
      )
        params.append(
          "featured",
          opportunitySearchFilter?.featured ? "true" : "false",
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
      val.pageNumber = null; // clear paging when changing filters
      redirectWithSearchFilterParams(val);
    },
    [redirectWithSearchFilterParams],
  );

  const onClearFilter = useCallback(() => {
    void router.push("/opportunities", undefined, { scroll: true });
  }, [router]);

  // 🎠 CAROUSEL: data fetching
  const fetchDataAndUpdateCache = useCallback(
    async (
      queryKey: string[],
      filter: OpportunitySearchFilter,
    ): Promise<OpportunitySearchResultsInfo> => {
      const cachedData =
        queryClient.getQueryData<OpportunitySearchResultsInfo>(queryKey);

      if (cachedData) {
        return cachedData;
      }

      const data = await searchOpportunities(filter);

      queryClient.setQueryData(queryKey, data);

      return data;
    },
    [queryClient],
  );

  const loadDataTrending = useCallback(
    async (startRow: number) => {
      if (startRow >= (opportunities_trending?.totalCount ?? 0)) {
        return {
          items: [],
          totalCount: 0,
        };
      }

      const pageNumber = Math.ceil(startRow / PAGE_SIZE_MINIMUM);

      return fetchDataAndUpdateCache(["trending", pageNumber.toString()], {
        pageNumber: pageNumber,
        pageSize: PAGE_SIZE_MINIMUM,
        categories: null,
        countries: null,
        languages: null,
        types: null,
        valueContains: null,
        commitmentIntervals: null,
        mostViewed: true,
        mostCompleted: null,
        featured: null,
        organizations: null,
        zltoRewardRanges: null,
        publishedStates: [PublishedState.Active, PublishedState.NotStarted],
      });
    },
    [opportunities_trending, fetchDataAndUpdateCache],
  );

  const loadDataLearning = useCallback(
    async (startRow: number) => {
      if (startRow >= (opportunities_learning?.totalCount ?? 0)) {
        return {
          items: [],
          totalCount: 0,
        };
      }

      const pageNumber = Math.ceil(startRow / PAGE_SIZE_MINIMUM);

      return fetchDataAndUpdateCache(["learning", pageNumber.toString()], {
        pageNumber: pageNumber,
        pageSize: PAGE_SIZE_MINIMUM,
        categories: null,
        countries: null,
        languages: null,
        types: OPPORTUNITY_TYPES_LEARNING,
        valueContains: null,
        commitmentIntervals: null,
        mostViewed: null,
        mostCompleted: null,
        featured: null,
        organizations: null,
        zltoRewardRanges: null,
        publishedStates: [PublishedState.Active, PublishedState.NotStarted],
      });
    },
    [opportunities_learning, fetchDataAndUpdateCache],
  );

  const loadDataTasks = useCallback(
    async (startRow: number) => {
      if (startRow >= (opportunities_tasks?.totalCount ?? 0)) {
        return {
          items: [],
          totalCount: 0,
        };
      }

      const pageNumber = Math.ceil(startRow / PAGE_SIZE_MINIMUM);

      return fetchDataAndUpdateCache(["tasks", pageNumber.toString()], {
        pageNumber: pageNumber,
        pageSize: PAGE_SIZE_MINIMUM,
        categories: null,
        countries: null,
        languages: null,
        types: OPPORTUNITY_TYPES_TASK,
        valueContains: null,
        commitmentIntervals: null,
        mostViewed: null,
        mostCompleted: null,
        featured: null,
        organizations: null,
        zltoRewardRanges: null,
        publishedStates: [PublishedState.Active, PublishedState.NotStarted],
      });
    },
    [opportunities_tasks, fetchDataAndUpdateCache],
  );

  const loadDataEvents = useCallback(
    async (startRow: number) => {
      if (startRow >= (opportunities_events?.totalCount ?? 0)) {
        return {
          items: [],
          totalCount: 0,
        };
      }

      const pageNumber = Math.ceil(startRow / PAGE_SIZE_MINIMUM);

      return fetchDataAndUpdateCache(["events", pageNumber.toString()], {
        pageNumber: pageNumber,
        pageSize: PAGE_SIZE_MINIMUM,
        categories: null,
        countries: null,
        languages: null,
        types: OPPORTUNITY_TYPES_EVENT,
        valueContains: null,
        commitmentIntervals: null,
        mostViewed: null,
        mostCompleted: null,
        featured: null,
        organizations: null,
        zltoRewardRanges: null,
        publishedStates: [PublishedState.Active, PublishedState.NotStarted],
      });
    },
    [opportunities_events, fetchDataAndUpdateCache],
  );

  const loadDataOther = useCallback(
    async (startRow: number) => {
      if (startRow >= (opportunities_other?.totalCount ?? 0)) {
        return {
          items: [],
          totalCount: 0,
        };
      }

      const pageNumber = Math.ceil(startRow / PAGE_SIZE_MINIMUM);

      return fetchDataAndUpdateCache(["other", pageNumber.toString()], {
        pageNumber: pageNumber,
        pageSize: PAGE_SIZE_MINIMUM,
        categories: null,
        countries: null,
        languages: null,
        types: OPPORTUNITY_TYPES_OTHER,
        valueContains: null,
        commitmentIntervals: null,
        mostViewed: null,
        mostCompleted: null,
        featured: null,
        organizations: null,
        zltoRewardRanges: null,
        publishedStates: [PublishedState.Active, PublishedState.NotStarted],
      });
    },
    [opportunities_other, fetchDataAndUpdateCache],
  );

  const loadDataOpportunities = useCallback(
    async (startRow: number) => {
      if (startRow >= (opportunities_allOpportunities?.totalCount ?? 0)) {
        return {
          items: [],
          totalCount: 0,
        };
      }

      const pageNumber = Math.ceil(startRow / PAGE_SIZE_MINIMUM);

      return fetchDataAndUpdateCache(
        ["allOpportunities", pageNumber.toString()],
        {
          pageNumber: pageNumber,
          pageSize: PAGE_SIZE_MINIMUM,
          categories: null,
          countries: null,
          languages: null,
          types: null,
          valueContains: null,
          commitmentIntervals: null,
          mostViewed: null,
          mostCompleted: null,
          featured: null,
          organizations: null,
          zltoRewardRanges: null,
          publishedStates: [PublishedState.Active, PublishedState.NotStarted],
        },
      );
    },
    [opportunities_allOpportunities, fetchDataAndUpdateCache],
  );

  const loadDataMostCompleted = useCallback(
    async (startRow: number) => {
      if (startRow >= (opportunities_mostCompleted?.totalCount ?? 0)) {
        return {
          items: [],
          totalCount: 0,
        };
      }

      const pageNumber = Math.ceil(startRow / PAGE_SIZE_MINIMUM);

      return fetchDataAndUpdateCache(["mostCompleted", pageNumber.toString()], {
        pageNumber: pageNumber,
        pageSize: PAGE_SIZE_MINIMUM,
        categories: null,
        countries: null,
        languages: null,
        types: null,
        valueContains: null,
        commitmentIntervals: null,
        mostViewed: null,
        mostCompleted: true,
        featured: null,
        organizations: null,
        zltoRewardRanges: null,
        publishedStates: [PublishedState.Active, PublishedState.NotStarted],
      });
    },
    [opportunities_mostCompleted, fetchDataAndUpdateCache],
  );

  const loadDataFeatured = useCallback(
    async (startRow: number) => {
      if (startRow >= (opportunities_featured?.totalCount ?? 0)) {
        return {
          items: [],
          totalCount: 0,
        };
      }

      const pageNumber = Math.ceil(startRow / PAGE_SIZE_MINIMUM);

      return fetchDataAndUpdateCache(["featured", pageNumber.toString()], {
        pageNumber: pageNumber,
        pageSize: PAGE_SIZE_MINIMUM,
        categories: null,
        countries: null,
        languages: null,
        types: null,
        valueContains: null,
        commitmentIntervals: null,
        mostViewed: null,
        mostCompleted: null,
        featured: true,
        organizations: null,
        zltoRewardRanges: null,
        publishedStates: [PublishedState.Active, PublishedState.NotStarted],
      });
    },
    [opportunities_featured, fetchDataAndUpdateCache],
  );

  // 👇 prevent scrolling on the page when the dialogs are open
  useDisableBodyScroll(filterFullWindowVisible);

  return (
    <>
      <Head>
        <title>Yoma | Opportunities</title>
      </Head>

      <PageBackground className="h-[300px] lg:h-[392px]" />

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

      <div className="container z-10 mt-12 w-full overflow-hidden px-2 py-1 md:mt-20 md:max-w-7xl md:py-4">
        <div className="mb-4 flex flex-col items-center justify-center gap-2 pt-12 text-white">
          <h3 className="w-[300px] flex-grow flex-wrap text-center text-xl font-semibold md:w-full">
            Find <span className="mx-2 text-orange">opportunities</span> to
            <span className="mx-2 text-orange">unlock</span> your future.
          </h3>
          <h6 className="w-[300px] text-center text-[14px] font-normal text-purple-soft md:w-full">
            A learning opportunity is a self-paced online course that you can
            finish at your convenience.
          </h6>
          <div className="w-full px-2 md:w-[600px] md:items-center md:justify-center">
            <div className="flex flex-row items-center justify-center gap-2 md:mt-4">
              <SearchInputLarge
                onSearch={onSearchInputSubmit}
                placeholder="Search..."
                defaultValue={
                  query ? decodeURIComponent(query.toString()) : null
                }
                openFilter={setFilterFullWindowVisible}
              />
            </div>
          </div>
        </div>

        {/* FILTER ROW: CATEGORIES DROPDOWN FILTERS (SELECT) FOR COUNTRIES, LANGUAGES, TYPE, ORGANISATIONS ETC  */}
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
          totalCount={isSearchPerformed ? searchResults?.totalCount ?? 0 : 0}
        />

        {/* FILTER BADGES */}
        <FilterBadges
          searchFilter={opportunitySearchFilter}
          excludeKeys={["pageNumber", "pageSize"]}
          resolveValue={(key, value) => {
            if (key === "commitmentIntervals") {
              const lookup = lookups_commitmentIntervals.find(
                (interval) => interval.id === value,
              );
              return lookup?.name;
            } else if (key === "zltoRewardRanges") {
              const lookup = lookups_zltoRewardRanges.find(
                (interval) => interval.id === value,
              );
              return lookup?.name;
            } else if (key === "mostViewed") {
              return "Trending";
            } else if (key === "mostCompleted") {
              return "Most Completed";
            } else if (key === "featured") {
              return "Featured";
            }
            return value;
          }}
          onSubmit={(e) => onSubmitFilter(e)}
        />

        {/* NO SEARCH, SHOW LANDING PAGE (POPULAR, LATEST, ALL etc)*/}
        {!isSearchPerformed && (
          <div className="-mt-4 gap-6 px-2 pb-4 md:p-0 md:pb-0">
            {/* FEATURED */}
            {(opportunities_featured?.totalCount ?? 0) > 0 && (
              <OpportunitiesCarousel
                id={`opportunities_featured`}
                title="Featured"
                description="Explore our featured opportunities"
                data={opportunities_featured}
                loadData={loadDataFeatured}
                viewAllUrl="/opportunities?featured=true"
              />
            )}

            {/* TRENDING */}
            {(opportunities_trending?.totalCount ?? 0) > 0 && (
              <OpportunitiesCarousel
                id={`opportunities_trending`}
                title="Trending 🔥"
                description="The most viewed opportunities"
                data={opportunities_trending}
                loadData={loadDataTrending}
                viewAllUrl="/opportunities?mostViewed=true"
              />
            )}

            {/* MOST COMPLETED */}
            {(opportunities_mostCompleted?.totalCount ?? 0) > 0 && (
              <OpportunitiesCarousel
                id={`opportunities_mostCompleted`}
                title="Most completed"
                description="The most completed opportunities"
                data={opportunities_mostCompleted}
                loadData={loadDataMostCompleted}
                viewAllUrl="/opportunities?mostCompleted=true"
              />
            )}

            {/* LEARNING COURSES */}
            {(opportunities_learning?.totalCount ?? 0) > 0 && (
              <OpportunitiesCarousel
                id={`opportunities_learning`}
                title="Learning Courses 📚"
                description="Discover exciting online courses"
                data={opportunities_learning}
                loadData={loadDataLearning}
                viewAllUrl="/opportunities?types=Learning"
              />
            )}

            {/* TASKS */}
            {(opportunities_tasks?.totalCount ?? 0) > 0 && (
              <OpportunitiesCarousel
                id={`opportunities_tasks`}
                title="Micro-tasks ⚡"
                description="Contribute to real-world projects"
                data={opportunities_tasks}
                loadData={loadDataTasks}
                viewAllUrl="/opportunities?types=Micro-task"
              />
            )}

            {/* EVENTS */}
            {(opportunities_events?.totalCount ?? 0) > 0 && (
              <OpportunitiesCarousel
                id={`opportunities_events`}
                title="Events 🎉"
                description="Explore events to attend"
                data={opportunities_events}
                loadData={loadDataEvents}
                viewAllUrl="/opportunities?types=Event"
              />
            )}

            {/* OTHER */}
            {(opportunities_other?.totalCount ?? 0) > 0 && (
              <OpportunitiesCarousel
                id={`opportunities_other`}
                title="Other 💡"
                description="Explore other opportunities"
                data={opportunities_other}
                loadData={loadDataOther}
                viewAllUrl="/opportunities?types=Other"
              />
            )}

            {/* ALL OPPORTUNITIES */}
            {(opportunities_allOpportunities?.totalCount ?? 0) > 0 && (
              <OpportunitiesCarousel
                id={`opportunities_allOpportunities`}
                title="All Opportunities"
                description="Explore all available opportunities"
                data={opportunities_allOpportunities}
                loadData={loadDataOpportunities}
                viewAllUrl="/opportunities?page=1"
              />
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
                <OpportunitiesGrid
                  id="opportunities_search"
                  data={searchResults}
                  loadData={loadDataTrending}
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
