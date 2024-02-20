import { QueryClient, dehydrate, useQuery } from "@tanstack/react-query";
import { type GetServerSidePropsContext } from "next";
import { getServerSession } from "next-auth";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import React, { type ReactElement, useCallback } from "react";
import { IoMdPhotos } from "react-icons/io";
import { Status } from "~/api/models/organisation";
import MainLayout from "~/components/Layout/Main";
import NoRowsMessage from "~/components/NoRowsMessage";
import { SearchInput } from "~/components/SearchInput";
import { Unauthorized } from "~/components/Status/Unauthorized";
import {
  PAGE_SIZE,
  ROLE_ADMIN,
  ROLE_ORG_ADMIN,
  THEME_BLUE,
  THEME_GREEN,
} from "~/lib/constants";
import { type NextPageWithLayout } from "~/pages/_app";
import { type User, authOptions } from "~/server/auth";
import { config } from "~/lib/react-query-config";
import { getOpportunitiesAdmin } from "~/api/services/opportunities";
import type {
  OpportunityInfo,
  OpportunitySearchResults,
} from "~/api/models/opportunity";
import { PageBackground } from "~/components/PageBackground";
import { PaginationButtons } from "~/components/PaginationButtons";

// ⚠️ SSR
export async function getServerSideProps(context: GetServerSidePropsContext) {
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
  let theme;

  if (session?.user?.roles.includes(ROLE_ADMIN)) {
    theme = THEME_BLUE;
  } else if (session?.user?.roles.includes(ROLE_ORG_ADMIN)) {
    theme = THEME_GREEN;
  } else {
    return {
      props: {
        error: "Unauthorized",
      },
    };
  }

  const { query, page } = context.query;
  const queryClient = new QueryClient(config);

  // 👇 prefetch queries on server
  await Promise.all([
    await queryClient.prefetchQuery({
      queryKey: ["OpportunitiesAdmin", query ?? "", page ?? ""],
      queryFn: () =>
        getOpportunitiesAdmin(
          {
            pageNumber: page ? parseInt(page.toString()) : 1,
            pageSize: 20,
            categories: [],
            commitmentIntervals: [],
            countries: [],
            endDate: null,
            languages: [],
            organizations: [],
            startDate: null,
            statuses: [Status.Active],
            types: [],
            valueContains: query?.toString() ?? null,
            zltoRewardRanges: [],
          },
          context,
        ),
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
    },
  };
}

export const OpportunityCardComponent: React.FC<{
  key: string;
  item: OpportunityInfo;
  user: User;
}> = (props) => {
  const link = props.user.roles.includes(ROLE_ADMIN)
    ? props.item.status === "Active"
      ? `/organisations/${props.item.id}/info`
      : `/organisations/${props.item.id}/verify`
    : props.item.status === "Active"
      ? `/organisations/${props.item.id}`
      : `/organisations/${props.item.id}/edit`;

  return (
    <Link href={link} id={`lnkOrganisation_${props.item.title}`}>
      <div
        key={`$orgCard_{props.key}`}
        className="flex flex-col rounded-xl bg-white shadow-custom transition hover:scale-[1.01] dark:bg-neutral-700 md:max-w-xl md:flex-row"
      >
        <div className="flex w-1/4 items-center justify-center p-2">
          {!props.item.organizationLogoURL && (
            <div className="flex h-28 w-28 items-center justify-center rounded-lg shadow-custom">
              <IoMdPhotos className="h-16 w-16 text-gray-light" />
            </div>
          )}

          {props.item.organizationLogoURL && (
            <Image
              src={props.item.organizationLogoURL}
              alt={props.item.title}
              width={80}
              height={80}
              className="h-28 w-28 rounded-xl object-cover p-4 shadow-custom"
            />
          )}
        </div>

        <div className="relative flex w-3/4 flex-col justify-start p-2 pr-4">
          <h5
            className={`my-1 truncate overflow-ellipsis whitespace-nowrap font-medium ${
              props.item.status === "Inactive" ? "pr-20" : ""
            }`}
          >
            {props.item.title}
          </h5>
          <p className="truncate overflow-ellipsis whitespace-nowrap text-sm">
            {props.item.dateStart}
          </p>
          {props.item.status && props.item.status === "Inactive" && (
            <span className="badge absolute right-4 top-4 border-none bg-yellow-light text-xs font-bold text-yellow">
              Pending
            </span>
          )}
        </div>
      </div>
    </Link>
  );
};

const OpportunitiesAdmin: NextPageWithLayout<{
  error: string;
  user: User;
  theme: string;
}> = ({ error }) => {
  const router = useRouter();

  // get query parameter from route
  const { query, page } = router.query;

  // 👇 use prefetched queries from server
  const { data: opportunities } = useQuery<OpportunitySearchResults>({
    queryKey: ["OpportunitiesAdmin", query ?? "", page ?? ""],
    queryFn: () =>
      getOpportunitiesAdmin({
        pageNumber: page ? parseInt(page.toString()) : 1,
        pageSize: 20,
        categories: [],
        commitmentIntervals: [],
        countries: [],
        endDate: null,
        languages: [],
        organizations: [],
        startDate: null,
        statuses: [Status.Active],
        types: [],
        valueContains: query?.toString() ?? null,
        zltoRewardRanges: [],
      }),
    enabled: !error,
  });

  const onSearch = useCallback(
    (query: string) => {
      if (query && query.length > 2) {
        // uri encode the search value
        const searchValueEncoded = encodeURIComponent(query);

        // redirect to the search page
        void router.push(`/opportunities?query=${searchValueEncoded}`);
      } else {
        // redirect to the search page
        void router.push("/opportunities");
      }
    },
    [router],
  );

  // 🔔 pager change event
  const handlePagerChange = useCallback(
    (value: number) => {
      // redirect
      void router.push({
        pathname: `/admin/opportunities`,
        query: { query: query, page: value },
      });

      // reset scroll position
      window.scrollTo(0, 0);
    },
    [query, router],
  );

  if (error) return <Unauthorized />;

  return (
    <>
      <Head>
        <title>Yoma | Admin Opportunities</title>
      </Head>

      <PageBackground />

      <div className="container z-10 mt-20 max-w-5xl px-2 py-8">
        <div className="flex flex-col gap-2 py-4 sm:flex-row">
          <h3 className="flex flex-grow items-center text-white">
            Opportunities
          </h3>

          <div className="flex gap-2 sm:justify-end">
            <SearchInput
              className={
                "bg-theme hover:bg-theme brightness-105 hover:brightness-110"
              }
              defaultValue={query?.toString()}
              onSearch={onSearch}
            />

            {/* {currentOrganisationInactive ? (
              <span className="flex w-56 cursor-not-allowed flex-row items-center justify-center whitespace-nowrap rounded-full bg-gray-dark p-1 text-xs text-white">
                Add opportunity (disabled)
              </span>
            ) : (
              <Link
                href={`/organisations/${id}/opportunities/create`}
                className="flex w-40 flex-row items-center justify-center whitespace-nowrap rounded-full bg-green-dark p-1 text-xs text-white"
                id="btnCreateOpportunity" // e2e
              >
                <IoIosAdd className="mr-1 h-5 w-5" />
                Add opportunity
              </Link>
            )} */}
          </div>
        </div>

        <div className="rounded-lg bg-white p-4">
          {/* NO ROWS */}
          {opportunities && opportunities.items?.length === 0 && !query && (
            <div className="flex flex-col place-items-center py-52">
              <NoRowsMessage
                title={"You will find your active opportunities here"}
                description={
                  "This is where you will find all the awesome opportunities that have been created"
                }
              />
              {/* <Link href={`/organisations/${id}/opportunities/create`}>
                <button className="btn btn-primary btn-sm mt-10 rounded-3xl px-16">
                  Add opportunity
                </button>
              </Link> */}
            </div>
          )}
          {opportunities && opportunities.items?.length === 0 && query && (
            <div className="flex flex-col place-items-center py-52">
              <NoRowsMessage
                title={"No opportunities found"}
                description={"Please try refining your search query."}
              />
            </div>
          )}
          {/* GRID */}
          {opportunities && opportunities.items?.length > 0 && (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr className="border-gray text-gray-dark">
                    <th>Opportunity title</th>
                    <th>Reward</th>
                    <th>Url</th>
                    <th>Participants</th>
                  </tr>
                </thead>
                <tbody>
                  {opportunities.items.map((opportunity) => (
                    <tr key={opportunity.id} className="border-gray">
                      <td>
                        <Link
                          href={`/organisations/${opportunity.organizationId}/opportunities/${opportunity.id}/info?returnUrl=/admin/opportunities`}
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="mt-2 grid place-items-center justify-center">
            {/* PAGINATION */}
            <PaginationButtons
              currentPage={page ? parseInt(page.toString()) : 1}
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

OpportunitiesAdmin.getLayout = function getLayout(page: ReactElement) {
  return <MainLayout>{page}</MainLayout>;
};

// 👇 return theme from component properties. this is set server-side (getServerSideProps)
OpportunitiesAdmin.theme = function getTheme(page: ReactElement) {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return page.props.theme;
};

export default OpportunitiesAdmin;
