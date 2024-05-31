import {
  QueryClient,
  dehydrate,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import Head from "next/head";
import { type ParsedUrlQuery } from "querystring";
import {
  useRef,
  type ReactElement,
  useState,
  useEffect,
  useCallback,
} from "react";
import "react-datepicker/dist/react-datepicker.css";
import { getOrganisationById } from "~/api/services/organisations";
import MainLayout from "~/components/Layout/Main";
import { authOptions } from "~/server/auth";
import { Unauthorized } from "~/components/Status/Unauthorized";
import type { NextPageWithLayout } from "~/pages/_app";
import { config } from "~/lib/react-query-config";
import LimitedFunctionalityBadge from "~/components/Status/LimitedFunctionalityBadge";
import { PageBackground } from "~/components/PageBackground";
import { IoMdPerson } from "react-icons/io";
import { useRouter } from "next/router";
import {
  searchOrganizationEngagement,
  searchOrganizationOpportunities,
  searchOrganizationYouth,
  searchOrganizationSso,
} from "~/api/services/organizationDashboard";
import type { GetServerSidePropsContext } from "next";
import type {
  OpportunitySearchResultsInfo,
  OpportunityCategory,
} from "~/api/models/opportunity";
import { getServerSession } from "next-auth";
import { Loading } from "~/components/Status/Loading";
import { OrganisationRowFilter } from "~/components/Organisation/Dashboard/OrganisationRowFilter";
import Link from "next/link";
import { getThemeFromRole } from "~/lib/utils";
import Image from "next/image";
import iconZlto from "public/images/icon-zlto-green.svg";
import iconBookmark from "public/images/icon-completions-green.svg";
import iconSkills from "public/images/icon-skills-green.svg";
import {
  CHART_COLORS,
  DATETIME_FORMAT_HUMAN,
  PAGE_SIZE,
  PAGE_SIZE_MINIMUM,
  ROLE_ADMIN,
} from "~/lib/constants";
import NoRowsMessage from "~/components/NoRowsMessage";
import { PaginationButtons } from "~/components/PaginationButtons";
import type {
  OrganizationSearchFilterOpportunity,
  OrganizationSearchFilterYouth,
  OrganizationSearchResultsOpportunity,
  OrganizationSearchResultsSummary,
  OrganizationSearchResultsYouth,
  OrganizationSearchSso,
} from "~/api/models/organizationDashboard";
import { LoadingSkeleton } from "~/components/Status/LoadingSkeleton";
import moment from "moment";
import {
  getCategoriesAdmin,
  getCountriesAdmin,
  searchCriteriaOpportunities,
} from "~/api/services/opportunities";
import { LineChart } from "~/components/Organisation/Dashboard/LineChart";
import { SkillsChart } from "~/components/Organisation/Dashboard/SkillsChart";
import { PieChart } from "~/components/Organisation/Dashboard/PieChart";
import axios from "axios";
import { InternalServerError } from "~/components/Status/InternalServerError";
import { Unauthenticated } from "~/components/Status/Unauthenticated";
import { AvatarImage } from "~/components/AvatarImage";
import DashboardCarousel from "~/components/Organisation/Dashboard/DashboardCarousel";
import { WorldMapChart } from "~/components/Organisation/Dashboard/WorldMapChart";
import type { Organization } from "~/api/models/organisation";
import { IoIosArrowBack, IoIosArrowForward } from "react-icons/io";
import { SsoChart } from "~/components/Organisation/Dashboard/SsoChart";
import type { Country } from "~/api/models/lookups";
import { EngagementRowFilter } from "~/components/Organisation/Dashboard/EngagementRowFilter";

export interface OrganizationSearchFilterSummaryViewModel {
  organization: string;
  opportunities: string[] | null;
  categories: string[] | null;
  startDate: string | null;
  endDate: string | null;
  pageSelectedOpportunities: number;
  pageCompletedYouth: number;
  countries: string[] | null;
}

interface IParams extends ParsedUrlQuery {
  id: string;
}

// ⚠️ SSR
export async function getServerSideProps(context: GetServerSidePropsContext) {
  const { id } = context.params as IParams;
  const { opportunities } = context.query;

  const session = await getServerSession(context.req, context.res, authOptions);
  let errorCode = null;

  // 👇 ensure authenticated
  if (!session) {
    return {
      props: {
        error: 401,
      },
    };
  }
  // 👇 set theme based on role
  const theme = getThemeFromRole(session, id);

  const queryClient = new QueryClient(config);
  let lookups_selectedOpportunities;

  try {
    const dataCategories = await getCategoriesAdmin(id, context);
    const dataOrganisation = await getOrganisationById(id, context);

    // 👇 prefetch queries on server
    await Promise.all([
      await queryClient.prefetchQuery({
        queryKey: ["OrganisationDashboardCategories", id],
        queryFn: () => dataCategories,
      }),
      await queryClient.prefetchQuery({
        queryKey: ["organisation", id],
        queryFn: () => dataOrganisation,
      }),
    ]);

    // HACK: lookup each of the opportunities (to resolve ids to titles for filter badges)
    if (opportunities) {
      lookups_selectedOpportunities = await searchCriteriaOpportunities(
        {
          opportunities: opportunities.toString().split(",") ?? [],
          organization: id,
          titleContains: null,
          published: null,
          verificationMethod: null,
          pageNumber: 1,
          pageSize: opportunities.length,
        },
        context,
      );
    }
  } catch (error) {
    console.error(error);
    if (axios.isAxiosError(error) && error.response?.status) {
      if (error.response.status === 404) {
        return {
          notFound: true,
          props: { theme: theme },
        };
      } else errorCode = error.response.status;
    } else errorCode = 500;
  }

  return {
    props: {
      dehydratedState: dehydrate(queryClient),
      user: session?.user ?? null,
      theme: theme,
      id,
      error: errorCode,
      lookups_selectedOpportunities: lookups_selectedOpportunities ?? null,
    },
  };
}

// OrgAdmin dashboard page
const OrganisationDashboard: NextPageWithLayout<{
  id: string;
  error?: number;
  user?: any;
  lookups_selectedOpportunities?: OpportunitySearchResultsInfo;
}> = ({ id, error, user, lookups_selectedOpportunities }) => {
  const router = useRouter();
  const myRef = useRef<HTMLDivElement>(null);
  const [inactiveOpportunitiesCount, setInactiveOpportunitiesCount] =
    useState(0);
  const [expiredOpportunitiesCount, setExpiredOpportunitiesCount] = useState(0);
  const queryClient = useQueryClient();
  const isAdmin = user?.roles?.includes(ROLE_ADMIN);

  // 👇 use prefetched queries from server
  const { data: lookups_categories } = useQuery<OpportunityCategory[]>({
    queryKey: ["OrganisationDashboardCategories", id],
    queryFn: () => getCategoriesAdmin(id),
    enabled: !error,
  });
  const { data: lookups_countries } = useQuery<Country[]>({
    queryKey: ["OrganisationDashboardCountries", id],
    queryFn: () => getCountriesAdmin(id),
    enabled: !error,
  });
  const { data: organisation } = useQuery<Organization>({
    queryKey: ["organisation", id],
    enabled: !error,
  });

  // get filter parameters from route
  const {
    pageSelectedOpportunities,
    pageCompletedYouth,
    categories,
    opportunities,
    startDate,
    endDate,
    countries,
  } = router.query;

  // QUERY: SEARCH RESULTS
  // the filter values from the querystring are mapped to it's corresponding id
  const { data: searchResults, isLoading } =
    useQuery<OrganizationSearchResultsSummary>({
      queryKey: [
        "OrganizationSearchResultsSummary",
        id,
        categories,
        opportunities,
        startDate,
        endDate,
        countries,
      ],
      queryFn: async () => {
        return await searchOrganizationEngagement({
          organization: id,
          categories:
            categories != undefined
              ? categories
                  ?.toString()
                  .split(",")
                  .map((x) => {
                    const item = lookups_categories?.find((y) => y.name === x);
                    return item ? item?.id : "";
                  })
                  .filter((x) => x != "")
              : null,
          opportunities: opportunities
            ? opportunities?.toString().split(",")
            : null,
          startDate: startDate ? startDate.toString() : "",
          endDate: endDate ? endDate.toString() : "",
          countries:
            countries != undefined
              ? countries
                  ?.toString()
                  .split("|")
                  .map((x) => {
                    const item = lookups_countries?.find((y) => y.name === x);
                    return item ? item?.id : "";
                  })
                  .filter((x) => x != "")
              : null,
        });
      },
      enabled: !error,
    });

  // QUERY: SELECTED OPPORTUNITIES
  const {
    data: selectedOpportunities,
    isLoading: selectedOpportunitiesIsLoading,
  } = useQuery<OrganizationSearchResultsOpportunity>({
    queryKey: [
      "OrganizationSearchResultsSelectedOpportunities",
      id,
      pageSelectedOpportunities,
      categories,
      opportunities,
      startDate,
      endDate,
      countries,
    ],
    queryFn: () =>
      searchOrganizationOpportunities({
        organization: id,
        categories:
          categories != undefined
            ? categories
                ?.toString()
                .split(",")
                .map((x) => {
                  const item = lookups_categories?.find((y) => y.name === x);
                  return item ? item?.id : "";
                })
                .filter((x) => x != "")
            : null,
        opportunities: opportunities
          ? opportunities?.toString().split(",")
          : null,
        startDate: startDate ? startDate.toString() : "",
        endDate: endDate ? endDate.toString() : "",
        pageNumber: pageSelectedOpportunities
          ? parseInt(pageSelectedOpportunities.toString())
          : 1,
        pageSize: PAGE_SIZE,
        countries:
          countries != undefined
            ? countries
                ?.toString()
                .split(",")
                .map((x) => {
                  const item = lookups_countries?.find((y) => y.name === x);
                  return item ? item?.id : "";
                })
                .filter((x) => x != "")
            : null,
      }),
    enabled: !error,
  });

  // QUERY: COMPLETED YOUTH
  const { data: completedYouth, isLoading: completedYouthIsLoading } =
    useQuery<OrganizationSearchResultsYouth>({
      queryKey: [
        "OrganizationSearchResultsCompletedYouth",
        id,
        pageCompletedYouth,
        categories,
        opportunities,
        startDate,
        endDate,
        countries,
      ],
      queryFn: () =>
        searchOrganizationYouth({
          organization: id,
          categories:
            categories != undefined
              ? categories
                  ?.toString()
                  .split(",")
                  .map((x) => {
                    const item = lookups_categories?.find((y) => y.name === x);
                    return item ? item?.id : "";
                  })
                  .filter((x) => x != "")
              : null,
          opportunities: opportunities
            ? opportunities?.toString().split(",")
            : null,
          startDate: startDate ? startDate.toString() : "",
          endDate: endDate ? endDate.toString() : "",
          pageNumber: pageCompletedYouth
            ? parseInt(pageCompletedYouth.toString())
            : 1,
          pageSize: PAGE_SIZE,
          countries:
            countries != undefined
              ? countries
                  ?.toString()
                  .split("|")
                  .map((x) => {
                    const item = lookups_countries?.find((y) => y.name === x);
                    return item ? item?.id : "";
                  })
                  .filter((x) => x != "")
              : null,
        }),
    });

  // QUERY: SSO
  const { data: ssoData, isLoading: ssoDataIsLoading } =
    useQuery<OrganizationSearchSso>({
      queryKey: ["searchOrganizationSso", id, startDate, endDate],
      queryFn: () =>
        searchOrganizationSso({
          organization: id,
          startDate: startDate ? startDate.toString() : "",
          endDate: endDate ? endDate.toString() : "",
        }),
    });

  // search filter state
  const [searchFilter, setSearchFilter] =
    useState<OrganizationSearchFilterSummaryViewModel>({
      pageSelectedOpportunities: pageSelectedOpportunities
        ? parseInt(pageSelectedOpportunities.toString())
        : 1,
      pageCompletedYouth: pageCompletedYouth
        ? parseInt(pageCompletedYouth.toString())
        : 1,
      organization: id,
      categories: null,
      opportunities: null,
      startDate: "",
      endDate: "",
      countries: null,
    });

  // sets the filter values from the querystring to the filter state
  useEffect(() => {
    setSearchFilter({
      pageSelectedOpportunities: pageSelectedOpportunities
        ? parseInt(pageSelectedOpportunities.toString())
        : 1,
      pageCompletedYouth: pageCompletedYouth
        ? parseInt(pageCompletedYouth.toString())
        : 1,
      organization: id,
      categories:
        categories != undefined ? categories?.toString().split(",") : null,
      opportunities:
        opportunities != undefined && opportunities != null
          ? opportunities?.toString().split(",")
          : null,
      startDate: startDate != undefined ? startDate.toString() : "",
      endDate: endDate != undefined ? endDate.toString() : "",
      countries:
        countries != undefined ? countries?.toString().split("|") : null,
    });
  }, [
    setSearchFilter,
    id,
    pageSelectedOpportunities,
    pageCompletedYouth,
    categories,
    opportunities,
    startDate,
    endDate,
    countries,
  ]);

  // carousel data
  const fetchDataAndUpdateCache_Opportunities = useCallback(
    async (
      queryKey: unknown[],
      filter: OrganizationSearchFilterOpportunity,
    ): Promise<OrganizationSearchResultsOpportunity> => {
      const cachedData =
        queryClient.getQueryData<OrganizationSearchResultsOpportunity>(
          queryKey,
        );

      if (cachedData) {
        return cachedData;
      }

      const data = await searchOrganizationOpportunities(filter);

      queryClient.setQueryData(queryKey, data);

      return data;
    },
    [queryClient],
  );
  const fetchDataAndUpdateCache_Youth = useCallback(
    async (
      queryKey: unknown[],
      filter: OrganizationSearchFilterYouth,
    ): Promise<OrganizationSearchResultsYouth> => {
      const cachedData =
        queryClient.getQueryData<OrganizationSearchResultsYouth>(queryKey);

      if (cachedData) {
        return cachedData;
      }

      const data = await searchOrganizationYouth(filter);

      queryClient.setQueryData(queryKey, data);

      return data;
    },
    [queryClient],
  );

  const loadData_Opportunities = useCallback(
    async (startRow: number) => {
      if (startRow >= (selectedOpportunities?.totalCount ?? 0)) {
        return {
          items: [],
          totalCount: 0,
        };
      }
      const pageNumber = Math.ceil(startRow / PAGE_SIZE_MINIMUM);

      return fetchDataAndUpdateCache_Opportunities(
        ["OrganizationSearchResultsSelectedOpportunities", searchFilter],
        {
          pageNumber: pageNumber,
          pageSize: PAGE_SIZE_MINIMUM,
          organization: id,
          categories:
            categories != undefined
              ? categories
                  ?.toString()
                  .split(",")
                  .map((x) => {
                    const item = lookups_categories?.find((y) => y.name === x);
                    return item ? item?.id : "";
                  })
                  .filter((x) => x != "")
              : null,
          opportunities: opportunities
            ? opportunities?.toString().split(",")
            : null,
          startDate: startDate ? startDate.toString() : "",
          endDate: endDate ? endDate.toString() : "",
          countries:
            countries != undefined
              ? countries
                  ?.toString()
                  .split("|")
                  .map((x) => {
                    const item = lookups_countries?.find((y) => y.name === x);
                    return item ? item?.id : "";
                  })
                  .filter((x) => x != "")
              : null,
        },
      );
    },
    [
      selectedOpportunities,
      fetchDataAndUpdateCache_Opportunities,
      categories,
      opportunities,
      startDate,
      endDate,
      countries,
      searchFilter,
      id,
      lookups_categories,
      lookups_countries,
    ],
  );

  const loadData_Youth = useCallback(
    async (startRow: number) => {
      if (startRow >= (completedYouth?.totalCount ?? 0)) {
        return {
          items: [],
          totalCount: 0,
        };
      }
      const pageNumber = Math.ceil(startRow / PAGE_SIZE_MINIMUM);

      return fetchDataAndUpdateCache_Youth(
        [
          "OrganizationSearchResultsCompletedYouth",
          id,
          pageNumber,
          categories,
          opportunities,
          startDate,
          endDate,
          countries,
        ],
        {
          pageNumber: pageNumber,
          pageSize: PAGE_SIZE_MINIMUM,
          organization: id,
          categories:
            categories != undefined
              ? categories
                  ?.toString()
                  .split(",")
                  .map((x) => {
                    const item = lookups_categories?.find((y) => y.name === x);
                    return item ? item?.id : "";
                  })
                  .filter((x) => x != "")
              : null,
          opportunities: opportunities
            ? opportunities?.toString().split(",")
            : null,
          startDate: startDate ? startDate.toString() : "",
          endDate: endDate ? endDate.toString() : "",
          countries:
            countries != undefined
              ? countries
                  ?.toString()
                  .split("|")
                  .map((x) => {
                    const item = lookups_countries?.find((y) => y.name === x);
                    return item ? item?.id : "";
                  })
                  .filter((x) => x != "")
              : null,
        },
      );
    },
    [
      completedYouth,
      fetchDataAndUpdateCache_Youth,
      categories,
      opportunities,
      startDate,
      endDate,
      countries,
      id,
      lookups_categories,
      lookups_countries,
    ],
  );

  // calculate counts
  useEffect(() => {
    if (!selectedOpportunities?.items) return;

    const inactiveCount = selectedOpportunities.items.filter(
      (opportunity) => opportunity.status === ("Inactive" as any),
    ).length;
    const expiredCount = selectedOpportunities.items.filter(
      (opportunity) => opportunity.status === ("Expired" as any),
    ).length;

    setInactiveOpportunitiesCount(inactiveCount);
    setExpiredOpportunitiesCount(expiredCount);
  }, [selectedOpportunities]);

  // 🎈 FUNCTIONS
  const getSearchFilterAsQueryString = useCallback(
    (opportunitySearchFilter: OrganizationSearchFilterSummaryViewModel) => {
      if (!opportunitySearchFilter) return null;

      // construct querystring parameters from filter
      const params = new URLSearchParams();

      if (
        opportunitySearchFilter?.categories?.length !== undefined &&
        opportunitySearchFilter.categories.length > 0
      )
        params.append(
          "categories",
          opportunitySearchFilter.categories.join(","),
        );

      if (
        opportunitySearchFilter?.opportunities?.length !== undefined &&
        opportunitySearchFilter.opportunities.length > 0
      )
        params.append(
          "opportunities",
          opportunitySearchFilter.opportunities.join(","),
        );

      if (opportunitySearchFilter.startDate)
        params.append("startDate", opportunitySearchFilter.startDate);

      if (opportunitySearchFilter.endDate)
        params.append("endDate", opportunitySearchFilter.endDate);

      if (
        opportunitySearchFilter?.countries?.length !== undefined &&
        opportunitySearchFilter.countries.length > 0
      )
        params.append("countries", opportunitySearchFilter.countries.join("|"));

      if (
        opportunitySearchFilter.pageSelectedOpportunities !== null &&
        opportunitySearchFilter.pageSelectedOpportunities !== undefined &&
        opportunitySearchFilter.pageSelectedOpportunities !== 1
      )
        params.append(
          "pageSelectedOpportunities",
          opportunitySearchFilter.pageSelectedOpportunities.toString(),
        );

      if (
        opportunitySearchFilter.pageCompletedYouth !== null &&
        opportunitySearchFilter.pageCompletedYouth !== undefined &&
        opportunitySearchFilter.pageCompletedYouth !== 1
      )
        params.append(
          "pageCompletedYouth",
          opportunitySearchFilter.pageCompletedYouth.toString(),
        );

      if (params.size === 0) return null;
      return params;
    },
    [],
  );

  const redirectWithSearchFilterParams = useCallback(
    (filter: OrganizationSearchFilterSummaryViewModel) => {
      let url = `/organisations/${id}`;
      const params = getSearchFilterAsQueryString(filter);
      if (params != null && params.size > 0)
        url = `${url}?${params.toString()}`;

      if (url != router.asPath)
        void router.push(url, undefined, { scroll: false });
    },
    [id, router, getSearchFilterAsQueryString],
  );

  // filter popup handlers
  const onSubmitFilter = useCallback(
    (val: OrganizationSearchFilterSummaryViewModel) => {
      console.table(val);
      redirectWithSearchFilterParams({
        categories: val.categories,
        opportunities: val.opportunities,
        startDate: val.startDate,
        endDate: val.endDate,
        pageSelectedOpportunities: pageSelectedOpportunities
          ? parseInt(pageSelectedOpportunities.toString())
          : 1,
        pageCompletedYouth: pageCompletedYouth
          ? parseInt(pageCompletedYouth.toString())
          : 1,
        organization: id,
        countries: val.countries,
      });
    },
    [
      id,
      redirectWithSearchFilterParams,
      pageSelectedOpportunities,
      pageCompletedYouth,
    ],
  );

  // 🔔 CHANGE EVENTS
  const handlePagerChangeSelectedOpportunities = useCallback(
    (value: number) => {
      searchFilter.pageSelectedOpportunities = value;
      redirectWithSearchFilterParams(searchFilter);
    },
    [searchFilter, redirectWithSearchFilterParams],
  );
  const handlePagerChangeCompletedYouth = useCallback(
    (value: number) => {
      searchFilter.pageCompletedYouth = value;
      redirectWithSearchFilterParams(searchFilter);
    },
    [searchFilter, redirectWithSearchFilterParams],
  );

  // Function to get the current time of day and the corresponding emoji
  const getTimeOfDayAndEmoji = (): [string, string] => {
    const hour = new Date().getHours();
    let timeOfDay: string;
    let timeOfDayEmoji: string;

    if (hour < 12) {
      timeOfDay = "morning";
      timeOfDayEmoji = "☀️";
    } else if (hour < 18) {
      timeOfDay = "afternoon";
      timeOfDayEmoji = "☀️";
    } else {
      timeOfDay = "evening";
      timeOfDayEmoji = "🌙";
    }

    return [timeOfDay, timeOfDayEmoji];
  };

  const [timeOfDay, timeOfDayEmoji] = getTimeOfDayAndEmoji();

  if (error) {
    if (error === 401) return <Unauthenticated />;
    else if (error === 403) return <Unauthorized />;
    else return <InternalServerError />;
  }

  return (
    <>
      <Head>
        <title>Yoma | Organisation Dashboard</title>
      </Head>

      <PageBackground className="h-[450px] lg:h-[320px]" />

      {(isLoading ||
        selectedOpportunitiesIsLoading ||
        completedYouthIsLoading ||
        ssoDataIsLoading) && <Loading />}

      {/* REFERENCE FOR FILTER POPUP: fix menu z-index issue */}
      <div ref={myRef} />

      <div className="container z-10 mt-[6rem] max-w-7xl overflow-hidden px-4 py-1 md:py-4">
        <div className="flex flex-col gap-4">
          {/* HEADER */}
          <div className="flex flex-col gap-2">
            {/* WELCOME MSG */}
            <div className="overflow-hidden text-ellipsis whitespace-nowrap text-xl font-semibold text-white md:text-2xl">
              <span>
                {timeOfDayEmoji} Good {timeOfDay}&nbsp;
                <span className="">{user?.name}!</span>
              </span>
            </div>

            {/* DESCRIPTION */}
            <div className="gap-2 overflow-hidden text-ellipsis whitespace-nowrap text-white">
              Here&apos;s your reports for{" "}
              <span className="max-w-[600px] overflow-hidden text-ellipsis whitespace-nowrap font-bold">
                {organisation?.name}
              </span>
            </div>

            {searchResults?.dateStamp && (
              <div className="text-sm">
                Last updated on{" "}
                <span className="font-semibold">
                  {moment(new Date(searchResults?.dateStamp)).format(
                    DATETIME_FORMAT_HUMAN,
                  )}
                </span>
              </div>
            )}

            <LimitedFunctionalityBadge />
          </div>

          {/* FILTERS */}
          <div className="">
            {!lookups_categories && <div>Loading...</div>}
            {lookups_categories && (
              <OrganisationRowFilter
                organisationId={id}
                htmlRef={myRef.current!}
                searchFilter={{
                  categories: searchFilter.categories,
                  opportunities: searchFilter.opportunities,
                  startDate: searchFilter.startDate,
                  endDate: searchFilter.endDate,
                  organization: id,
                  pageNumber: null,
                  pageSize: null,
                  countries: searchFilter.countries,
                }}
                lookups_categories={lookups_categories}
                lookups_selectedOpportunities={lookups_selectedOpportunities}
                onSubmit={(e) => onSubmitFilter(e)}
              />
            )}
          </div>

          {/* SUMMARY */}
          {searchResults ? (
            <div className="mt-4 flex flex-col gap-4">
              {/* ENGAGEMENT */}
              <div className="flex flex-col gap-2">
                <div className="text-3xl font-semibold">Engagement</div>

                {/* FILTERS */}
                <div className="">
                  {!lookups_countries && <div>Loading...</div>}

                  {lookups_countries && (
                    <EngagementRowFilter
                      htmlRef={myRef.current!}
                      searchFilter={{
                        categories: searchFilter.categories,
                        opportunities: searchFilter.opportunities,
                        startDate: searchFilter.startDate,
                        endDate: searchFilter.endDate,
                        organization: id,
                        pageNumber: null,
                        pageSize: null,
                        countries: searchFilter.countries,
                      }}
                      lookups_countries={lookups_countries}
                      onSubmit={(e) => onSubmitFilter(e)}
                    />
                  )}
                </div>

                <div className="mt-2 flex flex-col gap-4 md:flex-row">
                  {/* VIEWED COMPLETED */}
                  {searchResults?.opportunities?.viewedCompleted && (
                    <LineChart
                      data={searchResults.opportunities.viewedCompleted}
                      opportunityCount={
                        searchResults?.opportunities?.selected?.count ?? 0
                      }
                    />
                  )}

                  <div className="flex flex-col gap-2">
                    <div className="flex flex-col gap-4">
                      {/* AVERAGE CONVERSION RATE */}
                      <div className="flex h-[185px] w-full flex-col gap-4 rounded-lg bg-white p-4 shadow md:w-[333px]">
                        <div className="flex flex-row items-center gap-3">
                          {/* <IoMdHourglass className="text-green" /> */}
                          <div className="rounded-lg bg-green-light p-1">
                            <Image
                              src={iconBookmark}
                              alt="Icon Bookmark"
                              width={20}
                              height={20}
                              sizes="100vw"
                              priority={true}
                              style={{ width: "20px", height: "20px" }}
                            />
                          </div>
                          <div className="text-sm font-semibold">
                            Average conversion rate
                          </div>
                        </div>

                        <div className="flex flex-grow flex-col">
                          <div className="flex-grow text-4xl font-semibold">
                            {`${
                              searchResults?.opportunities?.conversionRate
                                ?.percentage ?? 0
                            } %`}
                          </div>
                        </div>
                        <div className="text-xs text-gray-dark min-[380px]:w-64 md:w-72">
                          Please note this data may be skewed as tracking of
                          views was only recently introduced.
                        </div>
                      </div>

                      {/* Overall ratio */}
                      {searchResults?.opportunities?.conversionRate && (
                        <PieChart
                          id="conversionRate"
                          title="Overall ratio"
                          subTitle=""
                          colors={CHART_COLORS}
                          data={[
                            ["Completed", "Viewed"],
                            [
                              "Completed",
                              searchResults.opportunities.conversionRate
                                .completedCount,
                            ],
                            [
                              "Viewed",
                              searchResults.opportunities.conversionRate
                                .viewedCount,
                            ],
                          ]}
                          className="h-[185px] w-full md:w-[332px]"
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col">
                <div className="flex gap-4">
                  <div className="text-xl font-semibold">Countries</div>
                </div>
                <div className="flex flex-col gap-4 md:flex-row">
                  <div className="flex w-full flex-col justify-center overflow-hidden rounded-lg bg-white shadow">
                    {/* COUNTRIES - WORLD MAP */}
                    {searchResults?.demographics?.countries?.items && (
                      <WorldMapChart
                        data={[
                          ["Country", "Opportunities"],
                          ...Object.entries(
                            searchResults?.demographics?.countries?.items || {},
                          ),
                        ]}
                      />
                    )}
                  </div>

                  <div className="flex flex-col gap-4">
                    <div className="mt-0 text-xl font-semibold md:-mt-[2.75rem]">
                      Rewards
                    </div>
                    <div className="flex flex-col gap-4 md:flex-row">
                      {/* ZLTO AMOUNT AWARDED */}
                      <div className="h-[176px] w-full flex-col rounded-lg bg-white p-4 shadow md:w-[275px]">
                        <div className="flex flex-row items-center gap-3">
                          <div className="rounded-lg bg-green-light p-1">
                            <Image
                              src={iconZlto}
                              alt="Icon Zlto"
                              width={20}
                              height={20}
                              sizes="100vw"
                              priority={true}
                              style={{ width: "20px", height: "20px" }}
                            />
                          </div>
                          <div className="whitespace-nowrap text-sm font-semibold">
                            ZLTO amount awarded
                          </div>
                        </div>
                        <div className="-ml-1 mt-4 flex flex-grow items-center gap-2">
                          <Image
                            src={iconZlto}
                            alt="Icon Zlto"
                            width={35}
                            height={35}
                            sizes="100vw"
                            priority={true}
                            style={{ width: "35px", height: "35px" }}
                          />
                          <div className="flex-grow text-3xl font-semibold">
                            {searchResults?.opportunities.reward.totalAmount.toLocaleString() ??
                              0}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col md:-mt-[2.75rem]">
                        <span className="mb-4 text-xl font-semibold">
                          Skills
                        </span>

                        {/* TOTAL UNIQUE SKILLS */}
                        <SkillsChart data={searchResults?.skills?.items} />
                      </div>
                    </div>
                    {/* MOST COMPLETED SKILLS */}
                    {searchResults?.skills?.topCompleted && (
                      <>
                        <div className="flex h-[176px] w-full flex-col rounded-lg bg-white p-4 shadow md:w-[565px]">
                          <div className="flex flex-row items-center gap-3">
                            <div className="rounded-lg bg-green-light p-1">
                              <Image
                                src={iconSkills}
                                alt="Icon Skills"
                                width={20}
                                height={20}
                                sizes="100vw"
                                priority={true}
                                style={{ width: "20px", height: "20px" }}
                              />
                            </div>
                            <div className="text-sm font-semibold">
                              {searchResults?.skills.topCompleted.legend}
                            </div>
                          </div>
                          <div className="mt-4 flex flex-grow flex-wrap gap-1 overflow-y-auto overflow-x-hidden md:h-[100px]">
                            {searchResults?.skills.topCompleted.topCompleted.map(
                              (x) => (
                                <div
                                  key={x.id}
                                  className=" md:truncate-none flex h-9 w-max items-center text-ellipsis rounded border-[1px] border-green bg-white px-2 text-xs text-gray-dark md:w-fit md:max-w-none"
                                >
                                  {x.name}
                                </div>
                              ),
                            )}
                          </div>
                          {searchResults?.skills?.topCompleted.topCompleted
                            .length === 0 && (
                            <div className="mb-8 flex w-full flex-col items-center justify-center rounded-lg bg-gray-light p-10 text-center text-xs">
                              Not enough data to display
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* DEMOGRAPHICS */}
              <div className="flex w-full flex-col gap-2">
                <div className="mb-2 text-xl font-semibold">Demographics</div>

                <div className="flex w-full flex-col gap-4 md:flex-row">
                  {/* EDUCATION */}
                  <PieChart
                    id="education"
                    title="Education"
                    subTitle=""
                    colors={CHART_COLORS}
                    data={[
                      ["Education", "Value"],
                      ...Object.entries(
                        searchResults?.demographics?.education?.items || {},
                      ),
                    ]}
                  />

                  {/* GENDERS */}
                  <PieChart
                    id="genders"
                    title="Genders"
                    subTitle=""
                    colors={CHART_COLORS}
                    data={[
                      ["Gender", "Value"],
                      ...Object.entries(
                        searchResults?.demographics?.genders?.items || {},
                      ),
                    ]}
                  />

                  {/* AGE */}
                  <PieChart
                    id="ages"
                    title="Age"
                    subTitle=""
                    colors={CHART_COLORS}
                    data={[
                      ["Age", "Value"],
                      ...Object.entries(
                        searchResults?.demographics?.ages?.items || {},
                      ),
                    ]}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col place-items-center py-16">
              <NoRowsMessage
                title={"No results found"}
                description={"Please try refining your search query."}
              />
            </div>
          )}

          {/* DIVIDER */}
          <div className="border-px mb-2 mt-8 border-t border-gray" />

          {/* SELECTED OPPORTUNITIES */}
          {selectedOpportunities && selectedOpportunities?.items.length > 0 ? (
            <div className="mt-4 flex flex-col">
              <div>
                <div className="mb-1 text-3xl font-semibold">Opportunities</div>
                {/* <div>
                  Opportunities performance (sort by views, completions,
                  conversion ratio)
                </div> */}

                <div className="mb-4 flex hidden flex-col gap-4 md:flex-row">
                  {/* UNPUBLISHED */}
                  <div className="mt-4 flex h-32 w-full flex-col gap-2 rounded-lg bg-white p-4 shadow md:w-72">
                    <div className="flex h-min items-center gap-2">
                      <div className="items-center rounded-lg bg-green-light p-1">
                        <Image
                          src={iconBookmark}
                          alt="Icon Status"
                          width={20}
                          height={20}
                          sizes="100vw"
                          priority={true}
                          style={{ width: "20px", height: "20px" }}
                        />
                      </div>
                      <div className="text-sm font-semibold">
                        Unpublished opportunities
                      </div>
                    </div>
                    <div className="mt-4 text-3xl font-semibold">
                      {inactiveOpportunitiesCount}
                    </div>
                  </div>

                  {/* EXPIRED */}
                  <div className="mt-4 flex h-32 w-full flex-col gap-2 rounded-lg bg-white p-4 shadow md:w-72">
                    <div className="flex h-min items-center gap-2">
                      <div className="items-center rounded-lg bg-green-light p-1">
                        <Image
                          src={iconBookmark}
                          alt="Icon Status"
                          width={20}
                          height={20}
                          sizes="100vw"
                          priority={true}
                          style={{ width: "20px", height: "20px" }}
                        />
                      </div>
                      <div className="text-sm font-semibold">
                        Expired opportunities
                      </div>
                    </div>
                    <div className="mt-4 text-3xl font-semibold">
                      {expiredOpportunitiesCount}
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-2 text-xl font-semibold">
                Selected Opportunities
              </div>

              {selectedOpportunitiesIsLoading && <LoadingSkeleton />}

              {/* SELECTED OPPORTUNITIES */}
              {!selectedOpportunitiesIsLoading && (
                <div id="results">
                  <div className="mb-6 flex flex-row items-center justify-end"></div>
                  <div className="rounded-lg bg-transparent p-0 shadow-none md:bg-white md:p-4 md:shadow">
                    {/* NO ROWS */}
                    {(!selectedOpportunities ||
                      selectedOpportunities.items?.length === 0) && (
                      <div className="flex flex-col place-items-center py-16">
                        <NoRowsMessage
                          title={"No opportunities found"}
                          description={"Please try refining your search query."}
                        />
                      </div>
                    )}

                    {/* GRID */}
                    {selectedOpportunities &&
                      selectedOpportunities.items?.length > 0 && (
                        <div>
                          {/* DESKTOP */}
                          <div className="hidden overflow-x-auto px-4 md:block">
                            <table className="table">
                              <thead>
                                <tr className="border-gray-light text-gray-dark">
                                  <th className="!pl-0">Opportunity</th>
                                  <th>Views</th>
                                  <th>Conversion ratio</th>
                                  <th>Completions</th>
                                  <th className="text-center">Status</th>
                                </tr>
                              </thead>
                              <tbody>
                                {selectedOpportunities.items.map(
                                  (opportunity) => (
                                    <tr
                                      key={opportunity.id}
                                      className="border-gray-light"
                                    >
                                      <td>
                                        <Link
                                          href={`/organisations/${id}/opportunities/${
                                            opportunity.id
                                          }/info?returnUrl=${encodeURIComponent(
                                            router.asPath,
                                          )}`}
                                        >
                                          <div className="-ml-4 flex items-center gap-2">
                                            <AvatarImage
                                              icon={
                                                opportunity?.organizationLogoURL
                                              }
                                              alt="Organization Logo"
                                              size={40}
                                            />
                                            {opportunity.title}
                                          </div>
                                        </Link>
                                      </td>
                                      <td className="text-center">
                                        {opportunity.viewedCount}
                                      </td>
                                      <td className="text-center">
                                        {opportunity.conversionRatioPercentage}%
                                      </td>
                                      <td className="text-center">
                                        <span className="badge bg-green-light text-green">
                                          <IoMdPerson className="mr-1" />
                                          {opportunity.completedCount}
                                        </span>
                                      </td>
                                      <td className="whitespace-nowrap text-center">
                                        {opportunity.status}
                                      </td>
                                    </tr>
                                  ),
                                )}
                              </tbody>
                            </table>
                          </div>

                          {/* MOBILE */}
                          <div className="flex flex-col gap-2 md:hidden">
                            <DashboardCarousel
                              orgId={id}
                              slides={selectedOpportunities.items}
                              loadData={loadData_Opportunities}
                              totalSildes={selectedOpportunities?.totalCount}
                            />
                          </div>
                        </div>
                      )}

                    {/* PAGINATION */}
                    {selectedOpportunities &&
                      selectedOpportunities.totalCount > 0 && (
                        <div className="mt-2 hidden place-items-center justify-center md:grid">
                          <PaginationButtons
                            currentPage={
                              pageSelectedOpportunities
                                ? parseInt(pageSelectedOpportunities.toString())
                                : 1
                            }
                            totalItems={selectedOpportunities.totalCount}
                            pageSize={PAGE_SIZE}
                            showPages={false}
                            showInfo={true}
                            onClick={handlePagerChangeSelectedOpportunities}
                          />
                        </div>
                      )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col place-items-center py-16">
              <NoRowsMessage
                title={"No opportunities found"}
                description={"Please try refining your search query."}
              />
            </div>
          )}

          {/* COMPLETED YOUTH */}
          <div className="my-8 flex flex-col">
            <div className="text-xl font-semibold">Completed by Youth</div>

            {completedYouthIsLoading && <LoadingSkeleton />}

            {/* COMPLETED YOUTH */}
            {!completedYouthIsLoading && (
              <div id="results">
                <div className="mb-6 flex flex-row items-center justify-end"></div>
                <div className="rounded-lg bg-transparent p-0 shadow-none md:bg-white md:p-4 md:shadow">
                  {/* NO ROWS */}
                  {(!completedYouth || completedYouth.items?.length === 0) && (
                    <div className="flex flex-col place-items-center py-16">
                      <NoRowsMessage
                        title={"No completed opportunities found"}
                        description={
                          "Opportunities completed by youth will be displayed here."
                        }
                      />
                    </div>
                  )}

                  {/* GRID */}
                  {completedYouth && completedYouth.items?.length > 0 && (
                    <div>
                      {/* DESKTOP */}
                      <div className="hidden overflow-x-auto md:block">
                        <table className="table">
                          <thead>
                            <tr className="border-gray-light text-gray-dark">
                              <th>Student</th>
                              <th>Opportunity</th>
                              <th>Date completed</th>
                              <th className="text-center">Verified</th>
                              <th className="text-center">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {completedYouth.items.map((opportunity) => (
                              <tr
                                key={`completedYouth_${opportunity.opportunityId}_${opportunity.userId}`}
                                className="border-gray-light"
                              >
                                <td>
                                  <div className="w-max py-2">
                                    {opportunity.userDisplayName}
                                  </div>
                                </td>
                                <td>
                                  <Link
                                    href={`/organisations/${id}/opportunities/${
                                      opportunity.opportunityId
                                    }/info?returnUrl=${encodeURIComponent(
                                      router.asPath,
                                    )}`}
                                    className="text-center"
                                  >
                                    {opportunity.opportunityTitle}
                                  </Link>
                                </td>
                                <td className="whitespace-nowrap text-center">
                                  {opportunity.dateCompleted
                                    ? moment(
                                        new Date(opportunity.dateCompleted),
                                      ).format("MMM D YYYY")
                                    : ""}
                                </td>
                                <td className="whitespace-nowrap text-center">
                                  {opportunity.verified
                                    ? "Verified"
                                    : "Not verified"}
                                </td>
                                <td className="text-center">
                                  {opportunity.opportunityStatus}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* MOBILE */}
                      <div className="flex flex-col gap-2 md:hidden">
                        <DashboardCarousel
                          orgId={id}
                          slides={completedYouth.items}
                          totalSildes={completedYouth?.totalCount}
                          loadData={loadData_Youth}
                        />
                      </div>
                    </div>
                  )}

                  {/* PAGINATION */}
                  {completedYouth && completedYouth.totalCount > 0 && (
                    <div className="mt-2 grid place-items-center justify-center">
                      <PaginationButtons
                        currentPage={
                          pageCompletedYouth
                            ? parseInt(pageCompletedYouth.toString())
                            : 1
                        }
                        totalItems={completedYouth.totalCount}
                        pageSize={PAGE_SIZE}
                        showPages={false}
                        showInfo={true}
                        onClick={handlePagerChangeCompletedYouth}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* DIVIDER */}
          {isAdmin && ssoData && (
            <div className="border-px my-8 border-t border-gray" />
          )}

          {/* SSO */}
          {isAdmin && (
            <div className="my-8 flex flex-col gap-4">
              <div className="text-2xl font-semibold">Single Sign On</div>
              {ssoDataIsLoading && <LoadingSkeleton />}
              {ssoData && (
                <div className="grid grid-rows-2 gap-4 md:grid-cols-2">
                  <div className="flex flex-col gap-2 rounded-lg bg-white p-6 shadow">
                    <div className="flex items-center gap-2 text-lg font-semibold">
                      <div>Outbound</div>{" "}
                      <IoIosArrowForward className="rounded-lg bg-green-light p-px pl-[2px] text-2xl text-green" />
                    </div>
                    {ssoData?.outbound?.enabled ? (
                      <>
                        <div className="-mb-4 font-semibold">
                          {ssoData?.outbound?.clientId}
                        </div>
                        <SsoChart data={ssoData?.outbound?.logins} />
                      </>
                    ) : (
                      <div>Disabled</div>
                    )}
                  </div>
                  <div className="flex flex-col gap-2 rounded-lg bg-white p-6 shadow">
                    <div className="flex items-center gap-2 text-lg font-semibold">
                      <div>Inbound</div>{" "}
                      <IoIosArrowBack className="rounded-lg bg-green-light p-px pr-[2px] text-2xl text-green" />
                    </div>
                    {ssoData?.inbound?.enabled ? (
                      <>
                        <div className="-mb-4 font-semibold">
                          {ssoData?.inbound?.clientId}
                        </div>
                        <SsoChart data={ssoData?.inbound?.logins} />
                      </>
                    ) : (
                      <div>Disabled</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

OrganisationDashboard.getLayout = function getLayout(page: ReactElement) {
  return <MainLayout>{page}</MainLayout>;
};

// 👇 return theme from component properties. this is set server-side (getServerSideProps)
OrganisationDashboard.theme = function getTheme(page: ReactElement) {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return page.props.theme;
};

export default OrganisationDashboard;
