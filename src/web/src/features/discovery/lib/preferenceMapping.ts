import type { UserGoal, UserPreferences } from "~/api/models/userPreferences";
import type { DiscoveryFilters, PreferenceKey } from "./types";

/**
 * Preference → filter mapping, per the BA sheet (build brief §6, User sheet 2026-09-22). Pure;
 * the ONLY place this table exists. Implement exactly the sheet — do not invent extra mappings.
 *
 * Rows the current search API cannot express are deliberately absent rather than approximated:
 * - skills   → "Job required skills only": no core facet; pending YOM-1264 fields.
 * - age      → computed age within range: no core facet on `/opportunity/search`.
 * - accessibility → accommodation fields are pending YOM-1264 (and are custom fields, which
 *              nothing may be keyed to). When they land the rule INCLUDES opportunities that
 *              have not described their accommodations (BA, 2026-09-22) — never an exclusion.
 * - gender   → ranking only, never a gate; no visible filter.
 * - education → no phase-one filter; deferred to the AI project.
 */

/**
 * What the mapping READS (never writes): identity fields resolved by the caller from the
 * profile, and the category lookup so a goal that maps to a CATEGORY resolves by name at
 * runtime — never a hard-coded id, and robust to the taxonomy migration (YOM-1259).
 */
export interface PreferenceProfileContext {
  countryId: string | null;
  categories: { id: string; name: string }[];
}

const GOAL_TO_TYPE: Partial<Record<UserGoal, string>> = {
  job: "Job",
  learn: "Learning",
  event: "Event", // design proposal, awaiting BA confirmation — see the feature doc
  impact: "Task", // the enum name is Task; the label is "Impact task"
};

/**
 * "Start a business" maps to a Category, not a Type (BA sheet, 2026-09-22). The approved
 * taxonomy name first, the pre-migration name second; exact, case-insensitive; first match wins.
 */
const GOAL_TO_CATEGORY_NAMES: Partial<Record<UserGoal, readonly string[]>> = {
  biz: ["Business, Finance & Marketing", "Business and Entrepreneurship"],
};

const categoryByName = (
  categories: { id: string; name: string }[],
  names: readonly string[],
): string | null => {
  for (const name of names) {
    const hit = categories.find(
      (c) => c.name.toLowerCase() === name.toLowerCase(),
    );
    if (hit) return hit.id;
  }
  return null;
};

/** One fragment per preference, so each inherited chip can be switched off individually. */
export type InheritedFragments = Partial<
  Record<PreferenceKey, Partial<DiscoveryFilters>>
>;

export function mapPreferencesToFilters(
  preferences: UserPreferences,
  profile: PreferenceProfileContext,
): InheritedFragments {
  const fragments: InheritedFragments = {};

  if (preferences.goal) {
    const type = GOAL_TO_TYPE[preferences.goal];
    const categoryNames = GOAL_TO_CATEGORY_NAMES[preferences.goal];
    const categoryId = categoryNames
      ? categoryByName(profile.categories, categoryNames)
      : null;
    if (type) fragments.goal = { types: [type] };
    else if (categoryId) fragments.goal = { categories: [categoryId] };
    // A category goal whose name is not in the loaded lookup yields no fragment — visible as
    // "nothing inherited" rather than a wrong filter.
  }

  if (preferences.targetCategories.length > 0)
    fragments.targetCategories = { categories: preferences.targetCategories };

  // Phase one is country only — no province or city on the user side.
  if (profile.countryId) fragments.country = { countries: [profile.countryId] };

  if (preferences.maxCommitment)
    fragments.maxCommitment = { commitment: preferences.maxCommitment };

  if (preferences.engagement.length > 0)
    fragments.engagement = { engagementTypes: preferences.engagement };

  if (preferences.languages.length > 0)
    fragments.languages = { languages: preferences.languages };

  return fragments;
}

/**
 * The effective filters a search runs with: the session's manual state, with the surviving
 * inherited fragments layered UNDER it (a manual choice on the same facet wins by replacing the
 * facet's value — array facets union, since both constraints are "any of").
 */
export function applyInheritedFragments(
  manual: DiscoveryFilters,
  fragments: InheritedFragments,
  preferencesOff: boolean,
  skipped: PreferenceKey[],
): DiscoveryFilters {
  if (preferencesOff) return manual;

  return (
    Object.entries(fragments) as [PreferenceKey, Partial<DiscoveryFilters>][]
  )
    .filter(([key]) => !skipped.includes(key))
    .reduce((merged, [, fragment]) => mergeFragment(merged, fragment), {
      ...manual,
    });
}

/** Scalars keep the manual value when present; array facets union ("any of" both ways). */
function mergeFragment(
  merged: DiscoveryFilters,
  fragment: Partial<DiscoveryFilters>,
): DiscoveryFilters {
  const next = { ...merged };
  if (fragment.commitment && !next.commitment)
    next.commitment = fragment.commitment;
  for (const facet of [
    "types",
    "categories",
    "countries",
    "engagementTypes",
    "languages",
  ] as const) {
    const values = fragment[facet];
    if (values) next[facet] = union(next[facet], values);
  }
  return next;
}

const union = (a: string[], b: string[]): string[] => [
  ...a,
  ...b.filter((x) => !a.includes(x)),
];

/**
 * The preference whose surviving fragment supplies `value` on `facet`, if any — the ONE lookup
 * every provenance-aware control uses to decide whether deselecting a value means "skip its
 * preference" (section chips, category tiles, the type row).
 */
export function owningPreference(
  fragments: InheritedFragments,
  facet: keyof DiscoveryFilters,
  value: string,
): PreferenceKey | null {
  const entry = (
    Object.entries(fragments) as [PreferenceKey, Partial<DiscoveryFilters>][]
  ).find(([, fragment]) => {
    const values = fragment[facet];
    return Array.isArray(values) && (values as string[]).includes(value);
  });
  return entry?.[0] ?? null;
}

/**
 * Preference keys whose skip can be PERSISTED by clearing a preset field. `country` and `age`
 * are identity-derived (read from the profile, never stored in the preset), so switching them
 * off can only ever be a per-search choice.
 */
export const SAVABLE_SKIP_KEYS: readonly PreferenceKey[] = [
  "goal",
  "targetCategories",
  "skills",
  "maxCommitment",
  "engagement",
  "languages",
  "accessibility",
];

/**
 * "Save to profile" for overridden preferences: a skipped preference means "stop applying this",
 * so persisting the override CLEARS that field from the preset. Pure; the caller saves the
 * result through the façade and keeps only the unsavable (identity-derived) skips in the URL.
 */
export function applySkipsToPreferences(
  preferences: UserPreferences,
  skipped: PreferenceKey[],
): UserPreferences {
  const next = { ...preferences };
  for (const key of skipped) {
    switch (key) {
      case "goal":
        next.goal = null;
        break;
      case "targetCategories":
        next.targetCategories = [];
        break;
      case "skills":
        next.selfReportedSkills = [];
        break;
      case "maxCommitment":
        next.maxCommitment = null;
        break;
      case "engagement":
        next.engagement = [];
        break;
      case "languages":
        next.languages = [];
        break;
      case "accessibility":
        next.accessibility = { enabled: false, needs: [] };
        break;
      case "country":
      case "age":
        break; // identity-derived — nothing stored to clear
    }
  }
  return next;
}
