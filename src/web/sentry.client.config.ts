// This file configures the initialization of Sentry on the client.
// The config you add here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";
import { env } from "~/env.mjs";

// disable for local development environment
if (env.NEXT_PUBLIC_ENVIRONMENT?.toLowerCase() != "local") {
  Sentry.init({
    environment: env.NEXT_PUBLIC_ENVIRONMENT,
    dsn: "https://9d1d1983545c75f32a75f9f6c5e93493@o413880.ingest.sentry.io/4505662638522368",

    // Adjust this value in production, or use tracesSampler for greater control
    tracesSampleRate: 1,

    // Setting this option to true will print useful information to the console while you're setting up Sentry.
    debug: false,

    replaysOnErrorSampleRate: 1.0,

    // This sets the sample rate to be 10%. You may want this to be 100% while
    // in development and sample at a lower rate in production
    replaysSessionSampleRate: 0.1,

    // You can remove this option if you're not planning to use the Sentry Session Replay feature:
    integrations: [
      new Sentry.Replay({
        // Additional Replay configuration goes in here, for example:
        maskAllText: true,
        blockAllMedia: true,
      }),
      // automatic instrumentation for errors and transactions
      new Sentry.BrowserTracing(),
    ],
  });
}
