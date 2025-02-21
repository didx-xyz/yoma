import { useQuery, useQueryClient } from "@tanstack/react-query";
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
import { FcAdvance } from "react-icons/fc";
import {
  IoIosArrowBack,
  IoIosArrowForward,
  IoMdCheckmarkCircleOutline,
  IoMdClose,
  IoMdCloseCircleOutline,
  IoMdInformationCircleOutline,
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
import {
  getCategoriesAdmin,
  searchCriteriaOpportunities,
} from "~/api/services/opportunities";
import { getOrganisations } from "~/api/services/organisations";
import {
  getCountries,
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
import { Header } from "~/components/Common/Header";
import Suspense from "~/components/Common/Suspense";
import MainLayout from "~/components/Layout/Main";
import NoRowsMessage from "~/components/NoRowsMessage";
import OpportunityStatus from "~/components/Opportunity/OpportunityStatus";
import { EngagementRowFilter } from "~/components/Organisation/Dashboard/EngagementRowFilter";
import { LineChart } from "~/components/Organisation/Dashboard/LineChart";
import { LineChartCumulativeCompletions } from "~/components/Organisation/Dashboard/LineChartCumulativeCompletions";
import { OpportunityCard } from "~/components/Organisation/Dashboard/OpportunityCard";
import { OrganisationRowFilter } from "~/components/Organisation/Dashboard/OrganisationRowFilter";
import { PieChart } from "~/components/Organisation/Dashboard/PieChart";
import { SkillsChart } from "~/components/Organisation/Dashboard/SkillsChart";
import { SsoChart } from "~/components/Organisation/Dashboard/SsoChart";
import { WorldMapChart } from "~/components/Organisation/Dashboard/WorldMapChart";
import { YouthCompletedCard } from "~/components/Organisation/Dashboard/YouthCompletedCard";
import { PageBackground } from "~/components/PageBackground";
import { PaginationButtons } from "~/components/PaginationButtons";
import { InternalServerError } from "~/components/Status/InternalServerError";
import LimitedFunctionalityBadge from "~/components/Status/LimitedFunctionalityBadge";
import { LoadingInline } from "~/components/Status/LoadingInline";
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
import { getTimeOfDayAndEmoji } from "~/lib/utils";
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
  countries: string[] | null;
}

// ⚠️ SSR
export async function getServerSideProps(context: GetServerSidePropsContext) {
  // get filter parameters from route
  const {
    pageSelectedOpportunities,
    pageCompletedYouth,
    categories,
    opportunities,
    startDate,
    endDate,
    countries,
    organisations,
  } = context.query;

  const searchFilter = {
    pageSelectedOpportunities: pageSelectedOpportunities
      ? parseInt(pageSelectedOpportunities.toString())
      : 1,
    pageCompletedYouth: pageCompletedYouth
      ? parseInt(pageCompletedYouth.toString())
      : 1,
    organizations: organisations ? organisations?.toString().split("|") : null,
    categories: categories ? categories?.toString().split("|") : null,
    opportunities: opportunities ? opportunities?.toString().split("|") : null,
    startDate: startDate ? startDate.toString() : "",
    endDate: endDate ? endDate.toString() : "",
    countries: countries ? countries?.toString().split("|") : null,
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
    // HACK: lookup each of the opportunities (to resolve ids to titles for filter badges)
    if (!!searchFilter.opportunities && !!searchFilter.organizations) {
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
  const [inactiveOpportunitiesCount, setInactiveOpportunitiesCount] =
    useState(0);
  const [expiredOpportunitiesCount, setExpiredOpportunitiesCount] = useState(0);
  const queryClient = useQueryClient();
  const [
    completedYouthOpportunitiesDialogVisible,
    setCompletedYouthOpportunitiesDialogVisible,
  ] = useState(false);
  const [completedYouthOpportunities, setCompletedYouthOpportunities] =
    useState<YouthInfo | null>();
  const isAdmin = user?.roles.includes(ROLE_ADMIN);

  //#region Tab state
  const [activeTab, setActiveTab] = useState("engagement");

  useEffect(() => {
    if (router.query.tab) {
      setActiveTab(router.query.tab.toString());
    }
  }, [router.query.tab]);
  //#endregion Tab state

  const {
    data: categoriesData,
    isLoading: categoriesIsLoading,
    error: categoriesError,
  } = useQuery<OpportunityCategory[]>({
    queryKey: ["organisationCategories", searchFilter],
    queryFn: () => getCategoriesAdmin(searchFilter.organizations ?? []),
    enabled: !error,
  });
  const {
    data: countriesData,
    isLoading: countriesIsLoading,
    error: countriesError,
  } = useQuery<Country[]>({
    queryKey: ["organisationCountries", searchFilter],
    queryFn: () => getCountries(searchFilter.organizations ?? []),
    enabled: !error,
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
        categories:
          searchFilter.categories != undefined
            ? searchFilter.categories
                ?.map((x) => {
                  const item = categoriesData?.find((y) => y.name === x);
                  return item ? item?.id : "";
                })
                .filter((x) => x != "")
            : null,
        opportunities: searchFilter.opportunities ?? null,
        startDate: searchFilter.startDate
          ? searchFilter.startDate.toString()
          : "",
        endDate: searchFilter.endDate ? searchFilter.endDate.toString() : "",
        countries:
          searchFilter.countries != undefined
            ? searchFilter.countries
                ?.map((x) => {
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
      searchFilter,
      searchFilter.pageCompletedYouth,
    ],
    queryFn: () =>
      searchOrganizationYouth({
        organizations: searchFilter.organizations ?? [],
        categories:
          searchFilter.categories != undefined
            ? searchFilter.categories
                ?.map((x) => {
                  const item = categoriesData?.find((y) => y.name === x);
                  return item ? item?.id : "";
                })
                .filter((x) => x != "")
            : null,
        opportunities: searchFilter.opportunities ?? null,
        startDate: searchFilter.startDate
          ? searchFilter.startDate.toString()
          : "",
        endDate: searchFilter.endDate ? searchFilter.endDate.toString() : "",
        pageNumber: searchFilter.pageCompletedYouth
          ? searchFilter.pageCompletedYouth
          : 1,
        pageSize: PAGE_SIZE,
        countries:
          searchFilter.countries != undefined
            ? searchFilter.countries
                ?.map((x) => {
                  const item = countriesData?.find((y) => y.name === x);
                  return item ? item?.id : "";
                })
                .filter((x) => x != "")
            : null,
      }),
    enabled: !error,
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
        categories:
          searchFilter.categories != undefined
            ? searchFilter.categories
                ?.map((x) => {
                  const item = categoriesData?.find((y) => y.name === x);
                  return item ? item?.id : "";
                })
                .filter((x) => x != "")
            : null,
        opportunities: searchFilter.opportunities ?? null,
        startDate: searchFilter.startDate
          ? searchFilter.startDate.toString()
          : "",
        endDate: searchFilter.endDate ? searchFilter.endDate.toString() : "",
        pageNumber: searchFilter.pageSelectedOpportunities
          ? searchFilter.pageSelectedOpportunities
          : 1,
        pageSize: PAGE_SIZE,
      }),
    enabled: !error && !!searchFilter.opportunities,
  });

  // QUERY: SSO
  const {
    data: ssoData,
    isLoading: ssoIsLoading,
    error: ssoError,
  } = useQuery<OrganizationSearchResultsSSO>({
    queryKey: ["organisationSSO", searchFilter],
    queryFn: () =>
      searchOrganizationSso({
        organizations: searchFilter.organizations ?? [],
        startDate: searchFilter.startDate
          ? searchFilter.startDate.toString()
          : "",
        endDate: searchFilter.endDate ? searchFilter.endDate.toString() : "",
        pageNumber: 1,
        pageSize: PAGE_SIZE,
      }),
    enabled: !error,
  });

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
          categories:
            searchFilter.categories != undefined
              ? searchFilter.categories
                  ?.toString()
                  .split("|")
                  .map((x) => {
                    const item = categoriesData?.find((y) => y.name === x);
                    return item ? item?.id : "";
                  })
                  .filter((x) => x != "")
              : null,
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
          categories:
            searchFilter.categories != undefined
              ? searchFilter.categories
                  ?.toString()
                  .split("|")
                  .map((x) => {
                    const item = categoriesData?.find((y) => y.name === x);
                    return item ? item?.id : "";
                  })
                  .filter((x) => x != "")
              : null,
          opportunities: searchFilter.opportunities
            ? searchFilter.opportunities?.toString().split("|")
            : null,
          startDate: searchFilter.startDate
            ? searchFilter.startDate.toString()
            : "",
          endDate: searchFilter.endDate ? searchFilter.endDate.toString() : "",
          countries:
            searchFilter.countries != undefined
              ? searchFilter.countries
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
      searchFilter.categories,
      searchFilter.opportunities,
      searchFilter.startDate,
      searchFilter.endDate,
      searchFilter.countries,
      searchFilter.organizations,
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

  // 🔔 EVENTS
  const onSubmitFilter = useCallback(
    (val: OrganizationSearchFilterSummaryViewModel) => {
      console.table(val);
      redirectWithSearchFilterParams({
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
        organizations: val.organizations,
        countries: val.countries,
      });
    },
    [
      redirectWithSearchFilterParams,
      searchFilter.pageSelectedOpportunities,
      searchFilter.pageCompletedYouth,
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

      <PageBackground className="h-[440px] md:h-[446px] lg:h-[446px]" />

      {/* REFERENCE FOR FILTER POPUP: fix menu z-index issue */}
      <div ref={myRef} />

      {/* completed Youth Opportunities DIALOG */}
      <CustomModal
        isOpen={completedYouthOpportunitiesDialogVisible}
        shouldCloseOnOverlayClick={false}
        onRequestClose={() => {
          setCompletedYouthOpportunitiesDialogVisible(false);
        }}
        className="md:max-h-[500px] md:w-[550px]"
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
                            href={`/organisations/${opportunity.organizationId}/opportunities/${
                              opportunity.id
                            }/info?returnUrl=${encodeURIComponent(router.asPath)}`}
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

      <div className="container z-10 mt-[6rem] max-w-7xl overflow-hidden p-4">
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
                  Here&apos;s the dashboard for{" "}
                  <span className="font-semibold underline">
                    {lookups_selectedOrganisations?.items?.find(
                      (x) => x.id === searchFilter.organizations![0],
                    )?.name ?? searchFilter.organizations![0]}
                    {searchFilter.organizations.length > 1 &&
                      ` & ${searchFilter.organizations.length - 1} more organisation${searchFilter.organizations.length > 2 ? "s" : ""}`}
                  </span>
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
          <Suspense
            isLoading={categoriesIsLoading}
            error={categoriesError}
            loader={
              <LoadingInline
                className="h-[170px]"
                classNameSpinner="border-white h-8 w-8"
                classNameLabel="text-white"
              />
            }
          >
            <div className="z-50 flex flex-col gap-2">
              <Header
                title="Filter by:"
                className="text-sm font-semibold text-white"
              />
              <OrganisationRowFilter
                htmlRef={myRef.current!}
                searchFilter={searchFilter}
                lookups_categories={categoriesData}
                lookups_selectedOpportunities={lookups_selectedOpportunities}
                lookups_selectedOrganisations={lookups_selectedOrganisations}
                user={user}
                onSubmit={(e) => onSubmitFilter(e)}
              />
            </div>
          </Suspense>

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
              <div className="relative flex items-center">
                <CustomSlider className="tabs tabs-lifted !gap-0 border-gray text-white">
                  <a
                    role="tab"
                    className={`group tab relative !border-none ${
                      activeTab === "engagement" ? "tab-active text-black" : ""
                    }`}
                    onClick={() => setActiveTab("engagement")}
                  >
                    🤝 Engagement
                  </a>
                  <a
                    role="tab"
                    className={`group tab relative !border-none ${
                      activeTab === "rewards" ? "tab-active text-black" : ""
                    }`}
                    onClick={() => setActiveTab("rewards")}
                  >
                    ⚡ Rewards & Skills
                  </a>
                  <a
                    role="tab"
                    className={`group tab relative !border-none ${
                      activeTab === "demographics"
                        ? "tab-active text-black"
                        : ""
                    }`}
                    onClick={() => setActiveTab("demographics")}
                  >
                    📊 Demographics
                  </a>
                  <a
                    role="tab"
                    className={`group tab relative !border-none ${
                      activeTab === "completedYouth"
                        ? "tab-active text-black"
                        : ""
                    }`}
                    onClick={() => setActiveTab("completedYouth")}
                  >
                    ✅ Completed Youth
                  </a>
                  <a
                    role="tab"
                    className={`group tab relative !border-none ${
                      activeTab === "selectedOpportunities"
                        ? "tab-active text-black"
                        : ""
                    }`}
                    onClick={() => setActiveTab("selectedOpportunities")}
                  >
                    🏆 Selected Opportunities
                  </a>
                  <a
                    role="tab"
                    className={`group tab relative !border-none ${activeTab === "sso" ? "tab-active text-black" : ""}`}
                    onClick={() => setActiveTab("sso")}
                  >
                    🔑 SSO
                  </a>
                </CustomSlider>
              </div>

              {/* DASHBOARD */}
              <Suspense
                isLoading={
                  engagementIsLoading ||
                  countriesIsLoading ||
                  engagementIsLoading ||
                  completedOpportunitiesIsLoading ||
                  selectedOpportunitiesIsLoading ||
                  ssoIsLoading ||
                  !searchFilter
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
                {activeTab === "engagement" && (
                  <div className="flex animate-fade-in flex-col gap-4 pt-4">
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

                      <div className="mt-2 flex flex-col gap-4 xl:flex-row">
                        {/* VIEWED COMPLETED */}
                        {engagementData?.opportunities?.engagements && (
                          <LineChart
                            data={engagementData.opportunities.engagements}
                            opportunityCount={
                              engagementData?.opportunities?.engaged?.count ?? 0
                            }
                          />
                        )}

                        <div className="flex h-full flex-col gap-4 sm:flex-row lg:flex-col">
                          {/* GOTO/COMPLETED CONVERSION RATE */}
                          <div className="flex h-full min-h-[185px] w-full min-w-[310px] flex-col gap-4 rounded-lg bg-white p-4 shadow">
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
                                Go-To/Completed Conversion Ratio
                              </div>
                            </div>

                            <div className="flex flex-grow flex-col">
                              <div className="flex flex-grow flex-nowrap items-center gap-2 text-lg font-semibold tracking-tighter md:text-2xl">
                                <div>
                                  {`${engagementData?.opportunities?.conversionRate?.viewedToNavigatedExternalLinkPercentage ?? 0} %`}
                                </div>
                                <div>
                                  <FcAdvance className="size-10 text-green" />
                                </div>
                                <div>
                                  {`${engagementData?.opportunities?.conversionRate?.navigatedExternalLinkToCompletedPercentage ?? 0} %`}
                                </div>
                              </div>
                            </div>

                            <div className="flex flex-row gap-1 text-xs text-gray-dark">
                              <IoMdInformationCircleOutline className="size-4 text-blue" />
                              Tracking started on{" "}
                              <div className="font-bold italic underline">
                                14 June 2024
                              </div>
                            </div>

                            <div>
                              <button
                                type="button"
                                className="tooltip tooltip-top tooltip-secondary text-xs text-blue"
                                data-tip="This displays the percentage of users who viewed the
                            content and clicked on an external link, and the
                            percentage of users who clicked the external link
                            and completed the process."
                              >
                                Learn more
                              </button>
                            </div>
                          </div>

                          {/* OVERALL CONVERSION RATE */}
                          {engagementData?.opportunities?.conversionRate && (
                            <PieChart
                              id="conversionRate"
                              title="Overall Conversion Ratio"
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
                              className="!h-full !min-h-[185px] !w-full min-w-[310px]"
                            />
                          )}
                        </div>
                      </div>

                      <div className="">
                        {/* CUMULATIVE COMPLETIONS */}
                        {engagementData?.cumulative?.completions && (
                          <LineChartCumulativeCompletions
                            data={engagementData.cumulative.completions}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "rewards" && (
                  <div className="flex animate-fade-in flex-col gap-1 pt-4">
                    <Header title="⚡ Rewards & Skills" />

                    <div className="flex flex-col gap-4 md:flex-row">
                      {/* REWARDS */}
                      <div className="flex flex-col gap-1">
                        <div className="h-[176px] rounded-lg bg-white p-4 shadow md:w-[275px]">
                          <div className="flex flex-row items-center gap-3">
                            <div className="rounded-lg bg-green-light p-1">
                              <Image
                                src={iconZltoGreen}
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
                              src={iconZltoGreen}
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
                        <div className="h-[176px] rounded-lg bg-white shadow md:w-[275px]">
                          <SkillsChart data={engagementData?.skills?.items} />
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
                )}

                {activeTab === "demographics" && (
                  <div className="flex w-full animate-fade-in flex-col gap-1 pt-4">
                    <Header title="📊 Demographics" />

                    <div className="flex flex-col gap-4 md:flex-row">
                      {/* COUNTRIES */}
                      <div className="h-full w-full rounded-lg bg-white p-4 shadow">
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
                      <div className="flex flex-col gap-4 md:flex-wrap">
                        {/* EDUCATION */}
                        <PieChart
                          id="education"
                          title="Education"
                          subTitle=""
                          colors={CHART_COLORS}
                          data={[
                            ["Education", "Value"],
                            ...Object.entries(
                              engagementData?.demographics?.education?.items ||
                                {},
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
                              engagementData?.demographics?.genders?.items ||
                                {},
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
                )}

                {activeTab === "completedYouth" && (
                  <div className="flex animate-fade-in flex-col gap-1 pt-4">
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
                  <div className="flex animate-fade-in flex-col pt-4">
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
                                            href={`/organisations/${opportunity.organizationId}/opportunities/${
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

                {activeTab === "sso" && (
                  <div className="flex animate-fade-in flex-col gap-4 pt-4">
                    <Header title="🔑 Single Sign-On" />

                    {ssoData?.items && (
                      <div className="flex flex-col gap-8">
                        {ssoData?.items?.map((ssoItem) => (
                          <div
                            key={ssoItem.name}
                            className="flex flex-col gap-2"
                          >
                            <h3 className="text-sm font-semibold">
                              {ssoItem.name}
                            </h3>
                            <div className="grid-rows-2x grid gap-4 md:grid-cols-2">
                              <div className="flex flex-col gap-2 rounded-lg bg-white p-6 shadow">
                                <div className="flex items-center gap-2 text-lg font-semibold">
                                  <div>Outbound</div>
                                  <IoIosArrowForward className="rounded-lg bg-green-light p-px pl-[2px] text-2xl text-green" />
                                </div>
                                {ssoItem.outbound?.enabled ? (
                                  <>
                                    <div className="-mb-4 font-semibold">
                                      {ssoItem.outbound?.clientId}
                                    </div>
                                    <SsoChart data={ssoItem.outbound?.logins} />
                                  </>
                                ) : (
                                  <div>Disabled</div>
                                )}
                              </div>
                              <div className="flex flex-col gap-2 rounded-lg bg-white p-6 shadow">
                                <div className="flex items-center gap-2 text-lg font-semibold">
                                  <div>Inbound</div>
                                  <IoIosArrowBack className="rounded-lg bg-green-light p-px pr-[2px] text-2xl text-green" />
                                </div>
                                {ssoItem.inbound?.enabled ? (
                                  <>
                                    <div className="-mb-4 font-semibold">
                                      {ssoItem.inbound?.clientId}
                                    </div>
                                    <SsoChart data={ssoItem.inbound?.logins} />
                                  </>
                                ) : (
                                  <div>Disabled</div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {(!ssoData || ssoData.items?.length === 0) && (
                      <div>
                        No SSO data available for the selected organization(s).
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
