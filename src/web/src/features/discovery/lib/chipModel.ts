import { FACET_GROUPS, MANUAL_LIST_FACETS, PREF_GROUPS } from "./chipGroups";
import type { InheritedFragments } from "./preferenceMapping";
import type { DiscoveryFilters, PreferenceKey } from "./types";

/**
 * Filter state → the applied-chip row, with provenance. Pure; the ONE place chip classes are
 * decided. Three classes — and the middle one matters most: an inherited chip switched off STAYS
 * on screen, struck through, with an undo. Custom-field clauses are chipped by the surface via
 * YOM-1260's `useCustomFieldFilterLabeler` (a hook, so it cannot live here).
 */
export type ChipProvenance = "inherited" | "inheritedOff" | "manual";

export interface DiscoveryChip {
  id: string;
  group: string;
  value: string;
  provenance: ChipProvenance;
  /** Set on inherited chips: remove = skip this preference for this search; undo = unskip. */
  prefKey: PreferenceKey | null;
  /** Set on manual chips: the facet + raw value the removal edits. */
  facet: keyof DiscoveryFilters | null;
  raw: string | null;
}

/** Resolves a raw facet value (usually a lookup id) to its display name. */
export type ChipLabelResolver = (
  facet: keyof DiscoveryFilters,
  value: string,
) => string;

const commitmentLabel = (
  commitment: NonNullable<DiscoveryFilters["commitment"]>,
  resolve: ChipLabelResolver,
): string =>
  `Up to ${commitment.count} ${resolve("commitment", commitment.intervalId).toLowerCase()}`;

function fragmentValue(
  fragment: Partial<DiscoveryFilters>,
  resolve: ChipLabelResolver,
): string {
  if (fragment.type) return fragment.type;
  if (fragment.commitment) return commitmentLabel(fragment.commitment, resolve);
  const [facet, values] =
    Object.entries(fragment).find(([, v]) => Array.isArray(v)) ?? [];
  if (facet && Array.isArray(values) && typeof values[0] === "string") {
    const first = resolve(facet as keyof DiscoveryFilters, values[0]);
    return values.length > 1 ? `${first} +${values.length - 1}` : first;
  }
  return "";
}

const manualChip = (
  facet: keyof DiscoveryFilters,
  raw: string,
  value: string,
): DiscoveryChip => ({
  id: `manual:${facet}:${raw}`,
  group: FACET_GROUPS[facet] ?? facet,
  value,
  provenance: "manual",
  prefKey: null,
  facet,
  raw,
});

export function buildChips(
  manual: DiscoveryFilters,
  fragments: InheritedFragments,
  preferencesOff: boolean,
  skipped: PreferenceKey[],
  resolve: ChipLabelResolver,
): DiscoveryChip[] {
  const entries = Object.entries(fragments) as [
    PreferenceKey,
    Partial<DiscoveryFilters>,
  ][];
  const active = entries
    .filter(([key]) => !preferencesOff && !skipped.includes(key))
    .map(([, fragment]) => fragment);

  return [
    ...inheritedChips(entries, preferencesOff, skipped, resolve),
    ...manualChips(manual, active, resolve),
  ];
}

// Inherited first, in mapping order. Hidden wholesale only by the master switch.
function inheritedChips(
  entries: [PreferenceKey, Partial<DiscoveryFilters>][],
  preferencesOff: boolean,
  skipped: PreferenceKey[],
  resolve: ChipLabelResolver,
): DiscoveryChip[] {
  if (preferencesOff) return [];
  return entries.map(([key, fragment]) => ({
    id: `pref:${key}`,
    group: PREF_GROUPS[key],
    value: fragmentValue(fragment, resolve),
    provenance: skipped.includes(key) ? "inheritedOff" : "inherited",
    prefKey: key,
    facet: null,
    raw: null,
  }));
}

// Manual chips: whatever the session chose that an active inherited fragment doesn't carry.
function manualChips(
  manual: DiscoveryFilters,
  active: Partial<DiscoveryFilters>[],
  resolve: ChipLabelResolver,
): DiscoveryChip[] {
  const covered = (facet: keyof DiscoveryFilters, value: string): boolean =>
    active.some((f) => {
      const v = f[facet];
      return Array.isArray(v) ? (v as string[]).includes(value) : v === value;
    });

  const chips: DiscoveryChip[] = [];
  if (manual.type && !covered("type", manual.type))
    chips.push(manualChip("type", manual.type, manual.type));
  for (const facet of MANUAL_LIST_FACETS)
    for (const value of manual[facet])
      if (!covered(facet, value))
        chips.push(manualChip(facet, value, resolve(facet, value)));
  if (manual.commitment && !active.some((f) => f.commitment))
    chips.push(
      manualChip(
        "commitment",
        manual.commitment.intervalId,
        commitmentLabel(manual.commitment, resolve),
      ),
    );
  if (manual.hasReward !== null)
    chips.push(
      manualChip(
        "hasReward",
        String(manual.hasReward),
        manual.hasReward ? "With ZLTO" : "Without ZLTO",
      ),
    );
  return chips;
}
