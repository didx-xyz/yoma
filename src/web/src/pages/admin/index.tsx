import Head from "next/head";
import type { ReactElement } from "react";
import MainLayout from "~/components/Layout/Main";
import type { NextPageWithLayout } from "../_app";
import { UnderConstruction } from "~/components/Status/UnderConstruction";
import { THEME_BLUE } from "~/lib/constants";

const AdminHome: NextPageWithLayout = () => {
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

AdminHome.theme = THEME_BLUE;

export default AdminHome;
