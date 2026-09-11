import { OrganizationStatus } from "~/api/models/opportunity";
import type { OrganizationSearchFilter } from "~/api/models/organisation";
import {
  parseListPageFilter,
  type ListPageFilterSpec,
  type ListPageParamSpec,
  type ListPageRouterQuery,
  type ListPageStatusTab,
} from "~/components/Common/ListPage/listPageFilter";

/**
 * Query-string ⇄ filter plumbing for the organisation list page (/organisations):
 * query, status, page.
 *
 * Status is the page's only filter and the tabs own it, so there is no filter dialog here.
 */

/**
 * Tab bar definition. The querystring carries the enum name, which is what the tabs already
 * linked to; the API takes the enum's numeric value. "Inactive" is surfaced as "Pending".
 */
export const ORGANISATION_STATUS_TABS: ListPageStatusTab[] = [
  {
    value: OrganizationStatus[OrganizationStatus.Active],
    label: "Active",
    apiValue: OrganizationStatus.Active.toString(),
  },
  {
    value: OrganizationStatus[OrganizationStatus.Inactive],
    label: "Pending",
    apiValue: OrganizationStatus.Inactive.toString(),
  },
  {
    value: OrganizationStatus[OrganizationStatus.Declined],
    label: "Declined",
    apiValue: OrganizationStatus.Declined.toString(),
  },
  {
    value: OrganizationStatus[OrganizationStatus.Deleted],
    label: "Deleted",
    apiValue: OrganizationStatus.Deleted.toString(),
  },
];

export const ORGANISATION_STATUS_PARAM: ListPageParamSpec = {
  param: "status",
  key: "statuses",
  kind: "status",
  tabs: [{ value: null, label: "All" }, ...ORGANISATION_STATUS_TABS],
  allValues: null,
};

export const ORGANISATION_FILTER_SPEC: ListPageFilterSpec = {
  params: [
    { param: "query", key: "valueContains", kind: "single" },
    ORGANISATION_STATUS_PARAM,
    { param: "page", key: "pageNumber", kind: "page" },
  ],
  badgeExcludeKeys: ["pageNumber", "pageSize", "statuses", "organizations"],
};

/** The filter for the current querystring. */
export const parseOrganisationFilterFromQuery = (
  routerQuery: ListPageRouterQuery,
  pageSize: number,
): OrganizationSearchFilter =>
  parseListPageFilter<OrganizationSearchFilter>(
    routerQuery,
    ORGANISATION_FILTER_SPEC,
    {
      pageNumber: 1,
      pageSize: pageSize,
      valueContains: null,
      statuses: null,
      organizations: null,
    },
  );
