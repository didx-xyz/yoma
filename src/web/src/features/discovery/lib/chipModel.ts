import {
  ACCESSIBILITY_CHIP_VALUE,
  ACCESSIBILITY_NOTE,
  COUNTRY_NOTE,
  FACET_GROUPS,
  GOAL_CHIPS,
  GOAL_GROUP,
  goalNote,
  incentivizedLabel,
  JOB_SKILLS_INAPPLICABLE_NOTE,
  JOB_SKILLS_NOTE,
  jobSkillsLabel,
  MANUAL_LIST_FACETS,
  PREF_GROUPS,
} from "./chipGroups";
import type { LocationFragmentState } from "./location";
import {
  distanceLabel,
  LOCATION_SEARCH_LIVE,
  locationFragmentState,
  placeLabel,
} from "./location";
import type {
  InheritedFragment,
  InheritedFragments,
} from "./preferenceMapping";
import {
  categoryIdByName,
  composeSearch,
  GOAL_CATEGORY_NAMES,
} from "./preferenceMapping";
import type { SearchLookups } from "./searchRequest";
import { jobSkillsApply } from "./searchRequest";
import type { DiscoveryFilters, PreferenceKey } from "./types";

/**
 * Filter state → the applied-chip row, with provenance. Pure; the ONE place chip classes are
 * decided. Three classes — and the middle one matters most: an inherited chip switched off STAYS
 * on screen, struck through, with an undo. Custom-field clauses are chipped by the surface via
 * YOM-1260's `useCustomFieldFilterLabeler` (a hook, so it cannot live here).
 *
 * A fourth class, `inheritedInapplicable`, exists for two inherited chips: the location, when the
 * search is for another country (or names its own place), and the skills, when the search can
 * return no Job for them to narrow (`jobSkillsApply`, 2026-10-03). Ghosted like a skipped chip
 * but with no undo, because undoing would change nothing; `note` says why.
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
  /**
   * The chip's tooltip after its label: why an inapplicable chip is not part of this search, else
   * what an inherited chip does, or every value of a multi-value one ("Remote, On-site").
   */
  note: string | null;
  /**
   * The value is private — the inherited accessibility needs (2026-10-03). It is never repeated
   * outside the chip: the summaries (`inheritedSummary`, `filteringSummary`) count it instead of
   * naming it.
   */
  private: boolean;
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
  if (typeof fragment.incentivized === "boolean")
    return incentivizedLabel(fragment.incentivized);
  if (typeof fragment.age === "number") return `${fragment.age} years`;
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

/** Every value of a multi-value fragment, so its "+1" is never a dead end on desktop. */
function allValuesNote(
  fragment: Partial<DiscoveryFilters>,
  resolve: ChipLabelResolver,
): string | null {
  const [facet, values] =
    Object.entries(fragment).find(([, v]) => Array.isArray(v)) ?? [];
  if (!facet || !Array.isArray(values) || values.length < 2) return null;
  return (values as string[])
    .map((value) => resolve(facet as keyof DiscoveryFilters, value))
    .join(", ");
}

/**
 * A goal that is more than a type names both halves, from the lookups. `null` when its category
 * cannot be resolved: the request then sends the goal's type alone (`searchRequest.ts`).
 */
function goalChipNote(
  fragment: InheritedFragment,
  resolve: ChipLabelResolver,
  lookups: SearchLookups,
): string | null {
  const names = fragment.userGoal
    ? GOAL_CATEGORY_NAMES[fragment.userGoal]
    : undefined;
  const categoryId = names ? categoryIdByName(lookups.categories, names) : null;
  const type = fragment.types?.[0];
  return type && categoryId
    ? goalNote(resolve("types", type), resolve("categories", categoryId))
    : null;
}

/**
 * An inherited chip's group, value and note. Most name the facet value their fragment carries;
 * three say what they do instead (2026-10-03): a goal that is more than a type ("Goal: Starting a
 * business"), the number of skills the Jobs-only group sends, and the accessibility needs, which
 * are private — never named or counted, in the value or the note.
 */
function inheritedLabel(
  key: PreferenceKey,
  fragment: InheritedFragment,
  resolve: ChipLabelResolver,
  lookups: SearchLookups,
): Pick<DiscoveryChip, "group" | "value" | "note" | "private"> {
  const group = PREF_GROUPS[key] ?? facetGroup(fragment) ?? key;
  const goal = fragment.userGoal ? GOAL_CHIPS[fragment.userGoal] : undefined;
  if (key === "goal" && goal)
    return {
      group: GOAL_GROUP,
      value: goal,
      note: goalChipNote(fragment, resolve, lookups),
      private: false,
    };
  if (key === "skills")
    return {
      group,
      value: jobSkillsLabel(fragment.skills?.length ?? 0),
      note: JOB_SKILLS_NOTE,
      private: false,
    };
  if (key === "accessibility")
    return {
      group,
      value: ACCESSIBILITY_CHIP_VALUE,
      note: ACCESSIBILITY_NOTE,
      private: true,
    };
  return {
    group,
    value: fragmentValue(fragment, resolve),
    note: key === "country" ? COUNTRY_NOTE : allValuesNote(fragment, resolve),
    private: false,
  };
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
  pending: !LOCATION_SEARCH_LIVE && LOCATION_FACETS.includes(facet),
  note: null,
  private: false,
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
  /** The request's lookups: whether the skills apply, and the goal's category name. */
  lookups: SearchLookups,
): DiscoveryChip[] {
  const entries = Object.entries(fragments) as [
    PreferenceKey,
    InheritedFragment,
  ][];
  const active = entries
    .filter(([key]) => !preferencesOff && !skipped.includes(key))
    .map(([, fragment]) => fragment);

  const search = composeSearch(manual, fragments, preferencesOff, skipped);
  const effective = search.filters;
  const location = locationFragmentState(
    manual,
    fragments,
    preferencesOff,
    skipped,
  );

  return [
    ...inheritedChips(entries, preferencesOff, skipped, resolve, lookups, {
      location: { state: location, countries: effective.countries },
      jobSkillsApply: jobSkillsApply(search, lookups),
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
// (the Goal fragment carries a Type, so its chip reads "Type: …" — except for a goal that is
// more than a type, `inheritedLabel`).
function inheritedChips(
  entries: [PreferenceKey, InheritedFragment][],
  preferencesOff: boolean,
  skipped: PreferenceKey[],
  resolve: ChipLabelResolver,
  lookups: SearchLookups,
  context: {
    location: { state: LocationFragmentState | null; countries: string[] };
    /** The skills group goes out — W2's rule, so the chip and the request cannot disagree. */
    jobSkillsApply: boolean;
  },
): DiscoveryChip[] {
  if (preferencesOff) return [];
  const { location } = context;
  return entries.map(([key, fragment]): DiscoveryChip => {
    const base = {
      id: `pref:${key}`,
      group: PREF_GROUPS[key] ?? facetGroup(fragment) ?? key,
      prefKey: key,
      facet: null,
      raw: null,
      private: false,
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
    const label = inheritedLabel(key, fragment, resolve, lookups);
    // The skills narrow Jobs only: on a search that can return none, the chip filters nothing.
    const inapplicable =
      !skipped.includes(key) && key === "skills" && !context.jobSkillsApply;
    return {
      ...base,
      ...label,
      provenance: skipped.includes(key)
        ? "inheritedOff"
        : inapplicable
          ? "inheritedInapplicable"
          : "inherited",
      pending: false,
      note: inapplicable ? JOB_SKILLS_INAPPLICABLE_NOTE : label.note,
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
  if (manual.incentivized !== null && !active.some((f) => "incentivized" in f))
    chips.push(
      manualChip(
        "incentivized",
        String(manual.incentivized),
        incentivizedLabel(manual.incentivized),
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
  if (manual.provider)
    chips.push(manualChip("provider", manual.provider, manual.provider));
  // "Picks: Featured" — the facet's only control; removing it resets to the scalar default.
  if (manual.featured === true)
    chips.push(manualChip("featured", "true", "Featured"));
  return chips;
}

/**
 * What a one-line summary of chips may say (2026-10-03): the values it can name, and how many
 * chips it must count instead because their value is private. The banner's "tuned to" line, the
 * "Picked for you" subtitle, the results heading and the recent-search label all go through it,
 * so a private value cannot reach one of them.
 */
export interface ChipSummary {
  named: string[];
  unnamed: number;
}

const summarize = (chips: DiscoveryChip[]): ChipSummary => {
  const named = chips.filter((c) => !c.private).map((c) => c.value);
  return { named, unnamed: chips.length - named.length };
};

/** The preference layer in play: the active inherited chips, not skipped or inapplicable ones. */
export const inheritedSummary = (chips: DiscoveryChip[]): ChipSummary =>
  summarize(chips.filter((c) => c.provenance === "inherited"));

/**
 * The chips that actually filter: struck-through (skipped) and inapplicable chips do not, and
 * neither do pending ones (region / city / distance until the Location search lands).
 */
export const filteringSummary = (chips: DiscoveryChip[]): ChipSummary =>
  summarize(
    chips.filter(
      (c) =>
        (c.provenance === "inherited" || c.provenance === "manual") &&
        !c.pending,
    ),
  );

/**
 * "Starting a business · Up to 1 week · +2": the first `shown` nameable values, then the rest —
 * private ones included — as a count. Empty when nothing can be named; the caller then says
 * "your preferences".
 */
export function tunedToParts(summary: ChipSummary, shown: number): string[] {
  if (summary.named.length === 0) return [];
  const listed = summary.named.slice(0, shown);
  const rest = summary.named.length - listed.length + summary.unnamed;
  return rest > 0 ? [...listed, `+${rest}`] : listed;
}

/**
 * The results heading's subject — "for {first} + {rest} filters". The free text leads, then the
 * nameable filters; a private value is never the subject, only counted. With a private value
 * alone, the subject is the layer it comes from, "your preferences". `extra` counts filters
 * chipped elsewhere (custom-field clauses). `null` when nothing filters.
 */
export function headingSubject(
  q: string | null,
  summary: ChipSummary,
  extra: number,
): { first: string; rest: number } | null {
  const values = [...(q ? [`“${q}”`] : []), ...summary.named];
  if (values.length === 0 && summary.unnamed === 0) return null;
  return {
    first: values[0] ?? "your preferences",
    rest: values.length + summary.unnamed - 1 + extra,
  };
}

/**
 * A recent search's label: the word, else the nameable filters. A private value is left out
 * entirely; alone, it reads "Your preferences". No word and no filtering chip (`prefsOff=1`
 * alone) is every opportunity — never a blank row.
 */
export const recentSearchLabel = (
  q: string | null,
  summary: ChipSummary,
): string =>
  q ??
  (summary.named.join(" · ") ||
    (summary.unnamed > 0 ? "Your preferences" : "All opportunities"));
