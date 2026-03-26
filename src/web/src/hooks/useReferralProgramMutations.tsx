import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { type AxiosError } from "axios";
import { toast } from "react-toastify";
import {
  type Program,
  type ReferralAnalyticsProgram,
  type ProgramInfo,
  type ProgramSearchFilter,
  type ProgramSearchFilterAdmin,
  type ProgramSearchResults,
  type ProgramSearchResultsInfo,
  type AdminReferralLinkSearchFilter,
  type ReferralLink,
  type ReferralLinkSearchResults,
  type ReferralLinkSearchFilterAdmin,
  type ReferralLinkUsageInfo,
  type ReferralLinkUsageSearchFilter,
  type AdminReferralLinkUsageSearchFilter,
  type ReferralLinkUsageSearchFilterAdmin,
  type ReferralLinkUsageSearchResults,
  type ReferralAnalyticsUser,
  ProgramStatus,
  ReferralParticipationRole,
  type ReferralLinkStatus,
  ReferralLinkUsageStatus,
} from "~/api/models/referrals";
import {
  getMyReferralAnalytics,
  getReferralLinkById,
  getReferralLinkUsageById,
  getReferralLinkUsageByProgramIdAsReferee,
  getReferralProgramAnalytics,
  getReferralProgramById,
  getReferralProgramInfoById,
  getReferralProgramInfoByLinkId,
  searchReferralLinks,
  searchReferralLinksAdmin,
  searchReferralLinkUsagesAdmin,
  searchReferralLinkUsagesAsReferee,
  searchReferralLinkUsagesAsReferrer,
  searchReferralPrograms,
  searchReferralProgramsInfo,
  updateReferralProgramHidden,
  updateReferralProgramStatus,
} from "~/api/services/referrals";
import { ApiErrors } from "~/components/Status/ApiErrors";
import { analytics } from "~/lib/analytics";
import { PAGE_SIZE } from "~/lib/constants";

// ─── Query Key Factories ────────────────────────────────────────────────────
// Centralised here so all callers reference the same keys.

export const REFERRAL_PROGRAM_QUERY_KEYS = {
  /** Full program detail — admin edit / info / links pages */
  detail: (id: string) => ["referralProgram", id] as const,
  /** All admin program lists (also used as the invalidation prefix) */
  list: () => ["referralPrograms"] as const,
  /** Tab count per status on the admin list page */
  listCount: (status: ProgramStatus | null) =>
    ["referralPrograms", "totalCount", status] as const,
  /** Prefix key to invalidate ALL admin program status-tab counts */
  listCountAll: () => ["referralPrograms", "totalCount"] as const,
  /** All admin link lists (prefix for targeted invalidation) */
  links: () => ["referralLinks"] as const,
  /** Tab count per status on the admin links page (scoped to a program) */
  linksCount: (programId: string, status: ReferralLinkStatus | null) =>
    ["referralLinks", "totalCount", programId, status] as const,
  /** Public program info by program id — user-facing pages */
  info: (programId: string) => ["ReferralProgramInfo", programId] as const,
  /** Public program info by referral link id — claim + link-detail pages */
  infoByLink: (linkId: string) =>
    ["ReferralProgramInfoByLink", linkId] as const,
  /** Referral link detail */
  link: (linkId: string) => ["ReferralLink", linkId] as const,
  /** Admin link detail (used on link usage list / detail pages) */
  adminLink: (linkId: string) => ["referralLink", linkId] as const,
  /** Admin link usage detail */
  linkUsage: (usageId: string) => ["referralLinkUsage", usageId] as const,
  /** Admin link usage count per status tab (scoped to a link) */
  linkUsagesCount: (linkId: string, status: ReferralLinkUsageStatus | null) =>
    ["referralLinkUsages", "totalCount", linkId, status] as const,
  /** User referee progress (usage fetched by program ID, refetched every 30 s) */
  refereeProgress: (programId: string) => ["RefereeUsage", programId] as const,
  /** User paginated program list */
  userPrograms: (
    pageNumber: number,
    pageSize: number,
    countries: string[] | null,
  ) => ["ReferralPrograms", pageNumber, pageSize, countries] as const,
  /** User paginated referral link list */
  userLinks: (pageNumber: number, pageSize: number) =>
    ["ReferralLinks", pageNumber, pageSize] as const,
  /** Prefix key used to invalidate ALL pages of user referral links */
  userLinksAll: () => ["ReferralLinks"] as const,
  /** User referee link usages */
  refereeUsages: (pageNumber: number, pageSize: number) =>
    ["ReferralLinkUsagesReferee", pageNumber, pageSize] as const,
  /** User referrer link usages */
  referrerUsages: (pageNumber: number, pageSize: number) =>
    ["ReferralLinkUsagesReferrer", pageNumber, pageSize] as const,
  /** User referral analytics */
  analytics: (role: ReferralParticipationRole) =>
    ["MyReferralAnalytics", role] as const,
  /** Admin paginated program search results */
  adminProgramsList: (keyParts: string) =>
    ["referralPrograms", keyParts] as const,
  /** Admin paginated link search results */
  adminLinksList: (keyParts: string) => ["referralLinks", keyParts] as const,
  /** Admin paginated link usage search results */
  adminUsagesList: (keyParts: string) =>
    ["referralLinkUsages", keyParts] as const,
  /** Program-level analytics */
  programAnalytics: (id: string) => ["referralProgramAnalytics", id] as const,
} as const;

// ─── Query Hooks ─────────────────────────────────────────────────────────────

/**
 * Admin — fetches a single referral program by ID.
 * Used on the edit, info, and links pages.
 */
export function useReferralProgramByIdQuery(
  id: string,
  options?: { enabled?: boolean },
) {
  return useQuery<Program>({
    queryKey: REFERRAL_PROGRAM_QUERY_KEYS.detail(id),
    queryFn: () => getReferralProgramById(id),
    enabled: !!id && id !== "create" && (options?.enabled ?? true),
  });
}

/**
 * Admin — total program count for a given status tab.
 * Pass `null` for the "All" tab.
 */
export function useReferralProgramCountQuery(
  status: ProgramStatus | null,
  options?: { enabled?: boolean },
) {
  return useQuery<number>({
    queryKey: REFERRAL_PROGRAM_QUERY_KEYS.listCount(status),
    queryFn: () => {
      const filter: ProgramSearchFilterAdmin = {
        pageNumber: 1,
        pageSize: PAGE_SIZE,
        countries: null,
        valueContains: null,
        statuses: status !== null ? [status] : null,
        dateStart: null,
        dateEnd: null,
      };
      return searchReferralPrograms(filter).then((r) => r.totalCount ?? 0);
    },
    enabled: options?.enabled ?? true,
  });
}

/**
 * Admin — total link count for a given status tab scoped to a program.
 * Pass `null` for the "All" tab.
 */
export function useReferralLinkCountQuery(
  programId: string,
  status: ReferralLinkStatus | null,
  options?: { enabled?: boolean },
) {
  return useQuery<number>({
    queryKey: REFERRAL_PROGRAM_QUERY_KEYS.linksCount(programId, status),
    queryFn: () => {
      const filter: ReferralLinkSearchFilterAdmin = {
        pageNumber: 1,
        pageSize: PAGE_SIZE,
        programId,
        userId: null,
        statuses: status !== null ? [status] : null,
        valueContains: null,
      };
      return searchReferralLinksAdmin(filter).then((r) => r.totalCount ?? 0);
    },
    enabled: !!programId && (options?.enabled ?? true),
  });
}

/**
 * User — public program info by program ID.
 * Accepts optional `initialData` for SSR hydration.
 */
export function useReferralProgramInfoQuery(
  programId: string,
  options?: { enabled?: boolean; initialData?: ProgramInfo },
) {
  return useQuery<ProgramInfo>({
    queryKey: REFERRAL_PROGRAM_QUERY_KEYS.info(programId),
    queryFn: () => getReferralProgramInfoById(programId),
    enabled: !!programId && (options?.enabled ?? true),
    initialData: options?.initialData,
  });
}

/**
 * User — public program info by referral link ID.
 * Used on the claim and link-detail pages.
 */
export function useReferralProgramInfoByLinkQuery(
  linkId: string,
  options?: { enabled?: boolean },
) {
  return useQuery<ProgramInfo>({
    queryKey: REFERRAL_PROGRAM_QUERY_KEYS.infoByLink(linkId),
    queryFn: () => getReferralProgramInfoByLinkId(linkId),
    enabled: !!linkId && (options?.enabled ?? true),
  });
}

/**
 * User — referral link detail (referrer's own link page).
 */
export function useReferralLinkByIdQuery(
  linkId: string,
  options?: { enabled?: boolean },
) {
  return useQuery<ReferralLink>({
    queryKey: REFERRAL_PROGRAM_QUERY_KEYS.link(linkId),
    queryFn: () => getReferralLinkById(linkId, false),
    enabled: !!linkId && (options?.enabled ?? true),
  });
}

/**
 * User — referee usage progress for a program.
 * Refetches every `refetchInterval` ms when provided (default: none).
 */
export function useReferralLinkUsageByProgramIdQuery(
  programId: string,
  options?: { enabled?: boolean; refetchInterval?: number },
) {
  return useQuery<ReferralLinkUsageInfo>({
    queryKey: REFERRAL_PROGRAM_QUERY_KEYS.refereeProgress(programId),
    queryFn: () => getReferralLinkUsageByProgramIdAsReferee(programId),
    enabled: !!programId && (options?.enabled ?? true),
    refetchInterval: options?.refetchInterval,
  });
}

/**
 * Admin — link detail (used on the link usage list and detail pages).
 */
export function useReferralAdminLinkByIdQuery(
  linkId: string,
  options?: { enabled?: boolean },
) {
  return useQuery<ReferralLink>({
    queryKey: REFERRAL_PROGRAM_QUERY_KEYS.adminLink(linkId),
    queryFn: () => getReferralLinkById(linkId),
    enabled: !!linkId && (options?.enabled ?? true),
  });
}

/**
 * Admin — link usage detail.
 */
export function useReferralLinkUsageByIdQuery(
  usageId: string,
  options?: { enabled?: boolean },
) {
  return useQuery<ReferralLinkUsageInfo>({
    queryKey: REFERRAL_PROGRAM_QUERY_KEYS.linkUsage(usageId),
    queryFn: () => getReferralLinkUsageById(usageId),
    enabled: !!usageId && (options?.enabled ?? true),
  });
}

/**
 * Admin — link usage count per status tab (scoped to a link + program).
 * Pass `null` as status for the "All" tab.
 */
export function useReferralLinkUsageCountQuery(
  linkId: string,
  programId: string,
  status: ReferralLinkUsageStatus | null,
  options?: { enabled?: boolean },
) {
  return useQuery<number>({
    queryKey: REFERRAL_PROGRAM_QUERY_KEYS.linkUsagesCount(linkId, status),
    queryFn: () => {
      const filter: ReferralLinkUsageSearchFilterAdmin = {
        pageNumber: 1,
        pageSize: PAGE_SIZE,
        linkId,
        programId,
        statuses: status !== null ? [status] : null,
        userIdReferee: null,
        userIdReferrer: null,
        dateStart: null,
        dateEnd: null,
      };
      return searchReferralLinkUsagesAdmin(filter).then(
        (r) => r.totalCount ?? 0,
      );
    },
    enabled: !!linkId && !!programId && (options?.enabled ?? true),
  });
}

/**
 * User — paginated public program list.
 */
export function useReferralProgramsQuery(
  pageNumber: number,
  pageSize: number,
  countries: string[] | null,
  options?: { enabled?: boolean },
) {
  return useQuery<ProgramSearchResultsInfo>({
    queryKey: REFERRAL_PROGRAM_QUERY_KEYS.userPrograms(
      pageNumber,
      pageSize,
      countries,
    ),
    queryFn: () =>
      searchReferralProgramsInfo({
        pageNumber,
        pageSize,
        valueContains: null,
        countries,
        includeExpired: false,
      } as ProgramSearchFilter),
    enabled: options?.enabled ?? true,
  });
}

/**
 * User — paginated referral link list (own links).
 */
export function useReferralLinksQuery(
  pageNumber: number,
  pageSize: number,
  options?: { enabled?: boolean },
) {
  return useQuery<ReferralLinkSearchResults>({
    queryKey: REFERRAL_PROGRAM_QUERY_KEYS.userLinks(pageNumber, pageSize),
    queryFn: () =>
      searchReferralLinks({
        pageNumber,
        pageSize,
        programId: null,
        valueContains: null,
        statuses: null,
      } as AdminReferralLinkSearchFilter),
    enabled: options?.enabled ?? true,
  });
}

/**
 * User — referee link usages (as a referee).
 */
export function useReferralLinkUsagesRefereeQuery(
  pageNumber: number,
  pageSize: number,
  options?: { statuses?: ReferralLinkUsageStatus[] | null; enabled?: boolean },
) {
  return useQuery<ReferralLinkUsageSearchResults>({
    queryKey: REFERRAL_PROGRAM_QUERY_KEYS.refereeUsages(pageNumber, pageSize),
    queryFn: () =>
      searchReferralLinkUsagesAsReferee({
        pageNumber,
        pageSize,
        programId: null,
        linkId: null,
        statuses: options?.statuses ?? null,
        dateStart: null,
        dateEnd: null,
      } as ReferralLinkUsageSearchFilter),
    enabled: options?.enabled ?? true,
  });
}

/**
 * User — referral link usages (as a referrer).
 */
export function useReferralLinkUsagesReferrerQuery(
  pageNumber: number,
  pageSize: number,
  options?: { enabled?: boolean },
) {
  return useQuery<ReferralLinkUsageSearchResults>({
    queryKey: REFERRAL_PROGRAM_QUERY_KEYS.referrerUsages(pageNumber, pageSize),
    queryFn: () =>
      searchReferralLinkUsagesAsReferrer({
        pageNumber,
        pageSize,
        programId: null,
        linkId: null,
        statuses: null,
        dateStart: null,
        dateEnd: null,
      } as AdminReferralLinkUsageSearchFilter),
    enabled: options?.enabled ?? true,
  });
}

/**
 * User — referral analytics for a given participation role.
 */
export function useMyReferralAnalyticsQuery(
  role: ReferralParticipationRole,
  options?: { enabled?: boolean },
) {
  return useQuery<ReferralAnalyticsUser>({
    queryKey: REFERRAL_PROGRAM_QUERY_KEYS.analytics(role),
    queryFn: () => getMyReferralAnalytics(role),
    enabled: options?.enabled ?? true,
  });
}

/**
 * Admin — paginated program search results.
 * Pass the same `keyParts` string in both SSP prefetch and the client hook
 * to ensure hydration alignment.
 */
export function useReferralProgramsAdminQuery(
  searchFilter: ProgramSearchFilterAdmin,
  keyParts: string,
  options?: { enabled?: boolean },
) {
  return useQuery<ProgramSearchResults>({
    queryKey: REFERRAL_PROGRAM_QUERY_KEYS.adminProgramsList(keyParts),
    queryFn: () => searchReferralPrograms(searchFilter),
    enabled: options?.enabled ?? true,
  });
}

/**
 * Admin — paginated link search results (scoped to a program).
 */
export function useReferralLinksAdminQuery(
  searchFilter: ReferralLinkSearchFilterAdmin,
  keyParts: string,
  options?: { enabled?: boolean },
) {
  return useQuery<ReferralLinkSearchResults>({
    queryKey: REFERRAL_PROGRAM_QUERY_KEYS.adminLinksList(keyParts),
    queryFn: () => searchReferralLinksAdmin(searchFilter),
    enabled: options?.enabled ?? true,
  });
}

/**
 * Admin — paginated link usage search results (scoped to a link).
 */
export function useReferralLinkUsagesAdminQuery(
  searchFilter: ReferralLinkUsageSearchFilterAdmin,
  keyParts: string,
  options?: { enabled?: boolean },
) {
  return useQuery<ReferralLinkUsageSearchResults>({
    queryKey: REFERRAL_PROGRAM_QUERY_KEYS.adminUsagesList(keyParts),
    queryFn: () => searchReferralLinkUsagesAdmin(searchFilter),
    enabled: options?.enabled ?? true,
  });
}

// ─── Status Mutation ────────────────────────────────────────────────────────

export function useReferralProgramStatusMutation({
  programId,
  programName = "",
  showSuccessToast = true,
}: {
  programId: string;
  programName?: string;
  showSuccessToast?: boolean;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (status: ProgramStatus) =>
      updateReferralProgramStatus(programId, status),
    onSuccess: (_, status) => {
      analytics.trackEvent("referral_program_status_updated", {
        programId,
        programName,
        status,
      });

      void queryClient.invalidateQueries({
        queryKey: REFERRAL_PROGRAM_QUERY_KEYS.list(),
      });
      void queryClient.invalidateQueries({
        queryKey: REFERRAL_PROGRAM_QUERY_KEYS.listCountAll(),
      });
      void queryClient.invalidateQueries({
        queryKey: REFERRAL_PROGRAM_QUERY_KEYS.detail(programId),
      });

      if (showSuccessToast) toast.success("Program status updated");
    },
    onError: (error: AxiosError) => {
      toast(<ApiErrors error={error} />, {
        type: "error",
        toastId: `error-${programId}`,
        autoClose: false,
        icon: false,
      });
    },
  });
}

/**
 * Admin — fetches aggregate analytics for a single referral program.
 */
export function useReferralProgramAnalyticsQuery(
  programId: string,
  options?: { enabled?: boolean },
) {
  return useQuery<ReferralAnalyticsProgram>({
    queryKey: REFERRAL_PROGRAM_QUERY_KEYS.programAnalytics(programId),
    queryFn: () => getReferralProgramAnalytics(programId),
    enabled: !!programId && (options?.enabled ?? true),
  });
}

export function useReferralProgramHiddenMutation({
  programId,
  programName = "",
}: {
  programId: string;
  programName?: string;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (hidden: boolean) =>
      updateReferralProgramHidden(programId, hidden),
    onSuccess: (_, hidden) => {
      analytics.trackEvent("referral_program_hidden_updated", {
        programId,
        programName,
        hidden,
      });

      void queryClient.invalidateQueries({
        queryKey: REFERRAL_PROGRAM_QUERY_KEYS.list(),
      });
      void queryClient.invalidateQueries({
        queryKey: REFERRAL_PROGRAM_QUERY_KEYS.detail(programId),
      });

      toast.success(`Program ${hidden ? "hidden" : "unhidden"}`);
    },
    onError: (error: AxiosError) => {
      toast(<ApiErrors error={error} />, {
        type: "error",
        toastId: `error-hidden-${programId}`,
        autoClose: false,
        icon: false,
      });
    },
  });
}
