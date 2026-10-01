import type { DiscoveryFilters, PreferenceKey } from "./types";

/**
 * Chip group labels — data for `chipModel.ts`, the one place chip wording lives.
 *
 * `goal` is deliberately absent from the preference groups: its chip takes the group of
 * whatever facet the fragment actually carries (`FACET_GROUPS`) — a TYPE for every goal since
 * 2026-10-01, when "Start a business" moved from a Category to the Entrepreneurship type.
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

/** "Paid or rewarded" / "Unpaid" — the Pay chip, the Paid half of its section and the wizard. */
export const incentivizedLabel = (incentivized: boolean): string =>
  incentivized ? "Paid or rewarded" : "Unpaid";
