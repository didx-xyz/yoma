import type { DiscoveryFilters, PreferenceKey } from "./types";

/**
 * Chip group labels — data for `chipModel.ts`, the one place chip wording lives.
 *
 * `goal` is deliberately absent from the preference groups: its fragment is a TYPE for four
 * goals and a CATEGORY for "Start a business" (BA mapping, 2026-09-22), so its chip takes the
 * group of whatever facet the fragment actually carries (`FACET_GROUPS`).
 */
export const PREF_GROUPS: Partial<Record<PreferenceKey, string>> = {
  targetCategories: "Interests",
  country: "Where",
  age: "Age",
  skills: "Skills",
  maxCommitment: "Time",
  engagement: "Engagement",
  languages: "Language",
  accessibility: "Accessibility",
};

export const FACET_GROUPS: Partial<Record<keyof DiscoveryFilters, string>> = {
  types: "Type",
  categories: "Categories",
  countries: "Where",
  engagementTypes: "Engagement",
  commitment: "Time",
  hasReward: "Rewards",
  zltoRanges: "Rewards",
  languages: "Language",
  providers: "Provider",
};

export const MANUAL_LIST_FACETS = [
  "types",
  "categories",
  "countries",
  "engagementTypes",
  "zltoRanges",
  "languages",
  "providers",
] as const;
