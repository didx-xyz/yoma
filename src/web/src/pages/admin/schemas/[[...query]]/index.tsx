import { QueryClient, dehydrate, useQuery } from "@tanstack/react-query";
import { type GetServerSidePropsContext } from "next";
import { getServerSession } from "next-auth";
import Head from "next/head";
import { type ReactElement } from "react";
import MainLayout from "~/components/Layout/Main";
import { authOptions } from "~/server/auth";
import { type NextPageWithLayout } from "~/pages/_app";
import Link from "next/link";
import { PageBackground } from "~/components/PageBackground";
import { IoIosAdd, IoMdSettings } from "react-icons/io";
import NoRowsMessage from "~/components/NoRowsMessage";
import { getSchemas } from "~/api/services/credentials";
import type { SSISchema } from "~/api/models/credential";
import { THEME_BLUE } from "~/lib/constants";
import { Unauthorized } from "~/components/Status/Unauthorized";
import { config } from "~/lib/react-query-config";
import axios from "axios";
import { InternalServerError } from "~/components/Status/InternalServerError";
import { Unauthenticated } from "~/components/Status/Unauthenticated";

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const session = await getServerSession(context.req, context.res, authOptions);
  const { query, page } = context.query;
  const queryClient = new QueryClient(config);
  let errorCode = null;

  if (!session) {
    return {
      props: {
        error: 401,
      },
    };
  }

  try {
    // 👇 prefetch queries on server
    const data = await getSchemas(undefined, context);

    await queryClient.prefetchQuery({
      queryKey: [`Schemas_${query?.toString()}_${page?.toString()}`],
      queryFn: () => data,
    });
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status) {
      if (error.response.status === 404) {
        return {
          notFound: true,
        };
      } else errorCode = error.response.status;
    } else errorCode = 500;
  }

  return {
    props: {
      dehydratedState: dehydrate(queryClient),
      user: session?.user ?? null,
      query: query ?? null,
      page: page ?? null,
      error: errorCode,
    },
  };
}

const Schemas: NextPageWithLayout<{
  query?: string;
  page?: string;
  error?: number;
}> = ({ query, page, error }) => {
  // 👇 use prefetched queries from server
  const { data: schemas } = useQuery<SSISchema[]>({
    queryKey: [`Schemas_${query?.toString()}_${page?.toString()}`],
    queryFn: () => getSchemas(),
    enabled: !error,
  });

  if (error) {
    if (error === 401) return <Unauthenticated />;
    else if (error === 403) return <Unauthorized />;
    else return <InternalServerError />;
  }

  return (
    <>
      <Head>
        <title>Yoma Admin | Schemas</title>
      </Head>

      <PageBackground />

      <div className="container z-10 mt-20 max-w-5xl px-2 py-8">
        <div className="flex flex-row gap-2 py-4">
          <h2 className="flex flex-grow font-semibold text-white">Schemas</h2>

          <div className="flex gap-2 sm:justify-end">
            <Link
              href={`/admin/schemas/create`}
              className="bg-theme flex w-40 flex-row items-center justify-center whitespace-nowrap rounded-full p-1 text-xs text-white brightness-105 hover:brightness-110"
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
                  <tr className="border-gray text-gray-dark">
                    <th>Name</th>
                    <th>Version</th>
                    <th>Attributes</th>
                    <th>Type</th>
                    <th>Manage</th>
                  </tr>
                </thead>
                <tbody>
                  {schemas.map((schema) => (
                    <tr key={schema.id} className="border-gray text-gray-dark">
                      <td>
                        <Link href={`/admin/schemas/${schema.name}`}>
                          {schema.displayName}
                        </Link>
                      </td>
                      <td>{schema.version}</td>
                      <td>{schema.entities?.length}</td>
                      <td>{schema.typeDescription}</td>
                      <td className="flex justify-center">
                        <Link href={`/admin/schemas/${schema.name}`}>
                          <IoMdSettings className="h-4 w-4" />
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

Schemas.theme = function getTheme() {
  return THEME_BLUE;
};

export default Schemas;
