import ReactGA from "react-ga4";
import { fetchClientEnv } from "~/lib/utils";

// Local development flag
const isLocalDev =
  process.env.NODE_ENV === "development" ||
  (typeof window !== "undefined" && window.location.hostname === "localhost");

// Default to disabled until consent is resolved.
let gaSoftEnabled = false;
let gaInitialized = false;
let gaInitPromise: Promise<void> | null = null;

export const setGaSoftEnabled = (enabled: boolean): void => {
  gaSoftEnabled = enabled;
};

const isGaSoftEnabled = (): boolean => gaSoftEnabled;

const initializeGA = async (): Promise<void> => {
  if (!isGaSoftEnabled()) return;
  if (gaInitialized) return;
  if (gaInitPromise) return gaInitPromise;

  gaInitPromise = (async () => {
    if (isLocalDev) {
      gaInitialized = true;
      console.log("🔧 LOCAL DEV: Google Analytics initialization skipped");
      console.log("📊 GA events will be logged to console instead");
      console.log("Google Analytics initialized");
      return;
    }

    const env = await fetchClientEnv();
    if (!env.NEXT_PUBLIC_GA_MEASUREMENT_ID) return;

    ReactGA.initialize(env.NEXT_PUBLIC_GA_MEASUREMENT_ID);
    gaInitialized = true;
    console.log("Google Analytics initialized");
  })().finally(() => {
    gaInitPromise = null;
  });

  return gaInitPromise;
};

const trackGAEvent = (
  category: string,
  action: string,
  label: string,
): void => {
  if (!isGaSoftEnabled()) return;

  if (isLocalDev) {
    console.log(`📈 LOCAL DEV - GA Event: ${category} / ${action} / ${label}`);
    return;
  }

  if (!gaInitialized) return;
  ReactGA.event({
    category: category,
    action: action,
    label: label,
  });
};

export default initializeGA;
export { initializeGA, trackGAEvent };
