import type {
  DiscoveryFilters,
  DiscoverySort,
  DiscoveryState,
  DiscoveryViewMode,
  PreferenceKey,
} from "./types";
import { EMPTY_DISCOVERY_FILTERS } from "./types";

/**
 * The single reducer over `DiscoveryState`. Pure — the hook (`useDiscoveryQuery`) only wires it
 * to the router. Every filter change resets the page; a type change also clears the type-scoped
 * custom-field clauses (never silently kept). The view mode changes nothing else.
 */
export type DiscoveryAction =
  | { kind: "patchFilters"; patch: Partial<DiscoveryFilters> }
  | { kind: "setType"; type: string | null }
  | { kind: "toggleQuickSearch"; criteria: Partial<DiscoveryFilters> }
  | { kind: "removeManual"; facet: keyof DiscoveryFilters; raw: string }
  | { kind: "setSort"; sort: DiscoverySort }
  | { kind: "setView"; view: DiscoveryViewMode }
  | { kind: "setPage"; page: number }
  | { kind: "setPreferencesOff"; off: boolean }
  | { kind: "setPreferenceSkipped"; key: PreferenceKey; skipped: boolean }
  | { kind: "clearAll" };

/** A quick-search badge is "applied" when every value in its owned set is present. */
export function isQuickSearchApplied(
  filters: DiscoveryFilters,
  criteria: Partial<DiscoveryFilters>,
): boolean {
  return Object.entries(criteria).every(([facet, value]) => {
    const current = filters[facet as keyof DiscoveryFilters];
    if (Array.isArray(value))
      return value.every((v) => (current as string[]).includes(v as string));
    return JSON.stringify(current) === JSON.stringify(value);
  });
}

const applyCriteria = (
  filters: DiscoveryFilters,
  criteria: Partial<DiscoveryFilters>,
  remove: boolean,
): DiscoveryFilters => {
  const next = { ...filters };
  for (const [facet, value] of Object.entries(criteria)) {
    const key = facet as keyof DiscoveryFilters;
    if (Array.isArray(value) && typeof value[0] === "string") {
      const current = next[key] as string[];
      (next[key] as string[]) = remove
        ? current.filter((v) => !(value as string[]).includes(v))
        : [
            ...current,
            ...(value as string[]).filter((v) => !current.includes(v)),
          ];
    } else {
      // Scalar facets (type, commitment, hasReward): the badge owns the whole slot.
      (next[key] as unknown) = remove ? scalarDefault(key) : value;
    }
  }
  return next;
};

const scalarDefault = (facet: keyof DiscoveryFilters): unknown =>
  Array.isArray(EMPTY_DISCOVERY_FILTERS[facet])
    ? []
    : EMPTY_DISCOVERY_FILTERS[facet];

const removeFromFacet = (
  filters: DiscoveryFilters,
  facet: keyof DiscoveryFilters,
  raw: string,
): DiscoveryFilters => {
  const current = filters[facet];
  if (Array.isArray(current) && typeof current[0] === "string")
    return {
      ...filters,
      [facet]: (current as string[]).filter((v) => v !== raw),
    };
  return { ...filters, [facet]: scalarDefault(facet) };
};

export function reduceDiscovery(
  state: DiscoveryState,
  action: DiscoveryAction,
): DiscoveryState {
  switch (action.kind) {
    case "patchFilters":
      return {
        ...state,
        filters: { ...state.filters, ...action.patch },
        page: 1,
      };
    case "setType":
      // Changing the type swaps the definition groups — clauses scoped to the old type go with it.
      return {
        ...state,
        filters: { ...state.filters, type: action.type, customFields: [] },
        page: 1,
      };
    case "toggleQuickSearch": {
      const applied = isQuickSearchApplied(state.filters, action.criteria);
      return {
        ...state,
        filters: applyCriteria(state.filters, action.criteria, applied),
        page: 1,
      };
    }
    case "removeManual":
      return {
        ...state,
        filters: removeFromFacet(state.filters, action.facet, action.raw),
        page: 1,
      };
    case "setSort":
      return { ...state, sort: action.sort, page: 1 };
    case "setView":
      return { ...state, view: action.view };
    case "setPage":
      return { ...state, page: action.page };
    case "setPreferencesOff":
      return { ...state, preferencesOff: action.off, page: 1 };
    case "setPreferenceSkipped": {
      const without = state.preferencesSkipped.filter((k) => k !== action.key);
      return {
        ...state,
        preferencesSkipped: action.skipped ? [...without, action.key] : without,
        page: 1,
      };
    }
    case "clearAll":
      // Clears the session's choices; the preference layer (master switch, skips) is its own control.
      return { ...state, filters: EMPTY_DISCOVERY_FILTERS, page: 1 };
  }
}
