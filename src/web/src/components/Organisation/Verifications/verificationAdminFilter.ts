import {
  Action,
  VerificationStatus,
  type MyOpportunitySearchFilterAdmin,
} from "~/api/models/myOpportunity";
import {
  parseListPageFilter,
  type ListPageFilterSpec,
  type ListPageParamSpec,
  type ListPageRouterQuery,
  type ListPageStatusTab,
} from "~/components/Common/ListPage/listPageFilter";

/**
 * Query-string ⇄ filter plumbing for the org-admin verification (submission) list page
 * (/organisations/[id]/verifications): query, opportunity, status, page.
 *
 * `opportunity` is a single opportunity id rather than a name: the id form is what the
 * existing deep links from the opportunity pages use (`?opportunity=<id>&status=Pending`),
 * so it is kept, and the badge resolves the id to a title from the opportunity lookup.
 */

/** Tab bar definition. "Rejected" is surfaced as "Declined". */
export const VERIFICATION_STATUS_TABS: ListPageStatusTab[] = [
  { value: VerificationStatus[VerificationStatus.Pending], label: "Pending" },
  {
    value: VerificationStatus[VerificationStatus.Completed],
    label: "Completed",
  },
  { value: VerificationStatus[VerificationStatus.Rejected], label: "Declined" },
];

/**
 * Status travels as the enum name (`?status=Pending`). `verificationStatus` is still
 * honoured, as that is the param the in-app deep links and the navbar have published.
 * The "All" tab sends all three statuses explicitly.
 */
export const VERIFICATION_STATUS_PARAM: ListPageParamSpec = {
  param: "status",
  key: "verificationStatuses",
  kind: "status",
  legacyParams: ["verificationStatus"],
  tabs: [{ value: null, label: "All" }, ...VERIFICATION_STATUS_TABS],
  allValues: VERIFICATION_STATUS_TABS.map((tab) => tab.value as string),
};

/**
 * Keys that never render as a filter badge: paging, the tab-owned status, and the values
 * that are fixed for this page rather than user filters.
 */
export const VERIFICATION_BADGE_EXCLUDE_KEYS = [
  "pageNumber",
  "pageSize",
  "verificationStatuses",
  "organizations",
  "userId",
  "action",
];

export const VERIFICATION_FILTER_SPEC: ListPageFilterSpec = {
  params: [
    { param: "query", key: "valueContains", kind: "single" },
    { param: "opportunity", key: "opportunity", kind: "single" },
    VERIFICATION_STATUS_PARAM,
    { param: "page", key: "pageNumber", kind: "page" },
  ],
  badgeExcludeKeys: VERIFICATION_BADGE_EXCLUDE_KEYS,
};

/**
 * The display filter for the current querystring — what the filter dialog and the badges
 * bind to. Already id-based, so no separate API mapping step is needed.
 */
export const parseVerificationFilterFromQuery = (
  routerQuery: ListPageRouterQuery,
  pageSize: number,
  organizationId: string,
): MyOpportunitySearchFilterAdmin =>
  // NB: the key order here is the order the filter badges render in
  parseListPageFilter<MyOpportunitySearchFilterAdmin>(
    routerQuery,
    VERIFICATION_FILTER_SPEC,
    {
      pageNumber: 1,
      pageSize: pageSize,
      valueContains: null,
      opportunity: null,
      verificationStatuses: null,
      organizations: [organizationId],
      userId: null,
      action: Action.Verification,
    },
  );
