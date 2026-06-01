import { useEffect, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import PrivacySection from "~/components/Terms/PrivacySection";
import TermsSection from "~/components/Terms/TermsSection";
import type { NextPageWithLayout } from "./_app";
import MainLayout from "~/components/Layout/Main";

const Terms: NextPageWithLayout = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"privacy" | "terms">("terms");

  // Sync tab from ?tab= query param on load/navigation
  useEffect(() => {
    if (!router.isReady) return;
    const tab = router.query.tab;
    if (tab === "privacy" || tab === "terms") {
      setActiveTab(tab);
    }
  }, [router.isReady, router.query.tab]);

  const handleTabClick = (tab: "privacy" | "terms") => {
    setActiveTab(tab);
    void router.replace({ query: { tab } }, undefined, { shallow: true });
  };

  return (
    <div className="container mx-auto mt-20 px-4 py-8 md:max-w-7xl">
      <Head>
        <title>Yoma - Terms of Service &amp; Privacy Policy</title>
      </Head>

      <div className="border-gray flex justify-center border-b md:justify-start">
        <button
          type="button"
          className={`grow cursor-pointer px-4 py-2 text-center text-sm md:grow-0 md:text-base ${
            activeTab === "terms"
              ? "border-orange border-b-4 font-semibold text-black"
              : "text-gray-dark"
          }`}
          onClick={() => handleTabClick("terms")}
        >
          Terms of Service
        </button>
        <button
          type="button"
          className={`grow cursor-pointer px-4 py-2 text-center text-sm md:grow-0 md:text-base ${
            activeTab === "privacy"
              ? "border-orange border-b-4 font-semibold text-black"
              : "text-gray-dark"
          }`}
          onClick={() => handleTabClick("privacy")}
        >
          Privacy Policy
        </button>
      </div>

      <div className="md:shadow-custom flex flex-col rounded-lg">
        {activeTab === "terms" && (
          <div className="md:shadow-custom my-8xx flex flex-col rounded-lg p-4 md:p-8">
            <TermsSection />
          </div>
        )}

        {activeTab === "privacy" && (
          <div className="md:shadow-custom my-8xx flex flex-col rounded-lg p-4 md:p-8">
            <PrivacySection />
          </div>
        )}
      </div>
    </div>
  );
};

Terms.getLayout = function getLayout(page) {
  return <MainLayout>{page}</MainLayout>;
};

export default Terms;
