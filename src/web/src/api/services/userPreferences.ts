/**
 * The data source for every user-preferences call the web app makes (YOM-1261 personalization,
 * YOM-1262 discovery inheritance). The feature imports from here, never from the live module.
 *
 * The mock façade that stood here while the presets API was in development was removed on
 * 2026-09-29, when `GET` / `PATCH /user/preferences` landed (YOM-1257) — with it went the local
 * fixture store, the DEV-preview allowance and the "prefs: mock | live" dev pill.
 */
export {
  clearUserPreferences,
  getUserPreferences,
  saveUserPreferences,
  type SavedUserPreferences,
} from "./userPreferencesLive";
