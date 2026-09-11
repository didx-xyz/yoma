import withBundleAnalyzer from "@next/bundle-analyzer";
import withPWA from "next-pwa";

const pwa = withPWA({
  dest: "public",
  register: true,
  skipWaiting: true,
  // disable prefetching of all assets
  // this prevents downloading all the precached resources when the site is visited for the first time
  runtimeCaching: [],
  publicExcludes: ["!**/*"], // like this
  buildExcludes: [() => true],
  cacheStartUrl: false,
});

/** bundleAnalyzer config */
const bundleAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

/** nextjs config */
/** @type {import("next").NextConfig} */
const config = {
  reactStrictMode: true,
  output: "standalone",

  /**NB: for docker-compose, this section is needed in order to pass the server environment variables
   * to nextjs (without using a .env file in the container)
   */
  env: {
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    KEYCLOAK_ISSUER: process.env.KEYCLOAK_ISSUER,
    KEYCLOAK_CLIENT_ID: process.env.KEYCLOAK_CLIENT_ID,
    KEYCLOAK_CLIENT_SECRET: process.env.KEYCLOAK_CLIENT_SECRET,
    API_BASE_URL: process.env.API_BASE_URL,
    MARKETPLACE_ENABLED: process.env.MARKETPLACE_ENABLED,
    NEXT_PUBLIC_PASSPORT_ENABLED: process.env.NEXT_PUBLIC_PASSPORT_ENABLED,
    NEXT_PUBLIC_REFERRALS_ENABLED: process.env.NEXT_PUBLIC_REFERRALS_ENABLED,
    NEXT_PUBLIC_DD_RUM_APP_ID: process.env.NEXT_PUBLIC_DD_RUM_APP_ID,
    NEXT_PUBLIC_DD_RUM_TOKEN: process.env.NEXT_PUBLIC_DD_RUM_TOKEN,
    NEXT_PUBLIC_DD_RUM_SESSION_SAMPLE_RATE:
      process.env.NEXT_PUBLIC_DD_RUM_SESSION_SAMPLE_RATE,
    NEXT_PUBLIC_DD_RUM_SESSION_REPLAY_SAMPLE_RATE:
      process.env.NEXT_PUBLIC_DD_RUM_SESSION_REPLAY_SAMPLE_RATE,
  },

  // allow S3 bucket images to be loaded from https
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "yoma-v3-public-storage.s3.eu-west-1.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "yoma-v3-private-storage.s3.eu-west-1.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "yoma-test-file-storage.s3.eu-west-1.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "s3-eu-west-1.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "substack-post-media.s3.amazonaws.com",
      },
    ],
  },

  /**
   * If you have `experimental: { appDir: true }` set, then you must comment the below `i18n` config
   * out.
   *
   * @see https://github.com/vercel/next.js/issues/41980
   */
  i18n: {
    locales: ["en"],
    defaultLocale: "en",
  },

  // silence client-side warnings about legacy JS API
  // https://github.com/vercel/next.js/issues/71638
  sassOptions: {
    silenceDeprecations: ["legacy-js-api"],
  },

  // NB: keep this the ONLY `rewrites` key — a duplicate key in this object literal silently
  // replaces the earlier one (that is how the dev proxy below was lost on first attempt).
  async rewrites() {
    return [
      {
        source: "/auth/:path*",
        destination: `https://${process.env.KEYCLOAK_HOSTNAME}/auth/:path*`,
      },
      /**
       * Dev only: same-origin proxy to the local API, for browsers whose policies block
       * cross-origin localhost hosts (e.g. managed/automation profiles that only allow the
       * app's own origin). Point NEXT_PUBLIC_API_BASE_URL at http://localhost:3000/api/proxy
       * in .env to use it. Absent outside development, so deployed builds are unaffected.
       */
      ...(process.env.NODE_ENV === "development"
        ? [
            {
              source: "/api/proxy/:path*",
              destination: "http://localhost:5000/api/v3/:path*",
            },
          ]
        : []),
    ];
  },
};

export default bundleAnalyzer(pwa(config));
