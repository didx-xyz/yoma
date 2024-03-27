import { QueryClient, dehydrate, useQuery } from "@tanstack/react-query";
import { type GetServerSidePropsContext } from "next";
import { getServerSession } from "next-auth";
import Head from "next/head";
import { useRouter } from "next/router";
import { useCallback, type ReactElement } from "react";
import { getOpportunitiesAdmin } from "~/api/services/opportunities";
import MainLayout from "~/components/Layout/Main";
import { authOptions } from "~/server/auth";
import {
  Status,
  type OpportunitySearchResults,
} from "~/api/models/opportunity";
import { type NextPageWithLayout } from "~/pages/_app";
import { type ParsedUrlQuery } from "querystring";
import Link from "next/link";
import { PageBackground } from "~/components/PageBackground";
import { IoIosAdd, IoMdPerson, IoIosLink } from "react-icons/io";
import { SearchInput } from "~/components/SearchInput";
import NoRowsMessage from "~/components/NoRowsMessage";
import { PAGE_SIZE } from "~/lib/constants";
import { PaginationButtons } from "~/components/PaginationButtons";
import { Unauthorized } from "~/components/Status/Unauthorized";
import { config } from "~/lib/react-query-config";
import { currentOrganisationInactiveAtom } from "~/lib/store";
import { useAtomValue } from "jotai";
import LimitedFunctionalityBadge from "~/components/Status/LimitedFunctionalityBadge";
import { getThemeFromRole } from "~/lib/utils";
import axios from "axios";
import { InternalServerError } from "~/components/Status/InternalServerError";
import { Unauthenticated } from "~/components/Status/Unauthenticated";
import iconZlto from "public/images/icon-zlto.svg";
import Image from "next/image";

interface IParams extends ParsedUrlQuery {
  id: string;
  query?: string;
  page?: string;
  status?: string;
}

// ⚠️ SSR
export async function getServerSideProps(context: GetServerSidePropsContext) {
  const { id } = context.params as IParams;
  const { query, page, status } = context.query;
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
        commitmentIntervals: null,
        zltoRewardRanges: null,
      },
      context,
    );

    await queryClient.prefetchQuery({
      queryKey: [
        `OpportunitiesActive_${id}_${query?.toString()}_${page?.toString()}_${status?.toString()}`,
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
}> = ({ id, query, page, status, error }) => {
  const router = useRouter();
  const currentOrganisationInactive = useAtomValue(
    currentOrganisationInactiveAtom,
  );

  // 👇 use prefetched queries from server
  const { data: opportunities } = useQuery<OpportunitySearchResults>({
    queryKey: [
      `OpportunitiesActive_${id}_${query?.toString()}_${page?.toString()}_${status?.toString()}`,
    ],
    queryFn: () =>
      getOpportunitiesAdmin({
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
        commitmentIntervals: null,
        zltoRewardRanges: null,
      }),
    enabled: !error,
  });

  const onSearch = useCallback(
    (query: string) => {
      if (query && query.length > 2) {
        // uri encode the search value
        const queryEncoded = encodeURIComponent(query);

        // redirect to the search page
        void router.push(
          `/organisations/${id}/opportunities?query=${queryEncoded}${
            status ? `&status=${status}` : ""
          }`,
        );
      } else {
        void router.push(
          `/organisations/${id}/opportunities${
            status ? `?status=${status}` : ""
          }`,
        );
      }
    },
    [router, id, status],
  );

  // 🔔 pager change event
  const handlePagerChange = useCallback(
    (value: number) => {
      // redirect
      void router.push({
        pathname: `/organisations/${id}/opportunities`,
        query: { query: query, page: value, status: status },
      });

      // reset scroll position
      window.scrollTo(0, 0);
    },
    [query, id, router, status],
  );

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
      <PageBackground className="h-[14.5rem] md:h-[18rem]" />

      <div className="container z-10 mt-14 max-w-7xl px-2 py-8 md:mt-[7rem]">
        <div className="flex flex-col gap-4 py-4">
          <h3 className="mb-6 mt-3 flex items-center text-3xl font-semibold tracking-normal text-white md:mb-9 md:mt-0">
            Opportunities <LimitedFunctionalityBadge />
          </h3>

          {/* TABBED NAVIGATION */}
          <div className="z-10 flex justify-center md:justify-start">
            <div className="flex w-full gap-2">
              {/* TABS */}
              <div
                className="tabs tabs-bordered w-full gap-2 overflow-x-scroll md:overflow-hidden"
                role="tablist"
              >
                <div className="border-b border-transparent text-center text-sm font-medium text-gray-dark">
                  <ul className="overflow-x-hiddem -mb-px flex w-full justify-center gap-0 md:justify-start">
                    <li className="w-1/5 md:w-20">
                      <Link
                        href={`/organisations/${id}/opportunities`}
                        className={`inline-block w-full rounded-t-lg border-b-4 py-2 text-white duration-300 ${
                          !status
                            ? "active border-orange"
                            : "border-transparent hover:border-gray hover:text-gray"
                        }`}
                        role="tab"
                      >
                        All
                      </Link>
                    </li>
                    <li className="w-1/5 md:w-20">
                      <Link
                        href={`/organisations/${id}/opportunities?status=active`}
                        className={`inline-block w-full rounded-t-lg border-b-4 py-2 text-white duration-300 ${
                          status === "active"
                            ? "active border-orange"
                            : "border-transparent hover:border-gray hover:text-gray"
                        }`}
                        role="tab"
                      >
                        Active
                      </Link>
                    </li>
                    <li className="w-1/5 md:w-20">
                      <Link
                        href={`/organisations/${id}/opportunities?status=inactive`}
                        className={`inline-block w-full rounded-t-lg border-b-4 py-2 text-white duration-300 ${
                          status === "inactive"
                            ? "active border-orange"
                            : "border-transparent hover:border-gray hover:text-gray"
                        }`}
                        role="tab"
                      >
                        Inactive
                      </Link>
                    </li>
                    <li className="w-1/5 md:w-20">
                      <Link
                        href={`/organisations/${id}/opportunities?status=expired`}
                        className={`inline-block w-full rounded-t-lg border-b-4 py-2 text-white duration-300 ${
                          status === "expired"
                            ? "active border-orange"
                            : "border-transparent hover:border-gray hover:text-gray"
                        }`}
                        role="tab"
                      >
                        Expired
                      </Link>
                    </li>
                    <li className="w-1/5 md:w-20">
                      <Link
                        href={`/organisations/${id}/opportunities?status=deleted`}
                        className={`inline-block w-full rounded-t-lg border-b-4 py-2 text-white duration-300 ${
                          status === "deleted"
                            ? "active border-orange"
                            : "border-transparent hover:border-gray hover:text-gray"
                        }`}
                        role="tab"
                      >
                        Deleted
                      </Link>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* SEARCH INPUT */}
          <div className="flex w-full flex-grow items-center justify-between gap-4 sm:justify-end">
            <SearchInput defaultValue={query} onSearch={onSearch} />

            {currentOrganisationInactive ? (
              <span className="bg-theme flex w-56 cursor-not-allowed flex-row items-center justify-center whitespace-nowrap rounded-full p-1 text-xs text-white brightness-75">
                Add opportunity (disabled)
              </span>
            ) : (
              <Link
                href={`/organisations/${id}/opportunities/create`}
                className="bg-theme btn btn-circle btn-secondary btn-sm h-fit w-fit whitespace-nowrap !border-none p-1 text-xs text-white shadow-custom brightness-105 md:p-2 md:px-4"
                id="btnCreateOpportunity" // e2e
              >
                <IoIosAdd className="h-7 w-7 md:h-5 md:w-5" />
                <span className="hidden md:inline">Add opportunity</span>
              </Link>
            )}
          </div>
        </div>

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
                  href={`/organisations/${id}/opportunities/create`}
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

          {/* GRID */}
          {opportunities && opportunities.items?.length > 0 && (
            <div className="md:overflow-x-auto">
              {/* MOBIlE */}
              <div className="flex flex-col gap-4 md:hidden">
                {opportunities.items.map((opportunity) => (
                  <Link
                    href={`/organisations/${id}/opportunities/${opportunity.id}/info`}
                    className="rounded-lg bg-white p-2 shadow-custom"
                    key={opportunity.id}
                  >
                    <div className="flex flex-col py-4">
                      <div className="flex flex-col gap-2">
                        <div className="flex flex-col gap-1">
                          <span className="text-xs font-semibold text-gray-dark">
                            Opportunity title
                          </span>
                          <span className="line-clamp-2 text-gray-dark">
                            {opportunity.title}
                          </span>
                        </div>

                        {/* BADGES */}
                        <div className="flex flex-wrap gap-2">
                          {opportunity.zltoReward && (
                            <span className="badge bg-orange-light text-orange">
                              <Image
                                src={iconZlto}
                                alt="Zlto icon"
                                width={16}
                                height={16}
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

                          <span className="badge bg-blue-light text-blue">
                            <IoMdPerson className="h-4 w-4" />
                            <span className="ml-1 text-xs">
                              {opportunity.participantCountTotal}
                            </span>
                          </span>
                          <span
                            // href={opportunity?.url ?? ""}
                            className="badge bg-green-light text-green"
                          >
                            <IoIosLink className="h-4 w-4" />
                            <span className="ml-1 text-xs">
                              {opportunity?.url}
                            </span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              {/* DEKSTOP */}
              <table className="hidden border-separate rounded-lg border-x-2 border-t-2 border-gray-light md:table">
                <thead>
                  <tr className="border-gray text-gray-dark">
                    <th className="border-b-2 border-gray-light !py-4">
                      Opportunity title
                    </th>
                    <th className="border-b-2 border-gray-light">Reward</th>
                    <th className="border-b-2 border-gray-light">Url</th>
                    <th className="border-b-2 border-gray-light">
                      Participants
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {opportunities.items.map((opportunity) => (
                    <tr key={opportunity.id} className="">
                      <td className="max-w-[600px] truncate border-b-2 border-gray-light !py-4">
                        <Link
                          href={`/organisations/${id}/opportunities/${opportunity.id}/info`}
                        >
                          {opportunity.title}
                        </Link>
                      </td>
                      <td className="w-28 border-b-2 border-gray-light">
                        <div className="flex flex-col">
                          {opportunity.zltoReward && (
                            <span className="badge bg-orange-light text-orange">
                              <Image
                                src={iconZlto}
                                alt="Zlto icon"
                                width={16}
                                height={16}
                              />
                              <span className="ml-1 text-xs">
                                {opportunity?.zltoReward}
                              </span>
                            </span>
                          )}
                          {opportunity.yomaReward && (
                            <span className="text-xs">
                              {opportunity.yomaReward} Yoma
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="border-b-2 border-gray-light">
                        <Link
                          href={opportunity?.url ?? ""}
                          className="badge bg-green-light text-green"
                        >
                          <IoIosLink className="h-4 w-4" />
                          <span className="ml-1 text-xs">
                            {opportunity?.url}
                          </span>
                        </Link>
                      </td>
                      <td className="border-b-2 border-gray-light">
                        <span className="badge bg-green-light text-green">
                          <IoMdPerson className="h-4 w-4" />
                          <span className="ml-1 text-xs">
                            {opportunity.participantCountTotal}
                          </span>
                        </span>
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
      </div>
    </>
  );
};

Opportunities.getLayout = function getLayout(page: ReactElement) {
  return <MainLayout>{page}</MainLayout>;
};

// 👇 return theme from component properties. this is set server-side (getServerSideProps)
Opportunities.theme = function getTheme(page: ReactElement) {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return page.props.theme;
};

export default Opportunities;
