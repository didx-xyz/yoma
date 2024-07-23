import {
  QueryClient,
  dehydrate,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import axios from "axios";
import { useAtom } from "jotai";
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
import {
  IoIosArrowBack,
  IoIosArrowForward,
  IoIosInformationCircleOutline,
  IoMdPerson,
} from "react-icons/io";
import type { Country } from "~/api/models/lookups";
import { Action, VerificationStatus } from "~/api/models/myOpportunity";
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
import { UserProfile, UserSkillInfo } from "~/api/models/user";
import { searchMyOpportunities } from "~/api/services/myOpportunities";
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
import FormTooltip from "~/components/Common/FormTooltip";
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
import { Loading } from "~/components/Status/Loading";
import { LoadingSkeleton } from "~/components/Status/LoadingSkeleton";
import { Unauthenticated } from "~/components/Status/Unauthenticated";
import { Unauthorized } from "~/components/Status/Unauthorized";
import { HeaderWithLink } from "~/components/YoID/HeaderWithLink";
import { WalletCard } from "~/components/YoID/WalletCard";
import { ZltoModal } from "~/components/YoID/ZltoModal";
import {
  CHART_COLORS,
  DATETIME_FORMAT_HUMAN,
  PAGE_SIZE,
  PAGE_SIZE_MINIMUM,
  ROLE_ADMIN,
} from "~/lib/constants";
import { config } from "~/lib/react-query-config";
import { userProfileAtom } from "~/lib/store";
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
  //const { id } = context.params as IParams;
  // const { opportunities } = context.query;

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
  // // 👇 set theme based on role
  // const theme = getThemeFromRole(session, id);

  // const queryClient = new QueryClient(config);
  // let lookups_selectedOpportunities;

  // try {
  //   const dataOrganisation = await getOrganisationById(id, context);
  //   const dataCategories = await getCategoriesAdmin(id, context);
  //   const dataCountries = await getCountries(id, context);

  //   // 👇 prefetch queries on server
  //   await Promise.all([
  //     await queryClient.prefetchQuery({
  //       queryKey: ["organisation", id],
  //       queryFn: () => dataOrganisation,
  //     }),
  //     await queryClient.prefetchQuery({
  //       queryKey: ["organisationCategories", id],
  //       queryFn: () => dataCategories,
  //     }),
  //     await queryClient.prefetchQuery({
  //       queryKey: ["organisationCountries", id],
  //       queryFn: () => dataCountries,
  //     }),
  //   ]);

  //   // HACK: lookup each of the opportunities (to resolve ids to titles for filter badges)
  //   if (opportunities) {
  //     lookups_selectedOpportunities = await searchCriteriaOpportunities(
  //       {
  //         opportunities: opportunities.toString().split("|") ?? [],
  //         organization: id,
  //         titleContains: null,
  //         published: null,
  //         verificationMethod: null,
  //         pageNumber: 1,
  //         pageSize: opportunities.length,
  //       },
  //       context,
  //     );
  //   }
  // } catch (error) {
  //   console.error(error);
  //   if (axios.isAxiosError(error) && error.response?.status) {
  //     if (error.response.status === 404) {
  //       return {
  //         notFound: true,
  //         props: { theme: theme },
  //       };
  //     } else errorCode = error.response.status;
  //   } else errorCode = 500;
  // }

  return {
    props: {
      //dehydratedState: dehydrate(queryClient),
      user: session?.user ?? null,
      //theme: theme,
      // id,
      error: errorCode,
      //lookups_selectedOpportunities: lookups_selectedOpportunities ?? null,
    },
  };
}

// YoID dashboard page
const YoIDDashboard: NextPageWithLayout<{
  error?: number;
  user?: any;
  //lookups_selectedOpportunities?: OpportunitySearchResultsInfo;
}> = ({ error, user }) => {
  const queryClient = useQueryClient();
  const [zltoModalVisible, setZltoModalVisible] = useState(false);
  const [timeOfDay, timeOfDayEmoji] = getTimeOfDayAndEmoji();
  const [userProfile] = useAtom(userProfileAtom);

  // const router = useRouter();
  // const myRef = useRef<HTMLDivElement>(null);
  // const [inactiveOpportunitiesCount, setInactiveOpportunitiesCount] =
  //   useState(0);
  // const [expiredOpportunitiesCount, setExpiredOpportunitiesCount] = useState(0);
  // const queryClient = useQueryClient();
  // const isAdmin = user?.roles?.includes(ROLE_ADMIN);

  // 👇 use prefetched queries from server
  // const { data: organisation } = useQuery<Organization>({
  //   queryKey: ["organisation", id],
  //   enabled: !error,
  // });
  // const { data: lookups_categories } = useQuery<OpportunityCategory[]>({
  //   queryKey: ["organisationCategories", id],
  //   queryFn: () => getCategoriesAdmin(id),
  //   enabled: !error,
  // });
  // const { data: lookups_countries } = useQuery<Country[]>({
  //   queryKey: ["organisationCountries", id],
  //   queryFn: () => getCountries(id),
  //   enabled: !error,
  // });

  // // get filter parameters from route
  // const {
  //   pageSelectedOpportunities,
  //   pageCompletedYouth,
  //   categories,
  //   opportunities,
  //   startDate,
  //   endDate,
  //   countries,
  // } = router.query;

  // // QUERY: SEARCH RESULTS
  // const { data: dataEngagement, isLoading: isLoadingEngagement } =
  //   useQuery<OrganizationSearchResultsSummary>({
  //     queryKey: [
  //       "organisationEngagement",
  //       id,
  //       categories,
  //       opportunities,
  //       startDate,
  //       endDate,
  //       countries,
  //     ],
  //     queryFn: async () => {
  //       return await searchOrganizationEngagement({
  //         organization: id,
  //         categories:
  //           categories != undefined
  //             ? categories
  //                 ?.toString()
  //                 .split("|")
  //                 .map((x) => {
  //                   const item = lookups_categories?.find((y) => y.name === x);
  //                   return item ? item?.id : "";
  //                 })
  //                 .filter((x) => x != "")
  //             : null,
  //         opportunities: opportunities
  //           ? opportunities?.toString().split("|")
  //           : null,
  //         startDate: startDate ? startDate.toString() : "",
  //         endDate: endDate ? endDate.toString() : "",
  //         countries:
  //           countries != undefined
  //             ? countries
  //                 ?.toString()
  //                 .split("|")
  //                 .map((x) => {
  //                   const item = lookups_countries?.find((y) => y.name === x);
  //                   return item ? item?.id : "";
  //                 })
  //                 .filter((x) => x != "")
  //             : null,
  //       });
  //     },
  //     enabled: !error,
  //   });

  // // QUERY: COMPLETED YOUTH
  // const { data: dataCompletedYouth, isLoading: isLoadingCompletedYouth } =
  //   useQuery<OrganizationSearchResultsYouth>({
  //     queryKey: [
  //       "organisationCompletedYouth",
  //       id,
  //       pageCompletedYouth,
  //       categories,
  //       opportunities,
  //       startDate,
  //       endDate,
  //       countries,
  //     ],
  //     queryFn: () =>
  //       searchOrganizationYouth({
  //         organization: id,
  //         categories:
  //           categories != undefined
  //             ? categories
  //                 ?.toString()
  //                 .split("|")
  //                 .map((x) => {
  //                   const item = lookups_categories?.find((y) => y.name === x);
  //                   return item ? item?.id : "";
  //                 })
  //                 .filter((x) => x != "")
  //             : null,
  //         opportunities: opportunities
  //           ? opportunities?.toString().split("|")
  //           : null,
  //         startDate: startDate ? startDate.toString() : "",
  //         endDate: endDate ? endDate.toString() : "",
  //         pageNumber: pageCompletedYouth
  //           ? parseInt(pageCompletedYouth.toString())
  //           : 1,
  //         pageSize: PAGE_SIZE,
  //         countries:
  //           countries != undefined
  //             ? countries
  //                 ?.toString()
  //                 .split("|")
  //                 .map((x) => {
  //                   const item = lookups_countries?.find((y) => y.name === x);
  //                   return item ? item?.id : "";
  //                 })
  //                 .filter((x) => x != "")
  //             : null,
  //       }),
  //   });

  // // QUERY: SELECTED OPPORTUNITIES
  // const {
  //   data: dataSelectedOpportunities,
  //   isLoading: isLoadingSelectedOpportunities,
  // } = useQuery<OrganizationSearchResultsOpportunity>({
  //   queryKey: [
  //     "organisationSelectedOpportunities",
  //     id,
  //     pageSelectedOpportunities,
  //     categories,
  //     opportunities,
  //     startDate,
  //     endDate,
  //   ],
  //   queryFn: () =>
  //     searchOrganizationOpportunities({
  //       organization: id,
  //       categories:
  //         categories != undefined
  //           ? categories
  //               ?.toString()
  //               .split("|")
  //               .map((x) => {
  //                 const item = lookups_categories?.find((y) => y.name === x);
  //                 return item ? item?.id : "";
  //               })
  //               .filter((x) => x != "")
  //           : null,
  //       opportunities: opportunities
  //         ? opportunities?.toString().split("|")
  //         : null,
  //       startDate: startDate ? startDate.toString() : "",
  //       endDate: endDate ? endDate.toString() : "",
  //       pageNumber: pageSelectedOpportunities
  //         ? parseInt(pageSelectedOpportunities.toString())
  //         : 1,
  //       pageSize: PAGE_SIZE,
  //     }),
  //   enabled: !error,
  // });

  // // QUERY: SSO
  // const { data: dataSSO, isLoading: isLoadingSSO } =
  //   useQuery<OrganizationSearchSso>({
  //     queryKey: ["organisationSSO", id, startDate, endDate],
  //     queryFn: () =>
  //       searchOrganizationSso({
  //         organization: id,
  //         startDate: startDate ? startDate.toString() : "",
  //         endDate: endDate ? endDate.toString() : "",
  //       }),
  //   });

  // // search filter state
  // const [searchFilter, setSearchFilter] =
  //   useState<OrganizationSearchFilterSummaryViewModel>({
  //     pageSelectedOpportunities: pageSelectedOpportunities
  //       ? parseInt(pageSelectedOpportunities.toString())
  //       : 1,
  //     pageCompletedYouth: pageCompletedYouth
  //       ? parseInt(pageCompletedYouth.toString())
  //       : 1,
  //     organization: id,
  //     categories: null,
  //     opportunities: null,
  //     startDate: "",
  //     endDate: "",
  //     countries: null,
  //   });

  // // sets the filter values from the querystring to the filter state
  // useEffect(() => {
  //   setSearchFilter({
  //     pageSelectedOpportunities: pageSelectedOpportunities
  //       ? parseInt(pageSelectedOpportunities.toString())
  //       : 1,
  //     pageCompletedYouth: pageCompletedYouth
  //       ? parseInt(pageCompletedYouth.toString())
  //       : 1,
  //     organization: id,
  //     categories:
  //       categories != undefined ? categories?.toString().split("|") : null,
  //     opportunities:
  //       opportunities != undefined && opportunities != null
  //         ? opportunities?.toString().split("|")
  //         : null,
  //     startDate: startDate != undefined ? startDate.toString() : "",
  //     endDate: endDate != undefined ? endDate.toString() : "",
  //     countries:
  //       countries != undefined ? countries?.toString().split("|") : null,
  //   });
  // }, [
  //   setSearchFilter,
  //   id,
  //   pageSelectedOpportunities,
  //   pageCompletedYouth,
  //   categories,
  //   opportunities,
  //   startDate,
  //   endDate,
  //   countries,
  // ]);

  // // carousel data
  // const fetchDataAndUpdateCache_Opportunities = useCallback(
  //   async (
  //     queryKey: unknown[],
  //     filter: OrganizationSearchFilterOpportunity,
  //   ): Promise<OrganizationSearchResultsOpportunity> => {
  //     const cachedData =
  //       queryClient.getQueryData<OrganizationSearchResultsOpportunity>(
  //         queryKey,
  //       );

  //     if (cachedData) {
  //       return cachedData;
  //     }

  //     const data = await searchOrganizationOpportunities(filter);

  //     queryClient.setQueryData(queryKey, data);

  //     return data;
  //   },
  //   [queryClient],
  // );
  // const fetchDataAndUpdateCache_Youth = useCallback(
  //   async (
  //     queryKey: unknown[],
  //     filter: OrganizationSearchFilterYouth,
  //   ): Promise<OrganizationSearchResultsYouth> => {
  //     const cachedData =
  //       queryClient.getQueryData<OrganizationSearchResultsYouth>(queryKey);

  //     if (cachedData) {
  //       return cachedData;
  //     }

  //     const data = await searchOrganizationYouth(filter);

  //     queryClient.setQueryData(queryKey, data);

  //     return data;
  //   },
  //   [queryClient],
  // );
  // const loadData_Opportunities = useCallback(
  //   async (startRow: number) => {
  //     if (startRow > (dataSelectedOpportunities?.totalCount ?? 0)) {
  //       return {
  //         items: [],
  //         totalCount: 0,
  //       };
  //     }
  //     const pageNumber = Math.ceil(startRow / PAGE_SIZE_MINIMUM);

  //     return fetchDataAndUpdateCache_Opportunities(
  //       [
  //         "OrganizationSearchResultsSelectedOpportunities",
  //         pageNumber,
  //         id,
  //         categories,
  //         opportunities,
  //         startDate,
  //         endDate,
  //       ],
  //       {
  //         pageNumber: pageNumber,
  //         pageSize: PAGE_SIZE_MINIMUM,
  //         organization: id,
  //         categories:
  //           categories != undefined
  //             ? categories
  //                 ?.toString()
  //                 .split("|")
  //                 .map((x) => {
  //                   const item = lookups_categories?.find((y) => y.name === x);
  //                   return item ? item?.id : "";
  //                 })
  //                 .filter((x) => x != "")
  //             : null,
  //         opportunities: opportunities
  //           ? opportunities?.toString().split("|")
  //           : null,
  //         startDate: startDate ? startDate.toString() : "",
  //         endDate: endDate ? endDate.toString() : "",
  //       },
  //     );
  //   },
  //   [
  //     dataSelectedOpportunities,
  //     fetchDataAndUpdateCache_Opportunities,
  //     categories,
  //     opportunities,
  //     startDate,
  //     endDate,
  //     id,
  //     lookups_categories,
  //   ],
  // );
  // const loadData_Youth = useCallback(
  //   async (startRow: number) => {
  //     if (startRow > (dataCompletedYouth?.totalCount ?? 0)) {
  //       return {
  //         items: [],
  //         totalCount: 0,
  //       };
  //     }
  //     const pageNumber = Math.ceil(startRow / PAGE_SIZE_MINIMUM);

  //     return fetchDataAndUpdateCache_Youth(
  //       [
  //         "OrganizationSearchResultsCompletedYouth",
  //         pageNumber,
  //         id,
  //         categories,
  //         opportunities,
  //         startDate,
  //         endDate,
  //         countries,
  //       ],
  //       {
  //         pageNumber: pageNumber,
  //         pageSize: PAGE_SIZE_MINIMUM,
  //         organization: id,
  //         categories:
  //           categories != undefined
  //             ? categories
  //                 ?.toString()
  //                 .split("|")
  //                 .map((x) => {
  //                   const item = lookups_categories?.find((y) => y.name === x);
  //                   return item ? item?.id : "";
  //                 })
  //                 .filter((x) => x != "")
  //             : null,
  //         opportunities: opportunities
  //           ? opportunities?.toString().split("|")
  //           : null,
  //         startDate: startDate ? startDate.toString() : "",
  //         endDate: endDate ? endDate.toString() : "",
  //         countries:
  //           countries != undefined
  //             ? countries
  //                 ?.toString()
  //                 .split("|")
  //                 .map((x) => {
  //                   const item = lookups_countries?.find((y) => y.name === x);
  //                   return item ? item?.id : "";
  //                 })
  //                 .filter((x) => x != "")
  //             : null,
  //       },
  //     );
  //   },
  //   [
  //     dataCompletedYouth,
  //     fetchDataAndUpdateCache_Youth,
  //     categories,
  //     opportunities,
  //     startDate,
  //     endDate,
  //     countries,
  //     id,
  //     lookups_categories,
  //     lookups_countries,
  //   ],
  // );

  // // calculate counts
  // useEffect(() => {
  //   if (!dataSelectedOpportunities?.items) return;

  //   const inactiveCount = dataSelectedOpportunities.items.filter(
  //     (opportunity) => opportunity.status === ("Inactive" as any),
  //   ).length;
  //   const expiredCount = dataSelectedOpportunities.items.filter(
  //     (opportunity) => opportunity.status === ("Expired" as any),
  //   ).length;

  //   setInactiveOpportunitiesCount(inactiveCount);
  //   setExpiredOpportunitiesCount(expiredCount);
  // }, [dataSelectedOpportunities]);

  // // 🎈 FUNCTIONS
  // const getSearchFilterAsQueryString = useCallback(
  //   (opportunitySearchFilter: OrganizationSearchFilterSummaryViewModel) => {
  //     if (!opportunitySearchFilter) return null;

  //     // construct querystring parameters from filter
  //     const params = new URLSearchParams();

  //     if (
  //       opportunitySearchFilter?.categories?.length !== undefined &&
  //       opportunitySearchFilter.categories.length > 0
  //     )
  //       params.append(
  //         "categories",
  //         opportunitySearchFilter.categories.join("|"),
  //       );

  //     if (
  //       opportunitySearchFilter?.opportunities?.length !== undefined &&
  //       opportunitySearchFilter.opportunities.length > 0
  //     )
  //       params.append(
  //         "opportunities",
  //         opportunitySearchFilter.opportunities.join("|"),
  //       );

  //     if (opportunitySearchFilter.startDate)
  //       params.append("startDate", opportunitySearchFilter.startDate);

  //     if (opportunitySearchFilter.endDate)
  //       params.append("endDate", opportunitySearchFilter.endDate);

  //     if (
  //       opportunitySearchFilter?.countries?.length !== undefined &&
  //       opportunitySearchFilter.countries.length > 0
  //     )
  //       params.append("countries", opportunitySearchFilter.countries.join("|"));

  //     if (
  //       opportunitySearchFilter.pageSelectedOpportunities !== null &&
  //       opportunitySearchFilter.pageSelectedOpportunities !== undefined &&
  //       opportunitySearchFilter.pageSelectedOpportunities !== 1
  //     )
  //       params.append(
  //         "pageSelectedOpportunities",
  //         opportunitySearchFilter.pageSelectedOpportunities.toString(),
  //       );

  //     if (
  //       opportunitySearchFilter.pageCompletedYouth !== null &&
  //       opportunitySearchFilter.pageCompletedYouth !== undefined &&
  //       opportunitySearchFilter.pageCompletedYouth !== 1
  //     )
  //       params.append(
  //         "pageCompletedYouth",
  //         opportunitySearchFilter.pageCompletedYouth.toString(),
  //       );

  //     if (params.size === 0) return null;
  //     return params;
  //   },
  //   [],
  // );
  // const redirectWithSearchFilterParams = useCallback(
  //   (filter: OrganizationSearchFilterSummaryViewModel) => {
  //     let url = `/organisations/${id}`;
  //     const params = getSearchFilterAsQueryString(filter);
  //     if (params != null && params.size > 0)
  //       url = `${url}?${params.toString()}`;

  //     if (url != router.asPath)
  //       void router.push(url, undefined, { scroll: false });
  //   },
  //   [id, router, getSearchFilterAsQueryString],
  // );

  // // 🔔 EVENTS
  // const onSubmitFilter = useCallback(
  //   (val: OrganizationSearchFilterSummaryViewModel) => {
  //     console.table(val);
  //     redirectWithSearchFilterParams({
  //       categories: val.categories,
  //       opportunities: val.opportunities,
  //       startDate: val.startDate,
  //       endDate: val.endDate,
  //       pageSelectedOpportunities: pageSelectedOpportunities
  //         ? parseInt(pageSelectedOpportunities.toString())
  //         : 1,
  //       pageCompletedYouth: pageCompletedYouth
  //         ? parseInt(pageCompletedYouth.toString())
  //         : 1,
  //       organization: id,
  //       countries: val.countries,
  //     });
  //   },
  //   [
  //     id,
  //     redirectWithSearchFilterParams,
  //     pageSelectedOpportunities,
  //     pageCompletedYouth,
  //   ],
  // );
  // const handlePagerChangeSelectedOpportunities = useCallback(
  //   (value: number) => {
  //     searchFilter.pageSelectedOpportunities = value;
  //     redirectWithSearchFilterParams(searchFilter);
  //   },
  //   [searchFilter, redirectWithSearchFilterParams],
  // );
  // const handlePagerChangeCompletedYouth = useCallback(
  //   (value: number) => {
  //     searchFilter.pageCompletedYouth = value;
  //     redirectWithSearchFilterParams(searchFilter);
  //   },
  //   [searchFilter, redirectWithSearchFilterParams],
  // );

  const {
    data: dataMyOpportunities,
    error: dataMyOpportunitiesError,
    isLoading: dataMyOpportunitiesIsLoading,
  } = useQuery({
    queryKey: ["MyOpportunities_Completed"],
    queryFn: () =>
      searchMyOpportunities({
        action: Action.Verification,
        verificationStatuses: [VerificationStatus.Completed],
        pageNumber: null, // pageNumber,
        pageSize: PAGE_SIZE,
      }),
    enabled: !error,
  });

  if (error) {
    if (error === 401) return <Unauthenticated />;
    else if (error === 403) return <Unauthorized />;
    else return <InternalServerError />;
  }

  return (
    <>
      <Head>
        <title>Yoma | YoID</title>
      </Head>

      <PageBackground className="h-[15rem] md:h-[16rem]" />

      <ZltoModal
        isOpen={zltoModalVisible}
        onClose={() => setZltoModalVisible(false)}
      />

      {/* {(isLoadingEngagement ||
        isLoadingSelectedOpportunities ||
        isLoadingCompletedYouth ||
        isLoadingSSO) && <Loading />} */}

      {/* REFERENCE FOR FILTER POPUP: fix menu z-index issue */}
      {/* <div ref={myRef} /> */}

      <div className="container z-10 mt-[6rem] max-w-7xl overflow-hidden px-4 py-1 md:py-4">
        <div className="flex flex-col gap-4">
          {/* HEADER */}
          <div className="flex flex-col gap-2">
            {/* WELCOME MSG */}
            <div className="truncate text-xl font-semibold text-white md:text-2xl">
              <span>
                {timeOfDayEmoji} Good {timeOfDay}&nbsp;
                <span>{user?.name}!</span>
              </span>
            </div>

            <div className="flex flex-row items-center gap-2 text-white">
              {/* DESCRIPTION */}
              <span className="truncate">Welcome to your Yo-ID</span>

              {/* TOOLTIP */}
              <button type="button" onClick={() => setZltoModalVisible(true)}>
                <IoIosInformationCircleOutline className="h-6 w-6" />
              </button>
            </div>

            {/* BUTTONS */}
            <div className="mt-4 flex flex-row gap-2">
              <Link
                className="md:btn-mdx btn btn-secondary btn-sm w-1/2 md:max-w-[200px]"
                href="/yoid/settings"
              >
                Edit Profile
              </Link>
              <Link
                className="md:btn-mdx btn btn-secondary btn-sm w-1/2 md:max-w-[200px]"
                href="/yoid/appSettings"
              >
                Settings
              </Link>
            </div>
          </div>

          {/* DASHBOARD */}
          <div
            //className="grid-col-1 md:grid-col-3 mt-4 grid gap-4"
            className="mt-5 flex flex-col gap-4 md:flex-row"
          >
            {/* WALLET */}
            <div className="flex flex-col gap-2">
              <HeaderWithLink title="Wallet 💸" url="/yoid/credentials" />
              <WalletCard />
            </div>

            {/* SKILLS */}
            <div className="flex flex-col gap-2">
              <HeaderWithLink title="Skills ⚡" url="/yoid/credentials" />
              <div className="flex h-[185px] w-full flex-col gap-4 rounded-lg bg-white p-4 shadow md:w-[333px]">
                <div className="my-2 flex flex-wrap gap-1 overflow-y-auto">
                  {userProfile?.skills?.map((skill) => (
                    <div
                      key={skill.id}
                      className="badge bg-green px-2 py-1 text-white"
                    >
                      {skill.infoURL && (
                        <Link href={skill.infoURL}>{skill.name}</Link>
                      )}
                      {!skill.infoURL && <div>{skill.name}</div>}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* OPPORTUNITIES */}
            <div className="flex flex-col gap-2">
              <HeaderWithLink
                title="Opportunities 🏆"
                url="/yoid/opportunities"
              />
              <div className="flex h-[185px] w-full flex-col gap-4 rounded-lg bg-white p-4 shadow md:w-[333px]">
                <div className="my-2 flex flex-wrap gap-1"></div>
              </div>
            </div>

            {/* DEMOGRAPHICS */}
            {/* <div className="flex w-full flex-col gap-2">
              {/* <div className="mb-2 text-xl font-semibold">Demographics</div>

              <div className="flex w-full flex-col gap-4 md:flex-row">
                {/* WALLET
                <WalletCard />
              </div>
            </div>*/}
          </div>
        </div>
      </div>
    </>
  );
};

YoIDDashboard.getLayout = function getLayout(page: ReactElement) {
  return <MainLayout>{page}</MainLayout>;
};

// 👇 return theme from component properties. this is set server-side (getServerSideProps)
// YoIDDashboard.theme = function getTheme(page: ReactElement) {
//   // eslint-disable-next-line @typescript-eslint/no-unsafe-return
//   return page.props.theme;
// };

export default YoIDDashboard;
