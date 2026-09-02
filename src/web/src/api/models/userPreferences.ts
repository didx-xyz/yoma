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
  /** EMSI Skill lookup ids, self-reported. Verified skills are read from the profile. */
  selfReportedSkills: string[];
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
