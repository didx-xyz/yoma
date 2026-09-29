import { toApiCoordinates } from "~/api/models/location";
import type {
  OpportunitySearchFilter,
  OpportunitySearchFilterCountry,
} from "~/api/models/opportunity";
import { LOCATION_SEARCH_LIVE } from "./location";
import type { DiscoveryFilters } from "./types";

/**
 * Effective `DiscoveryFilters` → the `/opportunity/search` request body. Pure; the ONE place the
 * request shape is built, shared by the live count and the results query so the two can never
 * disagree.
 *
 * The URL and state carry the Opportunity Type enum NAME; the search API filters types by GUID,
 * so the caller supplies the loaded types lookup. (The definitions endpoint is the opposite — it
 * binds the enum name, never the GUID.) Note the view mode is deliberately NOT a parameter here:
 * it is a rendering choice and must never reach the query.
 */

const orNull = <T>(values: T[]): T[] | null =>
  values.length > 0 ? values : null;

/**
 * The place, as a country entry (API 2026-09-28). A place belongs to exactly one country, so it
 * is sent only then. Distance with a point REPLACES the region / city match — the API rejects
 * the two together — and leaves out opportunities without coordinates; region / city "contains"
 * keeps those that name no place.
 */
function countryLocations(
  filters: DiscoveryFilters,
): OpportunitySearchFilterCountry[] | null {
  if (!LOCATION_SEARCH_LIVE || filters.countries.length !== 1) return null;
  const countryId = filters.countries[0]!;
  if (filters.radiusKm !== null && filters.point)
    return [
      {
        countryId,
        coordinates: toApiCoordinates(filters.point),
        radiusKm: filters.radiusKm,
      },
    ];
  if (filters.region !== null || filters.city !== null)
    return [{ countryId, region: filters.region, city: filters.city }];
  return null;
}

export function buildSearchFilter(
  filters: DiscoveryFilters,
  page: number,
  pageSize: number,
  typeIdByName: Record<string, string>,
): OpportunitySearchFilter {
  const typeIds = filters.types
    .map((name) => typeIdByName[name])
    .filter((id): id is string => !!id);

  return {
    pageNumber: page,
    pageSize,
    types: typeIds.length > 0 ? typeIds : null,
    categories: orNull(filters.categories),
    countries: orNull(filters.countries),
    countryLocations: countryLocations(filters),
    languages: orNull(filters.languages),
    organizations: null,
    engagementTypes: orNull(filters.engagementTypes),
    commitmentInterval: filters.commitment
      ? {
          options: null,
          interval: {
            id: filters.commitment.intervalId,
            count: filters.commitment.count,
          },
        }
      : null,
    incentivized: filters.incentivized,
    zltoReward:
      filters.hasReward !== null || filters.zltoRanges.length > 0
        ? {
            ranges: orNull(filters.zltoRanges),
            hasReward: filters.hasReward,
          }
        : null,
    accommodations: orNull(filters.accommodations),
    sustainableDevelopmentGoals: orNull(filters.sdgs),
    provider: filters.provider,
    age: filters.age,
    valueContains: filters.q,
    customFields: filters.customFields.length > 0 ? filters.customFields : null,
    featured: null,
    mostViewed: null,
    mostCompleted: null,
    publishedStates: null, // the service defaults to Active + NotStarted
  };
}

/**
 * The live count's request: the results request, criteria untouched, as a count-only search
 * (`totalCountOnly`, API 2026-09-29) — no items loaded and no pagination, so the count and
 * what "Show N results" returns cannot disagree.
 */
export function buildCountFilter(
  filters: DiscoveryFilters,
  typeIdByName: Record<string, string>,
): OpportunitySearchFilter {
  return {
    ...buildSearchFilter(filters, 1, 1, typeIdByName),
    pageNumber: null,
    pageSize: null,
    totalCountOnly: true,
  };
}
