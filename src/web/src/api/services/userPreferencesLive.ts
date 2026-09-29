import {
  fromApiCoordinates,
  fromApiLocationSource,
  hasPlace,
  toApiCoordinates,
  toApiLocationSource,
} from "../models/location";
import type {
  UserGoalLookup,
  UserPreferencesRequest,
  UserPreferencesResponse,
  UserProfile,
  UserRequestProfile,
} from "../models/user";
import { UserSkillType } from "../models/user";
import type {
  UserGoal,
  UserLocation,
  UserPreferenceScope,
  UserPreferences,
} from "../models/userPreferences";
import {
  EMPTY_USER_PREFERENCES,
  isEmptyUserPreferences,
  normalizeUserPreferences,
} from "../models/userPreferences";
import {
  getUserGoals,
  getUserPreferencesApi,
  getUserProfile,
  getUserSkills,
  patchUser,
  patchUserPreferences,
} from "./user";

/**
 * The user-preferences service — the ONE adapter between the wizard's `UserPreferences` and the
 * API (YOM-1257, 2026-09-28).
 *
 * Signed in, preferences live in `GET` / `PATCH /user/preferences` (a COMPLETE replacement —
 * every field is sent, and an omitted one is cleared), EXCEPT the place: region / city / centroid
 * are profile fields, so they are read from `GET /user` and written with the full `PATCH /user`
 * (resending every other profile field as loaded). Country is the profile's and is never written
 * from here.
 *
 * Anonymous preferences are permanently client-held: answers live in `sessionStorage`, with an
 * offer to keep them on sign-in.
 */

const ANONYMOUS_STORAGE_KEY = "yoma.discovery.preferences.anonymous";

/**
 * Web goal key → the goal lookup's `name`. Resolved by name at runtime rather than a hard-coded
 * id, like "Start a business" → its category; the lookup's names are sentence case and exact.
 */
const GOAL_NAMES: Record<UserGoal, string> = {
  job: "Get a job",
  learn: "Learn new skills",
  event: "Attend events",
  impact: "Volunteer / make an impact",
  biz: "Start a business",
};

export const readAnonymousPreferences = (): UserPreferences | null => {
  if (typeof window === "undefined") return null;
  const raw = window.sessionStorage.getItem(ANONYMOUS_STORAGE_KEY);
  if (raw === null) return null;
  try {
    return normalizeUserPreferences(JSON.parse(raw));
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

// The goal lookup is static for a session; one request, shared by reads and saves.
let goalsRequest: Promise<UserGoalLookup[]> | null = null;
const loadGoals = (): Promise<UserGoalLookup[]> => {
  goalsRequest ??= getUserGoals().catch((error: unknown) => {
    goalsRequest = null;
    throw error;
  });
  return goalsRequest;
};

const goalKeyOf = (
  goalId: string | null,
  goals: UserGoalLookup[],
): UserGoal | null => {
  const name = goals
    .find((goal) => goal.id === goalId)
    ?.name.trim()
    .toLowerCase();
  if (!name) return null;
  const hit = (Object.entries(GOAL_NAMES) as [UserGoal, string][]).find(
    ([, goalName]) => goalName.toLowerCase() === name,
  );
  return hit?.[0] ?? null;
};

const goalIdOf = (
  goal: UserGoal | null,
  goals: UserGoalLookup[],
): string | null => {
  if (!goal) return null;
  const name = GOAL_NAMES[goal].toLowerCase();
  return (
    goals.find((item) => item.name.trim().toLowerCase() === name)?.id ?? null
  );
};

const locationOf = (profile: UserProfile): UserLocation => ({
  countryId: profile.countryId,
  region: profile.region ?? null,
  city: profile.city ?? null,
  coordinates: fromApiCoordinates(profile.coordinates),
  source: fromApiLocationSource(profile.locationSource),
  placeId: null,
});

const fromApi = (
  api: UserPreferencesResponse,
  profile: UserProfile,
  goals: UserGoalLookup[],
): UserPreferences => ({
  goal: goalKeyOf(api.goalId, goals),
  targetCategories: api.categories.map((category) => category.id),
  selfReportedSkills: api.skillsSelfAttested.map(({ id, name }) => ({
    id,
    name,
  })),
  maxCommitment:
    api.commitmentIntervalId && api.commitmentIntervalCount
      ? {
          intervalId: api.commitmentIntervalId,
          count: api.commitmentIntervalCount,
        }
      : null,
  engagement: api.engagementTypeId,
  incentivized: api.incentivized,
  languages: api.languages.map((language) => language.id),
  accessibility: {
    requirements: api.accessibilityRequirements.map((option) => option.id),
    otherDescription: api.accessibilityRequirementOtherDescription,
  },
  location: locationOf(profile),
});

const toApi = (
  preferences: UserPreferences,
  goals: UserGoalLookup[],
  verifiedSkillIds: Set<string>,
): UserPreferencesRequest => ({
  goalId: goalIdOf(preferences.goal, goals),
  commitmentIntervalId: preferences.maxCommitment?.intervalId ?? null,
  commitmentIntervalCount: preferences.maxCommitment?.count ?? null,
  engagementTypeId: preferences.engagement,
  incentivized: preferences.incentivized,
  categories: preferences.targetCategories,
  accessibilityRequirements: preferences.accessibility.requirements,
  // Required exactly when Other is selected — the wizard only offers the field then, and the
  // API rejects a description without it, so an empty one is sent as null.
  accessibilityRequirementOtherDescription:
    preferences.accessibility.otherDescription?.trim() || null,
  languages: preferences.languages,
  // A skill verified since it was picked (a completion promotes the same row) is no longer the
  // youth's to claim — the API rejects it, so it is dropped here rather than failing the save.
  skillsSelfAttested: preferences.selfReportedSkills
    .map((skill) => skill.id)
    .filter((id) => !verifiedSkillIds.has(id)),
});

/** The profile's place in the API's wire form — empty when no region or city is named. */
const placeFieldsOf = (
  location: UserLocation,
): Pick<
  UserRequestProfile,
  "region" | "city" | "coordinates" | "locationSource"
> =>
  hasPlace(location)
    ? {
        region: location.region,
        city: location.city,
        // The API accepts coordinates only with a city — a region pick has none anyway.
        coordinates: location.city
          ? toApiCoordinates(location.coordinates)
          : null,
        locationSource: toApiLocationSource(location.source),
      }
    : { region: null, city: null, coordinates: null, locationSource: null };

const samePlace = (a: UserLocation, b: UserLocation): boolean =>
  JSON.stringify(placeFieldsOf(a)) === JSON.stringify(placeFieldsOf(b));

/** The full profile update `PATCH /user` requires, as loaded — only the place changes. */
const profileRequestOf = (
  profile: UserProfile,
  location: UserLocation,
): UserRequestProfile => ({
  email: profile.email,
  firstName: profile.firstName,
  surname: profile.surname,
  displayName: profile.displayName,
  phoneNumber: profile.phoneNumber,
  countryId: profile.countryId,
  educationId: profile.educationId,
  genderId: profile.genderId,
  dateOfBirth: profile.dateOfBirth,
  updatePhoneNumber: false,
  resetPassword: false,
  ...placeFieldsOf(location),
});

/**
 * What a save produced. `profile` is set when the place was written (the caller refreshes the
 * cached session profile with it); `locationError` when the preferences saved but the place did
 * not — typically a profile missing a field `PATCH /user` requires.
 */
export interface SavedUserPreferences {
  preferences: UserPreferences;
  profile: UserProfile | null;
  locationError: string | null;
}

/** `null` = the youth has never captured anything (the API returns empty defaults for them). */
export const getUserPreferences = async (
  scope: UserPreferenceScope,
): Promise<UserPreferences | null> => {
  if (scope === "anonymous") return readAnonymousPreferences();
  const [api, profile, goals] = await Promise.all([
    getUserPreferencesApi(),
    getUserProfile(),
    loadGoals(),
  ]);
  const preferences = fromApi(api, profile, goals);
  return isEmptyUserPreferences({
    ...preferences,
    location: { ...preferences.location, countryId: null },
  })
    ? null
    : preferences;
};

export const saveUserPreferences = async (
  scope: UserPreferenceScope,
  preferences: UserPreferences,
): Promise<SavedUserPreferences> => {
  if (scope === "anonymous") {
    writeAnonymousPreferences(preferences);
    return { preferences, profile: null, locationError: null };
  }

  const [goals, verified] = await Promise.all([
    loadGoals(),
    getUserSkills(UserSkillType.Verified),
  ]);
  const saved = await patchUserPreferences(
    toApi(preferences, goals, new Set(verified.map((skill) => skill.id))),
  );

  // The place is a profile field. Re-read the profile first: `PATCH /user` replaces every field,
  // so it must be rebuilt from the current record, never from a cached copy.
  let profile = await getUserProfile();
  const wanted: UserLocation = {
    ...preferences.location,
    countryId: profile.countryId,
  };
  let written: UserProfile | null = null;
  let locationError: string | null = null;
  if (!samePlace(wanted, locationOf(profile))) {
    try {
      written = await patchUser(profileRequestOf(profile, wanted));
      profile = written;
    } catch {
      locationError =
        "Your preferences are saved, but your place isn't — check that your profile is complete, then try again.";
    }
  }

  return {
    preferences: fromApi(saved, profile, goals),
    profile: written,
    locationError,
  };
};

/**
 * Anonymous: forget the session answers. Signed in: the complete PATCH with nothing selected
 * clears every preference (self-attested skills included); the place on the profile is kept.
 */
export const clearUserPreferences = async (
  scope: UserPreferenceScope,
): Promise<void> => {
  if (scope === "anonymous") {
    writeAnonymousPreferences(null);
    return;
  }
  await patchUserPreferences(toApi(EMPTY_USER_PREFERENCES, [], new Set()));
};
