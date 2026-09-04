import { useAtomValue } from "jotai";
import { useRouter } from "next/router";
import React, { createContext, useContext, useMemo } from "react";
import type { UserPreferences } from "~/api/models/userPreferences";
import { userProfileAtom } from "~/lib/store";
import type { ChipLabelResolver, DiscoveryChip } from "../lib/chipModel";
import { buildChips } from "../lib/chipModel";
import type { DiscoveryAction } from "../lib/discoveryReducer";
import type { InheritedFragments } from "../lib/preferenceMapping";
import {
  applyInheritedFragments,
  mapPreferencesToFilters,
} from "../lib/preferenceMapping";
import type { DiscoveryFilters, DiscoveryState } from "../lib/types";
import {
  useDiscoveryLookups,
  type DiscoveryLookups,
} from "./useDiscoveryLookups";
import { useDiscoveryQuery } from "./useDiscoveryQuery";
import { usePreferences } from "./usePreferences";
import { useResultCount } from "./useResultCount";
import { useViewMode } from "./useViewMode";

/** One context per surface — wiring only; every rule lives in the pure modules it composes. */
export interface DiscoveryContextValue {
  state: DiscoveryState;
  dispatch: (action: DiscoveryAction) => void;
  ready: boolean;
  lookups: DiscoveryLookups;
  preferences: UserPreferences | null | undefined;
  savePreferences: (preferences: UserPreferences) => Promise<UserPreferences>;
  fragments: InheritedFragments;
  /** What the search actually runs with: manual state + surviving inherited fragments. */
  effectiveFilters: DiscoveryFilters;
  chips: DiscoveryChip[];
  resolveLabel: ChipLabelResolver;
  count: number | null;
  counting: boolean;
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
    preferences,
    save: savePreferences,
    readPersonalizationSeen,
    markPersonalizationSeen,
  } = usePreferences();

  const fragments = useMemo(
    () =>
      preferences
        ? mapPreferencesToFilters(preferences, {
            countryId: profile?.countryId ?? null,
          })
        : {},
    [preferences, profile?.countryId],
  );

  const effectiveFilters = applyInheritedFragments(
    state.filters,
    fragments,
    state.preferencesOff,
    state.preferencesSkipped,
  );

  const resolveLabel: ChipLabelResolver = (facet, value) => {
    const byId = (items: { id: string; name: string }[]): string =>
      items.find((item) => item.id === value)?.name ?? value;
    switch (facet) {
      case "categories":
        return byId(lookups.categories);
      case "countries":
        return byId(lookups.countries);
      case "engagementTypes":
        return byId(lookups.engagementTypes);
      case "commitment":
        return byId(lookups.timeIntervals);
      case "languages":
        return byId(lookups.languages);
      case "providers":
        return byId(lookups.organizations);
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
  );

  const { count, counting } = useResultCount(
    effectiveFilters,
    lookups.typeIdByName,
    ready && lookups.types.length > 0,
  );

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
    savePreferences,
    fragments,
    effectiveFilters,
    chips,
    resolveLabel,
    count,
    counting,
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
