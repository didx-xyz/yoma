import {
  QueryClient,
  QueryClientProvider,
  HydrationBoundary,
} from "@tanstack/react-query";
import { Provider } from "jotai";
import type { NextPage } from "next";
import { type Session } from "next-auth";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import type { AppProps } from "next/app";
import { Open_Sans } from "next/font/google";
import { useRouter } from "next/router";
import type { ReactElement, ReactNode } from "react";
import { useState } from "react";
import ReactModal from "react-modal";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Navbar } from "~/components/NavBar/Navbar";
import { Global } from "~/components/Global";
import ConfirmationModalContextProvider from "~/context/modalConfirmationContext";
import { config } from "~/lib/react-query-config";
import "~/styles/globals.scss";
import "~/styles/FileUpload.css";
import { THEME_PURPLE } from "~/lib/constants";
import { GoogleAnalytics } from "~/components/GoogleAnalytics";
import "~/styles/embla.css";
import Router from "next/router";
import NProgress from "nprogress";
import "nprogress/nprogress.css";

// configure font for tailwindcss
// see https://nextjs.org/docs/pages/building-your-application/optimizing/fonts
const openSans = Open_Sans({
  subsets: ["latin"],
  variable: "--font-open-sans",
});

// Make sure to bind modal to your appElement (https://reactcommunity.org/react-modal/accessibility/)
// needed so screen readers don't see main content when modal is opened
try {
  ReactModal.setAppElement("#mainContent");
} catch (e) {}

//#region Configure NProgress
NProgress.configure({ showSpinner: false });

// Bind Router Events
Router.events.on("routeChangeStart", () => NProgress.start());
Router.events.on("routeChangeComplete", () => NProgress.done());
Router.events.on("routeChangeError", () => NProgress.done());

//#endregion Configure NProgress

export type NextPageWithLayout<P = object, IP = P> = NextPage<P, IP> & {
  getLayout?: (page: ReactElement) => ReactNode;
  theme?: (page: ReactElement) => string;
};

type AppPropsWithLayout<P> = AppProps<P> & {
  Component: NextPageWithLayout<P>;
};

const MyApp = ({
  Component,
  pageProps,
}: AppPropsWithLayout<{ session: Session; dehydratedState: object }>) => {
  // see https://flaviocopes.com/nextjs-refresh-state-navigation/
  // when the state of a component is not refreshed when navigating between pages
  const router = useRouter();

  // This ensures that data is not shared
  // between different users and requests
  const [queryClient] = useState(() => new QueryClient(config));

  const component = <Component {...pageProps} key={router.asPath} />;

  // Use the layout defined at the page level, if available
  const getLayout = Component.getLayout ?? ((page) => page);

  // get theme from component properties if available
  const getTheme = Component.theme ?? (() => THEME_PURPLE);
  const theme =
    getTheme != null && getTheme != undefined
      ? getTheme(component)
      : THEME_PURPLE;

  return (
    <Provider>
      <SessionProvider session={pageProps.session}>
        <ThemeProvider enableSystem={false} forcedTheme={theme}>
          <QueryClientProvider client={queryClient}>
            {/* eslint-disable-next-line */}
            <HydrationBoundary state={pageProps.dehydratedState}>
              <div
                id="mainContent"
                className={`${openSans.variable} font-openSans`}
              >
                <ConfirmationModalContextProvider>
                  <Global />
                  <Navbar />
                  {getLayout(component)}
                  <ToastContainer
                    containerId="toastContainer"
                    bodyClassName={"test1"}
                    toastClassName={"test2"}
                    className="mt-16 w-full md:mt-10 md:w-[340px]"
                  />
                  <GoogleAnalytics />
                </ConfirmationModalContextProvider>
              </div>
            </HydrationBoundary>
          </QueryClientProvider>
        </ThemeProvider>
      </SessionProvider>
    </Provider>
  );
};

export default MyApp;
