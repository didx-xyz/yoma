import { openToAllIdOf } from "~/components/Opportunity/Admin/opportunityCoreFields";
import { OPPORTUNITY_TYPE_NANE_JOB } from "~/lib/constants";
import type { FacetStatus } from "../../lib/apiStatus";
import { incentivizedLabel } from "../../lib/chipGroups";
import { commitmentBuckets, commitmentLabel } from "../../lib/format";
import { whereSummary } from "../../lib/location";
import { countryRank, languageRank, orderOptions } from "../../lib/optionOrder";
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
  /** The option's icon (categories, as on Browse by category). Presentation only. */
  imageURL?: string;
}

export interface SectionModel {
  options: SectionOption[];
  selected: string[];
  /**
   * The selected values the preferences supply and this search does not: `selected` minus the
   * manual picks (manual wins when a value is both, as in `segmentTone`). Presentation only — the
   * purple tone of the colour rule (2026-09-30); `toggle` decides what a tap does.
   */
  inherited: string[];
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
  /**
   * The options' order once "Show all" is open, when it differs from `options` — the language
   * and country lists, whose collapsed rows lead with the preferred options and whose expanded
   * list is alphabetical throughout (`lib/optionOrder`). `undefined` = one order for both.
   */
  expanded?: SectionOption[];
  /**
   * Stays collapsed until the youth opens it, despite a selection: the selection is the private
   * inherited accessibility needs alone (2026-10-03). The header still says it is active.
   */
  startCollapsed?: boolean;
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
  targetedGroups: "targetedGroups",
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
    homeCountryId,
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
    | "sdgs"
    | "targetedGroups";

  const listModel = (
    options: SectionOption[],
    facet: ListFacet,
  ): SectionModel => {
    const manual = filters[facet];
    const selected = effectiveFilters[facet];
    return {
      options,
      selected,
      inherited: selected.filter((id) => !manual.includes(id)),
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
        // A saved interest goes on its own (2026-10-08); any other preference goes whole.
        if (prefKey === "targetCategories") skipPreference(prefKey, id);
        else if (prefKey) skipPreference(prefKey);
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
    const inheritedId = filters.incentivized === null ? selectedId : null;
    return {
      options: [
        { id: PAID_ID, label: incentivizedLabel(true), count: null },
        { id: UNPAID_ID, label: incentivizedLabel(false), count: null },
      ],
      selected: selectedId ? [selectedId] : [],
      inherited: inheritedId ? [inheritedId] : [],
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
          imageURL: c.imageURL ?? undefined,
        })),
        "categories",
      );
    case "countries": {
      // The youth's country and Worldwide lead the collapsed rows; "Show all" is alphabetical.
      const order = orderOptions(lookups.countries, countryRank(homeCountryId));
      // The header reads the most specific place in play, like the bar segment and the pill.
      const model = listModel(named(order.collapsed), "countries");
      return {
        ...model,
        expanded: named(order.expanded),
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
    case "languages": {
      // The facet list, then any selected language it lacks — one saved in the wizard's search
      // over the full list, which no published opportunity lists yet — labelled from that list.
      // The site's supported languages lead the collapsed rows; "Show all" is alphabetical.
      const facetIds = new Set(lookups.languages.map((l) => l.id));
      const unlisted = lookups.allLanguages.filter(
        (l) => !facetIds.has(l.id) && effectiveFilters.languages.includes(l.id),
      );
      const order = orderOptions(
        [...lookups.languages, ...unlisted],
        languageRank,
      );
      return {
        ...listModel(named(order.collapsed), "languages"),
        expanded: named(order.expanded),
      };
    }
    case "accommodations": {
      // The facet list, then any selected need it lacks — one no published opportunity lists
      // yet, which still filters — labelled from the full list (the wizard's cached query).
      const facetIds = new Set(lookups.accommodations.map((a) => a.id));
      const unlisted = lookups.accessibility.filter(
        (a) =>
          !facetIds.has(a.id) && effectiveFilters.accommodations.includes(a.id),
      );
      const model = listModel(
        named([...lookups.accommodations, ...unlisted]),
        "accommodations",
      );
      // Inherited needs are private (2026-10-03): the header says "Your needs", never a count of
      // them, and the section stays collapsed until opened — unless the youth picked one here.
      const inherited =
        state.preferencesOff ||
        state.preferencesSkipped.includes("accessibility")
          ? []
          : (fragments.accessibility?.accommodations ?? []);
      if (inherited.length === 0) return model;
      const picks = filters.accommodations.filter(
        (id) => !inherited.includes(id),
      ).length;
      return {
        ...model,
        summary: picks > 0 ? `Your needs +${picks}` : "Your needs",
        startCollapsed: picks === 0,
      };
    }
    case "sdgs":
      return listModel(
        lookups.sdgs.map((goal) => ({
          id: goal.id,
          label: sdgLabel(goal),
          count: null,
        })),
        "sdgs",
      );
    case "targetedGroups": {
      // Open to all is not offered: the request adds it beside any pick (`searchRequest`), so a
      // chip for it could never change the results.
      const openToAllId = openToAllIdOf(lookups.targetedGroups);
      return listModel(
        named(lookups.targetedGroups.filter((g) => g.id !== openToAllId)),
        "targetedGroups",
      );
    }
    case "provider":
      return {
        options: [],
        selected: [],
        inherited: [],
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
      const buckets = commitmentBuckets(lookups.timeIntervals);
      const options = buckets.map((b) => ({
        id: b.intervalId,
        label: b.label,
        count: null,
      }));
      const manualId = filters.commitment?.intervalId ?? null;
      const effective = effectiveFilters.commitment;
      // Selected only when the stored value IS the bucket — an older "Up to 3 weeks" reads in the
      // summary and chip but lights no pill (its interval's pill would send a different count).
      const selectedId =
        effective &&
        buckets.some(
          (b) =>
            b.intervalId === effective.intervalId &&
            b.count === effective.count,
        )
          ? effective.intervalId
          : null;
      const selectedInterval = lookups.timeIntervals.find(
        (i) => i.id === effective?.intervalId,
      );
      return {
        options,
        selected: selectedId ? [selectedId] : [],
        inherited: manualId === null && selectedId ? [selectedId] : [],
        toggle: (id) => {
          // The active pill clears; an interval's pill over a stored count that is not its
          // bucket ("Up to 3 weeks") sets the bucket instead.
          if (manualId === id && selectedId === id) {
            dispatch({ kind: "patchFilters", patch: { commitment: null } });
            return;
          }
          if (selectedId === id && fragments.maxCommitment)
            skipPreference("maxCommitment");
          else
            dispatch({
              kind: "patchFilters",
              patch: {
                commitment: {
                  intervalId: id,
                  count: buckets.find((b) => b.intervalId === id)?.count ?? 1,
                },
              },
            });
        },
        // The stored value's own label: an older "Up to 3 weeks" reads as it is, not as a bucket.
        summary:
          effective && selectedInterval
            ? commitmentLabel(effective, selectedInterval.name)
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
        inherited: [],
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
        notice: jobSelected ? "Jobs don't give ZLTO." : null,
        secondary: paid,
        text: null,
      };
    }
    case null:
      return {
        options: [],
        selected: [],
        inherited: [],
        toggle: () => undefined,
        summary: "Coming soon",
        status,
        notice: null,
        secondary: null,
        text: null,
      };
  }
}
