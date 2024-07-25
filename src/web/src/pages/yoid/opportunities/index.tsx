import { type GetServerSidePropsContext } from "next";
import { getServerSession } from "next-auth";
import { type ParsedUrlQuery } from "querystring";
import { type ReactElement } from "react";
import YoIDTabbedOpportunities from "~/components/Layout/YoIDTabbedOpportunities";
import { InternalServerError } from "~/components/Status/InternalServerError";
import { Unauthenticated } from "~/components/Status/Unauthenticated";
import { Unauthorized } from "~/components/Status/Unauthorized";
import { NextPageWithLayout } from "~/pages/_app";
import { authOptions } from "~/server/auth";

interface IParams extends ParsedUrlQuery {
  query?: string;
  page?: string;
}

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

  return {
    props: {
      user: session?.user ?? null,
      error: errorCode,
    },
  };
}

const MyOpportunitiesOverview: NextPageWithLayout<{
  user?: any;
  error?: number;
}> = ({ user, error }) => {
  if (error) {
    if (error === 401) return <Unauthenticated />;
    else if (error === 403) return <Unauthorized />;
    else return <InternalServerError />;
  }

  return (
    <div className="flex flex-col gap-4">
      <h6 className="font-bold tracking-wider">Completed opportunities 👍</h6>
      todo
    </div>
  );
};

MyOpportunitiesOverview.getLayout = function getLayout(page: ReactElement) {
  return <YoIDTabbedOpportunities>{page}</YoIDTabbedOpportunities>;
};

export default MyOpportunitiesOverview;
