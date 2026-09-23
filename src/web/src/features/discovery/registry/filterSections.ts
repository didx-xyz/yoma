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
 * Language. Behind "More filters": Paid and rewards · Skills · SDGs · Provider. Paid moved off
 * the primary list when Engagement took its place on the search bar — one definition, two homes,
 * so the section and the bar segment can never disagree.
 *
 * "Who it is for" (admin-side targeted groups) is deliberately ABSENT: targeting never restricts
 * who can apply, so offering it to a youth implies a constraint that does not exist.
 */

/** Closed set of controls; `<FilterControl kind=…>` is the single kind→component switch. */
export type FilterControlKind =
  | "chips"
  | "country"
  | "gate"
  | "lookupSearch"
  | "range"
  /** Free text with suggestions as you type, matching anywhere in the name — never the full list. */
  | "typeahead"
  /** Paid (inert until the Is Paid field exists) above the live ZLTO reward chips. */
  | "rewards";

/** Which `DiscoveryFilters` slot the section reads and writes. */
export type FilterSectionBinding =
  | "categories"
  | "countries"
  | "engagementTypes"
  | "commitment"
  | "zlto"
  | "languages"
  | "providers";

/**
 * Which `DiscoveryFilters` facet a preference fragment feeds each binding through — the ONE
 * mapping shared by the section model (inherited-aware selection) and the section badge.
 * `null` = no preference can feed this binding.
 */
export const FACET_FOR_BINDING = {
  categories: "categories",
  countries: "countries",
  engagementTypes: "engagementTypes",
  commitment: "commitment",
  zlto: null,
  languages: "languages",
  providers: null,
} as const satisfies Record<FilterSectionBinding, string | null>;

/** A control drawn in place for a facet the API does not filter on yet — disabled, labelled. */
export interface ReservedInput {
  label: string;
  placeholder: string;
}

export interface FilterSectionDef {
  id: string;
  label: string;
  /** The label as a plain question — popover titles speak like the wizard, not like a form. */
  question: string;
  icon: IconType;
  control: FilterControlKind;
  /**
   * `null` = the search API has no core facet for this yet ("the API contract wins"): the section
   * renders visible but inert with `pendingNote` — never failing silently, never a mock filter.
   */
  binding: FilterSectionBinding | null;
  /** OPT-IN badge; the gate copy is stated before the control can be switched on. */
  optIn: boolean;
  /** 13px helper under the header — what the section matches on, when that is not obvious. */
  hint: string | null;
  /**
   * Missing-data rule stated in words, one line — users cannot infer include-vs-exclude
   * semantics. States what the search ACTUALLY does today; where the BA rule differs and the
   * API has not moved yet, the line says so rather than promising the rule.
   */
  nullRule: string | null;
  pendingNote: string | null;
  /** Disabled inputs holding the place of facets that arrive with a later API (Where). */
  reserved: { inputs: ReservedInput[]; note: string } | null;
  /** `primary` renders in the main list; `more` sits behind the "More filters" disclosure. */
  group: "primary" | "more";
}

const pendingNote =
  "Coming soon — the opportunity fields this filters on arrive with the finalised field definitions (YOM-1264).";

/**
 * The type row is not a registry section (it binds `types`, which no `FilterSectionBinding`
 * covers), but it speaks the same two lines as one: a noun in the panel header, the question in
 * the popover title. Both live here so the two homes cannot drift.
 */
export const TYPE_ROW_QUESTION = "What type of opportunity?";
export const TYPE_ROW_HINT =
  "Pick one or more — each type adds its own filters.";

export const FILTER_SECTIONS: FilterSectionDef[] = [
  {
    id: "categories",
    label: "Categories",
    question: "Which categories interest you?",
    icon: IoGridOutline,
    control: "chips",
    binding: "categories",
    optIn: false,
    hint: null,
    nullRule: null,
    pendingNote: null,
    reserved: null,
    group: "primary",
  },
  // Province/Region, City and Distance are drawn disabled: the BA's Location model (Country →
  // Province/Region → City, free-text "contains" on the last two) and the User Location decision
  // both sit with the API. Reserved here so the section's shape does not change when they land.
  {
    id: "where",
    label: "Where",
    question: "Where should it be?",
    icon: IoLocationOutline,
    control: "country",
    binding: "countries",
    optIn: false,
    hint: null,
    nullRule: null,
    pendingNote: null,
    reserved: {
      inputs: [
        { label: "Province / Region", placeholder: "Contains…" },
        { label: "City", placeholder: "Contains…" },
        { label: "Distance", placeholder: "Within … km of you" },
      ],
      note: "Province, city and distance arrive with the Location API; distance also needs your location, which Yoma doesn't collect yet.",
    },
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
    optIn: false,
    hint: null,
    nullRule:
      "Includes opportunities that don't say how you take part — for now; they'll be hidden while this is set once the search API applies the rule.",
    pendingNote: null,
    reserved: null,
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
    optIn: false,
    hint: null,
    nullRule:
      "Excludes opportunities that don't state a time commitment — for now; the rule is to include them once the search API changes.",
    pendingNote: null,
    reserved: null,
    group: "primary",
  },
  {
    id: "accessibility",
    label: "Accessibility",
    question: "Need accommodations?",
    icon: IoShieldCheckmarkOutline,
    control: "gate",
    binding: null,
    optIn: true,
    hint: null,
    nullRule:
      "Includes opportunities that haven't described their accommodations — for now.",
    pendingNote,
    reserved: null,
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
    optIn: false,
    hint: null,
    nullRule:
      "Every opportunity lists at least one language, so none are left out for missing data.",
    pendingNote: null,
    reserved: null,
    group: "primary",
  },
  // Demoted 2026-09-22 when Engagement took Pay's place on the search bar. The ZLTO half is live
  // (a core facet); the Paid half is inert until the Is Paid / Reward Type fields exist.
  {
    id: "pay",
    label: "Paid and rewards",
    question: "Should it pay or reward you?",
    icon: IoCashOutline,
    control: "rewards",
    binding: "zlto",
    optIn: false,
    hint: null,
    nullRule:
      "Opportunities that don't say whether they pay stay in the results, sorted last — once the paid filter is live.",
    pendingNote:
      "Paid / not paid arrives with the Is Paid field (YOM-1264). ZLTO rewards filter today.",
    reserved: null,
    group: "more",
  },
  // Demoted, not deleted — partners ask for Provider; Skills and SDGs await their API facets.
  {
    id: "skills",
    label: "Skills",
    question: "What skills do you have?",
    icon: IoSparklesOutline,
    control: "lookupSearch",
    binding: null,
    optIn: false,
    hint: "For jobs this matches required skills; for everything else, the skills you will earn.",
    nullRule: null,
    pendingNote,
    reserved: null,
    group: "more",
  },
  {
    id: "sdgs",
    label: "SDGs",
    question: "Which global goals matter to you?",
    icon: IoGlobeOutline,
    control: "chips",
    binding: null,
    optIn: false,
    hint: null,
    nullRule: null,
    pendingNote,
    reserved: null,
    group: "more",
  },
  {
    id: "provider",
    label: "Provider",
    question: "Who runs it?",
    icon: IoBusinessOutline,
    control: "typeahead",
    binding: "providers",
    optIn: false,
    hint: "Type part of a name — matches anywhere in it.",
    nullRule: null,
    pendingNote: null,
    reserved: null,
    group: "more",
  },
];
