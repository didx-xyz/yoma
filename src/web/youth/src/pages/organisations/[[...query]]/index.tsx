import { QueryClient, dehydrate, useQuery } from "@tanstack/react-query";
import { type GetServerSidePropsContext } from "next";
import { getServerSession } from "next-auth";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { type ParsedUrlQuery } from "querystring";
import React, { useState, type ReactElement, useCallback } from "react";
import { IoMdAdd, IoMdSearch, IoMdSquare } from "react-icons/io";
import {
  OrganizationStatus,
  Status,
  type OrganizationInfo,
  type OrganizationSearchResults,
} from "~/api/models/organisation";
import { getOrganisations } from "~/api/services/organisations";
import MainLayout from "~/components/Layout/Main";
import NoRowsMessage from "~/components/NoRowsMessage";
import { PageBackground } from "~/components/PageBackground";
import { SearchInput } from "~/components/SearchInput";
import withAuth from "~/context/withAuth";
import { type NextPageWithLayout } from "~/pages/_app";
import { authOptions } from "~/server/auth";

interface IParams extends ParsedUrlQuery {
  query: string;
  page: string;
}

// ⚠️ SSR
export async function getServerSideProps(context: GetServerSidePropsContext) {
  const { query, page } = context.query;
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
            valueContains: query as any,
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
            valueContains: query as any,
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

// export const SearchComponent: React.FC<{ defaultValue: string }> = (props) => {
//   const router = useRouter();
//   const [searchInputValue, setSearchInputValue] = useState(props.defaultValue);

//   const handleSubmit = (e: React.SyntheticEvent) => {
//     e.preventDefault(); // 👈️ prevent page refresh

//     // trim whitespace
//     const searchValue = searchInputValue?.trim();

//     if (searchValue) {
//       // uri encode the search value
//       const searchValueEncoded = encodeURIComponent(searchValue);

//       // redirect to the search page
//       void router.push(`/organisations?query=${searchValueEncoded}`);
//     } else {
//       // redirect to the search page
//       void router.push("/organisations");
//     }
//   };

//   return (
//     <>
//       <form onSubmit={handleSubmit}>
//         <div className="search flex">
//           <input
//             type="search"
//             className="input input-bordered input-sm w-full rounded-br-none rounded-tr-none text-sm"
//             placeholder="Search organisations..."
//             autoComplete="off"
//             value={searchInputValue}
//             onChange={(e) => setSearchInputValue(e.target.value)}
//             onFocus={(e) => (e.target.placeholder = "")}
//             onBlur={(e) => (e.target.placeholder = "Search organisations...")}
//           />

//           <button
//             type="button"
//             aria-label="Search"
//             className="btn-search btn btn-sm rounded-bl-none rounded-tl-none border-gray"
//             onClick={handleSubmit}
//           >
//             <IoMdSearch className="icon-search h-6 w-6" />
//           </button>
//         </div>
//       </form>
//     </>
//   );
// };

export const OrganisationCardComponent: React.FC<{
  item: OrganizationInfo;
}> = (props) => {
  const link =
    props.item.status.toString() ===
    OrganizationStatus[OrganizationStatus.Active]
      ? `/organisations/${props.item.id}/info`
      : `/organisations/${props.item.id}/verify`;

  return (
    <div className="flex h-[100px] flex-col rounded-lg bg-white shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] dark:bg-neutral-700 md:max-w-xl md:flex-row">
      <div className="flex items-center justify-center p-4">
        {!props.item.logoURL && <IoMdSquare className="-ml-4 h-28 w-28" />}

        {props.item.logoURL && (
          <Link href={link}>
            <Image
              src={props.item.logoURL}
              alt={props.item.name}
              width={80}
              height={80}
              className="h-20 w-20 rounded-lg object-cover pl-4 shadow-lg drop-shadow-lg"
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

  return (
    <>
      <Head>
        <title>Yoma Admin | Organisations</title>
      </Head>

      <PageBackground />

      <div className="container z-10 max-w-5xl px-2 py-8">
        <div className="flex flex-col gap-2 py-4 sm:flex-row">
          <h3 className="flex flex-grow text-white">Organisations</h3>

          <div className="flex gap-2 sm:justify-end">
            <SearchInput defaultValue={query as string} onSearch={onSearch} />

            <Link
              href="/organisations/register"
              className="flex w-40 flex-row items-center justify-center whitespace-nowrap rounded-full bg-green-dark p-1 text-xs text-white"
            >
              <IoMdAdd className="h-5 w-5" />
              Add organisation
            </Link>
          </div>
        </div>

        <div className="items-centerx flex flex-col rounded-lg bg-white p-4">
          <div className="flex w-full flex-col gap-2  lg:w-[1000px]">
            <h4>Organisations for approval</h4>

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
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-8">
                    {organisationsInactive.items.map((item) => (
                      <OrganisationCardComponent key={item.id} item={item} />
                    ))}
                  </div>
                </>
              )}

            <h4>Approved Organisations</h4>

            {/* NO ROWS */}
            {!organisationsActive ||
              (organisationsActive.items.length === 0 && (
                <NoRowsMessage
                  title={"No organisations found"}
                  description={
                    "Opportunities that you add will be displayed here."
                  }
                />
              ))}

            {organisationsActive && organisationsActive.items.length > 0 && (
              <>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-8">
                  {organisationsActive.items.map((item) => (
                    <OrganisationCardComponent key={item.id} item={item} />
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

export default withAuth(Opportunities);
