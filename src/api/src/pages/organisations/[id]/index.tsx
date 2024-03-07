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
import {
  IoMdArrowUp,
  IoMdCompass,
  IoMdDocument,
  IoMdHourglass,
} from "react-icons/io";
import { useRouter } from "next/router";
import {
  OrganisationDashboardFilterOptions,
  OrganizationSearchFilterSummary,
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
  getCategories,
  getOpportunitiesAdmin,
  getOpportunityCategories,
} from "~/api/services/opportunities";
import { getAges, getCountries, getGenders } from "~/api/services/lookups";
import {
  OpportunityCategory,
  OpportunitySearchResults,
} from "~/api/models/opportunity";
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
// import {
//   DataTable,
//   VisualizationSelectionArray,
// } from "@types/google.visualization";
import Image from "next/image";
import iconZlto from "public/images/icon-zlto.svg";

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

type DataType = (string | number)[][];

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

//const colors = ["#387F6A", "#240b36", "#F9AB3E", "#F9AB3E", "#F9AB3E"];
//const colors  = ["#41204B", "#4CADE9", "#387F6A", "#F9AB3E"]; // purple, blue, green and yellow

// colors for green, organge, purple, blue, yellow, red, pink, teal, indigo, cyan
const colors = [
  "#387F6A",
  "#F9AB3E",
  "#240b36",
  "#4CADE9",
  "#F9AB3E",
  "#F87171",
  "#F472B6",
  "#60A5FA",
  "#818CF8",
  "#6EE7B7",
];

type DataTable = {
  legend: string[];
  count: number[];
  // Add other properties as needed
};

type VisualizationSelectionArray = {
  column?: number;
  row?: number;
  // Add other properties as needed
}[];

const updateCustomLegendLineChart = (
  legend_div: string,
  data: DataTable,
  selection: VisualizationSelectionArray | null,
) => {
  // Get the legend div
  const legendDiv = document.getElementById(legend_div);
  if (!legendDiv) return;

  // Clear the current legend
  legendDiv.innerHTML = "";

  // Add each series to the legend
  for (let i = 0; i < data.legend.length; i++) {
    // Create a div for the series
    const seriesDiv = document.createElement("div");
    seriesDiv.classList.add("ml-4");
    seriesDiv.classList.add("mt-2");

    // Add the series name and color to the div
    seriesDiv.innerHTML = `<div class="flex flex-col"><div class="flex flex-row gap-2 items-center"><span style="color: ${
      colors[i]
    }">●</span><span class="text-sm font-semibold">${
      data.legend[i]
    }</span></div>
        ${
          data.count[i] != null
            ? `<div class="text-2xl font-bold">${data.count[i]}</div>`
            : ""
        }
        </div>`;

    // If the series is selected, add a class to the div
    if (selection && selection.length > 0 && selection[0]?.column === i) {
      seriesDiv.classList.add("selected");
    }

    // Add the div to the legend
    legendDiv.appendChild(seriesDiv);
  }
};

const LineChart: React.FC<{
  id: string;
  title: string;
  data: TimeIntervalSummary;
  width: number;
  height: number;
  chartWidth?: number;
  chartHeight?: number;
  hideAxisesAndGridLines?: boolean;
}> = ({
  id,
  title,
  data,
  width,
  height,
  chartWidth,
  chartHeight,
  hideAxisesAndGridLines,
}) => {
  // map the data to the format required by the chart
  // const localData = data.data.map((x) => [x.date, ...x.values]);

  // map the data to the format required by the chart
  const localData = data.data.map((x) => {
    const date = new Date(x.date);
    const formattedDate = `${date.getFullYear()}-${String(
      date.getMonth() + 1,
    ).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    return [formattedDate, ...x.values];
  });

  // add the totals to the labels
  var labels = data.legend.map((x, i) => `${x} (Total: ${data.count[i]})`);

  // add labels to the beginning of the data array
  localData.unshift(["Date", ...labels]);

  return (
    <div
      className="overflow-hidden rounded-lg bg-white pt-2 shadow"
      style={{ minWidth: width, height: height }}
    >
      <div id={`legend_div_${id}`} className="flex flex-row gap-2"></div>
      <Chart
        width={chartWidth}
        height={chartHeight}
        chartType="LineChart"
        loader={<div>Loading Chart</div>}
        data={localData}
        options={{
          legend: "none",
          lineWidth: 2,
          areaOpacity: 0.1,
          colors: colors,
          curveType: "function",
          title: "", // Remove the title from the chart itself
          pointSize: 5, // this sets the size of the data points
          pointShape: "circle", // this sets the shape of the data points
          hAxis: hideAxisesAndGridLines
            ? {
                gridlines: {
                  color: "transparent",
                },
                textPosition: "none", // Hide the labels on the horizontal axis
                baselineColor: "transparent", // Hide the baseline on the horizontal axis
              }
            : {},
          vAxis: hideAxisesAndGridLines
            ? {
                gridlines: {
                  color: "transparent",
                },
                textPosition: "none", // Hide the labels on the vertical axis
                baselineColor: "transparent", // Hide the baseline on the vertical axis
              }
            : {},
        }}
        chartEvents={[
          {
            eventName: "ready",
            callback: () => {
              // Update the custom legend when the chart is ready
              updateCustomLegendLineChart(`legend_div_${id}`, data, null);
            },
          },
          {
            eventName: "select",
            callback: ({ chartWrapper }) => {
              // Update the custom legend when the selection changes
              const selection = chartWrapper.getChart().getSelection();
              updateCustomLegendLineChart(`legend_div_${id}`, data, selection);
            },
          },
        ]}
      />
    </div>
  );
};

// const PercentageDisplay: React.FC<{
//   percentage: number;
// }> = ({ percentage }) => {
//   return (
//     <div className="text-green-500 flex items-center gap-2">
//       <IoMdArrowUp className="rounded-full bg-gray text-green" />
//       <span className="text-xs font-bold text-green">
//         +{percentage.toFixed(2)}%
//       </span>
//       <span className="text-xs">monthly total so far</span>
//     </div>
//   );
// };

// const TitleAndSummaryCard: React.FC<{
//   title: string;
//   width: number;
//   height: number;
//   children: ReactElement;
// }> = ({ title, width, height, children }) => {
//   return (
//     // <div
//     //   className="flex h-40 w-72 flex-col rounded-lg bg-white p-4 shadow"
//     //   style={{ width: width, height: height }}
//     // >
//     //   <div className="flex flex-row items-center gap-2">
//     //     <IoMdDocument className="text-green" />
//     //     <div className="text-sm font-semibold">{title}</div>
//     //   </div>

//     //   {children}
//     // </div>
//   );
// };

type GoogleChartData = (string | number)[][];

const PieChart: React.FC<{
  id: string;
  title: string;
  data: GoogleChartData;
  colors?: string[];
}> = ({ id, title, data, colors }) => {
  return (
    <div className="relative w-72 overflow-hidden rounded-lg bg-white pt-10 shadow">
      <div
        className="flex flex-row items-center gap-2"
        style={{ position: "absolute", top: "10px", left: "10px", zIndex: 1 }}
      >
        <div className="text-sm font-semibold">{title}</div>
      </div>

      {data && (
        <Chart
          // width={100}
          height={100}
          chartType="PieChart"
          loader={<div>Loading Chart</div>}
          data={data}
          options={{
            legend: { position: "left" }, // Position the legend on the left

            title: "",
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

// const BubbleChart: React.FC<{ title: string; subTitle: string }> = ({
//   title,
//   subTitle,
// }) => {
//   return (
//     <div className="w-64x relative overflow-hidden rounded-lg bg-white pt-10 shadow">
//       <div
//         className="flex flex-row items-center gap-2"
//         style={{ position: "absolute", top: "10px", left: "10px", zIndex: 1 }}
//       >
//         <IoMdDocument className="text-green" />
//         <div className="text-sm font-semibold">{title}</div>
//       </div>
//       <p
//         className="text-2xl font-bold"
//         style={{ position: "absolute", top: "28px", left: "10px", zIndex: 1 }}
//       >
//         {subTitle}
//       </p>
//       <Chart
//         // width={"100%"}
//         // height={"100%"}
//         chartType="BubbleChart"
//         loader={<div>Loading Chart</div>}
//         data={[
//           ["ID", "Count", "Age", "Country", "Population"],
//           ["Term", 80.66, 60, "North America", 33739900],
//           ["Term", 79.84, 30, "Europe", 81902307],
//           ["Term", 78.6, 32, "Europe", 5523095],
//           ["Term", 72.73, 55, "Middle East", 79716203],
//           ["Term", 80.05, 24, "Europe", 61801570],
//           ["Term", 72.49, 18, "Middle East", 73137148],
//           ["Term", 68.09, 33, "Middle East", 31090763],
//           ["Term", 81.55, 44, "Middle East", 7485600],
//           ["Term", 68.6, 55, "Europe", 141850000],
//           ["Term", 78.09, 66, "North America", 307007000],
//         ]}
//         options={{
//           title: "",
//           // hAxis: { textPosition: "none", gridlines: { color: "transparent" } },
//           // vAxis: { textPosition: "none", gridlines: { color: "transparent" } },
//           hAxis: { title: "Age" },
//           vAxis: { title: "Count" },
//           bubble: { textStyle: { fontSize: 11 } },
//           //legend: { position: "left" },
//           chartArea: {
//             width: "60%",
//             height: "80%",
//           },
//         }}
//       />
//     </div>
//   );
// };

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
    queryFn: () => getCategories(),
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
  const { data: organisation } = useQuery<Organization>({
    queryKey: ["organisation", id],
  });

  // get filter parameters from route
  const { page, categories, opportunities, startDate, endDate } = router.query;

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
        page,
        categories,
        opportunities,
        startDate,
        endDate,
      ],
      queryFn: async () => {
        // get the default dates (start of month and start of next month)
        // let now = new Date();
        // let startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        // let startOfNextMonth = new Date(
        //   now.getFullYear(),
        //   now.getMonth() + 1,
        //   1,
        // );

        // return value
        // ? toISOStringForTimezone(new Date(value)).split("T")[0]
        // : ""

        return await getOrganisationDashboardSummary({
          //pageNumber: page ? parseInt(page.toString()) : 1,
          //pageSize: PAGE_SIZE,
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

          startDate: startDate ? startDate.toString() : "",
          endDate: endDate ? endDate.toString() : "",
        });
      },
      //enabled: isSearchPerformed, // only run query if search is executed
    });

  // search filter state
  const [searchFilter, setSearchFilter] =
    useState<OrganizationSearchFilterSummary>({
      //pageNumber: page ? parseInt(page.toString()) : 1,
      //pageSize: PAGE_SIZE,
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
        //TODO:
        //pageNumber: page ? parseInt(page.toString()) : 1,
        //pageSize: PAGE_SIZE,
        //valueContains: query ? decodeURIComponent(query.toString()) : null,
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
    page,
    categories,
    opportunities,
    startDate,
    endDate,
  ]);

  // 🎈 FUNCTIONS
  const getSearchFilterAsQueryString = useCallback(
    (opportunitySearchFilter: OrganizationSearchFilterSummary) => {
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

      //TODO:
      // if (
      //   opportunitySearchFilter.pageNumber !== null &&
      //   opportunitySearchFilter.pageNumber !== undefined &&
      //   opportunitySearchFilter.pageNumber !== 1
      // )
      //   params.append("page", opportunitySearchFilter.pageNumber.toString());

      if (params.size === 0) return null;
      return params;
    },
    [],
  );

  const redirectWithSearchFilterParams = useCallback(
    (filter: OrganizationSearchFilterSummary) => {
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
    (val: OrganizationSearchFilterSummary) => {
      redirectWithSearchFilterParams(val);
    },
    [redirectWithSearchFilterParams],
  );

  const onClearFilter = useCallback(() => {
    void router.push(`/organisations/${id}`, undefined, { scroll: true });
  }, [router]);

  //
  const [isExportButtonLoading, setIsExportButtonLoading] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const handleExportToCSV = useCallback(
    async () => {
      setIsExportButtonLoading(true);

      // try {
      //   opportunitySearchFilter.pageSize = PAGE_SIZE_MAXIMUM;
      //   const data = await getOpportunitiesAdminExportToCSV(
      //     opportunitySearchFilter,
      //   );
      //   if (!data) return;

      //   FileSaver.saveAs(data);

      //   setExportDialogOpen(false);
      // } finally {
      //   setIsExportButtonLoading(false);
      // }
    },
    [
      //opportunitySearchFilter, setIsExportButtonLoading, setExportDialogOpen
    ],
  );

  return (
    <>
      <Head>
        <title>Yoma | Organisation Dashboard</title>
      </Head>

      <PageBackground height={18} />

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
          <div className="flex flex-row gap-1">
            <span>Your dashboard progress so far</span>
            {(startDate || endDate) && (
              <div className="flex flex-row gap-1">
                <span>for</span>
                {startDate && (
                  <span className="font-semibold">
                    {startDate.toString().split("T")[0]}
                  </span>
                )}
                <span>-</span>
                {endDate && (
                  <span className="font-semibold">
                    {endDate.toString().split("T")[0]}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-4 ">
          {/* FILTERS */}
          <div className="mb-4 mt-10 hidden md:flex">
            {!lookups_categories ||
              (!lookups_opportunities && <div>Loading...</div>)}
            {lookups_categories && lookups_opportunities && (
              <div className="flex flex-grow flex-col gap-3">
                <OrganisationRowFilter
                  htmlRef={myRef.current!}
                  searchFilter={searchFilter}
                  lookups_categories={lookups_categories}
                  lookups_opportunities={lookups_opportunities}
                  clearButtonText="Clear"
                  onClear={onClearFilter}
                  onSubmit={(e) => onSubmitFilter(e)}
                  totalCount={0}
                  exportToCsv={handleExportToCSV}
                />
                {/* FILTER BADGES */}
                <FilterBadges
                  searchFilter={searchFilter}
                  excludeKeys={["pageNumber", "pageSize", "organization"]}
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

          {/* searchResults: {JSON.stringify(searchResults)} */}

          {/* ENGAGEMENT */}
          <div className="flex flex-col gap-2">
            <div className="text-xl font-semibold">Engagement</div>

            <div className="flex flex-col gap-2 md:flex-row">
              {/* VIEWED COMPLETED */}
              {searchResults?.opportunities?.viewedCompleted && (
                <LineChart
                  id="viewedCompleted"
                  title="All visitors"
                  data={searchResults.opportunities.viewedCompleted}
                  width={602}
                  height={328}
                  // chartWidth={580}
                  // chartHeight={240}
                />
              )}

              <div className="flex flex-col gap-2">
                <div className="flex flex-row gap-2">
                  {/* AVERAGE TIME */}
                  <div className="flex h-40 w-72 flex-col rounded-lg bg-white p-4 shadow">
                    <div className="flex flex-row items-center gap-2">
                      {/* <IoMdHourglass className="text-green" /> */}
                      <div className="text-sm font-semibold">Average time</div>
                    </div>

                    <div className="flex flex-grow flex-col">
                      <div className="flex-grow text-2xl font-bold">
                        {searchResults?.opportunities.completion
                          .averageTimeInDays ?? 0}
                      </div>
                    </div>
                  </div>

                  {/* <TitleAndSummaryCard
                    title="Average time"
                    width={288}
                    height={160}
                  >
                    <div className="flex flex-grow flex-col">
                      <div className="flex-grow text-2xl font-bold">
                        {searchResults?.opportunities.completion
                          .averageTimeInDays ?? 0}
                      </div>
                    </div>
                  </TitleAndSummaryCard> */}

                  {/* CONVERSERSION RATE */}
                  {searchResults?.opportunities?.conversionRate && (
                    <PieChart
                      id="conversionRate"
                      title="Conversion rate"
                      colors={["#387F6A", "#F9AB3E"]} // green and yellow
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
                    />
                  )}
                </div>

                <div className="flex flex-row gap-2">
                  {/* ACTIVE OPPORTUNITIES */}
                  {searchResults?.opportunities?.active && (
                    <LineChart
                      id="activeOpportunities"
                      title="Active Opportunities"
                      data={searchResults?.opportunities.active}
                      width={291}
                      height={160}
                      chartWidth={291}
                      chartHeight={100}
                      hideAxisesAndGridLines={true}
                    />
                  )}

                  {/* PENDING VERIFICATIONS */}
                  {searchResults?.opportunities?.pendingVerification && (
                    <LineChart
                      id="pendingVerification"
                      title="Pending verifications"
                      data={searchResults?.opportunities.pendingVerification}
                      width={291}
                      height={160}
                      chartWidth={291}
                      chartHeight={100}
                      hideAxisesAndGridLines={true}
                    />
                    // <TitleAndSummaryCard title="Pending verifications">
                    //   <div className="flex flex-grow flex-col">
                    //     <div className="flex-grow text-2xl font-bold">
                    //       {searchResults?.opportunities.pendingVerification
                    //         .count ?? 0}
                    //     </div>
                    //   </div>
                    // </TitleAndSummaryCard>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* REWARDS */}
          <div className="flex flex-col gap-2">
            <div className="text-xl font-semibold">Rewards</div>

            <div
              //className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"

              className="flex flex-col gap-2 md:flex-row"
            >
              {/* ZLTO AMOUNT AWARDED */}
              <div className="flexx h-40 min-w-[288px] flex-col rounded-lg bg-white p-4 shadow">
                <div className="flex flex-row items-center gap-2">
                  {/* <IoMdDocument className="text-green" /> */}
                  <Image
                    src={iconZlto}
                    alt="Icon Zlto"
                    width={20}
                    height={20}
                    sizes="100vw"
                    priority={true}
                    style={{ width: "20px", height: "20px" }}
                  />
                  <div className="whitespace-nowrap text-sm font-semibold">
                    ZLTO amount awarded
                  </div>
                </div>
                <div className="flex flex-grow flex-col">
                  <div className="flex-grow text-2xl font-bold">
                    {searchResults?.opportunities.reward.totalAmount ?? 0}
                  </div>
                </div>
              </div>
              {/* <TitleAndSummaryCard
                title="ZLTO amount awarded"
                width={288}
                height={160}
              >
                <div className="flex flex-grow flex-col">
                  <div className="flex-grow text-2xl font-bold">
                    {searchResults?.opportunities.reward.totalAmount ?? 0}
                  </div>
                  {/* {searchResults?.opportunities.reward.percentage && (
                    <PercentageDisplay
                      percentage={
                        searchResults?.opportunities.reward.percentage
                      }
                    />
                  )}
                </div>
              </TitleAndSummaryCard> */}

              {searchResults?.skills?.items && (
                <LineChart
                  id="totalSkills"
                  title="Total skills"
                  data={searchResults?.skills.items}
                  width={291}
                  height={160}
                  chartWidth={291}
                  chartHeight={100}
                  hideAxisesAndGridLines={true}
                />
              )}

              {/* SKILLS */}
              {searchResults?.skills?.topCompleted && (
                <>
                  {/* MOST COMPLETED SKILLS */}
                  <div className="flex h-[160px] w-[576px] flex-col rounded-lg bg-white p-4 shadow">
                    <div className="flex flex-row items-center gap-2">
                      <IoMdCompass className="text-green" />
                      <div className="text-sm font-semibold">
                        Most completed skills
                      </div>
                    </div>
                    <div className="mt-2 flex flex-grow flex-wrap gap-1 overflow-hidden">
                      {searchResults?.skills.topCompleted.map((x) => (
                        <div
                          key={x.id}
                          className="min-h-6 badge rounded-md border-0 bg-green text-white"
                        >
                          {x.name}
                        </div>
                      ))}
                    </div>
                  </div>
                </>

                // <TitleAndSummaryCard
                //   title="Most completed skills"
                //   width={576}
                //   height={160}
                // >
                //   <div className="mt-2 flex flex-grow flex-wrap overflow-hidden">
                //     {searchResults?.skills.topCompleted.map((x) => (
                //       <div
                //         key={x.id}
                //         className="min-h-6 badge mr-2 rounded-md border-0 bg-green text-white"
                //       >
                //         {x.name}
                //       </div>
                //     ))}
                //   </div>
                // </TitleAndSummaryCard>
              )}
            </div>
          </div>

          {/* DEMOGRAPHICS */}
          <div className="flex flex-col gap-2">
            <div className="text-xl font-semibold">Demographics</div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {/* COUNTRIES */}
              {searchResults &&
                searchResults.demographics &&
                searchResults.demographics.countries && (
                  <PieChart
                    id="countries"
                    title="Country"
                    colors={colors}
                    data={[
                      ["Country", "Value"],
                      ...Object.entries(
                        searchResults.demographics.countries,
                      ).map(([item1, item2]) => [item1, item2]),
                    ]}
                  />
                )}

              {/* GENDERS */}
              {searchResults?.demographics?.genders && (
                <PieChart
                  id="genders"
                  title="Genders"
                  colors={colors}
                  data={[
                    ["Gender", "Value"],
                    ...Object.entries(searchResults.demographics.genders).map(
                      ([item1, item2]) => [item1, item2],
                    ),
                  ]}
                />
              )}

              {/* AGE */}
              {searchResults?.demographics?.genders && (
                <PieChart
                  id="ages"
                  title="Age"
                  colors={colors}
                  data={[
                    ["Age", "Value"],
                    ...Object.entries(searchResults.demographics.ages).map(
                      ([item1, item2]) => [item1, item2],
                    ),
                  ]}
                />
              )}
            </div>
          </div>

          {/* SELECTED OPPORTUNITIES */}
          <div className="text-xl font-semibold">Selected Opportunities</div>
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

          {/* COMPLETED YOUTH */}
          <div className="text-xl font-semibold">Completed Youth</div>
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
                    <th>Student</th>
                    <th>Opportunity</th>
                    <th>Date connected</th>
                    <th>Verified</th>
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
