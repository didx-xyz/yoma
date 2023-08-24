import Head from "next/head";
import type { ReactElement } from "react";

export type LayoutProps = ({
  children,
}: {
  children: ReactElement;
}) => ReactElement;

const MainLayout: LayoutProps = ({ children }) => {
  return (
    <>
      <Head>
        <title>Yoma | Unlock Your Future</title>
        <meta name="viewport" content="initial-scale=1, width=device-width" />
        <meta
          name="description"
          content="The Yoma platform enables you to build and transform your future by unlocking your hidden potential. Make a difference, earn rewards and build your CV by taking part in our impact challenges."
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="flex min-h-screen justify-center bg-gray-light p-4 pt-20 xl:pt-32">
        {children}
      </main>
      {/* <Footer /> */}
    </>
  );
};

export default MainLayout;
