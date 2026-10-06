import type { LocationCoordinates } from "~/api/models/location";
import type { CustomFieldFilter } from "~/api/models/opportunity";

/**
 * The discovery surface's filter state. The URL is the single source of truth for all of it —
 * one parser, one serialiser (`urlCodec.ts`), no parallel React state mirroring it.
 *
 * Every field binds to a search criterion (`searchRequest.ts` builds the request) except
 * `customFields`, which carries YOM-1260 clauses verbatim. `age` and `skills` are inherited only:
 * no control sets them and the URL never carries them.
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
  /**
   * EngagementType ids ("How you take part"), any of them. Inherited only, opportunities that
   * don't say stay in; a manual pick leaves them out (2026-10-03, `composeSearch`).
   */
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
  /**
   * Accessibility lookup ids — ALL must be listed, and an opportunity that says No never matches.
   * Inherited only (the saved requirements), opportunities that list none stay in; a manual pick
   * leaves them out (2026-10-03, `composeSearch`).
   */
  accommodations: string[];
  /** Sustainable Development Goal ids — any of them, or no goals specified. */
  sdgs: string[];
  /** Provider text, "contains" — the new core field, not the owning organisation. */
  provider: string | null;
  /**
   * Featured opportunities only — `featured`. The landing's Featured rail and its "See all" set
   * it; the removable chip is its only control (no filter-panel section). The API filters only on
   * `true`, so `true` is the one value the URL carries.
   */
  featured: boolean | null;
  /**
   * The youth's age in whole years. Inherited only (from the profile's date of birth, as a
   * skippable chip) — no control sets it. Opportunities with no age bounds stay in.
   */
  age: number | null;
  /**
   * Skill ids — inherited only (the saved self-attested skills plus, signed in, the verified
   * ones): no control sets them and the URL never carries them. Sent as the Jobs-only skills
   * group (`searchRequest.ts`), never as a root criterion, so jobs that list no skills stay in
   * and other types are not narrowed.
   */
  skills: string[];
  /**
   * Custom-field clauses (YOM-1260 shape). The API scopes each to its definition's type, so a Job
   * clause never narrows an Event. A type's clauses leave with it (`reduceDiscovery`).
   */
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
  featured: null,
  age: null,
  skills: [],
  customFields: [],
};

const FILTER_KEYS = Object.keys(
  EMPTY_DISCOVERY_FILTERS,
) as (keyof DiscoveryFilters)[];

/**
 * Whether this search carries any filter of its own — exactly what "Clear filters" would remove,
 * which is why the button hides when this is false. The inherited preference layer is NOT part
 * of it: `clearFilters` never touches it, so it must never be the reason the button appears.
 *
 * Compared facet by facet, so the order in which a parser or a patch writes the keys can never
 * make an empty search look filtered (per-key `JSON.stringify` keeps array and object equality).
 */
export const hasActiveFilters = (filters: DiscoveryFilters): boolean =>
  FILTER_KEYS.some(
    (key) =>
      JSON.stringify(filters[key]) !==
      JSON.stringify(EMPTY_DISCOVERY_FILTERS[key]),
  );

export const DEFAULT_DISCOVERY_STATE: DiscoveryState = {
  filters: EMPTY_DISCOVERY_FILTERS,
  preferencesOff: false,
  preferencesSkipped: [],
  sort: "newest",
  view: "grid",
  page: 1,
};
