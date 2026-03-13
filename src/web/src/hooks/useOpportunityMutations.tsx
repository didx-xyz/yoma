import { useMutation, useQueryClient } from "@tanstack/react-query";
import { type AxiosError } from "axios";
import { toast } from "react-toastify";
import { Status } from "~/api/models/opportunity";
import {
  updateFeatured,
  updateOpportunityHidden,
  updateOpportunityStatus,
} from "~/api/services/opportunities";
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
} as const;

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
