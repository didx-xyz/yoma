import { datadogRum } from "@datadog/browser-rum";
import { fetchClientEnv } from "~/lib/utils";
import type { User } from "~/server/auth";

// Local development flag
const isLocalDev =
  process.env.NODE_ENV === "development" ||
  (typeof window !== "undefined" && window.location.hostname === "localhost");

// Store local events for testing
let localEvents: Array<{
  type: "action" | "error" | "timing" | "user" | "context";
  name?: string;
  data: any;
  timestamp: number;
}> = [];

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

    // In local development, log instead of initializing DataDog
    if (isLocalDev) {
      console.log("🔧 LOCAL DEV: DataDog RUM initialization skipped");
      console.log("📊 Analytics events will be logged to console instead");
      setupLocalTesting();
      return;
    }

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
      allowedTracingUrls: env.NEXT_PUBLIC_API_BASE_URL
        ? [
            {
              match: `${env.NEXT_PUBLIC_API_BASE_URL}/`,
              propagatorTypes: ["tracecontext"],
            },
          ]
        : [],
      // Advanced configuration for better error tracking
      beforeSend: () => {
        // Custom logic to modify or filter events before sending
        // Return false to prevent the event from being sent
        return true;
      },
    });

    // Set up global error handlers for better browser error collection
    setupBrowserErrorTracking();

    console.log("DataDog RUM initialized successfully");
  } catch (error) {
    console.error("DataDog RUM initialization failed:", error);
  }
};

/**
 * Local development testing setup
 */
const setupLocalTesting = () => {
  // Clear previous events
  localEvents = [];

  console.log("🧪 DataDog Analytics Local Testing Mode Enabled");
  console.log("📝 Use window.DD_LOCAL_EVENTS to view captured events");
  console.log("🔍 Use window.DD_PRINT_EVENTS() to print all events");

  // Make events accessible from browser console
  (window as any).DD_LOCAL_EVENTS = localEvents;
  (window as any).DD_PRINT_EVENTS = () => {
    console.table(
      localEvents.map((event) => ({
        Type: event.type,
        Name: event.name || "N/A",
        Timestamp: new Date(event.timestamp).toLocaleTimeString(),
        Data: JSON.stringify(event.data, null, 2),
      })),
    );
  };

  console.log("✅ Local testing setup complete");
};

/**
 * Enhanced browser error tracking
 */
const setupBrowserErrorTracking = () => {
  // Global error handler for unhandled JavaScript errors
  window.addEventListener("error", (event) => {
    datadogRum.addError(event.error || new Error(event.message), {
      errorType: "javascript",
      source: event.filename || "unknown",
      line: event.lineno,
      column: event.colno,
    });
  });

  // Global handler for unhandled promise rejections
  window.addEventListener("unhandledrejection", (event) => {
    datadogRum.addError(event.reason, {
      errorType: "promise-rejection",
    });
  });

  // Console error override to capture console.error calls
  const originalConsoleError = console.error;
  console.error = (...args) => {
    // Call original console.error
    originalConsoleError.apply(console, args);

    // Send to DataDog
    const error =
      args[0] instanceof Error ? args[0] : new Error(args.join(" "));
    datadogRum.addError(error, {
      errorType: "console-error",
      context: args.slice(1),
    });
  };
};

/**
 * Set user information for DataDog RUM session
 */
export const setDatadogUser = (user: User | null) => {
  if (typeof window === "undefined") {
    return;
  }

  // Local development mode
  if (isLocalDev) {
    const event = {
      type: "user" as const,
      data: user
        ? {
            id: user.id,
            name: user.name,
            userName: user.email, // email field contains userName (email/phone)
          }
        : null,
      timestamp: Date.now(),
    };
    localEvents.push(event);
    console.log(
      "👤 LOCAL DEV - User Set:",
      user ? `${user.name || "User"} (${user.email})` : "Logged out",
    );
    return;
  }

  if (!datadogRum) return;

  if (user) {
    datadogRum.setUser({
      id: user.id,
      name: user.name || undefined,
      email: user.email || undefined, // Now contains userName (email/phone) from profile mapping
      userName: user.email || undefined, // Also keep as custom field for clarity
      // Add any other custom user attributes that exist on the User type
    });
  } else {
    // Clear user data on logout
    datadogRum.clearUser();
  }
};

/**
 * Track custom user actions
 */
export const trackUserAction = (
  name: string,
  context?: Record<string, any>,
) => {
  if (typeof window === "undefined") {
    return;
  }

  // Local development mode
  if (isLocalDev) {
    const event = {
      type: "action" as const,
      name,
      data: context || {},
      timestamp: Date.now(),
    };
    localEvents.push(event);
    console.log(`🎯 LOCAL DEV - Action: ${name}`, context);
    return;
  }

  if (!datadogRum) return;
  datadogRum.addAction(name, context);
};

/**
 * Add custom error tracking
 */
export const trackError = (
  error: Error | string,
  context?: Record<string, any>,
) => {
  if (typeof window === "undefined") {
    return;
  }

  // Local development mode
  if (isLocalDev) {
    const errorObj = typeof error === "string" ? new Error(error) : error;
    const event = {
      type: "error" as const,
      name: errorObj.message,
      data: { ...context, stack: errorObj.stack },
      timestamp: Date.now(),
    };
    localEvents.push(event);
    console.error("🚨 LOCAL DEV - Error Tracked:", errorObj.message, context);
    return;
  }

  if (!datadogRum) return;
  const errorObj = typeof error === "string" ? new Error(error) : error;
  datadogRum.addError(errorObj, context);
};

/**
 * Add custom timing tracking
 */
export const trackTiming = (name: string, duration: number) => {
  if (typeof window === "undefined") {
    return;
  }

  // Local development mode
  if (isLocalDev) {
    const event = {
      type: "timing" as const,
      name,
      data: { duration },
      timestamp: Date.now(),
    };
    localEvents.push(event);
    console.log(`⏱️ LOCAL DEV - Timing: ${name} = ${duration}ms`);
    return;
  }

  if (!datadogRum) return;
  datadogRum.addTiming(name, duration);
};

/**
 * Add custom attributes to current RUM context
 */
export const addRumGlobalContext = (key: string, value: any) => {
  if (typeof window === "undefined") {
    return;
  }

  // Local development mode
  if (isLocalDev) {
    const event = {
      type: "context" as const,
      name: `SET: ${key}`,
      data: { key, value },
      timestamp: Date.now(),
    };
    localEvents.push(event);
    console.log(`🌍 LOCAL DEV - Context Set: ${key} =`, value);
    return;
  }

  if (!datadogRum) return;
  datadogRum.setGlobalContextProperty(key, value);
};

/**
 * Remove custom attributes from current RUM context
 */
export const removeRumGlobalContext = (key: string) => {
  if (typeof window === "undefined" || !datadogRum) {
    return;
  }

  datadogRum.removeGlobalContextProperty(key);
};

/**
 * Start a new RUM session manually by clearing current context
 */
export const startSession = () => {
  if (typeof window === "undefined" || !datadogRum) {
    return;
  }

  // DataDog RUM handles sessions automatically, but we can clear context to start fresh
  datadogRum.clearGlobalContext();
};

/**
 * Stop the current RUM session by clearing user context
 */
export const stopSession = () => {
  if (typeof window === "undefined" || !datadogRum) {
    return;
  }

  // Clear user data to effectively end user session tracking
  datadogRum.clearUser();
  datadogRum.clearGlobalContext();
};
