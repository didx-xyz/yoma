import type { DiscoveryFilters, PreferenceKey } from "./types";

/** Chip group labels — data for `chipModel.ts`, the one place chip wording lives. */
export const PREF_GROUPS: Record<PreferenceKey, string> = {
  goal: "Type",
  targetCategories: "Interests",
  country: "Where",
  age: "Age",
  skills: "Skills",
  maxCommitment: "Time",
  engagement: "Format",
  languages: "Language",
  accessibility: "Accessibility",
};

export const FACET_GROUPS: Partial<Record<keyof DiscoveryFilters, string>> = {
  type: "Type",
  categories: "Categories",
  countries: "Where",
  engagementTypes: "Format",
  commitment: "Time",
  hasReward: "Rewards",
  zltoRanges: "Rewards",
  languages: "Language",
  providers: "Provider",
};

export const MANUAL_LIST_FACETS = [
  "categories",
  "countries",
  "engagementTypes",
  "zltoRanges",
  "languages",
  "providers",
] as const;
