import { useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  Organization,
  OrganizationRewardPools,
  OrganizationSearchFilter,
  OrganizationSearchResults,
} from "~/api/models/organisation";
import {
  getOrganisations,
  patchOrganisation,
} from "~/api/services/organisations";
import { organizationRewardPoolsRequest } from "~/lib/organisation/organizationRequest";

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
 * Saves an organisation's reward pools.
 *
 * ⚠️ `PATCH /organization` is a full replacement — there is no pool-only endpoint. The payload is
 * therefore rebuilt from the organisation by `organizationRewardPoolsRequest`, which is the single
 * place that mapping lives so the organisation edit page and the Treasury Organisations tab send
 * identical bodies. Pass the freshly fetched `Organization`, never a stale form model.
 *
 * Reward-pool changes are Admin-only server-side (`OrganizationService.cs:460-463`); a non-admin gets
 * a `SecurityException` → **401**.
 *
 * Errors are deliberately not toasted here — callers map them onto their fields
 * (`lib/organisation/serverErrors.ts`).
 */
export function useOrganizationRewardPoolsMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      organization,
      pools,
    }: {
      organization: Organization;
      pools: OrganizationRewardPools;
    }) =>
      patchOrganisation(organizationRewardPoolsRequest(organization, pools)),
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
