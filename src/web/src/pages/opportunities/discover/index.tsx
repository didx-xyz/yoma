import Head from "next/head";
import type { ReactElement } from "react";
import React from "react";
import MainLayout from "~/components/Layout/Main";
import { DiscoverySurface } from "~/features/discovery/components/Discover/DiscoverySurface";
import { DiscoveryProvider } from "~/features/discovery/state/DiscoveryContext";
import { CUSTOM_FIELDS_ENABLED } from "~/lib/constants";
import type { NextPageWithLayout } from "~/pages/_app";

/**
 * The new discovery surface (YOM-1261 / YOM-1262) — built alongside the existing
 * `/opportunities` page, not on top of it; retiring the old surface is a separate change.
 * Shell only: all state lives in the URL via `DiscoveryProvider`, all behaviour in
 * `features/discovery`.
 */

/**
 * The whole surface goes with the framework: it is the preset-driven prototype, and its
 * preferences are mocked with no API behind them (YOM-1257 / YOM-1258).
 *
 * `getStaticProps` rather than `getServerSideProps` so the route stays statically optimized when
 * the flag is on — the flag is a build-time constant, so whether this page exists is known at
 * build time. `notFound` serves the standard 404 rather than a placeholder: the only link into
 * here from outside the feature is the user menu's "My preferences", which is hidden by the same
 * flag, so with it off the route is unreachable rather than merely empty.
 */
export function getStaticProps() {
  if (!CUSTOM_FIELDS_ENABLED) return { notFound: true as const };
  return { props: {} };
}
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
