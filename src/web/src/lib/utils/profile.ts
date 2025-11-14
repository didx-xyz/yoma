import type { UserProfile } from "~/api/models/user";
import { SETTING_USER_SETTINGS_CONFIGURED } from "~/lib/constants";

/**
 * Check if a user profile is completed with all required fields
 */
export function isUserProfileCompleted(
  userProfile: UserProfile | null,
): boolean | null {
  if (!userProfile) return null;

  const { firstName, surname, countryId, educationId, genderId, dateOfBirth } =
    userProfile;

  if (
    !firstName ||
    !surname ||
    !countryId ||
    !educationId ||
    !genderId ||
    !dateOfBirth
  ) {
    return false;
  }

  return true;
}

/**
 * Check if user settings are configured
 */
export function isUserSettingsConfigured(
  userProfile: UserProfile | null,
): boolean {
  if (!userProfile) return false;

  return !!userProfile?.settings?.items.find(
    (x) => x.key === SETTING_USER_SETTINGS_CONFIGURED,
  )?.value;
}

/**
 * Check if user has uploaded a photo
 */
export function hasUserPhoto(userProfile: UserProfile | null): boolean {
  if (!userProfile) return false;

  return !!userProfile?.photoURL;
}

/**
 * Get the current step in profile completion process
 * Returns: "profile" | "settings" | "photo" | "complete"
 */
export function getProfileCompletionStep(
  userProfile: UserProfile | null,
): string {
  if (!isUserProfileCompleted(userProfile)) {
    return "profile";
  }

  if (!isUserSettingsConfigured(userProfile)) {
    return "settings";
  }

  if (!hasUserPhoto(userProfile)) {
    return "photo";
  }

  return "complete";
}
