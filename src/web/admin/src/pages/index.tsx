import Head from "next/head";
import Link from "next/link";
import type { ReactElement } from "react";
import MainLayout from "../components/Layout/Main";
import type { NextPageWithLayout } from "./_app";

const Home: NextPageWithLayout = () => {
  return (
    <>
      <Head>
        <title>Yoma Admin | Home</title>
      </Head>
      <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16">
        <h1 className="text-center">
          Welcome to the <span className="text-warning">Yoma</span>{" "}
          <span className="text-info">Admin Portal</span>
        </h1>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-8">
          <Link
            className="flex max-w-xs flex-col gap-4 rounded-xl bg-white p-4"
            href="/user/settings"
          >
            <h3 className="font-bold">User Settings →</h3>
            <div className="text-lgx">Update your user profile.</div>
          </Link>

          <Link
            className="flex max-w-xs flex-col gap-4 rounded-xl bg-white p-4"
            href="/organisations/search"
          >
            <h3 className="font-bold">View Organisations →</h3>
            <div className="text-lgx">View your organisations here.</div>
          </Link>
        </div>
      </div>
    </>
  );
};

Home.getLayout = function getLayout(page: ReactElement) {
  return <MainLayout>{page}</MainLayout>;
};

export default Home;
