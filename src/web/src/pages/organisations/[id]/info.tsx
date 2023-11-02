import { QueryClient, dehydrate, useQuery } from "@tanstack/react-query";
import { type GetServerSidePropsContext } from "next";
import { getServerSession } from "next-auth";
import Head from "next/head";
import Link from "next/link";
import { type ParsedUrlQuery } from "querystring";
import { type ReactElement } from "react";
import "react-datepicker/dist/react-datepicker.css";
import { type Organization } from "~/api/models/organisation";
import { getOrganisationById } from "~/api/services/organisations";
import MainLayout from "~/components/Layout/Main";
import { Overview } from "~/components/Organisation/Detail/Overview";
import { LogoTitle } from "~/components/Organisation/LogoTitle";
import withAuth from "~/context/withAuth";
import { authOptions, type User } from "~/server/auth";
import { type NextPageWithLayout } from "../../_app";
import { PageBackground } from "~/components/PageBackground";

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
    <>
      <Head>
        <title>Yoma Admin | {organisation?.name}</title>
      </Head>

      <PageBackground />

      <div className="container z-10 max-w-5xl px-2 py-8">
        {/* BREADCRUMB */}
        <div className="flex flex-row text-xs text-gray">
          <Link
            className="font-bold text-white hover:text-gray"
            href={"/organisations"}
          >
            Organisations
          </Link>
          <div className="mx-2">/</div>
          <div className="max-w-[600px] overflow-hidden text-ellipsis whitespace-nowrap text-white">
            {organisation?.name}
          </div>
        </div>

        {/* LOGO/TITLE */}
        <LogoTitle logoUrl={organisation?.logoURL} title={organisation?.name} />

        {/* TABS */}
        {/* <OrganisationTabLayout /> */}

        {/* CONTENT */}
        <div className="flex flex-col items-center">
          <div className="flex w-full flex-col gap-2 rounded-lg bg-white p-4 shadow-lg lg:w-[600px]">
            <Overview organisation={organisation}></Overview>
          </div>
        </div>

        {/* BUTTONS */}
        <div className="my-4 flex items-center justify-center gap-2">
          <Link
            href={`/organisations/${id}/edit`}
            type="button"
            className="btn btn-info btn-xs"
          >
            Edit Details
          </Link>
        </div>
      </div>
    </>
  );
};

OrganisationOverview.getLayout = function getLayout(page: ReactElement) {
  return <MainLayout>{page}</MainLayout>;
};

export default withAuth(OrganisationOverview);
