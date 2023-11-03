import Head from "next/head";
import Link from "next/link";
import type { ReactElement } from "react";
import MainLayout from "~/components/Layout/Main";
import type { NextPageWithLayout } from "../_app";

const AdminHome: NextPageWithLayout = () => {
  return (
    <>
      <Head>
        <title>Yoma | Admin</title>
      </Head>
      <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16">
        <h1 className="text-center">Admin</h1>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-8">
          <Link
            className="flex max-w-xs flex-col gap-4 rounded-xl bg-white p-4"
            href="/admin/schemas"
          >
            <h3 className="font-bold">Schemas →</h3>
            <div className="text-lgx">Manage schemas.</div>
          </Link>
        </div>
      </div>
    </>
  );
};

AdminHome.getLayout = function getLayout(page: ReactElement) {
  return <MainLayout>{page}</MainLayout>;
};

export default AdminHome;
