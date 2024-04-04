import { QueryClient, dehydrate, useQuery } from "@tanstack/react-query";
import { type GetServerSidePropsContext } from "next";
import { getServerSession } from "next-auth";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import React, {
  type ReactElement,
  useCallback,
  useState,
  type ChangeEvent,
} from "react";
import { IoMdAdd } from "react-icons/io";
import {
  type OrganizationInfo,
  type OrganizationSearchResults,
  Status,
} from "~/api/models/organisation";
import { getOrganisations } from "~/api/services/organisations";
import MainLayout from "~/components/Layout/Main";
import NoRowsMessage from "~/components/NoRowsMessage";
import { SearchInput } from "~/components/SearchInput";
import { Unauthorized } from "~/components/Status/Unauthorized";
import {
  ROLE_ADMIN,
  ROLE_ORG_ADMIN,
  THEME_BLUE,
  THEME_GREEN,
} from "~/lib/constants";
import { type NextPageWithLayout } from "~/pages/_app";
import { type User, authOptions } from "~/server/auth";
import { config } from "~/lib/react-query-config";
import { AvatarImage } from "~/components/AvatarImage";
import { PageBackground } from "~/components/PageBackground";
import { Unauthenticated } from "~/components/Status/Unauthenticated";
import axios from "axios";
import { InternalServerError } from "~/components/Status/InternalServerError";

// ⚠️ SSR
export async function getServerSideProps(context: GetServerSidePropsContext) {
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
  let theme;

  if (session?.user?.roles.includes(ROLE_ADMIN)) {
    theme = THEME_BLUE;
  } else if (session?.user?.roles.includes(ROLE_ORG_ADMIN)) {
    theme = THEME_GREEN;
  } else {
    return {
      props: {
        error: 401,
      },
    };
  }

  const { query, page } = context.query;
  const queryClient = new QueryClient(config);

  // 👇 prefetch queries on server
  try {
    const organisationsActive = await getOrganisations(
      {
        pageNumber: page ? parseInt(page.toString()) : 1,
        pageSize: 20,
        valueContains: query?.toString() ?? null,
        statuses: [Status.Active],
      },
      context,
    );

    const organisationsInactive = await getOrganisations(
      {
        pageNumber: page ? parseInt(page.toString()) : 1,
        pageSize: 20,
        valueContains: query?.toString() ?? null,
        statuses: [Status.Inactive],
      },
      context,
    );

    await Promise.all([
      await queryClient.prefetchQuery({
        queryKey: [
          `OrganisationsActive_${query?.toString()}_${page?.toString()}`,
        ],
        queryFn: () => organisationsActive,
      }),
      await queryClient.prefetchQuery({
        queryKey: [
          `OrganisationsInactive_${query?.toString()}_${page?.toString()}`,
        ],
        queryFn: () => organisationsInactive,
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
      error: errorCode,
    },
  };
}

export const OrganisationCardComponent: React.FC<{
  key: string;
  item: OrganizationInfo;
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
    <Link href={link} id={`lnkOrganisation_${props.item.name}`}>
      <div
        key={`$orgCard_{props.key}`}
        className="flex flex-row rounded-xl bg-white shadow-custom transition duration-300 hover:scale-[1.01] dark:bg-neutral-700 md:max-w-7xl"
      >
        <div className="flex w-1/4 items-center justify-center p-2">
          <div className="flex h-28 w-28 items-center justify-center">
            <AvatarImage
              icon={props.item.logoURL ?? null}
              alt={props.item.name ?? null}
              size={60}
            />
          </div>
        </div>

        <div className="relative flex w-3/4 flex-col justify-start p-2 pr-4">
          <h5
            className={`my-1 truncate overflow-ellipsis whitespace-nowrap font-medium ${
              props.item.status === "Inactive" ? "pr-20" : ""
            }`}
          >
            {props.item.name}
          </h5>
          <p className="h-[40px] overflow-hidden text-ellipsis text-sm">
            {props.item.tagline}
          </p>
          {props.item.status && props.item.status === "Inactive" && (
            <span className="badge absolute bottom-4 right-4 border-none bg-yellow-light text-xs font-bold text-yellow md:top-4">
              Pending
            </span>
          )}
        </div>
      </div>
    </Link>
  );
};

const Opportunities: NextPageWithLayout<{
  user: User;
  theme: string;
  error?: number;
}> = ({ user, error }) => {
  const router = useRouter();
  const [showAll, setShowAll] = useState(true);
  const [showPending, setShowPending] = useState(false);
  const [showApproved, setShowApproved] = useState(false);

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    type TabStates = Record<string, [boolean, boolean, boolean]>;

    const tabStates: TabStates = {
      all_tab: [true, false, false],
      pending_tab: [false, true, false],
      approved_tab: [false, false, true],
    };

    const { id } = event.target;

    if (id && tabStates.hasOwnProperty(id)) {
      const tabState = tabStates[id] as [boolean, boolean, boolean];

      const [showAll, showPending, showApproved] = tabState;

      setShowAll(showAll);
      setShowPending(showPending);
      setShowApproved(showApproved);
    }
  };

  // get query parameter from route
  const { query, page } = router.query;

  // 👇 use prefetched queries from server
  const { data: organisationsActive } = useQuery<OrganizationSearchResults>({
    queryKey: [`OrganisationsActive_${query?.toString()}_${page?.toString()}`],
    queryFn: () =>
      getOrganisations({
        pageNumber: page ? parseInt(page.toString()) : 1,
        pageSize: 20,
        valueContains: query?.toString() ?? "",
        statuses: [Status.Active],
      }),
    enabled: !error,
  });
  const { data: organisationsInactive } = useQuery<OrganizationSearchResults>({
    queryKey: [
      `OrganisationsInactive_${query?.toString()}_${page?.toString()}`,
    ],
    queryFn: () =>
      getOrganisations({
        pageNumber: page ? parseInt(page.toString()) : 1,
        pageSize: 20,
        valueContains: query?.toString() ?? "",
        statuses: [Status.Inactive],
      }),
    enabled: !error,
  });

  const organisationsAll = [
    ...(organisationsActive?.items ?? []),
    ...(organisationsInactive?.items ?? []),
  ];

  const onSearch = useCallback(
    (query: string) => {
      if (query && query.length > 2) {
        // uri encode the search value
        const searchValueEncoded = encodeURIComponent(query);

        // redirect to the search page
        void router.push(`/organisations?query=${searchValueEncoded}`);
      } else {
        // redirect to the search page
        void router.push("/organisations");
      }
    },
    [router],
  );

  if (error) {
    if (error === 401) return <Unauthenticated />;
    else if (error === 403) return <Unauthorized />;
    else return <InternalServerError />;
  }

  return (
    <>
      <Head>
        <title>Yoma | Organisations</title>
      </Head>

      <PageBackground className="h-[260px] lg:h-[268px]" />

      <div className="container z-10 max-w-7xl px-2 py-8">
        <div className="relative flex flex-row gap-2 py-20">
          <h2 className="flex flex-grow font-semibold text-white">
            Organisations
          </h2>

          <div className="flex gap-2 sm:justify-end">
            <Link
              href={`/organisations/register?returnUrl=${router.asPath}`}
              className="bg-theme hover:bg-theme flex w-40 flex-row items-center justify-center whitespace-nowrap rounded-full p-1 text-xs text-white brightness-105 hover:brightness-110"
            >
              <IoMdAdd className="h-5 w-5" />
              Add organisation
            </Link>
          </div>
        </div>

        {/* TABS */}

        <div role="tablist" className="tabs tabs-bordered relative mt-2">
          {/* PENDING COUNT BADGE */}
          <span className="absolute left-[270px] top-[7px] rounded bg-yellow px-1 text-xs text-white">
            {organisationsInactive?.items?.length}
          </span>

          {/* ALL ORGS TAB */}
          <input
            type="radio"
            name="org_tabs_1"
            role="tab"
            className={`tab !border-b-4 px-6 font-bold text-white  ${
              showAll
                ? "active !border-yellow"
                : "!border-transparent hover:text-gray"
            }`}
            aria-label="All"
            checked={showAll}
            onChange={handleInputChange}
            id="all_tab"
          />

          {/* ALL ORGS CONTENT */}
          <div role="tabpanel" className="tab-content">
            <div className="flex flex-row justify-end py-4">
              <SearchInput
                defaultValue={
                  query ? decodeURIComponent(query.toString()) : null
                }
                onSearch={onSearch}
                className="bg-theme hover:bg-theme brightness-105 hover:brightness-110"
              />
            </div>
            {/* NO ROWS */}
            {!organisationsAll ||
              (organisationsAll.length === 0 && !query && (
                <NoRowsMessage
                  title={"No organisations found"}
                  description={"Approved organisations will be displayed here."}
                />
              ))}
            {!organisationsAll ||
              (organisationsAll.length === 0 && query && (
                <NoRowsMessage
                  title={"No organisations found"}
                  description={"Please try refining your search query."}
                />
              ))}
            {organisationsAll && organisationsAll.length > 0 && (
              <>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-4">
                  {organisationsAll.map((item) => (
                    <OrganisationCardComponent
                      key={item.id}
                      item={item}
                      user={user}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          {/* APPROVED ORGS TAB */}

          <input
            type="radio"
            name="org_tabs_1"
            role="tab"
            className={`tab !border-b-4 px-6 font-bold text-white  ${
              showApproved
                ? "active !border-yellow"
                : "!border-transparent hover:text-gray"
            }`}
            aria-label="Approved"
            checked={showApproved}
            onChange={handleInputChange}
            id="approved_tab"
          />

          {/* APPROVED ORGS CONTENT */}

          <div role="tabpanel" className="tab-content">
            <div className="flex flex-row justify-end py-4">
              <SearchInput
                defaultValue={
                  query ? decodeURIComponent(query.toString()) : null
                }
                onSearch={onSearch}
              />
            </div>
            {/* NO ROWS */}
            {!organisationsActive ||
              (organisationsActive.items.length === 0 && !query && (
                <NoRowsMessage
                  title={"No organisations found"}
                  description={"Approved organisations will be displayed here."}
                />
              ))}
            {!organisationsActive ||
              (organisationsActive.items.length === 0 && query && (
                <NoRowsMessage
                  title={"No organisations found"}
                  description={"Please try refining your search query."}
                />
              ))}
            {organisationsActive && organisationsActive.items.length > 0 && (
              <>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-4">
                  {organisationsActive.items.map((item) => (
                    <OrganisationCardComponent
                      key={item.id}
                      item={item}
                      user={user}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          {/* PENDING ORGS TAB */}

          <input
            type="radio"
            name="org_tabs_1"
            role="tab"
            className={`tab !border-b-4 pl-6 pr-11 font-bold text-white  ${
              showPending
                ? "active !border-yellow"
                : "!border-transparent hover:text-gray"
            }`}
            aria-label="Pending"
            checked={showPending}
            onChange={handleInputChange}
            id="pending_tab"
          />

          {/* PENDING ORGS CONTENT */}
          <div role="tabpanel" className="tab-content">
            <div className="flex flex-row justify-end py-4">
              <SearchInput
                defaultValue={
                  query ? decodeURIComponent(query.toString()) : null
                }
                onSearch={onSearch}
              />
            </div>

            {/* NO ROWS */}
            {!organisationsInactive ||
              (organisationsInactive.items.length === 0 && !query && (
                <NoRowsMessage
                  title={"No organisations found"}
                  description={
                    "Organisations awaiting approval will be displayed here."
                  }
                />
              ))}

            {!organisationsInactive ||
              (organisationsInactive.items.length === 0 && query && (
                <NoRowsMessage
                  title={"No organisations found"}
                  description={"Please try refining your search query."}
                />
              ))}

            {/* GRID */}
            {organisationsInactive &&
              organisationsInactive.items.length > 0 && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-4">
                  {organisationsInactive.items.map((item) => (
                    <OrganisationCardComponent
                      key={item.id}
                      item={item}
                      user={user}
                    />
                  ))}
                </div>
              )}
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
