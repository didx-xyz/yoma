import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
  ActionLinkStatus,
  type LinkInfo,
  type LinkSearchFilter,
  type LinkSearchFilterUsage,
  type LinkSearchResult,
  type LinkSearchResultsUsage,
} from "~/api/models/actionLinks";
import {
  getLinkById,
  searchLinks,
  searchLinkUsage,
} from "~/api/services/actionLinks";

export const ACTION_LINK_QUERY_KEYS = {
  /** Admin (all organisations) paginated search results */
  adminList: (keyParts: string) => ["Admin", "Links", keyParts] as const,
  /** Prefix key to invalidate all admin search result pages */
  adminListAll: () => ["Admin", "Links"] as const,
  /** Admin (all organisations) status-tab count */
  adminListCount: (status: ActionLinkStatus | null, keyParts: string) =>
    ["Admin", "Links", "TotalCount", status, keyParts] as const,
  orgList: (orgId: string, keyParts: string) =>
    ["Links", orgId, keyParts] as const,
  orgListAll: (orgId: string) => ["Links", orgId] as const,
  orgListCount: (
    orgId: string,
    status: ActionLinkStatus | null,
    keyParts: string,
  ) => ["Links_TotalCount", orgId, status, keyParts] as const,
  orgListCountAll: (orgId: string) => ["Links_TotalCount", orgId] as const,
  detail: (linkId: string, includeQRCode: boolean) =>
    ["OpportunityLink", linkId, includeQRCode] as const,
  detailAll: (linkId: string) => ["OpportunityLink", linkId] as const,
  usageList: (linkId: string, keyParts: string) =>
    ["Link", linkId, keyParts] as const,
  usageListAll: (linkId: string) => ["Link", linkId] as const,
} as const;

/**
 * Links search results, for the admin (all organisations) page when `orgId` is null and
 * the org-admin page otherwise.
 * NB: keeps the previous page's rows while the next page loads, so paging never changes the
 * page height and never moves the scroll position.
 */
export function useLinksSearchQuery(
  orgId: string | null,
  searchFilter: LinkSearchFilter,
  keyParts: string,
  options?: { enabled?: boolean },
) {
  return useQuery<LinkSearchResult>({
    queryKey: orgId
      ? ACTION_LINK_QUERY_KEYS.orgList(orgId, keyParts)
      : ACTION_LINK_QUERY_KEYS.adminList(keyParts),
    queryFn: () => searchLinks(searchFilter),
    enabled: options?.enabled ?? true,
    placeholderData: keepPreviousData,
  });
}

/**
 * Status-tab count: the list search with `pageSize: 1`, so the badge honours every applied
 * filter. Pass `null` as `status` for the "All" tab.
 */
export function useLinkStatusCountQuery(
  orgId: string | null,
  searchFilter: LinkSearchFilter,
  status: ActionLinkStatus | null,
  keyParts: string,
  options?: { enabled?: boolean },
) {
  return useQuery<number>({
    queryKey: orgId
      ? ACTION_LINK_QUERY_KEYS.orgListCount(orgId, status, keyParts)
      : ACTION_LINK_QUERY_KEYS.adminListCount(status, keyParts),
    queryFn: () => {
      const filter: LinkSearchFilter = {
        ...searchFilter,
        pageNumber: 1,
        pageSize: 1,
        statuses: status !== null ? [status] : null,
      };

      return searchLinks(filter).then((data) => data.totalCount ?? 0);
    },
    enabled: options?.enabled ?? true,
    // keeps the tab badges stable (no blink) while a new count loads
    placeholderData: keepPreviousData,
  });
}

export function useActionLinkDetailQuery(
  linkId: string,
  includeQRCode: boolean,
  options?: { enabled?: boolean },
) {
  return useQuery<LinkInfo>({
    queryKey: ACTION_LINK_QUERY_KEYS.detail(linkId, includeQRCode),
    queryFn: () => getLinkById(linkId, includeQRCode),
    enabled: !!linkId && (options?.enabled ?? true),
  });
}

export function useActionLinkUsageQuery(
  linkId: string,
  searchFilter: LinkSearchFilterUsage,
  keyParts: string,
  options?: { enabled?: boolean },
) {
  return useQuery<LinkSearchResultsUsage>({
    queryKey: ACTION_LINK_QUERY_KEYS.usageList(linkId, keyParts),
    queryFn: () => searchLinkUsage(searchFilter),
    enabled: !!linkId && (options?.enabled ?? true),
  });
}
