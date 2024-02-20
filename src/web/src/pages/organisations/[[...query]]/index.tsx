import { QueryClient, dehydrate, useQuery } from "@tanstack/react-query";
import { type GetServerSidePropsContext } from "next";
import { getServerSession } from "next-auth";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import React, {
  type ReactElement,
  useCallback,
  useState,
  type ChangeEvent,
} from "react";
import { IoMdAdd, IoMdPhotos } from "react-icons/io";
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
      queryKey: [
        `OrganisationsActive_${query?.toString()}_${page?.toString()}`,
      ],
      queryFn: () =>
        getOrganisations(
          {
            pageNumber: page ? parseInt(page.toString()) : 1,
            pageSize: 20,
            valueContains: query?.toString() ?? null,
            statuses: [Status.Active],
          },
          context,
        ),
    }),
    await queryClient.prefetchQuery({
      queryKey: [
        `OrganisationsInactive_${query?.toString()}_${page?.toString()}`,
      ],
      queryFn: () =>
        getOrganisations(
          {
            pageNumber: page ? parseInt(page.toString()) : 1,
            pageSize: 20,
            valueContains: query?.toString() ?? null,
            statuses: [Status.Inactive],
          },
          context,
        ),
    }),
  ]);

  return {
    props: {
      dehydratedState: dehydrate(queryClient),
      user: session?.user ?? null,
      theme: theme,
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
        className="flex flex-col rounded-xl bg-white shadow-custom transition hover:scale-[1.01] dark:bg-neutral-700 md:max-w-xl md:flex-row"
      >
        <div className="flex w-1/4 items-center justify-center p-2">
          {!props.item.logoURL && (
            <div className="flex h-28 w-28 items-center justify-center rounded-lg shadow-custom">
              <IoMdPhotos className="h-16 w-16 text-gray-light" />
            </div>
          )}

          {props.item.logoURL && (
            <Image
              src={props.item.logoURL}
              alt={props.item.name}
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
            {props.item.name}
          </h5>
          <p className="truncate overflow-ellipsis whitespace-nowrap text-sm">
            {props.item.tagline}
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

const Opportunities: NextPageWithLayout<{
  error: string;
  user: User;
  theme: string;
}> = ({ error, user }) => {
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

  if (error) return <Unauthorized />;

  return (
    <>
      <Head>
        <title>Yoma | Organisations</title>
      </Head>

      <div className="bg-theme absolute left-0 top-0 z-0 h-[228px] w-full"></div>

      <div className="container z-10 max-w-5xl px-2 py-8">
        <div className="relative flex flex-col gap-2 py-20 sm:flex-row">
          <h2 className="flex flex-grow font-bold text-white">Organisations</h2>

          <div className="flex gap-2 sm:justify-end">
            <Link
              href="/organisations/register"
              className="bg-theme hover:bg-theme flex w-40 flex-row items-center justify-center whitespace-nowrap rounded-full p-1 text-xs text-white brightness-105 hover:brightness-110"
            >
              <IoMdAdd className="h-5 w-5" />
              Add organisation
            </Link>
          </div>
        </div>

        {/* TABS */}

        <div role="tablist" className="tabs tabs-bordered relative -mt-8">
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
              <SearchInput defaultValue={query as string} onSearch={onSearch} />
            </div>
            {/* NO ROWS */}
            {!organisationsAll ||
              (organisationsAll.length === 0 && (
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
              <SearchInput defaultValue={query as string} onSearch={onSearch} />
            </div>
            {/* NO ROWS */}
            {!organisationsActive ||
              (organisationsActive.items.length === 0 && (
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
              <SearchInput defaultValue={query as string} onSearch={onSearch} />
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
                <>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-4">
                    {organisationsInactive.items.map((item) => (
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
