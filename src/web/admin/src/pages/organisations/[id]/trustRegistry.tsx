import { QueryClient, dehydrate, useQuery } from "@tanstack/react-query";
import { type GetServerSidePropsContext } from "next";
import { getServerSession } from "next-auth";
import Head from "next/head";
import Link from "next/link";
import { type ParsedUrlQuery } from "querystring";
import { type ReactElement } from "react";
import "react-datepicker/dist/react-datepicker.css";
import { IoMdImage } from "react-icons/io";
import { type Organization } from "~/api/models/organisation";
import { getOrganisationById } from "~/api/services/organisations";
import LeftNavLayout from "~/components/Layout/LeftNav";
import MainLayout from "~/components/Layout/Main";
import OrganisationTabLayout from "~/components/Organisation/OrganisationTabLayout";
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

const OrganisationTrustRegistry: NextPageWithLayout<{
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
      <div className="flex flex-col items-center justify-center pt-6">
        <div className="container p-8">
          {/* BREADCRUMB */}
          <div className="flex flex-row text-xs text-gray">
            <Link
              className="font-bold text-gray-dark hover:text-gray"
              href={"/organisations/search"}
            >
              Organisations
            </Link>
            <div className="mx-2">/</div>
            <div className="max-w-[600px] overflow-hidden text-ellipsis whitespace-nowrap text-gray-dark">
              {organisation?.name}
            </div>
          </div>

          <div className="flex flex-row items-center">
            {/* LOGO */}
            <div className="flex h-20 min-w-max items-center justify-center">
              {/* NO IMAGE */}
              {!organisation?.logoURL && (
                <IoMdImage className="text-gray-400 h-20 w-20" />
              )}

              {/* EXISTING IMAGE */}
              {organisation?.logoURL && (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    className="m-4 rounded-lg"
                    alt="company logo"
                    width={60}
                    height={60}
                    src={organisation.logoURL}
                  />
                </>
              )}
            </div>

            {/* TITLE */}
            <h2 className="overflow-hidden text-ellipsis whitespace-nowrap font-bold">
              {organisation?.name}
            </h2>
          </div>

          {/* TABS */}
          <OrganisationTabLayout />

          {/* CONTENT */}
          <div className="flex flex-col items-center pt-4">
            <div className="flex w-full flex-col gap-2 rounded-lg bg-white p-8 shadow-lg lg:w-[600px]">
              TODO...
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

OrganisationTrustRegistry.getLayout = function getLayout(page: ReactElement) {
  return (
    <MainLayout>
      <LeftNavLayout>{page}</LeftNavLayout>
    </MainLayout>
  );
};

export default withAuth(OrganisationTrustRegistry);
