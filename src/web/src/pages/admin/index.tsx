import Head from "next/head";
import type { ReactElement } from "react";
import MainLayout from "~/components/Layout/Main";
import type { NextPageWithLayout } from "../_app";
import { UnderConstruction } from "~/components/Status/UnderConstruction";

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

export default AdminHome;
