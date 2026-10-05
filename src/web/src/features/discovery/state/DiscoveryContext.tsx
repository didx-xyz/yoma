import { useAtomValue } from "jotai";
import { useRouter } from "next/router";
import React, {
  createContext,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import type {
  UserPreferenceScope,
  UserPreferences,
} from "~/api/models/userPreferences";
import { userProfileAtom } from "~/lib/store";
import type { ChipLabelResolver, DiscoveryChip } from "../lib/chipModel";
import { buildChips } from "../lib/chipModel";
import { ageInYears } from "../lib/dates";
import type { DiscoveryAction } from "../lib/discoveryReducer";
import { homeCountryId as resolveHomeCountryId } from "../lib/location";
import type {
  DiscoverySearch,
  InheritedFragments,
} from "../lib/preferenceMapping";
import {
  composeSearch,
  mapPreferencesToFilters,
} from "../lib/preferenceMapping";
import type {
  DiscoveryFilters,
  DiscoveryState,
  PreferenceKey,
} from "../lib/types";
import { hasActiveFilters } from "../lib/types";
import {
  engagementDisplayName,
  sdgLabel,
  useDiscoveryLookups,
  type DiscoveryLookups,
} from "./useDiscoveryLookups";
import { useAnonymousMigration } from "./useAnonymousMigration";
import { useDiscoveryQuery } from "./useDiscoveryQuery";
import { usePreferences } from "./usePreferences";
import { useResultCount } from "./useResultCount";
import { useVerifiedSkillIds } from "./useVerifiedSkillIds";
import { useViewMode } from "./useViewMode";

/** What "Make this my default" overwrote, so the banner can offer to put it back. */
export interface PreferenceSnapshot {
  preferences: UserPreferences;
  skipped: PreferenceKey[];
}

/** One context per surface — wiring only; every rule lives in the pure modules it composes. */
export interface DiscoveryContextValue {
  state: DiscoveryState;
  dispatch: (action: DiscoveryAction) => void;
  ready: boolean;
  lookups: DiscoveryLookups;
  preferences: UserPreferences | null | undefined;
  /** Signed-in (`user`) or not — decides who owns the country (profile vs session answer). */
  scope: UserPreferenceScope;
  /**
   * The youth's country: the profile's when signed in, the session answer when anonymous. The
   * inherited country and the country the stored region / city must belong to.
   */
  homeCountryId: string | null;
  savePreferences: (preferences: UserPreferences) => Promise<UserPreferences>;
  /** The sign-in "keep your answers" offer — see `useAnonymousMigration`. */
  migration: ReturnType<typeof useAnonymousMigration>;
  /**
   * The preset and skip list as they were before the banner's last "Make this my default" —
   * what its inline Undo restores. It lives HERE rather than in the banner because saving the
   * last override can empty the query, which flips the surface from results to landing and
   * remounts the banner; the offer of an undo must not depend on which of the two is mounted.
   */
  preferenceUndo: PreferenceSnapshot | null;
  setPreferenceUndo: (snapshot: PreferenceSnapshot | null) => void;
  fragments: InheritedFragments;
  /**
   * The search with its provenance (`composeSearch`) — what every request on the surface is built
   * from (`buildSearchFilter` / `buildCountFilter`).
   */
  search: DiscoverySearch;
  /**
   * Whether THIS search's request (`search`) can go out: the route and the lookups have settled,
   * and — unless preferences are off — the preferences, (signed in) the verified skills and,
   * while it inherits accessibility needs, the full accessibility list. So the first request is
   * not replaced a moment later.
   */
  searchReady: boolean;
  /**
   * The same for a search built WITH the preference layer, inheriting these accessibility needs,
   * whatever the switch says — the wizard's live count, over its draft.
   */
  preferenceSearchReady: (accessibilityNeeds: string[]) => boolean;
  /** The signed-in youth's verified skill ids (none when signed out). */
  verifiedSkillIds: string[];
  /** What the search actually runs with: manual state + surviving inherited fragments. */
  effectiveFilters: DiscoveryFilters;
  chips: DiscoveryChip[];
  resolveLabel: ChipLabelResolver;
  /**
   * Clear this search's filters. The preference layer is NOT part of them: it survives, chips
   * and all (2026-09-05 — see the `clearFilters` action).
   */
  clearFilters: () => void;
  /** Whether anything is there to clear — the Clear filters button hides when nothing is. */
  hasFilters: boolean;
  /**
   * Switch one preference off for this search — the ONE deselect path for inherited values
   * (chip ×, section control, type row, category tile). Also strips the fragment's values from
   * the manual filters so a manual duplicate cannot survive the skip. Undo via
   * `setPreferenceSkipped(key, false)`.
   */
  skipPreference: (key: PreferenceKey) => void;
  /** The results count row registers here; `scrollToResults` brings it into view. */
  resultsAnchorRef: React.RefObject<HTMLDivElement | null>;
  /**
   * Scroll to the results header. Called ONLY by explicit "Show N results" actions (dialog and
   * sheet footers, segment popovers, the wizard's finish) and the pager — never as a side
   * effect of selecting or changing a filter.
   */
  scrollToResults: () => void;
  count: number | null;
  counting: boolean;
  /** The live count could not be fetched — "Show results" drops the number rather than lying. */
  countFailed: boolean;
  setView: (view: DiscoveryState["view"]) => void;
  readPersonalizationSeen: () => boolean;
  markPersonalizationSeen: () => void;
}

const DiscoveryContext = createContext<DiscoveryContextValue | null>(null);

export const DiscoveryProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const router = useRouter();
  const { state, dispatch, ready } = useDiscoveryQuery();
  const lookups = useDiscoveryLookups();
  const profile = useAtomValue(userProfileAtom);
  const {
    scope,
    preferences,
    settled: preferencesSettled,
    save: savePreferences,
    readPersonalizationSeen,
    markPersonalizationSeen,
  } = usePreferences();
  const migration = useAnonymousMigration(
    scope,
    preferences,
    savePreferences,
    profile?.countryId ?? null,
  );
  const homeCountryId = resolveHomeCountryId(
    scope,
    profile?.countryId ?? null,
    preferences,
  );
  const [preferenceUndo, setPreferenceUndo] =
    useState<PreferenceSnapshot | null>(null);

  // Identity-derived: only a signed-in youth has a date of birth to read.
  const age =
    scope === "user" ? ageInYears(profile?.dateOfBirth, new Date()) : null;
  // Signed in, the earned skills join the saved ones (one cached request a session).
  const { ids: verifiedSkillIds, settled: verifiedSkillsSettled } =
    useVerifiedSkillIds();
  const { otherAccommodationId } = lookups;

  const fragments = useMemo(
    () =>
      preferences
        ? mapPreferencesToFilters(preferences, {
            countryId: homeCountryId,
            age,
            verifiedSkillIds,
            otherAccommodationId,
          })
        : {},
    [preferences, homeCountryId, age, verifiedSkillIds, otherAccommodationId],
  );

  const search = composeSearch(
    state.filters,
    fragments,
    state.preferencesOff,
    state.preferencesSkipped,
  );
  const effectiveFilters = search.filters;
  // Everything a search is composed from has settled — the first request is the real one. The
  // preference layer (the session, the preferences, the verified skills) only for a search that
  // uses it: with preferences off it changes nothing, and must not hold the request. The full
  // accessibility list only for a search that inherits needs: Other is found in it.
  const preferenceSearchReady = (accessibilityNeeds: string[]): boolean =>
    ready &&
    lookups.searchReady &&
    preferencesSettled &&
    verifiedSkillsSettled &&
    (accessibilityNeeds.length === 0 || lookups.accessibilitySettled);
  const searchReady = state.preferencesOff
    ? ready && lookups.searchReady
    : preferenceSearchReady(
        state.preferencesSkipped.includes("accessibility")
          ? []
          : (preferences?.accessibility.requirements ?? []),
      );

  const resolveLabel: ChipLabelResolver = (facet, value) => {
    const byId = (items: { id: string; name: string }[]): string =>
      items.find((item) => item.id === value)?.name ?? value;
    switch (facet) {
      case "types":
        // State carries the enum NAME; only the displayName is shown.
        return (
          lookups.types.find((t) => t.name === value)?.displayName ?? value
        );
      case "categories":
        return byId(lookups.categories);
      case "countries":
        return byId(lookups.countries);
      case "engagementTypes":
        return engagementDisplayName(lookups.engagementTypes, value);
      case "commitment":
        return byId(lookups.timeIntervals);
      case "languages":
        return byId(lookups.languages);
      case "accommodations":
        // The facet list first, then the full list: a pick of a need no published opportunity
        // lists (a stale or shared `acc=`) still reads as a name, never a GUID.
        return byId([...lookups.accommodations, ...lookups.accessibility]);
      case "sdgs": {
        const goal = lookups.sdgs.find((g) => g.id === value);
        return goal ? sdgLabel(goal) : value;
      }
      default:
        return value;
    }
  };

  const chips = buildChips(
    state.filters,
    fragments,
    state.preferencesOff,
    state.preferencesSkipped,
    resolveLabel,
    lookups,
  );

  const clearFilters = (): void => dispatch({ kind: "clearFilters" });

  const skipPreference = (key: PreferenceKey): void =>
    dispatch({ kind: "skipPreference", key, fragment: fragments[key] ?? {} });

  const resultsAnchorRef = useRef<HTMLDivElement | null>(null);
  const scrollToResults = (): void => {
    // The caller is usually a closing overlay: the body scroll-lock (`overflow: hidden`)
    // releases one render later, and scrolling while locked is silently ignored — so retry over
    // a few frames until the lock is gone and the anchor exists, instead of hoping one rAF wins.
    let attempts = 0;
    const tryScroll = (): void => {
      attempts += 1;
      const anchor = resultsAnchorRef.current;
      if (anchor && document.body.style.overflow !== "hidden") {
        anchor.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
      if (attempts < 15) requestAnimationFrame(tryScroll);
    };
    requestAnimationFrame(tryScroll);
  };

  const {
    count,
    counting,
    failed: countFailed,
  } = useResultCount(search, lookups, searchReady);

  const { setView } = useViewMode(
    state,
    dispatch,
    typeof router.query.view === "string",
    ready,
  );

  const value: DiscoveryContextValue = {
    state,
    dispatch,
    ready,
    lookups,
    preferences,
    scope,
    homeCountryId,
    savePreferences,
    migration,
    preferenceUndo,
    setPreferenceUndo,
    fragments,
    search,
    searchReady,
    preferenceSearchReady,
    verifiedSkillIds,
    effectiveFilters,
    chips,
    resolveLabel,
    clearFilters,
    hasFilters: hasActiveFilters(state.filters),
    skipPreference,
    resultsAnchorRef,
    scrollToResults,
    count,
    counting,
    countFailed,
    setView,
    readPersonalizationSeen,
    markPersonalizationSeen,
  };

  return (
    <DiscoveryContext.Provider value={value}>
      {children}
    </DiscoveryContext.Provider>
  );
};

export function useDiscovery(): DiscoveryContextValue {
  const value = useContext(DiscoveryContext);
  if (!value)
    throw new Error("useDiscovery must be used within <DiscoveryProvider>");
  return value;
}
