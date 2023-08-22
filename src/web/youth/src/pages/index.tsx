import Link from "next/link";
import type { ReactElement } from "react";
import MainLayout from "../components/Layout/Main";
import type { NextPageWithLayout } from "./_app";

const Home: NextPageWithLayout = () => {
  return (
    <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16">
      <h1 className="text-center">
        Welcome to the <span className="text-warning">Yoma</span>
      </h1>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-8">
        <Link className="flex max-w-xs flex-col gap-4 rounded-xl bg-white p-4" href="/dashboard/opportunities">
          <h3 className="font-bold">Get started →</h3>
          <div className="text-lgx">Everything you need to administrate your opportunities.</div>
        </Link>
      </div>
    </div>
  );
};

Home.getLayout = function getLayout(page: ReactElement) {
  return <MainLayout>{page}</MainLayout>;
};

export default Home;
