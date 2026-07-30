import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
  type StoreAccessControlRuleSearchFilter,
  type StoreAccessControlRuleSearchResults,
  type StoreAccessControlRuleStatus,
  type StoreInfo,
} from "~/api/models/marketplace";
import type { OrganizationInfo } from "~/api/models/organisation";
import {
  listSearchCriteriaOrganizations,
  listSearchCriteriaStores,
  searchStoreAccessControlRule,
} from "~/api/services/marketplace";

// ─── Query Key Factories ────────────────────────────────────────────────────
// Centralised here so all callers reference the same keys.

export const STORE_RULE_QUERY_KEYS = {
  /** Admin (all organisations) paginated search results */
  adminList: (keyParts: string) =>
    ["Admin", "StoreAccessControlRule", keyParts] as const,
  /** Prefix key to invalidate every admin store-rule query */
  adminListAll: () => ["Admin", "StoreAccessControlRule"] as const,
  /** Admin (all organisations) status-tab count */
  adminListCount: (
    status: StoreAccessControlRuleStatus | string | null,
    keyParts: string,
  ) =>
    [
      "Admin",
      "StoreAccessControlRule",
      "TotalCount",
      status,
      keyParts,
    ] as const,
  /** Org-scoped paginated search results */
  orgList: (orgId: string, keyParts: string) =>
    ["StoreAccessControlRule", orgId, keyParts] as const,
  /** Org-scoped status-tab count */
  orgListCount: (
    orgId: string,
    status: StoreAccessControlRuleStatus | string | null,
    keyParts: string,
  ) =>
    ["StoreAccessControlRule", orgId, "TotalCount", status, keyParts] as const,
  /** Lookup: organisations that have store rules (Admin role only) */
  organisations: () => ["StoreAccessControlRuleOrganisations"] as const,
  /** Lookup: stores, optionally scoped to an organisation */
  stores: (organizationId?: string | null): unknown[] => [
    "StoreAccessControlRuleStores",
    organizationId ?? null,
  ],
} as const;

// ─── Query Hooks ────────────────────────────────────────────────────────────

/**
 * Store access control rule search results, for the admin (all organisations) page when
 * `orgId` is null and the org-admin page otherwise.
 * NB: keeps the previous page's rows while the next page loads, so paging never changes the
 * page height and never moves the scroll position.
 */
export function useStoreRulesSearchQuery(
  orgId: string | null,
  searchFilter: StoreAccessControlRuleSearchFilter,
  keyParts: string,
  options?: { enabled?: boolean },
) {
  return useQuery<StoreAccessControlRuleSearchResults>({
    queryKey: orgId
      ? STORE_RULE_QUERY_KEYS.orgList(orgId, keyParts)
      : STORE_RULE_QUERY_KEYS.adminList(keyParts),
    queryFn: () => searchStoreAccessControlRule(searchFilter),
    enabled: options?.enabled ?? true,
    placeholderData: keepPreviousData,
  });
}

/**
 * Status-tab count: the list search with `pageSize: 1`, so the badge honours every applied
 * filter. Pass `null` as `status` for the "All" tab.
 */
export function useStoreRuleStatusCountQuery(
  orgId: string | null,
  searchFilter: StoreAccessControlRuleSearchFilter,
  status: string | null,
  keyParts: string,
  options?: { enabled?: boolean },
) {
  return useQuery<number>({
    queryKey: orgId
      ? STORE_RULE_QUERY_KEYS.orgListCount(orgId, status, keyParts)
      : STORE_RULE_QUERY_KEYS.adminListCount(status, keyParts),
    queryFn: () => {
      const filter: StoreAccessControlRuleSearchFilter = {
        ...searchFilter,
        pageNumber: 1,
        pageSize: 1,
        statuses: status !== null ? [status] : null,
      };

      return searchStoreAccessControlRule(filter).then(
        (data) => data.totalCount ?? 0,
      );
    },
    enabled: options?.enabled ?? true,
    // keeps the tab badges stable (no blink) while a new count loads
    placeholderData: keepPreviousData,
  });
}

/**
 * Lookup: the organisations that have store rules.
 * NB: Admin role only (see MarketPlaceController) — the org-admin page is scoped to its own
 * organisation and so does not offer this filter.
 */
export function useStoreRuleOrganisationsQuery(options?: {
  enabled?: boolean;
}) {
  return useQuery<OrganizationInfo[]>({
    queryKey: STORE_RULE_QUERY_KEYS.organisations(),
    queryFn: () => listSearchCriteriaOrganizations(),
    enabled: options?.enabled ?? true,
  });
}

/** Lookup: the stores that have rules, optionally scoped to one organisation. */
export function useStoreRuleStoresQuery(
  organizationId?: string | null,
  options?: { enabled?: boolean },
) {
  return useQuery<StoreInfo[]>({
    queryKey: STORE_RULE_QUERY_KEYS.stores(organizationId),
    queryFn: () => listSearchCriteriaStores(organizationId ?? undefined),
    enabled: options?.enabled ?? true,
  });
}
