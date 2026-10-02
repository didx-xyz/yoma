import type { CustomFieldFilter } from "~/api/models/opportunity";
import { RADIUS_OPTIONS_KM } from "./location";
import type {
  DiscoveryFilters,
  DiscoveryState,
  DiscoverySort,
  DiscoveryViewMode,
  PreferenceKey,
} from "./types";
import {
  DEFAULT_DISCOVERY_STATE,
  hasActiveFilters,
  PREFERENCE_KEYS,
} from "./types";

/**
 * URL ↔ DiscoveryState — the single parser and single serialiser. The URL is the only source of
 * truth for filter state, sort, page AND view mode; nothing mirrors it in React state.
 *
 * Custom-field clauses travel as JSON in ONE `cf` param, YOM-1260's transport: `URLSearchParams`
 * does the encoding — never `encodeURIComponent` on top of it. Defaults are omitted so a clean
 * landing has a clean URL.
 *
 * Engagement travels as `engagement=` (a list; renamed from `format=` on 2026-09-22 when the
 * segment replaced Pay on the bar — nothing reads the old name). There has never been a `pay=`
 * param: the Paid and rewards section writes `reward=` and `zlto=`, unchanged.
 *
 * Location below country: `region=` and `city=` (English names), `pt=lat,lng` (the picked
 * city's centroid, ROUNDED to 2 decimals ≈ 1 km — Copy link shares the URL, so it must never
 * carry more precision than "which city") and `km=` (one of the radius options).
 *
 * 2026-09-29, with the new core facets: `paid=1|0` (incentivized), `acc=` (accommodations),
 * `sdg=` and `provider=` (free text — it replaces `org=`, the organisation ids the Provider
 * section held before the Provider field existed; nothing reads `org=` any more). `age` has no
 * param: it is inherited from the profile only, never chosen here.
 *
 * 2026-10-02 (round 10): `featured=1`, the landing's Featured rail. Only `1` is read: the API
 * filters on `featured == true` alone, so a `0` would be a filter that filters nothing.
 */

type Query = Record<string, string | string[] | undefined>;

const single = (query: Query, key: string): string | null => {
  const value = query[key];
  return typeof value === "string" && value !== "" ? value : null;
};

const list = (query: Query, key: string): string[] =>
  single(query, key)?.split(",").filter(Boolean) ?? [];

const parsePoint = (raw: string | null): DiscoveryFilters["point"] => {
  const [lat, lng] = raw?.split(",").map(Number) ?? [];
  return lat !== undefined &&
    lng !== undefined &&
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    Math.abs(lat) <= 90 &&
    Math.abs(lng) <= 180
    ? { latitude: lat, longitude: lng }
    : null;
};

const round2 = (n: number): string => (Math.round(n * 100) / 100).toString();

const parseCustomFields = (raw: string | null): CustomFieldFilter[] => {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (clause): clause is CustomFieldFilter =>
        typeof clause === "object" &&
        clause !== null &&
        typeof (clause as CustomFieldFilter).key === "string" &&
        typeof (clause as CustomFieldFilter).operator === "string",
    );
  } catch {
    return [];
  }
};

export function parseDiscoveryQuery(query: Query): DiscoveryState {
  const time = single(query, "time");
  const [intervalId, countRaw] = time?.split(":") ?? [];
  const count = Number(countRaw);
  const reward = single(query, "reward");
  const paid = single(query, "paid");
  const sort = single(query, "sort");
  const view = single(query, "view");
  const page = Number(single(query, "page"));
  const km = Number(single(query, "km"));

  return {
    filters: {
      q: single(query, "q"),
      types: list(query, "type"),
      categories: list(query, "cat"),
      countries: list(query, "where"),
      region: single(query, "region"),
      city: single(query, "city"),
      point: parsePoint(single(query, "pt")),
      radiusKm: (RADIUS_OPTIONS_KM as readonly number[]).includes(km)
        ? km
        : null,
      engagementTypes: list(query, "engagement"),
      commitment:
        intervalId && Number.isFinite(count) && count > 0
          ? { intervalId, count }
          : null,
      incentivized: paid === null ? null : paid === "1",
      hasReward: reward === null ? null : reward === "1",
      zltoRanges: list(query, "zlto"),
      languages: list(query, "lang"),
      accommodations: list(query, "acc"),
      sdgs: list(query, "sdg"),
      provider: single(query, "provider"),
      featured: single(query, "featured") === "1" ? true : null,
      age: null,
      customFields: parseCustomFields(single(query, "cf")),
    },
    preferencesOff: single(query, "prefsOff") === "1",
    preferencesSkipped: list(query, "prefsSkip").filter(
      (key): key is PreferenceKey =>
        (PREFERENCE_KEYS as readonly string[]).includes(key),
    ),
    sort:
      sort === "endingSoonest" || sort === "mostZlto"
        ? (sort as DiscoverySort)
        : "newest",
    view: view === "list" ? ("list" as DiscoveryViewMode) : "grid",
    page: Number.isFinite(page) && page > 1 ? page : 1,
  };
}

export function serializeDiscoveryState(state: DiscoveryState): string {
  const params = new URLSearchParams();
  const { filters } = state;
  const defaults = DEFAULT_DISCOVERY_STATE;

  if (filters.q) params.set("q", filters.q);
  const lists: [string, string[]][] = [
    ["type", filters.types],
    ["cat", filters.categories],
    ["where", filters.countries],
    ["engagement", filters.engagementTypes],
    ["zlto", filters.zltoRanges],
    ["lang", filters.languages],
    ["acc", filters.accommodations],
    ["sdg", filters.sdgs],
  ];
  for (const [key, values] of lists)
    if (values.length > 0) params.set(key, values.join(","));
  if (filters.provider) params.set("provider", filters.provider);
  if (filters.featured) params.set("featured", "1");
  if (filters.incentivized !== null)
    params.set("paid", filters.incentivized ? "1" : "0");
  if (filters.region) params.set("region", filters.region);
  if (filters.city) params.set("city", filters.city);
  if (filters.point)
    params.set(
      "pt",
      `${round2(filters.point.latitude)},${round2(filters.point.longitude)}`,
    );
  if (filters.radiusKm !== null) params.set("km", String(filters.radiusKm));
  if (filters.commitment)
    params.set(
      "time",
      `${filters.commitment.intervalId}:${filters.commitment.count}`,
    );
  if (filters.hasReward !== null)
    params.set("reward", filters.hasReward ? "1" : "0");
  if (filters.customFields.length > 0)
    params.set("cf", JSON.stringify(filters.customFields));
  if (state.preferencesOff) params.set("prefsOff", "1");
  if (state.preferencesSkipped.length > 0)
    params.set("prefsSkip", state.preferencesSkipped.join(","));
  if (state.sort !== defaults.sort) params.set("sort", state.sort);
  if (state.view !== defaults.view) params.set("view", state.view);
  if (state.page > 1) params.set("page", String(state.page));

  return params.toString();
}

/** True when nothing differs from a clean landing — the "search not yet run" surface. */
export function isDefaultDiscoveryState(state: DiscoveryState): boolean {
  return (
    serializeDiscoveryState({
      ...state,
      view: DEFAULT_DISCOVERY_STATE.view,
    }) === "" && !hasActiveFilters(state.filters)
  );
}
