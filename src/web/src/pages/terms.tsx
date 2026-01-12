import React, { useEffect, useState } from "react";
import Head from "next/head";
import PrivacySection from "~/components/Terms/PrivacySection";
import TermsSection from "~/components/Terms/TermsSection";
import type { NextPageWithLayout } from "./_app";
import MainLayout from "~/components/Layout/Main";

const Terms: NextPageWithLayout = () => {
  const [activeTab, setActiveTab] = useState<"privacy" | "terms">("privacy");

  const getTabFromHash = (hash: string) => {
    if (hash.startsWith("privacy") || hash.startsWith("privacy-")) {
      return "privacy" as const;
    }

    if (hash.startsWith("terms") || hash.startsWith("terms-")) {
      return "terms" as const;
    }

    return null;
  };

  const scrollToHash = () => {
    if (typeof window === "undefined") return;

    const id = window.location.hash.replace("#", "");
    if (!id) return;

    const el = document.getElementById(id);
    if (!el) return;

    el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  useEffect(() => {
    if (typeof window === "undefined") return;

    const applyHash = () => {
      const hash = window.location.hash.replace("#", "");
      if (!hash) return;

      const tab = getTabFromHash(hash);
      if (tab) {
        setActiveTab(tab);
        return;
      }
    };

    applyHash();
    window.addEventListener("hashchange", applyHash);
    return () => window.removeEventListener("hashchange", applyHash);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!window.location.hash) return;

    // If the hash refers to an anchor in the newly-visible tab, scroll after render.
    const timer = window.setTimeout(() => scrollToHash(), 0);
    return () => window.clearTimeout(timer);
  }, [activeTab]);

  const handleTabClick = (tab: "privacy" | "terms") => {
    setActiveTab(tab);
  };

  return (
    <div className="container mx-auto mt-20 px-4 py-8 md:max-w-7xl">
      <Head>
        <title>Yoma - Terms of Service &amp; Privacy Policy</title>
      </Head>

      <div className="border-gray flex justify-center border-b md:justify-start">
        <div
          className={`grow cursor-pointer px-4 py-2 text-center text-sm md:grow-0 md:text-base ${
            activeTab === "privacy"
              ? "border-orange border-b-4 font-semibold text-black"
              : "text-gray-dark"
          }`}
          onClick={() => handleTabClick("privacy")}
        >
          Privacy Policy
        </div>
        <div
          className={`grow cursor-pointer px-4 py-2 text-center text-sm md:grow-0 md:text-base ${
            activeTab === "terms"
              ? "border-orange border-b-4 font-semibold text-black"
              : "text-gray-dark"
          }`}
          onClick={() => handleTabClick("terms")}
        >
          Terms of Service
        </div>
      </div>

      <div className="mt-8">
        {activeTab === "privacy" && (
          <div className="md:shadow-custom my-8 flex flex-col rounded-lg md:p-8">
            <PrivacySection />
          </div>
        )}

        {activeTab === "terms" && (
          <div className="md:shadow-custom my-8 flex flex-col rounded-lg md:p-8">
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
