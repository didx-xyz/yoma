/**
 * User discovery preferences — a User-domain preset, NOT a custom field (epic rule: presets must
 * not be built through the custom-field models or components).
 *
 * The real model lands with YOM-1257 (preset storage) / YOM-1258 (preset→filter mapping). Until
 * then this shape exists only behind the mock façade (`~/api/services/userPreferences`) and is
 * never written to the real `User` model or any identity field.
 */

/**
 * Single-select by design. A youth picking three goals gives no signal — breadth belongs at
 * `targetCategories`, which is multi-select. Do not widen this to an array; if product asks for
 * multiple goals the answer is a ranked primary plus secondaries (a mapping decision, not a type
 * change).
 */
export type UserGoal = "job" | "learn" | "event" | "impact" | "biz";

export interface UserPreferenceCommitment {
  /** TimeInterval lookup id (see `getCommitmentIntervals`). */
  intervalId: string;
  count: number;
}

/**
 * Skills are stored as `{id, name}` pairs, not bare ids: the EMSI lookup is search-by-name only,
 * so a bare id cannot be resolved back to a label when the wizard re-edits a stored preset. The
 * name is display data — anything consuming skills as a filter must use `id`.
 */
export interface UserPreferenceSkill {
  id: string;
  name: string;
}

export interface UserPreferenceAccessibility {
  /** Opt-in, off by default, never auto-applied from the profile. */
  enabled: boolean;
  needs: string[];
}

export interface UserPreferences {
  /** `"biz"` has no agreed filter mapping and is not selectable in the UI (COMING SOON). */
  goal: UserGoal | null;
  /** Opportunity Category ids (Opportunity Categories taxonomy). */
  targetCategories: string[];
  /** EMSI Skill lookup pairs, self-reported. Verified skills are read from the profile. */
  selfReportedSkills: UserPreferenceSkill[];
  /** Normalised "at most this much time"; opportunities with no commitment set are INCLUDED. */
  maxCommitment: UserPreferenceCommitment | null;
  /** Proposed, awaiting BA sign-off (YOM-1264): EngagementType lookup id. */
  engagement: string | null;
  // paidWork was removed as a STORED preference (2026-08-31 revision brief §4);
  // pay remains fully available as a session filter (the "Paid & rewards" section).
  /** Proposed, awaiting BA sign-off (YOM-1264): Language lookup ids. */
  languages: string[];
  /**
   * Sensitive. Never included in any outbound payload, partner sync, credential or analytics
   * event — including the mere fact that the filter is enabled. When on, opportunities that have
   * not described their accommodations are EXCLUDED (stated in words in the UI).
   */
  accessibility: UserPreferenceAccessibility;
}

/** Where anonymous answers live (session) vs a signed-in youth's preset (their profile). */
export type UserPreferenceScope = "user" | "anonymous";

export const EMPTY_USER_PREFERENCES: UserPreferences = {
  goal: null,
  targetCategories: [],
  selfReportedSkills: [],
  maxCommitment: null,
  engagement: null,
  languages: [],
  accessibility: { enabled: false, needs: [] },
};

/**
 * Repairs a stored preset of unknown vintage into the current shape. Client-held stores
 * (sessionStorage, the local mock) outlive shape changes, so both read paths run parsed JSON
 * through here. Legacy bare-id skills (pre-`{id, name}`) are dropped rather than kept as
 * unresolvable GUID chips.
 */
export const normalizeUserPreferences = (raw: unknown): UserPreferences => {
  const parsed = (
    typeof raw === "object" && raw !== null ? raw : {}
  ) as Partial<UserPreferences>;
  return {
    ...EMPTY_USER_PREFERENCES,
    ...parsed,
    selfReportedSkills: Array.isArray(parsed.selfReportedSkills)
      ? (parsed.selfReportedSkills as unknown[]).filter(
          (skill): skill is UserPreferenceSkill =>
            typeof skill === "object" &&
            skill !== null &&
            typeof (skill as UserPreferenceSkill).id === "string" &&
            typeof (skill as UserPreferenceSkill).name === "string",
        )
      : [],
    accessibility: parsed.accessibility ?? EMPTY_USER_PREFERENCES.accessibility,
  };
};

/**
 * Merges session-held anonymous answers into a stored preset (the sign-in "keep your answers"
 * offer). The anonymous answers are the youth's most recent expression, so they win where set;
 * multi-selects union so nothing already stored is lost. Never called without the youth's
 * explicit yes — an existing preset is never overwritten silently.
 */
export const mergeUserPreferences = (
  stored: UserPreferences,
  anonymous: UserPreferences,
): UserPreferences => {
  const union = <T>(a: T[], b: T[], keyOf: (item: T) => string): T[] => {
    const seen = new Set(a.map(keyOf));
    return [...a, ...b.filter((item) => !seen.has(keyOf(item)))];
  };
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
    engagement: anonymous.engagement ?? stored.engagement,
    languages: union(stored.languages, anonymous.languages, (id) => id),
    accessibility: {
      enabled: stored.accessibility.enabled || anonymous.accessibility.enabled,
      needs: union(
        stored.accessibility.needs,
        anonymous.accessibility.needs,
        (id) => id,
      ),
    },
  };
};
