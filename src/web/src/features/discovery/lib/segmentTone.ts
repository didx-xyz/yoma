import type { DiscoveryFilters } from "./types";

/**
 * Where a search-bar segment's value comes from — the surface's colour rule (round 7,
 * 2026-09-30): GREEN = filters this search set, PURPLE = inherited from preferences, grey =
 * nothing set. Presentation only; the value itself still comes from the effective filters.
 * A segment carrying both reads as the search's own (manual wins, as it does in the chips).
 */
export type SegmentTone = "manual" | "inherited" | "empty";

export type SegmentId = "search" | "type" | "where" | "time" | "engagement";

const isSet = (filters: DiscoveryFilters, segment: SegmentId): boolean => {
  switch (segment) {
    case "search":
      return !!filters.q;
    case "type":
      return filters.types.length > 0;
    case "where":
      return (
        filters.countries.length > 0 ||
        !!filters.region ||
        !!filters.city ||
        filters.point !== null
      );
    case "time":
      return filters.commitment !== null;
    case "engagement":
      return filters.engagementTypes.length > 0;
  }
};

export const segmentTone = (
  manual: DiscoveryFilters,
  effective: DiscoveryFilters,
  segment: SegmentId,
): SegmentTone => {
  if (isSet(manual, segment)) return "manual";
  if (isSet(effective, segment)) return "inherited";
  return "empty";
};

/** Text colour per tone — green / purple / grey. */
export const SEGMENT_TONE_TEXT: Record<SegmentTone, string> = {
  manual: "text-green",
  inherited: "text-purple",
  empty: "text-gray-dark",
};

/** The leading dot per tone; an empty segment has none. */
export const SEGMENT_TONE_DOT: Record<SegmentTone, string | null> = {
  manual: "bg-green",
  inherited: "bg-purple",
  empty: null,
};
