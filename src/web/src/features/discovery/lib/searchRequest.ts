import type { OpportunitySearchFilter } from "~/api/models/opportunity";
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

const orNull = (values: string[]): string[] | null =>
  values.length > 0 ? values : null;

export function buildSearchFilter(
  filters: DiscoveryFilters,
  page: number,
  pageSize: number,
  typeIdByName: Record<string, string>,
): OpportunitySearchFilter {
  const typeId = filters.type ? typeIdByName[filters.type] : undefined;

  return {
    pageNumber: page,
    pageSize,
    types: typeId ? [typeId] : null,
    categories: orNull(filters.categories),
    countries: orNull(filters.countries),
    languages: orNull(filters.languages),
    organizations: orNull(filters.providers),
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
    zltoReward:
      filters.hasReward !== null || filters.zltoRanges.length > 0
        ? {
            ranges: orNull(filters.zltoRanges),
            hasReward: filters.hasReward,
          }
        : null,
    valueContains: filters.q,
    customFields: filters.customFields.length > 0 ? filters.customFields : null,
    featured: null,
    mostViewed: null,
    mostCompleted: null,
    publishedStates: null, // the service defaults to Active + NotStarted
  };
}
