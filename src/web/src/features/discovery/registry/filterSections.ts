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
 * "Who it is for" (admin-side targeted groups) is deliberately ABSENT: targeting never restricts
 * who can apply, so offering it to a youth implies a constraint that does not exist.
 */

/** Closed set of controls; `<FilterControl kind=…>` is the single kind→component switch. */
export type FilterControlKind =
  | "chips"
  | "country"
  | "gate"
  | "lookupSearch"
  | "range";

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

export interface FilterSectionDef {
  id: string;
  label: string;
  icon: IconType;
  control: FilterControlKind;
  /**
   * `null` = the search API has no core facet for this yet ("the API contract wins"): the section
   * renders visible but inert with `pendingNote` — never failing silently, never a mock filter.
   */
  binding: FilterSectionBinding | null;
  /** OPT-IN badge; the gate copy is stated before the control can be switched on. */
  optIn: boolean;
  /** Missing-data rule stated in words — users cannot infer include-vs-exclude semantics. */
  nullRule: string | null;
  pendingNote: string | null;
  /** `primary` renders in the main list; `more` sits behind the "More filters" disclosure. */
  group: "primary" | "more";
}

const pendingNote =
  "Coming soon — the opportunity fields this filters on arrive with the finalised field definitions (YOM-1264).";

export const FILTER_SECTIONS: FilterSectionDef[] = [
  {
    id: "categories",
    label: "Categories",
    icon: IoGridOutline,
    control: "chips",
    binding: "categories",
    optIn: false,
    nullRule: null,
    pendingNote: null,
    group: "primary",
  },
  {
    id: "where",
    label: "Location",
    icon: IoLocationOutline,
    control: "country",
    binding: "countries",
    optIn: false,
    nullRule: null,
    pendingNote: null,
    group: "primary",
  },
  {
    id: "format",
    label: "Engagement",
    icon: IoWifiOutline,
    control: "chips",
    binding: "engagementTypes",
    optIn: false,
    nullRule: "Includes opportunities that don't state how you take part.",
    pendingNote: null,
    group: "primary",
  },
  // NB: the API currently EXCLUDES opportunities with no commitment set from an interval filter,
  // the opposite of the BA rule ("includes") — copy states the actual behaviour; flagged to Adrian.
  {
    id: "time",
    label: "Time commitment",
    icon: IoTimeOutline,
    control: "range",
    binding: "commitment",
    optIn: false,
    nullRule: "Excludes opportunities that don't state a time commitment.",
    pendingNote: null,
    group: "primary",
  },
  {
    id: "pay",
    label: "Paid & rewards",
    icon: IoCashOutline,
    control: "chips",
    binding: "zlto",
    optIn: false,
    nullRule: null,
    pendingNote: null,
    group: "primary",
  },
  {
    id: "accessibility",
    label: "Accessibility",
    icon: IoShieldCheckmarkOutline,
    control: "gate",
    binding: null,
    optIn: true,
    nullRule:
      "Turning this on will exclude opportunities that haven't described their accommodations.",
    pendingNote,
    group: "primary",
  },
  {
    id: "language",
    label: "Language",
    icon: IoLanguageOutline,
    control: "chips",
    binding: "languages",
    optIn: false,
    nullRule: null,
    pendingNote: null,
    group: "primary",
  },
  // Demoted, not deleted — partners ask for Provider; Skills and SDGs await their API facets.
  {
    id: "skills",
    label: "Skills",
    icon: IoSparklesOutline,
    control: "lookupSearch",
    binding: null,
    optIn: false,
    nullRule: null,
    pendingNote,
    group: "more",
  },
  {
    id: "sdgs",
    label: "SDGs",
    icon: IoGlobeOutline,
    control: "chips",
    binding: null,
    optIn: false,
    nullRule: null,
    pendingNote,
    group: "more",
  },
  {
    id: "provider",
    label: "Provider",
    icon: IoBusinessOutline,
    control: "lookupSearch",
    binding: "providers",
    optIn: false,
    nullRule: null,
    pendingNote: null,
    group: "more",
  },
];
