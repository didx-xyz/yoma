import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAtomValue } from "jotai";
import type { GetStaticPaths, GetStaticProps } from "next";
import { useSession } from "next-auth/react";
import Head from "next/head";
import { useRouter } from "next/router";
import {
  useCallback,
  useMemo,
  useRef,
  useState,
  type ReactElement,
} from "react";
import ReactModal from "react-modal";
import type {
  EngagementType,
  SelectOption,
  TimeInterval,
} from "~/api/models/lookups";
import {
  PublishedState,
  type OpportunityCategory,
  type OpportunitySearchFilter,
  type OpportunitySearchResultsInfo,
  type OpportunityType,
} from "~/api/models/opportunity";
import type { OrganizationInfo } from "~/api/models/organisation";
import { getEngagementTypes, getTimeIntervals } from "~/api/services/lookups";
import {
  getOpportunityCategories,
  getOpportunityCountries,
  getOpportunityLanguages,
  getOpportunityOrganizations,
  getOpportunityTypes,
  searchOpportunities,
} from "~/api/services/opportunities";
import FilterBadges from "~/components/FilterBadges";
import MainLayout from "~/components/Layout/Main";
import NoRowsMessage from "~/components/NoRowsMessage";
import OpportunitiesCarousel from "~/components/Opportunity/OpportunitiesCarousel";
import { OpportunitiesGrid } from "~/components/Opportunity/OpportunitiesGrid";
import OpportunityCategoriesHorizontalFilter from "~/components/Opportunity/OpportunityCategoriesHorizontalFilter";
import { OpportunityFilterVertical } from "~/components/Opportunity/OpportunityFilterVertical";
import { PageBackground } from "~/components/PageBackground";
import { PaginationButtons } from "~/components/PaginationButtons";
import { SearchInputLarge } from "~/components/SearchInputLarge";
import { Loading } from "~/components/Status/Loading";
import { useDisableBodyScroll } from "~/hooks/useDisableBodyScroll";
import {
  OPPORTUNITY_TYPES_EVENT,
  OPPORTUNITY_TYPES_LEARNING,
  OPPORTUNITY_TYPES_OTHER,
  OPPORTUNITY_TYPES_TASK,
  PAGE_SIZE,
  PAGE_SIZE_MINIMUM,
} from "~/lib/constants";
import { currentLanguageAtom } from "~/lib/store";
import { type NextPageWithLayout } from "~/pages/_app";

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
      engagementTypes: null,
      valueContains: null,
      commitmentInterval: null,
      mostViewed: null,
      mostCompleted: null,
      organizations: null,
      zltoReward: null,
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
      engagementTypes: null,
      valueContains: null,
      commitmentInterval: null,
      mostViewed: true,
      mostCompleted: false,
      organizations: null,
      zltoReward: null,
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
      engagementTypes: null,
      valueContains: null,
      commitmentInterval: null,
      mostViewed: null,
      mostCompleted: true,
      organizations: null,
      zltoReward: null,
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
      engagementTypes: null,
      valueContains: null,
      commitmentInterval: null,
      mostViewed: null,
      mostCompleted: false,
      organizations: null,
      zltoReward: null,
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
      engagementTypes: null,
      valueContains: null,
      commitmentInterval: null,
      mostViewed: null,
      mostCompleted: false,
      organizations: null,
      zltoReward: null,
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
      engagementTypes: null,
      valueContains: null,
      commitmentInterval: null,
      mostViewed: null,
      mostCompleted: false,
      organizations: null,
      zltoReward: null,
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
      engagementTypes: null,
      valueContains: null,
      commitmentInterval: null,
      mostViewed: null,
      mostCompleted: false,
      organizations: null,
      zltoReward: null,
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
      engagementTypes: null,
      valueContains: null,
      commitmentInterval: null,
      mostViewed: null,
      mostCompleted: false,
      organizations: null,
      zltoReward: null,
      publishedStates: [PublishedState.Active, PublishedState.NotStarted],
      featured: null,
    },
    context,
  );

  const lookups_categories = await getOpportunityCategories(
    [PublishedState.Active, PublishedState.NotStarted],
    context,
  );
  const lookups_organisations = await getOpportunityOrganizations(
    [PublishedState.Active, PublishedState.NotStarted],
    context,
  );
  const lookups_types = await getOpportunityTypes(context);
  const lookups_engagementTypes = await getEngagementTypes(context);
  const lookups_timeIntervals = await getTimeIntervals(context);

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
      lookups_organisations,
      lookups_types,
      lookups_engagementTypes,
      lookups_timeIntervals,
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
  opportunities_featured: OpportunitySearchResultsInfo;
  opportunities_trending: OpportunitySearchResultsInfo;
  opportunities_mostCompleted: OpportunitySearchResultsInfo;
  opportunities_learning: OpportunitySearchResultsInfo;
  opportunities_tasks: OpportunitySearchResultsInfo;
  opportunities_events: OpportunitySearchResultsInfo;
  opportunities_other: OpportunitySearchResultsInfo;
  opportunities_allOpportunities: OpportunitySearchResultsInfo;
  lookups_categories: OpportunityCategory[];
  lookups_organisations: OrganizationInfo[];
  lookups_types: OpportunityType[];
  lookups_engagementTypes: EngagementType[];
  lookups_timeIntervals: TimeInterval[];
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
  lookups_organisations,
  lookups_types,
  lookups_engagementTypes,
  lookups_timeIntervals,
}) => {
  const router = useRouter();
  const { data: session } = useSession();
  const myRef = useRef<HTMLDivElement>(null);
  const [filterFullWindowVisible, setFilterFullWindowVisible] = useState(false);
  const queryClient = useQueryClient();
  useDisableBodyScroll(filterFullWindowVisible);
  const currentLanguage = useAtomValue(currentLanguageAtom);

  const { data: lookups_countries } = useQuery({
    queryKey: ["opportunities", "countries", session?.user?.id],
    queryFn: async () => {
      const states = [PublishedState.Active, PublishedState.NotStarted];
      if (session !== null) states.push(PublishedState.Expired);

      return await getOpportunityCountries(states);
    },
  });
  const { data: lookups_languages } = useQuery({
    queryKey: [
      "opportunities",
      "languages",
      session?.user?.id,
      currentLanguage,
    ],
    queryFn: async () => {
      const states = [PublishedState.Active, PublishedState.NotStarted];
      if (session !== null) states.push(PublishedState.Expired);

      return await getOpportunityLanguages(states, currentLanguage);
    },
  });
  const lookups_publishedStates: SelectOption[] = [
    { value: "0", label: "Not started" },
    { value: "1", label: "Ongoing" },
    ...(session ? [{ value: "2", label: "Expired / Upload Only" }] : []), // logged in users can see expired
  ];

  //#region filters
  // get filter parameters from route
  const {
    query,
    page,
    categories,
    countries,
    languages,
    types,
    engagementTypes,
    intervalCount,
    intervalType,
    organizations,
    zltoReward,
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
      engagementTypes != undefined ||
      intervalCount != undefined ||
      intervalType != undefined ||
      organizations != undefined ||
      zltoReward != undefined ||
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
    engagementTypes,
    intervalCount,
    intervalType,
    organizations,
    zltoReward,
    mostViewed,
    mostCompleted,
    featured,
    publishedStates,
  ]);

  // search filter state
  // this is the current filter state based on the querystring parameters
  // it contains human-readable values (e.g. category name, country name) instead of id's
  // these values are mapped to the corresponding id's when executing the search query (see below)
  const searchFilter: OpportunitySearchFilter = useMemo(() => {
    let commitmentInterval = null;
    if (intervalCount != undefined && intervalType != undefined) {
      commitmentInterval = {
        options: null,
        interval: {
          count: parseInt(intervalCount.toString()),
          id: intervalType.toString(),
        },
      };
    }

    let zltoReward2 = null;
    if (zltoReward != undefined) {
      zltoReward2 = {
        ranges: null,
        hasReward: Boolean(zltoReward),
      };
    }

    return {
      pageNumber: page ? parseInt(page.toString()) : 1,
      pageSize: PAGE_SIZE,
      valueContains: query ? decodeURIComponent(query.toString()) : null,
      mostViewed: mostViewed ? Boolean(mostViewed) : null,
      mostCompleted: mostCompleted ? Boolean(mostCompleted) : null,
      featured: featured ? Boolean(featured) : null,
      types: types != undefined ? types?.toString().split("|") : null,
      engagementTypes:
        engagementTypes != undefined
          ? engagementTypes?.toString().split("|")
          : null,
      categories:
        categories != undefined ? categories?.toString().split("|") : null,
      countries:
        countries != undefined && countries != null
          ? countries?.toString().split("|")
          : null,
      languages:
        languages != undefined ? languages?.toString().split("|") : null,
      organizations:
        organizations != undefined
          ? organizations?.toString().split("|")
          : null,
      commitmentInterval: commitmentInterval,
      zltoReward: zltoReward2,
      publishedStates:
        publishedStates != undefined
          ? publishedStates?.toString().split("|")
          : null,
    };
  }, [
    page,
    query,
    mostViewed,
    mostCompleted,
    featured,
    types,
    engagementTypes,
    intervalCount,
    intervalType,
    zltoReward,
    categories,
    countries,
    languages,
    organizations,
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
        intervalCount,
        intervalType,
        organizations,
        zltoReward,
        mostViewed,
        mostCompleted,
        featured,
        publishedStates,
      ],
      queryFn: async () => {
        if (searchFilter?.commitmentInterval?.interval?.id) {
          const lookup = lookups_timeIntervals.find(
            (interval) =>
              interval.name === searchFilter.commitmentInterval?.interval?.id,
          );
          if (lookup != undefined)
            searchFilter.commitmentInterval.interval.id = lookup.id;
        }

        return await searchOpportunities({
          pageNumber: searchFilter.pageNumber,
          pageSize: searchFilter.pageSize,
          valueContains: searchFilter.valueContains,
          mostViewed: searchFilter.mostViewed,
          mostCompleted: searchFilter.mostCompleted,
          featured: searchFilter.featured,
          publishedStates:
            publishedStates != undefined
              ? // if set, map to id
                publishedStates
                  ?.toString()
                  .split("|")
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
                  .split("|")
                  .map((x) => {
                    const item = lookups_types.find((y) => y.name === x);
                    return item ? item?.id : "";
                  })
                  .filter((x) => x != "")
              : null,
          engagementTypes:
            engagementTypes != undefined
              ? engagementTypes
                  ?.toString()
                  .split("|")
                  .map((x) => {
                    const item = lookups_engagementTypes.find(
                      (y) => y.name === x,
                    );
                    return item ? item?.id : "";
                  })
                  .filter((x) => x != "")
              : null,
          categories:
            categories != undefined
              ? categories
                  ?.toString()
                  .split("|")
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
                  .split("|")
                  .map((x) => {
                    const item = lookups_countries!.find((y) => y.name === x);
                    return item ? item?.id : "";
                  })
                  .filter((x) => x != "")
              : null,
          languages:
            languages != undefined
              ? languages
                  ?.toString()
                  .split("|")
                  .map((x) => {
                    const item = lookups_languages!.find((y) => y.name === x);
                    return item ? item?.id : "";
                  })
                  .filter((x) => x != "")
              : null,
          organizations:
            organizations != undefined
              ? organizations
                  ?.toString()
                  .split("|")
                  .map((x) => {
                    const item = lookups_organisations.find(
                      (y) => y.name === x,
                    );
                    return item ? item?.id : "";
                  })
                  .filter((x) => x != "")
              : null,
          commitmentInterval: searchFilter.commitmentInterval,
          zltoReward:
            zltoReward != undefined
              ? { ranges: null, hasReward: Boolean(zltoReward) }
              : null,
        });
      },
      enabled:
        isSearchPerformed &&
        lookups_countries !== undefined &&
        lookups_languages !== undefined, // only run query if search is executed and data is available
    });
  //#endregion filters

  //#region functions
  const getSearchFilterAsQueryString = useCallback(
    (searchFilter: OpportunitySearchFilter) => {
      if (!searchFilter) return null;

      // construct querystring parameters from filter
      const params = new URLSearchParams();
      if (
        searchFilter.valueContains !== undefined &&
        searchFilter.valueContains !== null &&
        searchFilter.valueContains.length > 0
      )
        params.append("query", searchFilter.valueContains);

      if (
        searchFilter?.categories?.length !== undefined &&
        searchFilter.categories.length > 0
      )
        params.append("categories", searchFilter.categories.join("|"));

      if (
        searchFilter?.countries?.length !== undefined &&
        searchFilter.countries.length > 0
      )
        params.append("countries", searchFilter.countries.join("|"));

      if (
        searchFilter?.languages?.length !== undefined &&
        searchFilter.languages.length > 0
      )
        params.append("languages", searchFilter.languages.join("|"));

      if (
        searchFilter?.types?.length !== undefined &&
        searchFilter.types.length > 0
      )
        params.append("types", searchFilter.types.join("|"));

      if (
        searchFilter?.engagementTypes?.length !== undefined &&
        searchFilter.engagementTypes.length > 0
      )
        params.append(
          "engagementTypes",
          searchFilter.engagementTypes.join("|"),
        );

      if (
        searchFilter?.commitmentInterval?.interval?.count !== undefined &&
        searchFilter.commitmentInterval.interval.count > 0
      )
        params.append(
          "intervalCount",
          searchFilter.commitmentInterval.interval.count.toString(),
        );

      if (searchFilter?.commitmentInterval?.interval?.id !== undefined)
        params.append(
          "intervalType",
          searchFilter.commitmentInterval.interval.id.toString(),
        );

      if (
        searchFilter?.organizations?.length !== undefined &&
        searchFilter.organizations.length > 0
      )
        params.append("organizations", searchFilter.organizations.join("|"));

      if (searchFilter?.zltoReward?.hasReward)
        params.append("zltoReward", true.toString());

      if (
        searchFilter?.mostViewed !== undefined &&
        searchFilter?.mostViewed !== null
      )
        params.append(
          "mostViewed",
          searchFilter?.mostViewed ? "true" : "false",
        );

      if (
        searchFilter?.mostCompleted !== undefined &&
        searchFilter?.mostCompleted !== null
      )
        params.append(
          "mostCompleted",
          searchFilter?.mostCompleted ? "true" : "false",
        );

      if (
        searchFilter?.featured !== undefined &&
        searchFilter?.featured !== null
      )
        params.append("featured", searchFilter?.featured ? "true" : "false");

      if (
        searchFilter?.publishedStates !== undefined &&
        searchFilter?.publishedStates !== null &&
        searchFilter?.publishedStates.length > 0
      )
        params.append(
          "publishedStates",
          searchFilter?.publishedStates.join("|"),
        );

      if (
        searchFilter.pageNumber !== null &&
        searchFilter.pageNumber !== undefined &&
        searchFilter.pageNumber !== 1
      )
        params.append("page", searchFilter.pageNumber.toString());

      if (params.size === 0) return null;
      return params;
    },
    [],
  );
  const redirectWithSearchFilterParams = useCallback(
    (filter: OpportunitySearchFilter) => {
      let url = "/opportunities";
      const params = getSearchFilterAsQueryString(filter);
      if (params != null && params.size > 0)
        url = `/opportunities?${params.toString()}`;

      if (url != router.asPath)
        void router.push(url, undefined, { scroll: false });
      else setFilterFullWindowVisible(false);
    },
    [router, getSearchFilterAsQueryString, setFilterFullWindowVisible],
  );
  //#endregion functions

  //#region events
  const handlePagerChange = useCallback(
    (value: number) => {
      searchFilter.pageNumber = value;
      redirectWithSearchFilterParams(searchFilter);
    },
    [searchFilter, redirectWithSearchFilterParams],
  );

  const onSearchInputSubmit = useCallback(
    (query: string) => {
      if (query && query.length > 2) {
        // uri encode the search value
        const searchValueEncoded = encodeURIComponent(query);
        query = searchValueEncoded;
      }

      searchFilter.valueContains = query;
      redirectWithSearchFilterParams(searchFilter);
    },
    [searchFilter, redirectWithSearchFilterParams],
  );

  const onCloseFilter = useCallback(() => {
    setFilterFullWindowVisible(false);
  }, [setFilterFullWindowVisible]);

  const onSubmitFilter = useCallback(
    (val: OpportunitySearchFilter) => {
      val.pageNumber = null; // clear paging when changing filters
      redirectWithSearchFilterParams(val);
    },
    [redirectWithSearchFilterParams],
  );

  const onClearFilter = useCallback(() => {
    void router.push("/opportunities", undefined, { scroll: true });
  }, [router]);

  const onClickCategoryFilter = useCallback(
    (cat: OpportunityCategory) => {
      if (!searchFilter) return;

      const prev = { ...searchFilter };
      prev.categories = prev.categories ?? [];

      if (prev.categories.includes(cat.name)) {
        prev.categories = prev.categories.filter((x) => x !== cat.name);
      } else {
        prev.categories.push(cat.name);
      }

      onSubmitFilter(prev);
    },
    [searchFilter, onSubmitFilter],
  );
  //#endregion events

  //#region carousels
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
      if (startRow > (opportunities_trending?.totalCount ?? 0)) {
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
        engagementTypes: null,
        valueContains: null,
        commitmentInterval: null,
        mostViewed: true,
        mostCompleted: null,
        featured: null,
        organizations: null,
        zltoReward: null,
        publishedStates: [PublishedState.Active, PublishedState.NotStarted],
      });
    },
    [opportunities_trending, fetchDataAndUpdateCache],
  );

  const loadDataLearning = useCallback(
    async (startRow: number) => {
      if (startRow > (opportunities_learning?.totalCount ?? 0)) {
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
        engagementTypes: null,
        valueContains: null,
        commitmentInterval: null,
        mostViewed: null,
        mostCompleted: null,
        featured: null,
        organizations: null,
        zltoReward: null,
        publishedStates: [PublishedState.Active, PublishedState.NotStarted],
      });
    },
    [opportunities_learning, fetchDataAndUpdateCache],
  );

  const loadDataTasks = useCallback(
    async (startRow: number) => {
      if (startRow > (opportunities_tasks?.totalCount ?? 0)) {
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
        engagementTypes: null,
        valueContains: null,
        commitmentInterval: null,
        mostViewed: null,
        mostCompleted: null,
        featured: null,
        organizations: null,
        zltoReward: null,
        publishedStates: [PublishedState.Active, PublishedState.NotStarted],
      });
    },
    [opportunities_tasks, fetchDataAndUpdateCache],
  );

  const loadDataEvents = useCallback(
    async (startRow: number) => {
      if (startRow > (opportunities_events?.totalCount ?? 0)) {
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
        engagementTypes: null,
        valueContains: null,
        commitmentInterval: null,
        mostViewed: null,
        mostCompleted: null,
        featured: null,
        organizations: null,
        zltoReward: null,
        publishedStates: [PublishedState.Active, PublishedState.NotStarted],
      });
    },
    [opportunities_events, fetchDataAndUpdateCache],
  );

  const loadDataOther = useCallback(
    async (startRow: number) => {
      if (startRow > (opportunities_other?.totalCount ?? 0)) {
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
        engagementTypes: null,
        valueContains: null,
        commitmentInterval: null,
        mostViewed: null,
        mostCompleted: null,
        featured: null,
        organizations: null,
        zltoReward: null,
        publishedStates: [PublishedState.Active, PublishedState.NotStarted],
      });
    },
    [opportunities_other, fetchDataAndUpdateCache],
  );

  const loadDataOpportunities = useCallback(
    async (startRow: number) => {
      if (startRow > (opportunities_allOpportunities?.totalCount ?? 0)) {
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
          engagementTypes: null,
          valueContains: null,
          commitmentInterval: null,
          mostViewed: null,
          mostCompleted: null,
          featured: null,
          organizations: null,
          zltoReward: null,
          publishedStates: [PublishedState.Active, PublishedState.NotStarted],
        },
      );
    },
    [opportunities_allOpportunities, fetchDataAndUpdateCache],
  );

  const loadDataMostCompleted = useCallback(
    async (startRow: number) => {
      if (startRow > (opportunities_mostCompleted?.totalCount ?? 0)) {
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
        engagementTypes: null,
        valueContains: null,
        commitmentInterval: null,
        mostViewed: null,
        mostCompleted: true,
        featured: null,
        organizations: null,
        zltoReward: null,
        publishedStates: [PublishedState.Active, PublishedState.NotStarted],
      });
    },
    [opportunities_mostCompleted, fetchDataAndUpdateCache],
  );

  const loadDataFeatured = useCallback(
    async (startRow: number) => {
      if (startRow > (opportunities_featured?.totalCount ?? 0)) {
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
        engagementTypes: null,
        valueContains: null,
        commitmentInterval: null,
        mostViewed: null,
        mostCompleted: null,
        featured: true,
        organizations: null,
        zltoReward: null,
        publishedStates: [PublishedState.Active, PublishedState.NotStarted],
      });
    },
    [opportunities_featured, fetchDataAndUpdateCache],
  );
  //#endregion carousels

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
        className={`fixed bottom-0 left-0 right-0 top-0 flex-grow overflow-hidden bg-white animate-in fade-in md:m-auto md:max-h-[600px] md:w-[800px] md:rounded-3xl`}
        portalClassName={"fixed z-40"}
        overlayClassName="fixed inset-0 bg-overlay"
      >
        {lookups_countries != undefined && lookups_languages != undefined && (
          <OpportunityFilterVertical
            searchFilter={searchFilter}
            lookups_countries={lookups_countries}
            lookups_languages={lookups_languages}
            lookups_types={lookups_types}
            lookups_engagementTypes={lookups_engagementTypes}
            lookups_organisations={lookups_organisations}
            lookups_timeIntervals={lookups_timeIntervals}
            lookups_publishedStates={lookups_publishedStates}
            submitButtonText="Apply Filters"
            onCancel={onCloseFilter}
            onSubmit={(e) => onSubmitFilter(e)}
            onClear={onClearFilter}
            clearButtonText="Clear All Filters"
            session={session}
          />
        )}
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

        {/* FILTER: CATEGORIES */}
        <OpportunityCategoriesHorizontalFilter
          lookups_categories={lookups_categories}
          selected_categories={searchFilter?.categories}
          onClick={onClickCategoryFilter}
        />

        {/* FILTER: BADGES */}
        <FilterBadges
          searchFilter={searchFilter}
          excludeKeys={["pageNumber", "pageSize"]}
          resolveValue={(key, value) => {
            if (key === "commitmentInterval") {
              const lookup = lookups_timeIntervals.find(
                (interval) => interval.id === value.interval.id,
              );
              return `${value.interval.count} ${
                value.interval.count > 1 ? lookup?.name + "s" : lookup?.name
              }`;
            } else if (key === "zltoReward") {
              return "ZLTO Reward";
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
          <div className="mt-4 gap-6 px-2 pb-4 md:p-0 md:pb-0">
            {/* FEATURED */}
            {(opportunities_featured?.totalCount ?? 0) > 0 && (
              <OpportunitiesCarousel
                id={`opportunities_featured`}
                title="Featured 🌟"
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
                title="Most completed 🏆"
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
                title="All Opportunities 🌍"
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
                    currentPage={page ? parseInt(page.toString()) : 1}
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
