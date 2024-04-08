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
import { authOptions } from "~/server/auth";
import { Unauthorized } from "~/components/Status/Unauthorized";
import type { NextPageWithLayout } from "~/pages/_app";
import { config } from "~/lib/react-query-config";
import LimitedFunctionalityBadge from "~/components/Status/LimitedFunctionalityBadge";
import { PageBackground } from "~/components/PageBackground";
import { IoMdCompass, IoMdDocument, IoMdHourglass } from "react-icons/io";
import { useRouter } from "next/router";
import {
  searchOrganizationEngagement,
  searchOrganizationOpportunities,
  searchOrganizationYouth,
} from "~/api/services/organizationDashboard";
import type { GetServerSidePropsContext } from "next";
import type { OpportunityCategory } from "~/api/models/opportunity";
import { getServerSession } from "next-auth";
import { Loading } from "~/components/Status/Loading";
import { OrganisationRowFilter } from "~/components/Organisation/Dashboard/OrganisationRowFilter";
import FilterBadges from "~/components/FilterBadges";
import { toISOStringForTimezone } from "~/lib/utils";
import Link from "next/link";
import { getThemeFromRole } from "~/lib/utils";
import Image from "next/image";
import iconZlto from "public/images/icon-zlto.svg";
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
import { getCategoriesAdmin } from "~/api/services/opportunities";
import { LineChart } from "~/components/Organisation/Dashboard/LineChart";
import { PieChart } from "~/components/Organisation/Dashboard/PieChart";
import axios from "axios";
import { InternalServerError } from "~/components/Status/InternalServerError";
import { Unauthenticated } from "~/components/Status/Unauthenticated";

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
  } catch (error) {
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
    },
  };
}

// OrgAdmin dashboard page
const OrganisationDashboard: NextPageWithLayout<{
  id: string;
  error?: number;
}> = ({ id, error }) => {
  const router = useRouter();
  const myRef = useRef<HTMLDivElement>(null);

  // 👇 use prefetched queries from server
  const { data: lookups_categories } = useQuery<OpportunityCategory[]>({
    queryKey: ["OrganisationDashboardCategories", id],
    queryFn: () => getCategoriesAdmin(id),
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
  } = router.query;

  const comingSoon = true;

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

      <PageBackground className="h-[250px] lg:h-[275px]" />

      {isSearchPerformed && isLoading && <Loading />}

      {/* REFERENCE FOR FILTER POPUP: fix menu z-index issue */}
      <div ref={myRef} />

      {comingSoon && comingSoon ? (
        <div className="container z-30 flex max-w-7xl flex-col items-center justify-center p-4">
          <div className="flex w-full flex-col items-center justify-center gap-8 rounded-lg bg-white p-4 py-16 shadow-custom">
            <div className="rounded-full p-4 text-4xl tracking-wider shadow-custom">
              🚀
            </div>
            <h2 className="text-center text-2xl font-medium text-gray-dark">
              Dashboard coming soon
            </h2>
          </div>
        </div>
      ) : (
        <div className="container z-10 mt-20 max-w-7xl overflow-hidden px-4 py-1 md:py-4">
          <div className="flex flex-col gap-4">
            {/* HEADER */}
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
              <div className="-mt-2 mb-4 flex flex-col gap-1 leading-4 text-white lg:flex-row">
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
            </div>

            {/* FILTERS */}
            <div className="mt-16 flex lg:mt-20">
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
                          ? toISOStringForTimezone(new Date(value)).split(
                              "T",
                            )[0]
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

            {/* SUMMARY */}
            <div className="flex flex-col gap-4 md:-mt-2">
              {/* ENGAGEMENT */}
              <div className="flex flex-col gap-2">
                <div className="text-xl font-semibold">Engagement</div>

                <div className="flex flex-col gap-2 md:flex-row">
                  {/* VIEWED COMPLETED */}
                  {searchResults?.opportunities?.viewedCompleted && (
                    <LineChart
                      id="viewedCompleted"
                      data={searchResults.opportunities.viewedCompleted}
                      width={402}
                      height={328}
                    />
                  )}

                  <div className="flex flex-col gap-2">
                    {/* OPPORTUNITIES SELECTED */}
                    <div className="flex h-40 w-full flex-col rounded-lg bg-white p-4 shadow md:w-64">
                      <div className="flex flex-row items-center gap-2">
                        <IoMdDocument className="text-green" />
                        <div className="text-sm font-semibold">
                          Opportunities selected
                        </div>
                      </div>

                      <div className="flex flex-grow flex-col">
                        <div className="flex-grow text-2xl font-bold">
                          {searchResults?.opportunities?.selected?.count ?? 0}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <div className="flex flex-col gap-2 md:flex-row">
                        {/* AVERAGE TIME */}
                        <div className="flex h-40 w-full flex-col rounded-lg bg-white p-4 shadow md:w-64">
                          <div className="flex flex-row items-center gap-2">
                            <IoMdHourglass className="text-green" />
                            <div className="text-sm font-semibold">
                              Average time
                            </div>
                          </div>

                          <div className="flex flex-grow flex-col">
                            <div className="flex-grow text-2xl font-bold">
                              {searchResults?.opportunities.completion
                                .averageTimeInDays ?? 0}
                            </div>
                          </div>
                        </div>

                        {/* CONVERSERSION RATE */}
                        {searchResults?.opportunities?.conversionRate && (
                          <PieChart
                            id="conversionRate"
                            title={
                              searchResults.opportunities.conversionRate.legend
                            }
                            subTitle={`${
                              searchResults.opportunities.conversionRate
                                .percentage ?? 0
                            } %`}
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
                            className="w-full md:w-60 lg:w-80"
                          />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* REWARDS */}
              <div className="flex flex-col gap-2">
                <div className="text-xl font-semibold">Rewards</div>

                <div className="flex flex-col gap-2 md:flex-row">
                  {/* ZLTO AMOUNT AWARDED */}
                  <div className="h-40 w-full flex-col rounded-lg bg-white p-4 shadow md:w-[420px]">
                    <div className="flex flex-row items-center gap-2">
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

                  {/* TOTAL UNIQUE SKILLS */}
                  <div
                    className="overflow-hidden rounded-lg bg-white shadow"
                    style={{ minWidth: "288px", height: "160px" }}
                  >
                    <LineChart
                      id="totalUniqueSkills"
                      data={searchResults?.skills?.items}
                      width={288}
                      height={160}
                      chartWidth={288}
                      chartHeight={100}
                      hideAxisesAndGridLines={true}
                    />
                  </div>

                  {/* MOST COMPLETED SKILLS */}
                  {searchResults?.skills?.topCompleted && (
                    <>
                      <div className="flex w-full flex-col rounded-lg bg-white p-4 shadow md:h-[160px]">
                        <div className="flex flex-row items-center gap-2">
                          <IoMdCompass className="text-green" />
                          <div className="text-sm font-semibold">
                            {searchResults?.skills.topCompleted.legend}
                          </div>
                        </div>
                        <div className="mt-2 flex flex-grow flex-wrap gap-1 overflow-x-hidden overflow-y-scroll md:h-[100px]">
                          {searchResults?.skills.topCompleted.topCompleted.map(
                            (x) => (
                              <div
                                key={x.id}
                                className="min-h-6 md:truncate-none badge w-min text-ellipsis rounded-md border-0 bg-green text-white md:w-fit md:max-w-none"
                              >
                                {x.name}
                              </div>
                            ),
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* DEMOGRAPHICS */}
              <div className="flex flex-col gap-2">
                <div className="text-xl font-semibold">Demographics</div>

                <div className="flex flex-col gap-2 md:flex-row">
                  {/* COUNTRIES */}
                  {searchResults?.demographics?.countries?.items && (
                    <PieChart
                      id="countries"
                      title="Country"
                      subTitle=""
                      colors={CHART_COLORS}
                      data={[
                        ["Country", "Value"],
                        ...Object.entries(
                          searchResults?.demographics?.countries?.items || {},
                        ),
                      ]}
                      className="h-40 w-full md:w-72"
                    />
                  )}

                  {/* GENDERS */}
                  {searchResults?.demographics?.genders?.items && (
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
                      className="h-40 w-full md:w-72"
                    />
                  )}

                  {/* AGE */}
                  {searchResults?.demographics?.ages?.items && (
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
                      className="h-40 w-full md:w-64 lg:w-72"
                    />
                  )}
                </div>
              </div>
            </div>

            {/* SELECTED OPPORTUNITIES */}
            <div className="flex flex-col">
              <div className="text-xl font-semibold">
                Selected Opportunities
              </div>

              {selectedOpportunitiesIsLoading && <LoadingSkeleton />}

              {/* SELECTED OPPORTUNITIES */}
              {!selectedOpportunitiesIsLoading && (
                <div id="results">
                  <div className="mb-6 flex flex-row items-center justify-end"></div>
                  <div className="rounded-lg bg-white p-4">
                    {/* NO ROWS */}
                    {(!selectedOpportunities ||
                      selectedOpportunities.items?.length === 0) && (
                      <div className="flex flex-col place-items-center py-52">
                        <NoRowsMessage
                          title={"No opportunities found"}
                          description={"Please try refining your search query."}
                        />
                      </div>
                    )}

                    {/* GRID */}
                    {selectedOpportunities &&
                      selectedOpportunities.items?.length > 0 && (
                        <div className="overflow-x-auto">
                          <table className="table">
                            <thead>
                              <tr className="border-gray text-gray-dark">
                                <th>Opportunity</th>
                                <th>Views</th>
                                <th>Converson ratio</th>
                                <th>Completions</th>
                                <th>Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {selectedOpportunities.items.map(
                                (opportunity) => (
                                  <tr
                                    key={opportunity.id}
                                    className="border-gray"
                                  >
                                    <td>
                                      <Link
                                        href={`/organisations/${id}/opportunities/${
                                          opportunity.id
                                        }/info?returnUrl=${encodeURIComponent(
                                          router.asPath,
                                        )}`}
                                      >
                                        {opportunity.title}
                                      </Link>
                                    </td>
                                    <td className="text-center">
                                      {opportunity.viewedCount}
                                    </td>
                                    <td className="text-center">
                                      {opportunity.conversionRatioPercentage}
                                    </td>
                                    <td className="text-center">
                                      {opportunity.completedCount}
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
                      )}

                    {/* PAGINATION */}
                    {selectedOpportunities &&
                      selectedOpportunities.totalCount > 0 && (
                        <div className="mt-2 grid place-items-center justify-center">
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

            {/* COMPLETED YOUTH */}
            <div className="flex flex-col">
              <div className="text-xl font-semibold">Completed Youth</div>

              {completedYouthIsLoading && <LoadingSkeleton />}

              {/* COMPLETED YOUTH */}
              {!completedYouthIsLoading && (
                <div id="results">
                  <div className="mb-6 flex flex-row items-center justify-end"></div>
                  <div className="rounded-lg bg-white p-4">
                    {/* NO ROWS */}
                    {(!completedYouth ||
                      completedYouth.items?.length === 0) && (
                      <div className="flex flex-col place-items-center py-52">
                        <NoRowsMessage
                          title={"No opportunities found"}
                          description={"Please try refining your search query."}
                        />
                      </div>
                    )}

                    {/* GRID */}
                    {completedYouth && completedYouth.items?.length > 0 && (
                      <div className="overflow-x-auto">
                        <table className="table">
                          <thead>
                            <tr className="border-gray text-gray-dark">
                              <th>Student</th>
                              <th>Opportunity</th>
                              <th>Date connected</th>
                              <th>Verified</th>
                              <th>Opportunity Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {completedYouth.items.map((opportunity) => (
                              <tr
                                key={`completedYouth_${opportunity.opportunityId}_${opportunity.userId}`}
                                className="border-gray"
                              >
                                <td>{opportunity.userDisplayName}</td>
                                <td>
                                  <Link
                                    href={`/organisations/${id}/opportunities/${
                                      opportunity.opportunityId
                                    }/info?returnUrl=${encodeURIComponent(
                                      router.asPath,
                                    )}`}
                                  >
                                    {opportunity.opportunityTitle}
                                  </Link>
                                </td>
                                <td className="whitespace-nowrap">
                                  {opportunity.dateCompleted
                                    ? moment(
                                        new Date(opportunity.dateCompleted),
                                      ).format(DATETIME_FORMAT_HUMAN)
                                    : ""}
                                </td>
                                <td className="whitespace-nowrap">
                                  {opportunity.verified
                                    ? "Verified"
                                    : "Not verified"}
                                </td>
                                <td>{opportunity.opportunityStatus}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
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
      )}
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
