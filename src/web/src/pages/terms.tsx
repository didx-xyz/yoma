import Head from "next/head";
import TermsSection from "~/components/Terms/TermsSection";
import type { NextPageWithLayout } from "./_app";
import MainLayout from "~/components/Layout/Main";

const Terms: NextPageWithLayout = () => {
  return (
    <div className="container mx-auto mt-20 px-4 py-8 md:max-w-7xl">
      <Head>
        <title>Yoma - Terms of Service</title>
      </Head>

      <div className="md:shadow-custom flex flex-col rounded-lg md:p-8">
        <TermsSection />
      </div>
    </div>
  );
};

Terms.getLayout = function getLayout(page) {
  return <MainLayout>{page}</MainLayout>;
};

export default Terms;
