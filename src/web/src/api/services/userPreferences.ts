import * as real from "./userPreferencesLive";
import * as mock from "~/features/discovery/mocks/userPreferences";

/**
 * The data source for every user-preferences call the web app makes (YOM-1261 personalization,
 * YOM-1262 discovery inheritance). This module is the ONLY import point — the feature never
 * imports the live service or the mock directly.
 *
 * ⚠️⚠️ TEMPORARY: the presets API does not exist (YOM-1257 / YOM-1258), so signed-in preferences
 * are mocked in **local development only** — the guard is the environment, not a hand-edited
 * boolean, so no deployed build can ever serve fixtures while this code still exists. Whether the
 * mock *is* serving locally is a per-session choice (`userPreferencesMockActive`), switchable
 * from the preference banner, so the real API can be exercised without a rebuild once it lands.
 *
 * Anonymous preferences are served by the live module in both modes — sessionStorage is their
 * permanent home, not a fixture.
 *
 * To remove for good: delete this file's mock wiring and
 * `~/features/discovery/mocks/userPreferences.ts`, drop the banner switch, and import from
 * `./userPreferencesLive` directly. The removal list lives in the YOM-1261/YOM-1262 handoffs.
 */
export const USER_PREFERENCES_MOCK_ENABLED =
  process.env.NEXT_PUBLIC_ENVIRONMENT === "local";

const MOCK_MODE_KEY = "yoma.discovery.preferencesMockMode";

/**
 * Whether mocked data is serving *right now*. Read per call rather than once per module load
 * (same rule as `credentialSchemaAdmin.schemaMockActive`), so the mocked/live switch takes
 * effect on the next request instead of the next build.
 */
export const userPreferencesMockActive = (): boolean => {
  if (!USER_PREFERENCES_MOCK_ENABLED) return false;
  if (typeof window === "undefined") return true;
  return window.localStorage.getItem(MOCK_MODE_KEY) !== "live";
};

/** Chooses the data source for the rest of the session. Callers reload so caches are dropped. */
export const setUserPreferencesMockActive = (active: boolean): void => {
  window.localStorage.setItem(MOCK_MODE_KEY, active ? "mock" : "live");
};

const impl = () => (userPreferencesMockActive() ? mock : real);

// Typed against the real service, so a mock that drifts from the contract fails the build.
export const getUserPreferences: typeof real.getUserPreferences = (...args) =>
  impl().getUserPreferences(...args);
export const saveUserPreferences: typeof real.saveUserPreferences = (...args) =>
  impl().saveUserPreferences(...args);
export const clearUserPreferences: typeof real.clearUserPreferences = (
  ...args
) => impl().clearUserPreferences(...args);
