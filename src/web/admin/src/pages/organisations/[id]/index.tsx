import { QueryClient, dehydrate, useQuery } from "@tanstack/react-query";
import { type GetServerSidePropsContext } from "next";
import { getServerSession } from "next-auth";
import { type ParsedUrlQuery } from "querystring";
import { type ReactElement } from "react";
import "react-datepicker/dist/react-datepicker.css";
import { Organization } from "~/api/models/organisation";
import { getOrganisationById } from "~/api/services/organisations";
import LeftNavLayout from "~/components/Layout/LeftNav";
import MainLayout from "~/components/Layout/Main";
import OrganisationLayout from "~/components/Layout/Organisation";
import { Overview } from "~/components/Organisation/Detail/Overview";
import withAuth from "~/context/withAuth";
import { authOptions, type User } from "~/server/auth";
import { type NextPageWithLayout } from "../../_app";

interface IParams extends ParsedUrlQuery {
  id: string;
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const { id } = context.params as IParams;
  const queryClient = new QueryClient();
  const session = await getServerSession(context.req, context.res, authOptions);

  await queryClient.prefetchQuery(["organisation", id], () =>
    getOrganisationById(id, context),
  );

  return {
    props: {
      dehydratedState: dehydrate(queryClient),
      user: session?.user ?? null,
      id: id,
    },
  };
}

const OrganisationOverview: NextPageWithLayout<{
  id: string;
  user: User;
}> = ({ id }) => {
  const { data: organisation } = useQuery<Organization>({
    queryKey: ["organisation", id],
  });

  return (
    <div className="container max-w-md items-center justify-center gap-12 px-4 py-16">
      <Overview organisation={organisation}></Overview>
    </div>
  );
};

OrganisationOverview.getLayout = function getLayout(page: ReactElement) {
  return (
    <MainLayout>
      <LeftNavLayout>
        <OrganisationLayout>{page}</OrganisationLayout>
      </LeftNavLayout>
    </MainLayout>
  );
};

export default withAuth(OrganisationOverview);
