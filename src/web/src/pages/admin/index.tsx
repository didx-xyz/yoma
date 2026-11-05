import { type GetServerSidePropsContext } from "next";
import { getServerSession } from "next-auth";
import Head from "next/head";
import type { ReactElement } from "react";
import MainLayout from "~/components/Layout/Main";
import type { NextPageWithLayout } from "../_app";
import { Unauthenticated } from "~/components/Status/Unauthenticated";
import { Unauthorized } from "~/components/Status/Unauthorized";
import { UnderConstruction } from "~/components/Status/UnderConstruction";
import { ROLE_ADMIN, THEME_BLUE } from "~/lib/constants";
import { authOptions } from "~/server/auth";

// ⚠️ SSR: Admin only, like every other /admin page
export async function getServerSideProps(context: GetServerSidePropsContext) {
  const session = await getServerSession(context.req, context.res, authOptions);
  if (!session) return { props: { error: 401 } };
  if (!session.user?.roles.includes(ROLE_ADMIN))
    return { props: { error: 403 } };
  return { props: { error: null } };
}

const AdminHome: NextPageWithLayout<{ error?: number | null }> = ({
  error,
}) => {
  if (error === 401) return <Unauthenticated />;
  if (error === 403) return <Unauthorized />;

  return (
    <>
      <Head>
        <title>Yoma | Admin</title>
      </Head>
      <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16">
        <UnderConstruction />
      </div>
    </>
  );
};

AdminHome.getLayout = function getLayout(page: ReactElement) {
  return <MainLayout>{page}</MainLayout>;
};

AdminHome.theme = function getTheme() {
  return THEME_BLUE;
};

export default AdminHome;
