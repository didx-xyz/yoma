import { QueryClient, dehydrate } from "@tanstack/react-query";
import { type GetServerSidePropsContext } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "~/server/auth";
import { type NextPageWithLayout } from "../../_app";
import YoIDTabbedLayout from "~/components/Layout/YoIDTabbed";
import type { ParsedUrlQuery } from "querystring";
import { UnderConstruction } from "~/components/Status/UnderConstruction";
import type { ReactElement } from "react";
import { Unauthorized } from "~/components/Status/Unauthorized";

interface IParams extends ParsedUrlQuery {
  id: string;
  query?: string;
  page?: string;
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const session = await getServerSession(context.req, context.res, authOptions);

  if (!session) {
    return {
      props: {
        error: "Unauthorized",
      },
    };
  }

  const { id } = context.params as IParams;
  const { query, page } = context.query;
  const queryClient = new QueryClient();

  return {
    props: {
      dehydratedState: dehydrate(queryClient),
      user: session?.user ?? null, // (required for 'withAuth' HOC component)
      id: id ?? null,
      query: query ?? null,
      page: page ?? "1",
    },
  };
}

const MySaved: NextPageWithLayout<{
  id: string;
  query?: string;
  page?: string;
  error: string;
}> = ({ /*id, query, page,*/ error }) => {
  if (error) return <Unauthorized />;

  return (
    <>
      <UnderConstruction />
    </>
  );
};

MySaved.getLayout = function getLayout(page: ReactElement) {
  return <YoIDTabbedLayout>{page}</YoIDTabbedLayout>;
};

export default MySaved;
