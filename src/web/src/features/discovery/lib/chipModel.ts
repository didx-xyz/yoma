import { FACET_GROUPS, MANUAL_LIST_FACETS, PREF_GROUPS } from "./chipGroups";
import type { LocationFragmentState } from "./location";
import {
  distanceLabel,
  LOCATION_SEARCH_LIVE,
  locationFragmentState,
  placeLabel,
} from "./location";
import type { InheritedFragments } from "./preferenceMapping";
import { applyInheritedFragments } from "./preferenceMapping";
import type { DiscoveryFilters, PreferenceKey } from "./types";

/**
 * Filter state → the applied-chip row, with provenance. Pure; the ONE place chip classes are
 * decided. Three classes — and the middle one matters most: an inherited chip switched off STAYS
 * on screen, struck through, with an undo. Custom-field clauses are chipped by the surface via
 * YOM-1260's `useCustomFieldFilterLabeler` (a hook, so it cannot live here).
 *
 * A fourth class exists for the inherited location only: `inheritedInapplicable` — the youth's
 * place is not part of THIS search because the search is for another country (or names its own
 * place). Ghosted like a skipped chip but with no undo, because undoing would change nothing;
 * `note` says why.
 */
export type ChipProvenance =
  | "inherited"
  | "inheritedOff"
  | "inheritedInapplicable"
  | "manual";

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
  /**
   * Shown but NOT sent to the search yet (region / city / distance until the Location search
   * API lands — `LOCATION_SEARCH_LIVE`). Drawn dashed; never counted as filtering.
   */
  pending: boolean;
  /** Why an inapplicable chip is not part of this search. */
  note: string | null;
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
  if (fragment.commitment) return commitmentLabel(fragment.commitment, resolve);
  const [facet, values] =
    Object.entries(fragment).find(([, v]) => Array.isArray(v)) ?? [];
  if (facet && Array.isArray(values) && typeof values[0] === "string") {
    const first = resolve(facet as keyof DiscoveryFilters, values[0]);
    return values.length > 1 ? `${first} +${values.length - 1}` : first;
  }
  return "";
}

/** The chip group for whatever facet a fragment carries — `null` for an empty fragment. */
const facetGroup = (fragment: Partial<DiscoveryFilters>): string | null => {
  const facet = Object.keys(fragment)[0] as keyof DiscoveryFilters | undefined;
  return facet ? (FACET_GROUPS[facet] ?? null) : null;
};

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
  pending: !LOCATION_SEARCH_LIVE && LOCATION_FACETS.includes(facet),
  note: null,
});

const LOCATION_FACETS: (keyof DiscoveryFilters)[] = [
  "region",
  "city",
  "radiusKm",
];

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

  const effective = applyInheritedFragments(
    manual,
    fragments,
    preferencesOff,
    skipped,
  );
  const location = locationFragmentState(
    manual,
    fragments,
    preferencesOff,
    skipped,
  );

  return [
    ...inheritedChips(entries, preferencesOff, skipped, resolve, {
      state: location,
      countries: effective.countries,
    }),
    ...manualChips(manual, active, resolve, effective),
  ];
}

/** Why the inherited place is not in this search — worded for the chip's tooltip. */
function locationNote(
  state: LocationFragmentState | null,
  countries: string[],
  resolve: ChipLabelResolver,
): string | null {
  if (state === "replaced")
    return "Not applied — this search uses the place you picked here.";
  if (state !== "otherCountry") return null;
  if (countries.length === 0)
    return "Not applied — this search covers every country.";
  if (countries.length > 1)
    return "Not applied — pick one country to use your place.";
  return `Not applied — this search is for ${resolve("countries", countries[0]!)}.`;
}

// Inherited first, in mapping order. Hidden wholesale only by the master switch. The group is
// the preference's own label where it has one, else the label of the facet the fragment carries
// (the Goal fragment is a Type for four goals and a Category for "Start a business").
function inheritedChips(
  entries: [PreferenceKey, Partial<DiscoveryFilters>][],
  preferencesOff: boolean,
  skipped: PreferenceKey[],
  resolve: ChipLabelResolver,
  location: { state: LocationFragmentState | null; countries: string[] },
): DiscoveryChip[] {
  if (preferencesOff) return [];
  return entries.map(([key, fragment]): DiscoveryChip => {
    const base = {
      id: `pref:${key}`,
      group: PREF_GROUPS[key] ?? facetGroup(fragment) ?? key,
      prefKey: key,
      facet: null,
      raw: null,
    };
    if (key === "location") {
      const inapplicable =
        location.state === "otherCountry" || location.state === "replaced";
      return {
        ...base,
        value:
          placeLabel({
            region: fragment.region ?? null,
            city: fragment.city ?? null,
          }) ?? "",
        provenance: skipped.includes(key)
          ? "inheritedOff"
          : inapplicable
            ? "inheritedInapplicable"
            : "inherited",
        pending: !LOCATION_SEARCH_LIVE,
        note: locationNote(location.state, location.countries, resolve),
      };
    }
    return {
      ...base,
      value: fragmentValue(fragment, resolve),
      provenance: skipped.includes(key) ? "inheritedOff" : "inherited",
      pending: false,
      note: null,
    };
  });
}

// Manual chips: whatever the session chose that an active inherited fragment doesn't carry.
function manualChips(
  manual: DiscoveryFilters,
  active: Partial<DiscoveryFilters>[],
  resolve: ChipLabelResolver,
  effective: DiscoveryFilters,
): DiscoveryChip[] {
  const covered = (facet: keyof DiscoveryFilters, value: string): boolean =>
    active.some((f) => {
      const v = f[facet];
      return Array.isArray(v) ? (v as string[]).includes(value) : v === value;
    });

  const chips: DiscoveryChip[] = [];
  for (const facet of MANUAL_LIST_FACETS)
    for (const value of manual[facet])
      if (!covered(facet, value))
        chips.push(manualChip(facet, value, resolve(facet, value)));
  // A picked place replaces the inherited one wholesale, so these never overlap a fragment.
  if (manual.region)
    chips.push(manualChip("region", manual.region, manual.region));
  if (manual.city) chips.push(manualChip("city", manual.city, manual.city));
  // The radius measures from the EFFECTIVE point — the city picked here, or the inherited one.
  if (manual.radiusKm !== null)
    chips.push(
      manualChip(
        "radiusKm",
        String(manual.radiusKm),
        distanceLabel(effective) ?? "",
      ),
    );
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
