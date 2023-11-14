import Head from "next/head";
import type { ReactElement } from "react";
import MainLayout from "~/components/Layout/Main";
import { UnderConstruction } from "~/components/Status/UnderConstruction";
import type { NextPageWithLayout } from "~/pages/_app";

const AdminOpportunities: NextPageWithLayout = () => {
  return (
    <>
      <Head>
        <title>Yoma | Admin Connections</title>
      </Head>
      <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16">
        <UnderConstruction />
      </div>
    </>
  );
};

AdminOpportunities.getLayout = function getLayout(page: ReactElement) {
  return <MainLayout>{page}</MainLayout>;
};

export default AdminOpportunities;
