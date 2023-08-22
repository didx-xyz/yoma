import withBundleAnalyzer from "@next/bundle-analyzer";
import { withSentryConfig } from "@sentry/nextjs";
import withPWA from "next-pwa";

/** next-pwa config */
//  replace the default workbox strategy for nextjs to NetworkFirst
//  see https://github.com/vercel/next.js/discussions/42405
const pwa = withPWA({
  dest: "public",
  register: true,
  skipWaiting: true,
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
    // @ts-ignore
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    // @ts-ignore
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    // @ts-ignore
    KEYCLOAK_ISSUER: process.env.KEYCLOAK_ISSUER,
    // @ts-ignore
    KEYCLOAK_CLIENT_ID: process.env.KEYCLOAK_CLIENT_ID,
    // @ts-ignore
    KEYCLOAK_CLIENT_SECRET: process.env.KEYCLOAK_CLIENT_SECRET,
    // @ts-ignore
    API_BASE_URL: process.env.API_BASE_URL,
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
};

/** sentry config */
export default withSentryConfig(
  // @ts-ignore
  bundleAnalyzer(pwa(config)),
  {
    // For all available options, see:
    // https://github.com/getsentry/sentry-webpack-plugin#options

    // Suppresses source map uploading logs during build
    silent: true,

    org: "yoma-sp",
    project: "yoma-new-youth-webapp",
  },
  {
    // For all available options, see:
    // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

    // Upload a larger set of source maps for prettier stack traces (increases build time)
    widenClientFileUpload: true,

    // Transpiles SDK to be compatible with IE11 (increases bundle size)
    transpileClientSDK: true,

    // Routes browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers (increases server load)
    tunnelRoute: "/monitoring",

    // Hides source maps from generated client bundles
    hideSourceMaps: true,

    // Automatically tree-shake Sentry logger statements to reduce bundle size
    disableLogger: true,
  },
);
