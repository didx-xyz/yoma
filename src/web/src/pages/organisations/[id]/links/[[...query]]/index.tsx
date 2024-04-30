import { QueryClient, dehydrate, useQuery } from "@tanstack/react-query";
import { type GetServerSidePropsContext } from "next";
import { getServerSession } from "next-auth";
import Head from "next/head";
import { useRouter } from "next/router";
import { useCallback, type ReactElement } from "react";
import MainLayout from "~/components/Layout/Main";
import { authOptions } from "~/server/auth";
import { type NextPageWithLayout } from "~/pages/_app";
import { type ParsedUrlQuery } from "querystring";
import Link from "next/link";
import { PageBackground } from "~/components/PageBackground";
import { IoIosAdd, IoMdPerson, IoIosLink } from "react-icons/io";
import NoRowsMessage from "~/components/NoRowsMessage";
import { PAGE_SIZE } from "~/lib/constants";
import { PaginationButtons } from "~/components/PaginationButtons";
import { Unauthorized } from "~/components/Status/Unauthorized";
import { config } from "~/lib/react-query-config";
import { currentOrganisationInactiveAtom } from "~/lib/store";
import { useAtomValue } from "jotai";
import LimitedFunctionalityBadge from "~/components/Status/LimitedFunctionalityBadge";
import { getSafeUrl, getThemeFromRole } from "~/lib/utils";
import axios from "axios";
import { InternalServerError } from "~/components/Status/InternalServerError";
import { Unauthenticated } from "~/components/Status/Unauthenticated";
import { searchLinks } from "~/api/services/actionLinks";
import {
  LinkAction,
  LinkEntityType,
  LinkSearchResult,
  LinkStatus,
} from "~/api/models/actionLinks";

interface IParams extends ParsedUrlQuery {
  id: string;
  type?: string;
  action?: string;
  status?: string;
  entities?: string;
  page?: string;
}

// ⚠️ SSR
export async function getServerSideProps(context: GetServerSidePropsContext) {
  const { id } = context.params as IParams;
  const { type, action, status, entities, page, returnUrl } = context.query;
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

  /*export interface LinkSearchFilter extends PaginationFilter {
  entityType: LinkEntityType;
  action: LinkAction | null;
  statuses: LinkStatus[] | null;
  entities: string[] | null;
  organizations: string[] | null;
}*/

  try {
    // 👇 prefetch queries on server
    const data = await searchLinks(
      {
        entityType: type?.toString() ?? LinkEntityType.Opportunity,
        action: action?.toString() ?? LinkAction.Verify,
        entities: entities ? entities.toString().split(",") : null,
        organizations: [id],
        pageNumber: page ? parseInt(page.toString()) : 1,
        pageSize: PAGE_SIZE,
        statuses:
          status === "active"
            ? [LinkStatus.Active]
            : status === "inactive"
              ? [LinkStatus.Inactive]
              : status === "expired"
                ? [LinkStatus.Expired]
                : status === "limitReached"
                  ? [LinkStatus.LimitReached]
                  : null,
      },
      context,
    );

    await queryClient.prefetchQuery({
      queryKey: [
        `Links_${id}_${type?.toString()}_${action?.toString()}_${status?.toString()}_${entities?.toString()}_${page?.toString()}`,
      ],
      queryFn: () => data,
    });
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
      id: id,
      type: type ?? null,
      action: action ?? null,
      status: status ?? null,
      entities: entities ?? null,
      page: page ?? null,
      theme: theme,
      error: errorCode,
      returnUrl: returnUrl ?? null,
    },
  };
}

const Links: NextPageWithLayout<{
  id: string;
  type?: string;
  action?: string;
  status?: string;
  entities?: string;
  page?: string;
  theme: string;
  error?: number;
  returnUrl?: string;
}> = ({ id, type, action, status, entities, page, error, returnUrl }) => {
  const router = useRouter();
  const currentOrganisationInactive = useAtomValue(
    currentOrganisationInactiveAtom,
  );

  // 👇 use prefetched queries from server
  const { data: links } = useQuery<LinkSearchResult>({
    queryKey: [
      `Links_${id}_${type?.toString()}_${action?.toString()}_${status?.toString()}_${entities?.toString()}_${page?.toString()}`,
    ],
    queryFn: () =>
      searchLinks({
        entityType: type?.toString() ?? LinkEntityType.Opportunity,
        action: action?.toString() ?? LinkAction.Verify,
        entities: entities ? entities.toString().split(",") : null,
        organizations: [id],
        pageNumber: page ? parseInt(page.toString()) : 1,
        pageSize: PAGE_SIZE,
        statuses:
          status === "active"
            ? [LinkStatus.Active]
            : status === "inactive"
              ? [LinkStatus.Inactive]
              : status === "expired"
                ? [LinkStatus.Expired]
                : status === "limitReached"
                  ? [LinkStatus.LimitReached]
                  : null,
      }),
    enabled: !error,
  });

  // const onSearch = useCallback(
  //   (query: string) => {
  //     void router.push({
  //       pathname: `/organisations/${id}/links`,
  //       query: {
  //         query:
  //           query && query.length > 2 ? encodeURIComponent(query) : undefined,
  //         status: status,
  //       },
  //     });
  //   },
  //   [router, id, status],
  // );

  // 🔔 pager change event
  const handlePagerChange = useCallback(
    (value: number) => {
      // redirect
      void router.push({
        pathname: `/organisations/${id}/links`,
        query: {
          type: type,
          action: action,
          status: status,
          entities: entities,
          page: value,
        },
      });

      // reset scroll position
      window.scrollTo(0, 0);
    },
    [id, type, action, status, page, router],
  );

  if (error) {
    if (error === 401) return <Unauthenticated />;
    else if (error === 403) return <Unauthorized />;
    else return <InternalServerError />;
  }

  return (
    <>
      <Head>
        <title>Yoma | Links</title>
      </Head>
      <PageBackground className="h-[14.5rem] md:h-[18rem]" />

      <div className="container z-10 mt-14 max-w-7xl px-2 py-8 md:mt-[7rem]">
        <div className="flex flex-col gap-4 py-4">
          <h3 className="mb-6 mt-3 flex items-center text-3xl font-semibold tracking-normal text-white md:mb-9 md:mt-0">
            Links <LimitedFunctionalityBadge />
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
                        href={`/organisations/${id}/links`}
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
                        href={`/organisations/${id}/links?status=active`}
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
                        href={`/organisations/${id}/links?status=inactive`}
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
                        href={`/organisations/${id}/links?status=expired`}
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
                    <li className="w-1/5 md:w-24">
                      <Link
                        href={`/organisations/${id}/links?status=limitReached`}
                        className={`inline-block w-full rounded-t-lg border-b-4 py-2 text-white duration-300 ${
                          status === "limitReached"
                            ? "active border-orange"
                            : "border-transparent hover:border-gray hover:text-gray"
                        }`}
                        role="tab"
                      >
                        Limit Reached
                      </Link>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* SEARCH INPUT */}
          <div className="flex w-full flex-grow items-center justify-between gap-4 sm:justify-end">
            {/* <SearchInput defaultValue={query} onSearch={onSearch} /> */}

            {/* TODO: opportunities filter */}

            {currentOrganisationInactive ? (
              <span className="bg-theme flex w-56 cursor-not-allowed flex-row items-center justify-center whitespace-nowrap rounded-full p-1 text-xs text-white brightness-75">
                Add link (disabled)
              </span>
            ) : (
              <Link
                href={`/organisations/${id}/links/create${`?returnUrl=${encodeURIComponent(
                  getSafeUrl(returnUrl?.toString(), router.asPath),
                )}`}`}
                className="bg-theme btn btn-circle btn-secondary btn-sm h-fit w-fit whitespace-nowrap !border-none p-1 text-xs text-white shadow-custom brightness-105 md:p-2 md:px-4"
                id="btnCreateLink"
              >
                <IoIosAdd className="h-7 w-7 md:h-5 md:w-5" />
                <span className="hidden md:inline">Add link</span>
              </Link>
            )}
          </div>
        </div>

        <div className="rounded-lg md:bg-white md:p-4 md:shadow-custom">
          {/* NO ROWS */}
          {links && links.items?.length === 0 && !entities && (
            <div className="flex h-fit flex-col items-center rounded-lg bg-white pb-8 md:pb-16">
              <NoRowsMessage
                title={"Welcome to Links!"}
                description={
                  "Create a link to auto-verify participants for your opportunities!<br>When the link is clicked, Youth will enter Yoma to claim their opportunity.<br/>The link needs limits on usage and an expiry date.<br/>Create a QR code from your link, and let youth scan to complete."
                }
              />
              {currentOrganisationInactive ? (
                <span className="btn btn-primary rounded-3xl bg-purple px-16 brightness-75">
                  Add link (disabled)
                </span>
              ) : (
                <Link
                  href={`/organisations/${id}/links/create${`?returnUrl=${encodeURIComponent(
                    getSafeUrl(returnUrl?.toString(), router.asPath),
                  )}`}`}
                  className="bg-theme btn btn-primary rounded-3xl border-0 px-16 brightness-105 hover:brightness-110"
                  id="btnCreateLink"
                >
                  <IoIosAdd className="mr-1 h-5 w-5" />
                  Add link
                </Link>
              )}
            </div>
          )}

          {links && links.items?.length === 0 && entities && (
            <div className="flex flex-col place-items-center py-32">
              <NoRowsMessage
                title={"No links found"}
                description={"Please try refining your search query."}
              />
            </div>
          )}

          {/* GRID */}
          {/* {opportunities && opportunities.items?.length > 0 && (
            <div className="md:overflow-x-auto"> */}
          {/* MOBIlE */}
          {/* <div className="flex flex-col gap-4 md:hidden">
                {opportunities.items.map((opportunity) => (
                  <Link
                    key={opportunity.id}
                    className="rounded-lg bg-white p-4 shadow-custom"
                    href={`/organisations/${id}/opportunities/${
                      opportunity.id
                    }/info${`?returnUrl=${encodeURIComponent(
                      getSafeUrl(returnUrl?.toString(), router.asPath),
                    )}`}`}
                  >
                    <div className="flex flex-col gap-1">
                      <span className="mb-4 line-clamp-2 font-semibold text-gray-dark">
                        {opportunity.title}
                      </span>
                    </div>

                    <div className="flex flex-col gap-2 text-gray-dark">
                      <div className="flex justify-between">
                        <p className="text-sm tracking-wider">Reward</p>
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
                      </div>

                      <div className="flex justify-between">
                        <p className="text-sm tracking-wider">Participants</p>
                        <span className="badge bg-green-light text-green">
                          <IoMdPerson className="h-4 w-4" />
                          <span className="ml-1 text-xs">
                            {opportunity.participantCountTotal}
                          </span>
                        </span>
                      </div>

                      <div className="flex justify-between">
                        <p className="text-sm tracking-wider">Status</p>
                        {opportunity.status == "Active" && (
                          <>
                            <span className="badge bg-blue-light text-blue">
                              Active
                            </span>
                          </>
                        )}
                        {opportunity?.status == "Expired" && (
                          <span className="badge bg-green-light text-yellow ">
                            Expired
                          </span>
                        )}
                        {opportunity?.status == "Inactive" && (
                          <span className="badge bg-yellow-tint text-yellow ">
                            Inactive
                          </span>
                        )}
                        {opportunity?.status == "Deleted" && (
                          <span className="badge bg-green-light  text-red-400">
                            Deleted
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div> */}

          {/* DEKSTOP */}
          {/* <table className="hidden border-separate rounded-lg border-x-2 border-t-2 border-gray-light md:table">
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
                          href={`/organisations/${id}/opportunities/${
                            opportunity.id
                          }/info${`?returnUrl=${encodeURIComponent(
                            getSafeUrl(returnUrl?.toString(), router.asPath),
                          )}`}`}
                        >
                          {opportunity.title}
                        </Link>
                      </td>
                      <td className="w-28 border-b-2 border-gray-light">
                        <div className="flex flex-col">
                          {opportunity.zltoReward && (
                            <span className="badge bg-orange-light px-4 text-orange">
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
                            <span className="badge bg-orange-light px-4 text-orange">
                              <span className="ml-1 text-xs">
                                {opportunity.yomaReward} Yoma
                              </span>
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="border-b-2 border-gray-light">
                        {opportunity?.url && (
                          <Link
                            href={opportunity.url}
                            className="badge bg-green-light text-green"
                            target="_blank"
                          >
                            <IoIosLink className="h-4 w-4" />
                            <span className="ml-1 text-xs">
                              {opportunity.url}
                            </span>
                          </Link>
                        )}
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
              </table> */}
          {/* </div>
          )} */}

          <div className="mt-2 grid place-items-center justify-center">
            {/* PAGINATION */}
            {/* <PaginationButtons
              currentPage={page ? parseInt(page) : 1}
              totalItems={opportunities?.totalCount ?? 0}
              pageSize={PAGE_SIZE}
              onClick={handlePagerChange}
              showPages={false}
              showInfo={true}
            /> */}
          </div>
        </div>
      </div>
    </>
  );
};

Links.getLayout = function getLayout(page: ReactElement) {
  return <MainLayout>{page}</MainLayout>;
};

// 👇 return theme from component properties. this is set server-side (getServerSideProps)
Links.theme = function getTheme(page: ReactElement) {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return page.props.theme;
};

export default Links;
