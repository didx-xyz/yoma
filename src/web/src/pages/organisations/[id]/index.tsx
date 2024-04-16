import { QueryClient, dehydrate, useQuery } from "@tanstack/react-query";
import Head from "next/head";
import { type ParsedUrlQuery } from "querystring";
import {
  useRef,
  type ReactElement,
  useMemo,
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
} from "~/api/services/organizationDashboard";
import type { GetServerSidePropsContext } from "next";
import type {
  OpportunitySearchResultsInfo,
  OpportunityCategory,
} from "~/api/models/opportunity";
import { getServerSession } from "next-auth";
import { Loading } from "~/components/Status/Loading";
import { OrganisationRowFilter } from "~/components/Organisation/Dashboard/OrganisationRowFilter";
import FilterBadges from "~/components/FilterBadges";
import { toISOStringForTimezone } from "~/lib/utils";
import Link from "next/link";
import { getThemeFromRole } from "~/lib/utils";
import Image from "next/image";
import iconZlto from "public/images/icon-zlto-green.svg";
import iconBookmark from "public/images/icon-bookmark-green.svg";
import iconSkills from "public/images/icon-skills-green.svg";
import {
  CHART_COLORS,
  DATETIME_FORMAT_HUMAN,
  PAGE_SIZE,
} from "~/lib/constants";
import NoRowsMessage from "~/components/NoRowsMessage";
import { PaginationButtons } from "~/components/PaginationButtons";
import type {
  OrganizationSearchFilterSummary,
  OrganizationSearchResultsOpportunity,
  OrganizationSearchResultsSummary,
  OrganizationSearchResultsYouth,
} from "~/api/models/organizationDashboard";
import { LoadingSkeleton } from "~/components/Status/LoadingSkeleton";
import moment from "moment";
import {
  getCategoriesAdmin,
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

interface OrganizationSearchFilterSummaryViewModel {
  organization: string;
  opportunities: string[] | null;
  categories: string[] | null;
  startDate: string | null;
  endDate: string | null;
  pageSelectedOpportunities: number;
  pageCompletedYouth: number;
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

    // HACK: lookup each of the opportunities (to resolve ids to titles)
    if (opportunities)
      lookups_selectedOpportunities = await searchCriteriaOpportunities(
        {
          opportunities: opportunities.toString().split(",") ?? [],
          organization: id,
          titleContains: null,
          pageNumber: 1,
          pageSize: opportunities.length,
        },
        context,
      );
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

  // 👇 use prefetched queries from server
  const { data: lookups_categories } = useQuery<OpportunityCategory[]>({
    queryKey: ["OrganisationDashboardCategories", id],
    queryFn: () => getCategoriesAdmin(id),
    enabled: !error,
  });
  // const { data: organisation } = useQuery<Organization>({
  //   queryKey: ["organisation", id],
  //   enabled: !error,
  // });

  // get filter parameters from route
  const {
    pageSelectedOpportunities,
    pageCompletedYouth,
    categories,
    opportunities,
    startDate,
    endDate,
  } = router.query;

  // memo for isSearchPerformed based on filter parameters
  const isSearchPerformed = useMemo<boolean>(() => {
    return (
      categories != undefined ||
      opportunities != undefined ||
      startDate != undefined ||
      endDate != undefined
    );
  }, [categories, opportunities, startDate, endDate]);

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
          pageNumber: null,
          pageSize: null,
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
      }),
    enabled: !error,
  });

  useEffect(() => {
    const calculateCounts = () => {
      if (!selectedOpportunities?.items) return;

      const inactiveCount = selectedOpportunities.items.filter(
        (opportunity) => opportunity.status === ("Inactive" as any),
      ).length;
      const expiredCount = selectedOpportunities.items.filter(
        (opportunity) => opportunity.status === ("Expired" as any),
      ).length;

      setInactiveOpportunitiesCount(inactiveCount);
      setExpiredOpportunitiesCount(expiredCount);
    };

    calculateCounts();
  }, [selectedOpportunities]);

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
    });

  // sets the filter values from the querystring to the filter state
  useEffect(() => {
    if (isSearchPerformed)
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
      });
  }, [
    setSearchFilter,
    isSearchPerformed,
    id,
    pageSelectedOpportunities,
    pageCompletedYouth,
    categories,
    opportunities,
    startDate,
    endDate,
  ]);

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
    (val: OrganizationSearchFilterSummary) => {
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

      <PageBackground className="h-[305px] lg:h-[275px]" />

      {isSearchPerformed && isLoading && <Loading />}

      {/* REFERENCE FOR FILTER POPUP: fix menu z-index issue */}
      <div ref={myRef} />

      <div className="container z-10 mt-[7.5rem] max-w-7xl overflow-hidden px-4 py-1 md:py-4">
        <div className="flex flex-col gap-4">
          {/* HEADER */}
          <div className="mb-4 flex flex-col">
            {/* LOGO & TITLE */}
            {/* <div className="-mb-4 -mt-2 flex flex-row font-semibold text-white">
              <LogoTitle
                logoUrl={organisation?.logoURL}
                title={organisation?.name}
              />
              <LimitedFunctionalityBadge />
            </div> */}
            {/* WELCOME MSG */}
            <div className="text-2xl font-semibold text-white md:text-3xl">
              <span>
                Good {timeOfDay}, {user?.name} {timeOfDayEmoji}
              </span>
            </div>
            {/* DESCRIPTION */}
            <div className="mt-2 flex flex-col gap-1 leading-4 text-white lg:flex-row">
              <span>Your dashboard progress so far.</span>

              {searchResults?.dateStamp && (
                <span>
                  Last updated on{" "}
                  <span className="font-semibold">
                    {moment(new Date(searchResults?.dateStamp)).format(
                      DATETIME_FORMAT_HUMAN,
                    )}
                  </span>
                </span>
              )}
            </div>
            <LimitedFunctionalityBadge />
          </div>

          {/* FILTERS */}
          <div className="mt-16 flex lg:mt-16">
            {!lookups_categories && <div>Loading...</div>}
            {lookups_categories && (
              <div className="flex flex-grow flex-col gap-3">
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
                  }}
                  lookups_categories={lookups_categories}
                  onSubmit={(e) => onSubmitFilter(e)}
                />

                {/* FILTER BADGES */}
                <FilterBadges
                  searchFilter={searchFilter}
                  excludeKeys={[
                    "pageSelectedOpportunities",
                    "pageCompletedYouth",
                    "pageSize",
                    "organization",
                  ]}
                  resolveValue={(key, value) => {
                    if (key === "startDate" || key === "endDate")
                      return value
                        ? toISOStringForTimezone(new Date(value)).split("T")[0]
                        : "";
                    else if (key === "opportunities") {
                      // HACK: resolve opportunity ids to titles
                      const lookup = lookups_selectedOpportunities?.items.find(
                        (x) => x.id === value,
                      );
                      return lookup?.title ?? value;
                    } else {
                      return value;
                    }
                  }}
                  onSubmit={(e) => onSubmitFilter(e)}
                />
              </div>
            )}
          </div>

          {/* SUMMARY */}
          {searchResults ? (
            <div className="flex flex-col gap-4 md:-mt-2">
              {/* ENGAGEMENT */}
              <div className="flex flex-col gap-2">
                <div className="text-3xl font-semibold">Engagement</div>

                <div className="mt-2 flex flex-col gap-4 md:flex-row">
                  {/* VIEWED COMPLETED */}
                  {searchResults?.opportunities?.viewedCompleted && (
                    <LineChart
                      id="viewedCompleted"
                      data={searchResults.opportunities.viewedCompleted}
                      width={900}
                      height={386}
                      opportunityCount={
                        searchResults?.opportunities?.selected?.count ?? 0
                      }
                    />
                  )}

                  <div className="flex flex-grow flex-col gap-2">
                    <div className="flex flex-col gap-4">
                      {/* AVERAGE CONVERSION RATE */}
                      <div className="flex h-[185px] flex-col gap-4 rounded-lg bg-white p-4 shadow">
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
                          width={313}
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

              {/* REWARDS */}
              <div className="flex flex-col gap-2">
                <div className="mb-2 flex gap-2">
                  <div className="w-[297px] text-xl font-semibold">Rewards</div>
                  <div className="hidden text-xl font-semibold md:inline">
                    Skills
                  </div>
                </div>
                <div className="flex flex-col gap-4 md:flex-row">
                  {/* ZLTO AMOUNT AWARDED */}
                  <div className="h-[176px] w-full flex-col rounded-lg bg-white p-4 shadow md:w-[420px] md:min-w-[288px]">
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

                  <div className="text-xl font-semibold md:hidden">Skills</div>

                  {/* TOTAL UNIQUE SKILLS */}
                  <div
                    className="overflow-hidden rounded-lg bg-white shadow"
                    style={{ minWidth: "288px", height: "176px" }}
                  >
                    <SkillsChart
                      id="totalUniqueSkills"
                      data={searchResults?.skills?.items}
                      height={176}
                      chartWidth={288}
                      chartHeight={100}
                    />
                  </div>

                  {/* MOST COMPLETED SKILLS */}
                  {searchResults?.skills?.topCompleted && (
                    <>
                      <div className="flex h-[176px] w-full flex-col rounded-lg bg-white p-4 shadow">
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
                          <div className="flex w-full flex-col items-center justify-center rounded-lg bg-gray-light p-4 text-center text-xs">
                            Not enough data to display
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* DEMOGRAPHICS */}
              <div className="flex flex-col gap-2">
                <div className="mb-2 text-xl font-semibold">Demographics</div>

                <div className="flex flex-col gap-4 md:flex-row">
                  {/* COUNTRIES */}
                  {searchResults?.demographics?.countries?.items && (
                    <PieChart
                      id="countries"
                      title="Country"
                      subTitle=""
                      width={420}
                      colors={CHART_COLORS}
                      data={[
                        ["Country", "Value"],
                        ...Object.entries(
                          searchResults?.demographics?.countries?.items || {},
                        ),
                      ]}
                      className="h-44 w-full md:w-72"
                    />
                  )}

                  {/* GENDERS */}
                  {searchResults?.demographics?.genders?.items && (
                    <PieChart
                      id="genders"
                      title="Genders"
                      subTitle=""
                      width={420}
                      colors={CHART_COLORS}
                      data={[
                        ["Gender", "Value"],
                        ...Object.entries(
                          searchResults?.demographics?.genders?.items || {},
                        ),
                      ]}
                      className="h-44 w-full md:w-72"
                    />
                  )}

                  {/* AGE */}
                  {searchResults?.demographics?.ages?.items && (
                    <PieChart
                      id="ages"
                      title="Age"
                      subTitle=""
                      width={420}
                      colors={CHART_COLORS}
                      data={[
                        ["Age", "Value"],
                        ...Object.entries(
                          searchResults?.demographics?.ages?.items || {},
                        ),
                      ]}
                      className="h-44 w-full md:w-64 lg:w-72"
                    />
                  )}
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
                        // description={"Please try refining your search query."}
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
