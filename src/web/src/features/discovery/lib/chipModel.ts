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
  MANUAL_LIST_FACETS,
  PREF_GROUPS,
  yourSkillsLabel,
  yourSkillsSummary,
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
  withoutSkippedInterests,
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
  /**
   * Set on an interest's own chip (`targetCategories`, one chip per saved category since
   * 2026-10-08): remove and undo act on this one interest, not the whole preference.
   */
  interest?: string;
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
  /**
   * The value as the summaries print it, without the group, where the value alone wouldn't say
   * what it is: the inherited skills' "57 of yours" reads "57 of your skills" there. Omitted,
   * they print `value`.
   */
  summaryValue?: string;
  /**
   * A multi-value chip ("Technology, AI & Data +3") as the "tuned to" line counts it: its first
   * value, and how many follow (2026-10-08). That line names first values only and counts every
   * other value in ONE "+N others", rather than a chip's own "+3" beside its "+4".
   */
  summaryFirst?: string;
  summaryMore?: number;
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

/** A list fragment's first value, by name, and how many follow it. `null` for a scalar one. */
function listParts(
  fragment: Partial<DiscoveryFilters>,
  resolve: ChipLabelResolver,
): { first: string; more: number } | null {
  const [facet, values] =
    Object.entries(fragment).find(([, v]) => Array.isArray(v)) ?? [];
  return facet && Array.isArray(values) && typeof values[0] === "string"
    ? {
        first: resolve(facet as keyof DiscoveryFilters, values[0]),
        more: values.length - 1,
      }
    : null;
}

function fragmentValue(
  fragment: Partial<DiscoveryFilters>,
  resolve: ChipLabelResolver,
): string {
  if (fragment.commitment) return commitmentLabel(fragment.commitment, resolve);
  if (typeof fragment.incentivized === "boolean")
    return incentivizedLabel(fragment.incentivized);
  if (typeof fragment.age === "number") return `${fragment.age} years`;
  const parts = listParts(fragment, resolve);
  if (!parts) return "";
  return parts.more > 0 ? `${parts.first} +${parts.more}` : parts.first;
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
): Pick<
  DiscoveryChip,
  | "group"
  | "value"
  | "note"
  | "private"
  | "summaryValue"
  | "summaryFirst"
  | "summaryMore"
> {
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
      value: yourSkillsLabel(fragment.skills?.length ?? 0),
      summaryValue: yourSkillsSummary(fragment.skills?.length ?? 0),
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
  const parts = listParts(fragment, resolve);
  return {
    group,
    value: fragmentValue(fragment, resolve),
    note: key === "country" ? COUNTRY_NOTE : allValuesNote(fragment, resolve),
    private: false,
    ...(parts && parts.more > 0
      ? { summaryFirst: parts.first, summaryMore: parts.more }
      : {}),
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
  /** Interests switched off one by one (`DiscoveryState.interestsSkipped`). */
  interestsSkipped: string[] = [],
): DiscoveryChip[] {
  // The chips show every preference as saved; the search, the coverage and the place read the
  // layer without the skipped interests, as the surface composes it.
  const entries = Object.entries(fragments) as [
    PreferenceKey,
    InheritedFragment,
  ][];
  const inPlay = withoutSkippedInterests(fragments, interestsSkipped);
  const active = (
    Object.entries(inPlay) as [PreferenceKey, InheritedFragment][]
  )
    .filter(([key]) => !preferencesOff && !skipped.includes(key))
    .map(([, fragment]) => fragment);

  const search = composeSearch(manual, inPlay, preferencesOff, skipped);
  const effective = search.filters;
  const location = locationFragmentState(
    manual,
    inPlay,
    preferencesOff,
    skipped,
  );

  return [
    ...inheritedChips(entries, preferencesOff, skipped, resolve, lookups, {
      location: { state: location, countries: effective.countries },
      jobSkillsApply: jobSkillsApply(search, lookups),
      interestsSkipped,
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
    return "Not used: this search uses the place you picked here.";
  if (state !== "otherCountry") return null;
  if (countries.length === 0)
    return "Not used: this search covers every country.";
  if (countries.length > 1)
    return "Not used: pick one country to use your place.";
  return `Not used: this search is for ${resolve("countries", countries[0]!)}.`;
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
    interestsSkipped: string[];
  },
): DiscoveryChip[] {
  if (preferencesOff) return [];
  const { location } = context;
  return entries.flatMap(([key, fragment]): DiscoveryChip[] => {
    // One chip per saved interest (2026-10-08), each skipped on its own; the whole preference's
    // skip still strikes them all.
    if (key === "targetCategories" && fragment.categories)
      return fragment.categories.map((id) => ({
        id: `pref:targetCategories:${id}`,
        group: PREF_GROUPS[key] ?? facetGroup(fragment) ?? key,
        value: resolve("categories", id),
        provenance:
          skipped.includes(key) || context.interestsSkipped.includes(id)
            ? "inheritedOff"
            : "inherited",
        prefKey: key,
        interest: id,
        facet: null,
        raw: null,
        private: false,
        pending: false,
        note: null,
      }));
    return [inheritedChip(key, fragment)];
  });

  function inheritedChip(
    key: PreferenceKey,
    fragment: InheritedFragment,
  ): DiscoveryChip {
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
  }
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
  // "Showing: All opportunities" — removing it is the way back to the landing.
  if (manual.all === true)
    chips.push(manualChip("all", "true", "All opportunities"));
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
  /**
   * For the "tuned to" line: each named chip's first value, and how many values follow them
   * (`summaryFirst` / `summaryMore`). Omitted, `named` with nothing following.
   */
  firsts?: string[];
  more?: number;
}

const summarize = (chips: DiscoveryChip[]): ChipSummary => {
  const nameable = chips.filter((c) => !c.private);
  return {
    named: nameable.map((c) => c.summaryValue ?? c.value),
    unnamed: chips.length - nameable.length,
    firsts: nameable.map((c) => c.summaryFirst ?? c.summaryValue ?? c.value),
    more: nameable.reduce((sum, c) => sum + (c.summaryMore ?? 0), 0),
  };
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
 * "Job · Technology, AI & Data +7 others": the first `shown` nameable values, then EVERY other
 * value as one count: the other chips, the further values of a multi-value chip (its own "+3"),
 * and the private ones. The preference banner and the Picked for you subtitle both say it
 * (2026-10-08; before, "Job · Technology, AI & Data +3 · +4"). Empty when nothing can be named;
 * the caller then says "your preferences".
 */
export function tunedToText(summary: ChipSummary, shown: number): string {
  const names = summary.firsts ?? summary.named;
  if (names.length === 0) return "";
  const listed = names.slice(0, shown);
  const rest =
    names.length - listed.length + summary.unnamed + (summary.more ?? 0);
  const others = rest === 1 ? "other" : "others";
  return rest > 0
    ? `${listed.join(" · ")} +${rest} ${others}`
    : listed.join(" · ");
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
