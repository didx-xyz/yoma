import { useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  OrganizationRewardPools,
  OrganizationSearchFilter,
  OrganizationSearchResults,
} from "~/api/models/organisation";
import {
  getOrganisations,
  patchOrganisationRewardPool,
} from "~/api/services/organisations";

export const ORGANIZATION_REWARD_QUERY_KEYS = {
  /** A single organisation — the key the org edit/info pages already use. */
  detail: (id: string) => ["organisation", id] as const,
  /** Every organisation search result page (the admin list, and the Treasury Organisations tab). */
  listAll: () => ["Organisations"] as const,
  list: (keyParts: string) => ["Organisations", keyParts] as const,
  listCountAll: () => ["Organisations_TotalCount"] as const,
} as const;

/** `POST /organization/search` — returns `OrganizationInfoAdmin[]`, reward figures included. */
export function organizationSearchQueryOptions(
  filter: OrganizationSearchFilter,
  keyParts: string,
) {
  return {
    queryKey: ORGANIZATION_REWARD_QUERY_KEYS.list(keyParts),
    queryFn: () => getOrganisations(filter),
  } satisfies {
    queryKey: readonly unknown[];
    queryFn: () => Promise<OrganizationSearchResults>;
  };
}

/**
 * Saves an organisation's reward pool via `PATCH /organization/{id}/rewardpool`.
 *
 * The endpoint is pool-only: the body is exactly `{ zltoRewardPoolCurrentFinancialYear }` and the
 * server leaves administrators and every other organisation field untouched, so a save from a stale
 * page cannot overwrite them. `null` removes the organisation-level cap (awards are then limited only
 * by the Treasury pool); it does not disable awards. The response is the full updated `Organization`.
 *
 * Global **Admin only** (`[Authorize(Roles = Admin)]` on `OrganizationController.UpdateRewardPool`);
 * anyone else is rejected with 401 or 403.
 *
 * Errors are deliberately not toasted here — callers map them onto their fields
 * (`lib/organisation/serverErrors.ts`).
 */
export function useOrganizationRewardPoolsMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      organizationId,
      pools,
    }: {
      organizationId: string;
      pools: OrganizationRewardPools;
    }) => patchOrganisationRewardPool(organizationId, pools),
    onSuccess: (updated) => {
      // The PATCH returns the updated organisation, so seed it: the figures (including the derived
      // balances) are then current without waiting for a refetch.
      queryClient.setQueryData(
        ORGANIZATION_REWARD_QUERY_KEYS.detail(updated.id),
        updated,
      );

      void queryClient.invalidateQueries({
        queryKey: ORGANIZATION_REWARD_QUERY_KEYS.detail(updated.id),
      });
      void queryClient.invalidateQueries({
        queryKey: ORGANIZATION_REWARD_QUERY_KEYS.listAll(),
      });
      void queryClient.invalidateQueries({
        queryKey: ORGANIZATION_REWARD_QUERY_KEYS.listCountAll(),
      });
    },
  });
}
