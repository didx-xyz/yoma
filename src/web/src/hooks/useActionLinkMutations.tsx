import { useQuery } from "@tanstack/react-query";
import {
  ActionLinkStatus,
  type ActionLinkEntityType,
  type LinkAction,
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

export function useOrgLinksListQuery(
  orgId: string,
  searchFilter: LinkSearchFilter,
  keyParts: string,
  options?: { enabled?: boolean },
) {
  return useQuery<LinkSearchResult>({
    queryKey: ACTION_LINK_QUERY_KEYS.orgList(orgId, keyParts),
    queryFn: () => searchLinks(searchFilter),
    enabled: !!orgId && (options?.enabled ?? true),
  });
}

export function useOrgLinkCountQuery(
  orgId: string,
  entityType: ActionLinkEntityType | string | null,
  action: LinkAction | string | null,
  status: ActionLinkStatus | null,
  keyParts: string,
  options?: { enabled?: boolean },
) {
  return useQuery<number>({
    queryKey: ACTION_LINK_QUERY_KEYS.orgListCount(orgId, status, keyParts),
    queryFn: () => {
      const filter: LinkSearchFilter = {
        pageNumber: 1,
        pageSize: 1,
        entityType,
        action,
        entities: null,
        organizations: [orgId],
        statuses: status !== null ? [status] : null,
        valueContains: null,
      };

      return searchLinks(filter).then((data) => data.totalCount ?? 0);
    },
    enabled: !!orgId && (options?.enabled ?? true),
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
