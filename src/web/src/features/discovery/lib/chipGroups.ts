import type { UserGoal } from "~/api/models/userPreferences";
import type { DiscoveryFilters, PreferenceKey } from "./types";

/**
 * Chip group labels and notes — data for `chipModel.ts`, the one place chip wording lives.
 *
 * `goal` is deliberately absent from the preference groups: a goal that maps to a type alone
 * takes the group of the facet its fragment carries (`FACET_GROUPS`, "Type: Job"). A goal that is
 * more than a type is named as a goal (`GOAL_CHIPS`): "Start a business" is the Entrepreneurship
 * type OR the Business category since 2026-10-03.
 */
export const PREF_GROUPS: Partial<Record<PreferenceKey, string>> = {
  targetCategories: "Interests",
  country: "Where",
  location: "Where",
  age: "Age",
  skills: "Skills",
  maxCommitment: "Time",
  engagement: "Engagement",
  incentivized: "Pay",
  languages: "Language",
  accessibility: "Accessibility",
};

/** Goals named as a goal rather than as their type — group "Goal". */
export const GOAL_GROUP = "Goal";
export const GOAL_CHIPS: Partial<Record<UserGoal, string>> = {
  biz: "Starting a business",
};

export const FACET_GROUPS: Partial<Record<keyof DiscoveryFilters, string>> = {
  types: "Type",
  categories: "Categories",
  countries: "Where",
  region: "Where",
  city: "Where",
  radiusKm: "Distance",
  engagementTypes: "Engagement",
  commitment: "Time",
  incentivized: "Pay",
  hasReward: "Rewards",
  zltoRanges: "Rewards",
  languages: "Language",
  accommodations: "Accessibility",
  sdgs: "SDGs",
  provider: "Provider",
  featured: "Picks",
  age: "Age",
};

export const MANUAL_LIST_FACETS = [
  "types",
  "categories",
  "countries",
  "engagementTypes",
  "zltoRanges",
  "languages",
  "accommodations",
  "sdgs",
] as const;

/** The inherited skills chip: how many skills the Jobs-only group sends. */
export const jobSkillsLabel = (count: number): string =>
  `${count} job ${count === 1 ? "skill" : "skills"}`;

/**
 * The inherited chips' notes — each chip's tooltip after its label (`Chip.tsx`). The skills group
 * narrows Jobs only, so on a search that can return no Job the chip is ghosted with the second.
 */
export const JOB_SKILLS_NOTE =
  "Jobs that ask for none of these are left out; jobs that list no skills stay in. Other types aren't affected.";
export const JOB_SKILLS_INAPPLICABLE_NOTE =
  "Not applied — this search has no jobs.";

/**
 * The inherited accessibility chip, always: the needs are private and the screen may be shared,
 * so the chip never names or counts them — not in its value, its note or its labels.
 */
export const ACCESSIBILITY_CHIP_VALUE = "your needs";
export const ACCESSIBILITY_NOTE =
  "Leaves out opportunities that say No, or whose list misses one of your needs. Ones that haven't said stay in.";

/** The inherited home country also brings in Worldwide, except with a radius on (2026-10-03). */
export const COUNTRY_NOTE =
  "Also includes opportunities open worldwide, except in a distance search.";

/**
 * A goal that is more than a type names both halves: "Entrepreneurship, plus Business, Finance &
 * Marketing opportunities of any type." Both names come from the lookups.
 */
export const goalNote = (typeName: string, categoryName: string): string =>
  `${typeName}, plus ${categoryName} opportunities of any type.`;

/** "Paid or rewarded" / "Unpaid" — the Pay chip, the Paid half of its section and the wizard. */
export const incentivizedLabel = (incentivized: boolean): string =>
  incentivized ? "Paid or rewarded" : "Unpaid";
