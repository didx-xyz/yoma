import { Nunito, Open_Sans } from "next/font/google";

// The site's two `next/font` families, as CSS variables. `_app` puts them on `#mainContent`;
// `CustomModal` puts them on its portal root too, which sits outside `#mainContent` on
// `<body>` and otherwise fell back to the system font (2026-10-21).
export const openSans = Open_Sans({
  subsets: ["latin"],
  variable: "--font-open-sans",
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-nunito",
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});
