import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  TreasuryInfo,
  TreasuryRequestUpdate,
} from "~/api/models/treasury";
import { getTreasury, updateTreasury } from "~/api/services/treasury";

export const TREASURY_QUERY_KEYS = {
  /** The single Treasury record (Admin role) */
  detail: () => ["Admin", "Treasury"] as const,
} as const;

/** `GET /treasury`. Admin role — gate the caller, or this 403s. */
export function useTreasuryQuery(options?: { enabled?: boolean }) {
  return useQuery<TreasuryInfo>({
    queryKey: TREASURY_QUERY_KEYS.detail(),
    queryFn: () => getTreasury(),
    enabled: options?.enabled ?? true,
  });
}

/**
 * `PATCH /treasury`.
 *
 * The PATCH returns the updated Treasury, so the cache is seeded from the response — the overview
 * then shows a financial-year reset the moment it happens, with no reload and no refetch race.
 *
 * When the financial year did move forward, every organisation's current-financial-year cumulative
 * was reset too (`ResetCurrentFinancialYear`), which invalidates cached organisation, opportunity and
 * referral figures across the whole app. There is no way to enumerate those keys from here, so the
 * whole cache is invalidated — rare, deliberate, and cheaper than showing stale reward figures on a
 * financial surface.
 *
 * Errors are intentionally NOT toasted here: `PATCH /treasury` failures are mapped onto their form
 * fields by the caller (see `lib/treasury/serverErrors.ts`).
 */
export function useTreasuryUpdateMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: TreasuryRequestUpdate) => updateTreasury(request),
    onSuccess: (data) => {
      const previous = queryClient.getQueryData<TreasuryInfo>(
        TREASURY_QUERY_KEYS.detail(),
      );
      const rolledOver =
        !!previous &&
        previous.financialYearStartDate !== data.financialYearStartDate;

      queryClient.setQueryData(TREASURY_QUERY_KEYS.detail(), data);

      if (rolledOver) void queryClient.invalidateQueries();
    },
  });
}
