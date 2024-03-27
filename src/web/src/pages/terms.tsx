import React, { useState } from "react";
import Head from "next/head";
import PrivacySection from "~/components/Terms/PrivacySection";
import TermsSection from "~/components/Terms/TermsSection";
import type { NextPageWithLayout } from "./_app";
import MainLayout from "~/components/Layout/Main";

const Terms: NextPageWithLayout = () => {
  const [activeTab, setActiveTab] = useState("privacy");

  const handleTabClick = (tab: string) => {
    setActiveTab(tab);
  };

  return (
    <div className="container mx-auto mt-20 px-4 py-8 md:max-w-7xl">
      <Head>
        <title>Yoma - Terms and Conditions</title>
      </Head>

      <div className="flex justify-center border-b border-gray md:justify-start">
        <div
          className={`flex-grow cursor-pointer px-4 py-2 text-center md:flex-grow-0 ${
            activeTab === "privacy"
              ? "border-b-4 border-orange font-semibold text-black"
              : "text-gray-dark"
          }`}
          onClick={() => handleTabClick("privacy")}
        >
          Privacy Policy
        </div>
        <div
          className={`flex-grow cursor-pointer px-4 py-2 text-center md:flex-grow-0 ${
            activeTab === "terms"
              ? "border-b-4 border-orange font-semibold text-black"
              : "text-gray-dark"
          }`}
          onClick={() => handleTabClick("terms")}
        >
          Terms of Use
        </div>
      </div>

      <div className="mt-8">
        {activeTab === "privacy" && (
          <div className="my-8 flex flex-col rounded-lg md:p-8 md:shadow-custom">
            <PrivacySection />
          </div>
        )}

        {activeTab === "terms" && (
          <div className="my-8 flex flex-col rounded-lg md:p-8 md:shadow-custom">
            <TermsSection />
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
