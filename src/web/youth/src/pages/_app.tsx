import {
  Hydrate,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { Provider } from "jotai";
import type { NextPage } from "next";
import { type Session } from "next-auth";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import type { AppProps } from "next/app";
import { Open_Sans } from "next/font/google";
import type { ReactElement, ReactNode } from "react";
import { useState } from "react";
import ReactModal from "react-modal";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Navbar } from "~/components/NavBar/Navbar";
import { Global } from "~/components/global";
import ConfirmationModalContextProvider from "~/context/modalConfirmationContext";
import { config } from "~/lib/react-query-config";
import "~/styles/globals.scss";

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

export type NextPageWithLayout<P = object, IP = P> = NextPage<P, IP> & {
  getLayout?: (page: ReactElement) => ReactNode;
};

type AppPropsWithLayout<P> = AppProps<P> & {
  Component: NextPageWithLayout<P>;
};

const MyApp = ({
  Component,
  pageProps,
}: AppPropsWithLayout<{ session: Session; dehydratedState: object }>) => {
  // This ensures that data is not shared
  // between different users and requests
  const [queryClient] = useState(() => new QueryClient(config));

  // Use the layout defined at the page level, if available
  const getLayout = Component.getLayout ?? ((page) => page);

  return (
    <Provider>
      <SessionProvider session={pageProps.session}>
        <ThemeProvider
          attribute="class"
          enableSystem={false}
          forcedTheme="light"
        >
          <QueryClientProvider client={queryClient}>
            {/* eslint-disable-next-line */}
            <Hydrate state={pageProps.dehydratedState}>
              <div
                id="mainContent"
                className={`${openSans.variable} font-openSans`}
              >
                <ConfirmationModalContextProvider>
                  <Global />
                  <Navbar />

                  {getLayout(<Component {...pageProps} />)}

                  <ToastContainer
                    containerId="toastContainer"
                    className="mt-16 w-full md:mt-10 md:w-[340px]"
                  />
                </ConfirmationModalContextProvider>
              </div>
            </Hydrate>
          </QueryClientProvider>
        </ThemeProvider>
      </SessionProvider>
    </Provider>
  );
};

export default MyApp;
