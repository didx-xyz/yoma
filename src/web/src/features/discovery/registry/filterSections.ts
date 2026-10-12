import type { IconType } from "react-icons";
import {
  IoBusinessOutline,
  IoCashOutline,
  IoGlobeOutline,
  IoGridOutline,
  IoLanguageOutline,
  IoLocationOutline,
  IoSearchOutline,
  IoShapesOutline,
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

const skillsPendingNote = "Coming soon. You can't pick skills here yet.";

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
  `Your goal also shows all ${categoryName} opportunities, of every type.`;

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
      "Opportunities that don't give a region or city still show. If your country comes from your preferences, worldwide ones show too, but not in a distance search.",
    pendingNote: null,
    group: "primary",
  },
  // The id doubles as the search-bar segment id (SEARCH · WHAT · WHERE · HOW LONG · ENGAGEMENT).
  // Modes by provenance (2026-10-03): a manual pick leaves out opportunities with no engagement
  // type (the BA rule); inherited only, they stay in, since the partner job feeds set none.
  {
    id: "engagement",
    label: "Online or in person",
    question: "How do you want to take part?",
    icon: IoWifiOutline,
    control: "chips",
    binding: "engagementTypes",
    hint: null,
    nullRule:
      "If you pick here, we hide opportunities that don't say. If it comes from your preferences, they still show.",
    pendingNote: null,
    group: "primary",
  },
  // A maximum keeps opportunities with no commitment set — the BA rule, which the revised search
  // contract applies (2026-10-03).
  {
    id: "time",
    label: "Time you have",
    question: "How much time do you have?",
    icon: IoTimeOutline,
    control: "range",
    binding: "commitment",
    hint: null,
    nullRule: "Opportunities that don't say how long they take still show.",
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
    question: "Do you need support to take part?",
    icon: IoShieldCheckmarkOutline,
    control: "chips",
    binding: "accommodations",
    hint: null,
    nullRule:
      "Shows only opportunities that offer everything you pick, and hides ones that say No. If you pick here, ones that don't say are hidden too. From your preferences, they still show.",
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
      "Shows opportunities in any language you pick. We hide ones that don't list a language.",
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
    label: "Pay and rewards",
    question: "Do you want pay or a reward?",
    icon: IoCashOutline,
    control: "rewards",
    binding: "zlto",
    hint: null,
    nullRule:
      "Opportunities that don't say if they pay still show, after the ones that match.",
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
    hint: "Your saved skills already affect jobs. Jobs that don't list skills still show.",
    nullRule: null,
    pendingNote: skillsPendingNote,
    group: "more",
  },
  {
    id: "sdgs",
    label: "Global goals",
    question: "Which global goals matter to you?",
    icon: IoGlobeOutline,
    control: "chips",
    binding: "sdgs",
    hint: null,
    nullRule: "Opportunities that don't name a goal still show.",
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
    hint: "Type part of the provider's name, for example KFC.",
    nullRule: "We hide opportunities that don't name a provider.",
    pendingNote: null,
    group: "more",
  },
];

/**
 * Two sections shown as ONE (2026-10-09, Jason), in the Filters dialog, the mobile sheet and the
 * search bar: "How" is How long and Engagement, "Requirements" is Language and Accessibility
 * (named as the details page groups them). Each part keeps its own control, rules and badge;
 * the combined section adds a header, a question and a short description
 * (`FilterSectionGroup`). Its id is also its search-bar segment's.
 */
export interface FilterGroupDef {
  id: "how" | "requirements";
  label: string;
  /** The popover's title. */
  question: string;
  /** One line under the header (open) or the popover title: what the section covers. */
  description: string;
  icon: IconType;
  /** The sections it holds, in order: registry ids. */
  parts: [string, string];
}

export const FILTER_GROUPS: FilterGroupDef[] = [
  {
    id: "how",
    label: "How",
    // Not the Engagement part's own question, which sits just beneath it.
    question: "How would you like to do it?",
    description:
      "How much time you have, and if you want to join online or in person.",
    icon: IoTimeOutline,
    parts: ["time", "engagement"],
  },
  {
    id: "requirements",
    label: "Requirements",
    question: "Any language or support needs?",
    description: "Languages you understand, and any support you need.",
    icon: IoShieldCheckmarkOutline,
    parts: ["language", "accessibility"],
  },
];

/** The combined section a registry section belongs to, if any. */
export const groupOfSection = (sectionId: string): FilterGroupDef | undefined =>
  FILTER_GROUPS.find((group) => group.parts.includes(sectionId));

/**
 * The icon a search-bar segment and its popover show — the same as its home in the Filters
 * dialog (2026-10-09, Jason): the search box, the Type section, a combined section, a section.
 */
export const iconForSegment = (id: string): IconType =>
  id === "search"
    ? IoSearchOutline
    : id === "type"
      ? IoShapesOutline
      : (FILTER_GROUPS.find((group) => group.id === id)?.icon ??
        FILTER_SECTIONS.find((section) => section.id === id)?.icon ??
        IoSearchOutline);
