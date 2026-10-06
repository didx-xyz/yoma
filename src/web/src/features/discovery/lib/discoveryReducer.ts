import type { CustomFieldFilter } from "~/api/models/opportunity";
import type { InheritedFragments } from "./preferenceMapping";
import { applyInheritedFragments } from "./preferenceMapping";
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
 * to the router, passing in what the state doesn't hold (`ClauseAttribution`). Every filter
 * change resets the page; a type that leaves takes its custom-field clauses with it, and the
 * clauses of the types that remain stay (`clearDepartedClauses`). The view mode changes nothing
 * else.
 */
export type DiscoveryAction =
  | {
      kind: "patchFilters";
      patch: Partial<DiscoveryFilters>;
      /**
       * Preferences to switch off in the SAME change — e.g. "search in Kenya instead" must drop
       * the inherited South Africa, or the two would union into a two-country search.
       */
      skip?: PreferenceKey[];
    }
  /**
   * Replace the custom-field clauses for these definition keys and leave every other clause as
   * it is. Each block of controls owns only its own keys, so two blocks changing in one task (a
   * blur commit and the tap that caused it) both land, where a whole-list `patchFilters` built
   * from one render would undo the other.
   */
  | {
      kind: "setCustomFieldClauses";
      keys: string[];
      clauses: CustomFieldFilter[];
    }
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
   * two dispatches: dispatches in one task compose (`reduceFromLatest`), but each is its own
   * history entry, and Back would land between the two. Undo is `setPreferenceSkipped`.
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
   * A preference save landed (the wizard, "Make this my default" and its undo, "Keep answers"):
   * the inherited fragments went from `from` to `to`, which no URL change shows. `then` is the
   * save's own follow-up, reduced in the SAME action, so a save stays one history entry. The
   * clause rule compares the types in effect under the old preset with those under the new: a
   * type only the old preset supplied leaves, and takes its clauses with it. Without `then`
   * nothing else changes, so a save that drops no clause reduces to the state already rendered,
   * and nothing is pushed (`needsPush`).
   */
  | {
      kind: "preferencesSaved";
      from: InheritedFragments;
      to: InheritedFragments;
      then?: PreferenceSaveFollowUp;
    }
  /**
   * Clear the session's FILTERS and nothing else. It deliberately leaves the preference layer
   * exactly as it is (2026-09-05, reversing the 2026-09-03 round-2 reading that "clear all"
   * meant an empty search): preferences are a standing setting, not part of this search's
   * filters, and a control in the filter panel must not silently switch them off. The master
   * switch and the per-chip skip are how the layer comes off.
   */
  | { kind: "clearFilters" };

/** What a preference save does to the search besides changing the preset. */
export type PreferenceSaveFollowUp = Extract<
  DiscoveryAction,
  { kind: "resetPreferenceOverrides" | "setSkippedPreferences" }
>;

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

/**
 * Scalar facets a preference fragment can carry, whose manual duplicate `skipPreference` strips
 * like it strips an array value. The inherited place (region / city / point) is deliberately not
 * here: a manual place REPLACES the inherited one, so it is never a duplicate of it.
 */
const SKIPPABLE_SCALARS: (keyof DiscoveryFilters)[] = [
  "commitment",
  "incentivized",
  "age",
];

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

const PLACE_CLEARED: Pick<
  DiscoveryFilters,
  "region" | "city" | "point" | "radiusKm"
> = { region: null, city: null, point: null, radiusKm: null };

/**
 * A region / city picked in this search belongs to the one country it was picked under. When the
 * country the search is for may have changed — the manual countries changed, the inherited
 * country was skipped or restored, or the whole preference layer switched — the place (and the
 * distance measured from it) no longer means anything, so it goes. Global, like the clause rule
 * below, so no action can leave a South African city on a Kenyan search.
 */
function clearOrphanedPlace(
  state: DiscoveryState,
  next: DiscoveryState,
  action: DiscoveryAction,
): DiscoveryState {
  const f = next.filters;
  if (
    f.region === null &&
    f.city === null &&
    f.point === null &&
    f.radiusKm === null
  )
    return next;
  // A patch that sets the place together with its country ("search in Kenya instead") is the
  // one change that knows which country the place belongs to.
  if (
    action.kind === "patchFilters" &&
    ("region" in action.patch || "city" in action.patch)
  )
    return next;
  const countriesChanged =
    JSON.stringify(state.filters.countries) !== JSON.stringify(f.countries);
  const countryLayerChanged =
    ((action.kind === "skipPreference" ||
      action.kind === "setPreferenceSkipped") &&
      action.key === "country") ||
    (action.kind === "setPreferencesOff" &&
      action.off !== state.preferencesOff);
  return countriesChanged || countryLayerChanged
    ? { ...next, filters: { ...f, ...PLACE_CLEARED } }
    : next;
}

/**
 * What the clause rule needs that `DiscoveryState` doesn't hold. The hook passes it in at
 * dispatch, so the reducer stays pure.
 */
export interface ClauseAttribution {
  /**
   * The inherited fragments. A type is in effect when this search picked it OR a surviving
   * preference supplies it (the Goal), so switching the layer off or skipping the Goal removes
   * types that `filters.types` never held.
   */
  fragments: InheritedFragments;
  /**
   * One type's OWN custom-field keys (its definitions whose `entityContext` names it), from the
   * definitions discovery has already loaded; `undefined` when they aren't loaded (never asked
   * for, failed, or this API has none). Generic definitions belong to no one type, so they are
   * never listed.
   */
  typeKeys: (typeName: string) => string[] | undefined;
}

export function reduceDiscovery(
  state: DiscoveryState,
  action: DiscoveryAction,
  attribution: ClauseAttribution,
): DiscoveryState {
  if (action.kind === "preferencesSaved") {
    // The follow-up reduces as itself; the clause rule then sees the preset change as well.
    const step = action.then;
    const next = step
      ? clearOrphanedPlace(state, reduceAction(state, step), step)
      : state;
    return clearDepartedClauses(
      state,
      next,
      { before: action.from, after: action.to },
      attribution.typeKeys,
    );
  }
  const next = clearOrphanedPlace(state, reduceAction(state, action), action);
  return clearDepartedClauses(
    state,
    next,
    { before: attribution.fragments, after: attribution.fragments },
    attribution.typeKeys,
  );
}

/** The types the search runs with: picked here, plus a surviving preference's. */
const effectiveTypes = (
  state: DiscoveryState,
  fragments: InheritedFragments,
): string[] =>
  applyInheritedFragments(
    state.filters,
    fragments,
    state.preferencesOff,
    state.preferencesSkipped,
  ).types;

/**
 * Type-specific filters survive on the types that remain, and go with a type that leaves (Jason,
 * 2026-10-06) — WHATEVER removed it: the type row, a chip's ×, a quick-search toggle, a popover
 * reset, skipping the Goal preference, switching the preference layer off, or a saved preset
 * with a different Goal (`preferencesSaved`). Types are compared as they are in effect, under
 * the fragments before and after, so a type both inherited and picked by hand stays when the
 * layer goes.
 *
 * - A clause on a key a departed type owns goes, unless a remaining type owns it too.
 * - A clause on a generic key (no type context) stays while any type is still in effect.
 * - With no type left in effect, every clause goes.
 * - A departed type whose definitions aren't loaded can't be attributed, so every clause goes,
 *   as before 2026-10-06. Over-clearing is recoverable; a clause left on a type no longer in
 *   effect has no section to edit it in, and its chip can't name its field.
 *
 * Dropping a clause changes the results, so it returns to page 1.
 */
function clearDepartedClauses(
  state: DiscoveryState,
  next: DiscoveryState,
  fragments: { before: InheritedFragments; after: InheritedFragments },
  typeKeys: ClauseAttribution["typeKeys"],
): DiscoveryState {
  const clauses = next.filters.customFields;
  if (clauses.length === 0) return next;
  const remaining = effectiveTypes(next, fragments.after);
  const departed = effectiveTypes(state, fragments.before).filter(
    (type) => !remaining.includes(type),
  );
  if (departed.length === 0) return next;

  const dropped =
    remaining.length > 0 ? departedKeys(departed, remaining, typeKeys) : null;
  const kept =
    dropped === null
      ? []
      : clauses.filter((clause) => !dropped.has(clause.key.toLowerCase()));
  return kept.length === clauses.length
    ? next
    : { ...next, filters: { ...next.filters, customFields: kept }, page: 1 };
}

/**
 * The keys a departed type owns and no remaining type does, lower-cased (the API matches clause
 * keys case-insensitively). `null` when a departed type's keys aren't known.
 */
function departedKeys(
  departed: string[],
  remaining: string[],
  typeKeys: ClauseAttribution["typeKeys"],
): Set<string> | null {
  const dropped = new Set<string>();
  for (const type of departed) {
    const keys = typeKeys(type);
    if (keys === undefined) return null;
    for (const key of keys) dropped.add(key.toLowerCase());
  }
  for (const type of remaining)
    for (const key of typeKeys(type) ?? []) dropped.delete(key.toLowerCase());
  return dropped;
}

/** The state a dispatch pushed, and the router query it was reduced from. */
export interface PushedDiscoveryState<Query> {
  from: Query;
  state: DiscoveryState;
}

/**
 * Reduces an action from the freshest state there is. The router renders a push only after the
 * current task, so until then `query` still shows the state before it. A blur commit and the tap
 * that caused it dispatch in the same task, and reducing both from `query` let the second undo
 * the first (2026-10-05). So while the router still shows the query the last push was reduced
 * from, the next action reduces from that push. Once the query changes (the push landing, back /
 * forward, a link) the URL is the state again.
 */
export function reduceFromLatest<Query>(
  pushed: PushedDiscoveryState<Query> | null,
  query: Query,
  parse: (query: Query) => DiscoveryState,
  action: DiscoveryAction,
  attribution: ClauseAttribution,
): PushedDiscoveryState<Query> {
  const base =
    pushed !== null && pushed.from === query ? pushed.state : parse(query);
  return { from: query, state: reduceDiscovery(base, action, attribution) };
}

/**
 * Settles a rendered query string against the ones pushed here and not yet rendered, in order.
 * Rendering one of them means the search was edited here (any earlier ones were passed over).
 * Anything else means it was replaced: back / forward, a replayed recent search, a link.
 */
export function settlePushes(
  pending: string[],
  rendered: string,
): { replaced: boolean; pending: string[] } {
  const index = pending.indexOf(rendered);
  return index === -1
    ? { replaced: true, pending: [] }
    : { replaced: false, pending: pending.slice(index + 1) };
}

/**
 * Whether a dispatch has to push. Not when nothing is pending and its state serialises to the
 * query string already rendered: a push to the same URL still runs the router, and to a
 * non-canonical form of it (another param order, a dropped clause) adds a history entry. While
 * a push is pending it always pushes, since the router is about to show something else.
 */
export const needsPush = (
  pending: string[],
  next: string,
  rendered: string,
): boolean => pending.length > 0 || next !== rendered;

/** A preference save in flight: the preset from before it, and the query string it pushed. */
export interface SettlingSave<Preset> {
  preferences: Preset;
  /** `null` until the save's own push is dispatched. */
  until: string | null;
}

/**
 * The preset the surface shows. A save changes the stored preset first (the query cache
 * re-renders at once) and the URL later (its push renders when the router gets to it); until
 * that push renders, the preset from before the save, so no render pairs the new preset with the
 * old URL.
 */
export const presetToShow = <Preset>(
  stored: Preset,
  settling: SettlingSave<Preset> | null,
  rendered: string,
): Preset =>
  settling !== null && settling.until !== rendered
    ? settling.preferences
    : stored;

function reduceAction(
  state: DiscoveryState,
  // `preferencesSaved` wraps one of the others; `reduceDiscovery` unwraps it.
  action: Exclude<DiscoveryAction, { kind: "preferencesSaved" }>,
): DiscoveryState {
  switch (action.kind) {
    case "patchFilters":
      return {
        ...state,
        filters: { ...state.filters, ...action.patch },
        preferencesSkipped: action.skip
          ? [
              ...state.preferencesSkipped.filter(
                (k) => !action.skip!.includes(k),
              ),
              ...action.skip,
            ]
          : state.preferencesSkipped,
        page: 1,
      };
    case "setCustomFieldClauses":
      return {
        ...state,
        filters: {
          ...state.filters,
          customFields: [
            ...state.filters.customFields.filter(
              (c) => !action.keys.includes(c.key),
            ),
            ...action.clauses,
          ],
        },
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
    case "removeManual": {
      let filters = removeFromFacet(state.filters, action.facet, action.raw);
      // The centroid belongs to the city: removing the city removes what distance measured from.
      if (action.facet === "city") filters = { ...filters, point: null };
      return { ...state, filters, page: 1 };
    }
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
          SKIPPABLE_SCALARS.includes(key) &&
          current !== null &&
          JSON.stringify(current) === JSON.stringify(value)
        )
          filters = { ...filters, [key]: scalarDefault(key) };
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
    case "clearFilters":
      // `preferencesOff` and `preferencesSkipped` are deliberately untouched.
      return { ...state, filters: EMPTY_DISCOVERY_FILTERS, page: 1 };
  }
}
