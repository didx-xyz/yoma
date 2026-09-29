import { OPPORTUNITY_TYPE_NANE_JOB } from "~/lib/constants";
import type { FacetStatus } from "../../lib/apiStatus";
import { incentivizedLabel } from "../../lib/chipGroups";
import { upToIntervalLabel } from "../../lib/format";
import { whereSummary } from "../../lib/location";
import { owningPreference } from "../../lib/preferenceMapping";
import type {
  FilterSectionBinding,
  FilterSectionDef,
} from "../../registry/filterSections";
import { useDiscovery } from "../../state/DiscoveryContext";
import type { LookupKey } from "../../state/useDiscoveryLookups";
import { sdgLabel } from "../../state/useDiscoveryLookups";

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
  /** Whether the lookup behind this section loaded — reported inside the section it feeds. */
  status: FacetStatus;
  /** A one-line reason the options are withheld right now (e.g. ZLTO while Type includes Job). */
  notice: string | null;
  /** The Paid half of Paid and rewards — a second facet in the same section. */
  secondary: SectionModel | null;
  /** The free-text value of a `text` control, and how to commit it (`null` clears). */
  text: { value: string | null; commit: (value: string | null) => void } | null;
}

/** Which lookup each binding's options come from, for `status`; `null` = no lookup (free text). */
const LOOKUP_FOR_BINDING: Record<FilterSectionBinding, LookupKey | null> = {
  categories: "categories",
  countries: "countries",
  engagementTypes: "engagementTypes",
  commitment: "timeIntervals",
  zlto: "zltoRanges",
  languages: "languages",
  accommodations: "accommodations",
  sdgs: "sdgs",
  provider: null,
};

const HAS_REWARD_ID = "has-reward";
const PAID_ID = "paid";
const UNPAID_ID = "unpaid";

export function useSectionModel(section: FilterSectionDef): SectionModel {
  const {
    state,
    dispatch,
    lookups,
    effectiveFilters,
    fragments,
    skipPreference,
  } = useDiscovery();
  const { filters } = state;
  const lookupKey =
    section.binding === null ? null : LOOKUP_FOR_BINDING[section.binding];
  // No lookup behind it: a pending section's note already says what it is; free text has none.
  const status: FacetStatus =
    lookupKey === null ? "ok" : lookups.status[lookupKey];

  type ListFacet =
    | "categories"
    | "countries"
    | "engagementTypes"
    | "languages"
    | "accommodations"
    | "sdgs";

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
          ? owningPreference(fragments, facet, id)
          : null;
        if (prefKey) skipPreference(prefKey);
        else
          dispatch({
            kind: "patchFilters",
            patch: { [facet]: [...manual, id] },
          });
      },
      summary: selected.length === 0 ? "Any" : `${selected.length} selected`,
      status,
      notice: null,
      secondary: null,
      text: null,
    };
  };

  const named = (items: { id: string; name: string }[]): SectionOption[] =>
    items.map((item) => ({ id: item.id, label: item.name, count: null }));

  // Paid or rewarded / Unpaid — `incentivized`, which the incentive preference also feeds. A
  // different value REPLACES the inherited one (the preference is skipped in the same change),
  // so the two can never disagree about what the search is doing.
  const paidModel = (): SectionModel => {
    const effective = effectiveFilters.incentivized;
    const selectedId =
      effective === null ? null : effective ? PAID_ID : UNPAID_ID;
    return {
      options: [
        { id: PAID_ID, label: incentivizedLabel(true), count: null },
        { id: UNPAID_ID, label: incentivizedLabel(false), count: null },
      ],
      selected: selectedId ? [selectedId] : [],
      toggle: (id) => {
        const value = id === PAID_ID;
        const inherited =
          fragments.incentivized?.incentivized !== undefined &&
          filters.incentivized === null &&
          effective !== null;
        if (effective === value) {
          if (inherited) skipPreference("incentivized");
          else
            dispatch({ kind: "patchFilters", patch: { incentivized: null } });
          return;
        }
        dispatch({
          kind: "patchFilters",
          patch: { incentivized: value },
          skip: fragments.incentivized ? ["incentivized"] : undefined,
        });
      },
      summary: effective === null ? "Any" : incentivizedLabel(effective),
      status: "ok",
      notice: null,
      secondary: null,
      text: null,
    };
  };

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
    case "countries": {
      // The header reads the most specific place in play, like the bar segment and the pill.
      const model = listModel(named(lookups.countries), "countries");
      return {
        ...model,
        summary:
          whereSummary(
            effectiveFilters,
            (id) => lookups.countries.find((c) => c.id === id)?.name ?? id,
          ) ?? "Anywhere",
      };
    }
    case "engagementTypes":
      // The lookup's displayName (Remote / On-site / Hybrid), never its enum-like name.
      return listModel(
        lookups.engagementTypes.map((e) => ({
          id: e.id,
          label: e.displayName || e.name,
          count: null,
        })),
        "engagementTypes",
      );
    case "languages":
      return listModel(named(lookups.languages), "languages");
    case "accommodations":
      // Manual only — the stored accessibility requirements are not inherited (see
      // `preferenceMapping.ts`), so the section never reads FROM PREFERENCES.
      return listModel(named(lookups.accommodations), "accommodations");
    case "sdgs":
      return listModel(
        lookups.sdgs.map((goal) => ({
          id: goal.id,
          label: sdgLabel(goal),
          count: null,
        })),
        "sdgs",
      );
    case "provider":
      return {
        options: [],
        selected: [],
        toggle: () => undefined,
        summary: filters.provider ?? "Any",
        status,
        notice: null,
        secondary: null,
        text: {
          value: filters.provider,
          commit: (value) =>
            dispatch({
              kind: "patchFilters",
              patch: { provider: value?.trim() || null },
            }),
        },
      };
    case "commitment": {
      const options = lookups.timeIntervals.map((i) => ({
        id: i.id,
        label: upToIntervalLabel(i.name),
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
            skipPreference("maxCommitment");
          else
            dispatch({
              kind: "patchFilters",
              patch: { commitment: { intervalId: id, count: 1 } },
            });
        },
        summary: selectedId
          ? (options.find((o) => o.id === selectedId)?.label ?? "Any")
          : "Any",
        status,
        notice: null,
        secondary: null,
        text: null,
      };
    }
    case "zlto": {
      const selected = [
        ...(filters.hasReward === true ? [HAS_REWARD_ID] : []),
        ...filters.zltoRanges,
      ];
      // Jobs do not carry ZLTO (BA Reward Type rule): while the effective types include Job the
      // ZLTO options are withheld and the reason stated. Keyed to the core Type enum name — the
      // same constant the legacy badges use — not to any custom field. An already-set ZLTO
      // filter stays visible (and removable) in the applied chips.
      const jobSelected = effectiveFilters.types.includes(
        OPPORTUNITY_TYPE_NANE_JOB,
      );
      const options: SectionOption[] = jobSelected
        ? []
        : [
            { id: HAS_REWARD_ID, label: "With ZLTO reward", count: null },
            ...named(lookups.zltoRanges),
          ];
      const paid = paidModel();
      const inPlay = selected.length + paid.selected.length;
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
        summary:
          inPlay === 0
            ? "Any"
            : selected.length === 0
              ? paid.summary
              : `${inPlay} selected`,
        status,
        notice: jobSelected ? "Jobs do not carry ZLTO." : null,
        secondary: paid,
        text: null,
      };
    }
    case null:
      return {
        options: [],
        selected: [],
        toggle: () => undefined,
        summary: "Coming soon",
        status,
        notice: null,
        secondary: null,
        text: null,
      };
  }
}
