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
import analytics from "./analytics";
import { addRumGlobalContext, trackError as ddTrackError } from "./datadog";

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

        // 📊 ANALYTICS: Track session state for API requests
        if (session) {
          addRumGlobalContext("api.authenticated", true);
          addRumGlobalContext("api.user_id", session.user?.id || "unknown");
        } else {
          addRumGlobalContext("api.authenticated", false);
        }
      }

      if (lastSession) {
        request.headers.Authorization = `Bearer ${lastSession.accessToken}`;
      } else {
        request.headers.Authorization = undefined;

        // 📊 ANALYTICS: Track unauthenticated API requests
        analytics.trackEvent("api_unauthenticated_request", {
          url: request.url || "unknown",
          method: request.method?.toUpperCase() || "unknown",
        });
      }

      return request;
    },
    (error) => {
      console.error(`API Error: `, error);

      // 📊 ANALYTICS: Track request setup errors
      analytics.trackError(error, {
        errorType: "api_request_setup_error",
        url: error.config?.url || "unknown",
        method: error.config?.method?.toUpperCase() || "unknown",
      });

      throw error;
    },
  );

  //* Intercept requests/responses for NProgress
  instance.interceptors.request.use((config) => {
    NProgress.start();

    // 📊 ANALYTICS: Add request start time for performance tracking
    (config as any).requestStartTime = Date.now();

    // Start a timeout that will show a "slow network" message after timeout
    if (!slowNetworkMessageDismissed) {
      const timeoutId = setTimeout(() => {
        // 📊 ANALYTICS: Track slow network warning
        analytics.trackEvent("api_slow_network_warning", {
          url: config.url || "unknown",
          method: config.method?.toUpperCase() || "unknown",
          timeout: SLOW_NETWORK_MESSAGE_TIMEOUT,
        });

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

      // 📊 ANALYTICS: Track API performance
      const requestStartTime = (response.config as any).requestStartTime;
      if (requestStartTime) {
        const responseTime = Date.now() - requestStartTime;

        // Track API performance metrics
        analytics.trackEvent("api_request_completed", {
          url: response.config.url || "unknown",
          method: response.config.method?.toUpperCase() || "unknown",
          statusCode: response.status,
          responseTime: responseTime,
          isSlowRequest: responseTime > 3000, // Flag requests over 3 seconds
        });

        // Add performance context to DataDog RUM
        addRumGlobalContext("api.last_response_time", responseTime);
        addRumGlobalContext("api.last_status", response.status);
      }

      return response;
    },
    async (error) => {
      NProgress.done();

      // Clear the timeout when the request fails
      if (error.config?.timeoutId) {
        clearTimeout(error.config.timeoutId);
      }

      // 📊 ANALYTICS: Track API errors
      const requestStartTime = error.config?.requestStartTime;
      const responseTime = requestStartTime
        ? Date.now() - requestStartTime
        : undefined;

      const errorContext = {
        url: error.config?.url || "unknown",
        method: error.config?.method?.toUpperCase() || "unknown",
        statusCode: error.response?.status || 0,
        errorCode: error.code || "unknown",
        errorMessage: error.message || "unknown",
        responseTime: responseTime,
        isTimeout: error.code === "ECONNABORTED",
        isNetworkError: !error.response,
        is401: error.response?.status === 401,
        is5xx: error.response?.status >= 500,
      };

      // Track different types of API errors
      if (error.response?.status === 401) {
        analytics.trackEvent("api_authentication_error", errorContext);
      } else if (error.response?.status >= 500) {
        analytics.trackEvent("api_server_error", errorContext);
      } else if (error.code === "ECONNABORTED") {
        analytics.trackEvent("api_timeout_error", errorContext);
      } else if (!error.response) {
        analytics.trackEvent("api_network_error", errorContext);
      } else {
        analytics.trackEvent("api_client_error", errorContext);
      }

      // Track error in DataDog RUM with rich context
      ddTrackError(error, {
        errorType: "api_error",
        ...errorContext,
      });

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
          // 📊 ANALYTICS: Track token refresh attempt
          analytics.trackEvent("api_token_refresh_attempt", {
            url: originalRequest.url || "unknown",
            method: originalRequest.method?.toUpperCase() || "unknown",
          });

          // Force a session refresh
          const newSession = await getSession();

          if (newSession?.accessToken) {
            // 📊 ANALYTICS: Track successful token refresh
            analytics.trackEvent("api_token_refresh_success", {
              url: originalRequest.url || "unknown",
              method: originalRequest.method?.toUpperCase() || "unknown",
            });

            // Update the Authorization header for the original request
            originalRequest.headers.Authorization = `Bearer ${newSession.accessToken}`;
            lastSession = newSession;

            processQueue(null, newSession.accessToken);

            // Retry the original request
            return instance(originalRequest);
          } else {
            // 📊 ANALYTICS: Track token refresh failure - no valid session
            analytics.trackEvent("api_token_refresh_failed", {
              url: originalRequest.url || "unknown",
              method: originalRequest.method?.toUpperCase() || "unknown",
              reason: "no_valid_session",
            });

            // No valid session, let the error through
            processQueue(error, null);
            return Promise.reject(error);
          }
        } catch (refreshError) {
          // 📊 ANALYTICS: Track token refresh failure - error occurred
          analytics.trackEvent("api_token_refresh_failed", {
            url: originalRequest.url || "unknown",
            method: originalRequest.method?.toUpperCase() || "unknown",
            reason: "refresh_error",
            refreshError:
              refreshError instanceof Error ? refreshError.message : "unknown",
          });

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
        // 📊 ANALYTICS: Track network timeout with user notification
        analytics.trackEvent("api_network_timeout_user_notified", {
          url: error.config?.url || "unknown",
          method: error.config?.method?.toUpperCase() || "unknown",
          timeout: SLOW_NETWORK_ABORT_TIMEOUT,
        });

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
