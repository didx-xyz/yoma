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
    // @ts-ignore
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
   * If you have `experimental: { appDir: true }` set, then you must comment the below `i18n` config
   * out.
   *
   * @see https://github.com/vercel/next.js/issues/41980
   */
  i18n: {
    locales: ["en"],
    defaultLocale: "en",
  },

  // configure CDN
  // assetPrefix: "https://stage.yoma.cloudflare??" || "",
  // headers: async () => [
  //   {
  //     source: "/:all*(.png|.jpg|.jpeg|.gif|.svg)",
  //     headers: [
  //       {
  //         key: "Cache-Control",
  //         value: "public, max-age=31536000, must-revalidate",
  //       },
  //     ],
  //   },
  // ],
};

// @ts-ignore
// export default bundleAnalyzer(pwa(config));
export default bundleAnalyzer(config);
