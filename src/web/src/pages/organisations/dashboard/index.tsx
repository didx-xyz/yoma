import { useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import moment from "moment";
import type { GetServerSidePropsContext } from "next";
import { getServerSession } from "next-auth";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import iconZltoGreen from "public/images/icon-zlto-green.svg";
import iconZlto from "public/images/icon-zlto.svg";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactElement,
} from "react";
import "react-datepicker/dist/react-datepicker.css";
import {
  IoMdCheckmarkCircleOutline,
  IoMdClose,
  IoMdCloseCircleOutline,
  IoMdInformationCircleOutline,
  IoMdOptions,
  IoMdPerson,
  IoMdTrophy,
} from "react-icons/io";
import Moment from "react-moment";
import type { Country } from "~/api/models/lookups";
import type {
  OpportunityCategory,
  OpportunitySearchResultsInfo,
} from "~/api/models/opportunity";
import type { OrganizationSearchResults } from "~/api/models/organisation";
import type {
  OrganizationSearchFilterOpportunity,
  OrganizationSearchFilterYouth,
  OrganizationSearchResultsOpportunity,
  OrganizationSearchResultsSSO,
  OrganizationSearchResultsSummary,
  OrganizationSearchResultsYouth,
  YouthInfo,
} from "~/api/models/organizationDashboard";
import { getCountries } from "~/api/services/lookups";
import {
  getCategories,
  searchCriteriaOpportunities,
} from "~/api/services/opportunities";
import { getOrganisations } from "~/api/services/organisations";
import {
  searchOrganizationEngagement,
  searchOrganizationOpportunities,
  searchOrganizationSso,
  searchOrganizationYouth,
} from "~/api/services/organizationDashboard";
import { AvatarImage } from "~/components/AvatarImage";
import CustomCarousel from "~/components/Carousel/CustomCarousel";
import CustomSlider from "~/components/Carousel/CustomSlider";
import CustomModal from "~/components/Common/CustomModal";
import FormMessage, { FormMessageType } from "~/components/Common/FormMessage";
import Suspense from "~/components/Common/Suspense";
import FilterBadges from "~/components/FilterBadges";
import MainLayout from "~/components/Layout/Main";
import NoRowsMessage from "~/components/NoRowsMessage";
import FilterTab from "~/components/Opportunity/FilterTab";
import OpportunityStatus from "~/components/Opportunity/OpportunityStatus";
import { DashboardFilterVertical } from "~/components/Organisation/Dashboard/DashboardFilterVertical";
import { LineChartCumulativeCompletions } from "~/components/Organisation/Dashboard/LineChartCumulativeCompletions";
import { LineChartOverview } from "~/components/Organisation/Dashboard/LineChartOverview";
import { OpportunityCard } from "~/components/Organisation/Dashboard/OpportunityCard";
import { PieChart } from "~/components/Organisation/Dashboard/PieChart";
import { SkillsList } from "~/components/Organisation/Dashboard/SkillsList";
import { SkillsChart } from "~/components/Organisation/Dashboard/SkillsChart";
import { SsoChartCombined } from "~/components/Organisation/Dashboard/SsoChartCombined";
import { WorldMapChart } from "~/components/Organisation/Dashboard/WorldMapChart";
import { YouthCompletedCard } from "~/components/Organisation/Dashboard/YouthCompletedCard";
import { PageBackground } from "~/components/PageBackground";
import { PaginationButtons } from "~/components/PaginationButtons";
import { InternalServerError } from "~/components/Status/InternalServerError";
import LimitedFunctionalityBadge from "~/components/Status/LimitedFunctionalityBadge";
import { LoadingSkeleton } from "~/components/Status/LoadingSkeleton";
import { Unauthenticated } from "~/components/Status/Unauthenticated";
import { Unauthorized } from "~/components/Status/Unauthorized";
import {
  CHART_COLORS,
  DATE_FORMAT_HUMAN,
  DATETIME_FORMAT_HUMAN,
  PAGE_SIZE,
  PAGE_SIZE_MINIMUM,
  ROLE_ADMIN,
  THEME_BLUE,
  THEME_GREEN,
} from "~/lib/constants";
import { getTimeOfDayAndEmoji, toISOStringForTimezone } from "~/lib/utils";
import type { NextPageWithLayout } from "~/pages/_app";
import { authOptions } from "~/server/auth";

export interface OrganizationSearchFilterSummaryViewModel {
  organizations: string[] | null;
  opportunities: string[] | null;
  categories: string[] | null;
  startDate: string | null;
  endDate: string | null;
  pageSelectedOpportunities: number;
  pageCompletedYouth: number;
  pageSSO: number;
  countries: string[] | null;
}

// ⚠️ SSR
export async function getServerSideProps(context: GetServerSidePropsContext) {
  // get filter parameters from route
  const {
    pageSelectedOpportunities,
    pageCompletedYouth,
    pageSSO,
    categories,
    opportunities,
    startDate,
    endDate,
    countries,
    organisations,
  } = context.query;

  const searchFilter = {
    organizations: organisations ? organisations?.toString().split("|") : null,
    opportunities: opportunities ? opportunities?.toString().split("|") : null,
    countries: countries ? countries?.toString().split("|") : null,
    categories: categories ? categories?.toString().split("|") : null,
    startDate: startDate ? startDate.toString() : "",
    endDate: endDate ? endDate.toString() : "",
    pageSelectedOpportunities: pageSelectedOpportunities
      ? parseInt(pageSelectedOpportunities.toString())
      : 1,
    pageCompletedYouth: pageCompletedYouth
      ? parseInt(pageCompletedYouth.toString())
      : 1,
    pageSSO: pageSSO ? parseInt(pageSSO.toString()) : 1,
  };

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
  let theme = THEME_GREEN;
  if (session?.user?.roles.includes(ROLE_ADMIN)) theme = THEME_BLUE;

  let lookups_selectedOpportunities;
  let lookups_selectedOrganisations;

  try {
    // lookup each of the opportunities (to resolve ids to titles for filter badges)
    if (!!searchFilter.opportunities) {
      lookups_selectedOpportunities = await searchCriteriaOpportunities(
        {
          opportunities: searchFilter.opportunities,
          organizations: searchFilter.organizations,
          countries: null,
          titleContains: null,
          published: null,
          verificationMethod: null,
          verificationEnabled: null,
          pageNumber: 1,
          pageSize: searchFilter.opportunities?.length ?? 0,
        },
        context,
      );
    }

    // HACK: lookup each of the organizations (to resolve ids to titles for filter badges)
    if (!!searchFilter.organizations) {
      lookups_selectedOrganisations = await getOrganisations(
        {
          organizations: searchFilter.organizations,
          valueContains: null,
          statuses: null,
          pageNumber: 1,
          pageSize: searchFilter.organizations?.length ?? 0,
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
      user: session?.user ?? null,
      searchFilter: searchFilter,
      lookups_selectedOpportunities: lookups_selectedOpportunities ?? null,
      lookups_selectedOrganisations: lookups_selectedOrganisations ?? null,
      theme: theme,
      error: errorCode,
    },
  };
}

// Partner/Admin Organisation dashboard page
const OrganisationDashboard: NextPageWithLayout<{
  user?: any;
  searchFilter: OrganizationSearchFilterSummaryViewModel;
  lookups_selectedOpportunities?: OpportunitySearchResultsInfo;
  lookups_selectedOrganisations?: OrganizationSearchResults;
  error?: number;
}> = ({
  user,
  searchFilter,
  lookups_selectedOpportunities,
  lookups_selectedOrganisations,
  error,
}) => {
  const router = useRouter();
  const myRef = useRef<HTMLDivElement>(null);
  const [filterFullWindowVisible, setFilterFullWindowVisible] = useState(false);
  const queryClient = useQueryClient();
  const [
    completedYouthOpportunitiesDialogVisible,
    setCompletedYouthOpportunitiesDialogVisible,
  ] = useState(false);
  const [completedYouthOpportunities, setCompletedYouthOpportunities] =
    useState<YouthInfo | null>();
  const [
    gotoCompletedConversionRatioDialogVisible,
    setGotoCompletedConversionRatioDialogVisible,
  ] = useState(false);
  const isAdmin = user?.roles.includes(ROLE_ADMIN);
  const [timeOfDay, timeOfDayEmoji] = getTimeOfDayAndEmoji();

  //#region Tab state
  const [activeTab, setActiveTab] = useState("engagement");

  useEffect(() => {
    if (router.query.tab) {
      setActiveTab(router.query.tab.toString());
    }
  }, [router.query.tab]);
  //#endregion Tab state

  //#region Queries
  // QUERY: CATEGORIES (GET ALL LOOKUPS TO RESOLVE NAMES)
  const { data: categoriesData, isLoading: categoriesIsLoading } = useQuery<
    OpportunityCategory[]
  >({
    queryKey: ["organisationCategories", searchFilter],
    queryFn: () => getCategories(),
  });

  // QUERY: COUNTRIES (GET ALL LOOKUPS TO RESOLVE NAMES)
  const { data: countriesData, isLoading: countriesIsLoading } = useQuery<
    Country[]
  >({
    queryKey: ["countries"],
    queryFn: () => getCountries(),
  });

  // QUERY: SEARCH RESULTS
  const {
    data: engagementData,
    isLoading: engagementIsLoading,
    error: engagementError,
  } = useQuery<OrganizationSearchResultsSummary>({
    queryKey: ["organisationEngagement", searchFilter],
    queryFn: async () => {
      return await searchOrganizationEngagement({
        organizations: searchFilter.organizations ?? [],
        opportunities: searchFilter.opportunities ?? null,
        countries:
          searchFilter.countries != undefined
            ? searchFilter.countries
                ?.map((x) => {
                  const item = countriesData?.find((y) => y.name === x);
                  return item ? item?.id : "";
                })
                .filter((x) => x != "")
            : null,
        categories:
          searchFilter.categories != undefined
            ? searchFilter.categories
                ?.map((x) => {
                  const item = categoriesData?.find((y) => y.name === x);
                  return item ? item?.id : "";
                })
                .filter((x) => x != "")
            : null,
        startDate: searchFilter.startDate
          ? searchFilter.startDate.toString()
          : "",
        endDate: searchFilter.endDate ? searchFilter.endDate.toString() : "",
      });
    },
    enabled: !error && !categoriesIsLoading && !countriesIsLoading,
  });

  // QUERY: COMPLETED YOUTH
  const {
    data: completedOpportunitiesData,
    isLoading: completedOpportunitiesIsLoading,
    error: completedOpportunitiesError,
  } = useQuery<OrganizationSearchResultsYouth>({
    queryKey: [
      "organisationCompletedYouth",
      searchFilter,
      searchFilter.pageCompletedYouth,
    ],
    queryFn: () =>
      searchOrganizationYouth({
        organizations: searchFilter.organizations ?? [],
        opportunities: searchFilter.opportunities ?? null,
        countries:
          searchFilter.countries != undefined
            ? searchFilter.countries
                ?.map((x) => {
                  const item = countriesData?.find((y) => y.name === x);
                  return item ? item?.id : "";
                })
                .filter((x) => x != "")
            : null,
        categories:
          searchFilter.categories != undefined
            ? searchFilter.categories
                ?.map((x) => {
                  const item = categoriesData?.find((y) => y.name === x);
                  return item ? item?.id : "";
                })
                .filter((x) => x != "")
            : null,
        startDate: searchFilter.startDate
          ? searchFilter.startDate.toString()
          : "",
        endDate: searchFilter.endDate ? searchFilter.endDate.toString() : "",
        pageNumber: searchFilter.pageCompletedYouth
          ? searchFilter.pageCompletedYouth
          : 1,
        pageSize: PAGE_SIZE,
      }),
    enabled: !error && !categoriesIsLoading && !countriesIsLoading,
  });

  // QUERY: SELECTED OPPORTUNITIES
  const {
    data: selectedOpportunitiesData,
    isLoading: selectedOpportunitiesIsLoading,
    error: selectedOpportunitiesError,
  } = useQuery<OrganizationSearchResultsOpportunity>({
    queryKey: [
      "organisationSelectedOpportunities",
      searchFilter,
      searchFilter.pageSelectedOpportunities,
    ],
    queryFn: () =>
      searchOrganizationOpportunities({
        organizations: searchFilter.organizations ?? [],
        opportunities: searchFilter.opportunities ?? null,
        categories:
          searchFilter.categories != undefined
            ? searchFilter.categories
                ?.map((x) => {
                  const item = categoriesData?.find((y) => y.name === x);
                  return item ? item?.id : "";
                })
                .filter((x) => x != "")
            : null,
        startDate: searchFilter.startDate
          ? searchFilter.startDate.toString()
          : "",
        endDate: searchFilter.endDate ? searchFilter.endDate.toString() : "",
        pageNumber: searchFilter.pageSelectedOpportunities
          ? searchFilter.pageSelectedOpportunities
          : 1,
        pageSize: PAGE_SIZE,
      }),
    enabled: !error && !categoriesIsLoading,
  });

  // QUERY: SSO
  const {
    data: ssoData,
    isLoading: ssoIsLoading,
    error: ssoError,
  } = useQuery<OrganizationSearchResultsSSO>({
    queryKey: ["organisationSSO", searchFilter, searchFilter.pageSSO],
    queryFn: () =>
      searchOrganizationSso({
        organizations: searchFilter.organizations ?? [],
        startDate: searchFilter.startDate
          ? searchFilter.startDate.toString()
          : "",
        endDate: searchFilter.endDate ? searchFilter.endDate.toString() : "",
        pageNumber: searchFilter.pageSSO ? searchFilter.pageSSO : 1,
        pageSize: PAGE_SIZE,
      }),
    enabled: !error,
  });
  //#endregion Queries

  //#region Carousels
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
          searchFilter.organizations,
          searchFilter.categories,
          searchFilter.opportunities,
          searchFilter.startDate,
          searchFilter.endDate,
        ],
        {
          pageNumber: pageNumber,
          pageSize: PAGE_SIZE_MINIMUM,
          organizations: searchFilter.organizations ?? [],
          categories: searchFilter.categories ?? [],
          opportunities: searchFilter.opportunities
            ? searchFilter.opportunities?.toString().split("|")
            : null,
          startDate: searchFilter.startDate
            ? searchFilter.startDate.toString()
            : "",
          endDate: searchFilter.endDate ? searchFilter.endDate.toString() : "",
        },
      );
    },
    [
      selectedOpportunitiesData,
      fetchDataAndUpdateCache_Opportunities,
      searchFilter.categories,
      searchFilter.opportunities,
      searchFilter.startDate,
      searchFilter.endDate,
      searchFilter.organizations,
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
          searchFilter.organizations,
          searchFilter.categories,
          searchFilter.opportunities,
          searchFilter.startDate,
          searchFilter.endDate,
          searchFilter.countries,
        ],
        {
          pageNumber: pageNumber,
          pageSize: PAGE_SIZE_MINIMUM,
          organizations: searchFilter.organizations ?? [],
          categories: searchFilter.categories ?? [],
          opportunities: searchFilter.opportunities
            ? searchFilter.opportunities?.toString().split("|")
            : null,
          startDate: searchFilter.startDate
            ? searchFilter.startDate.toString()
            : "",
          endDate: searchFilter.endDate ? searchFilter.endDate.toString() : "",
          countries: searchFilter.countries ?? [],
        },
      );
    },
    [
      completedOpportunitiesData,
      fetchDataAndUpdateCache_Youth,
      searchFilter.categories,
      searchFilter.opportunities,
      searchFilter.startDate,
      searchFilter.endDate,
      searchFilter.countries,
      searchFilter.organizations,
    ],
  );
  //#endregion Carousels

  //#region Methods
  const getSearchFilterAsQueryString = useCallback(
    (opportunitySearchFilter: OrganizationSearchFilterSummaryViewModel) => {
      if (!opportunitySearchFilter) return null;

      // construct querystring parameters from filter
      const params = new URLSearchParams();

      if (
        opportunitySearchFilter?.organizations?.length !== undefined &&
        opportunitySearchFilter.organizations.length > 0
      )
        params.append(
          "organisations",
          opportunitySearchFilter.organizations.join("|"),
        );

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

      if (
        opportunitySearchFilter.pageSSO !== null &&
        opportunitySearchFilter.pageSSO !== undefined &&
        opportunitySearchFilter.pageSSO !== 1
      )
        params.append("pageSSO", opportunitySearchFilter.pageSSO.toString());

      // current tab
      params.append("tab", activeTab);

      if (params.size === 0) return null;
      return params;
    },
    [activeTab],
  );
  const redirectWithSearchFilterParams = useCallback(
    (filter: OrganizationSearchFilterSummaryViewModel) => {
      let url = `/organisations/dashboard`;
      const params = getSearchFilterAsQueryString(filter);
      if (params != null && params.size > 0)
        url = `${url}?${params.toString()}`;

      if (url != router.asPath)
        void router.push(url, undefined, { scroll: false });
    },
    [router, getSearchFilterAsQueryString],
  );
  //#endregion Methods

  //#region Events

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
  const handlePagerChangeSSO = useCallback(
    (value: number) => {
      searchFilter.pageSSO = value;
      redirectWithSearchFilterParams(searchFilter);
    },
    [searchFilter, redirectWithSearchFilterParams],
  );
  //#endregion Events

  // //#region Filter Popup Handlers
  const onCloseFilter = useCallback(() => {
    setFilterFullWindowVisible(false);
  }, [setFilterFullWindowVisible]);

  const onClearFilter = useCallback(() => {
    redirectWithSearchFilterParams({
      organizations: !isAdmin ? searchFilter.organizations : null, // org admins can't clear org
      countries: null,
      categories: null,
      opportunities: null,
      startDate: null,
      endDate: null,
      pageSelectedOpportunities: 1,
      pageCompletedYouth: 1,
      pageSSO: 1,
    });

    setFilterFullWindowVisible(false);
  }, [router, setFilterFullWindowVisible]);

  const onSubmitFilter = useCallback(
    (val: OrganizationSearchFilterSummaryViewModel) => {
      redirectWithSearchFilterParams({
        organizations: val.organizations,
        countries: val.countries,
        categories: val.categories,
        opportunities: val.opportunities,
        startDate: val.startDate,
        endDate: val.endDate,
        pageSelectedOpportunities: searchFilter.pageSelectedOpportunities
          ? searchFilter.pageSelectedOpportunities
          : 1,
        pageCompletedYouth: searchFilter.pageCompletedYouth
          ? searchFilter.pageCompletedYouth
          : 1,
        pageSSO: searchFilter.pageSSO ? searchFilter.pageSSO : 1,
      });
    },
    [
      redirectWithSearchFilterParams,
      searchFilter.pageSelectedOpportunities,
      searchFilter.pageCompletedYouth,
      searchFilter.pageSSO,
    ],
  );
  //#endregion Filter Popup Handlers

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

      <PageBackground className="h-[328px] md:h-[332px]" />

      {/* REFERENCE FOR FILTER POPUP: fix menu z-index issue */}
      <div ref={myRef} />

      {/* POPUP FILTER */}
      <FilterTab openFilter={setFilterFullWindowVisible} />
      <CustomModal
        isOpen={filterFullWindowVisible}
        shouldCloseOnOverlayClick={true}
        onRequestClose={() => {
          setFilterFullWindowVisible(false);
        }}
        className="md:max-h-[600px] md:w-[700px]"
        animationStyle="slide-top"
      >
        <DashboardFilterVertical
          htmlRef={myRef.current!}
          searchFilter={searchFilter}
          lookups_selectedOpportunities={lookups_selectedOpportunities}
          lookups_selectedOrganisations={lookups_selectedOrganisations}
          submitButtonText="Apply Filters"
          onCancel={onCloseFilter}
          onSubmit={(e) => onSubmitFilter(e)}
          onClear={onClearFilter}
          clearButtonText="Clear All Filters"
          isAdmin={isAdmin}
        />
      </CustomModal>

      {/* GOTO/COMPLETION CONVERSION RATIO DIALOG */}
      <CustomModal
        isOpen={gotoCompletedConversionRatioDialogVisible}
        shouldCloseOnOverlayClick={false}
        onRequestClose={() => {
          setGotoCompletedConversionRatioDialogVisible(false);
        }}
        className="md:max-h-[600px] md:w-[700px]"
      >
        <div className="flex h-full flex-col gap-2 overflow-y-auto">
          <div className="bg-theme flex h-16 flex-row justify-end p-8 shadow-lg">
            <button
              type="button"
              className="btn -mr-4 -mt-6 rounded-full border-0 bg-gray-light p-3 text-gray-dark hover:bg-gray"
              onClick={() =>
                setGotoCompletedConversionRatioDialogVisible(false)
              }
            >
              <IoMdClose className="h-6 w-6"></IoMdClose>
            </button>
          </div>
          <div className="flex flex-col items-center justify-center gap-4 px-6 pb-8 text-center md:px-12">
            <div className="-mt-8 flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-lg">
              <IoMdInformationCircleOutline className="size-7 text-blue" />
            </div>

            <div className="flex flex-col gap-2">
              <h4 className="text-xl font-semibold tracking-wide">
                Understanding Your Metrics
              </h4>
              <div className="flex flex-row gap-1 text-sm">
                These metrics show your user&apos;s journey from first view to
                completion:
              </div>
            </div>

            <div className="divider my-1 grow-0 !bg-gray" />

            <div className="flex flex-col gap-4 text-sm">
              <div className="flex items-start gap-2">
                <span className="mr-2 text-lg">👀</span>
                <div className="text-left">
                  <span className="font-bold">Total Views:</span> The number of
                  times your opportunities have been viewed by users after
                  clicking through.
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="mr-2 text-lg">➡️</span>
                <div className="text-left">
                  <span className="font-bold">View-to-Click Conversion:</span>{" "}
                  The percentage of viewers who clicked on your external links.
                  This shows how effective your opportunity descriptions are at
                  generating interest.
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="mr-2 text-lg">👆</span>
                <div className="text-left">
                  <span className="font-bold">Links Clicked:</span> The total
                  number of times users clicked external links in your
                  opportunities.
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="mr-2 text-lg">➡️</span>
                <div className="text-left">
                  <span className="font-bold">
                    Click-to-Completion Conversion:
                  </span>{" "}
                  The percentage of users who completed the opportunity after
                  clicking the link. This measures how well the external process
                  converts interested users.
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="mr-2 text-lg">🏆</span>
                <div className="text-left">
                  <span className="font-bold">Total Completions:</span> The
                  number of users who have fully completed your opportunities
                  after clicking through.
                </div>
              </div>
            </div>

            <div className="divider my-1 grow-0 !bg-gray" />

            {/* BUTTONS */}
            <div
              className={`mt-8x flex flex-row items-center justify-center gap-4`}
            >
              <button
                type="button"
                className="w-1/2z btn btn-warning btn-wide flex-shrink normal-case"
                onClick={() => {
                  setGotoCompletedConversionRatioDialogVisible(false);
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </CustomModal>

      {/* COMPLETED YOUTH OPPORTUNITIES DIALOG */}
      <CustomModal
        isOpen={completedYouthOpportunitiesDialogVisible}
        shouldCloseOnOverlayClick={false}
        onRequestClose={() => {
          setCompletedYouthOpportunitiesDialogVisible(false);
        }}
        className="md:max-h-[600px] md:w-[700px]"
      >
        <div className="flex h-full flex-col gap-2 overflow-y-auto pb-8">
          <div className="bg-theme flex h-16 flex-row justify-end p-8 shadow-lg">
            <button
              type="button"
              className="btn -mr-4 -mt-6 rounded-full border-0 bg-gray-light p-3 text-gray-dark hover:bg-gray"
              onClick={() => setCompletedYouthOpportunitiesDialogVisible(false)}
            >
              <IoMdClose className="h-6 w-6"></IoMdClose>
            </button>
          </div>
          <div className="flex flex-col items-center justify-center gap-4 px-6 pb-8 text-center md:px-12">
            <div className="-mt-8 flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-lg">
              <IoMdTrophy className="size-7 text-orange" />
            </div>

            <div className="flex flex-col gap-2">
              <h4 className="text-xl font-semibold tracking-wide">
                Completed Opportunities
              </h4>
              <div className="flex flex-row gap-1 text-sm">
                <div className="text-sm font-semibold italic tracking-widest">
                  {completedYouthOpportunities?.displayName}
                </div>
                <div>has completed the following opportunities:</div>
              </div>
            </div>

            {/* OPPORTUNITIES */}
            <div className="px-4">
              <table className="table">
                <thead>
                  <tr className="border-gray-light text-gray-dark">
                    <th className="p-2 text-left">Opportunity</th>
                    <th className="p-2 text-left">Date Completed</th>
                    <th className="p-2 text-left">Verified</th>
                  </tr>
                </thead>
                <tbody>
                  {completedYouthOpportunities?.opportunities.map(
                    (opportunity, index) => (
                      <tr
                        key={opportunity.id || index}
                        className="border-gray-light"
                      >
                        <td>
                          <Link
                            href={`/organisations/${
                              opportunity.organizationId
                            }/opportunities/${
                              opportunity.id
                            }/info?returnUrl=${encodeURIComponent(
                              router.asPath,
                            )}`}
                            className="line-clamp-1 w-40 underline md:w-64"
                            target="_blank"
                            title={opportunity.title}
                          >
                            {opportunity.title}
                          </Link>
                        </td>
                        <td className="p-2x">
                          {opportunity.dateCompleted ? (
                            <Moment
                              format={DATE_FORMAT_HUMAN}
                              utc={true}
                              className="text-xs italic"
                            >
                              {opportunity.dateCompleted}
                            </Moment>
                          ) : (
                            "N/A"
                          )}
                        </td>
                        <td className="p-2x flex items-center">
                          {opportunity.verified ? (
                            <IoMdCheckmarkCircleOutline className="size-5 text-green" />
                          ) : (
                            <IoMdCloseCircleOutline className="size-5 text-red-500" />
                          )}
                        </td>
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>

            <div>
              <p className="text-sm leading-6">
                <strong>Total opportunities:</strong>{" "}
                {completedYouthOpportunities?.opporunityCount}
              </p>
            </div>

            {/* BUTTONS */}
            <div
              className={`mt-8 flex flex-row items-center justify-center gap-4`}
            >
              <button
                type="button"
                className="w-1/2z btn btn-warning btn-wide flex-shrink normal-case"
                onClick={() => {
                  setCompletedYouthOpportunitiesDialogVisible(false);
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </CustomModal>

      <div className="container z-10 mt-[4rem] max-w-7xl overflow-hidden p-4">
        <div className="flex flex-col gap-4">
          {/* HEADER */}
          <div className="flex flex-col gap-2">
            {/* WELCOME MSG */}
            <div className="overflow-hidden text-ellipsis whitespace-nowrap pt-1 text-xl font-semibold text-white md:text-2xl">
              {timeOfDayEmoji} Good {timeOfDay}&nbsp;
              {user?.name}!
            </div>

            {/* DESCRIPTION */}
            <div className="gap-2 overflow-hidden text-ellipsis whitespace-nowrap text-white">
              {!searchFilter.organizations && (
                <>
                  <span className="font-semibold">
                    Please select an organisation to view their dashboard.
                  </span>
                </>
              )}
              {searchFilter.organizations && (
                <>
                  <div className="flex flex-row gap-1 font-semibold">
                    <div>Here&apos;s the dashboard for</div>
                    <div className="flex flex-row font-semibold">
                      <div className="mr-1 max-w-36 truncate underline">
                        {lookups_selectedOrganisations?.items?.find(
                          (x) => x.id === searchFilter.organizations![0],
                        )?.name ?? searchFilter.organizations![0]}
                      </div>
                      <div>
                        {searchFilter.organizations.length > 1 &&
                          ` & ${
                            searchFilter.organizations.length - 1
                          } more organisation${
                            searchFilter.organizations.length > 2 ? "s" : ""
                          }`}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="h-6 text-sm italic">
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
          <div className="flex flex-col gap-4">
            {/* BUTTON */}
            <button
              type="button"
              className="bg-theme btn btn-sm w-full rounded-l-full border-none tracking-widest text-white brightness-[1.12] hover:brightness-95 md:w-40"
              onClick={() => setFilterFullWindowVisible(true)}
            >
              <IoMdOptions className="h-5 w-5" />
              Filter
            </button>

            {/* BADGES */}
            <FilterBadges
              searchFilter={searchFilter}
              excludeKeys={[
                "pageSelectedOpportunities",
                "pageCompletedYouth",
                "pageSSO",
                "pageSize",
                ...(isAdmin ? [] : ["organizations"]), // Exclude organizations for non-admins
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
                } else if (key === "organizations") {
                  // HACK: resolve organisation ids to titles
                  const lookup = lookups_selectedOrganisations?.items.find(
                    (x) => x.id === value,
                  );
                  return lookup?.name ?? value;
                } else {
                  return value;
                }
              }}
              onSubmit={(e) => {
                let updatedFilter = { ...e };

                // Check if organizations have changed
                const organizationsChanged =
                  JSON.stringify(searchFilter.organizations) !==
                  JSON.stringify(e.organizations);

                // If organizations changed, clear dependent filters
                if (organizationsChanged) {
                  updatedFilter = {
                    ...e,
                    organizations: isAdmin
                      ? e.organizations
                      : searchFilter.organizations,
                    countries: null,
                    opportunities: null,
                    categories: null,
                  };
                }

                onSubmitFilter(updatedFilter);
              }}
            />
          </div>

          {/* ORGADMINS NEEDS TO SELECT ONE ORG */}
          {!isAdmin && !searchFilter.organizations && (
            <FormMessage messageType={FormMessageType.Warning}>
              Filter by an organisation to see their dashboard.
            </FormMessage>
          )}

          {/* TABS & DASHBOARDS */}
          {(isAdmin || searchFilter.organizations) && (
            <>
              {/* TABS */}
              <div className="relative mt-4 flex items-center">
                <CustomSlider sliderClassName="tabs tabs-lifted !gap-0 border-gray text-white">
                  <a
                    role="tab"
                    className={`group tab relative !border-none ${
                      activeTab === "engagement"
                        ? "bg-gray-light font-semibold text-black"
                        : ""
                    }`}
                    onClick={() => setActiveTab("engagement")}
                  >
                    🤝 Engagement
                  </a>
                  {isAdmin && (
                    <a
                      role="tab"
                      className={`group tab relative !border-none ${
                        activeTab === "cumulativeCompletions"
                          ? "bg-gray-light font-semibold text-black"
                          : ""
                      }`}
                      onClick={() => setActiveTab("cumulativeCompletions")}
                    >
                      📈 Cumulative completions
                    </a>
                  )}
                  <a
                    role="tab"
                    className={`group tab relative !border-none font-semibold ${
                      activeTab === "rewards" ? "bg-gray-light text-black" : ""
                    }`}
                    onClick={() => setActiveTab("rewards")}
                  >
                    🏆 Rewards & Skills
                  </a>
                  <a
                    role="tab"
                    className={`group tab relative !border-none font-semibold ${
                      activeTab === "demographics"
                        ? "bg-gray-light text-black"
                        : ""
                    }`}
                    onClick={() => setActiveTab("demographics")}
                  >
                    📊 Demographics
                  </a>
                  <a
                    role="tab"
                    className={`group tab relative !border-none font-semibold ${
                      activeTab === "completedYouth"
                        ? "bg-gray-light text-black"
                        : ""
                    }`}
                    onClick={() => setActiveTab("completedYouth")}
                  >
                    ✅ Completed Youth
                  </a>
                  <a
                    role="tab"
                    className={`group tab relative !border-none font-semibold ${
                      activeTab === "selectedOpportunities"
                        ? "bg-gray-light text-black"
                        : ""
                    }`}
                    onClick={() => setActiveTab("selectedOpportunities")}
                  >
                    🚀 Selected Opportunities
                  </a>
                  <a
                    role="tab"
                    className={`group tab relative !border-none font-semibold ${
                      activeTab === "sso" ? "bg-gray-light text-black" : ""
                    }`}
                    onClick={() => setActiveTab("sso")}
                  >
                    🔑 SSO
                  </a>
                </CustomSlider>
              </div>

              {/* DASHBOARD */}
              <Suspense
                className="pt-4"
                isLoading={
                  engagementIsLoading ||
                  engagementIsLoading ||
                  completedOpportunitiesIsLoading ||
                  selectedOpportunitiesIsLoading ||
                  ssoIsLoading ||
                  !searchFilter
                }
                error={
                  engagementError ||
                  engagementError ||
                  completedOpportunitiesError ||
                  selectedOpportunitiesError ||
                  ssoError
                }
                loader={<LoadingSkeleton columns={2} rows={4} />}
              >
                {activeTab === "engagement" && (
                  <div className="flex animate-fade-in flex-col gap-4">
                    {/* ENGAGEMENT */}
                    <div className="flex flex-col">
                      <div className="flex flex-col gap-4 md:flex-row">
                        <div className="flex h-full flex-col gap-4 sm:flex-row md:flex-col">
                          {/* OPPORTUNITY COUNTS */}
                          <div className="h-30 flex w-full min-w-[310px] flex-col gap-2 rounded-lg bg-white p-4 shadow">
                            <div className="flex items-center gap-3">
                              <div className="items-center rounded-lg bg-gray-light p-1">
                                🚀
                              </div>
                              <div className="text-md font-semibold">
                                Opportunities
                              </div>
                            </div>
                            {/* OPPORTUNITIES */}
                            <div className="flex flex-row gap-4">
                              <div className="flex items-center gap-2">
                                <span className="text-3xl font-semibold">
                                  {selectedOpportunitiesData?.totalCount?.toLocaleString()}
                                </span>
                                <span>selected</span>
                              </div>
                            </div>
                          </div>

                          {/* GOTO/COMPLETED CONVERSION RATE */}
                          <div className="flex h-full min-h-[185px] w-full min-w-[310px] flex-col gap-4 rounded-lg bg-white p-4 shadow">
                            <div className="flex flex-row items-center gap-3">
                              <div className="rounded-lg bg-gray-light p-1">
                                🎯
                              </div>
                              <div className="text-md font-semibold">
                                Conversion Rate
                              </div>
                            </div>

                            <div className="card-xs card flex flex-grow flex-col bg-gray shadow-sm">
                              <div className="flex flex-col gap-2 px-4 py-2 text-sm tracking-tighter md:text-sm">
                                <div className="flex flex-row items-center">
                                  <div>
                                    <span className="mr-2">👀</span>Total views:
                                  </div>
                                  <div className="text-md ml-auto">
                                    {engagementData?.opportunities
                                      ?.conversionRate
                                      ?.viewedCountFromNavigatedExternalLinkTracking ??
                                      0}
                                  </div>
                                </div>

                                <div className="flex flex-row items-center gap-5">
                                  <div>
                                    <span className="mr-2">➡️</span>Conversion:{" "}
                                  </div>
                                  <div className="badge badge-primary ml-auto font-semibold">
                                    {engagementData?.opportunities
                                      ?.conversionRate
                                      ?.viewedToNavigatedExternalLinkPercentage ??
                                      0}{" "}
                                    %
                                  </div>
                                </div>

                                <div className="divider my-1 grow-0 !bg-green" />

                                <div className="flex flex-row items-center gap-5">
                                  <div>
                                    <span className="mr-2">👆</span>Links
                                    clicked:
                                  </div>
                                  <div className="ml-auto font-semibold">
                                    {engagementData?.opportunities
                                      ?.conversionRate
                                      ?.navigatedExternalLinkCount ?? 0}
                                  </div>
                                </div>

                                <div className="flex flex-row items-center gap-5">
                                  <div>
                                    <span className="mr-2">➡️</span>Conversion:
                                  </div>
                                  <div className="badge badge-primary ml-auto font-semibold">
                                    {engagementData?.opportunities
                                      ?.conversionRate
                                      ?.navigatedExternalLinkToCompletedPercentage ??
                                      0}{" "}
                                    %
                                  </div>
                                </div>

                                <div className="divider my-1 grow-0 !bg-green" />

                                <div className="flex flex-row items-center gap-5">
                                  <div>
                                    <span className="mr-2">✅</span>Total
                                    Completions:
                                  </div>
                                  <div className="ml-auto font-semibold">
                                    {engagementData?.opportunities
                                      ?.conversionRate
                                      ?.completedCountFromNavigatedExternalLinkTracking ??
                                      0}
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="flex flex-row gap-1 text-xs text-gray-dark">
                              <div className="">
                                Data before
                                <span className="mx-1 font-bold underline">
                                  14 June 2024
                                </span>
                                is not included in these metrics.
                              </div>
                            </div>

                            <div className="flex flex-row gap-1">
                              <IoMdInformationCircleOutline className="size-5 text-blue" />
                              <button
                                type="button"
                                className="text-sm text-blue"
                                onClick={() =>
                                  setGotoCompletedConversionRatioDialogVisible(
                                    true,
                                  )
                                }
                              >
                                Learn more
                              </button>
                            </div>
                          </div>

                          {/* OVERALL CONVERSION RATE */}
                          <div className="flex !h-full !min-h-[220px] w-full min-w-[310px] flex-grow flex-col gap-0 overflow-hidden rounded-lg bg-white p-4 shadow md:h-[11rem]">
                            <div className="flex flex-row items-center gap-3">
                              <div className="rounded-lg bg-gray-light p-1">
                                🎯
                              </div>
                              <div className="text-md font-semibold">
                                Overall Conversion Rate
                              </div>
                            </div>

                            {engagementData?.opportunities?.conversionRate && (
                              <PieChart
                                id="conversionRate"
                                colors={CHART_COLORS}
                                data={[
                                  ["Completed", "Viewed"],
                                  [
                                    "Completed",
                                    engagementData.opportunities.conversionRate
                                      .completedCountFromNavigatedExternalLinkTracking,
                                  ],
                                  [
                                    "Viewed",
                                    engagementData.opportunities.conversionRate
                                      .viewedCountFromNavigatedExternalLinkTracking,
                                  ],
                                ]}
                              />
                            )}

                            {!!engagementData?.opportunities?.conversionRate
                              ?.completedCountFromNavigatedExternalLinkTracking &&
                              !!engagementData?.opportunities?.conversionRate
                                ?.viewedCountFromNavigatedExternalLinkTracking && (
                                <div className="flex flex-grow flex-row items-end gap-1 text-xs text-gray-dark">
                                  <div>
                                    Data before
                                    <span className="mx-1 font-bold underline">
                                      14 June 2024
                                    </span>
                                    is not included in these metrics.
                                  </div>
                                </div>
                              )}
                          </div>
                        </div>

                        {/* LINE CHART: OVERVIEW */}
                        {engagementData?.opportunities?.engagements && (
                          <LineChartOverview
                            key="lineChartOverview"
                            data={engagementData.opportunities.engagements}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* CUMULATIVE COMPLETIONS (ADMIN ONLY) */}
                {isAdmin && activeTab === "cumulativeCompletions" && (
                  <div className="flex w-full flex-col justify-between overflow-hidden rounded-lg bg-white p-4 shadow">
                    <div className="flex flex-row items-center gap-3">
                      <div className="rounded-lg bg-gray-light p-1">📈</div>
                      <div className="text-md font-semibold">
                        Cumulative Completions
                      </div>
                    </div>

                    <div className="pt-4">
                      {engagementData?.cumulative?.completions && (
                        <LineChartCumulativeCompletions
                          key="lineChartCumulativeCompletions"
                          data={engagementData.cumulative.completions}
                        />
                      )}
                    </div>
                  </div>
                )}

                {activeTab === "rewards" && (
                  <div className="flex animate-fade-in flex-col gap-1">
                    <div className="flex flex-col gap-4 md:flex-row">
                      <div className="flex flex-col gap-4 md:w-[20.75rem]">
                        {/* TOTAL AMOUNT AWARDED */}
                        <div className="flex min-h-[185px] w-full min-w-[310px] flex-grow flex-col overflow-hidden rounded-lg bg-white p-4 shadow">
                          <div className="flex flex-row items-center gap-3">
                            <div className="rounded-lg bg-gray-light p-1">
                              🏆
                            </div>
                            <div className="text-md font-semibold">
                              Total Amount Awarded
                            </div>
                          </div>

                          <div className="-mt-16 flex flex-grow items-center gap-3">
                            <div className="flex-growx text-3xl font-semibold">
                              {engagementData?.opportunities.reward.totalAmount.toLocaleString() ??
                                0}
                            </div>
                            <Image
                              src={iconZltoGreen}
                              alt="Icon Zlto"
                              width={30}
                              height={30}
                              className="h-auto"
                              sizes="100vw"
                              priority={true}
                            />
                          </div>
                        </div>

                        {/* TOTAL UNIQUE SKILLS */}
                        <div className="flex h-full flex-col rounded-lg bg-white p-4 shadow">
                          <SkillsChart data={engagementData?.skills?.items} />
                        </div>
                      </div>

                      <div className="flex w-full flex-col overflow-hidden rounded-lg bg-white p-4 shadow">
                        <div className="flex flex-row items-center gap-3">
                          <div className="rounded-lg bg-gray-light p-1">🎖️</div>
                          <div className="text-md font-semibold">
                            Top Skills Awarded
                          </div>
                        </div>

                        <div className="pt-4">
                          {/* TOP SKILLS */}
                          {/* <SkillsBubbleChart
                            key="bubbleChartTopSkills"
                            data={engagementData?.skills?.topCompleted}
                          /> */}
                          <SkillsList
                            key="listTopSkills"
                            data={engagementData?.skills?.topCompleted}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "demographics" && (
                  <div className="flex w-full animate-fade-in flex-col gap-1">
                    <div className="flex flex-col gap-4 lg:flex-row">
                      {/* COUNTRIES */}
                      <div className="h-full w-full rounded-lg bg-white p-4 shadow">
                        <div className="flex flex-row items-center gap-3">
                          <div className="rounded-lg bg-gray-light p-1">🌍</div>
                          <div className="text-md font-semibold">Countries</div>
                        </div>
                        {engagementData?.demographics?.countries?.items && (
                          <WorldMapChart
                            data={[
                              ["Country", "Opportunities"],
                              ...Object.entries(
                                engagementData?.demographics?.countries
                                  ?.items || {},
                              ),
                            ]}
                          />
                        )}
                      </div>

                      <div className="flex flex-col gap-4 sm:flex-col">
                        {/* EDUCATION */}
                        <div className="h-full w-full min-w-[310px] rounded-lg bg-white p-4 shadow">
                          <div className="flex flex-row items-center gap-3">
                            <div className="rounded-lg bg-gray-light p-1">
                              🎓
                            </div>
                            <div className="text-md font-semibold">
                              Education
                            </div>
                          </div>
                          {engagementData?.demographics?.education?.items && (
                            <PieChart
                              id="education"
                              colors={CHART_COLORS}
                              data={[
                                ["Education", "Value"],
                                ...Object.entries(
                                  engagementData?.demographics?.education
                                    ?.items || {},
                                ),
                              ]}
                            />
                          )}
                        </div>

                        {/* GENDERS */}
                        <div className="h-full w-full min-w-[310px] rounded-lg bg-white p-4 shadow">
                          <div className="flex flex-row items-center gap-3">
                            <div className="rounded-lg bg-gray-light p-1">
                              🚻
                            </div>
                            <div className="text-md font-semibold">Genders</div>
                          </div>
                          {engagementData?.demographics?.genders?.items && (
                            <PieChart
                              id="genders"
                              colors={CHART_COLORS}
                              data={[
                                ["Gender", "Value"],
                                ...Object.entries(
                                  engagementData?.demographics?.genders
                                    ?.items || {},
                                ),
                              ]}
                            />
                          )}
                        </div>

                        {/* AGE */}
                        <div className="h-full w-full min-w-[310px] rounded-lg bg-white p-4 shadow">
                          <div className="flex flex-row items-center gap-3">
                            <div className="rounded-lg bg-gray-light p-1">
                              🎂
                            </div>
                            <div className="text-md font-semibold">Age</div>
                          </div>
                          {engagementData?.demographics?.ages?.items && (
                            <PieChart
                              id="ages"
                              colors={CHART_COLORS}
                              data={[
                                ["Age", "Value"],
                                ...Object.entries(
                                  engagementData?.demographics?.ages?.items ||
                                    {},
                                ),
                              ]}
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "completedYouth" && (
                  <div className="flex animate-fade-in flex-col gap-1">
                    {/* COMPLETED YOUTH */}
                    <div className="h-full w-full rounded-lg bg-white p-4 shadow">
                      <div className="flex flex-row items-center gap-3">
                        <div className="rounded-lg bg-gray-light p-1">✅</div>
                        <div className="text-md font-semibold">
                          Completed by Youth
                        </div>
                      </div>

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
                                    <th>Country</th>
                                    <th className="text-center">Age</th>
                                    <th className="text-center">
                                      Reward Total
                                    </th>
                                    <th className="text-center">
                                      Opportunity Count
                                    </th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {completedOpportunitiesData.items.map(
                                    (youthInfo) => (
                                      <tr
                                        key={`youth_${youthInfo.id}`}
                                        className="border-gray-light"
                                      >
                                        <td>
                                          <div className="-ml-4 flex items-center gap-2">
                                            <AvatarImage
                                              alt="Student Image"
                                              size={40}
                                            />
                                            {youthInfo.displayName}
                                          </div>
                                        </td>
                                        <td>{youthInfo.country || "N/A"}</td>
                                        <td className="text-center">
                                          {youthInfo.age !== null
                                            ? youthInfo.age
                                            : "N/A"}
                                        </td>
                                        <td className="text-center">
                                          <div className="badge bg-orange-light text-orange">
                                            <Image
                                              src={iconZlto}
                                              alt="Icon Zlto"
                                              width={16}
                                              className="h-auto"
                                              sizes="100vw"
                                              priority={true}
                                            />
                                            <span className="ml-1">
                                              {youthInfo.zltoRewardTotal}
                                            </span>
                                          </div>
                                        </td>
                                        <td className="text-center">
                                          <button
                                            type="button"
                                            className="badge bg-orange"
                                            onClick={() => {
                                              setCompletedYouthOpportunities(
                                                youthInfo,
                                              );
                                              setCompletedYouthOpportunitiesDialogVisible(
                                                true,
                                              );
                                            }}
                                          >
                                            {youthInfo.opporunityCount}
                                          </button>
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
                                    searchFilter.pageCompletedYouth
                                      ? searchFilter.pageCompletedYouth
                                      : 1
                                  }
                                  totalItems={
                                    completedOpportunitiesData.totalCount
                                  }
                                  pageSize={PAGE_SIZE}
                                  showPages={false}
                                  showInfo={true}
                                  onClick={handlePagerChangeCompletedYouth}
                                />
                              </div>
                            </div>

                            {/* MOBILE */}
                            <div className="flex flex-col gap-2 md:hidden">
                              <CustomCarousel
                                id={`CompletedYouth_CustomCarousel`}
                                data={completedOpportunitiesData.items}
                                loadData={loadData_Youth}
                                totalAll={completedOpportunitiesData.totalCount}
                                renderSlide={(item, index) => (
                                  <YouthCompletedCard
                                    key={`CompletedYouth_CustomCarousel_YouthCompletedCard_${item.id}_${index}`}
                                    opportunity={item}
                                    showOpportunityModal={() => {
                                      setCompletedYouthOpportunities(item);
                                      setCompletedYouthOpportunitiesDialogVisible(
                                        true,
                                      );
                                    }}
                                  />
                                )}
                              />
                            </div>
                          </>
                        )}
                    </div>
                  </div>
                )}

                {activeTab === "selectedOpportunities" && (
                  <div className="flex animate-fade-in flex-col">
                    {/* SELECTED OPPORTUNITIES */}
                    <div className="h-full w-full rounded-lg bg-white p-4 shadow">
                      <div className="flex flex-row items-center gap-3">
                        <div className="rounded-lg bg-gray-light p-1">🚀</div>
                        <div className="text-md font-semibold">
                          Selected Opportunities
                        </div>
                      </div>

                      {/* NO ROWS */}
                      {(!selectedOpportunitiesData ||
                        selectedOpportunitiesData.items?.length === 0) && (
                        <div className="flex flex-col place-items-center py-4">
                          <NoRowsMessage
                            title={"No opportunities found"}
                            description={
                              "Please try refining your search query."
                            }
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
                                    <th className="text-center">
                                      Go-To Clicks
                                    </th>
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
                                            href={`/organisations/${
                                              opportunity.organizationId
                                            }/opportunities/${
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
                                          {
                                            opportunity.conversionRatioPercentage
                                          }
                                          %
                                        </td>
                                        <td className="text-center">
                                          <span className="badge bg-green-light text-green">
                                            <IoMdPerson className="mr-1" />
                                            {opportunity.completedCount}
                                          </span>
                                        </td>
                                        <td className="text-center">
                                          {
                                            opportunity.navigatedExternalLinkCount
                                          }
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
                                    searchFilter.pageSelectedOpportunities
                                      ? searchFilter.pageSelectedOpportunities
                                      : 1
                                  }
                                  totalItems={
                                    selectedOpportunitiesData.totalCount
                                  }
                                  pageSize={PAGE_SIZE}
                                  showPages={false}
                                  showInfo={true}
                                  onClick={
                                    handlePagerChangeSelectedOpportunities
                                  }
                                />
                              </div>
                            </div>

                            {/* MOBILE */}
                            <div className="flex flex-col gap-2 md:hidden">
                              <CustomCarousel
                                id={`CompletedOpportunities_CustomCarousel`}
                                data={selectedOpportunitiesData.items}
                                loadData={loadData_Opportunities}
                                totalAll={selectedOpportunitiesData.totalCount}
                                renderSlide={(item, index) => (
                                  <OpportunityCard
                                    key={`CompletedOpportunities_CustomCarousel_OpportunityCard_${item.id}_${index}`}
                                    opportunity={item}
                                    orgId={item.organizationId}
                                  />
                                )}
                              />
                            </div>
                          </div>
                        )}
                    </div>
                  </div>
                )}

                {activeTab === "sso" && ssoData && (
                  <div className="gap-x4 flex animate-fade-in flex-col">
                    {/* SSO SUMMARY */}
                    {ssoData?.outboundLoginCount !== null &&
                      ssoData?.inboundLoginCount !== null && (
                        <div className="mb-4 flex flex-col rounded-lg bg-white p-4 shadow">
                          <div className="mb-4 flex items-center gap-2">
                            <div className="rounded-lg bg-gray-light p-1">
                              <span>🔑</span>
                            </div>
                            <span className="font-semibold">
                              Total SSO Activity
                            </span>
                          </div>

                          <div className="flex flex-wrap gap-4">
                            <div className="flex items-center gap-2">
                              <div className="badge bg-gray p-3 !text-sm font-extrabold">
                                {ssoData.outboundLoginCount.toLocaleString()}
                              </div>
                              <span className="font-semibold">
                                Outbound logins
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              <div className="badge bg-gray p-3 !text-sm font-extrabold">
                                {ssoData.inboundLoginCount.toLocaleString()}
                              </div>
                              <span className="font-semibold">
                                Inbound logins
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              <div className="badge bg-gray p-3 !text-sm font-extrabold">
                                {(
                                  ssoData.outboundLoginCount +
                                  ssoData.inboundLoginCount
                                ).toLocaleString()}
                              </div>
                              <span className="font-semibold">
                                Total logins
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                    {/* INDIVIDUAL ORGANIZATION CHARTS */}
                    {ssoData?.items && ssoData.items.length > 0 && (
                      <div className="flex animate-fade-in flex-col gap-4">
                        {ssoData.items.map((item) => (
                          <SsoChartCombined key={item.id} data={item} />
                        ))}

                        {/* PAGINATION */}
                        <div className="mt-2">
                          <PaginationButtons
                            currentPage={
                              searchFilter.pageSSO ? searchFilter.pageSSO : 1
                            }
                            totalItems={ssoData.totalCount}
                            pageSize={PAGE_SIZE}
                            showPages={false}
                            showInfo={true}
                            onClick={handlePagerChangeSSO}
                          />
                        </div>
                      </div>
                    )}

                    {(!ssoData || ssoData.items?.length === 0) && (
                      <div className="flex h-full items-center justify-center rounded-lg bg-gray-light">
                        <NoRowsMessage
                          title={"No configuration found"}
                          description={
                            "No SSO data available for the selected organization(s)."
                          }
                        />
                      </div>
                    )}

                    {ssoData && ssoData.items?.length >= PAGE_SIZE && (
                      <FormMessage messageType={FormMessageType.Info}>
                        Only the top {PAGE_SIZE} rows are shown. Please filter
                        by organizations to see their SSO dashboard.
                      </FormMessage>
                    )}
                  </div>
                )}
              </Suspense>
            </>
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
OrganisationDashboard.theme = function getTheme(
  page: ReactElement<{ theme: string }>,
) {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return page.props.theme;
};

export default OrganisationDashboard;
