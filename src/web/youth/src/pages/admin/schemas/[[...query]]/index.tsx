import { QueryClient, dehydrate, useQuery } from "@tanstack/react-query";
import { type GetServerSidePropsContext } from "next";
import { getServerSession } from "next-auth";
import Head from "next/head";
import { useRouter } from "next/router";
import { type ReactElement } from "react";
import MainLayout from "~/components/Layout/Main";
import withAuth from "~/context/withAuth";
import { authOptions } from "~/server/auth";
import { type NextPageWithLayout } from "~/pages/_app";
import { type ParsedUrlQuery } from "querystring";
import Link from "next/link";
import { PageBackground } from "~/components/PageBackground";
import { IoIosAdd, IoMdSettings } from "react-icons/io";
import { SearchInput } from "~/components/SearchInput";
import NoRowsMessage from "~/components/NoRowsMessage";
import { getSchemas } from "~/api/services/credentials";
import type { SSISchema } from "~/api/models/credential";

interface IParams extends ParsedUrlQuery {
  id: string;
  query?: string;
  page?: string;
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const { query, page } = context.query;

  const session = await getServerSession(context.req, context.res, authOptions);

  const queryClient = new QueryClient();
  if (session) {
    // 👇 prefetch queries (on server)
    await queryClient.prefetchQuery(
      [`Schemas_${query?.toString()}_${page?.toString()}`],
      () =>
        getSchemas(
          // {
          //   organizations: [id],
          //   pageNumber: page ? parseInt(page.toString()) : 1,
          //   pageSize: 10,
          //   startDate: null,
          //   endDate: null,
          //   statuses: null,
          //   types: null,
          //   categories: null,
          //   languages: null,
          //   countries: null,
          //   valueContains: query?.toString() ?? null,
          // },
          context,
        ),
    );
  }

  return {
    props: {
      dehydratedState: dehydrate(queryClient),
      user: session?.user ?? null, // (required for 'withAuth' HOC component)

      query: query ?? null,
      page: page ?? null,
    },
  };
}

const Schemas: NextPageWithLayout<{
  query?: string;
  page?: string;
}> = ({ query, page }) => {
  const router = useRouter();

  // 👇 use prefetched queries (from server)
  const { data: schemas } = useQuery<SSISchema[]>({
    queryKey: [`Schemas_${query?.toString()}_${page?.toString()}`],
    queryFn: () => getSchemas(),
    //   {
    //   organizations: [id],
    //   pageNumber: page ? parseInt(page.toString()) : 1,
    //   pageSize: 10,
    //   startDate: null,
    //   endDate: null,
    //   statuses: null,
    //   types: null,
    //   categories: null,
    //   languages: null,
    //   countries: null,
    //   valueContains: query?.toString() ?? null,
    // }
  });

  // const onSearch = useCallback(
  //   (query: string) => {
  //     if (query && query.length > 2) {
  //       // uri encode the search value
  //       const queryEncoded = encodeURIComponent(query);

  //       // redirect to the search page
  //       void router.push(`/admin/schemas?query=${queryEncoded}`);
  //     } else {
  //       void router.push(`/admin/schemas`);
  //     }
  //   },
  //   [router],
  // );

  return (
    <>
      <Head>
        <title>Yoma Admin | Schemas</title>
      </Head>

      <PageBackground />

      <div className="container z-10 max-w-5xl px-2 py-8">
        <div className="flex flex-col gap-2 py-4 sm:flex-row">
          <h3 className="flex flex-grow text-white">Schemas</h3>

          <div className="flex gap-2 sm:justify-end">
            {/* search disabled */}
            {/* <SearchInput defaultValue={query} onSearch={onSearch} /> */}

            <Link
              href={`/admin/schemas/create`}
              className="flex w-40 flex-row items-center justify-center whitespace-nowrap rounded-full bg-green-dark p-1 text-xs text-white"
            >
              <IoIosAdd className="mr-1 h-5 w-5" />
              Add schema
            </Link>
          </div>
        </div>

        <div className="rounded-lg bg-white p-4">
          {/* NO ROWS */}
          {schemas && schemas.length === 0 && !query && (
            <NoRowsMessage
              title={"No schemas found"}
              description={"Schemas that you add will be displayed here."}
            />
          )}
          {schemas && schemas?.length === 0 && query && (
            <NoRowsMessage
              title={"No schemas found"}
              description={"Please try refining your search query."}
            />
          )}

          {/* GRID */}
          {schemas && schemas?.length > 0 && (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Version</th>
                    <th>Attributes</th>
                    <th>Type</th>
                    <th>Manage</th>
                  </tr>
                </thead>
                <tbody>
                  {schemas.map((schema) => (
                    <tr key={schema.id}>
                      <td>
                        <Link href={`/admin/schemas/${schema.name}`}>
                          {schema.name}
                        </Link>
                      </td>
                      <td>{schema.version}</td>
                      <td>{schema.entities?.length}</td>
                      <td>{schema.typeDescription}</td>
                      <td>
                        <Link href={`/admin/schemas/${schema.name}`}>
                          <IoMdSettings className="h-2 w-2" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

Schemas.getLayout = function getLayout(page: ReactElement) {
  return <MainLayout>{page}</MainLayout>;
};

export default withAuth(Schemas);
