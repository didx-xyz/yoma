import {
  ActionLinkEntityType,
  ActionLinkStatus,
  LinkAction,
  type LinkSearchFilter,
} from "~/api/models/actionLinks";
import type { OrganizationInfo } from "~/api/models/organisation";
import {
  asString,
  isLookupMappingReady,
  namesToIds,
  parseListPageFilter,
  type ListPageFilterSpec,
  type ListPageParamSpec,
  type ListPageRouterQuery,
  type ListPageStatusTab,
} from "~/components/Common/ListPage/listPageFilter";

/**
 * Query-string ⇄ filter plumbing for the two action-link list pages
 * (/admin/links and /organisations/[id]/links): query, organizations, entities, status, page.
 *
 * `organizations` travels as organisation names, mapped to id's for the API against the
 * admin organisation lookup. `entities` (opportunities) has no full lookup — the picker is
 * an async title search — so it stays id-based; the badges resolve the id's to titles via
 * useOpportunityTitlesByIdQuery.
 */

/** Tab bar definition, shared by both pages. */
export const LINK_STATUS_TABS: ListPageStatusTab[] = [
  { value: ActionLinkStatus.Active, label: "Active" },
  { value: ActionLinkStatus.Inactive, label: "Inactive" },
  { value: ActionLinkStatus.Expired, label: "Expired" },
  { value: ActionLinkStatus.LimitReached, label: "Limit Reached" },
  { value: ActionLinkStatus.Deleted, label: "Deleted" },
];

/**
 * Status travels as the enum name (`?status=LimitReached`). `statuses` is still honoured so
 * urls published while the tabs linked to `?statuses=limitReached` keep working — matching
 * is case-insensitive. The API treats "no statuses" as every status, so the "All" tab sends
 * nothing.
 */
export const LINK_STATUS_PARAM: ListPageParamSpec = {
  param: "status",
  key: "statuses",
  kind: "status",
  legacyParams: ["statuses"],
  tabs: [{ value: null, label: "All" }, ...LINK_STATUS_TABS],
  allValues: null,
};

/**
 * Keys that never render as a filter badge: paging, the tab-owned status, and the entity
 * type / action, which are fixed for these pages rather than user filters.
 */
const BADGE_EXCLUDE_KEYS = [
  "pageNumber",
  "pageSize",
  "statuses",
  "entityType",
  "action",
];

const linkFilterSpec = (
  scopedToOneOrganisation: boolean,
): ListPageFilterSpec => ({
  params: [
    {
      param: "query",
      key: "valueContains",
      kind: "single",
      legacyParams: ["valueContains"],
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
    { param: "entities", key: "entities", kind: "multi" },
    LINK_STATUS_PARAM,
    { param: "page", key: "pageNumber", kind: "page" },
  ],
  badgeExcludeKeys: scopedToOneOrganisation
    ? [...BADGE_EXCLUDE_KEYS, "organizations"]
    : BADGE_EXCLUDE_KEYS,
});

/** Admin (all organisations): can additionally filter by organisation. */
export const LINK_ADMIN_FILTER_SPEC = linkFilterSpec(false);

/** Org admin: scoped to one organisation, so that filter is not applicable. */
export const LINK_ORG_ADMIN_FILTER_SPEC = linkFilterSpec(true);

export interface LinkAdminLookups {
  organisations?: OrganizationInfo[];
}

/**
 * The display filter for the current querystring — what the filter dialog and the badges
 * bind to. Pass `organizationId` on the org-admin page to scope the search to it.
 *
 * NB: `entityType` / `action` are effectively constants for these pages; they are read from
 * the querystring for backwards compatibility but are never written back to it.
 */
export const parseLinkFilterFromQuery = (
  routerQuery: ListPageRouterQuery,
  spec: ListPageFilterSpec,
  pageSize: number,
  organizationId?: string,
): LinkSearchFilter =>
  // NB: the key order here is the order the filter badges render in
  parseListPageFilter<LinkSearchFilter>(routerQuery, spec, {
    pageNumber: 1,
    pageSize: pageSize,
    valueContains: null,
    organizations: organizationId ? [organizationId] : null,
    entities: null,
    statuses: null,
    entityType: asString(routerQuery.type) ?? ActionLinkEntityType.Opportunity,
    action: asString(routerQuery.action) ?? LinkAction.Verify,
  });

/** Whether the lookup needed to map the organisation names to id's has loaded. */
export const isLinkFilterMappingReady = (
  filter: LinkSearchFilter,
  lookups: LinkAdminLookups,
  organizationId?: string,
): boolean =>
  organizationId
    ? true
    : isLookupMappingReady([
        { values: filter.organizations, lookup: lookups.organisations },
      ]);

/** Maps the display filter to the id-based filter the search endpoint expects. */
export const mapLinkFilterToApi = (
  filter: LinkSearchFilter,
  lookups: LinkAdminLookups,
  organizationId?: string,
): LinkSearchFilter => ({
  ...filter,
  organizations: organizationId
    ? [organizationId]
    : namesToIds(filter.organizations, lookups.organisations),
});
