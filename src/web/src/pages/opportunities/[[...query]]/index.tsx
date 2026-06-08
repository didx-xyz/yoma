import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAtomValue } from "jotai";
import type { GetStaticPaths, GetStaticProps } from "next";
import { useSession } from "next-auth/react";
import Head from "next/head";
import { IoBriefcase } from "react-icons/io5";
import { useRouter } from "next/router";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactElement,
} from "react";
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
import CustomCarouselV3 from "~/components/Carousel/CustomCarouselV3";
import CustomModal from "~/components/Common/CustomModal";
import FilterBadges from "~/components/FilterBadges";
import MainLayout from "~/components/Layout/Main";
import NoRowsMessage from "~/components/NoRowsMessage";
import AnimatedText from "~/components/Opportunity/AnimatedText";
import FilterTab from "~/components/Opportunity/FilterTab";
import { OpportunitiesGrid } from "~/components/Opportunity/OpportunitiesGrid";
import OpportunityCategoriesHorizontalFilter from "~/components/Opportunity/OpportunityCategoriesHorizontalFilter";
import { OpportunityFilterVertical } from "~/components/Opportunity/OpportunityFilterVertical";
import { OpportunityPublicSmallComponentV2 } from "~/components/Opportunity/OpportunityPublicSmallV2";
import { OppSearchInputLarge } from "~/components/Opportunity/OppSearchInputLarge";
import { PageBackground } from "~/components/PageBackground";
import { PaginationButtons } from "~/components/PaginationButtons";
import { LoadingSkeleton } from "~/components/Status/LoadingSkeleton";
import {
  COUNTRY_CODE_WW,
  OPPORTUNITY_TYPE_ID_EVENT,
  OPPORTUNITY_TYPE_ID_LEARNING,
  OPPORTUNITY_TYPE_ID_OTHER,
  OPPORTUNITY_TYPE_ID_MICROTASK,
  PAGE_SIZE,
  PAGE_SIZE_MINIMUM,
  OPPORTUNITY_TYPE_ID_JOB,
} from "~/lib/constants";
import { currentLanguageAtom, userProfileAtom } from "~/lib/store";
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
      types: [OPPORTUNITY_TYPE_ID_LEARNING],
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
      types: [OPPORTUNITY_TYPE_ID_MICROTASK],
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
      types: [OPPORTUNITY_TYPE_ID_EVENT],
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
      types: [OPPORTUNITY_TYPE_ID_OTHER],
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

  const opportunities_jobs = await searchOpportunities(
    {
      pageNumber: 1,
      pageSize: PAGE_SIZE_MINIMUM,
      categories: null,
      countries: null,
      languages: null,
      types: [OPPORTUNITY_TYPE_ID_JOB],
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
      opportunities_jobs,
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
  opportunities_jobs: OpportunitySearchResultsInfo;
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
  opportunities_jobs,
  opportunities_allOpportunities,
  lookups_categories,
  lookups_organisations,
  lookups_types,
  lookups_engagementTypes,
  lookups_timeIntervals,
}) => {
  const router = useRouter();
  const { status: sessionStatus } = useSession();
  const userProfile = useAtomValue(userProfileAtom);
  const myRef = useRef<HTMLDivElement>(null);
  const [filterFullWindowVisible, setFilterFullWindowVisible] = useState(false);
  const [isRouteTransitioning, setIsRouteTransitioning] = useState(false);
  const [isRouteTransitioningToSearch, setIsRouteTransitioningToSearch] =
    useState(false);
  const queryClient = useQueryClient();
  const currentLanguage = useAtomValue(currentLanguageAtom);

  // next-auth may briefly report `unauthenticated` during initial hydration even when
  // a session cookie exists. For landing-page rendering we treat a session cookie as
  // "auth likely" so we can avoid flashing SSG (unscoped) carousels.
  const hasAuthCookie = useMemo(() => {
    if (typeof document === "undefined") return false;
    return /(?:^|; )(__Secure-)?next-auth\.session-token=/.test(
      document.cookie,
    );
  }, []);

  useEffect(() => {
    const isSearchUrl = (url: string) => {
      return /[?&](?:query|page|categories|countries|countryScope|languages|types|engagementTypes|intervalCount|intervalType|organizations|zltoReward|mostViewed|mostCompleted|featured|publishedStates)=/.test(
        url,
      );
    };

    const onStart = (url: string) => {
      setIsRouteTransitioning(true);
      setIsRouteTransitioningToSearch(isSearchUrl(url));
    };
    const onDone = () => {
      setIsRouteTransitioning(false);
      setIsRouteTransitioningToSearch(false);
    };

    router.events.on("routeChangeStart", onStart);
    router.events.on("routeChangeComplete", onDone);
    router.events.on("routeChangeError", onDone);

    return () => {
      router.events.off("routeChangeStart", onStart);
      router.events.off("routeChangeComplete", onDone);
      router.events.off("routeChangeError", onDone);
    };
  }, [router.events]);

  const oppTypeDescriptions = [
    "A learning opportunity is a self-paced online course that you can finish at your convenience.",
    "Explore events to attend",
    "Contribute to real-world projects with micro-tasks",
  ];

  //#region QUERIES
  const { data: lookups_countries, isLoading: isLoading_lookups_countries } =
    useQuery({
      queryKey: ["opportunities", "countries", userProfile?.id],
      queryFn: async () => {
        const states = [PublishedState.Active, PublishedState.NotStarted];
        if (userProfile !== null) states.push(PublishedState.Expired);

        return await getOpportunityCountries(states);
      },
    });
  const { data: lookups_languages } = useQuery({
    queryKey: ["opportunities", "languages", userProfile?.id, currentLanguage],
    queryFn: async () => {
      const states = [PublishedState.Active, PublishedState.NotStarted];
      return await getOpportunityLanguages(states, currentLanguage);
    },
  });
  const lookups_publishedStates: SelectOption[] = [
    { value: "0", label: "Not started" },
    { value: "1", label: "Ongoing" },
    ...(userProfile ? [{ value: "2", label: "Expired / Upload Only" }] : []), // logged in users can see expired
  ];

  // this checks if the logged-in user has a country and gets the country info for display
  const userCountryInfo = useMemo(() => {
    // Only for logged-in users
    if (!userProfile?.countryId || !lookups_countries) {
      return null;
    }

    // Find the country in the lookups
    const country = lookups_countries.find(
      (c) => c.id.toLowerCase() === userProfile.countryId!.toLowerCase(),
    );

    return country ? { id: userProfile.countryId, name: country.name } : null;
  }, [userProfile?.countryId, lookups_countries]);

  // Landing-only country scope (does NOT affect querystring / isSearchPerformed)
  const [landingMyCountryOnly, setLandingMyCountryOnly] = useState(false);
  const [landingCountryScopeInitialized, setLandingCountryScopeInitialized] =
    useState(false);

  const worldwideCountryInfo = useMemo(() => {
    if (!lookups_countries) return null;
    const worldwide = lookups_countries.find(
      (c) => c.codeAlpha2 === COUNTRY_CODE_WW,
    );
    return worldwide ? { id: worldwide.id, name: worldwide.name } : null;
  }, [lookups_countries]);

  // Default authenticated users to "My country" ON once country lookup is known
  useEffect(() => {
    if (landingCountryScopeInitialized) return;

    if (sessionStatus === "unauthenticated") {
      // If a session cookie exists, treat auth state as unresolved and wait.
      if (!hasAuthCookie) {
        setLandingMyCountryOnly(false);
        setLandingCountryScopeInitialized(true);
      }
      return;
    }

    if (sessionStatus === "authenticated" && lookups_countries) {
      const countryScopeParamRaw = router.query.countryScope;
      const countryScopeParam = Array.isArray(countryScopeParamRaw)
        ? countryScopeParamRaw[0]
        : countryScopeParamRaw;

      if (countryScopeParam === "my") {
        setLandingMyCountryOnly(true);
        setLandingCountryScopeInitialized(true);
        return;
      }

      if (countryScopeParam === "all") {
        setLandingMyCountryOnly(false);
        setLandingCountryScopeInitialized(true);
        return;
      }

      const countriesParamRaw = router.query.countries;
      const countriesParam = Array.isArray(countriesParamRaw)
        ? countriesParamRaw[0]
        : countriesParamRaw;

      if (countriesParam && userCountryInfo?.name) {
        const countriesList = countriesParam
          .split("|")
          .map((x) => x.trim())
          .filter(Boolean);
        if (countriesList.includes(userCountryInfo.name)) {
          setLandingMyCountryOnly(true);
          setLandingCountryScopeInitialized(true);
          return;
        }
      }

      // Default: authenticated users start with toggle ON
      setLandingMyCountryOnly(true);
      setLandingCountryScopeInitialized(true);
    }
  }, [
    hasAuthCookie,
    landingCountryScopeInitialized,
    lookups_countries,
    router.query.countries,
    router.query.countryScope,
    sessionStatus,
    userCountryInfo?.id,
    userCountryInfo?.name,
  ]);

  // Used only to prevent unnecessary landing carousel refetches when search mode is active
  const isSearchPerformedForLanding = useMemo<boolean>(() => {
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
  }, [router.query]);

  const countryScopeParam = useMemo<"my" | "all" | null>(() => {
    const raw = router.query.countryScope;
    const value = Array.isArray(raw) ? raw[0] : raw;
    if (value === "my") return "my";
    if (value === "all") return "all";
    return null;
  }, [router.query.countryScope]);

  const {
    data: opportunities_user_country,
    isLoading: isLoading_opportunities_user_country,
  } = useQuery({
    queryKey: ["opportunities", "user_country", userProfile?.countryId],
    queryFn: async () => {
      if (!userCountryInfo?.id) return null;

      return await searchOpportunities({
        pageNumber: 1,
        pageSize: PAGE_SIZE_MINIMUM,
        categories: null,
        countries: [userCountryInfo.id],
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
      });
    },
    enabled:
      sessionStatus === "authenticated" &&
      landingMyCountryOnly &&
      !!userCountryInfo?.id &&
      !isSearchPerformedForLanding,
  });

  const landingCountryIds = useMemo<string[] | null>(() => {
    if (sessionStatus !== "authenticated") return null;
    if (!landingMyCountryOnly) return null;
    if (!userCountryInfo?.id) return null;
    if (isSearchPerformedForLanding) return null;
    const ids = [userCountryInfo.id, worldwideCountryInfo?.id].filter(
      (x): x is string => !!x,
    );
    return Array.from(new Set(ids));
  }, [
    isSearchPerformedForLanding,
    landingMyCountryOnly,
    sessionStatus,
    userCountryInfo?.id,
    worldwideCountryInfo?.id,
  ]);

  const landingCountryEnabled =
    sessionStatus === "authenticated" && (landingCountryIds?.length ?? 0) > 0;

  const landingCacheKey = landingCountryIds?.join("|") ?? COUNTRY_CODE_WW;

  // Landing page carousel datasets (page 1) for "My country" scope
  const {
    data: opportunities_featured_country,
    isLoading: isLoading_featured,
  } = useQuery<OpportunitySearchResultsInfo>({
    queryKey: ["opportunities", "landing", "featured", landingCacheKey],
    queryFn: async () =>
      await searchOpportunities({
        pageNumber: 1,
        pageSize: PAGE_SIZE_MINIMUM,
        categories: null,
        countries: landingCountryIds,
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
      }),
    enabled: landingCountryEnabled,
  });

  const {
    data: opportunities_allOpportunities_country,
    isLoading: isLoading_allOpportunities,
  } = useQuery<OpportunitySearchResultsInfo>({
    queryKey: ["opportunities", "landing", "allOpportunities", landingCacheKey],
    queryFn: async () =>
      await searchOpportunities({
        pageNumber: 1,
        pageSize: PAGE_SIZE_MINIMUM,
        categories: null,
        countries: landingCountryIds,
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
      }),
    enabled: landingCountryEnabled,
  });

  const {
    data: opportunities_trending_country,
    isLoading: isLoading_trending,
  } = useQuery<OpportunitySearchResultsInfo>({
    queryKey: ["opportunities", "landing", "trending", landingCacheKey],
    queryFn: async () =>
      await searchOpportunities({
        pageNumber: 1,
        pageSize: PAGE_SIZE_MINIMUM,
        categories: null,
        countries: landingCountryIds,
        languages: null,
        types: null,
        engagementTypes: null,
        valueContains: null,
        commitmentInterval: null,
        mostViewed: true,
        mostCompleted: false,
        featured: null,
        organizations: null,
        zltoReward: null,
        publishedStates: [PublishedState.Active, PublishedState.NotStarted],
      }),
    enabled: landingCountryEnabled,
  });

  const {
    data: opportunities_mostCompleted_country,
    isLoading: isLoading_mostCompleted,
  } = useQuery<OpportunitySearchResultsInfo>({
    queryKey: ["opportunities", "landing", "mostCompleted", landingCacheKey],
    queryFn: async () =>
      await searchOpportunities({
        pageNumber: 1,
        pageSize: PAGE_SIZE_MINIMUM,
        categories: null,
        countries: landingCountryIds,
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
      }),
    enabled: landingCountryEnabled,
  });

  const {
    data: opportunities_learning_country,
    isLoading: isLoading_learning,
  } = useQuery<OpportunitySearchResultsInfo>({
    queryKey: ["opportunities", "landing", "learning", landingCacheKey],
    queryFn: async () =>
      await searchOpportunities({
        pageNumber: 1,
        pageSize: PAGE_SIZE_MINIMUM,
        categories: null,
        countries: landingCountryIds,
        languages: null,
        types: [OPPORTUNITY_TYPE_ID_LEARNING],
        engagementTypes: null,
        valueContains: null,
        commitmentInterval: null,
        mostViewed: null,
        mostCompleted: null,
        featured: null,
        organizations: null,
        zltoReward: null,
        publishedStates: [PublishedState.Active, PublishedState.NotStarted],
      }),
    enabled: landingCountryEnabled,
  });

  const { data: opportunities_tasks_country, isLoading: isLoading_tasks } =
    useQuery<OpportunitySearchResultsInfo>({
      queryKey: ["opportunities", "landing", "tasks", landingCacheKey],
      queryFn: async () =>
        await searchOpportunities({
          pageNumber: 1,
          pageSize: PAGE_SIZE_MINIMUM,
          categories: null,
          countries: landingCountryIds,
          languages: null,
          types: [OPPORTUNITY_TYPE_ID_MICROTASK],
          engagementTypes: null,
          valueContains: null,
          commitmentInterval: null,
          mostViewed: null,
          mostCompleted: null,
          featured: null,
          organizations: null,
          zltoReward: null,
          publishedStates: [PublishedState.Active, PublishedState.NotStarted],
        }),
      enabled: landingCountryEnabled,
    });

  const { data: opportunities_events_country, isLoading: isLoading_events } =
    useQuery<OpportunitySearchResultsInfo>({
      queryKey: ["opportunities", "landing", "events", landingCacheKey],
      queryFn: async () =>
        await searchOpportunities({
          pageNumber: 1,
          pageSize: PAGE_SIZE_MINIMUM,
          categories: null,
          countries: landingCountryIds,
          languages: null,
          types: [OPPORTUNITY_TYPE_ID_EVENT],
          engagementTypes: null,
          valueContains: null,
          commitmentInterval: null,
          mostViewed: null,
          mostCompleted: null,
          featured: null,
          organizations: null,
          zltoReward: null,
          publishedStates: [PublishedState.Active, PublishedState.NotStarted],
        }),
      enabled: landingCountryEnabled,
    });

  const { data: opportunities_other_country, isLoading: isLoading_other } =
    useQuery<OpportunitySearchResultsInfo>({
      queryKey: ["opportunities", "landing", "other", landingCacheKey],
      queryFn: async () =>
        await searchOpportunities({
          pageNumber: 1,
          pageSize: PAGE_SIZE_MINIMUM,
          categories: null,
          countries: landingCountryIds,
          languages: null,
          types: [OPPORTUNITY_TYPE_ID_OTHER],
          engagementTypes: null,
          valueContains: null,
          commitmentInterval: null,
          mostViewed: null,
          mostCompleted: null,
          featured: null,
          organizations: null,
          zltoReward: null,
          publishedStates: [PublishedState.Active, PublishedState.NotStarted],
        }),
      enabled: landingCountryEnabled,
    });

  const { data: opportunities_jobs_country, isLoading: isLoading_jobs } =
    useQuery<OpportunitySearchResultsInfo>({
      queryKey: ["opportunities", "landing", "jobs", landingCacheKey],
      queryFn: async () =>
        await searchOpportunities({
          pageNumber: 1,
          pageSize: PAGE_SIZE_MINIMUM,
          categories: null,
          countries: landingCountryIds,
          languages: null,
          types: [OPPORTUNITY_TYPE_ID_JOB],
          engagementTypes: null,
          valueContains: null,
          commitmentInterval: null,
          mostViewed: null,
          mostCompleted: null,
          featured: null,
          organizations: null,
          zltoReward: null,
          publishedStates: [PublishedState.Active, PublishedState.NotStarted],
        }),
      enabled: landingCountryEnabled,
    });

  const landingCountryLoading =
    landingCountryEnabled &&
    (isLoading_opportunities_user_country ||
      isLoading_featured ||
      isLoading_allOpportunities ||
      isLoading_trending ||
      isLoading_mostCompleted ||
      isLoading_learning ||
      isLoading_tasks ||
      isLoading_events ||
      isLoading_other ||
      isLoading_jobs);

  const landingPersonalizationPending =
    sessionStatus === "authenticated" &&
    landingMyCountryOnly &&
    !!userProfile?.countryId &&
    !isSearchPerformedForLanding &&
    (isLoading_lookups_countries ||
      (userCountryInfo?.id ? landingCountryLoading : false));

  // Landing overlay rules:
  // - Authenticated users default to "My country" ON, so they should never see SSG (unfiltered) carousels.
  // - Show skeleton immediately, then reveal personalized carousels once country scope is initialized and data is ready.
  const landingAuthLikely =
    sessionStatus === "authenticated" ||
    (sessionStatus !== "unauthenticated" && hasAuthCookie) ||
    (sessionStatus === "unauthenticated" && hasAuthCookie);

  const landingWantsMyCountry =
    landingAuthLikely &&
    !isSearchPerformedForLanding &&
    countryScopeParam !== "all";

  const landingOverlayActive =
    !isSearchPerformedForLanding &&
    (sessionStatus === "loading" ||
      (isRouteTransitioning && !isRouteTransitioningToSearch) ||
      (landingWantsMyCountry &&
        (!landingCountryScopeInitialized ||
          landingPersonalizationPending ||
          // If we don't have the profile yet, keep skeletons up rather than showing SSG.
          (!userProfile?.id && hasAuthCookie))));
  //#endregion QUERIES

  //#region FILTERS
  // get filter parameters from querystring
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
      valueContains:
        query && query.length > 2 ? decodeURIComponent(query.toString()) : null,
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

  const filterBadgeExcludeKeys = useMemo(() => ["pageNumber", "pageSize"], []);

  const appliedFilterBadgeCount = useMemo(() => {
    if (!searchFilter) return 0;

    return Object.entries(searchFilter)
      .filter(([key, value]) => !filterBadgeExcludeKeys.includes(key) && value)
      .reduce((count, [, value]) => {
        if (Array.isArray(value)) return count + value.length;
        return count + 1;
      }, 0);
  }, [searchFilter, filterBadgeExcludeKeys]);

  const filtersPanelTitle = useMemo(() => {
    if (appliedFilterBadgeCount > 0)
      return `Filters (${appliedFilterBadgeCount})`;

    return sessionStatus === "authenticated"
      ? "Filters & country 🌍"
      : "Filters 🔎";
  }, [appliedFilterBadgeCount, sessionStatus]);

  const selectedCountryNamesFromQuery = useMemo(() => {
    if (countries === undefined || countries === null) return [];
    const value = Array.isArray(countries) ? countries[0] : countries;
    if (!value) return [];
    return value
      .toString()
      .split("|")
      .map((x) => x.trim())
      .filter(Boolean);
  }, [countries]);

  const hasExplicitCountriesQuery = useMemo(() => {
    if (countries === undefined || countries === null) return false;
    const value = Array.isArray(countries) ? countries[0] : countries;
    return !!value && value.toString().trim().length > 0;
  }, [countries]);

  const wantsMyScopeForSearch = useMemo(() => {
    if (sessionStatus !== "authenticated") return false;
    if (hasExplicitCountriesQuery) return false;
    if (countryScopeParam === "all") return false;
    return (
      countryScopeParam === "my" ||
      (countryScopeParam === null && landingMyCountryOnly)
    );
  }, [
    countryScopeParam,
    hasExplicitCountriesQuery,
    landingMyCountryOnly,
    sessionStatus,
  ]);

  const filtersPanelScopeText = useMemo(() => {
    if (hasExplicitCountriesQuery) {
      const names = selectedCountryNamesFromQuery;
      if (names.length === 0) return "selected countries";

      const maxShown = 2;
      const shown = names.slice(0, maxShown);
      const remaining = names.length - shown.length;
      const list = `${shown.join(", ")}${remaining > 0 ? ` +${remaining}` : ""}`;

      return `${names.length === 1 ? "selected country" : "selected countries"} (${list})`;
    }

    if (sessionStatus === "authenticated" && wantsMyScopeForSearch) {
      return userCountryInfo?.name
        ? `your country (${userCountryInfo.name} & worldwide)`
        : "your country & worldwide";
    }

    return "all countries";
  }, [
    hasExplicitCountriesQuery,
    selectedCountryNamesFromQuery,
    sessionStatus,
    userCountryInfo?.name,
    wantsMyScopeForSearch,
  ]);

  // Only block the search while lookups/profile are genuinely still in-flight.
  // If they have settled and the user's country simply isn't in the list,
  // treat it as resolved (country = null → worldwide fallback).
  const isSearchScopePending =
    wantsMyScopeForSearch &&
    !userCountryInfo?.id &&
    (isLoading_lookups_countries || (!userProfile?.id && hasAuthCookie));

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
        landingMyCountryOnly,
        countryScopeParam,
        sessionStatus,
        userCountryInfo?.id,
        worldwideCountryInfo?.id,
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

        const countriesIdsFromQuery =
          countries != undefined
            ? countries
                ?.toString()
                .split("|")
                .map((x) => {
                  const item = lookups_countries!.find((y) => y.name === x);
                  return item ? item?.id : "";
                })
                .filter((x) => x != "")
            : null;

        const shouldApplyMyScope =
          countriesIdsFromQuery === null &&
          // Explicit override to "all"
          countryScopeParam !== "all" &&
          // "my" via param, or default authenticated toggle state
          (countryScopeParam === "my" ||
            (countryScopeParam === null &&
              sessionStatus === "authenticated" &&
              landingMyCountryOnly));

        // When "my country" scope is active, include the user's country + worldwide.
        // If the user's country is not found in lookups, fall back to worldwide only
        // so at least WW-scoped opportunities are returned rather than no filter at all.
        const countriesFromScope = shouldApplyMyScope
          ? (() => {
              const ids = [
                userCountryInfo?.id,
                worldwideCountryInfo?.id,
              ].filter((x): x is string => !!x);
              return ids.length > 0 ? Array.from(new Set(ids)) : null;
            })()
          : null;

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
                  ...(userProfile ? [PublishedState.Expired] : []),
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
          countries: countriesIdsFromQuery ?? countriesFromScope,
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
        lookups_languages !== undefined &&
        sessionStatus !== "loading" && // avoid fetching before we know if we should apply countryScope
        !isSearchScopePending,
    });
  //#endregion FILTERS

  //#region FUNCTIONS
  const getSearchFilterAsQueryString = useCallback(
    (searchFilter: OpportunitySearchFilter) => {
      if (!searchFilter) return null;

      // construct querystring parameters from filter
      const params = new URLSearchParams();
      if (
        searchFilter.valueContains !== undefined &&
        searchFilter.valueContains !== null &&
        searchFilter.valueContains.length > 2
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
    (filter: OpportunitySearchFilter, myCountryOnlyOverride?: boolean) => {
      let url = "/opportunities";
      const params = getSearchFilterAsQueryString(filter);

      const urlParams = params ?? new URLSearchParams();

      const myCountryOnly =
        typeof myCountryOnlyOverride === "boolean"
          ? myCountryOnlyOverride
          : landingMyCountryOnly;

      // Preserve toggle state in the URL without clashing with explicit countries filters
      if (sessionStatus === "authenticated") {
        // If "My country" is active, it must override/clear any explicit country selections.
        // This prevents stale `countries=...` from persisting in the querystring.
        if (myCountryOnly) {
          urlParams.delete("countries");
          urlParams.set("countryScope", "my");
        } else {
          const hasExplicitCountries =
            filter?.countries?.length !== undefined &&
            filter.countries.length > 0;

          if (hasExplicitCountries) {
            urlParams.set("countryScope", "all");
          } else {
            urlParams.set("countryScope", "all");
          }
        }
      } else {
        urlParams.delete("countryScope");
      }

      if (urlParams.size > 0) url = `/opportunities?${urlParams.toString()}`;

      if (url != router.asPath)
        void router.replace(url, undefined, { shallow: true, scroll: false });

      // Always close the filter modal after applying.
      setFilterFullWindowVisible(false);
    },
    [
      getSearchFilterAsQueryString,
      landingMyCountryOnly,
      router,
      sessionStatus,
      setFilterFullWindowVisible,
    ],
  );
  //#endregion FUNCTIONS

  //#region EVENTS
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
    (val: OpportunitySearchFilter, myCountryOnlyOverride?: boolean) => {
      val.pageNumber = null; // clear paging when changing filters
      redirectWithSearchFilterParams(val, myCountryOnlyOverride);
    },
    [redirectWithSearchFilterParams],
  );

  const onClearFilter = useCallback(() => {
    setFilterFullWindowVisible(false);
    void router.replace("/opportunities", undefined, {
      shallow: true,
      scroll: true,
    });
  }, [router, setFilterFullWindowVisible]);

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
  //#endregion EVENTS

  //#region CAROUSELS
  const EMPTY_RESULTS: OpportunitySearchResultsInfo = useMemo(
    () => ({ items: [], totalCount: 0 }),
    [],
  );

  const opportunities_featured_landing = landingCountryEnabled
    ? (opportunities_featured_country ?? EMPTY_RESULTS)
    : opportunities_featured;

  const opportunities_allOpportunities_landing = landingCountryEnabled
    ? (opportunities_allOpportunities_country ?? EMPTY_RESULTS)
    : opportunities_allOpportunities;

  const opportunities_trending_landing = landingCountryEnabled
    ? (opportunities_trending_country ?? EMPTY_RESULTS)
    : opportunities_trending;

  const opportunities_mostCompleted_landing = landingCountryEnabled
    ? (opportunities_mostCompleted_country ?? EMPTY_RESULTS)
    : opportunities_mostCompleted;

  const opportunities_learning_landing = landingCountryEnabled
    ? (opportunities_learning_country ?? EMPTY_RESULTS)
    : opportunities_learning;

  const opportunities_tasks_landing = landingCountryEnabled
    ? (opportunities_tasks_country ?? EMPTY_RESULTS)
    : opportunities_tasks;

  const opportunities_events_landing = landingCountryEnabled
    ? (opportunities_events_country ?? EMPTY_RESULTS)
    : opportunities_events;

  const opportunities_other_landing = landingCountryEnabled
    ? (opportunities_other_country ?? EMPTY_RESULTS)
    : opportunities_other;

  const opportunities_jobs_landing = landingCountryEnabled
    ? (opportunities_jobs_country ?? EMPTY_RESULTS)
    : opportunities_jobs;

  const opportunities_featured_render = landingOverlayActive
    ? opportunities_featured
    : opportunities_featured_landing;

  const opportunities_allOpportunities_render = landingOverlayActive
    ? opportunities_allOpportunities
    : opportunities_allOpportunities_landing;

  const opportunities_trending_render = landingOverlayActive
    ? opportunities_trending
    : opportunities_trending_landing;

  const opportunities_mostCompleted_render = landingOverlayActive
    ? opportunities_mostCompleted
    : opportunities_mostCompleted_landing;

  const opportunities_learning_render = landingOverlayActive
    ? opportunities_learning
    : opportunities_learning_landing;

  const opportunities_tasks_render = landingOverlayActive
    ? opportunities_tasks
    : opportunities_tasks_landing;

  const opportunities_events_render = landingOverlayActive
    ? opportunities_events
    : opportunities_events_landing;

  const opportunities_other_render = landingOverlayActive
    ? opportunities_other
    : opportunities_other_landing;

  const opportunities_jobs_render = landingOverlayActive
    ? opportunities_jobs
    : opportunities_jobs_landing;

  // const opportunities_jobs_render = {
  //   items: [
  //     {
  //       id: "019e6e70-6ef8-7e32-a432-b3971259b94e",
  //       title: "WordPress Developer in Enugu",
  //       description: "We are seeking a WordPress developer to join us.",
  //       type: "Job",
  //       organizationId: "01999548-ca82-7487-968f-6950ec4bed5c",
  //       organizationName: "Jobberman Nigeria",
  //       organizationLogoURL:
  //         "https://yoma-v3-public-storage.s3.eu-west-1.amazonaws.com/production/photos/15c04ce1-f50d-488d-97b4-5a5bda1ce80d.png",
  //       summary: "WordPress Developer in Enugu",
  //       instructions: null,
  //       url: "https://www.jobberman.com/listings/wordpress-developer-wrp4em?utm_campaign=Job_Listing_Yoma_ng&utm_medium=affiliate&utm_source=Yoma&utm_term=cde-jobberman-nigeria-and-yoma-5224",
  //       zltoReward: null,
  //       zltoRewardEstimate: null,
  //       zltoRewardCumulative: null,
  //       yomaReward: null,
  //       yomaRewardEstimate: null,
  //       yomaRewardCumulative: null,
  //       verificationEnabled: false,
  //       verificationMethod: null,
  //       difficulty: null,
  //       commitmentInterval: null,
  //       commitmentIntervalCount: null,
  //       commitmentIntervalDescription: null,
  //       participantLimit: null,
  //       participantCountCompleted: 0,
  //       participantCountPending: 0,
  //       participantCountTotal: 0,
  //       participantLimitReached: false,
  //       countViewed: 0,
  //       countNavigatedExternalLink: 0,
  //       statusId: "b99d26d7-a4b0-4a38-b35d-ae2d379a414e",
  //       status: "Active",
  //       keywords: ["Full Time", "Job", "Other"],
  //       dateStart: "2026-05-28T00:00:00+00:00",
  //       dateEnd: null,
  //       featured: false,
  //       engagementType: null,
  //       shareWithPartners: false,
  //       hidden: false,
  //       published: true,
  //       yomaInfoURL:
  //         "https://yoma.world/opportunities/019e6e70-6ef8-7e32-a432-b3971259b94e",
  //       isCompletable: false,
  //       nonCompletableReason:
  //         "Opportunity 'WordPress Developer in Enugu' cannot be completed because verification is not enabled, 'Manual' verification is required",
  //       syncedInfo: {
  //         syncType: "Pull",
  //         locked: true,
  //         partners: [
  //           {
  //             partner: "Jobberman",
  //             entityType: "Opportunity",
  //             externalId: "NG:1222606",
  //             url: "https://www.jobberman.com/listings/wordpress-developer-wrp4em?utm_campaign=Job_Listing_Yoma_ng&utm_medium=affiliate&utm_source=Yoma&utm_term=cde-jobberman-nigeria-and-yoma-5224",
  //           },
  //         ],
  //       },
  //       categories: [
  //         {
  //           id: "b89c5e91-9cbb-4a0e-991f-f987eebf9b70",
  //           name: "Other",
  //           imageURL:
  //             "https://yoma-v3-public-storage.s3.eu-west-1.amazonaws.com/opportunity/category/Other.svg",
  //           count: null,
  //         },
  //       ],
  //       countries: [
  //         {
  //           id: "2ba19f1d-998f-40ee-9af6-c6ab562e3040",
  //           name: "Nigeria",
  //           codeAlpha2: "NG",
  //           codeAlpha3: "NGA",
  //           codeNumeric: "566",
  //         },
  //       ],
  //       languages: [
  //         {
  //           id: "867b61f1-d669-4a2c-bf22-65ebd084d0cd",
  //           name: "English",
  //           codeAlpha2: "EN",
  //         },
  //       ],
  //       skills: [],
  //       verificationTypes: [],
  //     },
  //     {
  //       id: "019e6e75-b0cc-7217-9a4b-53a06c9c5d93",
  //       title: "Workshop Management Intern in Lagos",
  //       description:
  //         "The Workshop Management Intern will support the day-to-day operations of the workshop with a primary focus on parts inventory management, workflow coordination, and operational efficiency. This role is ideal for someone who wants hands-on exposure to workshop operations, supply chain management, and automotive business systems.",
  //       type: "Job",
  //       organizationId: "01999548-ca82-7487-968f-6950ec4bed5c",
  //       organizationName: "Jobberman Nigeria",
  //       organizationLogoURL:
  //         "https://yoma-v3-public-storage.s3.eu-west-1.amazonaws.com/production/photos/15c04ce1-f50d-488d-97b4-5a5bda1ce80d.png",
  //       summary: "Workshop Management Intern in Lagos",
  //       instructions: null,
  //       url: "https://www.jobberman.com/listings/workshop-management-intern-n99550?utm_campaign=Job_Listing_Yoma_ng&utm_medium=affiliate&utm_source=Yoma&utm_term=cde-jobberman-nigeria-and-yoma-5224",
  //       zltoReward: null,
  //       zltoRewardEstimate: null,
  //       zltoRewardCumulative: null,
  //       yomaReward: null,
  //       yomaRewardEstimate: null,
  //       yomaRewardCumulative: null,
  //       verificationEnabled: false,
  //       verificationMethod: null,
  //       difficulty: null,
  //       commitmentInterval: null,
  //       commitmentIntervalCount: null,
  //       commitmentIntervalDescription: null,
  //       participantLimit: null,
  //       participantCountCompleted: 0,
  //       participantCountPending: 0,
  //       participantCountTotal: 0,
  //       participantLimitReached: false,
  //       countViewed: 0,
  //       countNavigatedExternalLink: 0,
  //       statusId: "b99d26d7-a4b0-4a38-b35d-ae2d379a414e",
  //       status: "Active",
  //       keywords: ["Internship & Graduate", "Job", "Other"],
  //       dateStart: "2026-05-28T00:00:00+00:00",
  //       dateEnd: null,
  //       featured: false,
  //       engagementType: null,
  //       shareWithPartners: false,
  //       hidden: false,
  //       published: true,
  //       yomaInfoURL:
  //         "https://yoma.world/opportunities/019e6e75-b0cc-7217-9a4b-53a06c9c5d93",
  //       isCompletable: false,
  //       nonCompletableReason:
  //         "Opportunity 'Workshop Management Intern in Lagos' cannot be completed because verification is not enabled, 'Manual' verification is required",
  //       syncedInfo: {
  //         syncType: "Pull",
  //         locked: true,
  //         partners: [
  //           {
  //             partner: "Jobberman",
  //             entityType: "Opportunity",
  //             externalId: "NG:1224527",
  //             url: "https://www.jobberman.com/listings/workshop-management-intern-n99550?utm_campaign=Job_Listing_Yoma_ng&utm_medium=affiliate&utm_source=Yoma&utm_term=cde-jobberman-nigeria-and-yoma-5224",
  //           },
  //         ],
  //       },
  //       categories: [
  //         {
  //           id: "b89c5e91-9cbb-4a0e-991f-f987eebf9b70",
  //           name: "Other",
  //           imageURL:
  //             "https://yoma-v3-public-storage.s3.eu-west-1.amazonaws.com/opportunity/category/Other.svg",
  //           count: null,
  //         },
  //       ],
  //       countries: [
  //         {
  //           id: "2ba19f1d-998f-40ee-9af6-c6ab562e3040",
  //           name: "Nigeria",
  //           codeAlpha2: "NG",
  //           codeAlpha3: "NGA",
  //           codeNumeric: "566",
  //         },
  //       ],
  //       languages: [
  //         {
  //           id: "867b61f1-d669-4a2c-bf22-65ebd084d0cd",
  //           name: "English",
  //           codeAlpha2: "EN",
  //         },
  //       ],
  //       skills: [],
  //       verificationTypes: [],
  //     },
  //     {
  //       id: "019e6e88-74f2-7f02-9a4a-89468f2b5ed7",
  //       title: "Workshop Manager in Ibadan & Oyo State",
  //       description:
  //         "The Workshop Manager is responsible for managing the company’s fleet maintenance operations. This includes overseeing vehicle servicing, repairs, spare parts inventory, team supervision, and ensuring minimal downtime of trucks and other equipment. The role ensures the roadworthiness of all vehicles to support smooth haulage operations.",
  //       type: "Job",
  //       organizationId: "01999548-ca82-7487-968f-6950ec4bed5c",
  //       organizationName: "Jobberman Nigeria",
  //       organizationLogoURL:
  //         "https://yoma-v3-public-storage.s3.eu-west-1.amazonaws.com/production/photos/15c04ce1-f50d-488d-97b4-5a5bda1ce80d.png",
  //       summary: "Workshop Manager in Ibadan & Oyo State",
  //       instructions: null,
  //       url: "https://www.jobberman.com/listings/workshop-manager-2kkw96?utm_campaign=Job_Listing_Yoma_ng&utm_medium=affiliate&utm_source=Yoma&utm_term=cde-jobberman-nigeria-and-yoma-5224",
  //       zltoReward: null,
  //       zltoRewardEstimate: null,
  //       zltoRewardCumulative: null,
  //       yomaReward: null,
  //       yomaRewardEstimate: null,
  //       yomaRewardCumulative: null,
  //       verificationEnabled: false,
  //       verificationMethod: null,
  //       difficulty: null,
  //       commitmentInterval: null,
  //       commitmentIntervalCount: null,
  //       commitmentIntervalDescription: null,
  //       participantLimit: null,
  //       participantCountCompleted: 0,
  //       participantCountPending: 0,
  //       participantCountTotal: 0,
  //       participantLimitReached: false,
  //       countViewed: 0,
  //       countNavigatedExternalLink: 0,
  //       statusId: "b99d26d7-a4b0-4a38-b35d-ae2d379a414e",
  //       status: "Active",
  //       keywords: ["Full Time", "Job", "Other"],
  //       dateStart: "2026-05-28T00:00:00+00:00",
  //       dateEnd: null,
  //       featured: false,
  //       engagementType: null,
  //       shareWithPartners: false,
  //       hidden: false,
  //       published: true,
  //       yomaInfoURL:
  //         "https://yoma.world/opportunities/019e6e88-74f2-7f02-9a4a-89468f2b5ed7",
  //       isCompletable: false,
  //       nonCompletableReason:
  //         "Opportunity 'Workshop Manager in Ibadan & Oyo State' cannot be completed because verification is not enabled, 'Manual' verification is required",
  //       syncedInfo: {
  //         syncType: "Pull",
  //         locked: true,
  //         partners: [
  //           {
  //             partner: "Jobberman",
  //             entityType: "Opportunity",
  //             externalId: "NG:1228717",
  //             url: "https://www.jobberman.com/listings/workshop-manager-2kkw96?utm_campaign=Job_Listing_Yoma_ng&utm_medium=affiliate&utm_source=Yoma&utm_term=cde-jobberman-nigeria-and-yoma-5224",
  //           },
  //         ],
  //       },
  //       categories: [
  //         {
  //           id: "b89c5e91-9cbb-4a0e-991f-f987eebf9b70",
  //           name: "Other",
  //           imageURL:
  //             "https://yoma-v3-public-storage.s3.eu-west-1.amazonaws.com/opportunity/category/Other.svg",
  //           count: null,
  //         },
  //       ],
  //       countries: [
  //         {
  //           id: "2ba19f1d-998f-40ee-9af6-c6ab562e3040",
  //           name: "Nigeria",
  //           codeAlpha2: "NG",
  //           codeAlpha3: "NGA",
  //           codeNumeric: "566",
  //         },
  //       ],
  //       languages: [
  //         {
  //           id: "867b61f1-d669-4a2c-bf22-65ebd084d0cd",
  //           name: "English",
  //           codeAlpha2: "EN",
  //         },
  //       ],
  //       skills: [],
  //       verificationTypes: [],
  //     },
  //     {
  //       id: "019e6e64-4018-7cdf-9705-dc2e487f0360",
  //       title: "Workshop Manager in Lagos",
  //       description:
  //         "We're looking for a suitable candidate for this position.",
  //       type: "Job",
  //       organizationId: "01999548-ca82-7487-968f-6950ec4bed5c",
  //       organizationName: "Jobberman Nigeria",
  //       organizationLogoURL:
  //         "https://yoma-v3-public-storage.s3.eu-west-1.amazonaws.com/production/photos/15c04ce1-f50d-488d-97b4-5a5bda1ce80d.png",
  //       summary: "Workshop Manager in Lagos",
  //       instructions: null,
  //       url: "https://www.jobberman.com/listings/workshop-manager-vde2m2?utm_campaign=Job_Listing_Yoma_ng&utm_medium=affiliate&utm_source=Yoma&utm_term=cde-jobberman-nigeria-and-yoma-5224",
  //       zltoReward: null,
  //       zltoRewardEstimate: null,
  //       zltoRewardCumulative: null,
  //       yomaReward: null,
  //       yomaRewardEstimate: null,
  //       yomaRewardCumulative: null,
  //       verificationEnabled: false,
  //       verificationMethod: null,
  //       difficulty: null,
  //       commitmentInterval: null,
  //       commitmentIntervalCount: null,
  //       commitmentIntervalDescription: null,
  //       participantLimit: null,
  //       participantCountCompleted: 0,
  //       participantCountPending: 0,
  //       participantCountTotal: 0,
  //       participantLimitReached: false,
  //       countViewed: 0,
  //       countNavigatedExternalLink: 0,
  //       statusId: "b99d26d7-a4b0-4a38-b35d-ae2d379a414e",
  //       status: "Active",
  //       keywords: ["Full Time", "Job", "Other"],
  //       dateStart: "2026-05-28T00:00:00+00:00",
  //       dateEnd: null,
  //       featured: false,
  //       engagementType: null,
  //       shareWithPartners: false,
  //       hidden: false,
  //       published: true,
  //       yomaInfoURL:
  //         "https://yoma.world/opportunities/019e6e64-4018-7cdf-9705-dc2e487f0360",
  //       isCompletable: false,
  //       nonCompletableReason:
  //         "Opportunity 'Workshop Manager in Lagos' cannot be completed because verification is not enabled, 'Manual' verification is required",
  //       syncedInfo: {
  //         syncType: "Pull",
  //         locked: true,
  //         partners: [
  //           {
  //             partner: "Jobberman",
  //             entityType: "Opportunity",
  //             externalId: "NG:1212924",
  //             url: "https://www.jobberman.com/listings/workshop-manager-vde2m2?utm_campaign=Job_Listing_Yoma_ng&utm_medium=affiliate&utm_source=Yoma&utm_term=cde-jobberman-nigeria-and-yoma-5224",
  //           },
  //         ],
  //       },
  //       categories: [
  //         {
  //           id: "b89c5e91-9cbb-4a0e-991f-f987eebf9b70",
  //           name: "Other",
  //           imageURL:
  //             "https://yoma-v3-public-storage.s3.eu-west-1.amazonaws.com/opportunity/category/Other.svg",
  //           count: null,
  //         },
  //       ],
  //       countries: [
  //         {
  //           id: "2ba19f1d-998f-40ee-9af6-c6ab562e3040",
  //           name: "Nigeria",
  //           codeAlpha2: "NG",
  //           codeAlpha3: "NGA",
  //           codeNumeric: "566",
  //         },
  //       ],
  //       languages: [
  //         {
  //           id: "867b61f1-d669-4a2c-bf22-65ebd084d0cd",
  //           name: "English",
  //           codeAlpha2: "EN",
  //         },
  //       ],
  //       skills: [],
  //       verificationTypes: [],
  //     },
  //     {
  //       id: "019e6e7b-9af2-77e7-ad61-8cecb682ed5f",
  //       title: "Yoga/Pilate Instructors in Lagos",
  //       description:
  //         "We are seeking a skilled and professional Pilates/Yoga Instructor to lead structured classes including Yoga, Pilates, Barre, and Stretch sessions. The ideal candidate will deliver high-quality sessions while ensuring client safety, engagement, and satisfaction.",
  //       type: "Job",
  //       organizationId: "01999548-ca82-7487-968f-6950ec4bed5c",
  //       organizationName: "Jobberman Nigeria",
  //       organizationLogoURL:
  //         "https://yoma-v3-public-storage.s3.eu-west-1.amazonaws.com/production/photos/15c04ce1-f50d-488d-97b4-5a5bda1ce80d.png",
  //       summary: "Yoga/Pilate Instructors in Lagos",
  //       instructions: null,
  //       url: "https://www.jobberman.com/listings/yogapilate-instructors-2kkrq8?utm_campaign=Job_Listing_Yoma_ng&utm_medium=affiliate&utm_source=Yoma&utm_term=cde-jobberman-nigeria-and-yoma-5224",
  //       zltoReward: null,
  //       zltoRewardEstimate: null,
  //       zltoRewardCumulative: null,
  //       yomaReward: null,
  //       yomaRewardEstimate: null,
  //       yomaRewardCumulative: null,
  //       verificationEnabled: false,
  //       verificationMethod: null,
  //       difficulty: null,
  //       commitmentInterval: null,
  //       commitmentIntervalCount: null,
  //       commitmentIntervalDescription: null,
  //       participantLimit: null,
  //       participantCountCompleted: 0,
  //       participantCountPending: 0,
  //       participantCountTotal: 0,
  //       participantLimitReached: false,
  //       countViewed: 0,
  //       countNavigatedExternalLink: 0,
  //       statusId: "b99d26d7-a4b0-4a38-b35d-ae2d379a414e",
  //       status: "Active",
  //       keywords: ["Job", "Other", "Part Time"],
  //       dateStart: "2026-05-28T00:00:00+00:00",
  //       dateEnd: null,
  //       featured: false,
  //       engagementType: null,
  //       shareWithPartners: false,
  //       hidden: false,
  //       published: true,
  //       yomaInfoURL:
  //         "https://yoma.world/opportunities/019e6e7b-9af2-77e7-ad61-8cecb682ed5f",
  //       isCompletable: false,
  //       nonCompletableReason:
  //         "Opportunity 'Yoga/Pilate Instructors in Lagos' cannot be completed because verification is not enabled, 'Manual' verification is required",
  //       syncedInfo: {
  //         syncType: "Pull",
  //         locked: true,
  //         partners: [
  //           {
  //             partner: "Jobberman",
  //             entityType: "Opportunity",
  //             externalId: "NG:1225561",
  //             url: "https://www.jobberman.com/listings/yogapilate-instructors-2kkrq8?utm_campaign=Job_Listing_Yoma_ng&utm_medium=affiliate&utm_source=Yoma&utm_term=cde-jobberman-nigeria-and-yoma-5224",
  //           },
  //         ],
  //       },
  //       categories: [
  //         {
  //           id: "b89c5e91-9cbb-4a0e-991f-f987eebf9b70",
  //           name: "Other",
  //           imageURL:
  //             "https://yoma-v3-public-storage.s3.eu-west-1.amazonaws.com/opportunity/category/Other.svg",
  //           count: null,
  //         },
  //       ],
  //       countries: [
  //         {
  //           id: "2ba19f1d-998f-40ee-9af6-c6ab562e3040",
  //           name: "Nigeria",
  //           codeAlpha2: "NG",
  //           codeAlpha3: "NGA",
  //           codeNumeric: "566",
  //         },
  //       ],
  //       languages: [
  //         {
  //           id: "867b61f1-d669-4a2c-bf22-65ebd084d0cd",
  //           name: "English",
  //           codeAlpha2: "EN",
  //         },
  //       ],
  //       skills: [],
  //       verificationTypes: [],
  //     },
  //     {
  //       id: "019e6e6b-684d-7f32-a4ea-41c5225e0ef4",
  //       title: "Yoghurt Production Personnel in Rest of Nigeria",
  //       description:
  //         "The yoghurt production personnel is responsible for the daily production of yoghurt, ensuring that all processes are carried out efficiently, hygienically, and in accordance with established quality and safety standards. This role involves preparing ingredients, operating machinery, monitoring fermentation, and maintaining cleanliness throughout the production area.",
  //       type: "Job",
  //       organizationId: "01999548-ca82-7487-968f-6950ec4bed5c",
  //       organizationName: "Jobberman Nigeria",
  //       organizationLogoURL:
  //         "https://yoma-v3-public-storage.s3.eu-west-1.amazonaws.com/production/photos/15c04ce1-f50d-488d-97b4-5a5bda1ce80d.png",
  //       summary: "Yoghurt Production Personnel in Rest of Nigeria",
  //       instructions: null,
  //       url: "https://www.jobberman.com/listings/yoghurt-production-personnel-pgmq6r?utm_campaign=Job_Listing_Yoma_ng&utm_medium=affiliate&utm_source=Yoma&utm_term=cde-jobberman-nigeria-and-yoma-5224",
  //       zltoReward: null,
  //       zltoRewardEstimate: null,
  //       zltoRewardCumulative: null,
  //       yomaReward: null,
  //       yomaRewardEstimate: null,
  //       yomaRewardCumulative: null,
  //       verificationEnabled: false,
  //       verificationMethod: null,
  //       difficulty: null,
  //       commitmentInterval: null,
  //       commitmentIntervalCount: null,
  //       commitmentIntervalDescription: null,
  //       participantLimit: null,
  //       participantCountCompleted: 0,
  //       participantCountPending: 0,
  //       participantCountTotal: 0,
  //       participantLimitReached: false,
  //       countViewed: 0,
  //       countNavigatedExternalLink: 0,
  //       statusId: "b99d26d7-a4b0-4a38-b35d-ae2d379a414e",
  //       status: "Active",
  //       keywords: ["Full Time", "Job", "Other"],
  //       dateStart: "2026-05-28T00:00:00+00:00",
  //       dateEnd: null,
  //       featured: false,
  //       engagementType: null,
  //       shareWithPartners: false,
  //       hidden: false,
  //       published: true,
  //       yomaInfoURL:
  //         "https://yoma.world/opportunities/019e6e6b-684d-7f32-a4ea-41c5225e0ef4",
  //       isCompletable: false,
  //       nonCompletableReason:
  //         "Opportunity 'Yoghurt Production Personnel in Rest of Nigeria' cannot be completed because verification is not enabled, 'Manual' verification is required",
  //       syncedInfo: {
  //         syncType: "Pull",
  //         locked: true,
  //         partners: [
  //           {
  //             partner: "Jobberman",
  //             entityType: "Opportunity",
  //             externalId: "NG:1219760",
  //             url: "https://www.jobberman.com/listings/yoghurt-production-personnel-pgmq6r?utm_campaign=Job_Listing_Yoma_ng&utm_medium=affiliate&utm_source=Yoma&utm_term=cde-jobberman-nigeria-and-yoma-5224",
  //           },
  //         ],
  //       },
  //       categories: [
  //         {
  //           id: "b89c5e91-9cbb-4a0e-991f-f987eebf9b70",
  //           name: "Other",
  //           imageURL:
  //             "https://yoma-v3-public-storage.s3.eu-west-1.amazonaws.com/opportunity/category/Other.svg",
  //           count: null,
  //         },
  //       ],
  //       countries: [
  //         {
  //           id: "2ba19f1d-998f-40ee-9af6-c6ab562e3040",
  //           name: "Nigeria",
  //           codeAlpha2: "NG",
  //           codeAlpha3: "NGA",
  //           codeNumeric: "566",
  //         },
  //       ],
  //       languages: [
  //         {
  //           id: "867b61f1-d669-4a2c-bf22-65ebd084d0cd",
  //           name: "English",
  //           codeAlpha2: "EN",
  //         },
  //       ],
  //       skills: [],
  //       verificationTypes: [],
  //     },
  //     {
  //       id: "019e6e77-8857-7411-bf4d-81cb4d922267",
  //       title: "Yoruba Teacher in Lagos",
  //       description:
  //         "We are seeking a passionate and knowledgeable Yoruba Teacher to join our client; a School in Ipaja, Lagos. The ideal candidate will be responsible for delivering engaging and comprehensive lessons in Yoruba, helping students develop a strong understanding of the subject.",
  //       type: "Job",
  //       organizationId: "01999548-ca82-7487-968f-6950ec4bed5c",
  //       organizationName: "Jobberman Nigeria",
  //       organizationLogoURL:
  //         "https://yoma-v3-public-storage.s3.eu-west-1.amazonaws.com/production/photos/15c04ce1-f50d-488d-97b4-5a5bda1ce80d.png",
  //       summary: "Yoruba Teacher in Lagos",
  //       instructions: null,
  //       url: "https://www.jobberman.com/listings/yoruba-teacher-wrrezz?utm_campaign=Job_Listing_Yoma_ng&utm_medium=affiliate&utm_source=Yoma&utm_term=cde-jobberman-nigeria-and-yoma-5224",
  //       zltoReward: null,
  //       zltoRewardEstimate: null,
  //       zltoRewardCumulative: null,
  //       yomaReward: null,
  //       yomaRewardEstimate: null,
  //       yomaRewardCumulative: null,
  //       verificationEnabled: false,
  //       verificationMethod: null,
  //       difficulty: null,
  //       commitmentInterval: null,
  //       commitmentIntervalCount: null,
  //       commitmentIntervalDescription: null,
  //       participantLimit: null,
  //       participantCountCompleted: 0,
  //       participantCountPending: 0,
  //       participantCountTotal: 0,
  //       participantLimitReached: false,
  //       countViewed: 0,
  //       countNavigatedExternalLink: 0,
  //       statusId: "b99d26d7-a4b0-4a38-b35d-ae2d379a414e",
  //       status: "Active",
  //       keywords: ["Full Time", "Job", "Other"],
  //       dateStart: "2026-05-28T00:00:00+00:00",
  //       dateEnd: null,
  //       featured: false,
  //       engagementType: null,
  //       shareWithPartners: false,
  //       hidden: false,
  //       published: true,
  //       yomaInfoURL:
  //         "https://yoma.world/opportunities/019e6e77-8857-7411-bf4d-81cb4d922267",
  //       isCompletable: false,
  //       nonCompletableReason:
  //         "Opportunity 'Yoruba Teacher in Lagos' cannot be completed because verification is not enabled, 'Manual' verification is required",
  //       syncedInfo: {
  //         syncType: "Pull",
  //         locked: true,
  //         partners: [
  //           {
  //             partner: "Jobberman",
  //             entityType: "Opportunity",
  //             externalId: "NG:1225050",
  //             url: "https://www.jobberman.com/listings/yoruba-teacher-wrrezz?utm_campaign=Job_Listing_Yoma_ng&utm_medium=affiliate&utm_source=Yoma&utm_term=cde-jobberman-nigeria-and-yoma-5224",
  //           },
  //         ],
  //       },
  //       categories: [
  //         {
  //           id: "b89c5e91-9cbb-4a0e-991f-f987eebf9b70",
  //           name: "Other",
  //           imageURL:
  //             "https://yoma-v3-public-storage.s3.eu-west-1.amazonaws.com/opportunity/category/Other.svg",
  //           count: null,
  //         },
  //       ],
  //       countries: [
  //         {
  //           id: "2ba19f1d-998f-40ee-9af6-c6ab562e3040",
  //           name: "Nigeria",
  //           codeAlpha2: "NG",
  //           codeAlpha3: "NGA",
  //           codeNumeric: "566",
  //         },
  //       ],
  //       languages: [
  //         {
  //           id: "867b61f1-d669-4a2c-bf22-65ebd084d0cd",
  //           name: "English",
  //           codeAlpha2: "EN",
  //         },
  //       ],
  //       skills: [],
  //       verificationTypes: [],
  //     },
  //     {
  //       id: "019e6c88-325a-7c0a-9b24-81c95f6f0a9f",
  //       title:
  //         "Job Alert: Communication & Advocacy Assistant with UNDP (Germany) —Remote",
  //       description:
  //         "**UNDP** is recruiting a Communication and Advocacy Assistant through the **UN Volunteers (UNV)** programme to support its **Global Youth Team** — **fully remote,** open to applicants worldwide, with a **monthly living allowance** based on your country of residence.\n\n&#x20;\n\nIn this role, you will support **digital content creation, advocacy campaigns, and communications** that amplify youth voices across UNDP's network of 170 countries. — contributing directly to the UN Youth 2030 Strategy and global initiatives like Generation17.  **No closing date has been confirmed** — **apply as early as possible.**\n\n&#x20;\n\n👉 **Apply:** Click **\"Go to Opportunity\"** to learn more and submit your application.\n\n&#x20;\n\n### What They're Looking For\n\n* Background in communications, media, journalism or related field\n* Strong English writing, storytelling and content creation skills\n* Experience with social media and digital advocacy\n* Passion for youth empowerment and international development\n* Open to applicants 18 and above — youth (18–26) and specialists (27+) both eligible\n* Ability to work independently in a fully remote environment\n\n&#x20;\n\n### What You'll Gain\n\n* Monthly living allowance based on your country of residence\n* Direct experience with a UN global communications team\n* Exposure to youth policy, SDG advocacy and digital campaigns\n* Access to UNDP's professional network spanning 170 countries\n* A credible UN credential for your career profile\n* Opportunity to contribute to Generation17 and the UN Youth 2030 Strategy\n\n&#x20;\n\n**Deadline:** Unspecified\n\n&#x20;\n\n**⚠️ Important Application Information**\n\n* Register your profile first at app.unv.org — takes approximately 45 minutes\n* Youth Volunteers (18–26) need less than 2 years experience; Specialist Volunteers (27+) need at least 3 years\n* Check your living allowance entitlement by country at app.unv.org/calculator\n* UNDP charges no fees at any stage — report any suspicious recruitment requests\n\n&#x20;",
  //       type: "Job",
  //       organizationId: "b9653e67-115e-4dc5-872f-5b890cb647e1",
  //       organizationName: "UNICEF Nigeria",
  //       organizationLogoURL:
  //         "https://yoma-v3-public-storage.s3.eu-west-1.amazonaws.com/production/photos/6336d29c-8b16-44eb-9973-1fb07a4e44d8.png",
  //       summary:
  //         "Join UNDP's Global Youth Team remotely — support youth advocacy & communications campaigns across 170 countries with a monthly living allowance.",
  //       instructions: null,
  //       url: "https://unvprodb2c.b2clogin.com/unvprodb2c.onmicrosoft.com/b2c_1a_uvp/oauth2/v2.0/authorize?response_type=id_token&scope=openid%20ca9dfccc-7bfe-4b88-89a2-20d4646a0613%20openid%20profile&client_id=ca9dfccc-7bfe-4b88-89a2-20d4646a0613&redirect_uri=https%3A%2F%2Fapp.unv.org&state=eyJpZCI6IjJiMjViNzI1LTM3YzktNGUxZS1iNTI1LTI0NDM3NjI2Nzk0MyIsInRzIjoxNzc5MDY2NDEwLCJtZXRob2QiOiJyZWRpcmVjdEludGVyYWN0aW9uIn0%3D%7Chttps%3A%2F%2Fapp.unv.org%2Fopportunities%2F1784888021269084%3FfromLoginBtn%3D1&nonce=3b104818-d6d6-4a3b-beab-7a0927006009&client_info=1&x-client-SKU=MSAL.JS&x-client-Ver=1.4.16&client-request-id=974de334-a5c1-4c5c-8b5e-edbd745615c3&response_mode=fragment",
  //       zltoReward: null,
  //       zltoRewardEstimate: null,
  //       zltoRewardCumulative: null,
  //       yomaReward: null,
  //       yomaRewardEstimate: null,
  //       yomaRewardCumulative: null,
  //       verificationEnabled: false,
  //       verificationMethod: null,
  //       difficulty: "Any Level",
  //       commitmentInterval: "Minute",
  //       commitmentIntervalCount: 30,
  //       commitmentIntervalDescription: "30 Minutes",
  //       participantLimit: null,
  //       participantCountCompleted: 0,
  //       participantCountPending: 0,
  //       participantCountTotal: 0,
  //       participantLimitReached: false,
  //       countViewed: 280,
  //       countNavigatedExternalLink: 3,
  //       statusId: "b99d26d7-a4b0-4a38-b35d-ae2d379a414e",
  //       status: "Active",
  //       keywords: [
  //         "UNDP",
  //         "Communication",
  //         "Assistant",
  //         "Advocacy",
  //         "job",
  //         "jobs",
  //         "alert",
  //         "yoma",
  //         "UNV",
  //         "UN",
  //         "volunteers",
  //         "nigeria",
  //         "Germany",
  //         "Global",
  //         "remote",
  //         "Paid",
  //         "GenU",
  //         "9ja",
  //         "UNICEF",
  //         "Comms",
  //         "specialist",
  //       ],
  //       dateStart: "2026-05-25T00:00:00+00:00",
  //       dateEnd: "2026-06-18T23:59:59.999+00:00",
  //       featured: false,
  //       engagementType: "Online",
  //       shareWithPartners: true,
  //       hidden: false,
  //       published: true,
  //       yomaInfoURL:
  //         "https://yoma.world/opportunities/019e6c88-325a-7c0a-9b24-81c95f6f0a9f",
  //       isCompletable: false,
  //       nonCompletableReason:
  //         "Opportunity 'Job Alert: Communication & Advocacy Assistant with UNDP (Germany) —Remote' cannot be completed because verification is not enabled, 'Manual' verification is required",
  //       syncedInfo: null,
  //       categories: [
  //         {
  //           id: "1dc39a5d-e049-4cfe-b708-855fce97b86e",
  //           name: "AI, Data and Analytics",
  //           imageURL:
  //             "https://yoma-v3-public-storage.s3.eu-west-1.amazonaws.com/opportunity/category/AIDataAndAnalytics.svg",
  //           count: null,
  //         },
  //         {
  //           id: "89f4ab46-0767-494f-a18c-3037f698133a",
  //           name: "Career and Personal Development",
  //           imageURL:
  //             "https://yoma-v3-public-storage.s3.eu-west-1.amazonaws.com/opportunity/category/CareerAndPersonalDevelopment.svg",
  //           count: null,
  //         },
  //         {
  //           id: "7afb66ad-164e-46a3-933f-a0bac1ca1923",
  //           name: "Creative Industry and Arts",
  //           imageURL:
  //             "https://yoma-v3-public-storage.s3.eu-west-1.amazonaws.com/opportunity/category/CreativeIndustryAndArts.svg",
  //           count: null,
  //         },
  //         {
  //           id: "b89c5e91-9cbb-4a0e-991f-f987eebf9b70",
  //           name: "Other",
  //           imageURL:
  //             "https://yoma-v3-public-storage.s3.eu-west-1.amazonaws.com/opportunity/category/Other.svg",
  //           count: null,
  //         },
  //         {
  //           id: "fa564c1c-591a-4a6d-8294-20165da8866b",
  //           name: "Technology and Digitization",
  //           imageURL:
  //             "https://yoma-v3-public-storage.s3.eu-west-1.amazonaws.com/opportunity/category/TechnologyAndDigitization.svg",
  //           count: null,
  //         },
  //       ],
  //       countries: [
  //         {
  //           id: "193f7866-2d33-424c-98e8-c296aabb9fa9",
  //           name: "Germany",
  //           codeAlpha2: "DE",
  //           codeAlpha3: "DEU",
  //           codeNumeric: "276",
  //         },
  //         {
  //           id: "2ba19f1d-998f-40ee-9af6-c6ab562e3040",
  //           name: "Nigeria",
  //           codeAlpha2: "NG",
  //           codeAlpha3: "NGA",
  //           codeNumeric: "566",
  //         },
  //       ],
  //       languages: [
  //         {
  //           id: "867b61f1-d669-4a2c-bf22-65ebd084d0cd",
  //           name: "English",
  //           codeAlpha2: "EN",
  //         },
  //       ],
  //       skills: [
  //         {
  //           id: "d5e758e4-da32-4f55-9ebb-169a1944cdf0",
  //           name: "Advocacy",
  //           infoURL:
  //             "https://lightcast.io/open-skills/skills/ESD2EDF2E51D7C90FD5F",
  //         },
  //         {
  //           id: "39e40aa0-f6c6-4c0d-aa6a-694a42baae18",
  //           name: "Communication",
  //           infoURL:
  //             "https://lightcast.io/open-skills/skills/KS122556LMQ829GZCCRV",
  //         },
  //         {
  //           id: "6ec84000-107c-438f-b203-e6b7f9f8cf49",
  //           name: "Content Creation",
  //           infoURL:
  //             "https://lightcast.io/open-skills/skills/KS122BL6107G2Z27JWJW",
  //         },
  //         {
  //           id: "14a66752-0f5e-4db3-9d02-0bb8ccd2ce2e",
  //           name: "Digital Storytelling",
  //           infoURL:
  //             "https://lightcast.io/open-skills/skills/KS122Z663MHVG4TQH58J",
  //         },
  //         {
  //           id: "c0d63d57-9f98-45dc-a010-5a78e80d8c53",
  //           name: "International Communications",
  //           infoURL:
  //             "https://lightcast.io/open-skills/skills/KS1258H5Z9XP2GCKJT8J",
  //         },
  //         {
  //           id: "0386393f-7e9a-4d90-b90f-c7222543a185",
  //           name: "Policy Research",
  //           infoURL:
  //             "https://lightcast.io/open-skills/skills/ESE6A4639B458FAF6F32",
  //         },
  //         {
  //           id: "00749d29-6446-4e2b-8a0c-d153e4a7ff35",
  //           name: "Professional Networking",
  //           infoURL:
  //             "https://lightcast.io/open-skills/skills/ESBE0AEFFCC9FEA76A31",
  //         },
  //         {
  //           id: "3060a600-cf2d-4943-8087-8eaa172447a0",
  //           name: "Research",
  //           infoURL:
  //             "https://lightcast.io/open-skills/skills/KS1203C6N9B52QGB4H67",
  //         },
  //         {
  //           id: "2bba66ca-bc58-4ae9-8d12-cca92de356d2",
  //           name: "Social Media Management",
  //           infoURL:
  //             "https://lightcast.io/open-skills/skills/ESF7CBEBE067150B911F",
  //         },
  //       ],
  //       verificationTypes: [],
  //     },
  //     {
  //       id: "019e6c6a-04c0-77df-aa87-47384b7b92f6",
  //       title: "Job Alert: Nigeria Jubilee Fellows Programme (NJFP) 2026",
  //       description:
  //         "The Nigeria Jubilee Fellows Programme (NJFP) is a Federal Government of Nigeria initiative — funded by the European Union and implemented by UNDP — placing young graduates in public and private sector organizations nationwide for **12 months**, with a monthly stipend of **₦150,000.**\n\n&#x20;\n\nFellows receive hands-on work experience, mentorship, digital and entrepreneurship skills training, and six additional months of career support through the NJFP Alumni Talent Hub after placement ends. No closing date has been announced — apply as early as possible.\n\n&#x20;\n\n👉 **Apply:** Click \"**Go to Opportunity\"** to learn more and submit your application.\n\n&#x20;\n\n### What You'll Gain\n\n* ₦150,000 monthly stipend for the full 12 months\n* Hands-on work experience with reputable organizations nationwide\n* Professional mentorship from industry leaders\n* Employability, digital and entrepreneurship skills training\n* Six additional months of career support and networking post-fellowship\n* Recognition and access to the NJFP Alumni Talent Hub\n\n&#x20;\n\n### What They're Looking For\n\n* Nigerian citizen, 30 years or younger\n* Bachelor's Degree or HND from any discipline, graduated not earlier than 2022\n* Minimum Second Class Lower (2.2) or Upper Credit for HND holders\n* Completed NYSC or valid exemption certificate\n* Currently unemployed\n* Willingness to work in any state of placement\n* Strong communication skills and professional attitude\n\n&#x20;\n\n**Deadline:** Unspecified\n&#x20;\n**⚠️ Important Application Information**\n\n* The NJFP 2.0 application portal has officially reopened for the 2026 intake\n* **Previous applicants do not need to reapply** — your prior submission remains valid\n* A step-by-step application guide with tips to improve your chances is available on the official website\n* For queries or complaints, contact the customer service team via channels on the official website\n\n&#x20;",
  //       type: "Job",
  //       organizationId: "b9653e67-115e-4dc5-872f-5b890cb647e1",
  //       organizationName: "UNICEF Nigeria",
  //       organizationLogoURL:
  //         "https://yoma-v3-public-storage.s3.eu-west-1.amazonaws.com/production/photos/6336d29c-8b16-44eb-9973-1fb07a4e44d8.png",
  //       summary:
  //         "Earn ₦150,000/month, gain 12 months of paid work experience, mentorship & skills training with Nigeria's top organizations.",
  //       instructions: null,
  //       url: "http://www.njfp.ng/apply",
  //       zltoReward: null,
  //       zltoRewardEstimate: null,
  //       zltoRewardCumulative: null,
  //       yomaReward: null,
  //       yomaRewardEstimate: null,
  //       yomaRewardCumulative: null,
  //       verificationEnabled: false,
  //       verificationMethod: null,
  //       difficulty: "Any Level",
  //       commitmentInterval: "Minute",
  //       commitmentIntervalCount: 20,
  //       commitmentIntervalDescription: "20 Minutes",
  //       participantLimit: null,
  //       participantCountCompleted: 0,
  //       participantCountPending: 0,
  //       participantCountTotal: 0,
  //       participantLimitReached: false,
  //       countViewed: 401,
  //       countNavigatedExternalLink: 1,
  //       statusId: "b99d26d7-a4b0-4a38-b35d-ae2d379a414e",
  //       status: "Active",
  //       keywords: [
  //         "NJFP",
  //         "NJFPs",
  //         "NSYP",
  //         "NYSC",
  //         "Juile",
  //         "Jubilee",
  //         "fellows",
  //         "fellow",
  //         "Job",
  //         "Jobs",
  //         "Alert",
  //         "program",
  //         "federal",
  //         "government",
  //         "Nigeria",
  //         "UNDP",
  //         "Graduate",
  //         "young",
  //         "EU",
  //         "European",
  //         "Work",
  //         "150K",
  //         "150000",
  //         "GenU",
  //         "YOMA",
  //         "UNICEF",
  //         "Earning",
  //       ],
  //       dateStart: "2026-05-25T00:00:00+00:00",
  //       dateEnd: "2026-06-18T23:59:59.999+00:00",
  //       featured: false,
  //       engagementType: "Offline",
  //       shareWithPartners: true,
  //       hidden: false,
  //       published: true,
  //       yomaInfoURL:
  //         "https://yoma.world/opportunities/019e6c6a-04c0-77df-aa87-47384b7b92f6",
  //       isCompletable: false,
  //       nonCompletableReason:
  //         "Opportunity 'Job Alert: Nigeria Jubilee Fellows Programme (NJFP) 2026' cannot be completed because verification is not enabled, 'Manual' verification is required",
  //       syncedInfo: null,
  //       categories: [
  //         {
  //           id: "2ccbacf7-1ed9-4e20-bb7c-43edfdb3f950",
  //           name: "Agriculture",
  //           imageURL:
  //             "https://yoma-v3-public-storage.s3.eu-west-1.amazonaws.com/opportunity/category/Agriculture.svg",
  //           count: null,
  //         },
  //         {
  //           id: "1dc39a5d-e049-4cfe-b708-855fce97b86e",
  //           name: "AI, Data and Analytics",
  //           imageURL:
  //             "https://yoma-v3-public-storage.s3.eu-west-1.amazonaws.com/opportunity/category/AIDataAndAnalytics.svg",
  //           count: null,
  //         },
  //         {
  //           id: "c76786fd-fca9-4633-85b3-11e53486d708",
  //           name: "Business and Entrepreneurship",
  //           imageURL:
  //             "https://yoma-v3-public-storage.s3.eu-west-1.amazonaws.com/opportunity/category/BusinessAndEntrepreneurship.svg",
  //           count: null,
  //         },
  //         {
  //           id: "89f4ab46-0767-494f-a18c-3037f698133a",
  //           name: "Career and Personal Development",
  //           imageURL:
  //             "https://yoma-v3-public-storage.s3.eu-west-1.amazonaws.com/opportunity/category/CareerAndPersonalDevelopment.svg",
  //           count: null,
  //         },
  //         {
  //           id: "d0d322ab-d1d7-44b6-94e8-7b85246aa42e",
  //           name: "Environment and Climate",
  //           imageURL:
  //             "https://yoma-v3-public-storage.s3.eu-west-1.amazonaws.com/opportunity/category/EnvironmentAndClimate.svg",
  //           count: null,
  //         },
  //         {
  //           id: "fa564c1c-591a-4a6d-8294-20165da8866b",
  //           name: "Technology and Digitization",
  //           imageURL:
  //             "https://yoma-v3-public-storage.s3.eu-west-1.amazonaws.com/opportunity/category/TechnologyAndDigitization.svg",
  //           count: null,
  //         },
  //       ],
  //       countries: [
  //         {
  //           id: "2ba19f1d-998f-40ee-9af6-c6ab562e3040",
  //           name: "Nigeria",
  //           codeAlpha2: "NG",
  //           codeAlpha3: "NGA",
  //           codeNumeric: "566",
  //         },
  //       ],
  //       languages: [
  //         {
  //           id: "867b61f1-d669-4a2c-bf22-65ebd084d0cd",
  //           name: "English",
  //           codeAlpha2: "EN",
  //         },
  //       ],
  //       skills: [
  //         {
  //           id: "17de092c-5474-4716-a6ff-3529396d5ee6",
  //           name: "Career Development",
  //           infoURL:
  //             "https://lightcast.io/open-skills/skills/KS121DS6GB09TFN7RLX0",
  //         },
  //         {
  //           id: "39e40aa0-f6c6-4c0d-aa6a-694a42baae18",
  //           name: "Communication",
  //           infoURL:
  //             "https://lightcast.io/open-skills/skills/KS122556LMQ829GZCCRV",
  //         },
  //         {
  //           id: "06804adb-41b0-4460-83a2-2cffe64af2a1",
  //           name: "Digital Literacy",
  //           infoURL:
  //             "https://lightcast.io/open-skills/skills/ESB04BCB6189A2CB271E",
  //         },
  //         {
  //           id: "06b1c2dc-e4b3-4d3c-ae41-ce9ff177d921",
  //           name: "Problem Solving",
  //           infoURL:
  //             "https://lightcast.io/open-skills/skills/KS125F678LV2KB3Z5XW0",
  //         },
  //         {
  //           id: "09622850-3198-440d-a9c3-6ae084f831aa",
  //           name: "Teamwork",
  //           infoURL:
  //             "https://lightcast.io/open-skills/skills/KSKJX44T33B6D4UCC8CB",
  //         },
  //         {
  //           id: "69318d61-1e86-4e2c-9237-e8c759cc4247",
  //           name: "Time Management",
  //           infoURL:
  //             "https://lightcast.io/open-skills/skills/KS44175745H9Q0DPBDNT",
  //         },
  //       ],
  //       verificationTypes: [],
  //     },
  //     {
  //       id: "019e96b0-253f-7408-a5d4-fd71e756293f",
  //       title: "JobStart Philippines Program 💼",
  //       description:
  //         "Ready to kickstart your career? **JobStart Philippines** is a flagship program of the **Department of Labor and Employment (DOLE)** that helps young Filipinos prepare for meaningful employment through career guidance, life skills training, technical skills development, and internship opportunities with partner employers.\n\n&#x20;\n\n🤝 In partnership with the private sector, JobStart bridges the gap between young job seekers and employers by developing a pool of skilled, motivated, and work-ready youth. The program is implemented through the **Public Employment Service Office (PESO)** and, for this year's implementation, will be supported by **ALTEC-LEaP**, providing technical expertise in employability and soft skills development.\n\n&#x20;\n\n🎯 Program Objectives\n\nJobStart aims to empower young people by helping them discover their potential and prepare for the world of work through:\n\n✅ Enhancing knowledge and job-relevant skills that respond to current labor market demands\n\n✅ Developing essential life skills such as communication, professionalism, teamwork, adaptability, and problem-solving\n\n✅ Promoting strong work ethics and preparing participants to thrive in safe, productive, and professional work environments\n\n&#x20;\n\n👥 *Who Can Join?*\n\nRegistration is **first-come, first-served**, with priority given to **at-risk youth**.\n\nTo qualify, applicants must be:\n\n1\\. A Filipino citizen\n\n2\\. 18–24 years old at the time of registration\n\n3\\. Have reached at least high school level education\n\n4\\. First Year High School (for the old 10-year curriculum), or Grade 7 (for the K–12 curriculum)\n\n5\\. Not currently studying, employed, or undergoing training (**NEET**) at the time of registration\n\n6\\. Have no work experience or less than **one (1) year** of accumulated work experience in formal wage employment (including part-time and full-time work.\n\n&#x20;\n\n🌟 Why Join JobStart?\n\n🔹 Career Coaching and Guidance\n\n🔹 Life Skills and Employability Training\n\n🔹 Technical Skills Development\n\n🔹 Internship Opportunities with Employers\n\n🔹 Increased Confidence and Workplace Readiness\n\n🔹 Stronger Pathways from **Learning to Earning**\n\n&#x20;\n\n*Your journey to employment starts here. Build your skills, discover your potential, and take your first step toward a brighter future with JobStart Philippines!* ✨🙌",
  //       type: "Job",
  //       organizationId: "f56560db-51d0-43a9-b6a2-8ec820dc36a8",
  //       organizationName: "LEaP!",
  //       organizationLogoURL:
  //         "https://yoma-v3-public-storage.s3.eu-west-1.amazonaws.com/production/photos/51bb7568-0c76-4918-b109-44e040713f12.png",
  //       summary:
  //         "A youth with career coaching, life skills and technical trainings, and internships with employers.",
  //       instructions: null,
  //       url: null,
  //       zltoReward: null,
  //       zltoRewardEstimate: null,
  //       zltoRewardCumulative: null,
  //       yomaReward: null,
  //       yomaRewardEstimate: null,
  //       yomaRewardCumulative: null,
  //       verificationEnabled: true,
  //       verificationMethod: "Manual",
  //       difficulty: "Any Level",
  //       commitmentInterval: "Day",
  //       commitmentIntervalCount: 10,
  //       commitmentIntervalDescription: "10 Days",
  //       participantLimit: 500,
  //       participantCountCompleted: 0,
  //       participantCountPending: 0,
  //       participantCountTotal: 0,
  //       participantLimitReached: false,
  //       countViewed: 2,
  //       countNavigatedExternalLink: 0,
  //       statusId: "b99d26d7-a4b0-4a38-b35d-ae2d379a414e",
  //       status: "Active",
  //       keywords: [
  //         "JobStart PH",
  //         "Career Development",
  //         "Job Coaching",
  //         "Life Skills Training",
  //       ],
  //       dateStart: "2026-05-15T00:00:00+00:00",
  //       dateEnd: "2026-06-30T23:59:59.999+00:00",
  //       featured: false,
  //       engagementType: "Hybrid",
  //       shareWithPartners: false,
  //       hidden: false,
  //       published: true,
  //       yomaInfoURL:
  //         "https://yoma.world/opportunities/019e96b0-253f-7408-a5d4-fd71e756293f",
  //       isCompletable: true,
  //       nonCompletableReason: null,
  //       syncedInfo: null,
  //       categories: [
  //         {
  //           id: "89f4ab46-0767-494f-a18c-3037f698133a",
  //           name: "Career and Personal Development",
  //           imageURL:
  //             "https://yoma-v3-public-storage.s3.eu-west-1.amazonaws.com/opportunity/category/CareerAndPersonalDevelopment.svg",
  //           count: null,
  //         },
  //       ],
  //       countries: [
  //         {
  //           id: "a8beebbd-cbdb-4693-9350-a224e61793fe",
  //           name: "Philippines",
  //           codeAlpha2: "PH",
  //           codeAlpha3: "PHL",
  //           codeNumeric: "608",
  //         },
  //       ],
  //       languages: [
  //         {
  //           id: "867b61f1-d669-4a2c-bf22-65ebd084d0cd",
  //           name: "English",
  //           codeAlpha2: "EN",
  //         },
  //         {
  //           id: "02e3ae78-0bab-41ac-9ebe-ec2d22dc7e49",
  //           name: "Tagalog",
  //           codeAlpha2: "TL",
  //         },
  //       ],
  //       skills: [
  //         {
  //           id: "17de092c-5474-4716-a6ff-3529396d5ee6",
  //           name: "Career Development",
  //           infoURL:
  //             "https://lightcast.io/open-skills/skills/KS121DS6GB09TFN7RLX0",
  //         },
  //         {
  //           id: "a1e9a0e9-624d-4a8b-bcbe-6af0c5309975",
  //           name: "Collaborative Communications",
  //           infoURL:
  //             "https://lightcast.io/open-skills/skills/KS1223L6X0SFSMDMXHFX",
  //         },
  //         {
  //           id: "cc875c9d-e621-4101-83a3-26f06c5e3ad8",
  //           name: "Critical Thinking",
  //           infoURL:
  //             "https://lightcast.io/open-skills/skills/KS122J56PZMMFL1SVY1F",
  //         },
  //         {
  //           id: "4d05955b-384c-4995-a2cc-ef5be7312aab",
  //           name: "Interactive Communications",
  //           infoURL:
  //             "https://lightcast.io/open-skills/skills/KS1257T77DQVVZ4J82R1",
  //         },
  //         {
  //           id: "9b568416-1356-4cf6-9a86-5662a0ba625f",
  //           name: "Technical Writing",
  //           infoURL:
  //             "https://lightcast.io/open-skills/skills/KS4418877WW06JL2XBNJ",
  //         },
  //       ],
  //       verificationTypes: [
  //         {
  //           id: "ae4b5ca3-20ce-451a-944e-67ef24e455b6",
  //           type: "FileUpload",
  //           displayName: "File Upload",
  //           description: "A file of your completion certificate",
  //         },
  //       ],
  //     },
  //     {
  //       id: "019ddb4a-0f1d-7897-93ac-b4532bd77273",
  //       title: "Global Internship with UN: Digital, AI & Innovation (DAI)",
  //       description:
  //         'United Nations Development Programme 🌍 is looking for motivated interns worldwide 🌐 to support cutting-edge work 🚀 at the intersection of technology 💻, data 📊, and sustainable development 🌱. This is a remote 🏡, home-based internship lasting 3 months 📅.\n\n######\n\n##### **What they are looking for? 🤔**\n\nInterns will contribute to one or more of the following areas:\n\n**Systems Transformation & Innovation 🔄💡:** Researching global trends 🌍 and supporting new approaches to solving development challenges at scale.\n\n**Programme Delivery & Capacity Building 🏗️📚:** Supporting digital and AI projects 🤖 and creating guides that help governments work better with technology.\n\n**Data Policy & Governance 📜🔐:** Researching how data is governed and protected 🧠, contributing to national strategies and global conversations on digital rights.\n\n**Data Analytics & Insights 📊📈:** Working with data cleaning 🧹, analyzing 🔍, and turning it into clear visuals and dashboards 📉 that support evidence-based decisions.\n\n**Partnerships & Strategic Communications 🤝📣:** Building partner relationships and creating content 📝 that tells UNDP’s digital story across key platforms.\n\n**Process Efficiency & Resource Management ⚙️📅:** Keeping projects on track 🛤️, managing workplans, and improving workflows across the DAI Hub.\n\n**Product Design, Build & Management 🧩💻:** Helping design digital tools and AI products 🤖, testing and rolling out solutions in communities.\n\n**Research & Knowledge Management 📚🧠:** Maintaining knowledge platforms, curating research, drafting summaries ✍️, and disseminating digital and data insights across UNDP.\n\n######\n\nApplications are open on a rolling basis until September 30, 2026 ⏰. The start date is flexible 📅. Successful applicants can expect to hear back between April and December 2026 📩.\n\n👉 Click "Go to Opportunity" to submit your application before the deadline.\n\n######\n\n##### **Who Should Apply 👥**\n\n* Current university students 🎓 (bachelor’s level or higher)\n* Recent graduates 👩‍🎓 within one year of graduation\n* Passionate about digital 💻, data 📊, AI 🤖, or innovation 💡\n* Driven by purpose 🌍 and eager to create global impact 🚀\n* Fluent in English 🗣️\n\n**📅 Deadline: 01 October 2026 ⏰**',
  //       type: "Job",
  //       organizationId: "b9653e67-115e-4dc5-872f-5b890cb647e1",
  //       organizationName: "UNICEF Nigeria",
  //       organizationLogoURL:
  //         "https://yoma-v3-public-storage.s3.eu-west-1.amazonaws.com/production/photos/6336d29c-8b16-44eb-9973-1fb07a4e44d8.png",
  //       summary:
  //         "Ready to use your digital skills 💻🌍 for global impact 🚀? Join United Nations Development Programme AI & Innovation internship 🤖📊 anywhere in th",
  //       instructions: null,
  //       url: "https://estm.fa.em2.oraclecloud.com/hcmUI/CandidateExperience/en/sites/CX_1/job/33001",
  //       zltoReward: null,
  //       zltoRewardEstimate: null,
  //       zltoRewardCumulative: null,
  //       yomaReward: null,
  //       yomaRewardEstimate: null,
  //       yomaRewardCumulative: null,
  //       verificationEnabled: false,
  //       verificationMethod: null,
  //       difficulty: "Any Level",
  //       commitmentInterval: "Minute",
  //       commitmentIntervalCount: 20,
  //       commitmentIntervalDescription: "20 Minutes",
  //       participantLimit: null,
  //       participantCountCompleted: 0,
  //       participantCountPending: 0,
  //       participantCountTotal: 0,
  //       participantLimitReached: false,
  //       countViewed: 2671,
  //       countNavigatedExternalLink: 1617,
  //       statusId: "b99d26d7-a4b0-4a38-b35d-ae2d379a414e",
  //       status: "Active",
  //       keywords: [
  //         "digital",
  //         "AI",
  //         "Innovation",
  //         "data",
  //         "research",
  //         "policy",
  //         "communication",
  //         "partnerships",
  //         "product design",
  //         "knowledge",
  //         "management",
  //         "Capacity",
  //         "Building",
  //         "System",
  //         "Thinking",
  //         "Governance",
  //         "Analytics",
  //         "Internship",
  //         "UNDP",
  //         "remote",
  //         "Global",
  //         "yoma",
  //         "GenU",
  //         "9JA",
  //         "Nigeria",
  //         "UNICEF",
  //         "Intern",
  //         "Alert",
  //         "2026",
  //       ],
  //       dateStart: "2026-04-29T00:00:00+00:00",
  //       dateEnd: "2026-10-01T23:59:59.999+00:00",
  //       featured: false,
  //       engagementType: "Online",
  //       shareWithPartners: true,
  //       hidden: false,
  //       published: true,
  //       yomaInfoURL:
  //         "https://yoma.world/opportunities/019ddb4a-0f1d-7897-93ac-b4532bd77273",
  //       isCompletable: false,
  //       nonCompletableReason:
  //         "Opportunity 'Global Internship with UN: Digital, AI & Innovation (DAI)' cannot be completed because verification is not enabled, 'Manual' verification is required",
  //       syncedInfo: null,
  //       categories: [
  //         {
  //           id: "1dc39a5d-e049-4cfe-b708-855fce97b86e",
  //           name: "AI, Data and Analytics",
  //           imageURL:
  //             "https://yoma-v3-public-storage.s3.eu-west-1.amazonaws.com/opportunity/category/AIDataAndAnalytics.svg",
  //           count: null,
  //         },
  //         {
  //           id: "89f4ab46-0767-494f-a18c-3037f698133a",
  //           name: "Career and Personal Development",
  //           imageURL:
  //             "https://yoma-v3-public-storage.s3.eu-west-1.amazonaws.com/opportunity/category/CareerAndPersonalDevelopment.svg",
  //           count: null,
  //         },
  //         {
  //           id: "7afb66ad-164e-46a3-933f-a0bac1ca1923",
  //           name: "Creative Industry and Arts",
  //           imageURL:
  //             "https://yoma-v3-public-storage.s3.eu-west-1.amazonaws.com/opportunity/category/CreativeIndustryAndArts.svg",
  //           count: null,
  //         },
  //         {
  //           id: "d0d322ab-d1d7-44b6-94e8-7b85246aa42e",
  //           name: "Environment and Climate",
  //           imageURL:
  //             "https://yoma-v3-public-storage.s3.eu-west-1.amazonaws.com/opportunity/category/EnvironmentAndClimate.svg",
  //           count: null,
  //         },
  //         {
  //           id: "6e6a5f23-6d2e-4f45-8b4d-5d9c9a6b1e71",
  //           name: "Health and Care",
  //           imageURL:
  //             "https://yoma-v3-public-storage.s3.eu-west-1.amazonaws.com/opportunity/category/HealthAndCare.svg",
  //           count: null,
  //         },
  //         {
  //           id: "b89c5e91-9cbb-4a0e-991f-f987eebf9b70",
  //           name: "Other",
  //           imageURL:
  //             "https://yoma-v3-public-storage.s3.eu-west-1.amazonaws.com/opportunity/category/Other.svg",
  //           count: null,
  //         },
  //         {
  //           id: "fa564c1c-591a-4a6d-8294-20165da8866b",
  //           name: "Technology and Digitization",
  //           imageURL:
  //             "https://yoma-v3-public-storage.s3.eu-west-1.amazonaws.com/opportunity/category/TechnologyAndDigitization.svg",
  //           count: null,
  //         },
  //       ],
  //       countries: [
  //         {
  //           id: "2ba19f1d-998f-40ee-9af6-c6ab562e3040",
  //           name: "Nigeria",
  //           codeAlpha2: "NG",
  //           codeAlpha3: "NGA",
  //           codeNumeric: "566",
  //         },
  //       ],
  //       languages: [
  //         {
  //           id: "867b61f1-d669-4a2c-bf22-65ebd084d0cd",
  //           name: "English",
  //           codeAlpha2: "EN",
  //         },
  //       ],
  //       skills: [
  //         {
  //           id: "c5003583-3132-402f-a126-7a792db52250",
  //           name: "Artificial Intelligence",
  //           infoURL:
  //             "https://lightcast.io/open-skills/skills/KS120BV6SR75RBKQH0G3",
  //         },
  //         {
  //           id: "d9db10a8-e205-4ebf-bfd0-59592d281429",
  //           name: "Capacity Development",
  //           infoURL:
  //             "https://lightcast.io/open-skills/skills/KS121CN799XDTLT095QW",
  //         },
  //         {
  //           id: "6ec84000-107c-438f-b203-e6b7f9f8cf49",
  //           name: "Content Creation",
  //           infoURL:
  //             "https://lightcast.io/open-skills/skills/KS122BL6107G2Z27JWJW",
  //         },
  //         {
  //           id: "f6774c2e-af99-4cf4-8104-d99bb0bf549c",
  //           name: "Data Analysis",
  //           infoURL:
  //             "https://lightcast.io/open-skills/skills/KS120GV6C72JMSZKMTD7",
  //         },
  //         {
  //           id: "f9802eee-dca7-4625-ba4c-29edd41091ba",
  //           name: "Data Visualization",
  //           infoURL:
  //             "https://lightcast.io/open-skills/skills/KS122Q960QYMW3YH0YWF",
  //         },
  //         {
  //           id: "06804adb-41b0-4460-83a2-2cffe64af2a1",
  //           name: "Digital Literacy",
  //           infoURL:
  //             "https://lightcast.io/open-skills/skills/ESB04BCB6189A2CB271E",
  //         },
  //         {
  //           id: "83e42a8b-fd1f-4e1f-9def-8d58a8c6eb07",
  //           name: "Information Governance",
  //           infoURL:
  //             "https://lightcast.io/open-skills/skills/KS1254G5Z1VFXH167CVB",
  //         },
  //         {
  //           id: "c1dd3543-8f1b-473b-921c-1024f9542746",
  //           name: "Knowledge Management",
  //           infoURL:
  //             "https://lightcast.io/open-skills/skills/KS125ND687ZNB659FK3Z",
  //         },
  //         {
  //           id: "b50d5aa7-7951-4778-bfdc-c2f2d6f89beb",
  //           name: "Partner Development",
  //           infoURL:
  //             "https://lightcast.io/open-skills/skills/KS127L06ZGYKW2BYFVWD",
  //         },
  //         {
  //           id: "ab29c4e6-8460-495c-a13b-2f844be364a3",
  //           name: "Policy Development",
  //           infoURL:
  //             "https://lightcast.io/open-skills/skills/ES7AC98A03E7159112B5",
  //         },
  //         {
  //           id: "52d3e9ff-010b-4812-b2a3-b79b6e2b2cb2",
  //           name: "Project Coordination",
  //           infoURL:
  //             "https://lightcast.io/open-skills/skills/KS1284B609S18XT8N058",
  //         },
  //         {
  //           id: "82f933c4-f82a-40d8-9d30-c32479ad44d8",
  //           name: "Research And Development",
  //           infoURL:
  //             "https://lightcast.io/open-skills/skills/KS128BK6JSSHNT5QDPMX",
  //         },
  //         {
  //           id: "15426e2d-efd4-41c3-89ef-7c794fb0c11e",
  //           name: "Strategic Communication",
  //           infoURL:
  //             "https://lightcast.io/open-skills/skills/KS440ZZ6HM0NG5586DTZ",
  //         },
  //       ],
  //       verificationTypes: [],
  //     },
  //   ],
  //   totalCount: 2471,
  // };

  const appendLandingCountryToUrl = useCallback(
    (url: string) => {
      if (!landingCountryEnabled) return url;

      if (url.includes("countryScope=")) return url;
      const separator = url.includes("?") ? "&" : "?";

      return `${url}${separator}countryScope=my`;
    },
    [landingCountryEnabled],
  );

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
      if (startRow > (opportunities_trending_landing?.totalCount ?? 0)) {
        return {
          items: [],
          totalCount: 0,
        };
      }

      const pageNumber = Math.ceil(startRow / PAGE_SIZE_MINIMUM);

      return fetchDataAndUpdateCache(
        ["trending", landingCacheKey, pageNumber.toString()],
        {
          pageNumber: pageNumber,
          pageSize: PAGE_SIZE_MINIMUM,
          categories: null,
          countries: landingCountryIds,
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
        },
      );
    },
    [
      fetchDataAndUpdateCache,
      landingCacheKey,
      landingCountryIds,
      opportunities_trending_landing,
    ],
  );

  const loadDataLearning = useCallback(
    async (startRow: number) => {
      if (startRow > (opportunities_learning_landing?.totalCount ?? 0)) {
        return {
          items: [],
          totalCount: 0,
        };
      }

      const pageNumber = Math.ceil(startRow / PAGE_SIZE_MINIMUM);

      return fetchDataAndUpdateCache(
        ["learning", landingCacheKey, pageNumber.toString()],
        {
          pageNumber: pageNumber,
          pageSize: PAGE_SIZE_MINIMUM,
          categories: null,
          countries: landingCountryIds,
          languages: null,
          types: [OPPORTUNITY_TYPE_ID_LEARNING],
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
    [
      fetchDataAndUpdateCache,
      landingCacheKey,
      landingCountryIds,
      opportunities_learning_landing,
    ],
  );

  const loadDataTasks = useCallback(
    async (startRow: number) => {
      if (startRow > (opportunities_tasks_landing?.totalCount ?? 0)) {
        return {
          items: [],
          totalCount: 0,
        };
      }

      const pageNumber = Math.ceil(startRow / PAGE_SIZE_MINIMUM);

      return fetchDataAndUpdateCache(
        ["tasks", landingCacheKey, pageNumber.toString()],
        {
          pageNumber: pageNumber,
          pageSize: PAGE_SIZE_MINIMUM,
          categories: null,
          countries: landingCountryIds,
          languages: null,
          types: [OPPORTUNITY_TYPE_ID_MICROTASK],
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
    [
      fetchDataAndUpdateCache,
      landingCacheKey,
      landingCountryIds,
      opportunities_tasks_landing,
    ],
  );

  const loadDataEvents = useCallback(
    async (startRow: number) => {
      if (startRow > (opportunities_events_landing?.totalCount ?? 0)) {
        return {
          items: [],
          totalCount: 0,
        };
      }

      const pageNumber = Math.ceil(startRow / PAGE_SIZE_MINIMUM);

      return fetchDataAndUpdateCache(
        ["events", landingCacheKey, pageNumber.toString()],
        {
          pageNumber: pageNumber,
          pageSize: PAGE_SIZE_MINIMUM,
          categories: null,
          countries: landingCountryIds,
          languages: null,
          types: [OPPORTUNITY_TYPE_ID_EVENT],
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
    [
      fetchDataAndUpdateCache,
      landingCacheKey,
      landingCountryIds,
      opportunities_events_landing,
    ],
  );

  const loadDataOther = useCallback(
    async (startRow: number) => {
      if (startRow > (opportunities_other_landing?.totalCount ?? 0)) {
        return {
          items: [],
          totalCount: 0,
        };
      }

      const pageNumber = Math.ceil(startRow / PAGE_SIZE_MINIMUM);

      return fetchDataAndUpdateCache(
        ["other", landingCacheKey, pageNumber.toString()],
        {
          pageNumber: pageNumber,
          pageSize: PAGE_SIZE_MINIMUM,
          categories: null,
          countries: landingCountryIds,
          languages: null,
          types: [OPPORTUNITY_TYPE_ID_OTHER],
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
    [
      fetchDataAndUpdateCache,
      landingCacheKey,
      landingCountryIds,
      opportunities_other_landing,
    ],
  );

  const loadDataJobs = useCallback(
    async (startRow: number) => {
      if (startRow > (opportunities_jobs_landing?.totalCount ?? 0)) {
        return {
          items: [],
          totalCount: 0,
        };
      }

      const pageNumber = Math.ceil(startRow / PAGE_SIZE_MINIMUM);

      return fetchDataAndUpdateCache(
        ["jobs", landingCacheKey, pageNumber.toString()],
        {
          pageNumber: pageNumber,
          pageSize: PAGE_SIZE_MINIMUM,
          categories: null,
          countries: landingCountryIds,
          languages: null,
          types: [OPPORTUNITY_TYPE_ID_JOB],
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
    [
      fetchDataAndUpdateCache,
      landingCacheKey,
      landingCountryIds,
      opportunities_jobs_landing,
    ],
  );

  const loadDataOpportunities = useCallback(
    async (startRow: number) => {
      if (
        startRow > (opportunities_allOpportunities_landing?.totalCount ?? 0)
      ) {
        return {
          items: [],
          totalCount: 0,
        };
      }

      const pageNumber = Math.ceil(startRow / PAGE_SIZE_MINIMUM);

      return fetchDataAndUpdateCache(
        ["allOpportunities", landingCacheKey, pageNumber.toString()],
        {
          pageNumber: pageNumber,
          pageSize: PAGE_SIZE_MINIMUM,
          categories: null,
          countries: landingCountryIds,
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
    [
      fetchDataAndUpdateCache,
      landingCacheKey,
      landingCountryIds,
      opportunities_allOpportunities_landing,
    ],
  );

  const loadDataMostCompleted = useCallback(
    async (startRow: number) => {
      if (startRow > (opportunities_mostCompleted_landing?.totalCount ?? 0)) {
        return {
          items: [],
          totalCount: 0,
        };
      }

      const pageNumber = Math.ceil(startRow / PAGE_SIZE_MINIMUM);

      return fetchDataAndUpdateCache(
        ["mostCompleted", landingCacheKey, pageNumber.toString()],
        {
          pageNumber: pageNumber,
          pageSize: PAGE_SIZE_MINIMUM,
          categories: null,
          countries: landingCountryIds,
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
        },
      );
    },
    [
      fetchDataAndUpdateCache,
      landingCacheKey,
      landingCountryIds,
      opportunities_mostCompleted_landing,
    ],
  );

  const loadDataFeatured = useCallback(
    async (startRow: number) => {
      if (startRow > (opportunities_featured_landing?.totalCount ?? 0)) {
        return {
          items: [],
          totalCount: 0,
        };
      }

      const pageNumber = Math.ceil(startRow / PAGE_SIZE_MINIMUM);

      return fetchDataAndUpdateCache(
        ["featured", landingCacheKey, pageNumber.toString()],
        {
          pageNumber: pageNumber,
          pageSize: PAGE_SIZE_MINIMUM,
          categories: null,
          countries: landingCountryIds,
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
        },
      );
    },
    [
      fetchDataAndUpdateCache,
      landingCacheKey,
      landingCountryIds,
      opportunities_featured_landing,
    ],
  );

  const loadDataOpportunitiesForUserCountry = useCallback(
    async (startRow: number) => {
      if (startRow > (opportunities_user_country?.totalCount ?? 0)) {
        return {
          items: [],
          totalCount: 0,
        };
      }
      if (!userCountryInfo?.id) return null;

      const pageNumber = Math.ceil(startRow / PAGE_SIZE_MINIMUM);

      return fetchDataAndUpdateCache(
        ["opportunitiesForUserCountry", pageNumber.toString()],
        {
          pageNumber: pageNumber,
          pageSize: PAGE_SIZE_MINIMUM,
          categories: null,
          countries: [userCountryInfo.id],
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
    [opportunities_user_country, userCountryInfo?.id, fetchDataAndUpdateCache],
  );

  return (
    <>
      <Head>
        <title>Yoma | 🏆 Opportunities</title>
      </Head>

      <PageBackground className="h-[310px]" />
      <FilterTab openFilter={setFilterFullWindowVisible} />

      {/* REFERENCE FOR FILTER POPUP: fix menu z-index issue */}
      <div ref={myRef} />

      {/* POPUP FILTER */}
      <CustomModal
        isOpen={filterFullWindowVisible}
        shouldCloseOnOverlayClick={true}
        onRequestClose={() => {
          setFilterFullWindowVisible(false);
        }}
        className="md:max-h-[800px] md:w-[700px]"
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
            initialMyCountryOnly={landingMyCountryOnly}
            onApplyMyCountryOnly={(checked) => setLandingMyCountryOnly(checked)}
            submitButtonText="Apply Filters"
            onCancel={onCloseFilter}
            onSubmit={(e, myCountryOnly) => {
              if (typeof myCountryOnly === "boolean") {
                setLandingMyCountryOnly(myCountryOnly);
              }
              onSubmitFilter(e, myCountryOnly);
            }}
            onClear={onClearFilter}
            clearButtonText="Clear All Filters"
            userProfile={userProfile}
          />
        )}
      </CustomModal>

      <div className="z-10 container mt-16 w-full overflow-hidden px-2 py-1 md:mt-20 md:max-w-7xl md:py-4">
        <div className="mb-3 flex flex-col items-center justify-center gap-2 pt-6 text-white md:mb-9">
          <h3 className="w-[300px] grow flex-wrap text-center text-xl font-semibold md:w-full md:text-2xl">
            Find <span className="text-orange mx-2">opportunities</span> to
            <span className="text-orange mx-2">unlock</span> your future.
          </h3>

          <AnimatedText sentences={oppTypeDescriptions} />

          <div className="w-full px-2 md:w-[600px] md:items-center md:justify-center">
            <div className="mt-1 mb-8 flex flex-row items-center justify-center md:mt-8 md:mb-4">
              <OppSearchInputLarge
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

        <div className="flex flex-col">
          <div className="flex flex-col gap-2">
            {/* FILTER: CATEGORIES */}
            <OpportunityCategoriesHorizontalFilter
              lookups_categories={lookups_categories}
              selected_categories={searchFilter?.categories}
              onClick={onClickCategoryFilter}
              className="justify-center"
            />

            {/* FILTER: MESSAGE */}
            <div className="w-full px-2 md:px-4">
              <div className="mx-auto flex w-full flex-col md:max-w-7xl">
                <div className="flex flex-wrap items-baseline gap-x-2">
                  <div className="font-family-nunito max-w-full overflow-hidden text-base font-semibold text-ellipsis whitespace-nowrap text-black md:text-lg">
                    {filtersPanelTitle}
                  </div>
                </div>
                <div className="text-gray-dark text-sm md:text-base">
                  {appliedFilterBadgeCount > 0 ? (
                    <>
                      {"We're currently showing results for "}
                      {filtersPanelScopeText}
                      {". Click a badge to remove or "}
                      <button
                        type="button"
                        className="link"
                        onClick={() => setFilterFullWindowVisible(true)}
                      >
                        open the filters
                      </button>
                      {" for more..."}
                    </>
                  ) : (
                    <>
                      {"We currently showing results for "}
                      {filtersPanelScopeText}
                      {" - "}
                      <button
                        type="button"
                        className="link"
                        onClick={() => setFilterFullWindowVisible(true)}
                      >
                        open the filters
                      </button>
                      {" for more..."}
                    </>
                  )}
                </div>

                {appliedFilterBadgeCount > 0 && (
                  <FilterBadges
                    searchFilter={searchFilter}
                    excludeKeys={filterBadgeExcludeKeys}
                    className="mt-2 -ml-2 md:mt-4"
                    resolveValue={(key, value) => {
                      if (key === "commitmentInterval") {
                        const lookup = lookups_timeIntervals.find(
                          (interval) => interval.id === value.interval.id,
                        );
                        return `${value.interval.count} ${
                          value.interval.count > 1
                            ? lookup?.name + "s"
                            : lookup?.name
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
                )}
              </div>
            </div>
          </div>

          {/* NO SEARCH, SHOW LANDING PAGE (POPULAR, LATEST, ALL etc)*/}
          {!isSearchPerformed && (
            <div className="px-2 md:px-4">
              {/* LOADING OVERLAY FOR LANDING CAROUSELS (does not affect layout height) */}
              {landingOverlayActive && (
                <LoadingSkeleton rows={1} className="p-4" />
              )}

              {/* CAROUSELS (kept mounted; hidden while overlay is active) */}
              <div className={landingOverlayActive ? "invisible" : ""}>
                <div className="flex flex-col gap-2">
                  {/* JOBS */}
                  <div className="divider !bg-gray" />
                  {(opportunities_jobs_render?.totalCount ?? 0) > 0 ? (
                    <CustomCarouselV3
                      id={`opportunities_jobs`}
                      className="border-purple from-purple-tint to-purple-tint/40 rounded-2xl border-2 bg-gradient-to-br p-4 md:p-6"
                      badgeText="Jobs · New"
                      badgeIcon={<IoBriefcase className="mr-2 size-3" />}
                      subTextAvailable={`${opportunities_jobs_render.totalCount} ${
                        opportunities_jobs_render.totalCount === 1
                          ? "job"
                          : "jobs"
                      } available`}
                      title="Jobs in your area"
                      subtitle={
                        sessionStatus === "authenticated" &&
                        landingMyCountryOnly &&
                        userCountryInfo
                          ? `${userCountryInfo.name} & Worldwide`
                          : "Worldwide"
                      }
                      viewAllUrl={appendLandingCountryToUrl(
                        "/opportunities?types=Job",
                      )}
                      data={opportunities_jobs_render.items}
                      loadData={loadDataJobs}
                      totalAll={opportunities_jobs_render.totalCount!}
                      renderSlide={(item, index) => (
                        <OpportunityPublicSmallComponentV2
                          key={`opportunities_jobs_${item.id}_${index}`}
                          data={item}
                          variant="job"
                        />
                      )}
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-2 rounded-lg bg-white p-8 text-center">
                      <p className="text-gray-dark font-semibold">
                        New jobs coming soon... 💼
                      </p>
                      <p className="text-gray-dark text-sm">
                        Check back later for exciting job opportunities.
                      </p>
                    </div>
                  )}

                  {/* OPPORTUNITIES FOR USER'S COUNTRY - ONLY FOR LOGGED-IN USERS */}
                  {sessionStatus === "authenticated" &&
                    landingMyCountryOnly &&
                    userCountryInfo &&
                    (opportunities_user_country?.totalCount ?? 0) > 0 && (
                      <>
                        <div className="divider !bg-gray" />
                        <CustomCarouselV3
                          id={`opportunities_user_country`}
                          // badgeText="Local"
                          // badgeClassName="bg-purple text-white"
                          title={`Opportunities in ${userCountryInfo.name}`}
                          description="Explore opportunities in your country"
                          viewAllUrl={appendLandingCountryToUrl(
                            "/opportunities?page=1",
                          )}
                          viewAllText={`See All (${opportunities_user_country!.totalCount}) →`}
                          data={opportunities_user_country!.items}
                          loadData={loadDataOpportunitiesForUserCountry}
                          totalAll={opportunities_user_country!.totalCount!}
                          renderSlide={(item, index) => (
                            <OpportunityPublicSmallComponentV2
                              key={`opportunities_user_country_${item.id}_${index}`}
                              data={item}
                            />
                          )}
                        />
                      </>
                    )}

                  {/* FEATURED */}
                  {(opportunities_featured_render?.totalCount ?? 0) > 0 && (
                    <>
                      <div className="divider !bg-gray" />
                      <CustomCarouselV3
                        id={`opportunities_featured`}
                        // badgeText="Featured"
                        // badgeClassName="bg-orange text-white"
                        title="Featured"
                        description="Explore our featured opportunities"
                        viewAllUrl={appendLandingCountryToUrl(
                          "/opportunities?featured=true",
                        )}
                        viewAllText={`See All (${opportunities_featured_render.totalCount}) →`}
                        data={opportunities_featured_render.items}
                        loadData={loadDataFeatured}
                        totalAll={opportunities_featured_render.totalCount!}
                        renderSlide={(item, index) => (
                          <OpportunityPublicSmallComponentV2
                            key={`opportunities_featured_${item.id}_${index}`}
                            data={item}
                          />
                        )}
                      />
                    </>
                  )}

                  {/* NEW */}
                  {(opportunities_allOpportunities_render?.totalCount ?? 0) >
                    0 && (
                    <>
                      <div className="divider !bg-gray" />
                      <CustomCarouselV3
                        id={`opportunities_newOpportunities`}
                        //badgeText="New"
                        //badgeClassName="bg-green text-white"
                        title="New"
                        description="Fresh opportunities, updated daily"
                        viewAllUrl={appendLandingCountryToUrl(
                          "/opportunities?page=1",
                        )}
                        viewAllText={`See All (${opportunities_allOpportunities_render.totalCount}) →`}
                        data={opportunities_allOpportunities_render.items}
                        loadData={loadDataOpportunities}
                        totalAll={
                          opportunities_allOpportunities_render.totalCount!
                        }
                        renderSlide={(item, index) => (
                          <OpportunityPublicSmallComponentV2
                            key={`opportunities_newOpportunities_${item.id}_${index}`}
                            data={item}
                          />
                        )}
                      />
                    </>
                  )}

                  {/* TRENDING */}
                  {(opportunities_trending_render?.totalCount ?? 0) > 0 && (
                    <>
                      <div className="divider !bg-gray" />
                      <CustomCarouselV3
                        id={`opportunities_trending`}
                        // badgeText="Trending"
                        // badgeClassName="bg-blue text-white"
                        title="Trending"
                        description="The most viewed opportunities"
                        viewAllUrl={appendLandingCountryToUrl(
                          "/opportunities?mostViewed=true",
                        )}
                        viewAllText={`See All (${opportunities_trending_render.totalCount}) →`}
                        data={opportunities_trending_render.items}
                        loadData={loadDataTrending}
                        totalAll={opportunities_trending_render.totalCount!}
                        renderSlide={(item, index) => (
                          <OpportunityPublicSmallComponentV2
                            key={`opportunities_trending_${item.id}_${index}`}
                            data={item}
                          />
                        )}
                      />
                    </>
                  )}

                  {/* MOST COMPLETED */}
                  {(opportunities_mostCompleted_render?.totalCount ?? 0) >
                    0 && (
                    <>
                      <div className="divider !bg-gray" />
                      <CustomCarouselV3
                        id={`opportunities_mostCompleted`}
                        // badgeText="Popular"
                        // badgeClassName="bg-purple text-white"
                        title="Popular"
                        description="The most completed opportunities"
                        viewAllUrl={appendLandingCountryToUrl(
                          "/opportunities?mostCompleted=true",
                        )}
                        viewAllText={`See All (${opportunities_mostCompleted_render.totalCount}) →`}
                        data={opportunities_mostCompleted_render.items}
                        loadData={loadDataMostCompleted}
                        totalAll={
                          opportunities_mostCompleted_render.totalCount!
                        }
                        renderSlide={(item, index) => (
                          <OpportunityPublicSmallComponentV2
                            key={`opportunities_mostCompleted_${item.id}_${index}`}
                            data={item}
                          />
                        )}
                      />
                    </>
                  )}

                  {/* LEARNING COURSES */}
                  {(opportunities_learning_render?.totalCount ?? 0) > 0 && (
                    <>
                      <div className="divider !bg-gray" />
                      <CustomCarouselV3
                        id={`opportunities_learning`}
                        // badgeText="Learning"
                        // badgeClassName="bg-green text-white"
                        title="Learning Courses"
                        description="Discover exciting online courses"
                        viewAllUrl={appendLandingCountryToUrl(
                          "/opportunities?types=Learning",
                        )}
                        viewAllText={`See All (${opportunities_learning_render.totalCount}) →`}
                        data={opportunities_learning_render.items}
                        loadData={loadDataLearning}
                        totalAll={opportunities_learning_render.totalCount!}
                        renderSlide={(item, index) => (
                          <OpportunityPublicSmallComponentV2
                            key={`opportunities_learning_${item.id}_${index}`}
                            data={item}
                          />
                        )}
                      />
                    </>
                  )}

                  {/* TASKS */}
                  {(opportunities_tasks_render?.totalCount ?? 0) > 0 && (
                    <>
                      <div className="divider !bg-gray" />
                      <CustomCarouselV3
                        id={`opportunities_tasks`}
                        // badgeText="Micro-task"
                        // badgeClassName="bg-orange text-white"
                        title="Micro-tasks"
                        description="Contribute to real-world projects"
                        viewAllUrl={appendLandingCountryToUrl(
                          "/opportunities?types=Micro-task",
                        )}
                        viewAllText={`See All (${opportunities_tasks_render.totalCount}) →`}
                        data={opportunities_tasks_render.items}
                        loadData={loadDataTasks}
                        totalAll={opportunities_tasks_render.totalCount!}
                        renderSlide={(item, index) => (
                          <OpportunityPublicSmallComponentV2
                            key={`opportunities_tasks_${item.id}_${index}`}
                            data={item}
                          />
                        )}
                      />
                    </>
                  )}

                  {/* EVENTS */}
                  {(opportunities_events_render?.totalCount ?? 0) > 0 && (
                    <>
                      <div className="divider !bg-gray" />
                      <CustomCarouselV3
                        id={`opportunities_events`}
                        // badgeText="Event"
                        // badgeClassName="bg-blue text-white"
                        title="Events"
                        description="Explore events to attend"
                        viewAllUrl={appendLandingCountryToUrl(
                          "/opportunities?types=Event",
                        )}
                        viewAllText={`See All (${opportunities_events_render.totalCount}) →`}
                        data={opportunities_events_render.items}
                        loadData={loadDataEvents}
                        totalAll={opportunities_events_render.totalCount!}
                        renderSlide={(item, index) => (
                          <OpportunityPublicSmallComponentV2
                            key={`opportunities_events_${item.id}_${index}`}
                            data={item}
                          />
                        )}
                      />
                    </>
                  )}

                  {/* OTHER */}
                  {(opportunities_other_render?.totalCount ?? 0) > 0 && (
                    <>
                      <div className="divider !bg-gray" />
                      <CustomCarouselV3
                        id={`opportunities_other`}
                        // badgeText="Other"
                        // badgeClassName="bg-gray-dark text-white"
                        title="Other"
                        description="Explore other opportunities"
                        viewAllUrl={appendLandingCountryToUrl(
                          "/opportunities?types=Other",
                        )}
                        viewAllText={`See All (${opportunities_other_render.totalCount}) →`}
                        data={opportunities_other_render.items}
                        loadData={loadDataOther}
                        totalAll={opportunities_other_render.totalCount!}
                        renderSlide={(item, index) => (
                          <OpportunityPublicSmallComponentV2
                            key={`opportunities_other_${item.id}_${index}`}
                            data={item}
                          />
                        )}
                      />
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* SEARCH PERFORMED, SHOW RESULTS */}
          {isSearchPerformed && (
            <div id="results" className="pb-8x px-2 md:px-4">
              <div className="divider !bg-gray" />

              <div className="flex w-full flex-col gap-2">
                {/* RESULTS HEADER */}
                <div className="w-full">
                  <div className="mx-auto flex w-full flex-col md:max-w-7xl">
                    <div className="font-family-nunito max-w-full overflow-hidden text-base font-semibold text-ellipsis whitespace-nowrap text-black md:text-lg">
                      {searchResults
                        ? `Results (${searchResults.totalCount})`
                        : "Results"}
                    </div>
                  </div>
                </div>

                {(isRouteTransitioning ||
                  sessionStatus === "loading" ||
                  isLoading ||
                  isSearchScopePending) && (
                  <LoadingSkeleton rows={3} className="p-4" />
                )}

                {!isRouteTransitioning &&
                  sessionStatus !== "loading" &&
                  !isLoading &&
                  !isSearchScopePending && (
                    <>
                      {/* NO ROWS */}
                      {searchResults && searchResults.items.length === 0 && (
                        <NoRowsMessage
                          className="!h-60"
                          title={"No opportunities found"}
                          description={
                            "Please try refining your search query or filters above."
                          }
                        />
                      )}

                      {/* GRID */}
                      {searchResults && searchResults.items.length > 0 && (
                        <OpportunitiesGrid
                          id="opportunities_search"
                          data={searchResults}
                          loadData={loadDataTrending}
                        />
                      )}

                      {/* PAGINATION */}
                      {searchResults &&
                        (searchResults.totalCount as number) > 0 && (
                          <div className="my-4 grid place-items-center justify-center">
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
                    </>
                  )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

Opportunities.getLayout = function getLayout(page: ReactElement) {
  return <MainLayout>{page}</MainLayout>;
};

export default Opportunities;
