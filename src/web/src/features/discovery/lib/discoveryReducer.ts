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
 * to the router. Every filter change resets the page; deselecting a type also clears the
 * type-scoped custom-field clauses (never silently kept — clauses are not tagged by type, so
 * removal clears them all rather than guessing which belonged to the departed type). The view
 * mode changes nothing else.
 */
export type DiscoveryAction =
  | { kind: "patchFilters"; patch: Partial<DiscoveryFilters> }
  | { kind: "toggleType"; name: string }
  | { kind: "toggleQuickSearch"; criteria: Partial<DiscoveryFilters> }
  | { kind: "removeManual"; facet: keyof DiscoveryFilters; raw: string }
  | { kind: "setSort"; sort: DiscoverySort }
  | { kind: "setView"; view: DiscoveryViewMode }
  | { kind: "setPage"; page: number }
  | { kind: "setPreferencesOff"; off: boolean }
  /**
   * Switch one inherited preference off for this search — AND strip its fragment's values from
   * the manual filters. Without the strip, a value that is both inherited and manually set
   * (via a quick search, or picked before preferences resolved) would survive the skip as a
   * hidden manual duplicate and resurface as a green chip, still filtering. One action, not
   * two dispatches, because the second would race the router. Undo is `setPreferenceSkipped`.
   */
  | {
      kind: "skipPreference";
      key: PreferenceKey;
      fragment: Partial<DiscoveryFilters>;
    }
  | { kind: "setPreferenceSkipped"; key: PreferenceKey; skipped: boolean }
  /** Replace the whole skip list — used after "Save to profile" persists the savable skips. */
  | { kind: "setSkippedPreferences"; keys: PreferenceKey[] }
  /** The wizard just saved new defaults — stale per-preference skips no longer mean anything. */
  | { kind: "resetPreferenceOverrides" }
  /**
   * Clear all also switches off the active inherited layer for this search (struck-through
   * chips, undoable) — a youth pressing it means "empty search", not "empty except my preset".
   * The caller supplies the keys since fragments live outside the reducer.
   */
  | { kind: "clearAll"; skipPreferences: PreferenceKey[] };

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
  const next = reduceAction(state, action);

  // Type-scoped custom-field clauses never outlive their type, WHATEVER removed it — the type
  // row, the chip's ×, a quick-search toggle, a popover reset, or skipping the inherited Goal
  // preference (whose fragment supplies a type). Clauses are not tagged by type, so the rule
  // clears them all rather than guessing which belonged to the departed type.
  const removedType = state.filters.types.some(
    (t) => !next.filters.types.includes(t),
  );
  const skippedGoal =
    (action.kind === "setPreferenceSkipped" &&
      action.key === "goal" &&
      action.skipped) ||
    (action.kind === "skipPreference" && action.key === "goal");
  if ((removedType || skippedGoal) && next.filters.customFields.length > 0)
    return { ...next, filters: { ...next.filters, customFields: [] } };

  return next;
}

function reduceAction(
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
    case "toggleType":
      // Clause clearing on removal lives in `reduceDiscovery`'s global rule, not here.
      return {
        ...state,
        filters: {
          ...state.filters,
          types: state.filters.types.includes(action.name)
            ? state.filters.types.filter((t) => t !== action.name)
            : [...state.filters.types, action.name],
        },
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
    case "skipPreference": {
      let filters = state.filters;
      for (const [facet, value] of Object.entries(action.fragment)) {
        const key = facet as keyof DiscoveryFilters;
        const current = filters[key];
        if (Array.isArray(current) && Array.isArray(value))
          filters = {
            ...filters,
            [key]: (current as string[]).filter(
              (v) => !(value as string[]).includes(v),
            ),
          };
        else if (
          key === "commitment" &&
          filters.commitment &&
          JSON.stringify(filters.commitment) === JSON.stringify(value)
        )
          filters = { ...filters, commitment: null };
      }
      return {
        ...state,
        filters,
        preferencesSkipped: [
          ...state.preferencesSkipped.filter((k) => k !== action.key),
          action.key,
        ],
        page: 1,
      };
    }
    case "setPreferenceSkipped": {
      const without = state.preferencesSkipped.filter((k) => k !== action.key);
      return {
        ...state,
        preferencesSkipped: action.skipped ? [...without, action.key] : without,
        page: 1,
      };
    }
    case "setSkippedPreferences":
      return { ...state, preferencesSkipped: action.keys, page: 1 };
    case "resetPreferenceOverrides":
      return {
        ...state,
        preferencesOff: false,
        preferencesSkipped: [],
        page: 1,
      };
    case "clearAll":
      return {
        ...state,
        filters: EMPTY_DISCOVERY_FILTERS,
        preferencesSkipped: [
          ...new Set([...state.preferencesSkipped, ...action.skipPreferences]),
        ],
        page: 1,
      };
  }
}
