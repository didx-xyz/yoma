import type {
  UserPreferenceScope,
  UserPreferences,
} from "../models/userPreferences";
import { EMPTY_USER_PREFERENCES } from "../models/userPreferences";

/**
 * The real user-preferences service.
 *
 * Signed-in presets are User-domain data served by the presets API — which does not exist yet
 * (YOM-1257 model / YOM-1258 mapping). Those paths throw loudly rather than 404 quietly; the
 * façade (`./userPreferences`) serves the mock in local development meanwhile.
 *
 * Anonymous preferences are *permanently* client-held: answers live in `sessionStorage` with an
 * offer to keep them on sign-in. That path is real behaviour, not part of the mock — the mock
 * module delegates its anonymous scope here so the rule exists once.
 */

const ANONYMOUS_STORAGE_KEY = "yoma.discovery.preferences.anonymous";

const notImplemented = (): never => {
  throw new Error(
    "User preferences API is not available yet (pending YOM-1257 / YOM-1258). " +
      "In local development the mock façade serves fixtures instead.",
  );
};

export const readAnonymousPreferences = (): UserPreferences | null => {
  if (typeof window === "undefined") return null;
  const raw = window.sessionStorage.getItem(ANONYMOUS_STORAGE_KEY);
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

export const writeAnonymousPreferences = (
  preferences: UserPreferences | null,
): void => {
  if (typeof window === "undefined") return;
  if (preferences === null)
    window.sessionStorage.removeItem(ANONYMOUS_STORAGE_KEY);
  else
    window.sessionStorage.setItem(
      ANONYMOUS_STORAGE_KEY,
      JSON.stringify(preferences),
    );
};

/** `null` = the youth has never completed (or skipped past) personalization. */
export const getUserPreferences = async (
  scope: UserPreferenceScope,
): Promise<UserPreferences | null> => {
  if (scope === "anonymous") return readAnonymousPreferences();
  return notImplemented(); // TODO(YOM-1257): GET the stored preset for the authenticated user
};

export const saveUserPreferences = async (
  scope: UserPreferenceScope,
  preferences: UserPreferences,
): Promise<UserPreferences> => {
  if (scope === "anonymous") {
    writeAnonymousPreferences(preferences);
    return preferences;
  }
  return notImplemented(); // TODO(YOM-1257): PUT the preset for the authenticated user
};

export const clearUserPreferences = async (
  scope: UserPreferenceScope,
): Promise<void> => {
  if (scope === "anonymous") {
    writeAnonymousPreferences(null);
    return;
  }
  return notImplemented(); // TODO(YOM-1257): DELETE the preset for the authenticated user
};
