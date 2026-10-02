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
 * still pending (2026-09-29) — the search has no skills facet. Paid moved off
 * the primary list when Engagement took its place on the search bar — one definition, two homes,
 * so the section and the bar segment can never disagree.
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
 * incentive preference through its Paid half. Accessibility is deliberately `null`: the stored
 * requirements are not applied to the feed (see `preferenceMapping.ts`).
 */
export const FACET_FOR_BINDING = {
  categories: "categories",
  countries: "countries",
  engagementTypes: "engagementTypes",
  commitment: "commitment",
  zlto: "incentivized",
  languages: "languages",
  accommodations: null,
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
   * semantics. States what the search ACTUALLY does today; where the BA rule differs and the
   * API has not moved yet, the line says so rather than promising the rule.
   */
  nullRule: string | null;
  pendingNote: string | null;
  /** `primary` renders in the main list; `more` sits behind the "More filters" disclosure. */
  group: "primary" | "more";
}

const pendingNote = "Coming soon — the search can't filter on this yet.";

/**
 * The type row is not a registry section (it binds `types`, which no `FilterSectionBinding`
 * covers), but it speaks the same two lines as one: a noun in the panel header, the question in
 * the popover title. Both live here so the two homes cannot drift.
 */
export const TYPE_ROW_QUESTION = "What type of opportunity?";
export const TYPE_ROW_HINT =
  "Pick one or more. Each type adds its own filters.";

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
    // Jason, 2026-09-28: opportunities with no region or city are INCLUDED. The API's radius
    // search, by contrast, leaves out anything without coordinates.
    nullRule:
      "Opportunities that don't name a region or city stay in your results; a distance search leaves out those without a mapped city.",
    pendingNote: null,
    group: "primary",
  },
  // The id doubles as the search-bar segment id (SEARCH · WHAT · WHERE · HOW LONG · ENGAGEMENT).
  // NB: the BA rule is "hidden while a value is selected", but the search API currently INCLUDES
  // opportunities with no engagement type when the filter is set — the copy states the actual
  // behaviour; the exclusion is filed as an API ask (epic README, 2026-09-22).
  {
    id: "engagement",
    label: "Engagement",
    question: "How do you want to take part?",
    icon: IoWifiOutline,
    control: "chips",
    binding: "engagementTypes",
    hint: null,
    nullRule:
      "Includes opportunities that don't say how you take part — for now; they'll be hidden while this is set once the search API applies the rule.",
    pendingNote: null,
    group: "primary",
  },
  // NB: the API currently EXCLUDES opportunities with no commitment set from an interval filter,
  // the opposite of the BA rule ("includes") — copy states the actual behaviour; flagged to Adrian.
  {
    id: "time",
    label: "How long",
    question: "How much time do you have?",
    icon: IoTimeOutline,
    control: "range",
    binding: "commitment",
    hint: null,
    nullRule:
      "Excludes opportunities that don't state a time commitment — for now; the rule is to include them once the search API changes.",
    pendingNote: null,
    group: "primary",
  },
  // Live since 2026-09-29 over the accommodations published opportunities list. The API needs
  // ALL picked accommodations and leaves out opportunities that list none — the reverse of the
  // BA's "stays in results for now", which is why the youth's stored requirements are NOT applied
  // here automatically (preferenceMapping.ts) and the line below says what picking one does.
  {
    id: "accessibility",
    label: "Accessibility",
    question: "Need accommodations?",
    icon: IoShieldCheckmarkOutline,
    control: "chips",
    binding: "accommodations",
    hint: null,
    nullRule:
      "Shows only opportunities that list every accommodation you pick — ones that haven't described their accommodations are left out.",
    pendingNote: null,
    group: "primary",
  },
  // Every opportunity carries at least one language (the API requires it on create), so there
  // is no "not specified" case for this filter to include or exclude.
  {
    id: "language",
    label: "Language",
    question: "What languages work for you?",
    icon: IoLanguageOutline,
    control: "chips",
    binding: "languages",
    hint: null,
    nullRule:
      "Every opportunity lists at least one language, so none are left out for missing data.",
    pendingNote: null,
    group: "primary",
  },
  // Demoted 2026-09-22 when Engagement took Pay's place on the search bar. Both halves live since
  // 2026-09-29: Paid is the core `incentivized` field (pay, ZLTO or another incentive — the BA's
  // "Is Paid", renamed by the API) and ZLTO is the reward facet. There is no public sort, so
  // "sorted last" for unspecified opportunities is not claimed.
  {
    id: "pay",
    label: "Paid and rewards",
    question: "Should it pay or reward you?",
    icon: IoCashOutline,
    control: "rewards",
    binding: "zlto",
    hint: null,
    nullRule:
      "Opportunities that haven't said whether they pay or reward stay in your results.",
    pendingNote: null,
    group: "more",
  },
  // Demoted, not deleted — partners ask for Provider; Skills awaits a search facet.
  {
    id: "skills",
    label: "Skills",
    question: "What skills do you have?",
    icon: IoSparklesOutline,
    control: "lookupSearch",
    binding: null,
    hint: "For jobs this matches required skills; for everything else, the skills you will earn.",
    nullRule: null,
    pendingNote,
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
  // posts the opportunity. The organisation typeahead this replaced filtered something else.
  {
    id: "provider",
    label: "Provider",
    question: "Who runs it?",
    icon: IoBusinessOutline,
    control: "text",
    binding: "provider",
    hint: "The provider named on the opportunity — type part of it, e.g. KFC.",
    nullRule: "Opportunities that don't name a provider stay in your results.",
    pendingNote: null,
    group: "more",
  },
];
