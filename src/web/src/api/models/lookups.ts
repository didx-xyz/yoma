import type { PaginationFilter } from "./common";

export interface Country {
  id: string;
  name: string;
  codeAlpha2: string;
  codeAlpha3: string;
  codeNumeric: string;
}

export interface Gender {
  id: string;
  name: string;
}
export interface Language {
  id: string;
  name: string;
  codeAlpha2: string;
}

export interface Skill {
  id: string;
  name: string;
  infoURL: string | null;
}

export interface SelectOption {
  value: string;
  label: string;
}

/** A headed set of options — react-select renders the label as an optgroup heading. */
export interface SelectOptionGroup {
  label: string;
  options: SelectOption[];
}

export interface SkillSearchResults {
  totalCount: number | null;
  items: Skill[];
}

export interface SkillSearchFilter extends PaginationFilter {
  nameContains: string | null;
}

export interface TimeInterval {
  id: string;
  name: string;
}

export interface Education {
  id: string;
  name: string;
}

export interface EngagementType {
  id: string;
  /** Stable enum-compatible key: `Remote` | `OnSite` | `Hybrid`. Never render it. */
  name: string;
  /** UI label: `Remote` | `On-site` | `Hybrid`. */
  displayName: string;
}

/** `GET /lookup/currency` — ISO 4217. Core fields submit `code`; custom fields submit `id`. */
export interface Currency {
  id: string;
  code: string;
  name: string;
}

/** `GET /lookup/targeted/group` — informational targeting, never an eligibility gate. */
export interface TargetedGroup {
  id: string;
  name: string;
}

/** `GET /lookup/sustainable/development/goal` — the 17 UN goals, ordered by `number`. */
export interface SustainableDevelopmentGoal {
  id: string;
  number: number;
  name: string;
}

/**
 * `GET /lookup/accessibility` — one shared list: an opportunity's accommodations AND a youth's
 * accessibility requirements. `Other` is returned last and needs a free-text description.
 */
export interface Accessibility {
  id: string;
  name: string;
}

/** The accessibility option that requires a description — the API's `AccessibilityOption.Other`. */
export const ACCESSIBILITY_NAME_OTHER = "Other";

/** The targeted group that cannot be combined with another — the API's `TargetedGroupOption.OpenToAll`. */
export const TARGETED_GROUP_NAME_OPEN_TO_ALL = "Open to all";
