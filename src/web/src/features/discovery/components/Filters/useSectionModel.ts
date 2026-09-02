import type { PreferenceKey } from "../../lib/types";
import type { FilterSectionDef } from "../../registry/filterSections";
import { useDiscovery } from "../../state/DiscoveryContext";

/**
 * Adapts one registry section to a uniform control model — options, selection, toggle — from the
 * discovery context. The single place binding→state wiring lives, so `<FilterControl>` stays a
 * pure kind→markup switch and both breakpoint containers behave identically.
 *
 * Selection reflects the EFFECTIVE filters (manual + surviving inherited preferences), so a feed
 * tuned to South Africa shows South Africa selected. Deselecting an inherited value skips its
 * owning preference for this search — the same semantics as removing its chip.
 */
export interface SectionOption {
  id: string;
  /** `null` = the lookup carries no counts (only categories do today). 0 greys out, stays visible. */
  count: number | null;
  label: string;
}

export interface SectionModel {
  options: SectionOption[];
  selected: string[];
  toggle: (id: string) => void;
  /** Header summary of the current selection, e.g. "2 selected" or "Any". */
  summary: string;
}

const HAS_REWARD_ID = "has-reward";

export function useSectionModel(section: FilterSectionDef): SectionModel {
  const { state, dispatch, lookups, effectiveFilters, fragments } =
    useDiscovery();
  const { filters } = state;

  type ListFacet =
    | "categories"
    | "countries"
    | "engagementTypes"
    | "languages"
    | "providers";

  /** The preference whose fragment supplies `value` for `facet`, if any. */
  const owningPreference = (
    facet: ListFacet,
    value: string,
  ): PreferenceKey | null => {
    const entry = Object.entries(fragments).find(([, fragment]) =>
      fragment[facet]?.includes(value),
    );
    return (entry?.[0] as PreferenceKey) ?? null;
  };

  const listModel = (
    options: SectionOption[],
    facet: ListFacet,
  ): SectionModel => {
    const manual = filters[facet];
    const selected = effectiveFilters[facet];
    return {
      options,
      selected,
      toggle: (id) => {
        if (manual.includes(id)) {
          dispatch({
            kind: "patchFilters",
            patch: { [facet]: manual.filter((v) => v !== id) },
          });
          return;
        }
        const prefKey = selected.includes(id)
          ? owningPreference(facet, id)
          : null;
        if (prefKey)
          dispatch({
            kind: "setPreferenceSkipped",
            key: prefKey,
            skipped: true,
          });
        else
          dispatch({
            kind: "patchFilters",
            patch: { [facet]: [...manual, id] },
          });
      },
      summary: selected.length === 0 ? "Any" : `${selected.length} selected`,
    };
  };

  const named = (items: { id: string; name: string }[]): SectionOption[] =>
    items.map((item) => ({ id: item.id, label: item.name, count: null }));

  switch (section.binding) {
    case "categories":
      return listModel(
        lookups.categories.map((c) => ({
          id: c.id,
          label: c.name,
          count: c.count,
        })),
        "categories",
      );
    case "countries":
      return listModel(named(lookups.countries), "countries");
    case "engagementTypes":
      return listModel(named(lookups.engagementTypes), "engagementTypes");
    case "languages":
      return listModel(named(lookups.languages), "languages");
    case "providers":
      // No preference feeds providers (FACET_FOR_BINDING.providers is null) — manual only,
      // but routed through listModel so behaviour stays uniform.
      return listModel(named(lookups.organizations), "providers");
    case "commitment": {
      const options = lookups.timeIntervals.map((i) => ({
        id: i.id,
        label: `Up to a ${i.name.toLowerCase()}`,
        count: null,
      }));
      const manualId = filters.commitment?.intervalId ?? null;
      const selectedId = effectiveFilters.commitment?.intervalId ?? null;
      return {
        options,
        selected: selectedId ? [selectedId] : [],
        toggle: (id) => {
          if (manualId === id) {
            dispatch({ kind: "patchFilters", patch: { commitment: null } });
            return;
          }
          if (selectedId === id && fragments.maxCommitment)
            dispatch({
              kind: "setPreferenceSkipped",
              key: "maxCommitment",
              skipped: true,
            });
          else
            dispatch({
              kind: "patchFilters",
              patch: { commitment: { intervalId: id, count: 1 } },
            });
        },
        summary: selectedId
          ? (options.find((o) => o.id === selectedId)?.label ?? "Any")
          : "Any",
      };
    }
    case "zlto": {
      const options: SectionOption[] = [
        { id: HAS_REWARD_ID, label: "With ZLTO reward", count: null },
        ...named(lookups.zltoRanges),
      ];
      const selected = [
        ...(filters.hasReward === true ? [HAS_REWARD_ID] : []),
        ...filters.zltoRanges,
      ];
      return {
        options,
        selected,
        toggle: (id) =>
          dispatch({
            kind: "patchFilters",
            patch:
              id === HAS_REWARD_ID
                ? { hasReward: filters.hasReward === true ? null : true }
                : {
                    zltoRanges: filters.zltoRanges.includes(id)
                      ? filters.zltoRanges.filter((v) => v !== id)
                      : [...filters.zltoRanges, id],
                  },
          }),
        summary: selected.length === 0 ? "Any" : `${selected.length} selected`,
      };
    }
    case null:
      return {
        options: [],
        selected: [],
        toggle: () => undefined,
        summary: "Coming soon",
      };
  }
}
