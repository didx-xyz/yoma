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

// Flag to prevent multiple refresh attempts
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: any) => void;
  reject: (error: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });

  failedQueue = [];
};

// Axios instance for client-side requests
const ApiClient = async () => {
  if (!apiBaseUrl) {
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
    async (error) => {
      NProgress.done();

      // Clear the timeout when the request fails
      if (error.config?.timeoutId) {
        clearTimeout(error.config.timeoutId);
      }

      const originalRequest = error.config;

      // Handle 401 errors by attempting to refresh the session
      if (error.response?.status === 401 && !originalRequest._retry) {
        if (isRefreshing) {
          // If already refreshing, queue this request
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          })
            .then(() => {
              // Retry the original request with potentially new token
              return instance(originalRequest);
            })
            .catch((err) => {
              return Promise.reject(err);
            });
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
          // Force a session refresh
          const newSession = await getSession();

          if (newSession?.accessToken) {
            // Update the Authorization header for the original request
            originalRequest.headers.Authorization = `Bearer ${newSession.accessToken}`;
            lastSession = newSession;

            processQueue(null, newSession.accessToken);

            // Retry the original request
            return instance(originalRequest);
          } else {
            // No valid session, let the error through
            processQueue(error, null);
            return Promise.reject(error);
          }
        } catch (refreshError) {
          processQueue(refreshError, null);
          return Promise.reject(error);
        } finally {
          isRefreshing = false;
        }
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
