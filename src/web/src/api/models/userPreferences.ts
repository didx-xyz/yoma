import type { LocationPlace } from "./location";
import {
  EMPTY_LOCATION_PLACE,
  hasPlace,
  normalizeLocationPlace,
} from "./location";

/**
 * User discovery preferences as the web app edits them — a User-domain preset, NOT a custom field
 * (epic rule: presets must not be built through the custom-field models or components).
 *
 * Stored by `GET` / `PATCH /user/preferences` for a signed-in youth (YOM-1257, 2026-09-28) and in
 * `sessionStorage` for an anonymous one. This is the WIZARD's shape; `userPreferencesLive.ts` is
 * the one adapter to the API's (`UserPreferencesResponse` / `UserPreferencesRequest`). Location is
 * the exception to "preferences": the API keeps region / city / centroid on the PROFILE, so the
 * adapter reads and writes it through `/user`.
 */

/**
 * Single-select by design. A youth picking three goals gives no signal — breadth belongs at
 * `targetCategories`, which is multi-select.
 *
 * These are web keys, not API ids: the goal lookup (`GET /user/goal`) is authenticated, and an
 * anonymous youth answers the wizard too. The live adapter resolves them to the lookup by name
 * (`GOAL_NAMES` in `userPreferencesLive.ts`).
 */
export type UserGoal = "job" | "learn" | "event" | "impact" | "biz";

export interface UserPreferenceCommitment {
  /** TimeInterval lookup id (see `getCommitmentIntervals`). */
  intervalId: string;
  count: number;
}

/**
 * Skills are held as `{id, name}` pairs, not bare ids: the EMSI lookup is search-by-name only, so
 * a bare id cannot be resolved back to a label when the wizard re-edits a stored preset. The name
 * is display data — anything consuming skills as a filter must use `id`. Self-attested and
 * unverified: an already verified skill is never one of these (the API rejects it).
 */
export interface UserPreferenceSkill {
  id: string;
  name: string;
}

/**
 * Sensitive. Accessibility lookup ids (`GET /lookup/accessibility`, the same list opportunities
 * describe their accommodations with) plus the free-text description the API requires exactly
 * when Other is among them.
 */
export interface UserPreferenceAccessibility {
  requirements: string[];
  otherDescription: string | null;
}

export interface UserPreferences {
  /** Each goal maps to a Type; `"biz"` to Entrepreneurship since 2026-10-01 (was a Category, BA 2026-09-22). */
  goal: UserGoal | null;
  /** Opportunity Category ids (Opportunity Categories taxonomy). */
  targetCategories: string[];
  /** EMSI Skill lookup pairs, self-attested. Verified skills are read from the youth's skills. */
  selfReportedSkills: UserPreferenceSkill[];
  /** "At most this much time" per opportunity. */
  maxCommitment: UserPreferenceCommitment | null;
  /**
   * EngagementType lookup ids. A list again since 2026-10-03: the API stores several
   * (`engagementTypes`), which reverses 2026-09-29's single-select, and the wizard step picks
   * several. `normalizeUserPreferences` reads a stored single id as a list of one.
   */
  engagement: string[];
  /**
   * true = prefers an opportunity with any incentive (pay, ZLTO, a voucher…), false = prefers
   * none, null = no preference. Not Job-specific, and not the reward type.
   */
  incentivized: boolean | null;
  /** Language lookup ids. */
  languages: string[];
  /**
   * Never included in any outbound payload other than the preferences PATCH — not partner sync,
   * credentials or analytics. Saved, but NOT applied to the feed automatically: the search's
   * accommodations filter leaves out every opportunity that has not described its accommodations,
   * and the BA rule is that those stay in (2026-09-22).
   */
  accessibility: UserPreferenceAccessibility;
  /** Region / city / centroid (and, anonymous only, country) — see `UserLocation`. */
  location: UserLocation;
}

/**
 * Where the youth is — region, city and the city's centroid, set in the wizard.
 *
 * Country is NOT owned here for a signed-in youth: it is the global profile `countryId`, edited
 * only on the profile page, and the place is stored on the profile alongside it (the API has no
 * second country). `countryId` records the country the place belongs to — the profile's when
 * signed in, so a place read back is never stale; for an anonymous youth there is no profile, so
 * `countryId` IS their country, held in the session with their other answers.
 */
export interface UserLocation extends LocationPlace {
  countryId: string | null;
}

export const EMPTY_USER_LOCATION: UserLocation = {
  countryId: null,
  ...EMPTY_LOCATION_PLACE,
};

const normalizeUserLocation = (raw: unknown): UserLocation => ({
  countryId:
    typeof raw === "object" &&
    raw !== null &&
    typeof (raw as { countryId?: unknown }).countryId === "string"
      ? (raw as { countryId: string }).countryId
      : null,
  ...normalizeLocationPlace(raw),
});

/** Where anonymous answers live (session) vs a signed-in youth's preset (the API). */
export type UserPreferenceScope = "user" | "anonymous";

export const EMPTY_USER_ACCESSIBILITY: UserPreferenceAccessibility = {
  requirements: [],
  otherDescription: null,
};

export const EMPTY_USER_PREFERENCES: UserPreferences = {
  goal: null,
  targetCategories: [],
  selfReportedSkills: [],
  maxCommitment: null,
  engagement: [],
  incentivized: null,
  languages: [],
  accessibility: EMPTY_USER_ACCESSIBILITY,
  location: EMPTY_USER_LOCATION,
};

const strings = (raw: unknown): string[] =>
  Array.isArray(raw)
    ? raw.filter((id): id is string => typeof id === "string")
    : [];

/** A single stored id (2026-09-29 → 10-03) becomes a list of one; anything unexpected → none. */
const normalizeEngagement = (raw: unknown): string[] => {
  if (typeof raw === "string") return raw !== "" ? [raw] : [];
  return [...new Set(strings(raw).filter((id) => id !== ""))];
};

/** The `{ enabled, needs }` toggle shape (before 2026-09-29) carried no requirement — none. */
const normalizeAccessibility = (raw: unknown): UserPreferenceAccessibility => {
  if (typeof raw !== "object" || raw === null) return EMPTY_USER_ACCESSIBILITY;
  const { requirements, otherDescription } = raw as Record<string, unknown>;
  return {
    requirements: strings(requirements),
    otherDescription:
      typeof otherDescription === "string" && otherDescription.trim() !== ""
        ? otherDescription
        : null,
  };
};

/**
 * Repairs a client-held preset of unknown vintage into the current shape. `sessionStorage`
 * outlives shape changes, so the anonymous read path runs parsed JSON through here. Legacy
 * bare-id skills (pre-`{id, name}`) are dropped rather than kept as unresolvable GUID chips, and
 * keys the model no longer has are not carried over.
 */
export const normalizeUserPreferences = (raw: unknown): UserPreferences => {
  const parsed = (typeof raw === "object" && raw !== null ? raw : {}) as Record<
    string,
    unknown
  >;
  const goal = parsed.goal;
  const commitment = parsed.maxCommitment as
    | Partial<UserPreferenceCommitment>
    | null
    | undefined;
  return {
    goal:
      goal === "job" ||
      goal === "learn" ||
      goal === "event" ||
      goal === "impact" ||
      goal === "biz"
        ? goal
        : null,
    targetCategories: strings(parsed.targetCategories),
    selfReportedSkills: Array.isArray(parsed.selfReportedSkills)
      ? (parsed.selfReportedSkills as unknown[]).filter(
          (skill): skill is UserPreferenceSkill =>
            typeof skill === "object" &&
            skill !== null &&
            typeof (skill as UserPreferenceSkill).id === "string" &&
            typeof (skill as UserPreferenceSkill).name === "string",
        )
      : [],
    maxCommitment:
      commitment &&
      typeof commitment.intervalId === "string" &&
      typeof commitment.count === "number" &&
      commitment.count > 0
        ? { intervalId: commitment.intervalId, count: commitment.count }
        : null,
    engagement: normalizeEngagement(parsed.engagement),
    incentivized:
      typeof parsed.incentivized === "boolean" ? parsed.incentivized : null,
    languages: strings(parsed.languages),
    accessibility: normalizeAccessibility(parsed.accessibility),
    location: normalizeUserLocation(parsed.location),
  };
};

/** Nothing answered — what a never-saved youth reads back from the API, too. */
export const isEmptyUserPreferences = (preferences: UserPreferences): boolean =>
  JSON.stringify(preferences) === JSON.stringify(EMPTY_USER_PREFERENCES);

/**
 * Merges session-held anonymous answers into a stored preset (the sign-in "keep your answers"
 * offer). The anonymous answers are the youth's most recent expression, so they win where set;
 * multi-selects union so nothing already stored is lost — engagement too, since the wizard step
 * picks several (2026-10-03). Never called without the youth's explicit yes — an existing preset
 * is never overwritten silently.
 *
 * Location: the PROFILE country always wins — it is the global country, not an answer. The
 * anonymous region / city / centroid carry over only when they were picked in that same
 * country (`anonymousLocationCarriesOver`); otherwise the stored location stays as it was and
 * the offer says the place was dropped.
 */
export const anonymousLocationCarriesOver = (
  anonymous: UserPreferences,
  profileCountryId: string | null,
): boolean =>
  hasPlace(anonymous.location) &&
  profileCountryId !== null &&
  anonymous.location.countryId === profileCountryId;

export const mergeUserPreferences = (
  stored: UserPreferences,
  anonymous: UserPreferences,
  profileCountryId: string | null,
): UserPreferences => {
  const union = <T>(a: T[], b: T[], keyOf: (item: T) => string): T[] => {
    const seen = new Set(a.map(keyOf));
    return [...a, ...b.filter((item) => !seen.has(keyOf(item)))];
  };
  const requirements = union(
    stored.accessibility.requirements,
    anonymous.accessibility.requirements,
    (id) => id,
  );
  return {
    goal: anonymous.goal ?? stored.goal,
    targetCategories: union(
      stored.targetCategories,
      anonymous.targetCategories,
      (id) => id,
    ),
    selfReportedSkills: union(
      stored.selfReportedSkills,
      anonymous.selfReportedSkills,
      (skill) => skill.id,
    ),
    maxCommitment: anonymous.maxCommitment ?? stored.maxCommitment,
    engagement: union(stored.engagement, anonymous.engagement, (id) => id),
    incentivized: anonymous.incentivized ?? stored.incentivized,
    languages: union(stored.languages, anonymous.languages, (id) => id),
    accessibility: {
      requirements,
      otherDescription:
        anonymous.accessibility.otherDescription ??
        stored.accessibility.otherDescription,
    },
    location: anonymousLocationCarriesOver(anonymous, profileCountryId)
      ? anonymous.location
      : stored.location,
  };
};
