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
  // Singular: each interest has its own chip ("Interest: Technology, AI & Data", 2026-10-08).
  targetCategories: "Interest",
  country: "Where",
  location: "Where",
  age: "Age",
  skills: "Skills",
  maxCommitment: "Time",
  // "How: Remote", as the How section and segment name it (2026-10-09).
  engagement: "How",
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
  // Singular, like every one-value chip: "Category: Beauty & Personal Care" (2026-10-08).
  categories: "Category",
  countries: "Where",
  region: "Where",
  city: "Where",
  radiusKm: "Distance",
  engagementTypes: "How",
  commitment: "Time",
  incentivized: "Pay",
  hasReward: "Rewards",
  zltoRanges: "Rewards",
  languages: "Language",
  accommodations: "Accessibility",
  sdgs: "Global goal",
  provider: "Provider",
  featured: "Picks",
  all: "Showing",
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

/**
 * The inherited skills chip, "Skills: 57 of yours" (Jason, 2026-10-06): how many of the youth's
 * skills the Jobs-only group sends. They aren't job skills, so the value doesn't say so.
 */
export const yourSkillsLabel = (count: number): string => `${count} of yours`;

/** The same count where it's printed without the chip's group: the one-line summaries. */
export const yourSkillsSummary = (count: number): string =>
  `${count} of your skills`;

/**
 * The inherited chips' notes — each chip's tooltip after its label (`Chip.tsx`). The skills group
 * narrows Jobs only, so on a search that can return no Job the chip is ghosted with the second.
 */
export const JOB_SKILLS_NOTE =
  "Skills you added, or earned by finishing opportunities. We hide jobs that need none of them. Jobs that don't list skills still show. Other types aren't affected.";
export const JOB_SKILLS_INAPPLICABLE_NOTE =
  "Not used: this search has no jobs.";

/**
 * The inherited accessibility chip, always: the needs are private and the screen may be shared,
 * so the chip never names or counts them — not in its value, its note or its labels.
 */
export const ACCESSIBILITY_CHIP_VALUE = "your needs";
export const ACCESSIBILITY_NOTE =
  "Hides opportunities that say No, or that miss one of your needs. Ones that haven't said still show.";

/** The inherited home country also brings in Worldwide, except with a radius on (2026-10-03). */
export const COUNTRY_NOTE =
  "Also shows worldwide opportunities, but not in a distance search.";

/**
 * A goal that is more than a type names both halves: "Entrepreneurship, plus Business, Finance &
 * Marketing opportunities of any type." Both names come from the lookups.
 */
export const goalNote = (typeName: string, categoryName: string): string =>
  `${typeName}, plus ${categoryName} opportunities of any type.`;

/** "Paid or rewarded" / "Unpaid" — the Pay chip, the Paid half of its section and the wizard. */
export const incentivizedLabel = (incentivized: boolean): string =>
  incentivized ? "Paid or rewarded" : "Unpaid";
