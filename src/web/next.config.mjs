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
    ],
  },

  /**
   * Use sub-path routing for i18n
   *
   * @see https://nextjs.org/docs/pages/building-your-application/routing/internationalization
   */
  i18n: {
    defaultLocale: "en",
    locales: ["en", "es", "fr", "pt", "sw"],
  },
  localePath: "./public/locales",
  reloadOnPrerender: process.env.NODE_ENV === "development",
  trailingSlash: true,

  // silence client-side warnings about legacy JS API
  // https://github.com/vercel/next.js/issues/71638
  sassOptions: {
    silenceDeprecations: ["legacy-js-api"],
  },

  async rewrites() {
    return [
      {
        source: "/auth/:path*",
        destination: `https://${process.env.KEYCLOAK_HOSTNAME}/auth/:path*`,
      },
    ];
  },
};

// @ts-expect-error - Type mismatch between bundleAnalyzer/pwa HOCs and Next.js config
export default bundleAnalyzer(pwa(config));
