import type {
  UserLocation,
  UserPreferenceScope,
} from "~/api/models/userPreferences";
import type { UserPreferences } from "~/api/models/userPreferences";
import { hasPlace } from "~/api/models/location";
import type { InheritedFragments } from "./preferenceMapping";
import type { DiscoveryFilters, PreferenceKey } from "./types";

/**
 * The location rules of the discovery surface — one module, pure, so the section, the bar, the
 * chips, the mapping and the badge cannot disagree about what "where" means.
 *
 * Country is the profile's global country for a signed-in youth and the session's answer for an
 * anonymous one. Region / city / centroid belong to that country: they apply only while the
 * search is for exactly that one country, and a stored place picked under a different country
 * is stale and never applied.
 */

/**
 * ⚠️ TEMPORARY — the search API cannot filter on region, city or distance yet (Location API in
 * development). While this is `false` the request builder sends none of them and every home
 * that shows them says so (`LOCATION_NOT_APPLIED`); the controls, URL, chips, badge and
 * inheritance are live so the surface does not change shape when the API lands. Nothing is
 * filtered client-side: results are paged server-side, and a page-local filter would lie.
 */
export const LOCATION_SEARCH_LIVE = false;

export const LOCATION_NOT_APPLIED =
  "Region, city and distance aren't applied to results yet — location search is still being built.";

export const RADIUS_OPTIONS_KM = [10, 25, 50, 100] as const;
export const DEFAULT_RADIUS_KM = 25;

/** The country a youth's region and city belong to: the profile's, or the session answer. */
export function homeCountryId(
  scope: UserPreferenceScope,
  profileCountryId: string | null,
  preferences: UserPreferences | null | undefined,
): string | null {
  return scope === "user"
    ? profileCountryId
    : (preferences?.location.countryId ?? null);
}

/** The stored place when it is set AND still belongs to the home country; otherwise `null`. */
export function activeUserLocation(
  location: UserLocation,
  home: string | null,
): UserLocation | null {
  return hasPlace(location) && home !== null && location.countryId === home
    ? location
    : null;
}

/** A stored place picked under a country that is no longer the youth's. */
export const isStaleUserLocation = (
  location: UserLocation,
  home: string | null,
): boolean => hasPlace(location) && location.countryId !== home;

/**
 * Why the inherited location is — or is not — part of this search.
 * - `applied`: the search is for exactly its country and names no place of its own.
 * - `skipped`: the youth switched it off (struck through, undoable).
 * - `replaced`: the search names its own region or city, which replaces the inherited place.
 * - `otherCountry`: the search is for a different country, several, or none — a city in the
 *   youth's country means nothing there (agreed 2026-09-28).
 */
export type LocationFragmentState =
  | "applied"
  | "skipped"
  | "replaced"
  | "otherCountry";

const union = (a: string[], b: string[]): string[] => [
  ...a,
  ...b.filter((x) => !a.includes(x)),
];

export function locationFragmentState(
  manual: DiscoveryFilters,
  fragments: InheritedFragments,
  preferencesOff: boolean,
  skipped: PreferenceKey[],
): LocationFragmentState | null {
  if (!fragments.location || preferencesOff) return null;
  if (skipped.includes("location")) return "skipped";
  if (manual.region !== null || manual.city !== null) return "replaced";
  const countries = (
    Object.entries(fragments) as [PreferenceKey, Partial<DiscoveryFilters>][]
  )
    .filter(([key]) => key !== "location" && !skipped.includes(key))
    .reduce(
      (acc, [, fragment]) => union(acc, fragment.countries ?? []),
      manual.countries,
    );
  const home = fragments.country?.countries?.[0] ?? null;
  return countries.length === 1 && countries[0] === home
    ? "applied"
    : "otherCountry";
}

/** "Cape Town, Western Cape" · "Cape Town" · "Western Cape" — `null` when no place is set. */
export function placeLabel(
  place: Pick<DiscoveryFilters, "region" | "city">,
): string | null {
  if (place.city && place.region) return `${place.city}, ${place.region}`;
  return place.city ?? place.region ?? null;
}

/** "Within 25 km of Cape Town" — the radius only means something with a point to measure from. */
export function distanceLabel(filters: DiscoveryFilters): string | null {
  if (filters.radiusKm === null) return null;
  if (filters.point === null)
    return `Within ${filters.radiusKm} km — pick a city`;
  const from = filters.city ?? filters.region;
  return from
    ? `Within ${filters.radiusKm} km of ${from}`
    : `Within ${filters.radiusKm} km`;
}

/**
 * The Where summary for the desktop bar segment and the mobile pill — the most specific value
 * in play: "25 km of Cape Town" → "Cape Town" → "Western Cape" → "South Africa +1" → null.
 */
export function whereSummary(
  filters: DiscoveryFilters,
  countryLabel: (id: string) => string,
): string | null {
  const from = filters.city ?? filters.region;
  if (filters.radiusKm !== null && filters.point !== null)
    return from
      ? `${filters.radiusKm} km of ${from}`
      : `Within ${filters.radiusKm} km`;
  if (from) return from;
  if (filters.countries.length === 0) return null;
  const first = countryLabel(filters.countries[0]!);
  const more = filters.countries.length - 1;
  return more > 0 ? `${first} +${more}` : first;
}

/** Whether any below-country location value is in play — the "not applied yet" line's trigger. */
export const hasLocationFilter = (filters: DiscoveryFilters): boolean =>
  filters.region !== null || filters.city !== null || filters.radiusKm !== null;
