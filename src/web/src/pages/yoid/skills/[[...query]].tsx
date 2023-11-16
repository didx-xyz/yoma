import { QueryClient, dehydrate } from "@tanstack/react-query";
import { type GetServerSidePropsContext } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "~/server/auth";
import { type NextPageWithLayout } from "../../_app";
import YoIDTabbedLayout from "~/components/Layout/YoIDTabbed";
import type { ParsedUrlQuery } from "querystring";
import { UnderConstruction } from "~/components/Status/UnderConstruction";
import type { ReactElement } from "react";
import withAuth from "~/context/withAuth";

interface IParams extends ParsedUrlQuery {
  id: string;
  query?: string;
  page?: string;
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const { id } = context.params as IParams;
  const { query, page } = context.query;

  const session = await getServerSession(context.req, context.res, authOptions);

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

const MySkills: NextPageWithLayout<{
  id: string;
  query?: string;
  page?: string;
}> = (/*{ id, query, page }*/) => {
  return (
    <>
      <UnderConstruction />
    </>
  );
};

MySkills.getLayout = function getLayout(page: ReactElement) {
  return <YoIDTabbedLayout>{page}</YoIDTabbedLayout>;
};

export default withAuth(MySkills);
