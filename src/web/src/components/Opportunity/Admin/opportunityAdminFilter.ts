import type { Country, Language } from "~/api/models/lookups";
import {
  OpportunityFilterOptions,
  Status,
  type CustomFieldFilter,
  type OpportunityCategory,
  type OpportunitySearchFilterAdmin,
  type OpportunityType,
} from "~/api/models/opportunity";
import type { OrganizationInfo } from "~/api/models/organisation";

/**
 * Shared query-string ⇄ filter plumbing for the two admin opportunity search pages
 * (/admin/opportunities and /organisations/[id]/opportunities) so both speak the same
 * param vocabulary: query, categories, countries, languages, types, organizations,
 * startDate, endDate, status, customFields, page.
 *
 * The "display" filter (parseFilterFromQuery) holds human-readable values (names), which
 * is what the filter modal and the filter badges bind to. mapFilterToApi maps those names
 * to the id's expected by the search endpoint.
 */

/** Statuses queried by the "All" tab (the enum has no other values). */
export const ALL_STATUSES = [
  Status.Active,
  Status.Inactive,
  Status.Expired,
  Status.Deleted,
] as const;

export interface OpportunityAdminStatusTab {
  /** null = the "All" tab */
  status: Status | null;
  label: string;
}

/** Tab bar definition, shared by both pages. "Deleted" is surfaced as "Archived". */
export const OPPORTUNITY_ADMIN_STATUS_TABS: OpportunityAdminStatusTab[] = [
  { status: null, label: "All" },
  { status: Status.Active, label: "Active" },
  { status: Status.Inactive, label: "Inactive" },
  { status: Status.Expired, label: "Expired" },
  { status: Status.Deleted, label: "Archived" },
];

/** Filter modal sections. Status is owned by the tabs, so it is not offered here. */
export const OPPORTUNITY_ADMIN_FILTER_OPTIONS: OpportunityFilterOptions[] = [
  OpportunityFilterOptions.CATEGORIES,
  OpportunityFilterOptions.TYPES,
  OpportunityFilterOptions.COUNTRIES,
  OpportunityFilterOptions.LANGUAGES,
  OpportunityFilterOptions.DATE_START,
  OpportunityFilterOptions.DATE_END,
];

/** Admin (all organisations) can additionally filter by organisation. */
export const OPPORTUNITY_ADMIN_FILTER_OPTIONS_ALL_ORGS: OpportunityFilterOptions[] =
  [...OPPORTUNITY_ADMIN_FILTER_OPTIONS, OpportunityFilterOptions.ORGANIZATIONS];

/** Keys that never render as a filter badge (paging, and status which the tabs own). */
export const OPPORTUNITY_ADMIN_BADGE_EXCLUDE_KEYS = [
  "pageNumber",
  "pageSize",
  "statuses",
  "featured",
  "engagementTypes",
];

export interface OpportunityAdminLookups {
  types: OpportunityType[] | undefined;
  categories: OpportunityCategory[] | undefined;
  countries: Country[] | undefined;
  languages: Language[] | undefined;
  organisations?: OrganizationInfo[];
}

/** Router query shape (Next.js gives string | string[] | undefined). */
type QueryValue = string | string[] | undefined;
export interface OpportunityAdminRouterQuery {
  query?: QueryValue;
  page?: QueryValue;
  status?: QueryValue;
  categories?: QueryValue;
  countries?: QueryValue;
  languages?: QueryValue;
  types?: QueryValue;
  organizations?: QueryValue;
  startDate?: QueryValue;
  endDate?: QueryValue;
  customFields?: QueryValue;
}

const asString = (value: QueryValue): string | null => {
  if (value === undefined || value === null) return null;
  const first = Array.isArray(value) ? value[0] : value;
  return first != undefined && first.length > 0 ? first : null;
};

/** Multi-value params use '|' as delimiter, as some values contain ',' (e.g. "Catalan, Valencian"). */
const asArray = (value: QueryValue): string[] | null => {
  const raw = asString(value);
  if (raw === null) return null;
  const items = raw
    .split("|")
    .map((x) => x.trim())
    .filter(Boolean);
  return items.length > 0 ? items : null;
};

/** Custom-field clauses travel through the querystring as JSON (YOM-1260). */
export const parseCustomFieldsParam = (
  value: QueryValue,
): CustomFieldFilter[] | null => {
  const raw = asString(value);
  if (raw === null) return null;
  try {
    const parsed = JSON.parse(raw) as CustomFieldFilter[];
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : null;
  } catch {
    return null;
  }
};

/** The status tab currently selected, or null for "All" / an unknown value. */
export const parseStatusParam = (value: QueryValue): Status | null => {
  const raw = asString(value);
  if (raw === null) return null;
  const match = OPPORTUNITY_ADMIN_STATUS_TABS.find(
    (tab) => tab.status !== null && Status[tab.status] === raw,
  );
  return match?.status ?? null;
};

/**
 * The display (name-based) filter for the current querystring. This is what the filter
 * modal and the badges bind to; `statuses` is derived from the selected status tab.
 */
export const parseFilterFromQuery = (
  routerQuery: OpportunityAdminRouterQuery,
  pageSize: number,
): OpportunitySearchFilterAdmin => {
  const page = asString(routerQuery.page);
  const status = parseStatusParam(routerQuery.status);

  return {
    pageNumber: page ? parseInt(page) : 1,
    pageSize: pageSize,
    // NB: no manual en/decoding — URLSearchParams encodes, the router decodes
    valueContains: asString(routerQuery.query),
    types: asArray(routerQuery.types),
    categories: asArray(routerQuery.categories),
    countries: asArray(routerQuery.countries),
    languages: asArray(routerQuery.languages),
    organizations: asArray(routerQuery.organizations),
    startDate: asString(routerQuery.startDate),
    endDate: asString(routerQuery.endDate),
    statuses:
      status !== null
        ? [Status[status]]
        : [...ALL_STATUSES].map((x) => Status[x]),
    customFields: parseCustomFieldsParam(routerQuery.customFields),
    featured: null,
    engagementTypes: null,
  };
};

/** Whether the lookups needed to map the name-based params to id's have loaded. */
export const isFilterMappingReady = (
  filter: OpportunitySearchFilterAdmin,
  lookups: OpportunityAdminLookups,
): boolean => {
  if (filter.types?.length && !lookups.types) return false;
  if (filter.categories?.length && !lookups.categories) return false;
  if (filter.countries?.length && !lookups.countries) return false;
  if (filter.languages?.length && !lookups.languages) return false;
  if (filter.organizations?.length && !lookups.organisations) return false;
  return true;
};

const namesToIds = <T extends { id: string; name: string }>(
  names: string[] | null,
  lookup: T[] | undefined,
): string[] | null => {
  if (!names || names.length === 0) return null;
  const ids = names
    .map((name) => lookup?.find((item) => item.name === name)?.id ?? "")
    .filter((id) => id !== "");
  return ids.length > 0 ? ids : null;
};

/**
 * Maps the display filter to the id-based filter the search endpoint expects.
 * `organizationId` scopes the search to a single organisation (org-admin page), in which
 * case the organisations filter is not applicable.
 */
export const mapFilterToApi = (
  filter: OpportunitySearchFilterAdmin,
  lookups: OpportunityAdminLookups,
  organizationId?: string,
): OpportunitySearchFilterAdmin => ({
  ...filter,
  types: namesToIds(filter.types, lookups.types),
  categories: namesToIds(filter.categories, lookups.categories),
  countries: namesToIds(filter.countries, lookups.countries),
  languages: namesToIds(filter.languages, lookups.languages),
  organizations: organizationId
    ? [organizationId]
    : namesToIds(filter.organizations, lookups.organisations),
});

/** Serialises the display filter back to the querystring. */
export const filterToQueryString = (
  filter: OpportunitySearchFilterAdmin,
): URLSearchParams | null => {
  const params = new URLSearchParams();

  if (filter.valueContains && filter.valueContains.length > 0)
    params.append("query", filter.valueContains);

  if (filter.categories?.length)
    params.append("categories", filter.categories.join("|"));

  if (filter.countries?.length)
    params.append("countries", filter.countries.join("|"));

  if (filter.languages?.length)
    params.append("languages", filter.languages.join("|"));

  if (filter.types?.length) params.append("types", filter.types.join("|"));

  if (filter.organizations?.length)
    params.append("organizations", filter.organizations.join("|"));

  if (filter.startDate) params.append("startDate", filter.startDate);

  if (filter.endDate) params.append("endDate", filter.endDate);

  // a single status = a status tab; the "All" tab (or all four) stays out of the url
  if (
    filter.statuses?.length === 1 &&
    typeof filter.statuses[0] === "string" &&
    filter.statuses[0].length > 0
  )
    params.append("status", filter.statuses[0]);

  if (filter.customFields?.length)
    // serialised as JSON; URLSearchParams handles the encoding
    params.append("customFields", JSON.stringify(filter.customFields));

  if (filter.pageNumber && filter.pageNumber !== 1)
    params.append("page", filter.pageNumber.toString());

  if (params.size === 0) return null;
  return params;
};

/** True when any filter (other than the status tab / paging) is applied. */
export const isSearchPerformed = (
  routerQuery: OpportunityAdminRouterQuery,
): boolean =>
  [
    routerQuery.query,
    routerQuery.categories,
    routerQuery.countries,
    routerQuery.languages,
    routerQuery.types,
    routerQuery.organizations,
    routerQuery.startDate,
    routerQuery.endDate,
    routerQuery.customFields,
  ].some((value) => asString(value) !== null);

/** Number of badges the applied filter renders — drives the "Filters (n)" button label. */
export const getAppliedFilterCount = (
  filter: OpportunitySearchFilterAdmin,
): number =>
  Object.entries(filter)
    .filter(
      ([key, value]) =>
        !OPPORTUNITY_ADMIN_BADGE_EXCLUDE_KEYS.includes(key) && !!value,
    )
    .reduce((count, [, value]) => {
      if (Array.isArray(value)) return count + value.length;
      return count + 1;
    }, 0);

/** Cache-key fragment representing every filter that influences the result set. */
export const getFilterKeyParts = (
  routerQuery: OpportunityAdminRouterQuery,
): string =>
  [
    asString(routerQuery.query),
    asString(routerQuery.page),
    asString(routerQuery.status),
    asString(routerQuery.categories),
    asString(routerQuery.countries),
    asString(routerQuery.languages),
    asString(routerQuery.types),
    asString(routerQuery.organizations),
    asString(routerQuery.startDate),
    asString(routerQuery.endDate),
    asString(routerQuery.customFields),
  ].join("_");
