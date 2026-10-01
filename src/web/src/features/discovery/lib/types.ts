import type { LocationCoordinates } from "~/api/models/location";
import type { CustomFieldFilter } from "~/api/models/opportunity";

/**
 * The discovery surface's filter state. The URL is the single source of truth for all of it —
 * one parser, one serialiser (`urlCodec.ts`), no parallel React state mirroring it.
 *
 * Every field binds to a core `OpportunitySearchFilter` param except `customFields`, which
 * carries YOM-1260 clauses verbatim. Facets the search API cannot filter on yet (skills) have NO
 * slot here — their sections render as visible-but-pending in the registry rather than holding
 * state the request would silently drop.
 */
export interface DiscoveryFilters {
  /** Free-text search — `valueContains`. */
  q: string | null;
  /** Opportunity Type enum NAMEs (Job | Learning | Event | ImpactAction | Entrepreneurship | Other), never GUIDs. Multi-select. */
  types: string[];
  /** Opportunity Category ids. */
  categories: string[];
  /** Country ids. */
  countries: string[];
  /**
   * Region / province and city — English names, case-insensitive "contains"; opportunities that
   * name no region or city stay in the results. Only meaningful with exactly one effective
   * country; cleared whenever the country changes.
   */
  region: string | null;
  city: string | null;
  /**
   * Centroid of the picked city, carried so Distance can measure from it. Never a filter on its
   * own and never the device fix; `null` for a typed city.
   */
  point: LocationCoordinates | null;
  /**
   * "Within N km" of the effective point (a picked city, or the inherited location). Replaces the
   * region / city match, and EXCLUDES opportunities that carry no coordinates.
   */
  radiusKm: number | null;
  /** EngagementType ids ("How you take part"). */
  engagementTypes: string[];
  /** "Up to" commitment — TimeInterval id + count. */
  commitment: { intervalId: string; count: number } | null;
  /** Pays or rewards (true) / doesn't (false) — `incentivized`; unspecified opportunities stay in. */
  incentivized: boolean | null;
  /** ZLTO reward — `zltoReward.hasReward`. */
  hasReward: boolean | null;
  /** ZLTO reward range ids — `zltoReward.ranges`. */
  zltoRanges: string[];
  /** Language ids. */
  languages: string[];
  /** Accessibility lookup ids — ALL must be listed; opportunities that list none are left out. */
  accommodations: string[];
  /** Sustainable Development Goal ids — any of them, or no goals specified. */
  sdgs: string[];
  /** Provider text, "contains" — the new core field, not the owning organisation. */
  provider: string | null;
  /**
   * The youth's age in whole years. Inherited only (from the profile's date of birth, as a
   * skippable chip) — no control sets it. Opportunities with no age bounds stay in.
   */
  age: number | null;
  /** Type-scoped custom-field clauses (YOM-1260 shape). Cleared when a type is deselected. */
  customFields: CustomFieldFilter[];
}

/** The preferences a youth can edit; identity-derived rows (country, age) are read-only. */
export const PREFERENCE_KEYS = [
  "goal",
  "targetCategories",
  "country",
  "location",
  "age",
  "skills",
  "maxCommitment",
  "engagement",
  "incentivized",
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
  types: [],
  categories: [],
  countries: [],
  region: null,
  city: null,
  point: null,
  radiusKm: null,
  engagementTypes: [],
  commitment: null,
  incentivized: null,
  hasReward: null,
  zltoRanges: [],
  languages: [],
  accommodations: [],
  sdgs: [],
  provider: null,
  age: null,
  customFields: [],
};

/**
 * Whether this search carries any filter of its own — exactly what "Clear filters" would remove,
 * which is why the button hides when this is false. The inherited preference layer is NOT part
 * of it: `clearFilters` never touches it, so it must never be the reason the button appears.
 */
export const hasActiveFilters = (filters: DiscoveryFilters): boolean =>
  JSON.stringify(filters) !== JSON.stringify(EMPTY_DISCOVERY_FILTERS);

export const DEFAULT_DISCOVERY_STATE: DiscoveryState = {
  filters: EMPTY_DISCOVERY_FILTERS,
  preferencesOff: false,
  preferencesSkipped: [],
  sort: "newest",
  view: "grid",
  page: 1,
};
