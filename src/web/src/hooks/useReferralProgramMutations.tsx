import { useMutation, useQueryClient } from "@tanstack/react-query";
import { type AxiosError } from "axios";
import { toast } from "react-toastify";
import { ProgramStatus } from "~/api/models/referrals";
import { updateReferralProgramStatus } from "~/api/services/referrals";
import { ApiErrors } from "~/components/Status/ApiErrors";
import { analytics } from "~/lib/analytics";

// ─── Query Key Factories ────────────────────────────────────────────────────
// Centralised here so all callers reference the same keys.

export const REFERRAL_PROGRAM_QUERY_KEYS = {
  /** Full program detail (edit / info pages) */
  detail: (id: string) => ["referralProgram", id] as const,
  /** All admin program lists */
  list: () => ["referralPrograms"] as const,
} as const;

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
        exact: false,
      });
      void queryClient.invalidateQueries({
        queryKey: REFERRAL_PROGRAM_QUERY_KEYS.detail(programId),
        exact: false,
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
