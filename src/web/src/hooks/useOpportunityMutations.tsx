import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { type AxiosError } from "axios";
import { toast } from "react-toastify";
import { SchemaType, type SSISchema } from "~/api/models/credential";
import type {
  Country,
  EngagementType,
  Language,
  TimeInterval,
} from "~/api/models/lookups";
import {
  Status,
  type Opportunity,
  type OpportunityCategory,
  type OpportunityDifficulty,
  type OpportunityInfo,
  type OpportunitySearchFilterAdmin,
  type OpportunitySearchResults,
  type OpportunitySearchResultsInfo,
  type OpportunityType,
  type OpportunityVerificationType,
} from "~/api/models/opportunity";
import type { Organization, OrganizationInfo } from "~/api/models/organisation";
import {
  getCountries,
  getEngagementTypes,
  getLanguages,
  getTimeIntervals,
} from "~/api/services/lookups";
import {
  getCategories,
  getCategoriesAdmin,
  getCountriesAdmin,
  getDifficulties,
  getLanguagesAdmin,
  getOpportunitiesAdmin,
  getOpportunityById,
  getOpportunityInfoByIdAdminOrgAdminOrUser,
  getOrganisationsAdmin,
  getTypes,
  getVerificationTypes,
  updateFeatured,
  updateOpportunityHidden,
  updateOpportunityStatus,
} from "~/api/services/opportunities";
import { getSchemas } from "~/api/services/credentials";
import { getOrganisationById } from "~/api/services/organisations";
import { ApiErrors } from "~/components/Status/ApiErrors";
import { analytics } from "~/lib/analytics";

// ─── Query Key Factories ────────────────────────────────────────────────────
// Centralised here so all callers reference the same keys.

export const OPPORTUNITY_QUERY_KEYS = {
  /** Full opportunity detail (edit page) */
  detail: (id: string) => ["opportunity", id] as const,
  /** Opportunity info (info/action pages) */
  info: (id: string) => ["opportunityInfo", id] as const,
  /** List scoped to an organisation, or all lists when orgId is omitted */
  list: (orgId?: string): readonly string[] =>
    orgId ? ["opportunities", orgId] : ["opportunities"],
  /** Verification status for a specific opportunity */
  verificationStatus: (id: string) => ["verificationStatus", id] as const,
  /** Org opportunities paginated search results */
  orgList: (orgId: string, keyParts: string) =>
    ["opportunities", orgId, keyParts] as const,
  /** Org opportunities status-tab count */
  orgListCount: (orgId: string, status: Status | null, keyParts: string) =>
    ["opportunities", orgId, "totalCount", status, keyParts] as const,
  /** Admin search results (large queryKey, uses array of URL params) */
  adminSearch: (keyParts: unknown[]) =>
    ["OpportunitiesSearch", ...keyParts] as unknown[],
  /** Prefix key to invalidate ALL admin search result pages */
  adminSearchAll: () => ["OpportunitiesSearch"] as const,
  /** Admin lookup: categories */
  adminCategories: () => ["AdminOpportunitiesCategories"] as const,
  /** Admin lookup: countries */
  adminCountries: () => ["AdminOpportunitiesCountries"] as const,
  /** Admin lookup: languages */
  adminLanguages: () => ["AdminOpportunitiesLanguages"] as const,
  /** Admin lookup: organisations */
  adminOrganisations: () => ["AdminOpportunitiesOrganisations"] as const,
  /** Create/edit page lookups */
  categories: () => ["categories"] as const,
  countries: () => ["countries"] as const,
  languages: () => ["languages"] as const,
  opportunityTypes: () => ["opportunityTypes"] as const,
  verificationTypes: () => ["verificationTypes"] as const,
  difficulties: () => ["difficulties"] as const,
  timeIntervals: () => ["timeIntervals"] as const,
  engagementTypes: () => ["engagementTypes"] as const,
  schemas: () => ["schemas"] as const,
  organisation: (id: string) => ["organisation", id] as const,
} as const;

// ─── Query Hooks ──────────────────────────────────────────────────────────────────

/** Full opportunity detail (create/edit page). Skips fetch when id = "create". */
export function useOpportunityDetailQuery(
  id: string,
  options?: { enabled?: boolean },
) {
  return useQuery<Opportunity>({
    queryKey: OPPORTUNITY_QUERY_KEYS.detail(id),
    queryFn: () => getOpportunityById(id),
    enabled: id !== "create" && (options?.enabled ?? true),
  });
}

/** Opportunity info for the org-admin info page. */
export function useOpportunityInfoQuery(
  id: string,
  options?: { enabled?: boolean },
) {
  return useQuery<OpportunityInfo>({
    queryKey: OPPORTUNITY_QUERY_KEYS.info(id),
    queryFn: () => getOpportunityInfoByIdAdminOrgAdminOrUser(id),
    enabled: !!id && (options?.enabled ?? true),
  });
}

/** Organisation detail (create/edit page). */
export function useOrganisationByIdQuery(
  id: string,
  options?: { enabled?: boolean },
) {
  return useQuery<Organization>({
    queryKey: OPPORTUNITY_QUERY_KEYS.organisation(id),
    queryFn: () => getOrganisationById(id),
    enabled: !!id && (options?.enabled ?? true),
  });
}

/** Opportunity categories lookup (create/edit page). */
export function useOpportunityCategoriesQuery(options?: { enabled?: boolean }) {
  return useQuery<OpportunityCategory[]>({
    queryKey: OPPORTUNITY_QUERY_KEYS.categories(),
    queryFn: () => getCategories(),
    enabled: options?.enabled ?? true,
  });
}

/** Countries lookup (create/edit page). */
export function useOpportunityCountriesQuery(options?: { enabled?: boolean }) {
  return useQuery<Country[]>({
    queryKey: OPPORTUNITY_QUERY_KEYS.countries(),
    queryFn: () => getCountries(),
    enabled: options?.enabled ?? true,
  });
}

/** Languages lookup (create/edit page). */
export function useOpportunityLanguagesQuery(options?: { enabled?: boolean }) {
  return useQuery<Language[]>({
    queryKey: OPPORTUNITY_QUERY_KEYS.languages(),
    queryFn: () => getLanguages(),
    enabled: options?.enabled ?? true,
  });
}

/** Opportunity types lookup (create/edit page). */
export function useOpportunityTypesQuery(options?: { enabled?: boolean }) {
  return useQuery<OpportunityType[]>({
    queryKey: OPPORTUNITY_QUERY_KEYS.opportunityTypes(),
    queryFn: () => getTypes(),
    enabled: options?.enabled ?? true,
  });
}

/** Verification types lookup (create/edit page). */
export function useOpportunityVerificationTypesQuery(options?: {
  enabled?: boolean;
}) {
  return useQuery<OpportunityVerificationType[]>({
    queryKey: OPPORTUNITY_QUERY_KEYS.verificationTypes(),
    queryFn: () => getVerificationTypes(),
    enabled: options?.enabled ?? true,
  });
}

/** Difficulties lookup (create/edit page). */
export function useOpportunityDifficultiesQuery(options?: {
  enabled?: boolean;
}) {
  return useQuery<OpportunityDifficulty[]>({
    queryKey: OPPORTUNITY_QUERY_KEYS.difficulties(),
    queryFn: () => getDifficulties(),
    enabled: options?.enabled ?? true,
  });
}

/** Time intervals lookup (create/edit page). */
export function useOpportunityTimeIntervalsQuery(options?: {
  enabled?: boolean;
}) {
  return useQuery<TimeInterval[]>({
    queryKey: OPPORTUNITY_QUERY_KEYS.timeIntervals(),
    queryFn: () => getTimeIntervals(),
    enabled: options?.enabled ?? true,
  });
}

/** Engagement types lookup (create/edit page). */
export function useOpportunityEngagementTypesQuery(options?: {
  enabled?: boolean;
}) {
  return useQuery<EngagementType[]>({
    queryKey: OPPORTUNITY_QUERY_KEYS.engagementTypes(),
    queryFn: () => getEngagementTypes(),
    enabled: options?.enabled ?? true,
  });
}

/** SSI schemas lookup (create/edit page). */
export function useOpportunitySchemasQuery(options?: { enabled?: boolean }) {
  return useQuery<SSISchema[]>({
    queryKey: OPPORTUNITY_QUERY_KEYS.schemas(),
    queryFn: () => getSchemas(SchemaType.Opportunity),
    enabled: options?.enabled ?? true,
  });
}

/** Org-admin paginated opportunity list. */
export function useOrgOpportunitiesListQuery(
  orgId: string,
  searchFilter: OpportunitySearchFilterAdmin,
  keyParts: string,
  options?: { enabled?: boolean },
) {
  return useQuery<OpportunitySearchResults>({
    queryKey: OPPORTUNITY_QUERY_KEYS.orgList(orgId, keyParts),
    queryFn: () => getOpportunitiesAdmin(searchFilter),
    enabled: !!orgId && (options?.enabled ?? true),
  });
}

/**
 * Org-admin status-tab count.
 * Pass `null` as `status` for the “All” tab (queries all 4 statuses).
 */
export function useOrgOpportunityCountQuery(
  orgId: string,
  valueContains: string | null,
  status: Status | null,
  keyParts: string,
  options?: { enabled?: boolean },
) {
  return useQuery<number>({
    queryKey: OPPORTUNITY_QUERY_KEYS.orgListCount(orgId, status, keyParts),
    queryFn: () => {
      const filter: OpportunitySearchFilterAdmin = {
        pageNumber: 1,
        pageSize: 1,
        organizations: [orgId],
        valueContains,
        statuses:
          status !== null
            ? [status]
            : [Status.Active, Status.Expired, Status.Inactive, Status.Deleted],
        types: null,
        categories: null,
        languages: null,
        countries: null,
        startDate: null,
        endDate: null,
        featured: null,
        engagementTypes: null,
      };
      return getOpportunitiesAdmin(filter).then((d) => d.totalCount ?? 0);
    },
    enabled: !!orgId && (options?.enabled ?? true),
  });
}

/** Admin lookup: opportunity categories. */
export function useAdminOpportunityCategoriesQuery(options?: {
  enabled?: boolean;
}) {
  return useQuery<OpportunityCategory[]>({
    queryKey: OPPORTUNITY_QUERY_KEYS.adminCategories(),
    queryFn: () => getCategoriesAdmin(null),
    enabled: options?.enabled ?? true,
  });
}

/** Admin lookup: countries. */
export function useAdminOpportunityCountriesQuery(options?: {
  enabled?: boolean;
}) {
  return useQuery<Country[]>({
    queryKey: OPPORTUNITY_QUERY_KEYS.adminCountries(),
    queryFn: () => getCountriesAdmin(null),
    enabled: options?.enabled ?? true,
  });
}

/** Admin lookup: languages. */
export function useAdminOpportunityLanguagesQuery(options?: {
  enabled?: boolean;
}) {
  return useQuery<Language[]>({
    queryKey: OPPORTUNITY_QUERY_KEYS.adminLanguages(),
    queryFn: () => getLanguagesAdmin(null),
    enabled: options?.enabled ?? true,
  });
}

/** Admin lookup: organisations. */
export function useAdminOpportunityOrganisationsQuery(options?: {
  enabled?: boolean;
}) {
  return useQuery<OrganizationInfo[]>({
    queryKey: OPPORTUNITY_QUERY_KEYS.adminOrganisations(),
    queryFn: () => getOrganisationsAdmin(),
    enabled: options?.enabled ?? true,
  });
}

/**
 * Admin opportunities search results.
 * Pass the pre-built filter (from a useMemo on the page) and the raw URL
 * param array as `keyParts` so cache invalidation is driven by URL changes.
 */
export function useAdminOpportunitiesSearchQuery(
  filter: OpportunitySearchFilterAdmin,
  keyParts: unknown[],
  options?: { enabled?: boolean },
) {
  return useQuery<OpportunitySearchResultsInfo>({
    queryKey: OPPORTUNITY_QUERY_KEYS.adminSearch(keyParts),
    queryFn: () => getOpportunitiesAdmin(filter),
    enabled: options?.enabled ?? true,
  });
}

// ─── Status Mutation ────────────────────────────────────────────────────────

export function useOpportunityStatusMutation({
  opportunityId,
  organizationId,
  title = "",
  showSuccessToast = true,
}: {
  opportunityId: string;
  organizationId: string;
  title?: string;
  showSuccessToast?: boolean;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (status: Status) =>
      updateOpportunityStatus(opportunityId, status),
    onSuccess: (_, status) => {
      analytics.trackEvent("opportunity_status_updated", {
        opportunityId,
        opportunityTitle: title,
        newStatus: status,
      });

      void queryClient.invalidateQueries({
        queryKey: OPPORTUNITY_QUERY_KEYS.detail(opportunityId),
      });
      void queryClient.invalidateQueries({
        queryKey: OPPORTUNITY_QUERY_KEYS.info(opportunityId),
      });
      void queryClient.invalidateQueries({
        queryKey: OPPORTUNITY_QUERY_KEYS.list(organizationId),
      });
      void queryClient.invalidateQueries({
        queryKey: OPPORTUNITY_QUERY_KEYS.adminSearchAll(),
      });

      if (showSuccessToast) toast.success("Opportunity status updated");
    },
    onError: (error: AxiosError) => {
      toast(<ApiErrors error={error} />, {
        type: "error",
        toastId: `opportunity-${opportunityId}`,
        autoClose: false,
        icon: false,
      });
    },
  });
}

// ─── Hidden Mutation ────────────────────────────────────────────────────────

export function useOpportunityHiddenMutation({
  opportunityId,
  organizationId,
  title = "",
}: {
  opportunityId: string;
  organizationId: string;
  title?: string;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (hidden: boolean) =>
      updateOpportunityHidden(opportunityId, hidden),
    onSuccess: (_, hidden) => {
      analytics.trackEvent("opportunity_visibility_updated", {
        opportunityId,
        opportunityTitle: title,
        hidden,
      });

      void queryClient.invalidateQueries({
        queryKey: OPPORTUNITY_QUERY_KEYS.info(opportunityId),
      });
      void queryClient.invalidateQueries({
        queryKey: OPPORTUNITY_QUERY_KEYS.list(organizationId),
      });
      void queryClient.invalidateQueries({
        queryKey: OPPORTUNITY_QUERY_KEYS.adminSearchAll(),
      });

      toast.success("Opportunity updated");
    },
    onError: (error: AxiosError) => {
      toast(<ApiErrors error={error} />, {
        type: "error",
        toastId: `opportunity-${opportunityId}`,
        autoClose: false,
        icon: false,
      });
    },
  });
}

// ─── Featured Mutation ──────────────────────────────────────────────────────

export function useOpportunityFeaturedMutation({
  opportunityId,
  title = "",
}: {
  opportunityId: string;
  title?: string;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (featured: boolean) => updateFeatured(opportunityId, featured),
    onSuccess: (_, featured) => {
      analytics.trackEvent("opportunity_featured_updated", {
        opportunityId,
        opportunityTitle: title,
        featured,
      });

      void queryClient.invalidateQueries({
        queryKey: OPPORTUNITY_QUERY_KEYS.info(opportunityId),
      });
      void queryClient.invalidateQueries({
        queryKey: OPPORTUNITY_QUERY_KEYS.adminSearchAll(),
      });

      toast.success(
        featured
          ? "Opportunity marked Featured"
          : "Opportunity unmarked as Featured",
      );
    },
    onError: (error: AxiosError) => {
      toast(<ApiErrors error={error} />, {
        type: "error",
        toastId: `opportunity-${opportunityId}`,
        autoClose: false,
        icon: false,
      });
    },
  });
}
