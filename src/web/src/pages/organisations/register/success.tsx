import { type ReactElement } from "react";
import MainLayout from "~/components/Layout/Main";
import { type NextPageWithLayout } from "~/pages/_app";
import Link from "next/link";
import { type GetServerSidePropsContext } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "~/server/auth";
import {
  ROLE_ADMIN,
  THEME_BLUE,
  ROLE_ORG_ADMIN,
  THEME_GREEN,
  THEME_PURPLE,
} from "~/lib/constants";

// ⚠️ SSR
export async function getServerSideProps(context: GetServerSidePropsContext) {
  const session = await getServerSession(context.req, context.res, authOptions);

  // 👇 ensure authenticated
  if (!session) {
    return {
      props: {
        error: "Unauthorized",
      },
    };
  }

  // 👇 set theme based on role
  let theme;

  if (session?.user?.roles.includes(ROLE_ADMIN)) {
    theme = THEME_BLUE;
  } else if (session?.user?.roles.includes(ROLE_ORG_ADMIN)) {
    theme = THEME_GREEN;
  } else {
    theme = THEME_PURPLE;
  }

  return {
    props: {
      user: session?.user ?? null,
      theme: theme,
    },
  };
}

const Success: NextPageWithLayout = () => {
  return (
    <div className="bg-theme flex justify-center md:w-screen">
      <div className="container my-auto max-w-md md:w-[28rem]">
        <div className="flex flex-col place-items-center justify-center rounded-xl bg-white p-6 text-center md:p-12">
          <div className="flex h-[48px] w-[48px] items-center justify-center rounded-full bg-white shadow-lg">
            🚀
          </div>
          <h4 className="font-semibold">
            Your application has been
            <br /> successfully submitted
          </h4>
          <p className="p-4 text-sm">
            Once approved, we&apos;ll send you a notification to let you know.
          </p>
          <p className="text-sm">
            Please note this process might take up to <b>48 hours</b>.
          </p>
          <Link href="/">
            <button className="font-sm btn border-green text-green hover:bg-green mt-8 w-[17rem] bg-white normal-case hover:text-white md:w-[21.5rem]">
              Take me home
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
};

Success.getLayout = function getLayout(page: ReactElement) {
  return <MainLayout>{page}</MainLayout>;
};

// 👇 return theme from component properties. this is set server-side (getServerSideProps)
Success.theme = function getTheme(page: ReactElement<{ theme: string }>) {
  return page.props.theme;
};

export default Success;
