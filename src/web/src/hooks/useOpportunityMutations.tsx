import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { type AxiosError } from "axios";
import { toast } from "react-toastify";
import { SchemaType, type SSISchema } from "~/api/models/credential";
import type {
  Country,
  EngagementType,
  Language,
  SkillSearchFilter,
  SkillSearchResults,
  TimeInterval,
} from "~/api/models/lookups";
import {
  Action,
  VerificationStatus,
  type MyOpportunitySearchFilterAdmin,
  type MyOpportunitySearchResults,
} from "~/api/models/myOpportunity";
import {
  Status,
  type CustomFieldDefinition,
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
  getSkills,
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
  getOpportunityCustomFieldDefinitions,
  getOpportunityInfoByIdAdminOrgAdminOrUser,
  getOrganisationsAdmin,
  searchCriteriaOpportunities,
  getTypes,
  getVerificationTypes,
  updateFeatured,
  updateOpportunityHidden,
  updateOpportunityStatus,
} from "~/api/services/opportunities";
import {
  getMyOpportunityCustomFieldDefinitions,
  searchMyOpportunitiesAdmin,
} from "~/api/services/myOpportunities";
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
  /** Org verifications paginated search results */
  verificationList: (orgId: string, keyParts: string) =>
    ["Verifications", orgId, keyParts] as const,
  /** Prefix key to invalidate all org verification queries */
  verificationListAll: (orgId: string) => ["Verifications", orgId] as const,
  /** Org verifications status-tab count */
  verificationListCount: (
    orgId: string,
    status: VerificationStatus | string | null,
    keyParts: string,
  ) => ["Verifications", orgId, "TotalCount", status, keyParts] as const,
  /** Org verification opportunity lookup */
  opportunitiesForVerification: (
    orgId: string,
    verificationStatus: string | null,
  ) => ["OpportunitiesForVerification", orgId, verificationStatus] as const,
  /** Prefix key to invalidate all org verification opportunity lookups */
  opportunitiesForVerificationAll: (orgId: string) =>
    ["OpportunitiesForVerification", orgId] as const,
  /** Admin search results (large queryKey, uses array of URL params) */
  adminSearch: (keyParts: unknown[]) =>
    ["OpportunitiesSearch", ...keyParts] as unknown[],
  /** Prefix key to invalidate ALL admin search result pages */
  adminSearchAll: () => ["OpportunitiesSearch"] as const,
  /** Admin (all organisations) status-tab count */
  adminSearchCount: (status: Status | null, keyParts: string) =>
    ["OpportunitiesSearch", "totalCount", status, keyParts] as unknown[],
  /** Admin lookup: categories, optionally scoped to organisation(s) */
  adminCategories: (organizations?: string[] | null): unknown[] => [
    "AdminOpportunitiesCategories",
    ...(organizations ?? []),
  ],
  /** Admin lookup: countries, optionally scoped to organisation(s) */
  adminCountries: (organizations?: string[] | null): unknown[] => [
    "AdminOpportunitiesCountries",
    ...(organizations ?? []),
  ],
  /** Admin lookup: languages, optionally scoped to organisation(s) */
  adminLanguages: (organizations?: string[] | null): unknown[] => [
    "AdminOpportunitiesLanguages",
    ...(organizations ?? []),
  ],
  /** Admin lookup: organisations */
  adminOrganisations: () => ["AdminOpportunitiesOrganisations"] as const,
  /** Titles for a known set of opportunity id's (labels for id-based filter badges) */
  criteriaByIds: (ids: string[]): unknown[] => [
    "OpportunityCriteriaByIds",
    ...ids,
  ],
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
  skills: (filter: SkillSearchFilter) => ["skills", filter] as const,
  organisation: (id: string) => ["organisation", id] as const,
  /** Definition-driven custom field definitions, scoped by opportunity type name(s) */
  customFieldDefinitions: (types?: string[] | null): unknown[] => [
    "opportunityCustomFieldDefinitions",
    ...(types ?? []),
  ],
  /** MyOpportunity (completion) custom field definitions, scoped by opportunity id */
  myCustomFieldDefinitions: (opportunityId: string) =>
    ["myOpportunityCustomFieldDefinitions", opportunityId] as const,
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

/**
 * Definition-driven custom field definitions (create/edit page).
 * Keyed on the selected opportunity type name(s), so the query re-runs whenever the
 * watched opportunity type changes. `types` are enum names: Other | Learning | Event | Job | Task.
 */
export function useOpportunityCustomFieldDefinitionsQuery(
  types: string[] | null,
  options?: { enabled?: boolean },
) {
  return useQuery<CustomFieldDefinition[]>({
    queryKey: OPPORTUNITY_QUERY_KEYS.customFieldDefinitions(types),
    queryFn: () => getOpportunityCustomFieldDefinitions(types),
    enabled: options?.enabled ?? true,
  });
}

/**
 * Definition-driven MyOpportunity (completion) custom field definitions, keyed by
 * opportunity id. The opportunity type is resolved server-side. Used by the completion
 * form and by the user's opportunity list cards (to label hydrated completion values).
 */
export function useMyOpportunityCustomFieldDefinitionsQuery(
  opportunityId: string,
  options?: { enabled?: boolean },
) {
  return useQuery<CustomFieldDefinition[]>({
    queryKey: OPPORTUNITY_QUERY_KEYS.myCustomFieldDefinitions(opportunityId),
    queryFn: () => getMyOpportunityCustomFieldDefinitions(opportunityId),
    enabled: !!opportunityId && (options?.enabled ?? true),
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

/** Skills search/lookup with pagination and optional name filter. */
export function useSkillsQuery(
  filter: SkillSearchFilter,
  options?: { enabled?: boolean },
) {
  return useQuery<SkillSearchResults>({
    queryKey: OPPORTUNITY_QUERY_KEYS.skills(filter),
    queryFn: () => getSkills(filter),
    enabled: options?.enabled ?? true,
  });
}

/**
 * Org-admin paginated opportunity list.
 * NB: the previous page's rows are kept while the next page loads, so the list never
 * collapses to a skeleton mid-paging (which shrinks the document and makes the browser
 * clamp the scroll position to the top).
 */
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
    placeholderData: keepPreviousData,
  });
}

/**
 * Status-tab count for the admin & org-admin opportunity search pages.
 * The count honours every applied filter, so pass the same (id-based) filter as the
 * search itself — only paging and the statuses are overridden here.
 * Pass `null` as `status` for the “All” tab (queries all 4 statuses), and `null` as
 * `orgId` for the admin (all organisations) page.
 */
export function useOpportunityStatusCountQuery(
  orgId: string | null,
  searchFilter: OpportunitySearchFilterAdmin,
  status: Status | null,
  keyParts: string,
  options?: { enabled?: boolean },
) {
  return useQuery<number>({
    queryKey: orgId
      ? OPPORTUNITY_QUERY_KEYS.orgListCount(orgId, status, keyParts)
      : OPPORTUNITY_QUERY_KEYS.adminSearchCount(status, keyParts),
    queryFn: () => {
      const filter: OpportunitySearchFilterAdmin = {
        ...searchFilter,
        pageNumber: 1,
        pageSize: 1,
        statuses:
          status !== null
            ? [status]
            : [Status.Active, Status.Expired, Status.Inactive, Status.Deleted],
      };
      return getOpportunitiesAdmin(filter).then((d) => d.totalCount ?? 0);
    },
    enabled: options?.enabled ?? true,
    // keeps the tab badges stable (no blink) while a new count loads
    placeholderData: keepPreviousData,
  });
}

/**
 * Org-admin verification (submission) search results.
 * NB: keeps the previous page's rows while the next page loads, so paging never changes the
 * page height and never moves the scroll position.
 */
export function useOrgVerificationsSearchQuery(
  orgId: string,
  searchFilter: MyOpportunitySearchFilterAdmin,
  keyParts: string,
  options?: { enabled?: boolean },
) {
  return useQuery<MyOpportunitySearchResults>({
    queryKey: OPPORTUNITY_QUERY_KEYS.verificationList(orgId, keyParts),
    queryFn: () => searchMyOpportunitiesAdmin(searchFilter),
    enabled: !!orgId && (options?.enabled ?? true),
    placeholderData: keepPreviousData,
  });
}

/**
 * Org-admin verification status-tab count: the list search with `pageSize: 1`, so the badge
 * honours every applied filter. Pass `null` as `status` for the “All” tab.
 */
export function useOrgVerificationCountQuery(
  orgId: string,
  searchFilter: MyOpportunitySearchFilterAdmin,
  status: string | null,
  keyParts: string,
  options?: { enabled?: boolean },
) {
  return useQuery<number>({
    queryKey: OPPORTUNITY_QUERY_KEYS.verificationListCount(
      orgId,
      status,
      keyParts,
    ),
    queryFn: () => {
      const filter: MyOpportunitySearchFilterAdmin = {
        ...searchFilter,
        pageNumber: 1,
        pageSize: 1,
        action: Action.Verification,
        verificationStatuses:
          status !== null
            ? [status]
            : [
                VerificationStatus[VerificationStatus.Pending],
                VerificationStatus[VerificationStatus.Completed],
                VerificationStatus[VerificationStatus.Rejected],
              ],
      };

      return searchMyOpportunitiesAdmin(filter).then((d) => d.totalCount ?? 0);
    },
    enabled: !!orgId && (options?.enabled ?? true),
    // keeps the tab badges stable (no blink) while a new count loads
    placeholderData: keepPreviousData,
  });
}

/**
 * Admin lookup: opportunity categories.
 * NB: `organizations` is optional for the Admin role, but REQUIRED for the
 * Organization Admin role (see OpportunityController).
 */
export function useAdminOpportunityCategoriesQuery(
  organizations?: string[] | null,
  options?: { enabled?: boolean },
) {
  return useQuery<OpportunityCategory[]>({
    queryKey: OPPORTUNITY_QUERY_KEYS.adminCategories(organizations),
    queryFn: () => getCategoriesAdmin(organizations ?? null),
    enabled: options?.enabled ?? true,
  });
}

/** Admin lookup: countries. See note on `organizations` above. */
export function useAdminOpportunityCountriesQuery(
  organizations?: string[] | null,
  options?: { enabled?: boolean },
) {
  return useQuery<Country[]>({
    queryKey: OPPORTUNITY_QUERY_KEYS.adminCountries(organizations),
    queryFn: () => getCountriesAdmin(organizations ?? null),
    enabled: options?.enabled ?? true,
  });
}

/** Admin lookup: languages. See note on `organizations` above. */
export function useAdminOpportunityLanguagesQuery(
  organizations?: string[] | null,
  options?: { enabled?: boolean },
) {
  return useQuery<Language[]>({
    queryKey: OPPORTUNITY_QUERY_KEYS.adminLanguages(organizations),
    queryFn: () => getLanguagesAdmin(organizations ?? null),
    enabled: options?.enabled ?? true,
  });
}

/**
 * Titles for a known set of opportunity id's.
 *
 * The opportunity pickers on the links pages are backed by an async search rather than a
 * full lookup, so those filters stay id-based in the querystring; this resolves the id's
 * back to titles for the filter badges and for re-hydrating the picker on a deep link.
 */
export function useOpportunityTitlesByIdQuery(
  ids: string[] | null,
  options?: { enabled?: boolean },
) {
  const opportunityIds = ids ?? [];

  return useQuery<OpportunitySearchResultsInfo>({
    queryKey: OPPORTUNITY_QUERY_KEYS.criteriaByIds(opportunityIds),
    queryFn: () =>
      searchCriteriaOpportunities({
        pageNumber: 1,
        pageSize: opportunityIds.length,
        types: null,
        organizations: null,
        titleContains: null,
        opportunities: opportunityIds,
        countries: null,
        published: null,
        verificationEnabled: null,
        verificationMethod: null,
        onlyCompletable: false,
      }),
    enabled: opportunityIds.length > 0 && (options?.enabled ?? true),
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
 * NB: keeps the previous page's rows while the next page loads — see
 * useOrgOpportunitiesListQuery.
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
    placeholderData: keepPreviousData,
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
