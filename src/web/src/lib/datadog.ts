import { datadogRum } from "@datadog/browser-rum";
import { fetchClientEnv } from "~/lib/utils";

// Extend the Window interface to include DD_RUM
declare global {
  interface Window {
    DD_RUM?: {
      getInitConfiguration(): unknown;
    };
  }
}

export const initializeDatadog = async () => {
  // Only initialize in the browser
  if (typeof window === "undefined") {
    return;
  }

  // Check if already initialized to prevent multiple initializations
  if (window.DD_RUM && window.DD_RUM.getInitConfiguration()) {
    return;
  }

  try {
    const env = await fetchClientEnv();

    // Only initialize if we have the required environment variables
    if (!env.NEXT_PUBLIC_DD_RUM_APP_ID || !env.NEXT_PUBLIC_DD_RUM_TOKEN) {
      console.warn(
        "DataDog RUM: Missing required environment variables. Skipping initialization.",
      );
      return;
    }

    datadogRum.init({
      applicationId: env.NEXT_PUBLIC_DD_RUM_APP_ID,
      clientToken: env.NEXT_PUBLIC_DD_RUM_TOKEN,
      site: "datadoghq.eu",
      service: "yoma-web",
      env: env.NEXT_PUBLIC_ENVIRONMENT,
      // Specify a version number to identify the deployed version of your application in Datadog
      // version: "1.0.0",
      sessionSampleRate: env.NEXT_PUBLIC_DD_RUM_SESSION_SAMPLE_RATE
        ? parseInt(env.NEXT_PUBLIC_DD_RUM_SESSION_SAMPLE_RATE, 10)
        : 100,
      sessionReplaySampleRate: env.NEXT_PUBLIC_DD_RUM_SESSION_REPLAY_SAMPLE_RATE
        ? parseInt(env.NEXT_PUBLIC_DD_RUM_SESSION_REPLAY_SAMPLE_RATE, 10)
        : 20,
      trackUserInteractions: true,
      trackResources: true,
      trackLongTasks: true,
      defaultPrivacyLevel: "mask-user-input",
      // Temporarily disable tracing to debug CORS header issues
      // allowedTracingUrls: env.NEXT_PUBLIC_API_BASE_URL
      //   ? [
      //       {
      //         match: `${env.NEXT_PUBLIC_API_BASE_URL}/`,
      //         propagatorTypes: ["tracecontext"],
      //       },
      //     ]
      //   : [],
    });

    console.log("DataDog RUM initialized successfully");
  } catch (error) {
    console.error("DataDog RUM initialization failed:", error);
  }
};
