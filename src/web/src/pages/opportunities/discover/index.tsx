import Head from "next/head";
import type { ReactElement } from "react";
import React from "react";
import MainLayout from "~/components/Layout/Main";
import { DiscoverySurface } from "~/features/discovery/components/Discover/DiscoverySurface";
import { DiscoveryProvider } from "~/features/discovery/state/DiscoveryContext";
import type { NextPageWithLayout } from "~/pages/_app";

/**
 * The new discovery surface (YOM-1261 / YOM-1262) — built alongside the existing
 * `/opportunities` page, not on top of it; retiring the old surface is a separate change.
 * Shell only: all state lives in the URL via `DiscoveryProvider`, all behaviour in
 * `features/discovery`.
 */
const OpportunitiesDiscover: NextPageWithLayout = () => (
  <>
    <Head>
      <title>Yoma | Discover opportunities</title>
    </Head>
    <DiscoveryProvider>
      <DiscoverySurface />
    </DiscoveryProvider>
  </>
);

OpportunitiesDiscover.getLayout = function getLayout(page: ReactElement) {
  return <MainLayout>{page}</MainLayout>;
};

export default OpportunitiesDiscover;
