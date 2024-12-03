import { QueryClient, dehydrate, useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useAtomValue } from "jotai";
import { type GetServerSidePropsContext } from "next";
import { getServerSession } from "next-auth";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import iconZlto from "public/images/icon-zlto.svg";
import { type ParsedUrlQuery } from "querystring";
import { useCallback, useMemo, type ReactElement } from "react";
import { IoIosAdd, IoIosLink, IoIosWarning, IoMdEyeOff } from "react-icons/io";
import { toast } from "react-toastify";
import {
  Status,
  type OpportunitySearchFilterAdmin,
  type OpportunitySearchResults,
} from "~/api/models/opportunity";
import { getOpportunitiesAdmin } from "~/api/services/opportunities";
import MainLayout from "~/components/Layout/Main";
import NoRowsMessage from "~/components/NoRowsMessage";
import OpportunityStatus from "~/components/Opportunity/OpportunityStatus";
import { PageBackground } from "~/components/PageBackground";
import { PaginationButtons } from "~/components/PaginationButtons";
import { SearchInput } from "~/components/SearchInput";
import { InternalServerError } from "~/components/Status/InternalServerError";
import LimitedFunctionalityBadge from "~/components/Status/LimitedFunctionalityBadge";
import { LoadingSkeleton } from "~/components/Status/LoadingSkeleton";
import { Unauthenticated } from "~/components/Status/Unauthenticated";
import { Unauthorized } from "~/components/Status/Unauthorized";
import { PAGE_SIZE } from "~/lib/constants";
import { config } from "~/lib/react-query-config";
import { currentOrganisationInactiveAtom } from "~/lib/store";
import { getSafeUrl, getThemeFromRole } from "~/lib/utils";
import { type NextPageWithLayout } from "~/pages/_app";
import { authOptions } from "~/server/auth";

interface IParams extends ParsedUrlQuery {
  id: string;
  query?: string;
  page?: string;
  status?: string;
}

// ⚠️ SSR
export async function getServerSideProps(context: GetServerSidePropsContext) {
  const { id } = context.params as IParams;
  const { query, page, status, returnUrl } = context.query;
  const session = await getServerSession(context.req, context.res, authOptions);
  const queryClient = new QueryClient(config);
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

  try {
    // 👇 prefetch queries on server
    const data = await getOpportunitiesAdmin(
      {
        organizations: [id],
        pageNumber: page ? parseInt(page.toString()) : 1,
        pageSize: PAGE_SIZE,
        startDate: null,
        endDate: null,
        statuses:
          status === "active"
            ? [Status.Active]
            : status === "inactive"
              ? [Status.Inactive]
              : status === "expired"
                ? [Status.Expired]
                : status === "deleted"
                  ? [Status.Deleted]
                  : [
                      Status.Active,
                      Status.Expired,
                      Status.Inactive,
                      Status.Deleted,
                    ],
        types: null,
        categories: null,
        languages: null,
        countries: null,
        valueContains: query?.toString() ?? null,
        featured: null,
        engagementTypes: null,
      },
      context,
    );

    await queryClient.prefetchQuery({
      queryKey: [
        "opportunities",
        id,
        `${query?.toString()}_${page?.toString()}_${status?.toString()}`,
      ],
      queryFn: () => data,
    });
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
      id: id,
      query: query ?? null,
      page: page ?? null,
      status: status ?? null,
      theme: theme,
      error: errorCode,
      returnUrl: returnUrl ?? null,
    },
  };
}

const Opportunities: NextPageWithLayout<{
  id: string;
  query?: string;
  page?: string;
  theme: string;
  error?: number;
  status?: string;
  returnUrl?: string;
}> = ({ id, query, page, status, error, returnUrl }) => {
  const router = useRouter();
  const currentOrganisationInactive = useAtomValue(
    currentOrganisationInactiveAtom,
  );

  // search filter state
  const searchFilter = useMemo<OpportunitySearchFilterAdmin>(
    () => ({
      pageNumber: page ? parseInt(page.toString()) : 1,
      pageSize: PAGE_SIZE,
      organizations: [id],
      startDate: null,
      endDate: null,
      statuses: status
        ? status.toString().split("|")
        : [Status.Active, Status.Expired, Status.Inactive, Status.Deleted],
      types: null,
      categories: null,
      languages: null,
      countries: null,
      valueContains: query?.toString() ?? null,
      featured: null,
      engagementTypes: null,
    }),
    [id, page, query, status],
  );

  // 👇 use prefetched queries from server
  // NB: these queries (with ['opportunities', id]) will be invalidated by create/edit operations on other pages
  const { data: opportunities, isLoading: isLoadingData } =
    useQuery<OpportunitySearchResults>({
      queryKey: [
        "opportunities",
        id,
        `_${query?.toString()}_${page?.toString()}_${status?.toString()}`,
      ],
      queryFn: () => getOpportunitiesAdmin(searchFilter),
      enabled: !error,
    });

  const { data: totalCountAll } = useQuery<number>({
    queryKey: [
      "opportunities",
      id,
      "totalCount",
      null,
      `${query?.toString()}_${page?.toString()}_${status?.toString()}`,
    ],
    queryFn: () => {
      const filter = JSON.parse(
        JSON.stringify(searchFilter),
      ) as OpportunitySearchFilterAdmin; // deep copy

      filter.pageNumber = 1;
      filter.pageSize = 1;
      filter.statuses = [
        Status.Active,
        Status.Expired,
        Status.Inactive,
        Status.Deleted,
      ];

      return getOpportunitiesAdmin(filter).then((data) => data.totalCount ?? 0);
    },
    enabled: !error,
  });
  const { data: totalCountActive } = useQuery<number>({
    queryKey: [
      "opportunities",
      id,
      "totalCount",
      Status.Active,
      `${query?.toString()}_${page?.toString()}_${status?.toString()}`,
    ],
    queryFn: () => {
      const filter = JSON.parse(
        JSON.stringify(searchFilter),
      ) as OpportunitySearchFilterAdmin; // deep copy

      filter.pageNumber = 1;
      filter.pageSize = 1;
      filter.statuses = [Status.Active];

      return getOpportunitiesAdmin(filter).then((data) => data.totalCount ?? 0);
    },
    enabled: !error,
  });
  const { data: totalCountInactive } = useQuery<number>({
    queryKey: [
      "opportunities",
      id,
      "totalCount",
      Status.Inactive,
      `${query?.toString()}_${page?.toString()}_${status?.toString()}`,
    ],
    queryFn: () => {
      const filter = JSON.parse(
        JSON.stringify(searchFilter),
      ) as OpportunitySearchFilterAdmin; // deep copy

      filter.pageNumber = 1;
      filter.pageSize = 1;
      filter.statuses = [Status.Inactive];

      return getOpportunitiesAdmin(filter).then((data) => data.totalCount ?? 0);
    },
    enabled: !error,
  });
  const { data: totalCountExpired } = useQuery<number>({
    queryKey: [
      "opportunities",
      id,
      "totalCount",
      Status.Expired,
      `${query?.toString()}_${page?.toString()}_${status?.toString()}`,
    ],
    queryFn: () => {
      const filter = JSON.parse(
        JSON.stringify(searchFilter),
      ) as OpportunitySearchFilterAdmin; // deep copy

      filter.pageNumber = 1;
      filter.pageSize = 1;
      filter.statuses = [Status.Expired];

      return getOpportunitiesAdmin(filter).then((data) => data.totalCount ?? 0);
    },
    enabled: !error,
  });
  const { data: totalCountDeleted } = useQuery<number>({
    queryKey: [
      "opportunities",
      id,
      "totalCount",
      Status.Deleted,
      `${query?.toString()}_${page?.toString()}_${status?.toString()}`,
    ],
    queryFn: () => {
      const filter = JSON.parse(
        JSON.stringify(searchFilter),
      ) as OpportunitySearchFilterAdmin; // deep copy

      filter.pageNumber = 1;
      filter.pageSize = 1;
      filter.statuses = [Status.Deleted];

      return getOpportunitiesAdmin(filter).then((data) => data.totalCount ?? 0);
    },
    enabled: !error,
  });

  // 🎈 FUNCTIONS
  const getSearchFilterAsQueryString = useCallback(
    (searchFilter: OpportunitySearchFilterAdmin) => {
      if (!searchFilter) return null;

      // construct querystring parameters from filter
      const params = new URLSearchParams();

      if (
        searchFilter.valueContains !== undefined &&
        searchFilter.valueContains !== null &&
        searchFilter.valueContains.length > 0
      )
        params.append("query", searchFilter.valueContains);

      if (
        searchFilter?.statuses !== undefined &&
        searchFilter?.statuses !== null &&
        searchFilter?.statuses.length > 0 &&
        searchFilter?.statuses.length !== 4 // hack to prevent all" statuses from being added to the query string
      )
        params.append("status", searchFilter?.statuses.join("|"));

      if (
        searchFilter.pageNumber !== null &&
        searchFilter.pageNumber !== undefined &&
        searchFilter.pageNumber !== 1
      )
        params.append("page", searchFilter.pageNumber.toString());

      if (params.size === 0) return null;
      return params;
    },
    [],
  );

  const redirectWithSearchFilterParams = useCallback(
    (filter: OpportunitySearchFilterAdmin) => {
      let url = `/organisations/${id}/opportunities`;
      const params = getSearchFilterAsQueryString(filter);
      if (params != null && params.size > 0)
        url = `${url}?${params.toString()}`;

      if (url != router.asPath)
        void router.push(url, undefined, { scroll: false });
    },
    [id, router, getSearchFilterAsQueryString],
  );

  //#region Event Handlers
  const onSearch = useCallback(
    (query: string) => {
      searchFilter.pageNumber = 1;
      searchFilter.valueContains = query.length > 2 ? query : null;
      redirectWithSearchFilterParams(searchFilter);
    },
    [searchFilter, redirectWithSearchFilterParams],
  );

  const handlePagerChange = useCallback(
    (value: number) => {
      searchFilter.pageNumber = value;
      redirectWithSearchFilterParams(searchFilter);
    },
    [searchFilter, redirectWithSearchFilterParams],
  );

  const onFilterStatus = useCallback(
    (status: string) => {
      searchFilter.pageNumber = 1;
      searchFilter.statuses = status ? status.split("|") : null;
      redirectWithSearchFilterParams(searchFilter);
    },
    [searchFilter, redirectWithSearchFilterParams],
  );

  const onClick_CopyToClipboard = useCallback((url: string) => {
    navigator.clipboard.writeText(url);
    toast.success("URL copied to clipboard!", { autoClose: 2000 });
  }, []);
  //#endregion Event Handlers

  if (error) {
    if (error === 401) return <Unauthenticated />;
    else if (error === 403) return <Unauthorized />;
    else return <InternalServerError />;
  }

  return (
    <>
      <Head>
        <title>Yoma | Opportunities</title>
      </Head>

      <PageBackground className="h-[21rem] md:h-[17rem]" />

      <div className="container z-10 mt-14 max-w-7xl px-2 py-8 md:mt-[4.9rem]">
        <div className="flex flex-col gap-4 py-4">
          <h3 className="flex items-center text-3xl font-semibold tracking-normal text-white">
            Opportunities <LimitedFunctionalityBadge />
          </h3>

          {/* FILTERS */}
          <div>
            <div className="flex flex-col gap-4 md:flex-row">
              <div className="flex flex-grow flex-col items-center justify-start gap-4 md:flex-row">
                {/* <div className="text-sm font-semibold text-white">
                  Filter by:
                </div> */}

                {/* OPPORTUNITIES FILTER */}
                {/* <div className="w-full md:w-72">
                  <Select
                    instanceId={"opportunities"}
                    classNames={{
                      control: () =>
                        "input input-xs md:w-[330px] !border-0 !rounded-lg",
                    }}
                    options={dataOpportunitiesForVerification}
                    onChange={(val) => onFilterOpportunity(val?.value ?? "")}
                    value={dataOpportunitiesForVerification?.find(
                      (c) => c.value === opportunity,
                    )}
                    placeholder="Opportunities"
                    isClearable={true}
                  />
                </div> */}
              </div>

              {/* SEARCH INPUT */}
              <SearchInput defaultValue={query} onSearch={onSearch} />
            </div>
          </div>

          {/* TABBED NAVIGATION */}
          <div className="z-10 flex justify-center md:justify-start">
            <div className="flex w-full gap-2">
              {/* TABS */}
              <div
                className="tabs tabs-bordered w-full gap-2 overflow-x-scroll md:overflow-hidden"
                role="tablist"
              >
                <div className="border-b border-transparent text-center text-sm font-medium text-gray-dark">
                  <ul className="-mb-px flex w-full justify-center gap-8 md:justify-start">
                    <li className="whitespace-nowrap">
                      <button
                        onClick={() => onFilterStatus("")}
                        className={`inline-block w-full rounded-t-lg border-b-4 py-2 text-white duration-300 ${
                          !status
                            ? "active border-orange"
                            : "border-transparent hover:border-gray hover:text-gray"
                        }`}
                        role="tab"
                      >
                        All
                        {(totalCountAll ?? 0) > 0 && (
                          <div className="badge my-auto ml-2 bg-warning p-1 text-[12px] font-semibold text-white">
                            {totalCountAll}
                          </div>
                        )}
                      </button>
                    </li>
                    <li className="whitespace-nowrap">
                      <button
                        onClick={() => onFilterStatus("Active")}
                        className={`inline-block w-full rounded-t-lg border-b-4 py-2 text-white duration-300 ${
                          status === "Active"
                            ? "active border-orange"
                            : "border-transparent hover:border-gray hover:text-gray"
                        }`}
                        role="tab"
                      >
                        Active
                        {(totalCountActive ?? 0) > 0 && (
                          <div className="badge my-auto ml-2 bg-warning p-1 text-[12px] font-semibold text-white">
                            {totalCountActive}
                          </div>
                        )}
                      </button>
                    </li>
                    <li className="whitespace-nowrap">
                      <button
                        onClick={() => onFilterStatus("Inactive")}
                        className={`inline-block w-full rounded-t-lg border-b-4 py-2 text-white duration-300 ${
                          status === "Inactive"
                            ? "active border-orange"
                            : "border-transparent hover:border-gray hover:text-gray"
                        }`}
                        role="tab"
                      >
                        Inactive
                        {(totalCountInactive ?? 0) > 0 && (
                          <div className="badge my-auto ml-2 bg-warning p-1 text-[12px] font-semibold text-white">
                            {totalCountInactive}
                          </div>
                        )}
                      </button>
                    </li>
                    <li className="whitespace-nowrap">
                      <button
                        onClick={() => onFilterStatus("Expired")}
                        className={`inline-block w-full rounded-t-lg border-b-4 py-2 text-white duration-300 ${
                          status === "Expired"
                            ? "active border-orange"
                            : "border-transparent hover:border-gray hover:text-gray"
                        }`}
                        role="tab"
                      >
                        Expired
                        {(totalCountExpired ?? 0) > 0 && (
                          <div className="badge my-auto ml-2 bg-warning p-1 text-[12px] font-semibold text-white">
                            {totalCountExpired}
                          </div>
                        )}
                      </button>
                    </li>
                    <li className="whitespace-nowrap">
                      <button
                        onClick={() => onFilterStatus("Deleted")}
                        className={`inline-block w-full rounded-t-lg border-b-4 py-2 text-white duration-300 ${
                          status === "Deleted"
                            ? "active border-orange"
                            : "border-transparent hover:border-gray hover:text-gray"
                        }`}
                        role="tab"
                      >
                        Deleted
                        {(totalCountDeleted ?? 0) > 0 && (
                          <div className="badge my-auto ml-2 bg-warning p-1 text-[12px] font-semibold text-white">
                            {totalCountDeleted}
                          </div>
                        )}
                      </button>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* BUTTONS */}
          <div className="flex w-full flex-grow items-center justify-between gap-4 sm:justify-end">
            {currentOrganisationInactive ? (
              <span className="bg-theme flex w-56 cursor-not-allowed flex-row items-center justify-center whitespace-nowrap rounded-full p-1 text-xs text-white brightness-75">
                Add opportunity (disabled)
              </span>
            ) : (
              <Link
                href={`/organisations/${id}/opportunities/create${`?returnUrl=${encodeURIComponent(
                  getSafeUrl(returnUrl?.toString(), router.asPath),
                )}`}`}
                className="bg-theme btn btn-circle btn-secondary btn-sm h-fit w-fit whitespace-nowrap !border-none p-1 text-xs text-white shadow-custom brightness-105 md:p-2 md:px-4"
                id="btnCreateOpportunity" // e2e
              >
                <IoIosAdd className="h-7 w-7 md:h-5 md:w-5" />
                <span className="hidden md:inline">Add opportunity</span>
              </Link>
            )}
          </div>
        </div>

        {/* MAIN CONTENT */}
        {isLoadingData && (
          <div className="flex h-fit flex-col items-center rounded-lg bg-white p-8 md:pb-16">
            <LoadingSkeleton />
          </div>
        )}

        {!isLoadingData && (
          <div className="rounded-lg md:bg-white md:p-4 md:shadow-custom">
            {/* NO ROWS */}
            {opportunities && opportunities.items?.length === 0 && !query && (
              <div className="flex h-fit flex-col items-center rounded-lg bg-white pb-8 md:pb-16">
                <NoRowsMessage
                  title={"You will find your active opportunities here"}
                  description={
                    "This is where you will find all the awesome opportunities you have shared"
                  }
                />
                {currentOrganisationInactive ? (
                  <span className="btn btn-primary rounded-3xl bg-purple px-16 brightness-75">
                    Add opportunity (disabled)
                  </span>
                ) : (
                  <Link
                    href={`/organisations/${id}/opportunities/create${`?returnUrl=${encodeURIComponent(
                      getSafeUrl(returnUrl?.toString(), router.asPath),
                    )}`}`}
                    className="bg-theme btn btn-primary rounded-3xl border-0 px-16 brightness-105 hover:brightness-110"
                    id="btnCreateOpportunity" // e2e
                  >
                    <IoIosAdd className="mr-1 h-5 w-5" />
                    Add opportunity
                  </Link>
                )}
              </div>
            )}
            {opportunities && opportunities.items?.length === 0 && query && (
              <div className="flex flex-col place-items-center py-32">
                <NoRowsMessage
                  title={"No opportunities found"}
                  description={"Please try refining your search query."}
                />
              </div>
            )}

            {/* RESULTS */}
            {opportunities && opportunities.items?.length > 0 && (
              <div className="md:overflow-x-auto">
                {/* MOBIlE */}
                <div className="flex flex-col gap-4 md:hidden">
                  {opportunities.items.map((opportunity) => (
                    <div
                      key={`sm_${opportunity.id}`}
                      className="rounded-lg bg-white p-4 shadow-custom"
                    >
                      <div className="flex flex-col gap-1">
                        <Link
                          className="mb-4 line-clamp-2 font-semibold text-gray-dark"
                          href={`/organisations/${id}/opportunities/${
                            opportunity.id
                          }/info${`?returnUrl=${encodeURIComponent(
                            getSafeUrl(returnUrl?.toString(), router.asPath),
                          )}`}`}
                        >
                          {opportunity.title}
                        </Link>
                      </div>

                      <div className="flex flex-col gap-2 text-gray-dark">
                        <div className="flex justify-between">
                          <p className="text-sm tracking-wider">URL</p>
                          {opportunity.url && (
                            <button
                              onClick={() =>
                                onClick_CopyToClipboard(opportunity.url!)
                              }
                              className="badge bg-green-light text-green"
                            >
                              <IoIosLink className="h-4 w-4" />
                            </button>
                          )}
                          {opportunity.yomaReward && (
                            <span className="badge bg-orange-light text-orange">
                              <span className="ml-1 text-xs">
                                {opportunity.yomaReward} Yoma
                              </span>
                            </span>
                          )}
                        </div>

                        <div className="flex justify-between">
                          <p className="text-sm tracking-wider">ZLTO</p>
                          {opportunity.zltoReward && (
                            <span className="badge bg-orange-light text-orange">
                              <Image
                                src={iconZlto}
                                alt="Zlto icon"
                                width={16}
                                className="h-auto"
                              />
                              <span className="ml-1 text-xs">
                                {opportunity?.zltoReward}
                              </span>
                            </span>
                          )}
                          {opportunity.yomaReward && (
                            <span className="badge bg-orange-light text-orange">
                              <span className="ml-1 text-xs">
                                {opportunity.yomaReward} Yoma
                              </span>
                            </span>
                          )}
                        </div>

                        <div className="flex justify-between">
                          <p className="text-sm tracking-wider">Views</p>
                          <span className="badge bg-green-light text-green">
                            <span className="text-xs">
                              {opportunity.countViewed}
                            </span>
                          </span>
                        </div>

                        <div className="flex justify-between">
                          <p className="text-sm tracking-wider">Clicks</p>
                          <span className="badge bg-green-light text-green">
                            <span className="text-xs">
                              {opportunity.countNavigatedExternalLink}
                            </span>
                          </span>
                        </div>

                        <div className="flex justify-between">
                          <p className="text-sm tracking-wider">Completions</p>
                          <span className="badge bg-green-light text-green">
                            <span className="text-xs">
                              {opportunity.participantCountCompleted}
                            </span>
                          </span>
                        </div>

                        <div className="flex justify-between">
                          <p className="text-sm tracking-wider">Pending</p>

                          {opportunity.participantCountPending > 0 && (
                            <Link
                              href={`/organisations/${id}/verifications?opportunity=${opportunity.id}&verificationStatus=Pending`}
                              className="badge bg-orange-light text-orange"
                            >
                              <IoIosWarning className="h-4 w-4" />
                              <span className="ml-1 text-xs">
                                {opportunity.participantCountPending}
                              </span>
                            </Link>
                          )}

                          {opportunity.participantCountPending == 0 && (
                            <span className="badge bg-green-light text-green">
                              <span className="text-xs">
                                {opportunity.participantCountPending}
                              </span>
                            </span>
                          )}
                        </div>

                        <div className="flex justify-between">
                          <p className="text-sm tracking-wider">Status</p>
                          <div className="flex justify-start gap-2">
                            <OpportunityStatus
                              status={opportunity?.status?.toString()}
                            />
                            {opportunity?.hidden && (
                              <div className="badge bg-red-400 text-red-800">
                                <IoMdEyeOff />
                                <span className="ml-1 text-xs">Hidden</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* DEKSTOP */}
                <table className="hidden border-separate rounded-lg border-x-2 border-t-2 border-gray-light md:table">
                  <thead>
                    <tr className="border-gray text-gray-dark">
                      <th className="border-b-2 border-gray-light !py-4">
                        Title
                      </th>
                      <th className="border-b-2 border-gray-light text-center">
                        Url
                      </th>
                      <th className="border-b-2 border-gray-light text-center">
                        ZLTO
                      </th>
                      <th className="border-b-2 border-gray-light text-center">
                        Views
                      </th>
                      <th className="border-b-2 border-gray-light text-center">
                        Clicks
                      </th>
                      <th className="border-b-2 border-gray-light text-center">
                        Completions
                      </th>
                      <th className="border-b-2 border-gray-light text-center">
                        Pending
                      </th>
                      <th className="border-b-2 border-gray-light text-start">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {opportunities.items.map((opportunity) => (
                      <tr key={`md_${opportunity.id}`}>
                        <td className="truncate border-b-2 border-gray-light md:max-w-[240px] lg:max-w-[550px]">
                          <Link
                            href={`/organisations/${id}/opportunities/${
                              opportunity.id
                            }/info${`?returnUrl=${encodeURIComponent(
                              getSafeUrl(returnUrl?.toString(), router.asPath),
                            )}`}`}
                          >
                            {opportunity.title}
                          </Link>
                        </td>
                        <td className="border-b-2 border-gray-light text-center">
                          {opportunity?.url && (
                            <button
                              onClick={() =>
                                onClick_CopyToClipboard(opportunity.url!)
                              }
                              className="badge bg-green-light text-green"
                            >
                              <IoIosLink className="h-4 w-4" />
                            </button>
                          )}
                        </td>
                        <td className="w-28 border-b-2 border-gray-light text-center">
                          <div className="flex flex-col">
                            {opportunity.zltoReward && (
                              <span className="badge bg-orange-light px-4 text-orange">
                                <Image
                                  src={iconZlto}
                                  alt="Zlto icon"
                                  width={16}
                                  className="h-auto"
                                />
                                <span className="ml-1 text-xs">
                                  {opportunity?.zltoReward}
                                </span>
                              </span>
                            )}
                            {opportunity.yomaReward && (
                              <span className="badge bg-orange-light px-4 text-orange">
                                <span className="ml-1 text-xs">
                                  {opportunity.yomaReward} Yoma
                                </span>
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="border-b-2 border-gray-light text-center">
                          <span className="badge bg-green-light text-green">
                            <span className="text-xs">
                              {opportunity.countViewed}
                            </span>
                          </span>
                        </td>
                        <td className="border-b-2 border-gray-light text-center">
                          <span className="badge bg-green-light text-green">
                            <span className="text-xs">
                              {opportunity.countNavigatedExternalLink}
                            </span>
                          </span>
                        </td>
                        <td className="border-b-2 border-gray-light text-center">
                          <span className="badge bg-green-light text-green">
                            <span className="text-xs">
                              {opportunity.participantCountCompleted}
                            </span>
                          </span>
                        </td>
                        <td className="border-b-2 border-gray-light text-center">
                          {opportunity.participantCountPending > 0 && (
                            <Link
                              href={`/organisations/${id}/verifications?opportunity=${opportunity.id}&verificationStatus=Pending`}
                              className="badge bg-orange-light text-orange"
                            >
                              <IoIosWarning className="h-4 w-4" />
                              <span className="ml-1 text-xs">
                                {opportunity.participantCountPending}
                              </span>
                            </Link>
                          )}
                        </td>
                        <td className="flex gap-2 border-b-2 border-gray-light text-center">
                          <OpportunityStatus
                            status={opportunity?.status?.toString()}
                          />

                          {opportunity?.hidden && (
                            <div className="badge bg-red-400 text-red-800">
                              <IoMdEyeOff />
                              <span className="ml-1 text-xs">Hidden</span>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="mt-2 grid place-items-center justify-center">
              {/* PAGINATION */}
              <PaginationButtons
                currentPage={page ? parseInt(page) : 1}
                totalItems={opportunities?.totalCount ?? 0}
                pageSize={PAGE_SIZE}
                onClick={handlePagerChange}
                showPages={false}
                showInfo={true}
              />
            </div>
          </div>
        )}
      </div>
    </>
  );
};

Opportunities.getLayout = function getLayout(page: ReactElement) {
  return <MainLayout>{page}</MainLayout>;
};

// 👇 return theme from component properties. this is set server-side (getServerSideProps)
Opportunities.theme = function getTheme(page: ReactElement<{ theme: string }>) {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return page.props.theme;
};

export default Opportunities;
