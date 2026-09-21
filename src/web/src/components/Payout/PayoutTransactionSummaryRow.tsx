import type { ReactNode } from "react";
import type { PayoutTransaction } from "~/api/models/payout";
import PayoutStatusBadge from "~/components/Payout/PayoutStatusBadge";
import { RewardStat, RewardStatGroup } from "~/components/Rewards/RewardStat";
import { EMPTY_VALUE, formatUsd } from "~/lib/format/rewards";
import {
  formatPayoutDate,
  payoutTypeLabel,
} from "~/lib/payout/adminTransactions";

/**
 * One payout compressed to a row: who, how much, what state, when. The list counterpart to
 * `PayoutTransactionDetail`, built in the same task so the two can never disagree about a figure
 * or a label (epic rule).
 *
 * Prop-driven — no router, no session, no query — so it can be dropped onto a future user or
 * organisation surface unchanged.
 *
 * ⚠️ `amount` is **USD**. The ZLTO that funded it lives on the linked reward transaction and is
 * only available from the detail endpoint, so it is deliberately absent here rather than
 * reconstructed at today's rate.
 */
export const PayoutTransactionSummaryRow: React.FC<{
  transaction: PayoutTransaction;
  /** right-aligned on the row header — e.g. a "View" button */
  action?: ReactNode;
}> = ({ transaction, action }) => (
  <RewardStatGroup
    columns={3}
    title={
      <span className="flex min-w-0 flex-col">
        <span className="overflow-hidden text-sm text-ellipsis whitespace-nowrap">
          {transaction.userDisplayName || transaction.username || EMPTY_VALUE}
        </span>
        {/* the fallback chain can make these the same string; only show the second when it adds something */}
        {!!transaction.username &&
          transaction.username !== transaction.userDisplayName && (
            <span className="overflow-hidden text-[11px] font-normal text-ellipsis whitespace-nowrap text-gray-500">
              {transaction.username}
            </span>
          )}
      </span>
    }
    action={
      <div className="flex flex-row items-center gap-2">
        <PayoutStatusBadge status={transaction.status} />
        {action}
      </div>
    }
  >
    <RewardStat
      label="Amount (USD)"
      value={formatUsd(transaction.amount)}
      tone="prominent"
    />
    <RewardStat label="Type" value={payoutTypeLabel(transaction.type)} />
    {/* dateCreated is initiation time — never "paid at" */}
    <RewardStat
      label="Initiated"
      value={formatPayoutDate(transaction.dateCreated)}
    />
  </RewardStatGroup>
);

export default PayoutTransactionSummaryRow;
