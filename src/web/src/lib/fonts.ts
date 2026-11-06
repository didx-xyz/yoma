import localFont from "next/font/local";

// The site's two font families, as CSS variables. `_app` puts them on `#mainContent`;
// `CustomModal` puts them on its portal root too, which sits outside `#mainContent` on
// `<body>` and otherwise fell back to the system font (2026-10-21).
//
// Self-hosted (variable, Latin subset, from Fontsource; OFL licences beside the files) so the
// image build never fetches from Google: `next/font/google` failed the master web build when
// the fetch did (2026-11-05). Each file covers the whole weight range below.
export const openSans = localFont({
  src: "../assets/fonts/open-sans-latin-wght.woff2",
  variable: "--font-open-sans",
  display: "swap",
  weight: "300 800",
});

export const nunito = localFont({
  src: "../assets/fonts/nunito-latin-wght.woff2",
  variable: "--font-nunito",
  display: "swap",
  weight: "200 1000",
});
