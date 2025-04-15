import { QueryClient, dehydrate, useQuery } from "@tanstack/react-query";
import axios from "axios";
import { type GetServerSidePropsContext } from "next";
import { getServerSession } from "next-auth";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { type ParsedUrlQuery } from "querystring";
import { type ReactElement } from "react";
import "react-datepicker/dist/react-datepicker.css";
import { IoMdArrowRoundBack } from "react-icons/io";
import { type Organization } from "~/api/models/organisation";
import { getOrganisationById } from "~/api/services/organisations";
import MainLayout from "~/components/Layout/Main";
import { OrgOverview } from "~/components/Organisation/Detail/OrgOverview";
import { LogoTitle } from "~/components/Organisation/LogoTitle";
import { PageBackground } from "~/components/PageBackground";
import { InternalServerError } from "~/components/Status/InternalServerError";
import { Unauthenticated } from "~/components/Status/Unauthenticated";
import { Unauthorized } from "~/components/Status/Unauthorized";
import { config } from "~/lib/react-query-config";
import { getSafeUrl, getThemeFromRole } from "~/lib/utils";
import type { NextPageWithLayout } from "~/pages/_app";
import { authOptions, type User } from "~/server/auth";

interface IParams extends ParsedUrlQuery {
  id: string;
}

// ⚠️ SSR
export async function getServerSideProps(context: GetServerSidePropsContext) {
  const { id } = context.params as IParams;
  const session = await getServerSession(context.req, context.res, authOptions);
  const queryClient = new QueryClient(config);
  let errorCode = null;

  // 👇 ensure authenticated
  if (!session) {
    return {
      props: {
        error: 401,
      },
    };
  }

  // 👇 set theme based on role
  const theme = getThemeFromRole(session, id);

  try {
    // 👇 prefetch queries on server
    const data = await getOrganisationById(id, context);

    await queryClient.prefetchQuery({
      queryKey: ["organisation", id],
      queryFn: () => data,
    });
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status) {
      if (error.response.status === 404) {
        return {
          notFound: true,
          props: { theme: theme },
        };
      } else errorCode = error.response.status;
    } else errorCode = 500;
  }

  return {
    props: {
      dehydratedState: dehydrate(queryClient),
      user: session?.user ?? null,
      id: id,
      theme: theme,
      error: errorCode,
    },
  };
}

const OrganisationOverview: NextPageWithLayout<{
  id: string;
  user: User;
  theme: string;
  error?: number;
}> = ({ id, error }) => {
  const router = useRouter();
  const { returnUrl } = router.query;

  // 👇 use prefetched queries from server
  const { data: organisation } = useQuery<Organization>({
    queryKey: ["organisation", id],
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
        <title>{`Yoma Admin | ${organisation?.name || ""}`}</title>
      </Head>

      <PageBackground />

      <div className="z-10 container mt-20 max-w-5xl px-2 py-8">
        {/* BREADCRUMB */}
        <div className="flex flex-row text-xs text-white">
          <Link
            className="hover:text-gray flex items-center justify-center font-bold"
            href={getSafeUrl(returnUrl?.toString(), `/organisations`)}
          >
            <IoMdArrowRoundBack className="mr-2 inline-block h-4 w-4" />
            Organisations
          </Link>
          <div className="mx-2 font-bold">|</div>

          <span className="max-w-[600px] overflow-hidden text-ellipsis whitespace-nowrap">
            Edit
          </span>
        </div>

        {/* LOGO/TITLE */}
        <LogoTitle logoUrl={organisation?.logoURL} title={organisation?.name} />

        {/* CONTENT */}
        <div className="flex flex-col items-center">
          <div className="flex w-full flex-col gap-2 rounded-lg bg-white p-8 shadow-lg lg:w-[600px]">
            <OrgOverview organisation={organisation} />
          </div>
        </div>

        {/* BUTTONS */}
        {organisation?.status !== "Deleted" && (
          <div className="my-4 flex items-center justify-center gap-2">
            <Link
              href={`/organisations/${id}/edit${
                returnUrl
                  ? `?returnUrl=${encodeURIComponent(returnUrl.toString())}`
                  : ``
              }`}
              type="button"
              className="bg-theme btn btn-wide text-white"
            >
              Edit Details
            </Link>
          </div>
        )}
      </div>
    </>
  );
};

OrganisationOverview.getLayout = function getLayout(page: ReactElement) {
  return <MainLayout>{page}</MainLayout>;
};

// 👇 return theme from component properties. this is set server-side (getServerSideProps)
OrganisationOverview.theme = function getTheme(
  page: ReactElement<{ theme: string }>,
) {
  return page.props.theme;
};

export default OrganisationOverview;
