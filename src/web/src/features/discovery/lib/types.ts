import type { CustomFieldFilter } from "~/api/models/opportunity";

/**
 * The discovery surface's filter state. The URL is the single source of truth for all of it —
 * one parser, one serialiser (`urlCodec.ts`), no parallel React state mirroring it.
 *
 * Every field binds to a core `OpportunitySearchFilter` param except `customFields`, which
 * carries YOM-1260 clauses verbatim. Facets the search API cannot filter on yet (skills, SDGs,
 * target groups, accessibility) deliberately have NO slot here — their sections render as
 * visible-but-pending in the registry rather than holding state the request would silently drop.
 */
export interface DiscoveryFilters {
  /** Free-text search — `valueContains`. */
  q: string | null;
  /** Opportunity Type enum NAME (Job | Learning | Event | Task | Other), never the GUID. */
  type: string | null;
  /** Opportunity Category ids. */
  categories: string[];
  /** Country ids. */
  countries: string[];
  /** EngagementType ids ("How you take part"). */
  engagementTypes: string[];
  /** "Up to" commitment — TimeInterval id + count. Opportunities with none set are INCLUDED. */
  commitment: { intervalId: string; count: number } | null;
  /** ZLTO reward — `zltoReward.hasReward`. */
  hasReward: boolean | null;
  /** ZLTO reward range ids — `zltoReward.ranges`. */
  zltoRanges: string[];
  /** Language ids. */
  languages: string[];
  /** Organization ids ("Provider"). */
  providers: string[];
  /** Type-scoped custom-field clauses (YOM-1260 shape). Cleared when `type` changes. */
  customFields: CustomFieldFilter[];
}

/** The preferences a youth can edit; identity-derived rows (country, age) are read-only. */
export const PREFERENCE_KEYS = [
  "goal",
  "targetCategories",
  "country",
  "age",
  "skills",
  "maxCommitment",
  "engagement",
  "languages",
  "accessibility",
] as const;
export type PreferenceKey = (typeof PREFERENCE_KEYS)[number];

export type DiscoverySort = "newest" | "endingSoonest" | "mostZlto";
export type DiscoveryViewMode = "grid" | "list";

export interface DiscoveryState {
  filters: DiscoveryFilters;
  /** Master "Using my preferences" switch — drops/restores the whole inherited set. */
  preferencesOff: boolean;
  /** Individual inherited chips switched off for this search (stay on screen, struck through). */
  preferencesSkipped: PreferenceKey[];
  sort: DiscoverySort;
  /** A rendering choice over an unchanged result set — never part of the query itself. */
  view: DiscoveryViewMode;
  page: number;
}

export const EMPTY_DISCOVERY_FILTERS: DiscoveryFilters = {
  q: null,
  type: null,
  categories: [],
  countries: [],
  engagementTypes: [],
  commitment: null,
  hasReward: null,
  zltoRanges: [],
  languages: [],
  providers: [],
  customFields: [],
};

export const DEFAULT_DISCOVERY_STATE: DiscoveryState = {
  filters: EMPTY_DISCOVERY_FILTERS,
  preferencesOff: false,
  preferencesSkipped: [],
  sort: "newest",
  view: "grid",
  page: 1,
};
