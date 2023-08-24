import Link from "next/link";
import type { ReactElement } from "react";
import MainLayout from "~/components/Layout/Main";
import { NextPageWithLayout } from "../_app";

const About: NextPageWithLayout = () => {
  return (
    <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16">
      <h1 className="text-center">About</h1>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-8">
        <Link className="flex max-w-xs flex-col gap-4 rounded-xl bg-white p-4" href="/partner">
          <h3 className="font-bold">Register Organisation →</h3>
          <div className="text-lgx">
            Register your organisation and Be a part of Yoma's global collaborative marketplace focussed on closing the
            skills gap for the youth across the Globe now!
          </div>
        </Link>
      </div>
    </div>
  );
};

About.getLayout = function getLayout(page: ReactElement) {
  return <MainLayout>{page}</MainLayout>;
};

export default About;
