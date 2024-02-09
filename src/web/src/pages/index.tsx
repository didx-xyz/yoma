/* eslint-disable */
import { QueryClient, dehydrate } from "@tanstack/react-query";
import { type GetServerSidePropsContext } from "next";
import { getServerSession } from "next-auth";
import { type ReactElement } from "react";
import "react-datepicker/dist/react-datepicker.css";
import MainLayout from "~/components/Layout/Main";
import { authOptions, type User } from "~/server/auth";
import { NextPageWithLayout } from "./_app";
import iconRocket from "public/images/icon-rocket.webp";
import Link from "next/link";
import { config } from "~/lib/react-query-config";
import { PageBackground } from "~/components/PageBackground";
import { RoundedImage } from "~/components/RoundedImage";

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const queryClient = new QueryClient(config);
  const session = await getServerSession(context.req, context.res, authOptions);

  return {
    props: {
      dehydratedState: dehydrate(queryClient),
      user: session?.user ?? null,
    },
  };
}

// NB: this a placeholder page for the home page
const Home: NextPageWithLayout<{
  id: string;
  user: User;
}> = () => {
  return (
    <>
      <PageBackground />

      <div className="card my-auto mt-40 flex min-h-[45%] min-w-[38%] flex-col items-center justify-center gap-4 bg-white p-10">
        <RoundedImage
          icon={iconRocket}
          alt="Icon Rocket"
          imageWidth={28}
          imageHeight={28}
        />

        <h2 className="mt-2 font-semibold">Design Pending</h2>
        <p className="mb-12 text-[#545859]">Coming soon ;&#41;</p>
        <div className="card flex h-44 w-full justify-center bg-slate-100 p-4 text-center">
          <p className="font-bold">
            We want to enable organisations to sign up easily.
          </p>
          <p className="mb-6 text-[#545859]">
            Button prompting creation could be present.
          </p>
          <Link href="/organisations/register">
            <button className="btn btn-primary mx-auto w-60 rounded-3xl capitalize">
              Register Organisation
            </button>
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
/* eslint-enable */
