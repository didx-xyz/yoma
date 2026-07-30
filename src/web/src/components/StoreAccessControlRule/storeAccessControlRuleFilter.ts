import {
  StoreAccessControlRuleStatus,
  type StoreAccessControlRuleSearchFilter,
  type StoreInfo,
} from "~/api/models/marketplace";
import type { OrganizationInfo } from "~/api/models/organisation";
import {
  isLookupMappingReady,
  namesToIds,
  parseListPageFilter,
  type ListPageFilterSpec,
  type ListPageParamSpec,
  type ListPageRouterQuery,
  type ListPageStatusTab,
} from "~/components/Common/ListPage/listPageFilter";

/**
 * Query-string ⇄ filter plumbing for the two marketplace store access rule list pages
 * (/admin/stores and /organisations/[id]/stores): query, organizations, stores, status, page.
 *
 * Both organisations and stores have full `{id, name}` lookups, so both travel as names and
 * are mapped to id's for the API.
 */

/** Tab bar definition, shared by both pages. */
export const STORE_RULE_STATUS_TABS: ListPageStatusTab[] = [
  {
    value: StoreAccessControlRuleStatus[StoreAccessControlRuleStatus.Active],
    label: "Active",
  },
  {
    value: StoreAccessControlRuleStatus[StoreAccessControlRuleStatus.Inactive],
    label: "Inactive",
  },
  {
    value: StoreAccessControlRuleStatus[StoreAccessControlRuleStatus.Deleted],
    label: "Deleted",
  },
];

/**
 * Status travels as the enum name (`?status=Inactive`). `statuses` is still honoured so urls
 * published while the tabs linked to `?statuses=inactive` keep working — matching is
 * case-insensitive. The API treats "no statuses" as every status, so "All" sends nothing.
 */
export const STORE_RULE_STATUS_PARAM: ListPageParamSpec = {
  param: "status",
  key: "statuses",
  kind: "status",
  legacyParams: ["statuses"],
  tabs: [{ value: null, label: "All" }, ...STORE_RULE_STATUS_TABS],
  allValues: null,
};

/** Keys that never render as a filter badge (paging, and status which the tabs own). */
const BADGE_EXCLUDE_KEYS = ["pageNumber", "pageSize", "statuses"];

const storeRuleFilterSpec = (
  scopedToOneOrganisation: boolean,
): ListPageFilterSpec => ({
  params: [
    {
      param: "query",
      key: "nameContains",
      kind: "single",
      legacyParams: ["nameContains"],
    },
    // the org-admin page is already scoped to its own organisation
    ...(scopedToOneOrganisation
      ? []
      : [
          {
            param: "organizations",
            key: "organizations",
            kind: "multi" as const,
          },
        ]),
    { param: "stores", key: "stores", kind: "multi" },
    STORE_RULE_STATUS_PARAM,
    { param: "page", key: "pageNumber", kind: "page" },
  ],
  badgeExcludeKeys: scopedToOneOrganisation
    ? [...BADGE_EXCLUDE_KEYS, "organizations"]
    : BADGE_EXCLUDE_KEYS,
});

/** Admin (all organisations): can additionally filter by organisation. */
export const STORE_RULE_ADMIN_FILTER_SPEC = storeRuleFilterSpec(false);

/** Org admin: scoped to one organisation, so that filter is not applicable. */
export const STORE_RULE_ORG_ADMIN_FILTER_SPEC = storeRuleFilterSpec(true);

export interface StoreRuleLookups {
  organisations?: OrganizationInfo[];
  stores?: StoreInfo[];
}

/** Store names are nullable in the API model; the unnamed ones cannot be filtered on. */
const namedStores = (stores: StoreInfo[] | undefined) =>
  stores
    ?.filter((store): store is StoreInfo & { name: string } => !!store.name)
    .map((store) => ({ id: store.id, name: store.name }));

/**
 * The display (name-based) filter for the current querystring — what the filter dialog and
 * the badges bind to. Pass `organizationId` on the org-admin page to scope the search to it.
 */
export const parseStoreRuleFilterFromQuery = (
  routerQuery: ListPageRouterQuery,
  spec: ListPageFilterSpec,
  pageSize: number,
  organizationId?: string,
): StoreAccessControlRuleSearchFilter =>
  // NB: the key order here is the order the filter badges render in
  parseListPageFilter<StoreAccessControlRuleSearchFilter>(routerQuery, spec, {
    pageNumber: 1,
    pageSize: pageSize,
    nameContains: null,
    organizations: organizationId ? [organizationId] : null,
    stores: null,
    statuses: null,
  });

/** Whether the lookups needed to map the applied names to id's have loaded. */
export const isStoreRuleFilterMappingReady = (
  filter: StoreAccessControlRuleSearchFilter,
  lookups: StoreRuleLookups,
  organizationId?: string,
): boolean =>
  isLookupMappingReady([
    ...(organizationId
      ? []
      : [{ values: filter.organizations, lookup: lookups.organisations }]),
    { values: filter.stores, lookup: lookups.stores },
  ]);

/** Maps the display filter to the id-based filter the search endpoint expects. */
export const mapStoreRuleFilterToApi = (
  filter: StoreAccessControlRuleSearchFilter,
  lookups: StoreRuleLookups,
  organizationId?: string,
): StoreAccessControlRuleSearchFilter => ({
  ...filter,
  organizations: organizationId
    ? [organizationId]
    : namesToIds(filter.organizations, lookups.organisations),
  stores: namesToIds(filter.stores, namedStores(lookups.stores)),
});
