import { QueryClient, dehydrate, useQuery } from "@tanstack/react-query";
import { type GetServerSidePropsContext } from "next";
import { getServerSession } from "next-auth";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { type ParsedUrlQuery } from "querystring";
import React, { useState, type ReactElement } from "react";
import { IoMdSearch, IoMdSquare } from "react-icons/io";
import {
  OrganizationStatus,
  Status,
  type OrganizationInfo,
  type OrganizationSearchResults,
} from "~/api/models/organisation";
import { getOrganisations } from "~/api/services/organisations";
import LeftNavLayout from "~/components/Layout/LeftNav";
import MainLayout from "~/components/Layout/Main";
import withAuth from "~/context/withAuth";
import { type NextPageWithLayout } from "~/pages/_app";
import { authOptions } from "~/server/auth";

interface IParams extends ParsedUrlQuery {
  query: string;
  page: string;
}

// ⚠️ SSR
export async function getServerSideProps(context: GetServerSidePropsContext) {
  const { query, page } = context.query as IParams;
  const session = await getServerSession(context.req, context.res, authOptions);

  const queryClient = new QueryClient();
  if (session) {
    // 👇 prefetch queries (on server)
    await queryClient.prefetchQuery(
      [`OrganisationsActive_${query?.toString()}_${page?.toString()}`],
      () =>
        getOrganisations(
          {
            pageNumber: page ? parseInt(page.toString()) : 1,
            pageSize: 20,
            valueContains: query ?? "",
            statuses: [Status.Active],
          },
          context,
        ),
    );
    await queryClient.prefetchQuery(
      [`OrganisationsInactive_${query?.toString()}_${page?.toString()}`],
      () =>
        getOrganisations(
          {
            pageNumber: page ? parseInt(page.toString()) : 1,
            pageSize: 20,
            valueContains: query ?? "",
            statuses: [Status.Inactive],
          },
          context,
        ),
    );
  }

  return {
    props: {
      dehydratedState: dehydrate(queryClient),
      user: session?.user ?? null, // (required for 'withAuth' HOC component)
    },
  };
}

export const SearchComponent: React.FC<{ defaultValue: string }> = (props) => {
  const router = useRouter();
  const [searchInputValue, setSearchInputValue] = useState(props.defaultValue);

  const handleSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault(); // 👈️ prevent page refresh

    // trim whitespace
    const searchValue = searchInputValue?.trim();

    if (searchValue) {
      // uri encode the search value
      const searchValueEncoded = encodeURIComponent(searchValue);

      // redirect to the search page
      void router.push(`/organisations/search?query=${searchValueEncoded}`);
    } else {
      // redirect to the search page
      void router.push("/organisations/search");
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit}>
        <div className="search flex">
          <input
            type="search"
            className="input input-bordered w-full rounded-br-none rounded-tr-none text-sm"
            placeholder="Search organisations..."
            autoComplete="off"
            value={searchInputValue}
            onChange={(e) => setSearchInputValue(e.target.value)}
            onFocus={(e) => (e.target.placeholder = "")}
            onBlur={(e) => (e.target.placeholder = "Search organisations...")}
          />

          <button
            type="button"
            aria-label="Search"
            className="btn-search btn rounded-bl-none rounded-tl-none"
            onClick={handleSubmit}
          >
            <IoMdSearch className="icon-search h-6 w-6" />
          </button>
        </div>
      </form>
    </>
  );
};

export const OrganisationCardComponent: React.FC<{
  item: OrganizationInfo;
}> = (props) => {
  const link =
    props.item.status.toString() ===
    OrganizationStatus[OrganizationStatus.Active]
      ? `/organisations/${props.item.id}`
      : `/organisations/${props.item.id}/verify`;

  return (
    <div className="flex h-[100px] flex-col rounded-lg bg-white shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] dark:bg-neutral-700 md:max-w-xl md:flex-row">
      <div className="h-30 w-30 flex items-center justify-center p-4">
        {!props.item.logoURL && <IoMdSquare className="-ml-4 h-28 w-28" />}

        {props.item.logoURL && (
          <Link href={link}>
            <Image
              src={props.item.logoURL}
              alt={props.item.name}
              width={80}
              height={80}
              className="rounded-lg border border-primary pl-4 drop-shadow-lg"
            />
          </Link>
        )}
      </div>

      <div className="flex w-[300px] flex-col justify-start p-1">
        <h5 className="mb-2 truncate overflow-ellipsis whitespace-nowrap text-xl  font-medium text-neutral-800 dark:text-neutral-50">
          <Link href={link}>{props.item.name}</Link>
        </h5>
        <p className="mb-4 truncate overflow-ellipsis whitespace-nowrap  text-base text-neutral-600 dark:text-neutral-200">
          {props.item.tagline}
        </p>
        <p className="text-xs text-neutral-500 dark:text-neutral-300">
          {props.item.status}
        </p>
      </div>
    </div>
  );
};

const Opportunities: NextPageWithLayout = () => {
  const router = useRouter();

  // get query parameter from route
  const { query, page } = router.query;

  // 👇 use prefetched queries (from server)
  const { data: organisationsActive } = useQuery<OrganizationSearchResults>({
    queryKey: [`OrganisationsActive_${query?.toString()}_${page?.toString()}`],
    queryFn: () =>
      getOrganisations({
        pageNumber: page ? parseInt(page.toString()) : 1,
        pageSize: 20,
        valueContains: query?.toString() ?? "",
        statuses: [Status.Active],
      }),
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
  });

  const handleAddOpportunity = () => {
    void router.push("/dashboard/opportunity/create");
  };

  // const SkillsFormatter = useCallback(
  //   (row: RenderCellProps<FullOpportunityResponseDto>) => {
  //     return row.row.skills.join(", ");
  //   },
  //   [],
  // );

  // const StatusFormatter = useCallback(
  //   (row: RenderCellProps<FullOpportunityResponseDto>) => {
  //     return row.row.endTime && Date.parse(row.row.endTime) < Date.now()
  //       ? "Expired"
  //       : "Active";
  //   },
  //   [],
  // );

  // const UnverifiedCredentialsFormatter = useCallback(
  //   (row: RenderCellProps<FullOpportunityResponseDto>) => {
  //     return row.row.unverifiedCredentials ? (
  //       <div className="grid grid-cols-2 items-center justify-center">
  //         <div>{row.row.unverifiedCredentials}</div>
  //         <Link
  //           href={`/dashboard/verify/${row.row.id}`}
  //           className="btn btn-warning btn-xs flex flex-row flex-nowrap"
  //         >
  //           <FaExclamationTriangle className="text-yellow-700 mr-2 h-4 w-4" />
  //           Verify
  //         </Link>
  //       </div>
  //     ) : (
  //       "n/a"
  //     );
  //   },
  //   [],
  // );

  // const ManageFormatter = useCallback(
  //   (row: RenderCellProps<FullOpportunityResponseDto>) => {
  //     return (
  //       <Link href={`/dashboard/opportunity/${row.row.id}`}>
  //         <IoMdSettings className="h-6 w-6" />
  //       </Link>
  //     );
  //   },
  //   [],
  // );

  return (
    <>
      <Head>
        <title>Yoma Admin | Organisations</title>
      </Head>
      <div className="container">
        <div className="flex flex-row py-4">
          <h2 className="flex flex-grow">Organisations</h2>

          <SearchComponent defaultValue={query as string} />

          <div className="flex justify-end">
            <button
              type="button"
              className="btn btn-success btn-sm"
              onClick={handleAddOpportunity}
            >
              Create New
            </button>
          </div>
        </div>

        <div className="rounded-lg p-4">
          <h4>Organisations for approval</h4>
          {/* GRID */}
          {organisationsInactive && organisationsInactive.items.length > 0 && (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-8">
                {organisationsInactive.items.map((item) => (
                  <OrganisationCardComponent key={item.id} item={item} />
                ))}
              </div>
            </>
          )}
          {/* NO ROWS */}
          {!organisationsInactive ||
            (organisationsInactive.items.length === 0 && (
              <div
                style={{
                  textAlign: "center",
                  padding: "50px",
                }}
              >
                <h6>No data to show</h6>
              </div>
            ))}

          <h4>Approved Organisations</h4>
          {organisationsActive && organisationsActive.items.length > 0 && (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-8">
                {organisationsActive.items.map((item) => (
                  <OrganisationCardComponent key={item.id} item={item} />
                ))}
              </div>
            </>
          )}
          {/* NO ROWS */}
          {!organisationsActive ||
            (organisationsActive.items.length === 0 && (
              <div
                style={{
                  textAlign: "center",
                  padding: "50px",
                }}
              >
                <h6>No data to show</h6>
              </div>
            ))}
        </div>
      </div>
    </>
  );
};

Opportunities.getLayout = function getLayout(page: ReactElement) {
  return (
    <MainLayout>
      <LeftNavLayout>{page}</LeftNavLayout>
    </MainLayout>
  );
};

export default withAuth(Opportunities);
