import type { IconType } from "react-icons";
import {
  IoBusinessOutline,
  IoCashOutline,
  IoGlobeOutline,
  IoGridOutline,
  IoLanguageOutline,
  IoLocationOutline,
  IoShieldCheckmarkOutline,
  IoSparklesOutline,
  IoTimeOutline,
  IoWifiOutline,
} from "react-icons/io5";

/**
 * The universal filter sections, in the order both breakpoints render them (block 6 of the shared
 * block order). The desktop dialog, the mobile sheet and the standalone popover all consume THIS
 * array through the same `<FilterSection>` component — adding, demoting or restoring a section is
 * a data change here (the `group` field), never new JSX, and the set/order must never differ
 * between breakpoints.
 *
 * Primary (2026-09-22 BA alignment): Categories · Where · Engagement · How long · Accessibility ·
 * Language. Behind "More filters": Paid and rewards · Skills · SDGs · Provider. Only Skills is
 * still pending: the saved skills narrow jobs through the preference layer (2026-10-03), but
 * there is no manual skills pick yet. Paid moved off
 * the primary list when Engagement took its place on the search bar — one definition, two homes,
 * so the section and the bar segment can never disagree.
 *
 * Each `nullRule` states the revised search contract (2026-10-03). Engagement and Accessibility
 * state both modes in their one line, because a manual pick turns the whole criterion strict
 * ("the manual mode wins"): the line predicts what the next tap does.
 *
 * "Who it is for" (admin-side targeted groups) is deliberately ABSENT: targeting never restricts
 * who can apply, so offering it to a youth implies a constraint that does not exist.
 */

/** Closed set of controls; `<FilterControl kind=…>` is the single kind→component switch. */
export type FilterControlKind =
  | "chips"
  /** Country multi-select, then region / city (one country) and distance — the Where section. */
  | "location"
  | "lookupSearch"
  | "range"
  /** One free-text "contains" value, committed on Enter / blur — the Provider section. */
  | "text"
  /** Paid or rewarded / Unpaid above the ZLTO reward chips — one section, two facets. */
  | "rewards";

/** Which `DiscoveryFilters` slot the section reads and writes. */
export type FilterSectionBinding =
  | "categories"
  | "countries"
  | "engagementTypes"
  | "commitment"
  | "zlto"
  | "languages"
  | "accommodations"
  | "sdgs"
  | "provider";

/**
 * Which `DiscoveryFilters` facet a preference fragment feeds each binding through — the ONE
 * mapping shared by the section model (inherited-aware selection) and the section badge.
 * `null` = no preference can feed this binding. Paid and rewards (`zlto`) receives the
 * incentive preference through its Paid half; Accessibility the saved requirements, inherited
 * since 2026-10-03 (see `preferenceMapping.ts`).
 */
export const FACET_FOR_BINDING = {
  categories: "categories",
  countries: "countries",
  engagementTypes: "engagementTypes",
  commitment: "commitment",
  zlto: "incentivized",
  languages: "languages",
  accommodations: "accommodations",
  sdgs: null,
  provider: null,
} as const satisfies Record<FilterSectionBinding, string | null>;

export interface FilterSectionDef {
  id: string;
  label: string;
  /** The label as a plain question — popover titles speak like the wizard, not like a form. */
  question: string;
  icon: IconType;
  control: FilterControlKind;
  /**
   * `null` = the search API has no core facet for this yet ("the API contract wins"): the section
   * renders as a disabled "Coming soon" row that never opens (round 10, 2026-10-02) — never
   * failing silently, never a mock filter. `pendingNote` is what its control would say.
   */
  binding: FilterSectionBinding | null;
  /** 13px helper under the header — what the section matches on, when that is not obvious. */
  hint: string | null;
  /**
   * Missing-data rule stated in words, one line — users cannot infer include-vs-exclude
   * semantics. States what the search ACTUALLY does today, in every mode the section can be in.
   */
  nullRule: string | null;
  pendingNote: string | null;
  /** `primary` renders in the main list; `more` sits behind the "More filters" disclosure. */
  group: "primary" | "more";
}

const skillsPendingNote = "Coming soon — you can't pick skills here yet.";

/**
 * The type row is not a registry section (it binds `types`, which no `FilterSectionBinding`
 * covers), but it speaks the same two lines as one: a noun in the panel header, the question in
 * the popover title. Both live here so the two homes cannot drift.
 */
export const TYPE_ROW_QUESTION = "What type of opportunity?";
export const TYPE_ROW_HINT =
  "Pick one or more. Each type adds its own filters.";
/**
 * Under the type pills while a goal brings in a category of any type ("Start a business",
 * 2026-10-03): the row shows only the goal's type, yet that category's other types appear too.
 */
export const typeRowGoalLine = (categoryName: string): string =>
  `Your goal also brings in ${categoryName} opportunities of any type.`;

export const FILTER_SECTIONS: FilterSectionDef[] = [
  {
    id: "categories",
    label: "Categories",
    question: "Which categories interest you?",
    icon: IoGridOutline,
    control: "chips",
    binding: "categories",
    hint: null,
    nullRule: null,
    pendingNote: null,
    group: "primary",
  },
  // The BA's Location model: Country → Province/Region → City (English names, "contains"), plus
  // distance from the picked city's centroid. Region and city need exactly one country. Live
  // since 2026-09-29 (LOCATION_SEARCH_LIVE).
  {
    id: "where",
    label: "Where",
    question: "Where should it be?",
    icon: IoLocationOutline,
    control: "location",
    binding: "countries",
    hint: null,
    // Jason, 2026-09-28: opportunities with no region or city are INCLUDED. The inherited home
    // country also sends Worldwide, except with a radius on (2026-10-03). The radius search's own
    // rule (no coordinates, left out) is `DISTANCE_NOTE`, shown beside the distance control.
    nullRule:
      "Ones that don't name a region or city stay in. Your country from your preferences also brings in worldwide ones, except in a distance search.",
    pendingNote: null,
    group: "primary",
  },
  // The id doubles as the search-bar segment id (SEARCH · WHAT · WHERE · HOW LONG · ENGAGEMENT).
  // Modes by provenance (2026-10-03): a manual pick leaves out opportunities with no engagement
  // type (the BA rule); inherited only, they stay in, since the partner job feeds set none.
  {
    id: "engagement",
    label: "Engagement",
    question: "How do you want to take part?",
    icon: IoWifiOutline,
    control: "chips",
    binding: "engagementTypes",
    hint: null,
    nullRule:
      "Picked here, opportunities that don't say how you take part are left out. From your preferences, they stay in.",
    pendingNote: null,
    group: "primary",
  },
  // A maximum keeps opportunities with no commitment set — the BA rule, which the revised search
  // contract applies (2026-10-03).
  {
    id: "time",
    label: "How long",
    question: "How much time do you have?",
    icon: IoTimeOutline,
    control: "range",
    binding: "commitment",
    hint: null,
    nullRule:
      "Opportunities that don't state a time commitment stay in your results.",
    pendingNote: null,
    group: "primary",
  },
  // Every picked accommodation must be listed, and an explicit No never matches. Modes by
  // provenance (2026-10-03): a manual pick leaves out opportunities that list none; the saved
  // requirements, inherited, keep them (`preferenceMapping.ts`). Inherited needs are private: the
  // section stays collapsed and its header says "Your needs" (`useSectionModel`).
  {
    id: "accessibility",
    label: "Accessibility",
    question: "Need accommodations?",
    icon: IoShieldCheckmarkOutline,
    control: "chips",
    binding: "accommodations",
    hint: null,
    nullRule:
      "Needs every accommodation you pick; ones that say No are left out. Picked here, so are ones with no list; from your preferences, they stay in.",
    pendingNote: null,
    group: "primary",
  },
  // Partner opportunities can list no language (four of the local fixtures do), and the search
  // leaves them out whenever a language is set.
  {
    id: "language",
    label: "Language",
    question: "What languages work for you?",
    icon: IoLanguageOutline,
    control: "chips",
    binding: "languages",
    hint: null,
    nullRule:
      "Shows opportunities in any language you pick. Ones that don't list a language are left out.",
    pendingNote: null,
    group: "primary",
  },
  // Demoted 2026-09-22 when Engagement took Pay's place on the search bar. Both halves live since
  // 2026-09-29: Paid is the core `incentivized` field (pay, ZLTO or another incentive — the BA's
  // "Is Paid", renamed by the API) and ZLTO is the reward facet. The API lists the explicit
  // matches before the unspecified ones, whatever the sort (2026-10-03) — the results' incentive
  // divider marks the change.
  {
    id: "pay",
    label: "Paid and rewards",
    question: "Should it pay or reward you?",
    icon: IoCashOutline,
    control: "rewards",
    binding: "zlto",
    hint: null,
    nullRule:
      "Opportunities that haven't specified an incentive stay in, listed after the ones that match.",
    pendingNote: null,
    group: "more",
  },
  // Demoted, not deleted — partners ask for Provider. Skills has no manual pick yet: the saved
  // skills narrow jobs through the preference layer (2026-10-03), which the hint says.
  {
    id: "skills",
    label: "Skills",
    question: "What skills do you have?",
    icon: IoSparklesOutline,
    control: "lookupSearch",
    binding: null,
    hint: "The skills in your preferences already narrow jobs; jobs that list no skills stay in.",
    nullRule: null,
    pendingNote: skillsPendingNote,
    group: "more",
  },
  {
    id: "sdgs",
    label: "SDGs",
    question: "Which global goals matter to you?",
    icon: IoGlobeOutline,
    control: "chips",
    binding: "sdgs",
    hint: null,
    nullRule: "Opportunities that don't name a goal stay in your results.",
    pendingNote: null,
    group: "more",
  },
  // The Provider FIELD (2026-09-28) — informational text such as "KFC", not the organisation that
  // posts the opportunity. The organisation typeahead this replaced filtered something else. The
  // revised search contract leaves out opportunities that name none (2026-10-03).
  {
    id: "provider",
    label: "Provider",
    question: "Who runs it?",
    icon: IoBusinessOutline,
    control: "text",
    binding: "provider",
    hint: "The provider named on the opportunity — type part of it, e.g. KFC.",
    nullRule: "Opportunities that don't name a provider are left out.",
    pendingNote: null,
    group: "more",
  },
];
