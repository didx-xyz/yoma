import { Head, Html, Main, NextScript } from "next/document";
import Script from "next/script";

export default function Document() {
  return (
    <Html lang="en" data-theme="light">
      <Head>
        <meta
          name="description"
          content="The Yoma platform enables you to build and transform your future by unlocking your hidden potential. Make a difference, earn rewards and build your CV by taking part in our impact challenges."
        />
        <link rel="icon" href="/favicon.ico" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icon.png"></link>
        <meta name="theme-color" content="#fff" />

        {/* multi-lingual support */}
        {/* see: https://dev.to/valorsoftware/google-translate-customization-under-nextjs-h69 */}
        <Script src="/scripts/lang-config.js" strategy="beforeInteractive" />
        <Script src="/scripts/translation.js" strategy="beforeInteractive" />
        <Script
          src="//translate.google.com/translate_a/element.js?cb=TranslateInit"
          strategy="afterInteractive"
        />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
