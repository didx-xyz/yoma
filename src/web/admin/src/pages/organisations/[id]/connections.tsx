import { QueryClient, dehydrate, useQuery } from "@tanstack/react-query";
import { type GetServerSidePropsContext } from "next";
import { getServerSession } from "next-auth";
import { type ParsedUrlQuery } from "querystring";
import { type ReactElement } from "react";
import "react-datepicker/dist/react-datepicker.css";
import { Organization } from "~/api/models/organisation";
import { getOrganisationById } from "~/api/services/organisations";
import MainLayout from "~/components/Layout/Main";
import OrganisationLayout from "~/components/Layout/Organisation";
import withAuth from "~/context/withAuth";
import { authOptions, type User } from "~/server/auth";
import { type NextPageWithLayout } from "../../_app";
import LeftNavLayout from "~/components/Layout/LeftNav";

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

const OrganisationConnections: NextPageWithLayout<{
  id: string;
  user: User;
}> = ({ id }) => {
  const { data: organisation } = useQuery<Organization>({
    queryKey: ["organisation", id],
  });

  return <>TODO...</>;
};

OrganisationConnections.getLayout = function getLayout(page: ReactElement) {
  return (
    <MainLayout>
      <LeftNavLayout>
        <OrganisationLayout>{page}</OrganisationLayout>
      </LeftNavLayout>
    </MainLayout>
  );
};

export default withAuth(OrganisationConnections);
