import type { UserGoal, UserPreferences } from "~/api/models/userPreferences";
import {
  EMPTY_USER_ACCESSIBILITY,
  EMPTY_USER_LOCATION,
} from "~/api/models/userPreferences";
import { activeUserLocation, locationFragmentState } from "./location";
import type { DiscoveryFilters, PreferenceKey } from "./types";

/**
 * Preference → filter mapping, per the BA sheet (build brief §6, User sheet 2026-09-22) as the
 * revised search contract settled it (2026-10-03). Pure; the ONLY place this table exists.
 * Implement exactly the sheet — do not invent extra mappings. Composed client-side: the API
 * applies no preferences and receives only the effective criteria (`composeSearch` below, then
 * `searchRequest.ts`).
 *
 * - goal     → a Type. "Start a business" is the Entrepreneurship type OR the Business, Finance &
 *              Marketing category, sent as one OR group so related learning stays in; the
 *              category is request-only, never a selected category.
 * - engagement → every saved engagement type (a list again since 2026-10-03). Inherited, the
 *              ones that don't say stay in.
 * - skills   → the saved skills, self-attested plus (signed in) verified, narrow JOBS only, and
 *              inclusively: one OR group, so other types and jobs that list no skills stay in.
 * - accessibility → the saved requirements, inclusively: opportunities that haven't described
 *              their accommodations stay in; an explicit No, or a list missing a need, never
 *              does. Other is left out, and its private description is never part of a search.
 *
 * Rows deliberately absent rather than approximated:
 * - gender   → ranking only, never a gate; no visible filter.
 * - education → no phase-one filter; deferred to the AI project.
 */

/**
 * What the mapping READS (never writes): identity fields and earned skills, resolved by the
 * caller from the profile, and the one lookup id it needs.
 */
export interface PreferenceProfileContext {
  /**
   * The youth's country — the profile's when signed in, the session answer when anonymous
   * (`homeCountryId` in `./location`). Region and city apply only under this country.
   */
  countryId: string | null;
  /**
   * Whole years from the profile's date of birth; `null` when signed out or unknown. Applied as
   * the `age` filter, which keeps opportunities with no age bounds (2026-09-29, agreed with
   * Jason: the API refuses an out-of-range submission, so showing those only leads to a dead
   * end). Visible and skippable like any inherited value.
   */
  age: number | null;
  /**
   * The signed-in youth's VERIFIED skill ids (`GET /user/skills?type=Verified`, one cached query
   * a session); empty when signed out. They join the saved self-attested skills.
   */
  verifiedSkillIds: string[];
  /**
   * The accessibility list's Other option, found by name (`DiscoveryLookups`). `undefined` while
   * the list is still loading: no accessibility fragment yet, rather than a chip that shows and
   * then vanishes. `null` when the lists have not got it — the needs then go out as saved.
   */
  otherAccommodationId: string | null | undefined;
}

const GOAL_TO_TYPE: Record<UserGoal, string> = {
  job: "Job",
  learn: "Learning",
  event: "Event", // design proposal, awaiting BA confirmation — see the feature doc
  impact: "ImpactAction", // renamed from Task 2026-09-28; displayed "Impact Action"
  // The BA mapped it to the Category "Business, Finance & Marketing" (2026-09-22), before the
  // Entrepreneurship type existed (API, 2026-09-29). Since 2026-10-03 it is both: the type, OR
  // the category (`GOAL_CATEGORY_NAMES`) — BA confirmation pending.
  biz: "Entrepreneurship",
};

/**
 * Goals that also bring in one category of ANY type, as an alternative to their type: one OR
 * group in the request (2026-10-03). Resolved by name at runtime (`categoryIdByName`), never a
 * hard-coded id: the approved taxonomy name first, the pre-migration name second.
 */
export const GOAL_CATEGORY_NAMES: Partial<Record<UserGoal, readonly string[]>> =
  {
    biz: ["Business, Finance & Marketing", "Business and Entrepreneurship"],
  };

/** The first of `names` the lookup carries — exact, case-insensitive; `null` when none is. */
export function categoryIdByName(
  categories: { id: string; name: string }[],
  names: readonly string[],
): string | null {
  for (const name of names) {
    const hit = categories.find(
      (c) => c.name.toLowerCase() === name.toLowerCase(),
    );
    if (hit) return hit.id;
  }
  return null;
}

/**
 * What one preference contributes: filter values, plus — on the goal's fragment only — the goal
 * itself, which names its chip and decides whether a category alternative joins the request.
 */
export interface InheritedFragment extends Partial<DiscoveryFilters> {
  userGoal?: UserGoal;
}

/**
 * One fragment per preference, so each inherited chip can be switched off individually. In
 * mapping order, which is the chips' order: skills and accessibility come last, so neither leads
 * the banner (2026-10-03).
 */
export type InheritedFragments = Partial<
  Record<PreferenceKey, InheritedFragment>
>;

export function mapPreferencesToFilters(
  preferences: UserPreferences,
  profile: PreferenceProfileContext,
): InheritedFragments {
  const fragments: InheritedFragments = {};

  if (preferences.goal)
    fragments.goal = {
      types: [GOAL_TO_TYPE[preferences.goal]],
      userGoal: preferences.goal,
    };

  if (preferences.targetCategories.length > 0)
    fragments.targetCategories = { categories: preferences.targetCategories };

  if (profile.countryId) fragments.country = { countries: [profile.countryId] };

  if (profile.age !== null) fragments.age = { age: profile.age };

  // Region / city / centroid, only while they still belong to the youth's country. The
  // fragment never carries a radius: distance is applied deliberately (the Distance control or
  // "Jobs near me"), never inherited — a standing radius would quietly hide most of the feed.
  const location = activeUserLocation(preferences.location, profile.countryId);
  if (location)
    fragments.location = {
      region: location.region,
      city: location.city,
      point: location.coordinates,
    };

  if (preferences.maxCommitment)
    fragments.maxCommitment = { commitment: preferences.maxCommitment };

  if (preferences.engagement.length > 0)
    fragments.engagement = { engagementTypes: preferences.engagement };

  if (preferences.incentivized !== null)
    fragments.incentivized = { incentivized: preferences.incentivized };

  if (preferences.languages.length > 0)
    fragments.languages = { languages: preferences.languages };

  const skills = [
    ...new Set([
      ...preferences.selfReportedSkills.map((skill) => skill.id),
      ...profile.verifiedSkillIds,
    ]),
  ];
  if (skills.length > 0) fragments.skills = { skills };

  // The requirements only, without Other (Jason, 2026-10-03): its description is private and
  // never part of a search, and without it an "Other" requirement cannot match the need — it
  // would only ask for opportunities that happen to list an Other of their own. Other alone
  // therefore inherits nothing. Not before Other is known: the fragment would otherwise show a
  // chip for Other alone, then drop it.
  const requirements = [
    ...new Set(preferences.accessibility.requirements),
  ].filter((id) => id !== profile.otherAccommodationId);
  if (profile.otherAccommodationId !== undefined && requirements.length > 0)
    fragments.accessibility = { accommodations: requirements };

  return fragments;
}

/** The fragments still in play: none with preferences off, and none the youth switched off. */
function survivingFragments(
  fragments: InheritedFragments,
  preferencesOff: boolean,
  skipped: PreferenceKey[],
): [PreferenceKey, InheritedFragment][] {
  if (preferencesOff) return [];
  return (
    Object.entries(fragments) as [PreferenceKey, InheritedFragment][]
  ).filter(([key]) => !skipped.includes(key));
}

/**
 * The effective filters a search runs with: the session's manual state, with the surviving
 * inherited fragments layered UNDER it (a manual choice on the same facet wins by replacing the
 * facet's value — array facets union, since both constraints are "any of"). What the controls
 * and chips show; `composeSearch` adds what the request also needs.
 */
export function applyInheritedFragments(
  manual: DiscoveryFilters,
  fragments: InheritedFragments,
  preferencesOff: boolean,
  skipped: PreferenceKey[],
): DiscoveryFilters {
  if (preferencesOff) return manual;

  const merged = survivingFragments(fragments, preferencesOff, skipped)
    .filter(([key]) => key !== "location")
    .reduce((acc, [, fragment]) => mergeFragment(acc, fragment), {
      ...manual,
    });

  // The inherited place is all-or-nothing and conditional: it joins only while the search is
  // for exactly its country and names no place of its own (`locationFragmentState`).
  const place = fragments.location;
  if (
    place &&
    locationFragmentState(manual, fragments, preferencesOff, skipped) ===
      "applied"
  )
    return {
      ...merged,
      region: place.region ?? null,
      city: place.city ?? null,
      point: place.point ?? null,
    };
  return merged;
}

/** Scalars keep the manual value when present; array facets union ("any of" both ways). */
function mergeFragment(
  merged: DiscoveryFilters,
  fragment: Partial<DiscoveryFilters>,
): DiscoveryFilters {
  const next = { ...merged };
  if (fragment.commitment && !next.commitment)
    next.commitment = fragment.commitment;
  if (fragment.incentivized != null && next.incentivized === null)
    next.incentivized = fragment.incentivized;
  if (fragment.age != null && next.age === null) next.age = fragment.age;
  for (const facet of [
    "types",
    "categories",
    "countries",
    "engagementTypes",
    "languages",
    "accommodations",
    "skills",
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
 * A search with its provenance — what `applyInheritedFragments` flattens away and the request
 * needs, since the API applies no preferences (2026-10-03). The controls and chips read
 * `filters`; the request builder (`searchRequest.ts`) reads the rest, which decides the
 * missing-data modes and the OR groups. Built by `composeSearch`; pure data.
 */
export interface DiscoverySearch {
  /** Manual + surviving inherited — `effectiveFilters`, what the controls and chips show. */
  filters: DiscoveryFilters;
  /**
   * Per multi-select whose mode follows provenance: whether its value is inherited only — no
   * manual pick beyond what a surviving preference already supplies (a manual duplicate of an
   * inherited value shows as the inherited chip, so it is not a pick of its own). Inherited
   * only, it is sent `Include`: opportunities that haven't said stay in. Any manual pick makes
   * the whole criterion `Exclude` — union, and the manual mode wins.
   */
  inheritedOnly: Record<"engagementTypes" | "accommodations", boolean>;
  /**
   * The surviving goal's category alternative, by name ("Start a business": `GOAL_CATEGORY_NAMES`)
   * — request-only, never a selected category. `null` without such a goal, or with it skipped.
   */
  goalCategoryNames: readonly string[] | null;
  /**
   * The inherited home country survives. The request then adds a plain Worldwide entry, as the
   * legacy page does, unless a radius is on (2026-10-03).
   */
  inheritedCountry: boolean;
}

/**
 * Manual filters + the surviving fragments → the search, provenance kept. The ONE composition
 * step: the surface, the wizard's live count and the "Picked for you" rail all run through it,
 * and the request builder takes only its output.
 */
export function composeSearch(
  manual: DiscoveryFilters,
  fragments: InheritedFragments,
  preferencesOff: boolean,
  skipped: PreferenceKey[],
): DiscoverySearch {
  const surviving = survivingFragments(fragments, preferencesOff, skipped);
  const inheritedOnly = (
    facet: "engagementTypes" | "accommodations",
  ): boolean => {
    const inherited = surviving.flatMap(
      ([, fragment]) => fragment[facet] ?? [],
    );
    return (
      inherited.length > 0 && manual[facet].every((v) => inherited.includes(v))
    );
  };
  const goal = surviving.find(([key]) => key === "goal")?.[1].userGoal;
  return {
    filters: applyInheritedFragments(
      manual,
      fragments,
      preferencesOff,
      skipped,
    ),
    inheritedOnly: {
      engagementTypes: inheritedOnly("engagementTypes"),
      accommodations: inheritedOnly("accommodations"),
    },
    goalCategoryNames: (goal && GOAL_CATEGORY_NAMES[goal]) ?? null,
    inheritedCountry: surviving.some(
      ([key, fragment]) =>
        key === "country" && (fragment.countries?.length ?? 0) > 0,
    ),
  };
}

/** A search with no preference layer — the landing rails that ignore preferences. */
export const manualSearch = (filters: DiscoveryFilters): DiscoverySearch =>
  composeSearch(filters, {}, true, []);

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
    Object.entries(fragments) as [PreferenceKey, InheritedFragment][]
  ).find(([, fragment]) => {
    const values = fragment[facet];
    return Array.isArray(values) && (values as string[]).includes(value);
  });
  return entry?.[0] ?? null;
}

/**
 * Preference keys whose skip can be PERSISTED by clearing a preset field. `country` and `age`
 * are identity-derived (country is the global profile field, edited only on the profile page;
 * never stored in the preset), so switching them off can only ever be a per-search choice.
 */
export const SAVABLE_SKIP_KEYS: readonly PreferenceKey[] = [
  "goal",
  "targetCategories",
  "location",
  "skills",
  "maxCommitment",
  "engagement",
  "incentivized",
  "languages",
  "accessibility",
];

/**
 * The skips "Make this my default" can persist — what its offer counts. Skills only while there
 * are self-attested skills to clear: verified skills are earned, never cleared, so with those
 * alone there is nothing to save, and offering would only bring the offer straight back.
 */
export function savableSkips(
  skipped: PreferenceKey[],
  preferences: UserPreferences,
): PreferenceKey[] {
  return skipped.filter(
    (key) =>
      SAVABLE_SKIP_KEYS.includes(key) &&
      (key !== "skills" || preferences.selfReportedSkills.length > 0),
  );
}

/**
 * The skips that stay in the URL once "Make this my default" has saved: the identity-derived
 * ones, which have no preset field, and skills while verified skills remain (Jason, 2026-10-03)
 * — saving cleared the self-attested ones, and without the skip the verified ones would bring
 * the chip straight back. They apply again on the next visit.
 */
export function skipsAfterSave(
  skipped: PreferenceKey[],
  verifiedSkillIds: string[],
): PreferenceKey[] {
  return skipped.filter(
    (key) =>
      !SAVABLE_SKIP_KEYS.includes(key) ||
      (key === "skills" && verifiedSkillIds.length > 0),
  );
}

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
      case "incentivized":
        next.incentivized = null;
        break;
      case "languages":
        next.languages = [];
        break;
      case "accessibility":
        next.accessibility = EMPTY_USER_ACCESSIBILITY;
        break;
      case "location":
        // The place goes; the country it was picked in stays (anonymous: it IS their country).
        next.location = {
          ...EMPTY_USER_LOCATION,
          countryId: next.location.countryId,
        };
        break;
      case "country":
      case "age":
        break; // identity-derived — nothing stored to clear
    }
  }
  return next;
}
