import { useCallback, useMemo, useRef, useState } from "react";
import { IoMdClose } from "react-icons/io";
import type { PayoutTransaction } from "~/api/models/payout";
import { BTN_SECONDARY } from "~/components/Common/buttonStyles";
import CustomModal from "~/components/Common/CustomModal";
import FilterBadges from "~/components/FilterBadges";
import { ListPagePagination } from "~/components/Common/ListPage/ListPageResults";
import { ListPageSearchToolbar } from "~/components/Common/ListPage/ListPageSearchToolbar";
import {
  MODAL_ACTION_WIDTH,
  ModalActions,
  ModalBody,
  ModalHeader,
} from "~/components/Common/ModalChrome";
import NoRowsMessage from "~/components/NoRowsMessage";
import PayoutTransactionDetail from "~/components/Payout/PayoutTransactionDetail";
import PayoutTransactionFilterVertical from "~/components/Payout/PayoutTransactionFilterVertical";
import PayoutTransactionSummaryRow from "~/components/Payout/PayoutTransactionSummaryRow";
import { ApiErrors } from "~/components/Status/ApiErrors";
import { LoadingSkeleton } from "~/components/Status/LoadingSkeleton";
import {
  usePayoutTransactionQuery,
  usePayoutTransactionSearchQuery,
} from "~/hooks/useTreasuryMutations";
import { PAGE_SIZE } from "~/lib/constants";
import {
  countAppliedPayoutFilters,
  EMPTY_PAYOUT_FILTER,
  PAYOUT_STATUS_META,
  PAYOUT_TYPE_META,
  payoutFilterCacheKey,
  toPayoutTransactionSearchFilter,
  type PayoutTransactionDisplayFilter,
} from "~/lib/payout/adminTransactions";

/**
 * Treasury → Payouts: every payout Yoma has recorded, searchable, with the full audit record
 * behind each row.
 *
 * **Query-only, deliberately** (API handoff 2026-08-27). The endpoints are a lookup and a
 * paginated search; there is no retry, cancel or re-reconcile, and none is planned — the
 * five-minute reconciler and the provider webhooks own every state change. Do not add an action
 * here without an API contract for it.
 *
 * NB: search, filters and paging are component state rather than querystring params — the same
 * choice, for the same reason, as the Organisations and Opportunities tabs: `?tab=` already owns
 * this url and a tab panel does not need its own shareable filter state. The shared search,
 * filter-dialog, badge and pagination *components* are still used, so it behaves like the admin
 * list pages. If sharing a link to a specific payout is ever wanted, that is when this moves onto
 * the querystring.
 */

/**
 * Nothing is excluded from the badges: every key on the display filter is an applied filter,
 * including the toolbar's search term — which is how the admin list pages do it, and it keeps the
 * "Filters (n)" count and the badges showing the same thing. Paging and the tab are not on this
 * filter at all, so there is nothing to exclude.
 */
const BADGE_EXCLUDE_KEYS: string[] = [];

export const TreasuryPayoutsTab: React.FC = () => {
  const filterPortalRef = useRef<HTMLDivElement>(null);
  const [filterDialogVisible, setFilterDialogVisible] = useState(false);
  const [pageNumber, setPageNumber] = useState(1);
  const [filter, setFilter] =
    useState<PayoutTransactionDisplayFilter>(EMPTY_PAYOUT_FILTER);
  const [selected, setSelected] = useState<PayoutTransaction | null>(null);

  const apiFilter = useMemo(
    () => toPayoutTransactionSearchFilter(filter, pageNumber, PAGE_SIZE),
    [filter, pageNumber],
  );

  const {
    data: results,
    isLoading,
    error: queryError,
    isPlaceholderData: isShowingPreviousResults,
  } = usePayoutTransactionSearchQuery(
    apiFilter,
    payoutFilterCacheKey(filter, pageNumber),
  );

  /** The row's own data is the list projection; the detail endpoint adds the user and the ZLTO side. */
  const {
    data: detail,
    isLoading: isLoadingDetail,
    error: detailError,
  } = usePayoutTransactionQuery(selected?.id ?? null);

  const applyFilter = useCallback((updated: PayoutTransactionDisplayFilter) => {
    // FilterBadges' "Clear All" submits `{}`, so fill the gaps rather than trusting the shape.
    setFilter({ ...EMPTY_PAYOUT_FILTER, ...updated });
    setPageNumber(1);
    setFilterDialogVisible(false);
  }, []);

  const onSearch = useCallback((query: string) => {
    setFilter((current) => ({ ...current, valueContains: query || null }));
    setPageNumber(1);
  }, []);

  const appliedFilterCount = useMemo(
    () => countAppliedPayoutFilters(filter),
    [filter],
  );

  /** True once anything at all has been applied — it changes what "no rows" means. */
  const isSearchPerformed = appliedFilterCount > 0;

  const items: PayoutTransaction[] = results?.items ?? [];

  return (
    <div className="flex flex-col gap-4">
      {/* the react-select menus inside the dialog portal into this */}
      <div ref={filterPortalRef} />

      <div className="shadow-custom flex flex-col gap-1 rounded-lg bg-white p-4">
        <h5 className="font-bold tracking-wider">Payouts</h5>
        <p className="text-gray-dark text-sm">
          Every payout Yoma has recorded, newest first. Amounts are the settled
          USD value; the ZLTO reserved to fund a payout is on its record. This
          is a read-only audit view — payouts cannot be started, retried or
          cancelled from here.
        </p>
      </div>

      <ListPageSearchToolbar
        defaultValue={filter.valueContains}
        placeholder="Search by name, email, phone or reference..."
        onSearch={onSearch}
        openFilter={setFilterDialogVisible}
        appliedFilterCount={appliedFilterCount}
      />

      {/* APPLIED FILTER BADGES — `FilterBadges` directly rather than `ListPageFilterBadges`,
          which exists to read a querystring spec this tab does not have */}
      {appliedFilterCount > 0 && (
        <FilterBadges
          searchFilter={filter}
          excludeKeys={BADGE_EXCLUDE_KEYS}
          className="-ml-2"
          onSubmit={(updated) =>
            applyFilter(updated as PayoutTransactionDisplayFilter)
          }
          resolveValue={(key, value) => {
            switch (key) {
              case "statuses":
                return PAYOUT_STATUS_META[
                  value as keyof typeof PAYOUT_STATUS_META
                ]?.label;
              case "types":
                return PAYOUT_TYPE_META[value as keyof typeof PAYOUT_TYPE_META]
                  ?.label;
              case "amountFrom":
                return `From $${value as string}`;
              case "amountTo":
                return `To $${value as string}`;
              case "dateStart":
                return `From ${value as string}`;
              case "dateEnd":
                return `To ${value as string}`;
              default:
                return value;
            }
          }}
        />
      )}

      {/* ERROR */}
      {!!queryError && (
        <div className="shadow-custom flex flex-col items-center rounded-lg bg-white p-8">
          <ApiErrors error={queryError} />
        </div>
      )}

      {/* LOADING — first load only; paging dims the rows instead */}
      {isLoading && !queryError && (
        <div className="flex h-fit flex-col items-center rounded-lg bg-white p-8">
          <LoadingSkeleton rows={3} />
        </div>
      )}

      {/* NO ROWS */}
      {!isLoading && !queryError && items.length === 0 && (
        <div className="flex h-fit flex-col items-center rounded-lg bg-white pb-8 md:pb-16">
          <NoRowsMessage
            title={"No payouts found"}
            description={
              isSearchPerformed
                ? "Please try refining your search."
                : "Payouts will show here once youth start cashing out."
            }
          />
        </div>
      )}

      {/* RESULTS */}
      {!isLoading && !queryError && items.length > 0 && (
        <div
          className={`flex flex-col gap-3 transition-opacity ${isShowingPreviousResults ? "opacity-50" : ""}`}
        >
          {items.map((transaction) => (
            <PayoutTransactionSummaryRow
              key={transaction.id}
              transaction={transaction}
              action={
                <button
                  type="button"
                  className={`${BTN_SECONDARY} !min-w-0 !px-3`}
                  onClick={() => setSelected(transaction)}
                >
                  View
                </button>
              }
            />
          ))}

          <ListPagePagination
            currentPage={pageNumber}
            totalItems={results?.totalCount ?? 0}
            pageSize={PAGE_SIZE}
            onClick={(page) => setPageNumber(page)}
            isShowingPreviousResults={isShowingPreviousResults}
          />
        </div>
      )}

      {/* FILTER DIALOG */}
      <CustomModal
        isOpen={filterDialogVisible}
        shouldCloseOnOverlayClick={true}
        onRequestClose={() => setFilterDialogVisible(false)}
        className="md:max-h-[520px] md:w-[600px]"
      >
        {!!filterPortalRef.current && (
          <div className="flex h-full flex-col gap-2 overflow-y-auto">
            <PayoutTransactionFilterVertical
              htmlRef={filterPortalRef.current}
              searchFilter={filter}
              onSubmit={applyFilter}
              onCancel={() => setFilterDialogVisible(false)}
            />
          </div>
        )}
      </CustomModal>

      {/* DETAIL DIALOG */}
      <CustomModal
        isOpen={!!selected}
        shouldCloseOnOverlayClick={true}
        onRequestClose={() => setSelected(null)}
        className="md:max-h-[90vh] md:max-w-[820px]"
      >
        <div className="flex h-full flex-col overflow-y-auto">
          {/* the row already identifies the youth — keep saying so while the detail loads */}
          <ModalHeader
            title={selected?.userDisplayName || selected?.username || "Payout"}
            onClose={() => setSelected(null)}
          />

          <ModalBody className="items-stretch bg-white">
            {isLoadingDetail && <LoadingSkeleton rows={3} />}

            {!!detailError && <ApiErrors error={detailError} />}

            {!!detail && <PayoutTransactionDetail info={detail} />}
          </ModalBody>

          {/* Dismiss only — there is nothing to apply on a read-only record. Same
              button as the filter popup's Close, so the two dialogs end the same way. */}
          <ModalActions>
            <button
              type="button"
              className={`${BTN_SECONDARY} ${MODAL_ACTION_WIDTH}`}
              onClick={() => setSelected(null)}
            >
              <IoMdClose className="h-5 w-5" />
              Close
            </button>
          </ModalActions>
        </div>
      </CustomModal>
    </div>
  );
};

export default TreasuryPayoutsTab;
