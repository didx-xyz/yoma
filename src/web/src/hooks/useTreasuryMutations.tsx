import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import type {
  PayoutTransactionAdminInfo,
  PayoutTransactionSearchFilter,
  PayoutTransactionSearchResults,
} from "~/api/models/payout";
import type {
  TreasuryInfo,
  TreasuryRequestUpdate,
} from "~/api/models/treasury";
import {
  getPayoutTransaction,
  getTreasury,
  searchPayoutTransactions,
  updateTreasury,
} from "~/api/services/treasury";

export const TREASURY_QUERY_KEYS = {
  /** The single Treasury record (Admin role) */
  detail: () => ["Admin", "Treasury"] as const,
  /** Payout audit search, keyed by the filter that produced it */
  payoutTransactions: (filterKey: string) =>
    ["Admin", "Treasury", "PayoutTransactions", filterKey] as const,
  /** One payout with its user and reward transaction */
  payoutTransaction: (id: string) =>
    ["Admin", "Treasury", "PayoutTransaction", id] as const,
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
 * `POST /treasury/payout/transaction/search`. Admin role.
 *
 * `keepPreviousData` so paging dims the current rows rather than collapsing the list — the shared
 * `ListPageResults` / `ListPagePagination` pair is built around that.
 *
 * Not cached aggressively on purpose: payout statuses move under the admin (webhooks, and the
 * five-minute reconciler), so a stale list on a financial surface is worse than a refetch.
 */
export function usePayoutTransactionSearchQuery(
  filter: PayoutTransactionSearchFilter,
  filterKey: string,
  options?: { enabled?: boolean },
) {
  return useQuery<PayoutTransactionSearchResults>({
    queryKey: TREASURY_QUERY_KEYS.payoutTransactions(filterKey),
    queryFn: () => searchPayoutTransactions(filter),
    placeholderData: keepPreviousData,
    enabled: options?.enabled ?? true,
  });
}

/** `GET /treasury/payout/transaction/{id}`. Admin role; fetched when a row is opened. */
export function usePayoutTransactionQuery(
  id: string | null,
  options?: { enabled?: boolean },
) {
  return useQuery<PayoutTransactionAdminInfo>({
    queryKey: TREASURY_QUERY_KEYS.payoutTransaction(id ?? ""),
    queryFn: () => getPayoutTransaction(id!),
    enabled: !!id && (options?.enabled ?? true),
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
