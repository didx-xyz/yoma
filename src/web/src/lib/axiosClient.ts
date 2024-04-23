import axios from "axios";
import { type Session } from "next-auth";
import { getSession } from "next-auth/react";
import { fetchClientEnv } from "./utils";
import NProgress from "nprogress";
import { toast } from "react-toastify";
import {
  SLOW_NETWORK_ABORT_TIMEOUT,
  SLOW_NETWORK_MESSAGE_TIMEOUT,
} from "./constants";

let apiBaseUrl = "";

// state for slow network messages
let slowNetworkMessageDismissed = false;
let slowNetworkAbortDismissed = false;

// Axios instance for client-side requests
const ApiClient = async () => {
  if (!apiBaseUrl) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    apiBaseUrl = ((await fetchClientEnv()).NEXT_PUBLIC_API_BASE_URL ||
      "") as string;
  }
  const instance = axios.create({
    baseURL: apiBaseUrl,
    timeout: SLOW_NETWORK_ABORT_TIMEOUT,
    timeoutErrorMessage: "Network is slow. Please check your connection.",
  });

  let lastSession: Session | null = null;

  //* Intercept requests to add the session token
  instance.interceptors.request.use(
    async (request) => {
      if (lastSession == null || Date.now() > Date.parse(lastSession.expires)) {
        const session = await getSession();
        lastSession = session;
      }

      if (lastSession) {
        request.headers.Authorization = `Bearer ${lastSession.accessToken}`;
      } else {
        request.headers.Authorization = undefined;
      }

      return request;
    },
    (error) => {
      console.error(`API Error: `, error);
      throw error;
    },
  );

  //* Intercept requests/responses for NProgress
  instance.interceptors.request.use((config) => {
    NProgress.start();

    // Start a timeout that will show a "slow network" message after timeout
    if (!slowNetworkMessageDismissed) {
      const timeoutId = setTimeout(() => {
        toast.warn(
          "Your request is taking longer than usual. Please check your connection.",
          {
            toastId: "network-slow",
            autoClose: 3000,
            onClick: () => {
              slowNetworkMessageDismissed = true;
              toast.dismiss("network-slow");
            },
          },
        );
      }, SLOW_NETWORK_MESSAGE_TIMEOUT);

      // Attach the timeoutId to the config so we can access it in the response interceptor
      (config as any).timeoutId = timeoutId;
    }

    return config;
  });

  instance.interceptors.response.use(
    (response) => {
      NProgress.done();

      // Clear the timeout when the request completes
      if ((response.config as any).timeoutId) {
        clearTimeout((response.config as any).timeoutId);
      }

      return response;
    },
    (error) => {
      NProgress.done();

      // Clear the timeout when the request fails
      if (error.config.timeoutId) {
        clearTimeout(error.config.timeoutId);
      }

      if (
        error.code === "ECONNABORTED" &&
        slowNetworkAbortDismissed === false
      ) {
        toast.error("Network is slow. Please check your connection.", {
          toastId: "network-slow-error",
          autoClose: false,
          onClick: () => {
            slowNetworkAbortDismissed = true;
            toast.dismiss("network-slow-error");
          },
        });
      }

      return Promise.reject(error);
    },
  );

  return instance;
};

export default ApiClient();
