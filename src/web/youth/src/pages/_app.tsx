import "@fontsource/open-sans"; // Defaults to weight 400
import "@fontsource/open-sans/400-italic.css"; // Specify weight and style
import "@fontsource/open-sans/400.css"; // Specify weight
import {
  Hydrate,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import type { NextPage } from "next";
import { ThemeProvider } from "next-themes";
import type { AppProps } from "next/app";
import { type AppType } from "next/app";
import type { ReactElement, ReactNode } from "react";
import { useState } from "react";
import ReactModal from "react-modal";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ConfirmationModalContextProvider from "~/core/modalConfirmationContext";
import { config } from "~/lib/react-query-config";
import "~/styles/globals.scss";

// Make sure to bind modal to your appElement (https://reactcommunity.org/react-modal/accessibility/)
// needed so screen readers don't see main content when modal is opened
try {
  ReactModal.setAppElement("#mainContent");
} catch (e) {}

export type NextPageWithLayout<P = object, IP = P> = NextPage<P, IP> & {
  getLayout?: (page: ReactElement) => ReactNode;
};

type AppPropsWithLayout = AppProps & {
  Component: NextPageWithLayout;
};

const MyApp: AppType<object> = ({
  Component,
  pageProps,
}: AppPropsWithLayout) => {
  // This ensures that data is not shared
  // between different users and requests
  const [queryClient] = useState(() => new QueryClient(config));

  // Use the layout defined at the page level, if available
  const getLayout = Component.getLayout ?? ((page) => page);

  return getLayout(
    <ThemeProvider attribute="class" enableSystem={false} forcedTheme="light">
      <QueryClientProvider client={queryClient}>
        {/* eslint-disable-next-line */}
        <Hydrate state={pageProps.dehydratedState}>
          <ConfirmationModalContextProvider>
            <div id="mainContent">
              <Component {...pageProps} />
            </div>
            <ToastContainer
              containerId="toastContainer"
              className="mt-16 w-full md:mt-10 md:w-[340px]"
            />
          </ConfirmationModalContextProvider>
        </Hydrate>
      </QueryClientProvider>
    </ThemeProvider>,
  );
};

export default MyApp;
