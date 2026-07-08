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
import { Action } from "~/api/models/myOpportunity";
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
import { searchMyOpportunities } from "~/api/services/myOpportunities";
import CustomCarousel from "~/components/Carousel/CustomCarousel";
import CustomCarouselV3 from "~/components/Carousel/CustomCarouselV3";
import CustomModal from "~/components/Common/CustomModal";
import FilterBadges from "~/components/FilterBadges";
import MainLayout from "~/components/Layout/Main";
import NoRowsMessage from "~/components/NoRowsMessage";
import AnimatedText from "~/components/Opportunity/AnimatedText";
import FilterTab from "~/components/Opportunity/FilterTab";
import { OpportunitiesGrid } from "~/components/Opportunity/OpportunitiesGrid";
import { OpportunityFilterVertical } from "~/components/Opportunity/OpportunityFilterVertical";
import {
  getEngagementConfig,
  getTypeConfig,
} from "~/components/Opportunity/opportunityTypeTheme";
import { OppSearchInputLarge } from "~/components/Opportunity/OppSearchInputLarge";
import { PageBackground } from "~/components/PageBackground";
import { PaginationButtons } from "~/components/PaginationButtons";
import { LoadingSkeleton } from "~/components/Status/LoadingSkeleton";
import {
  COUNTRY_CODE_WW,
  OPPORTUNITY_SEARCH_DESIGN_V2,
  OPPORTUNITY_TYPE_ID_EVENT,
  OPPORTUNITY_TYPE_ID_LEARNING,
  OPPORTUNITY_TYPE_ID_MICROTASK,
  PAGE_SIZE,
  PAGE_SIZE_MINIMUM,
  OPPORTUNITY_TYPE_ID_JOB,
} from "~/lib/constants";
import { currentLanguageAtom, userProfileAtom } from "~/lib/store";
import { type NextPageWithLayout } from "~/pages/_app";
import { OpportunityCategoryHorizontalCard } from "~/components/Opportunity/OpportunityCategoryHorizontalCard";
import { CustomSlider } from "~/components/Carousel";
import Link from "next/link";
import { IoMdHeart } from "react-icons/io";
import { OpportunityPublicSmallComponent } from "~/components/Opportunity/OpportunityPublicSmall";

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
      opportunities_mostCompleted,
      opportunities_learning,
      opportunities_tasks,
      opportunities_events,
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
  opportunities_mostCompleted: OpportunitySearchResultsInfo;
  opportunities_learning: OpportunitySearchResultsInfo;
  opportunities_tasks: OpportunitySearchResultsInfo;
  opportunities_events: OpportunitySearchResultsInfo;
  opportunities_jobs: OpportunitySearchResultsInfo;
  opportunities_allOpportunities: OpportunitySearchResultsInfo;
  lookups_categories: OpportunityCategory[];
  lookups_organisations: OrganizationInfo[];
  lookups_types: OpportunityType[];
  lookups_engagementTypes: EngagementType[];
  lookups_timeIntervals: TimeInterval[];
}> = ({
  opportunities_featured,
  opportunities_mostCompleted,
  opportunities_learning,
  opportunities_tasks,
  opportunities_events,
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
      isLoading_mostCompleted ||
      isLoading_learning ||
      isLoading_tasks ||
      isLoading_events ||
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

  const { data: savedOpportunities, isLoading: isLoadingSavedOpportunities } =
    useQuery({
      queryKey: ["myOpportunities", "saved", "preview"],
      queryFn: () =>
        searchMyOpportunities({
          action: Action.Saved,
          verificationStatuses: null,
          pageNumber: 1,
          pageSize: 1,
        }),
      enabled: sessionStatus === "authenticated",
    });

  const savedOpportunitiesItemCount = savedOpportunities?.items?.length ?? 0;
  const savedOpportunitiesCount =
    savedOpportunities?.totalCount ?? savedOpportunitiesItemCount;
  const shouldRenderSavedOpportunities =
    sessionStatus === "authenticated" &&
    !isLoadingSavedOpportunities &&
    savedOpportunitiesCount > 0;
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
        engagementTypes,
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

  const opportunities_jobs_landing = landingCountryEnabled
    ? (opportunities_jobs_country ?? EMPTY_RESULTS)
    : opportunities_jobs;

  const opportunities_featured_render = landingOverlayActive
    ? opportunities_featured
    : opportunities_featured_landing;

  const opportunities_allOpportunities_render = landingOverlayActive
    ? opportunities_allOpportunities
    : opportunities_allOpportunities_landing;

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

  const opportunities_jobs_render = landingOverlayActive
    ? opportunities_jobs
    : opportunities_jobs_landing;

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
            {/* FILTER: CATEGORIES (used to implement OpportunityCategoriesHorizontalFilter comp) */}
            <div className="relative ml-2 flex justify-center">
              <CustomSlider sliderClassName="pb-2" className="justify-center">
                {/* MY SAVED OPPORTUNITIES */}
                {shouldRenderSavedOpportunities && (
                  <Link
                    href="/yoid/opportunities/saved"
                    className="group border-orange flex aspect-square cursor-pointer flex-col items-center rounded-lg border-2 bg-orange-50 px-1 py-2 shadow-md transition-colors duration-200 select-none hover:bg-gray-50"
                  >
                    <div className="flex flex-col gap-2 md:gap-2">
                      <div className="flex items-center justify-center">
                        <div
                          className={`shadow-custom bg-orange flex aspect-square shrink-0 overflow-hidden rounded-full`}
                          style={{
                            width: 31,
                            height: 31,
                          }}
                        >
                          <IoMdHeart
                            className={`p-2 text-white`}
                            style={{
                              width: 31,
                              height: 31,
                            }}
                          />
                        </div>
                      </div>

                      <div className="flex grow flex-col gap-1">
                        <h1 className="min-h-8x line-clamp-2 w-28 text-center text-xs leading-tight font-semibold whitespace-normal text-black">
                          My Saved Opportunities
                        </h1>

                        <h6 className="font-boldx text-gray-dark text-center text-[10px]">
                          {isLoadingSavedOpportunities
                            ? "? opportunities"
                            : `${savedOpportunitiesCount} ${savedOpportunitiesCount === 1 ? "opportunity" : "opportunities"}`}
                        </h6>
                      </div>
                    </div>
                  </Link>
                )}

                {/* CATEGORIES */}
                {lookups_categories?.map((category) => (
                  <OpportunityCategoryHorizontalCard
                    key={category.id}
                    data={category}
                    selected={
                      searchFilter?.categories?.includes(category.name) ?? false
                    }
                    onClick={onClickCategoryFilter}
                  />
                ))}
              </CustomSlider>
            </div>

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
                    className="-ml-2"
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
                      } else if (key === "engagementTypes") {
                        return getEngagementConfig(value)?.label ?? value;
                      } else if (key === "types") {
                        return getTypeConfig(value).label;
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
                <LoadingSkeleton rows={4} columns={3} className="p-4" />
              )}

              {/* CAROUSELS (kept mounted; hidden while overlay is active) */}
              <div className={landingOverlayActive ? "invisible" : ""}>
                <div className="flex flex-col gap-2">
                  {OPPORTUNITY_SEARCH_DESIGN_V2 ? (
                    <>
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
                            <OpportunityPublicSmallComponent
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
                                <OpportunityPublicSmallComponent
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
                              <OpportunityPublicSmallComponent
                                key={`opportunities_featured_${item.id}_${index}`}
                                data={item}
                              />
                            )}
                          />
                        </>
                      )}

                      {/* NEW */}
                      {(opportunities_allOpportunities_render?.totalCount ??
                        0) > 0 && (
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
                              <OpportunityPublicSmallComponent
                                key={`opportunities_newOpportunities_${item.id}_${index}`}
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
                            title="Trending & Popular"
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
                              <OpportunityPublicSmallComponent
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
                              <OpportunityPublicSmallComponent
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
                            title="Tasks"
                            description="Contribute to real-world projects"
                            viewAllUrl={appendLandingCountryToUrl(
                              "/opportunities?types=Micro-task",
                            )}
                            viewAllText={`See All (${opportunities_tasks_render.totalCount}) →`}
                            data={opportunities_tasks_render.items}
                            loadData={loadDataTasks}
                            totalAll={opportunities_tasks_render.totalCount!}
                            renderSlide={(item, index) => (
                              <OpportunityPublicSmallComponent
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
                              <OpportunityPublicSmallComponent
                                key={`opportunities_events_${item.id}_${index}`}
                                data={item}
                              />
                            )}
                          />
                        </>
                      )}
                    </>
                  ) : (
                    <>
                      {/* === ORIGINAL pre-#1855 carousels (OPPORTUNITY_SEARCH_DESIGN_V2 = false) === */}
                      {/* No dedicated Jobs carousel in the original design; jobs appear within the generic carousels. */}
                      {sessionStatus === "authenticated" &&
                        landingMyCountryOnly &&
                        userCountryInfo &&
                        (opportunities_user_country?.totalCount ?? 0) > 0 && (
                          <>
                            <div className="divider !bg-gray" />
                            <CustomCarousel
                              id={`opportunities_user_country`}
                              title={`Opportunities in ${userCountryInfo.name} 🗺️`}
                              description="Explore opportunities in your country."
                              viewAllUrl={appendLandingCountryToUrl(
                                "/opportunities?page=1",
                              )}
                              data={opportunities_user_country!.items}
                              loadData={loadDataOpportunitiesForUserCountry}
                              totalAll={opportunities_user_country!.totalCount!}
                              renderSlide={(item, index) => (
                                <OpportunityPublicSmallComponent
                                  key={`opportunities_user_country_${item.id}_${index}`}
                                  data={item}
                                />
                              )}
                            />
                          </>
                        )}

                      {(opportunities_featured_render?.totalCount ?? 0) > 0 && (
                        <>
                          <div className="divider !bg-gray" />
                          <CustomCarousel
                            id={`opportunities_featured`}
                            title="Featured 🌟"
                            description="Explore our featured opportunities."
                            viewAllUrl={appendLandingCountryToUrl(
                              "/opportunities?featured=true",
                            )}
                            data={opportunities_featured_render.items}
                            loadData={loadDataFeatured}
                            totalAll={opportunities_featured_render.totalCount!}
                            renderSlide={(item, index) => (
                              <OpportunityPublicSmallComponent
                                key={`opportunities_featured_${item.id}_${index}`}
                                data={item}
                              />
                            )}
                          />
                        </>
                      )}

                      {(opportunities_allOpportunities_render?.totalCount ??
                        0) > 0 && (
                        <>
                          <div className="divider !bg-gray" />
                          <CustomCarousel
                            id={`opportunities_newOpportunities`}
                            title="New 🆕"
                            description="Fresh opportunities, updated daily."
                            viewAllUrl={appendLandingCountryToUrl(
                              "/opportunities?page=1",
                            )}
                            data={opportunities_allOpportunities_render.items}
                            loadData={loadDataOpportunities}
                            totalAll={
                              opportunities_allOpportunities_render.totalCount!
                            }
                            renderSlide={(item, index) => (
                              <OpportunityPublicSmallComponent
                                key={`opportunities_newOpportunities_${item.id}_${index}`}
                                data={item}
                              />
                            )}
                          />
                        </>
                      )}

                      {(opportunities_mostCompleted_render?.totalCount ?? 0) >
                        0 && (
                        <>
                          <div className="divider !bg-gray" />
                          <CustomCarousel
                            id={`opportunities_mostCompleted`}
                            title="Most completed 🏆"
                            description="The most completed opportunities."
                            viewAllUrl={appendLandingCountryToUrl(
                              "/opportunities?mostCompleted=true",
                            )}
                            data={opportunities_mostCompleted_render.items}
                            loadData={loadDataMostCompleted}
                            totalAll={
                              opportunities_mostCompleted_render.totalCount!
                            }
                            renderSlide={(item, index) => (
                              <OpportunityPublicSmallComponent
                                key={`opportunities_mostCompleted_${item.id}_${index}`}
                                data={item}
                              />
                            )}
                          />
                        </>
                      )}

                      {(opportunities_learning_render?.totalCount ?? 0) > 0 && (
                        <>
                          <div className="divider !bg-gray" />
                          <CustomCarousel
                            id={`opportunities_learning`}
                            title="Learning Courses 📚"
                            description="Discover exciting online courses."
                            viewAllUrl={appendLandingCountryToUrl(
                              "/opportunities?types=Learning",
                            )}
                            data={opportunities_learning_render.items}
                            loadData={loadDataLearning}
                            totalAll={opportunities_learning_render.totalCount!}
                            renderSlide={(item, index) => (
                              <OpportunityPublicSmallComponent
                                key={`opportunities_learning_${item.id}_${index}`}
                                data={item}
                              />
                            )}
                          />
                        </>
                      )}

                      {(opportunities_tasks_render?.totalCount ?? 0) > 0 && (
                        <>
                          <div className="divider !bg-gray" />
                          <CustomCarousel
                            id={`opportunities_tasks`}
                            title="Micro-tasks ⚡"
                            description="Contribute to real-world projects."
                            viewAllUrl={appendLandingCountryToUrl(
                              "/opportunities?types=Micro-task",
                            )}
                            data={opportunities_tasks_render.items}
                            loadData={loadDataTasks}
                            totalAll={opportunities_tasks_render.totalCount!}
                            renderSlide={(item, index) => (
                              <OpportunityPublicSmallComponent
                                key={`opportunities_tasks_${item.id}_${index}`}
                                data={item}
                              />
                            )}
                          />
                        </>
                      )}

                      {(opportunities_events_render?.totalCount ?? 0) > 0 && (
                        <>
                          <div className="divider !bg-gray" />
                          <CustomCarousel
                            id={`opportunities_events`}
                            title="Events 🎉"
                            description="Explore events to attend."
                            viewAllUrl={appendLandingCountryToUrl(
                              "/opportunities?types=Event",
                            )}
                            data={opportunities_events_render.items}
                            loadData={loadDataEvents}
                            totalAll={opportunities_events_render.totalCount!}
                            renderSlide={(item, index) => (
                              <OpportunityPublicSmallComponent
                                key={`opportunities_events_${item.id}_${index}`}
                                data={item}
                              />
                            )}
                          />
                        </>
                      )}
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
                  <LoadingSkeleton rows={4} columns={3} className="p-4" />
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
