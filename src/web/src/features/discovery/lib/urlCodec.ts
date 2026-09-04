import type { CustomFieldFilter } from "~/api/models/opportunity";
import type {
  DiscoveryState,
  DiscoverySort,
  DiscoveryViewMode,
  PreferenceKey,
} from "./types";
import {
  DEFAULT_DISCOVERY_STATE,
  EMPTY_DISCOVERY_FILTERS,
  PREFERENCE_KEYS,
} from "./types";

/**
 * URL ↔ DiscoveryState — the single parser and single serialiser. The URL is the only source of
 * truth for filter state, sort, page AND view mode; nothing mirrors it in React state.
 *
 * Custom-field clauses travel as JSON in ONE `cf` param, YOM-1260's transport: `URLSearchParams`
 * does the encoding — never `encodeURIComponent` on top of it. Defaults are omitted so a clean
 * landing has a clean URL.
 */

type Query = Record<string, string | string[] | undefined>;

const single = (query: Query, key: string): string | null => {
  const value = query[key];
  return typeof value === "string" && value !== "" ? value : null;
};

const list = (query: Query, key: string): string[] =>
  single(query, key)?.split(",").filter(Boolean) ?? [];

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
  const sort = single(query, "sort");
  const view = single(query, "view");
  const page = Number(single(query, "page"));

  return {
    filters: {
      q: single(query, "q"),
      type: single(query, "type"),
      categories: list(query, "cat"),
      countries: list(query, "where"),
      engagementTypes: list(query, "format"),
      commitment:
        intervalId && Number.isFinite(count) && count > 0
          ? { intervalId, count }
          : null,
      hasReward: reward === null ? null : reward === "1",
      zltoRanges: list(query, "zlto"),
      languages: list(query, "lang"),
      providers: list(query, "org"),
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
  if (filters.type) params.set("type", filters.type);
  const lists: [string, string[]][] = [
    ["cat", filters.categories],
    ["where", filters.countries],
    ["format", filters.engagementTypes],
    ["zlto", filters.zltoRanges],
    ["lang", filters.languages],
    ["org", filters.providers],
  ];
  for (const [key, values] of lists)
    if (values.length > 0) params.set(key, values.join(","));
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
    }) === "" &&
    JSON.stringify(state.filters) === JSON.stringify(EMPTY_DISCOVERY_FILTERS)
  );
}
