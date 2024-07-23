import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAtom } from "jotai";
import type { GetServerSidePropsContext } from "next";
import { getServerSession } from "next-auth";
import Head from "next/head";
import Link from "next/link";
import { type ParsedUrlQuery } from "querystring";
import { useState, type ReactElement } from "react";
import "react-datepicker/dist/react-datepicker.css";
import { IoIosInformationCircleOutline } from "react-icons/io";
import { SSIWalletSearchResults } from "~/api/models/credential";
import { Action, VerificationStatus } from "~/api/models/myOpportunity";
import { searchCredentials } from "~/api/services/credentials";
import { searchMyOpportunitiesSummary } from "~/api/services/myOpportunities";
import { getUserSkills } from "~/api/services/user";
import MainLayout from "~/components/Layout/Main";
import { PageBackground } from "~/components/PageBackground";
import { InternalServerError } from "~/components/Status/InternalServerError";
import { LoadingSkeleton } from "~/components/Status/LoadingSkeleton";
import { Unauthenticated } from "~/components/Status/Unauthenticated";
import { Unauthorized } from "~/components/Status/Unauthorized";
import { HeaderWithLink } from "~/components/YoID/HeaderWithLink";
import { LineChart } from "~/components/YoID/LineChart";
import { PassportCard } from "~/components/YoID/PassportCard";
import { SkillsCard } from "~/components/YoID/SkillsCard";
import { WalletCard } from "~/components/YoID/WalletCard";
import { ZltoModal } from "~/components/YoID/ZltoModal";
import { userProfileAtom } from "~/lib/store";
import { getTimeOfDayAndEmoji } from "~/lib/utils";
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
    data: dataUserSkills,
    error: dataUserSkillsError,
    isLoading: dataUserSkillsIsLoading,
  } = useQuery({
    queryKey: ["User", "Skills"],
    queryFn: () => getUserSkills(),
    enabled: !error,
  });

  const {
    data: dataMyOpportunitiesSummary,
    error: dataMyOpportunitiesSummaryError,
    isLoading: dataMyOpportunitiesSummaryIsLoading,
  } = useQuery({
    queryKey: ["MyOpportunities", "Summary", "All"],
    queryFn: () =>
      searchMyOpportunitiesSummary({
        action: Action.Verification,
        verificationStatuses: [
          VerificationStatus.Completed,
          VerificationStatus.Rejected,
          VerificationStatus.Pending,
        ],
      }),
    enabled: !error,
  });

  const {
    data: dataCredentials,
    error: dataCredentialsError,
    isLoading: dataCredentialsIsLoading,
  } = useQuery<{ schemaType: string; totalCount: number | null }[]>({
    queryKey: ["Credentials", "TotalCounts"],
    queryFn: (): Promise<{ schemaType: string; totalCount: number | null }[]> =>
      Promise.all([
        searchCredentials({
          pageNumber: null,
          pageSize: null,
          schemaType: "Opportunity",
        }),
        searchCredentials({
          pageNumber: null,
          pageSize: null,
          schemaType: "YoID",
        }),
      ])
        .then(([opportunityResult, yoidResult]) => {
          const combinedResults = [
            {
              schemaType: "Opportunity",
              totalCount: opportunityResult.totalCount,
            },
            { schemaType: "YoID", totalCount: yoidResult.totalCount },
          ];

          return combinedResults;
        })
        .catch((error) => {
          console.error("Error fetching data:", error);
          // Depending on your error handling strategy, you might want to throw an error or return a default value
          throw error; // or return [];
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
            className="mt-8 flex flex-wrap justify-center gap-4 lg:justify-normal"
          >
            {/* WALLET */}
            <div className="flex w-full flex-col gap-2 sm:w-[300px] md:w-[350px] lg:w-[400px]">
              <HeaderWithLink title="Wallet 💸" url="/yoid/credentials" />
              <div className="flex h-[185px] w-full flex-col gap-4 rounded-lg bg-white p-4 shadow">
                {userProfile ? (
                  <WalletCard userProfile={userProfile} />
                ) : (
                  <LoadingSkeleton />
                )}
              </div>
            </div>

            {/* SKILLS */}
            <div className="flex w-full flex-col gap-2 sm:w-[300px] md:w-[350px] lg:w-[400px]">
              <HeaderWithLink title="Skills ⚡" url="/yoid/credentials" />
              <div className="flex h-[185px] w-full flex-col gap-4 rounded-lg bg-white p-4 shadow">
                <div className="flex flex-wrap gap-1 overflow-y-auto">
                  {dataUserSkills ? (
                    <SkillsCard data={dataUserSkills} />
                  ) : (
                    <LoadingSkeleton />
                  )}
                </div>
              </div>
            </div>

            {/* OPPORTUNITIES */}
            <div className="flex w-full flex-col gap-2 sm:w-[300px] md:w-[350px] lg:w-[400px]">
              <HeaderWithLink
                title="Opportunities 🏆"
                url="/yoid/opportunities"
              />
              <div className="flex h-[185px] w-full flex-col gap-4 rounded-lg bg-white p-4 shadow">
                {dataMyOpportunitiesSummary?.myOpportunities && userProfile ? (
                  <LineChart
                    data={dataMyOpportunitiesSummary.myOpportunities}
                    userProfile={userProfile}
                  />
                ) : (
                  <LoadingSkeleton />
                )}
              </div>
            </div>

            {/* PASSPORT */}
            <div className="flex w-full flex-col gap-2 sm:w-[300px] md:w-[350px] lg:w-[400px]">
              <HeaderWithLink title="Passport 🌐" url="/yoid/credentials" />
              <div className="flex h-[185px] w-full flex-col gap-4 rounded-lg bg-white p-4 shadow">
                {dataCredentials ? (
                  <PassportCard data={dataCredentials} />
                ) : (
                  <LoadingSkeleton />
                )}
              </div>
            </div>
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
