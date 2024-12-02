import {
  QueryClient,
  dehydrate,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import axios from "axios";
import moment from "moment";
import type { GetServerSidePropsContext } from "next";
import { getServerSession } from "next-auth";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import iconBookmark from "public/images/icon-completions-green.svg";
import iconSkills from "public/images/icon-skills-green.svg";
import iconZlto from "public/images/icon-zlto-green.svg";
import { type ParsedUrlQuery } from "querystring";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactElement,
} from "react";
import "react-datepicker/dist/react-datepicker.css";
import { IoIosArrowBack, IoIosArrowForward, IoMdPerson } from "react-icons/io";
import type { Country } from "~/api/models/lookups";
import type {
  OpportunityCategory,
  OpportunitySearchResultsInfo,
} from "~/api/models/opportunity";
import type { Organization } from "~/api/models/organisation";
import type {
  OrganizationSearchFilterOpportunity,
  OrganizationSearchFilterYouth,
  OrganizationSearchResultsOpportunity,
  OrganizationSearchResultsSummary,
  OrganizationSearchResultsYouth,
  OrganizationSearchSso,
} from "~/api/models/organizationDashboard";
import {
  getCategoriesAdmin,
  searchCriteriaOpportunities,
} from "~/api/services/opportunities";
import { getOrganisationById } from "~/api/services/organisations";
import {
  getCountries,
  searchOrganizationEngagement,
  searchOrganizationOpportunities,
  searchOrganizationSso,
  searchOrganizationYouth,
} from "~/api/services/organizationDashboard";
import { AvatarImage } from "~/components/AvatarImage";
import Suspense from "~/components/Common/Suspense";
import MainLayout from "~/components/Layout/Main";
import NoRowsMessage from "~/components/NoRowsMessage";
import OpportunityStatus from "~/components/Opportunity/OpportunityStatus";
import DashboardCarousel from "~/components/Organisation/Dashboard/DashboardCarousel";
import { EngagementRowFilter } from "~/components/Organisation/Dashboard/EngagementRowFilter";
import { LineChart } from "~/components/Organisation/Dashboard/LineChart";
import { OrganisationRowFilter } from "~/components/Organisation/Dashboard/OrganisationRowFilter";
import { PieChart } from "~/components/Organisation/Dashboard/PieChart";
import { SkillsChart } from "~/components/Organisation/Dashboard/SkillsChart";
import { SsoChart } from "~/components/Organisation/Dashboard/SsoChart";
import { WorldMapChart } from "~/components/Organisation/Dashboard/WorldMapChart";
import { PageBackground } from "~/components/PageBackground";
import { PaginationButtons } from "~/components/PaginationButtons";
import { InternalServerError } from "~/components/Status/InternalServerError";
import LimitedFunctionalityBadge from "~/components/Status/LimitedFunctionalityBadge";
import { LoadingInline } from "~/components/Status/LoadingInline";
import { Unauthenticated } from "~/components/Status/Unauthenticated";
import { Unauthorized } from "~/components/Status/Unauthorized";
import { Header } from "~/components/Common/Header";
import {
  CHART_COLORS,
  DATETIME_FORMAT_HUMAN,
  PAGE_SIZE,
  PAGE_SIZE_MINIMUM,
  ROLE_ADMIN,
} from "~/lib/constants";
import { config } from "~/lib/react-query-config";
import { getThemeFromRole, getTimeOfDayAndEmoji } from "~/lib/utils";
import type { NextPageWithLayout } from "~/pages/_app";
import { authOptions } from "~/server/auth";

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
    const dataOrganisation = await getOrganisationById(id, context);
    const dataCategories = await getCategoriesAdmin(id, context);
    const dataCountries = await getCountries(id, context);

    // 👇 prefetch queries on server
    await Promise.all([
      await queryClient.prefetchQuery({
        queryKey: ["organisation", id],
        queryFn: () => dataOrganisation,
      }),
      await queryClient.prefetchQuery({
        queryKey: ["organisationCategories", id],
        queryFn: () => dataCategories,
      }),
      await queryClient.prefetchQuery({
        queryKey: ["organisationCountries", id],
        queryFn: () => dataCountries,
      }),
    ]);

    // HACK: lookup each of the opportunities (to resolve ids to titles for filter badges)
    if (opportunities) {
      lookups_selectedOpportunities = await searchCriteriaOpportunities(
        {
          opportunities: opportunities.toString().split("|") ?? [],
          organization: id,
          countries: null,
          titleContains: null,
          published: null,
          verificationMethod: null,
          verificationEnabled: null,
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
  const { data: organisation } = useQuery<Organization>({
    queryKey: ["organisation", id],
    enabled: !error,
  });
  const {
    data: categoriesData,
    isLoading: categoriesIsLoading,
    error: categoriesError,
  } = useQuery<OpportunityCategory[]>({
    queryKey: ["organisationCategories", id],
    queryFn: () => getCategoriesAdmin(id),
    enabled: !error,
  });
  const {
    data: countriesData,
    isLoading: countriesIsLoading,
    error: countriesError,
  } = useQuery<Country[]>({
    queryKey: ["organisationCountries", id],
    queryFn: () => getCountries(id),
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
  const {
    data: engagementData,
    isLoading: engagementIsLoading,
    error: engagementError,
  } = useQuery<OrganizationSearchResultsSummary>({
    queryKey: [
      "organisationEngagement",
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
                .split("|")
                .map((x) => {
                  const item = categoriesData?.find((y) => y.name === x);
                  return item ? item?.id : "";
                })
                .filter((x) => x != "")
            : null,
        opportunities: opportunities
          ? opportunities?.toString().split("|")
          : null,
        startDate: startDate ? startDate.toString() : "",
        endDate: endDate ? endDate.toString() : "",
        countries:
          countries != undefined
            ? countries
                ?.toString()
                .split("|")
                .map((x) => {
                  const item = countriesData?.find((y) => y.name === x);
                  return item ? item?.id : "";
                })
                .filter((x) => x != "")
            : null,
      });
    },
    enabled: !error,
  });

  // QUERY: COMPLETED YOUTH
  const {
    data: completedOpportunitiesData,
    isLoading: completedOpportunitiesIsLoading,
    error: completedOpportunitiesError,
  } = useQuery<OrganizationSearchResultsYouth>({
    queryKey: [
      "organisationCompletedYouth",
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
                .split("|")
                .map((x) => {
                  const item = categoriesData?.find((y) => y.name === x);
                  return item ? item?.id : "";
                })
                .filter((x) => x != "")
            : null,
        opportunities: opportunities
          ? opportunities?.toString().split("|")
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
                  const item = countriesData?.find((y) => y.name === x);
                  return item ? item?.id : "";
                })
                .filter((x) => x != "")
            : null,
      }),
  });

  // QUERY: SELECTED OPPORTUNITIES
  const {
    data: selectedOpportunitiesData,
    isLoading: selectedOpportunitiesIsLoading,
    error: selectedOpportunitiesError,
  } = useQuery<OrganizationSearchResultsOpportunity>({
    queryKey: [
      "organisationSelectedOpportunities",
      id,
      pageSelectedOpportunities,
      categories,
      opportunities,
      startDate,
      endDate,
    ],
    queryFn: () =>
      searchOrganizationOpportunities({
        organization: id,
        categories:
          categories != undefined
            ? categories
                ?.toString()
                .split("|")
                .map((x) => {
                  const item = categoriesData?.find((y) => y.name === x);
                  return item ? item?.id : "";
                })
                .filter((x) => x != "")
            : null,
        opportunities: opportunities
          ? opportunities?.toString().split("|")
          : null,
        startDate: startDate ? startDate.toString() : "",
        endDate: endDate ? endDate.toString() : "",
        pageNumber: pageSelectedOpportunities
          ? parseInt(pageSelectedOpportunities.toString())
          : 1,
        pageSize: PAGE_SIZE,
      }),
    enabled: !error,
  });

  // QUERY: SSO
  const {
    data: ssoData,
    isLoading: ssoIsLoading,
    error: ssoError,
  } = useQuery<OrganizationSearchSso>({
    queryKey: ["organisationSSO", id, startDate, endDate],
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
        categories != undefined ? categories?.toString().split("|") : null,
      opportunities:
        opportunities != undefined && opportunities != null
          ? opportunities?.toString().split("|")
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
      if (startRow > (selectedOpportunitiesData?.totalCount ?? 0)) {
        return {
          items: [],
          totalCount: 0,
        };
      }
      const pageNumber = Math.ceil(startRow / PAGE_SIZE_MINIMUM);

      return fetchDataAndUpdateCache_Opportunities(
        [
          "OrganizationSearchResultsSelectedOpportunities",
          pageNumber,
          id,
          categories,
          opportunities,
          startDate,
          endDate,
        ],
        {
          pageNumber: pageNumber,
          pageSize: PAGE_SIZE_MINIMUM,
          organization: id,
          categories:
            categories != undefined
              ? categories
                  ?.toString()
                  .split("|")
                  .map((x) => {
                    const item = categoriesData?.find((y) => y.name === x);
                    return item ? item?.id : "";
                  })
                  .filter((x) => x != "")
              : null,
          opportunities: opportunities
            ? opportunities?.toString().split("|")
            : null,
          startDate: startDate ? startDate.toString() : "",
          endDate: endDate ? endDate.toString() : "",
        },
      );
    },
    [
      selectedOpportunitiesData,
      fetchDataAndUpdateCache_Opportunities,
      categories,
      opportunities,
      startDate,
      endDate,
      id,
      categoriesData,
    ],
  );
  const loadData_Youth = useCallback(
    async (startRow: number) => {
      if (startRow > (completedOpportunitiesData?.totalCount ?? 0)) {
        return {
          items: [],
          totalCount: 0,
        };
      }
      const pageNumber = Math.ceil(startRow / PAGE_SIZE_MINIMUM);

      return fetchDataAndUpdateCache_Youth(
        [
          "OrganizationSearchResultsCompletedYouth",
          pageNumber,
          id,
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
                  .split("|")
                  .map((x) => {
                    const item = categoriesData?.find((y) => y.name === x);
                    return item ? item?.id : "";
                  })
                  .filter((x) => x != "")
              : null,
          opportunities: opportunities
            ? opportunities?.toString().split("|")
            : null,
          startDate: startDate ? startDate.toString() : "",
          endDate: endDate ? endDate.toString() : "",
          countries:
            countries != undefined
              ? countries
                  ?.toString()
                  .split("|")
                  .map((x) => {
                    const item = countriesData?.find((y) => y.name === x);
                    return item ? item?.id : "";
                  })
                  .filter((x) => x != "")
              : null,
        },
      );
    },
    [
      completedOpportunitiesData,
      fetchDataAndUpdateCache_Youth,
      categories,
      opportunities,
      startDate,
      endDate,
      countries,
      id,
      categoriesData,
      countriesData,
    ],
  );

  // calculate counts
  useEffect(() => {
    if (!selectedOpportunitiesData?.items) return;

    const inactiveCount = selectedOpportunitiesData.items.filter(
      (opportunity) => opportunity.status === ("Inactive" as any),
    ).length;
    const expiredCount = selectedOpportunitiesData.items.filter(
      (opportunity) => opportunity.status === ("Expired" as any),
    ).length;

    setInactiveOpportunitiesCount(inactiveCount);
    setExpiredOpportunitiesCount(expiredCount);
  }, [selectedOpportunitiesData]);

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
          opportunitySearchFilter.categories.join("|"),
        );

      if (
        opportunitySearchFilter?.opportunities?.length !== undefined &&
        opportunitySearchFilter.opportunities.length > 0
      )
        params.append(
          "opportunities",
          opportunitySearchFilter.opportunities.join("|"),
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

  // 🔔 EVENTS
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

      {/* REFERENCE FOR FILTER POPUP: fix menu z-index issue */}
      <div ref={myRef} />

      <div className="container z-10 mt-[6rem] max-w-7xl overflow-hidden p-4">
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

            <div className="h-6 text-sm">
              {engagementData?.dateStamp && (
                <>
                  Last updated on{" "}
                  <span className="font-semibold">
                    {moment(new Date(engagementData?.dateStamp)).format(
                      DATETIME_FORMAT_HUMAN,
                    )}
                  </span>
                </>
              )}
            </div>

            <LimitedFunctionalityBadge />
          </div>

          {/* FILTERS */}
          <div className="flex h-[236px] items-center justify-center lg:h-[92px]">
            <Suspense
              isLoading={categoriesIsLoading}
              error={categoriesError}
              loader={
                <LoadingInline
                  className="flex-col md:flex-row"
                  classNameSpinner="border-white h-6 w-6"
                  classNameLabel="text-white"
                />
              }
            >
              <OrganisationRowFilter
                organisationId={id}
                htmlRef={myRef.current!}
                searchFilter={searchFilter}
                lookups_categories={categoriesData}
                lookups_selectedOpportunities={lookups_selectedOpportunities}
                onSubmit={(e) => onSubmitFilter(e)}
              />
            </Suspense>
          </div>

          <Suspense
            isLoading={
              engagementIsLoading ||
              countriesIsLoading ||
              engagementIsLoading ||
              completedOpportunitiesIsLoading ||
              selectedOpportunitiesIsLoading ||
              ssoIsLoading
            }
            error={
              engagementError ||
              categoriesError ||
              countriesError ||
              engagementError ||
              completedOpportunitiesError ||
              selectedOpportunitiesError ||
              ssoError
            }
          >
            <>
              {/* SUMMARY */}
              <div className="flex flex-col gap-4">
                {/* ENGAGEMENT */}
                <div className="flex flex-col gap-2">
                  <Header title="🤝 Engagement" />

                  {/* FILTERS */}
                  <EngagementRowFilter
                    htmlRef={myRef.current!}
                    searchFilter={searchFilter}
                    lookups_countries={countriesData}
                    onSubmit={(e) => onSubmitFilter(e)}
                  />

                  <div className="mt-2 flex flex-col gap-4 md:flex-row">
                    {/* VIEWED COMPLETED */}
                    {engagementData?.opportunities?.engagements && (
                      <LineChart
                        data={engagementData.opportunities.engagements}
                        opportunityCount={
                          engagementData?.opportunities?.engaged?.count ?? 0
                        }
                      />
                    )}

                    <div className="flex flex-col gap-2">
                      <div className="flex flex-col gap-4">
                        {/* AVERAGE CONVERSION RATE */}
                        <div className="flex h-[185px] w-full flex-col gap-4 rounded-lg bg-white p-4 shadow md:w-[333px]">
                          <div className="flex flex-row items-center gap-3">
                            <div className="rounded-lg bg-green-light p-1">
                              <Image
                                src={iconBookmark}
                                alt="Icon Bookmark"
                                width={20}
                                height={20}
                                className="h-auto"
                                sizes="100vw"
                                priority={true}
                              />
                            </div>
                            <div className="text-sm font-semibold">
                              Average conversion rate
                            </div>
                          </div>

                          <div className="flex flex-grow flex-col">
                            <div className="flex-grow text-4xl font-semibold">
                              {`${
                                engagementData?.opportunities?.conversionRate
                                  ?.percentage ?? 0
                              } %`}
                            </div>
                          </div>
                          <div className="text-xs text-gray-dark min-[380px]:w-64 md:w-72">
                            Please note this data may be skewed as tracking of
                            views was only recently introduced.
                          </div>
                        </div>

                        {/* OVERALL RATIO */}
                        {engagementData?.opportunities?.conversionRate && (
                          <PieChart
                            id="conversionRate"
                            title="Overall ratio"
                            subTitle=""
                            colors={CHART_COLORS}
                            data={[
                              ["Completed", "Viewed"],
                              [
                                "Completed",
                                engagementData.opportunities.conversionRate
                                  .completedCount,
                              ],
                              [
                                "Viewed",
                                engagementData.opportunities.conversionRate
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

                <div className="flex flex-col gap-4 md:flex-row">
                  {/* COUNTRIES */}
                  <div className="flex grow flex-col gap-1">
                    <Header title="🌐 Countries" />

                    <div className="h-full rounded-lg bg-white p-4 shadow">
                      {engagementData?.demographics?.countries?.items && (
                        <WorldMapChart
                          data={[
                            ["Country", "Opportunities"],
                            ...Object.entries(
                              engagementData?.demographics?.countries?.items ||
                                {},
                            ),
                          ]}
                        />
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-4 md:flex-row">
                      {/* REWARDS */}
                      <div className="flex flex-col gap-1">
                        <Header title="💸 Rewards" />

                        <div className="h-[176px] rounded-lg bg-white p-4 shadow md:w-[275px]">
                          <div className="flex flex-row items-center gap-3">
                            <div className="rounded-lg bg-green-light p-1">
                              <Image
                                src={iconZlto}
                                alt="Icon Zlto"
                                width={20}
                                height={20}
                                className="h-auto"
                                sizes="100vw"
                                priority={true}
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
                              className="h-auto"
                              sizes="100vw"
                              priority={true}
                            />
                            <div className="flex-grow text-3xl font-semibold">
                              {engagementData?.opportunities.reward.totalAmount.toLocaleString() ??
                                0}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* SKILLS */}
                      <div className="flex flex-col gap-1">
                        <Header title="⚡ Skills" />

                        <div className="h-[176px] rounded-lg bg-white shadow md:w-[275px]">
                          <SkillsChart data={engagementData?.skills?.items} />
                        </div>
                      </div>
                    </div>

                    {/* MOST COMPLETED SKILLS */}
                    {engagementData?.skills?.topCompleted && (
                      <div className="flex h-[176px] w-full flex-col rounded-lg bg-white p-4 shadow md:w-[565px]">
                        <div className="flex flex-row items-center gap-3">
                          <div className="rounded-lg bg-green-light p-1">
                            <Image
                              src={iconSkills}
                              alt="Icon Skills"
                              width={20}
                              height={20}
                              className="h-auto"
                              sizes="100vw"
                              priority={true}
                            />
                          </div>
                          <div className="text-sm font-semibold">
                            {engagementData?.skills.topCompleted.legend}
                          </div>
                        </div>
                        <div className="mt-4 flex flex-grow flex-wrap gap-1 overflow-y-auto overflow-x-hidden md:h-[100px]">
                          {engagementData?.skills.topCompleted.topCompleted.map(
                            (x) => (
                              <div
                                key={x.id}
                                className="md:truncate-none flex h-9 w-max items-center text-ellipsis rounded border-[1px] border-green bg-white px-2 text-xs text-gray-dark md:w-fit md:max-w-none"
                              >
                                {x.name}
                              </div>
                            ),
                          )}
                        </div>
                        {engagementData?.skills?.topCompleted.topCompleted
                          .length === 0 && (
                          <div className="mb-8 flex w-full flex-col items-center justify-center rounded-lg bg-gray-light p-10 text-center text-xs">
                            Not enough data to display
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* DEMOGRAPHICS */}
                <div className="flex w-full flex-col gap-1">
                  <Header title="📊 Demographics" />

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
                          engagementData?.demographics?.education?.items || {},
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
                          engagementData?.demographics?.genders?.items || {},
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
                          engagementData?.demographics?.ages?.items || {},
                        ),
                      ]}
                    />
                  </div>
                </div>
              </div>

              {/* COMPLETED YOUTH */}
              <div className="flex flex-col gap-1">
                <Header title="✅ Completed by Youth" />

                {/* COMPLETED YOUTH */}
                <div className="rounded-lg bg-transparent p-0 shadow-none md:bg-white md:p-4 md:shadow">
                  {/* NO ROWS */}
                  {(!completedOpportunitiesData ||
                    completedOpportunitiesData.items?.length === 0) && (
                    <div className="flex flex-col place-items-center py-4">
                      <NoRowsMessage
                        title={"No completed opportunities found"}
                        description={
                          "Opportunities completed by youth will be displayed here."
                        }
                      />
                    </div>
                  )}

                  {/* RESULTS */}
                  {completedOpportunitiesData &&
                    completedOpportunitiesData.items?.length > 0 && (
                      <>
                        {/* DESKTOP */}
                        <div className="hidden overflow-x-auto md:block">
                          <table className="table">
                            <thead>
                              <tr className="border-gray-light text-gray-dark">
                                <th>Student</th>
                                <th>Opportunity</th>
                                <th>Date completed</th>
                                <th className="text-center">Verified</th>
                              </tr>
                            </thead>
                            <tbody>
                              {completedOpportunitiesData.items.map(
                                (opportunity) => (
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
                                  </tr>
                                ),
                              )}
                            </tbody>
                          </table>

                          {/* PAGINATION */}
                          <div className="mt-2">
                            <PaginationButtons
                              currentPage={
                                pageCompletedYouth
                                  ? parseInt(pageCompletedYouth.toString())
                                  : 1
                              }
                              totalItems={completedOpportunitiesData.totalCount}
                              pageSize={PAGE_SIZE}
                              showPages={false}
                              showInfo={true}
                              onClick={handlePagerChangeCompletedYouth}
                            />
                          </div>
                        </div>

                        {/* MOBILE */}
                        <div className="flex flex-col gap-2 md:hidden">
                          <DashboardCarousel
                            orgId={id}
                            slides={completedOpportunitiesData.items}
                            totalSildes={completedOpportunitiesData?.totalCount}
                            loadData={loadData_Youth}
                          />
                        </div>
                      </>
                    )}
                </div>
              </div>

              {/* DIVIDER */}
              <div className="border-px mb-2 mt-4 border-t border-gray" />

              {/* SELECTED OPPORTUNITIES */}
              <div className="flex flex-col">
                <Header title="🏆 Selected Opportunities" />

                {/* NB: DECPRECATED */}
                <div className="mb-4 hidden flex-col gap-4 md:flex-row">
                  {/* UNPUBLISHED */}
                  <div className="mt-4x flex h-32 w-full flex-col gap-2 rounded-lg bg-white p-4 shadow md:w-72">
                    <div className="flex h-min items-center gap-2">
                      <div className="items-center rounded-lg bg-green-light p-1">
                        <Image
                          src={iconBookmark}
                          alt="Icon Status"
                          width={20}
                          height={20}
                          className="h-auto"
                          sizes="100vw"
                          priority={true}
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
                  <div className="mt-4x flex h-32 w-full flex-col gap-2 rounded-lg bg-white p-4 shadow md:w-72">
                    <div className="flex h-min items-center gap-2">
                      <div className="items-center rounded-lg bg-green-light p-1">
                        <Image
                          src={iconBookmark}
                          alt="Icon Status"
                          width={20}
                          height={20}
                          className="h-auto"
                          sizes="100vw"
                          priority={true}
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

                {/* SELECTED OPPORTUNITIES */}
                <div className="mt-1 rounded-lg bg-transparent p-0 shadow-none md:bg-white md:p-4 md:shadow">
                  {/* NO ROWS */}
                  {(!selectedOpportunitiesData ||
                    selectedOpportunitiesData.items?.length === 0) && (
                    <div className="flex flex-col place-items-center py-4">
                      <NoRowsMessage
                        title={"No opportunities found"}
                        description={"Please try refining your search query."}
                      />
                    </div>
                  )}

                  {/* RESULTS */}
                  {selectedOpportunitiesData &&
                    selectedOpportunitiesData.items?.length > 0 && (
                      <div>
                        {/* DESKTOP */}
                        <div className="hidden overflow-x-auto px-4 md:block">
                          <table className="table">
                            <thead>
                              <tr className="border-gray-light text-gray-dark">
                                <th className="!pl-0">Opportunity</th>
                                <th className="text-center">Views</th>
                                <th className="text-center">
                                  Conversion ratio
                                </th>
                                <th className="text-center">Completions</th>
                                <th className="text-center">Go-To Clicks</th>
                                <th className="text-center">Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {selectedOpportunitiesData.items.map(
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
                                    <td className="text-center">
                                      {opportunity.navigatedExternalLinkCount}
                                    </td>
                                    <td className="whitespace-nowrap text-center">
                                      <OpportunityStatus
                                        status={opportunity?.status?.toString()}
                                      />
                                    </td>
                                  </tr>
                                ),
                              )}
                            </tbody>
                          </table>

                          {/* PAGINATION */}
                          <div className="mt-2">
                            <PaginationButtons
                              currentPage={
                                pageSelectedOpportunities
                                  ? parseInt(
                                      pageSelectedOpportunities.toString(),
                                    )
                                  : 1
                              }
                              totalItems={selectedOpportunitiesData.totalCount}
                              pageSize={PAGE_SIZE}
                              showPages={false}
                              showInfo={true}
                              onClick={handlePagerChangeSelectedOpportunities}
                            />
                          </div>
                        </div>

                        {/* MOBILE */}
                        <div className="flex flex-col gap-2 md:hidden">
                          <DashboardCarousel
                            orgId={id}
                            slides={selectedOpportunitiesData.items}
                            loadData={loadData_Opportunities}
                            totalSildes={selectedOpportunitiesData?.totalCount}
                          />
                        </div>
                      </div>
                    )}
                </div>
              </div>

              {/* SSO */}
              {isAdmin && (
                <div className="my-8 flex flex-col gap-4">
                  <Header title="🔑 Single Sign-On" />

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
                </div>
              )}
            </>
          </Suspense>
        </div>
      </div>
    </>
  );
};

OrganisationDashboard.getLayout = function getLayout(page: ReactElement) {
  return <MainLayout>{page}</MainLayout>;
};

// 👇 return theme from component properties. this is set server-side (getServerSideProps)
OrganisationDashboard.theme = function getTheme(
  page: ReactElement<{ theme: string }>,
) {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return page.props.theme;
};

export default OrganisationDashboard;
