import type {
  UserPreferenceScope,
  UserPreferences,
} from "~/api/models/userPreferences";
import { EMPTY_USER_PREFERENCES } from "~/api/models/userPreferences";
import {
  readAnonymousPreferences,
  writeAnonymousPreferences,
} from "~/api/services/userPreferencesLive";

/**
 * ⚠️ TEMPORARY — the mocked user-preferences store (YOM-1261 / YOM-1262), served through the
 * `~/api/services/userPreferences` façade in local development only, while the presets API
 * (YOM-1257 / YOM-1258) does not exist.
 *
 * Signed-in presets persist in `localStorage` so a local youth keeps them across sessions;
 * anonymous answers delegate to the live service's `sessionStorage` path, which is permanent
 * behaviour rather than part of this mock.
 *
 * Removal (before the PR): delete this file, `~/api/services/userPreferences.ts`'s mock wiring
 * and `USER_PREFERENCES_MOCK_ENABLED` guards, and point consumers at `userPreferencesLive`.
 * The full removal list lives in the YOM-1261/YOM-1262 handoffs.
 */

const MOCK_USER_STORAGE_KEY = "yoma.discovery.preferences.mock";

const readMockUserPreferences = (): UserPreferences | null => {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(MOCK_USER_STORAGE_KEY);
  if (raw === null) return null;
  try {
    return {
      ...EMPTY_USER_PREFERENCES,
      ...(JSON.parse(raw) as UserPreferences),
    };
  } catch {
    return null;
  }
};

const writeMockUserPreferences = (
  preferences: UserPreferences | null,
): void => {
  if (typeof window === "undefined") return;
  if (preferences === null)
    window.localStorage.removeItem(MOCK_USER_STORAGE_KEY);
  else
    window.localStorage.setItem(
      MOCK_USER_STORAGE_KEY,
      JSON.stringify(preferences),
    );
};

export const getUserPreferences = async (
  scope: UserPreferenceScope,
): Promise<UserPreferences | null> => {
  if (scope === "anonymous") return readAnonymousPreferences();
  return readMockUserPreferences();
};

export const saveUserPreferences = async (
  scope: UserPreferenceScope,
  preferences: UserPreferences,
): Promise<UserPreferences> => {
  if (scope === "anonymous") {
    writeAnonymousPreferences(preferences);
    return preferences;
  }
  writeMockUserPreferences(preferences);
  return preferences;
};

export const clearUserPreferences = async (
  scope: UserPreferenceScope,
): Promise<void> => {
  if (scope === "anonymous") {
    writeAnonymousPreferences(null);
    return;
  }
  writeMockUserPreferences(null);
};
