/* eslint-disable */
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
import { type Organization } from "~/api/models/organisation";
import { getOrganisationById } from "~/api/services/organisations";
import MainLayout from "~/components/Layout/Main";
import { LogoTitle } from "~/components/Organisation/LogoTitle";
import { authOptions, type User } from "~/server/auth";
import {
  PAGE_SIZE,
  ROLE_ADMIN,
  ROLE_ORG_ADMIN,
  THEME_BLUE,
  THEME_GREEN,
  THEME_PURPLE,
} from "~/lib/constants";
import { Unauthorized } from "~/components/Status/Unauthorized";
import { NextPageWithLayout } from "~/pages/_app";
import { config } from "~/lib/react-query-config";
import LimitedFunctionalityBadge from "~/components/Status/LimitedFunctionalityBadge";
import { PageBackground } from "~/components/PageBackground";
import { Chart } from "react-google-charts";
import { IoMdArrowUp, IoMdDocument } from "react-icons/io";
import { useRouter } from "next/router";
import {
  OrganisationDashboardFilterOptions,
  OrganizationSearchFilterQueryTerm,
  OrganizationSearchResultsSummary,
  TimeIntervalSummary,
} from "~/api/models/organizationDashboard";
import { getOrganisationDashboardSummary } from "~/api/services/organizationDashboard";
import type {
  GetServerSidePropsContext,
  GetStaticPaths,
  GetStaticProps,
} from "next";
import {
  getOpportunitiesAdmin,
  getOpportunityCategories,
} from "~/api/services/opportunities";
import { getAges, getCountries, getGenders } from "~/api/services/lookups";
import {
  OpportunityCategory,
  OpportunitySearchResults,
} from "~/api/models/opportunity";
import { Country, Gender } from "~/api/models/lookups";
import { getServerSession } from "next-auth";
import { Loading } from "~/components/Status/Loading";
import { OrganisationRowFilter } from "~/components/Organisation/Dashboard/OrganisationRowFilter";
import FilterBadges from "~/components/FilterBadges";
import { toISOStringForTimezone } from "~/lib/utils";
import Link from "next/link";
import NoRowsMessage from "~/components/NoRowsMessage";
import { PaginationButtons } from "~/components/PaginationButtons";
import { UnderConstruction } from "~/components/Status/UnderConstruction";
import { getThemeFromRole } from "~/lib/utils";

interface IParams extends ParsedUrlQuery {
  id: string;
}

// ⚠️ SSR
export async function getServerSideProps(context: GetServerSidePropsContext) {
  const { id } = context.params as IParams;
  const session = await getServerSession(context.req, context.res, authOptions);

  // 👇 ensure authenticated
  if (!session) {
    return {
      props: {
        error: "Unauthorized",
      },
    };
  }
  // 👇 set theme based on role
  const theme = getThemeFromRole(session, id);

  const { query, page } = context.query;
  const queryClient = new QueryClient(config);

  // 👇 prefetch queries on server
  await Promise.all([
    // await queryClient.prefetchQuery({
    //   queryKey: ["OrganisationDashboardCategories"],
    //   queryFn: () => getOpportunityCategories(context),
    // }),
    // await queryClient.prefetchQuery({
    //   queryKey: ["OrganisationDashboardOpportunities", id],
    //   queryFn: () =>
    //     getOpportunitiesAdmin(
    //       {
    //         types: null,
    //         categories: null,
    //         languages: null,
    //         countries: null,
    //         organizations: [id],
    //         commitmentIntervals: null,
    //         zltoRewardRanges: null,
    //         valueContains: null,
    //         startDate: null,
    //         endDate: null,
    //         statuses: null,
    //         pageNumber: 1,
    //         pageSize: 1000,
    //       },
    //       context,
    //     ),
    // }),
    // await queryClient.prefetchQuery({
    //   queryKey: ["OrganisationDashboardAges"],
    //   queryFn: () => getAges(context),
    // }),
    // await queryClient.prefetchQuery({
    //   queryKey: ["OrganisationDashboardGenders"],
    //   queryFn: () => getGenders(context),
    // }),
    // await queryClient.prefetchQuery({
    //   queryKey: ["OrganisationDashboardCountries"],
    //   queryFn: () => getCountries(context),
    // }),
    await queryClient.prefetchQuery({
      queryKey: ["organisation", id],
      queryFn: () => getOrganisationById(id, context),
    }),

    // await queryClient.prefetchQuery({
    //   queryKey: [
    //     `OrganisationsInactive_${query?.toString()}_${page?.toString()}`,
    //   ],
    //   queryFn: () =>
    //     getOrganisations(
    //       {
    //         pageNumber: page ? parseInt(page.toString()) : 1,
    //         pageSize: 20,
    //         valueContains: query?.toString() ?? null,
    //         statuses: [Status.Inactive],
    //       },
    //       context,
    //     ),
    // }),
  ]);

  return {
    props: {
      dehydratedState: dehydrate(queryClient),
      user: session?.user ?? null,
      theme: theme,
      id,
    },
  };
}

// 👇 SSG
// This function gets called at build time on server-side.
// It may be called again, on a serverless function, if
// revalidation is enabled and a new request comes in
// export const getStaticProps: GetStaticProps = async (context) => {
//   const { id } = context.params as IParams;

//   const lookups_categories = await getOpportunityCategories(context);
//   const lookups_opportunities = await getOpportunitiesAdmin(
//     {
//       types: null,
//       categories: null,
//       languages: null,
//       countries: null,
//       organizations: [id],
//       commitmentIntervals: null,
//       zltoRewardRanges: null,
//       valueContains: null,
//       startDate: null,
//       endDate: null,
//       statuses: null,
//       pageNumber: 1,
//       pageSize: 1000,
//     },
//     context,
//   );
//   const lookups_ages = await getAges(context);
//   const lookups_genders = await getGenders(context);
//   const lookups_countries = await getCountries(context);
//   const organisation = await getOrganisationById(id, context);

//   return {
//     props: {
//       id,
//       lookups_categories,
//       lookups_opportunities,
//       lookups_ages,
//       lookups_genders,
//       lookups_countries,
//       organisation,
//     },

//     // Next.js will attempt to re-generate the page:
//     // - When a request comes in
//     // - At most once every 300 seconds
//     revalidate: 300,
//   };
// };

// export const getStaticPaths: GetStaticPaths = () => {
//   return {
//     paths: [],
//     fallback: "blocking",
//   };
// };

// ⚠️ SSR
// export async function getServerSideProps(context: GetServerSidePropsContext) {
//   const { id } = context.params as IParams;
//   const session = await getServerSession(context.req, context.res, authOptions);

//   // 👇 ensure authenticated
//   if (!session) {
//     return {
//       props: {
//         error: "Unauthorized",
//       },
//     };
//   }

//   // 👇 set theme based on role
//   let theme;

//   if (session?.user?.adminsOf?.includes(id)) {
//     theme = THEME_GREEN;
//   } else if (session?.user?.roles.includes(ROLE_ADMIN)) {
//     theme = THEME_BLUE;
//   } else {
//     theme = THEME_PURPLE;
//   }

//   // 👇 prefetch queries on server
//   const queryClient = new QueryClient(config);
//   await queryClient.prefetchQuery({
//     queryKey: ["organisation", id],
//     queryFn: () => getOrganisationById(id, context),
//   });
//   //todo: other lookups

//   return {
//     props: {
//       dehydratedState: dehydrate(queryClient),
//       user: session?.user ?? null,
//       id: id,
//       theme: theme,
//     },
//   };
// }

const LineChart: React.FC<{
  title: string;
  data: TimeIntervalSummary;
  labels: string[];
}> = ({ title, data, labels }) => {
  // map the data to the format required by the chart
  const localData = data.data.map((x) => [x.item1.toString(), x.item2]);

  // add labels to the beginning of the data array
  localData.unshift(labels);

  return (
    <div className="relative w-64 overflow-hidden rounded-lg bg-white pt-10 shadow">
      <div
        className="flex flex-row items-center gap-2"
        style={{ position: "absolute", top: "10px", left: "10px", zIndex: 1 }}
      >
        <IoMdDocument className="text-green" />
        <div className="text-sm font-semibold">{title}</div>
      </div>
      <div
        className="text-2xl font-bold"
        style={{ position: "absolute", top: "28px", left: "10px", zIndex: 1 }}
      >
        {data.count}
      </div>
      <Chart
        chartType="LineChart"
        loader={<div>Loading Chart</div>}
        data={localData}
        options={{
          // hAxis: { textPosition: "none", gridlines: { color: "transparent" } },
          // vAxis: { textPosition: "none", gridlines: { color: "transparent" } },
          // chartArea: {
          //   left: 0,
          //   top: 20,
          //   right: 0,
          //   bottom: 0,
          //   width: "100%",
          //   height: "100%",
          // }, // this removes the padding
          // chartArea: {
          //   left: 10,
          //   top: 30,
          //   right: 10,
          //   bottom: 10,
          //   // width: "100%",
          //   // height: "100%",
          // }, // this removes the padding
          chartArea: {
            // left: 10,
            // top: 10,
          }, // this removes the padding
          legend: "none",
          lineWidth: 2,
          areaOpacity: 0.1,
          colors: ["#387F6A", "#240b36"],
          curveType: "function",
          title: "", // Remove the title from the chart itself
          pointSize: 5, // this sets the size of the data points
          pointShape: "circle", // this sets the shape of the data points
        }}
      />
    </div>
  );
};

const PercentageDisplay: React.FC<{
  percentage: number;
}> = ({ percentage }) => {
  return (
    <div className="text-green-500 flex items-center gap-2">
      <IoMdArrowUp className="rounded-full bg-gray text-green" />
      <span className="text-xs font-bold text-green">
        +{percentage.toFixed(2)}%
      </span>
      <span className="text-xs">monthly total so far</span>
    </div>
  );
};

const TitleAndSummaryCard: React.FC<{
  title: string;
  children: ReactElement;
}> = ({ title, children }) => {
  return (
    <div className="flex h-60 w-64 flex-col rounded-lg bg-white p-4 shadow">
      <div className="flex flex-row items-center gap-2">
        <IoMdDocument className="text-green" />
        <div className="text-sm font-semibold">{title}</div>
      </div>

      {children}
    </div>
  );
};

type GoogleChartData = (string | number)[][];

const PieChart: React.FC<{
  title: string;
  data: GoogleChartData;
  colors?: string[];
}> = ({ title, data, colors }) => {
  return (
    <div className="relative w-64 overflow-hidden rounded-lg bg-white pt-10 shadow">
      <div
        className="flex flex-row items-center gap-2"
        style={{ position: "absolute", top: "10px", left: "10px", zIndex: 1 }}
      >
        <IoMdDocument className="text-green" />
        <div className="text-sm font-semibold">{title}</div>
      </div>

      {data && (
        <Chart
          chartType="PieChart"
          loader={<div>Loading Chart</div>}
          data={data}
          options={{
            legend: { position: "left" }, // Position the legend on the left
            colors: colors,
            chartArea: {
              top: 10, // Reduce the top margin
              width: "90%",
              height: "80%",
            },
          }}
        />
      )}
    </div>
  );
};

const BubbleChart: React.FC<{ title: string; subTitle: string }> = ({
  title,
  subTitle,
}) => {
  return (
    <div className="w-64x relative overflow-hidden rounded-lg bg-white pt-10 shadow">
      <div
        className="flex flex-row items-center gap-2"
        style={{ position: "absolute", top: "10px", left: "10px", zIndex: 1 }}
      >
        <IoMdDocument className="text-green" />
        <div className="text-sm font-semibold">{title}</div>
      </div>
      <p
        className="text-2xl font-bold"
        style={{ position: "absolute", top: "28px", left: "10px", zIndex: 1 }}
      >
        {subTitle}
      </p>
      <Chart
        // width={"100%"}
        // height={"100%"}
        chartType="BubbleChart"
        loader={<div>Loading Chart</div>}
        data={[
          ["ID", "Count", "Age", "Country", "Population"],
          ["Term", 80.66, 60, "North America", 33739900],
          ["Term", 79.84, 30, "Europe", 81902307],
          ["Term", 78.6, 32, "Europe", 5523095],
          ["Term", 72.73, 55, "Middle East", 79716203],
          ["Term", 80.05, 24, "Europe", 61801570],
          ["Term", 72.49, 18, "Middle East", 73137148],
          ["Term", 68.09, 33, "Middle East", 31090763],
          ["Term", 81.55, 44, "Middle East", 7485600],
          ["Term", 68.6, 55, "Europe", 141850000],
          ["Term", 78.09, 66, "North America", 307007000],
        ]}
        options={{
          title: "",
          // hAxis: { textPosition: "none", gridlines: { color: "transparent" } },
          // vAxis: { textPosition: "none", gridlines: { color: "transparent" } },
          hAxis: { title: "Age" },
          vAxis: { title: "Count" },
          bubble: { textStyle: { fontSize: 11 } },
          //legend: { position: "left" },
          chartArea: {
            width: "60%",
            height: "80%",
          },
        }}
      />
    </div>
  );
};

// OrgAdmin dashboard page
const OrganisationDashboard: NextPageWithLayout<{
  id: string;
  error: string;
}> = ({ id, error }) => {
  if (error) return <Unauthorized />;

  const router = useRouter();
  const myRef = useRef<HTMLDivElement>(null);

  // 👇 use prefetched queries from server
  const { data: lookups_categories } = useQuery<OpportunityCategory[]>({
    queryKey: ["OrganisationDashboardCategories"],
    queryFn: () => getOpportunityCategories(),
  });
  const { data: lookups_opportunities } = useQuery<OpportunitySearchResults>({
    queryKey: ["OrganisationDashboardOpportunities", id],
    queryFn: () =>
      getOpportunitiesAdmin({
        types: null,
        categories: null,
        languages: null,
        countries: null,
        organizations: [id],
        commitmentIntervals: null,
        zltoRewardRanges: null,
        valueContains: null,
        startDate: null,
        endDate: null,
        statuses: null,
        pageNumber: 1,
        pageSize: 1000,
      }),
  });
  //TODO:
  const { data: lookups_ages } = useQuery<Gender[]>({
    queryKey: ["OrganisationDashboardAges"],
    queryFn: () => getAges(),
  });
  const { data: lookups_genders } = useQuery<Gender[]>({
    queryKey: ["OrganisationDashboardGenders"],
    queryFn: () => getGenders(),
  });
  const { data: lookups_countries } = useQuery<Country[]>({
    queryKey: ["OrganisationDashboardCountries"],
    queryFn: () => getCountries(),
  });
  const { data: organisation } = useQuery<Organization>({
    queryKey: ["organisation", id],
  });

  // get filter parameters from route
  const {
    page,
    categories,
    opportunities,
    startDate,
    endDate,
    ages,
    genders,
    countries,
  } = router.query;

  // memo for isSearchPerformed based on filter parameters
  const isSearchPerformed = useMemo<boolean>(() => {
    return (
      categories != undefined ||
      opportunities != undefined ||
      startDate != undefined ||
      endDate != undefined ||
      ages != undefined ||
      genders != undefined ||
      countries != undefined
    );
  }, [categories, opportunities, startDate, endDate, ages, genders, countries]);

  // QUERY: SEARCH RESULTS
  // the filter values from the querystring are mapped to it's corresponding id
  const { data: searchResults, isLoading } =
    useQuery<OrganizationSearchResultsSummary>({
      queryKey: [
        "OrganizationSearchResultsSummary",
        page,
        categories,
        opportunities,
        startDate,
        endDate,
      ],
      queryFn: async () =>
        await getOrganisationDashboardSummary({
          pageNumber: page ? parseInt(page.toString()) : 1,
          pageSize: PAGE_SIZE,
          organization: id,
          //valueContains: query ? decodeURIComponent(query.toString()) : null,
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
          opportunities:
            opportunities != undefined
              ? opportunities
                  ?.toString()
                  .split(",")
                  .map((x) => {
                    const item = lookups_opportunities?.items.find(
                      (y) => y.title === x,
                    );
                    return item ? item?.id : "";
                  })
                  .filter((x) => x != "")
              : null,

          startDate: startDate != undefined ? startDate.toString() : null,
          endDate: endDate != undefined ? endDate.toString() : null,
        }),
      //enabled: isSearchPerformed, // only run query if search is executed
    });

  // search filter state
  const [searchFilter, setSearchFilter] =
    useState<OrganizationSearchFilterQueryTerm>({
      pageNumber: page ? parseInt(page.toString()) : 1,
      pageSize: PAGE_SIZE,
      organization: id,
      categories: null,
      opportunities: null,
      startDate: null,
      endDate: null,
      ageRanges: null,
      genders: null,
      countries: null,
    });

  // sets the filter values from the querystring to the filter state
  useEffect(() => {
    if (isSearchPerformed)
      setSearchFilter({
        pageNumber: page ? parseInt(page.toString()) : 1,
        pageSize: PAGE_SIZE,
        //valueContains: query ? decodeURIComponent(query.toString()) : null,
        organization: id,
        categories:
          categories != undefined ? categories?.toString().split(",") : null,
        opportunities:
          opportunities != undefined && opportunities != null
            ? opportunities?.toString().split(",")
            : null,
        startDate: startDate != undefined ? startDate.toString() : null,
        endDate: endDate != undefined ? endDate.toString() : null,
        ageRanges: ages != undefined ? ages?.toString().split(",") : null,
        genders: genders != undefined ? genders?.toString().split(",") : null,
        countries:
          countries != undefined ? countries?.toString().split(",") : null,
      });
  }, [
    setSearchFilter,
    isSearchPerformed,
    id,
    page,
    categories,
    opportunities,
    startDate,
    endDate,
    ages,
    genders,
    countries,
  ]);

  // 🎈 FUNCTIONS
  const getSearchFilterAsQueryString = useCallback(
    (opportunitySearchFilter: OrganizationSearchFilterQueryTerm) => {
      if (!opportunitySearchFilter) return null;

      // construct querystring parameters from filter
      const params = new URLSearchParams();
      // if (
      //   opportunitySearchFilter.valueContains !== undefined &&
      //   opportunitySearchFilter.valueContains !== null &&
      //   opportunitySearchFilter.valueContains.length > 0
      // )
      //   params.append("query", opportunitySearchFilter.valueContains);
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

      if (
        opportunitySearchFilter.startDate !== undefined &&
        opportunitySearchFilter.startDate !== null
      )
        params.append("startDate", opportunitySearchFilter.startDate);

      if (
        opportunitySearchFilter.endDate !== undefined &&
        opportunitySearchFilter.endDate !== null
      )
        params.append("endDate", opportunitySearchFilter.endDate);

      if (
        opportunitySearchFilter.ageRanges !== null &&
        opportunitySearchFilter.ageRanges !== undefined
      )
        params.append("ages", opportunitySearchFilter.ageRanges.toString());

      if (
        opportunitySearchFilter.genders !== null &&
        opportunitySearchFilter.genders !== undefined
      )
        params.append("genders", opportunitySearchFilter.genders.toString());

      if (
        opportunitySearchFilter.countries !== null &&
        opportunitySearchFilter.countries !== undefined
      )
        params.append(
          "countries",
          opportunitySearchFilter.countries.toString(),
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
    (filter: OrganizationSearchFilterQueryTerm) => {
      let url = `/organisations/${id}`;
      const params = getSearchFilterAsQueryString(filter);
      if (params != null && params.size > 0)
        url = `${url}?${params.toString()}`;

      if (url != router.asPath)
        void router.push(url, undefined, { scroll: false });
    },
    [router, getSearchFilterAsQueryString],
  );

  // filter popup handlers
  const onSubmitFilter = useCallback(
    (val: OrganizationSearchFilterQueryTerm) => {
      redirectWithSearchFilterParams(val);
    },
    [redirectWithSearchFilterParams],
  );

  const onClearFilter = useCallback(() => {
    void router.push(`/organisations/${id}`, undefined, { scroll: true });
  }, [router]);

  return (
    <>
      <Head>
        <title>Yoma | Organisation Dashboard</title>
      </Head>

      <PageBackground height={15} />

      {isSearchPerformed && isLoading && <Loading />}

      {/* REFERENCE FOR FILTER POPUP: fix menu z-index issue */}
      <div ref={myRef} />

      <div className="container z-10 mt-20 max-w-7xl px-4 py-1 md:py-4">
        <div className="flex flex-col">
          {/* LOGO & TITLE */}
          <div className="flex flex-row font-semibold text-white">
            <LogoTitle
              logoUrl={organisation?.logoURL}
              title={organisation?.name}
            />
            <LimitedFunctionalityBadge />
          </div>
          {/* DESCRIPTION */}
          <span className="w-full [line-break:anywhere]">
            <span>{`Your dashboard progress so far for the month of `}</span>
            <span className="font-semibold">TODO</span>
          </span>
        </div>

        <div className="flex flex-col gap-4 ">
          {/* FILTERS: TOP-LEVEL */}
          <div className="mb-4 mt-10 hidden md:flex">
            {!lookups_categories ||
              (!lookups_opportunities && <div>Loading...</div>)}
            {lookups_categories && lookups_opportunities && (
              <div className="flex flex-col">
                <OrganisationRowFilter
                  htmlRef={myRef.current!}
                  searchFilter={searchFilter}
                  lookups_categories={lookups_categories}
                  lookups_opportunities={lookups_opportunities}
                  clearButtonText="Clear"
                  onClear={onClearFilter}
                  onSubmit={(e) => onSubmitFilter(e)}
                  filterOptions={[
                    OrganisationDashboardFilterOptions.CATEGORIES,
                    OrganisationDashboardFilterOptions.OPPORTUNITIES,
                    OrganisationDashboardFilterOptions.DATE_START,
                    OrganisationDashboardFilterOptions.DATE_END,
                    OrganisationDashboardFilterOptions.VIEWALLFILTERSBUTTON,
                  ]}
                  totalCount={0}
                />
                {/* FILTER BADGES */}
                <FilterBadges
                  searchFilter={searchFilter}
                  excludeKeys={[
                    "pageNumber",
                    "pageSize",
                    "organization",
                    "ageRanges",
                    "genders",
                    "countries",
                  ]}
                  resolveValue={(key, value) => {
                    if (key === "startDate" || key === "endDate")
                      return value
                        ? toISOStringForTimezone(new Date(value)).split("T")[0]
                        : "";
                    else {
                      return value;
                    }
                  }}
                  onSubmit={(e) => onSubmitFilter(e)}
                />
              </div>
            )}
          </div>

          {/* ENGAGEMENT */}
          <div className="flex flex-col gap-2">
            <div className="text-xl font-semibold">Engagement</div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {searchResults?.opportunities.viewed && (
                <LineChart
                  title="All visitors"
                  data={searchResults?.opportunities.viewed}
                  labels={["Year", "Visits"]}
                />
              )}

              {searchResults?.opportunities.completed && (
                <LineChart
                  title="Completions"
                  data={searchResults?.opportunities.completed}
                  labels={["Year", "Visits"]}
                />
              )}

              <TitleAndSummaryCard title="Average time">
                <div className="flex flex-grow flex-col">
                  <div className="flex-grow text-2xl font-bold">
                    {searchResults?.opportunities.completion
                      .averageTimeInDays ?? 0}
                  </div>
                  {searchResults?.opportunities.completion.percentage && (
                    <PercentageDisplay
                      percentage={
                        searchResults?.opportunities.completion.percentage
                      }
                    />
                  )}
                </div>
              </TitleAndSummaryCard>

              {searchResults?.opportunities?.conversionRate && (
                <PieChart
                  title="Conversion rate"
                  colors={["#387F6A", "#F9AB3E"]} // green and yellow
                  data={[
                    ["Completed", "Viewed"],
                    [
                      "Completed",
                      searchResults.opportunities.conversionRate.completedCount,
                    ],
                    [
                      "Viewed",
                      searchResults.opportunities.conversionRate.viewedCount,
                    ],
                  ]}
                />
              )}
            </div>
          </div>

          {/* REWARDS */}
          <div className="flex flex-col gap-2">
            <div className="text-xl font-semibold">Rewards</div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              <TitleAndSummaryCard title="ZLTO amount awarded">
                <div className="flex flex-grow flex-col">
                  <div className="flex-grow text-2xl font-bold">
                    {searchResults?.opportunities.reward.totalAmount ?? 0}
                  </div>
                  {searchResults?.opportunities.reward.percentage && (
                    <PercentageDisplay
                      percentage={
                        searchResults?.opportunities.reward.percentage
                      }
                    />
                  )}
                </div>
              </TitleAndSummaryCard>

              {searchResults?.skills.items && (
                <LineChart
                  title="Total skills"
                  data={searchResults?.skills.items}
                  labels={["Year", "Count"]}
                />
              )}

              {/* SKILLS */}
              {searchResults?.skills.topCompleted && (
                <TitleAndSummaryCard title="Most completed skills">
                  <div className="mt-2 flex flex-grow flex-wrap overflow-hidden">
                    {searchResults?.skills.topCompleted.map((x) => (
                      <div
                        key={x.id}
                        className="min-h-6 badge mr-2 rounded-md border-0 bg-green text-white"
                      >
                        {x.name}
                      </div>
                    ))}
                  </div>
                </TitleAndSummaryCard>
              )}
            </div>
          </div>

          {/* DEMOGRAPHICS */}
          <div className="flex flex-col gap-2">
            <div className="text-xl font-semibold">Demographics</div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {/* COUNTRIES */}
              {searchResults?.demographics?.countries && (
                <PieChart
                  title="Country"
                  colors={["#41204B", "#4CADE9", "#387F6A", "#F9AB3E"]} // purple, blue, green and yellow
                  data={[
                    ["Country", "Value"],
                    ...searchResults.demographics.countries.map((x) => [
                      x.item1,
                      x.item2,
                    ]),
                  ]}
                />
              )}
              {/* GENDERS */}
              {searchResults?.demographics?.genders && (
                <PieChart
                  title="Genders"
                  colors={["#41204B", "#4CADE9", "#387F6A", "#F9AB3E"]} // purple, blue, green and yellow
                  data={[
                    ["Gender", "Value"],
                    ...searchResults.demographics.genders.map((x) => [
                      x.item1,
                      x.item2,
                    ]),
                  ]}
                />
              )}
              {/* AGE */}
              {searchResults?.demographics?.genders && (
                <PieChart
                  title="Age"
                  colors={["#41204B", "#4CADE9", "#387F6A", "#F9AB3E"]} // purple, blue, green and yellow
                  data={[
                    ["Age", "Value"],
                    ...searchResults.demographics.ages.map((x) => [
                      x.item1,
                      x.item2,
                    ]),
                  ]}
                />
              )}
            </div>
          </div>

          {/* ALL OPPORTUNITIES */}
          <div className="flex flex-col gap-2">
            <div className="text-xl font-semibold">All Opportunities</div>
            <div className="font-semiboldx text-lg">
              Opportunities performance (sort by views, completions, conversion
              ratio)
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {searchResults?.opportunities.published && (
                <LineChart
                  title="Published Opportunities"
                  data={searchResults?.opportunities.published}
                  labels={["Year", "Count"]}
                />
              )}
              {searchResults?.opportunities.unpublished && (
                <LineChart
                  title="Unpublished Opportunities"
                  data={searchResults?.opportunities.unpublished}
                  labels={["Year", "Count"]}
                />
              )}
              {searchResults?.opportunities.expired && (
                <LineChart
                  title="Expired Opportunities"
                  data={searchResults?.opportunities.expired}
                  labels={["Year", "Count"]}
                />
              )}
              {searchResults?.opportunities.pending && (
                <LineChart
                  title="Pending Opportunities"
                  data={searchResults?.opportunities.pending}
                  labels={["Year", "Count"]}
                />
              )}
            </div>
          </div>

          {/* POPULAR SEARCH TERMS */}
          <div className="flex flex-col gap-2">
            <div className="text-xl font-semibold">Popular search terms</div>

            {/* FILTERS: BOTTOM-LEVEL */}
            {lookups_ages && lookups_genders && lookups_countries && (
              <div className="mb-4 flex">
                <div className="flex flex-col">
                  <OrganisationRowFilter
                    htmlRef={myRef.current!}
                    searchFilter={searchFilter}
                    lookups_ageRanges={lookups_ages}
                    lookups_genders={lookups_genders}
                    lookups_countries={lookups_countries}
                    clearButtonText="Clear"
                    onClear={onClearFilter}
                    onSubmit={(e) => onSubmitFilter(e)}
                    // onOpenFilterFullWindow={() => {
                    //   setFilterFullWindowVisible(!filterFullWindowVisible);
                    // }}
                    filterOptions={[
                      OrganisationDashboardFilterOptions.AGES,
                      OrganisationDashboardFilterOptions.GENDERS,
                      OrganisationDashboardFilterOptions.COUNTRIES,
                      OrganisationDashboardFilterOptions.VIEWALLFILTERSBUTTON,
                    ]}
                    // totalCount={searchResults?.totalCount ?? 0}
                    totalCount={0}
                  />

                  {/* FILTER BADGES */}
                  <FilterBadges
                    searchFilter={searchFilter}
                    excludeKeys={[
                      "pageNumber",
                      "pageSize",
                      "organization",
                      "opportunities",
                      "categories",
                      "startDate",
                      "endDate",
                    ]}
                    resolveValue={(key, value) => {
                      return value;
                    }}
                    onSubmit={(e) => onSubmitFilter(e)}
                  />
                </div>
              </div>
            )}

            <div className="">
              <BubbleChart title="Search terms" subTitle="1,020" />
            </div>
          </div>

          {/* OPPORTUNITIES TABLE */}
          <div className="text-xl font-semibold">Opportunities</div>
          <div className="rounded-lg bg-white p-4">
            {/* NO ROWS */}
            {/* {opportunities && opportunities.items?.length === 0 && !query && (
              <div className="flex flex-col place-items-center py-52">
                <NoRowsMessage
                  title={"You will find your active opportunities here"}
                  description={
                    "This is where you will find all the awesome opportunities you have shared"
                  }
                />
                <Link href={`/organisations/${id}/opportunities/create`}>
                  <button className="btn btn-primary btn-sm mt-10 rounded-3xl px-16">
                    Add opportunity
                  </button>
                </Link>
              </div>
            )}
            {opportunities && opportunities.items?.length === 0 && query && (
              <div className="flex flex-col place-items-center py-52">
                <NoRowsMessage
                  title={"No opportunities found"}
                  description={"Please try refining your search query."}
                />
              </div>
            )} */}

            {/* GRID */}
            {/* {opportunities && opportunities.items?.length > 0 && ( */}
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr className="border-gray text-gray-dark">
                    <th>Opportunity</th>
                    <th>Views</th>
                    <th>Conversion ratio</th>
                    <th>Completions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-gray">
                    <td>
                      <Link href={`/organisations/${id}/opportunities/1/info`}>
                        Opportunity 1
                      </Link>
                    </td>
                    <td>200</td>
                    <td>78%</td>
                    <td>330</td>
                  </tr>
                  <tr className="border-gray">
                    <td>
                      <Link href={`/organisations/${id}/opportunities/1/info`}>
                        Opportunity 2
                      </Link>
                    </td>
                    <td>200</td>
                    <td>78%</td>
                    <td>330</td>
                  </tr>
                  <tr className="border-gray">
                    <td>
                      <Link href={`/organisations/${id}/opportunities/1/info`}>
                        Opportunity 3
                      </Link>
                    </td>
                    <td>200</td>
                    <td>78%</td>
                    <td>330</td>
                  </tr>
                  <tr className="border-gray">
                    <td>
                      <Link href={`/organisations/${id}/opportunities/1/info`}>
                        Opportunity 4
                      </Link>
                    </td>
                    <td>200</td>
                    <td>78%</td>
                    <td>330</td>
                  </tr>
                  <tr className="border-gray">
                    <td>
                      <Link href={`/organisations/${id}/opportunities/1/info`}>
                        Opportunity 5
                      </Link>
                    </td>
                    <td>200</td>
                    <td>78%</td>
                    <td>330</td>
                  </tr>
                  <tr className="border-gray">
                    <td>
                      <Link href={`/organisations/${id}/opportunities/1/info`}>
                        Opportunity 6
                      </Link>
                    </td>
                    <td>200</td>
                    <td>78%</td>
                    <td>330</td>
                  </tr>
                  <tr className="border-gray">
                    <td>
                      <Link href={`/organisations/${id}/opportunities/1/info`}>
                        Opportunity 7
                      </Link>
                    </td>
                    <td>200</td>
                    <td>78%</td>
                    <td>330</td>
                  </tr>
                  <tr className="border-gray">
                    <td>
                      <Link href={`/organisations/${id}/opportunities/1/info`}>
                        Opportunity 8
                      </Link>
                    </td>
                    <td>200</td>
                    <td>78%</td>
                    <td>330</td>
                  </tr>
                  <tr className="border-gray">
                    <td>
                      <Link href={`/organisations/${id}/opportunities/1/info`}>
                        Opportunity 9
                      </Link>
                    </td>
                    <td>200</td>
                    <td>78%</td>
                    <td>330</td>
                  </tr>
                  <tr className="border-gray">
                    <td>
                      <Link href={`/organisations/${id}/opportunities/1/info`}>
                        Opportunity 10
                      </Link>
                    </td>
                    <td>200</td>
                    <td>78%</td>
                    <td>330</td>
                  </tr>
                  <tr className="border-gray">
                    <td>
                      <Link href={`/organisations/${id}/opportunities/1/info`}>
                        Opportunity 11
                      </Link>
                    </td>
                    <td>200</td>
                    <td>78%</td>
                    <td>330</td>
                  </tr>
                  <tr className="border-gray">
                    <td>
                      <Link href={`/organisations/${id}/opportunities/1/info`}>
                        Opportunity 12
                      </Link>
                    </td>
                    <td>200</td>
                    <td>78%</td>
                    <td>330</td>
                  </tr>

                  {/* {opportunities.items.map((opportunity) => ( */}
                  {/* <tr key={opportunity.id} className="border-gray">
                        <td>
                          <Link
                            href={`/organisations/${id}/opportunities/${opportunity.id}/info`}
                          >
                            {opportunity.title}
                          </Link>
                        </td>
                        <td className="w-28">
                          <div className="flex flex-col">
                            {opportunity.zltoReward && (
                              <span className="text-xs">
                                {opportunity.zltoReward} Zlto
                              </span>
                            )}
                            {opportunity.yomaReward && (
                              <span className="text-xs">
                                {opportunity.yomaReward} Yoma
                              </span>
                            )}
                          </div>
                        </td>
                        <td>{opportunity.url}</td>
                        <td>{opportunity.participantCountTotal}</td>
                      </tr> */}
                  {/* ))} */}
                </tbody>
              </table>
            </div>
            {/* )} */}

            <div className="mt-2 grid place-items-center justify-center">
              {/* PAGINATION */}
              {/* <PaginationButtons
                currentPage={page ? parseInt(page) : 1}
                totalItems={opportunities?.totalCount ?? 0}
                pageSize={PAGE_SIZE}
                onClick={handlePagerChange}
                showPages={false}
                showInfo={true}
              />*/}
            </div>
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
  return page.props.theme;
};

export default OrganisationDashboard;
/* eslint-enable */
