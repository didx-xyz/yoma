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
import {
  asJsonArray,
  buildListPageQueryString,
  getAppliedFilterCount as getListPageAppliedFilterCount,
  getFilterKeyParts as getListPageFilterKeyParts,
  isLookupMappingReady,
  isSearchPerformed as isListPageSearchPerformed,
  namesToIds,
  parseListPageFilter,
  type ListPageFilterSpec,
  type ListPageParamSpec,
  type ListPageRouterQuery,
  type ListPageStatusTab,
  type QueryValue,
} from "~/components/Common/ListPage/listPageFilter";

/**
 * Query-string ⇄ filter plumbing for the two admin opportunity search pages
 * (/admin/opportunities and /organisations/[id]/opportunities) so both speak the same
 * param vocabulary: query, categories, countries, languages, types, organizations,
 * startDate, endDate, status, customFields, page.
 *
 * The generic half lives in components/Common/ListPage/listPageFilter.ts, shared with the
 * other admin list pages; this module is just the opportunity spec plus the lookup mapping.
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

/** Tab bar definition, shared by both pages. "Deleted" is surfaced as "Archived". */
export const OPPORTUNITY_ADMIN_STATUS_TABS: ListPageStatusTab[] = [
  { value: null, label: "All" },
  { value: Status[Status.Active], label: "Active" },
  { value: Status[Status.Inactive], label: "Inactive" },
  { value: Status[Status.Expired], label: "Expired" },
  { value: Status[Status.Deleted], label: "Archived" },
];

/** Status travels in the querystring as the enum name (e.g. `?status=Deleted`). */
export const OPPORTUNITY_ADMIN_STATUS_PARAM: ListPageParamSpec = {
  param: "status",
  key: "statuses",
  kind: "status",
  tabs: OPPORTUNITY_ADMIN_STATUS_TABS,
  allValues: ALL_STATUSES.map((status) => Status[status]),
};

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

export const OPPORTUNITY_ADMIN_FILTER_SPEC: ListPageFilterSpec = {
  params: [
    { param: "query", key: "valueContains", kind: "single" },
    { param: "categories", key: "categories", kind: "multi" },
    { param: "countries", key: "countries", kind: "multi" },
    { param: "languages", key: "languages", kind: "multi" },
    { param: "types", key: "types", kind: "multi" },
    { param: "organizations", key: "organizations", kind: "multi" },
    { param: "startDate", key: "startDate", kind: "single" },
    { param: "endDate", key: "endDate", kind: "single" },
    OPPORTUNITY_ADMIN_STATUS_PARAM,
    { param: "customFields", key: "customFields", kind: "json" },
    { param: "page", key: "pageNumber", kind: "page" },
  ],
  badgeExcludeKeys: OPPORTUNITY_ADMIN_BADGE_EXCLUDE_KEYS,
};

export interface OpportunityAdminLookups {
  types: OpportunityType[] | undefined;
  categories: OpportunityCategory[] | undefined;
  countries: Country[] | undefined;
  languages: Language[] | undefined;
  organisations?: OrganizationInfo[];
}

/** Router query shape (Next.js gives string | string[] | undefined). */
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

/** Custom-field clauses travel through the querystring as JSON (YOM-1260). */
export const parseCustomFieldsParam = (
  value: QueryValue,
): CustomFieldFilter[] | null => asJsonArray<CustomFieldFilter>(value);

/** The status tab currently selected, or null for "All" / an unknown value. */
export const parseStatusParam = (value: QueryValue): Status | null => {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw) return null;

  const match = OPPORTUNITY_ADMIN_STATUS_TABS.find(
    (tab) =>
      tab.value !== null && tab.value.toLowerCase() === raw.toLowerCase(),
  );
  return match?.value ? Status[match.value as keyof typeof Status] : null;
};

/**
 * The display (name-based) filter for the current querystring. This is what the filter
 * modal and the badges bind to; `statuses` is derived from the selected status tab.
 */
export const parseFilterFromQuery = (
  routerQuery: OpportunityAdminRouterQuery,
  pageSize: number,
): OpportunitySearchFilterAdmin =>
  // NB: the key order here is the order the filter badges render in
  parseListPageFilter<OpportunitySearchFilterAdmin>(
    routerQuery as ListPageRouterQuery,
    OPPORTUNITY_ADMIN_FILTER_SPEC,
    {
      pageNumber: 1,
      pageSize: pageSize,
      valueContains: null,
      types: null,
      categories: null,
      countries: null,
      languages: null,
      organizations: null,
      startDate: null,
      endDate: null,
      statuses: null,
      customFields: null,
      featured: null,
      engagementTypes: null,
    },
  );

/** Whether the lookups needed to map the name-based params to id's have loaded. */
export const isFilterMappingReady = (
  filter: OpportunitySearchFilterAdmin,
  lookups: OpportunityAdminLookups,
): boolean =>
  isLookupMappingReady([
    { values: filter.types, lookup: lookups.types },
    { values: filter.categories, lookup: lookups.categories },
    { values: filter.countries, lookup: lookups.countries },
    { values: filter.languages, lookup: lookups.languages },
    { values: filter.organizations, lookup: lookups.organisations },
  ]);

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
): URLSearchParams | null =>
  buildListPageQueryString(filter, OPPORTUNITY_ADMIN_FILTER_SPEC);

/** True when any filter (other than the status tab / paging) is applied. */
export const isSearchPerformed = (
  routerQuery: OpportunityAdminRouterQuery,
): boolean =>
  isListPageSearchPerformed(
    routerQuery as ListPageRouterQuery,
    OPPORTUNITY_ADMIN_FILTER_SPEC,
  );

/** Number of badges the applied filter renders — drives the "Filters (n)" button label. */
export const getAppliedFilterCount = (
  filter: OpportunitySearchFilterAdmin,
): number =>
  getListPageAppliedFilterCount(filter, OPPORTUNITY_ADMIN_FILTER_SPEC);

/** Cache-key fragment representing every filter that influences the result set. */
export const getFilterKeyParts = (
  routerQuery: OpportunityAdminRouterQuery,
): string =>
  getListPageFilterKeyParts(
    routerQuery as ListPageRouterQuery,
    OPPORTUNITY_ADMIN_FILTER_SPEC,
  );
