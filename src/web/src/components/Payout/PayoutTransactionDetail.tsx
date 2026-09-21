import {
  PayoutType,
  type PayoutTransactionAdminInfo,
} from "~/api/models/payout";
import FormMessage, { FormMessageType } from "~/components/Common/FormMessage";
import PayoutStatusBadge from "~/components/Payout/PayoutStatusBadge";
import { RewardStat, RewardStatGroup } from "~/components/Rewards/RewardStat";
import { EMPTY_VALUE, formatUsd, formatZlto } from "~/lib/format/rewards";
import {
  formatPayoutTimestamp,
  PAYOUT_STATUS_META,
  PAYOUT_TYPE_META,
  payoutTypeLabel,
  REWARD_TRANSACTION_STATUS_META,
  rewardTransactionStatusLabel,
} from "~/lib/payout/adminTransactions";

/**
 * Everything Yoma has recorded about one payout: the audit record, the youth it belongs to, and
 * the ZLTO reservation that funded it (`GET /treasury/payout/transaction/{id}`).
 *
 * **Query-only.** There is no action here and none is planned — the reconciler and the provider
 * webhooks own every state change, so an admin's job on this screen is to read what happened, not
 * to intervene.
 *
 * ⚠️ **The two amounts are in different units and both are called "amount".** The payout is USD;
 * the reward transaction is the ZLTO that was reserved. They are in separate, explicitly-labelled
 * groups for that reason — never put them in the same row.
 *
 * Prop-driven: the caller fetches, this renders.
 */
const MONO = "font-mono text-xs break-all";

export const PayoutTransactionDetail: React.FC<{
  info: PayoutTransactionAdminInfo;
}> = ({ info }) => {
  const { transaction, user, rewardTransaction } = info;
  const statusMeta = PAYOUT_STATUS_META[transaction.status];
  const typeMeta = PAYOUT_TYPE_META[transaction.type];
  const rewardStatusMeta = rewardTransaction
    ? REWARD_TRANSACTION_STATUS_META[rewardTransaction.status]
    : null;

  return (
    <div className="flex flex-col gap-4">
      {/* WHAT STATE IS IT IN — and what that means for the money */}
      <div className="border-gray-light flex flex-col gap-2 rounded-lg border bg-white p-4">
        <div className="flex flex-row flex-wrap items-center gap-2">
          <PayoutStatusBadge status={transaction.status} />
          <span className="text-lg font-bold">
            {formatUsd(transaction.amount)}
          </span>
          <span className="text-gray-dark text-xs">
            {transaction.currency} · {payoutTypeLabel(transaction.type)}
          </span>
        </div>
        <p className="text-gray-dark text-sm">{statusMeta?.description}</p>
        {!!typeMeta && (
          <p className="text-xs text-gray-500 italic">{typeMeta.description}</p>
        )}
      </div>

      {/* The provider's own words for a failure. Shown verbatim: paraphrasing an error is how a
          support answer ends up describing a different fault than the one recorded. */}
      {!!transaction.errorReason && (
        <FormMessage messageType={FormMessageType.Warning}>
          <span className="flex flex-col gap-1">
            <span className="font-semibold">Recorded failure reason</span>
            <span className="text-xs break-words">
              {transaction.errorReason}
            </span>
          </span>
        </FormMessage>
      )}

      {/* THE PAYOUT — USD, and the provider lifecycle */}
      <RewardStatGroup title="Payout (USD)" columns={3}>
        <RewardStat
          label="Amount"
          value={formatUsd(transaction.amount)}
          tone="prominent"
        />
        <RewardStat
          label="Initiated"
          value={formatPayoutTimestamp(transaction.dateCreated)}
          tooltip="When the payout was created in Yoma. Not when it was confirmed or paid."
        />
        <RewardStat
          label="Last updated"
          value={formatPayoutTimestamp(transaction.dateModified)}
        />
        <RewardStat
          label="Last reconciled"
          value={formatPayoutTimestamp(transaction.dateLastReconciled)}
          tooltip="The most recent deliberate status check, including checks that changed nothing."
        />
        <RewardStat
          label="Reconciliation retries"
          value={transaction.retryCount ?? EMPTY_VALUE}
        />
        <RewardStat
          label="Hosted session expires"
          value={formatPayoutTimestamp(transaction.expiresAt)}
          tooltip="Expiry of the hosted session the youth completes the cash out in (~30 minutes). An expired session does not expire the payout — a fresh one can be issued while it is active."
        />
        <RewardStat
          label="Provider reference"
          value={
            transaction.transactionId ? (
              <span className={MONO}>{transaction.transactionId}</span>
            ) : (
              EMPTY_VALUE
            )
          }
          note={
            transaction.transactionId
              ? undefined
              : "Not assigned — the payout was never accepted"
          }
        />
        <RewardStat
          label="Payout id"
          value={<span className={MONO}>{transaction.id}</span>}
          note="Yoma's own id, and the idempotency key on the provider side"
        />
        <RewardStat
          label="Reservation expiry (safety net)"
          value={formatPayoutTimestamp(transaction.rewardReservationExpiresAt)}
          tooltip="When the ZLTO reservation lapses if nothing else has released or committed it. Webhooks and the five-minute reconciler are the normal triggers; this is the last resort."
        />
      </RewardStatGroup>

      {/* WHO. Four stats, two columns — the username is deliberately not a fifth: it is the
          email or the phone number, both of which are already here. */}
      <RewardStatGroup title="Youth" columns={2}>
        <RewardStat
          label="Name"
          value={user.displayName || transaction.userDisplayName || EMPTY_VALUE}
        />
        <RewardStat label="Email" value={user.email || EMPTY_VALUE} />
        <RewardStat label="Phone" value={user.phoneNumber || EMPTY_VALUE} />
        <RewardStat
          label="User id"
          value={<span className={MONO}>{transaction.userId}</span>}
        />
      </RewardStatGroup>

      {/* THE ZLTO SIDE — a different transaction, a different unit, a different lifecycle */}
      {rewardTransaction ? (
        <RewardStatGroup
          title="ZLTO funding (reward transaction)"
          columns={3}
          action={
            <span className="text-[11px] text-gray-500">
              {rewardTransactionStatusLabel(rewardTransaction.status)}
            </span>
          }
        >
          <RewardStat
            label="ZLTO reserved"
            value={formatZlto(rewardTransaction.amount)}
            tone="prominent"
            note={rewardStatusMeta?.description}
          />
          <RewardStat
            label="Reservation expires"
            value={formatPayoutTimestamp(
              rewardTransaction.reservationExpiresAt,
            )}
          />
          <RewardStat
            label="Recorded"
            value={formatPayoutTimestamp(rewardTransaction.dateCreated)}
          />
          <RewardStat
            label="Last updated"
            value={formatPayoutTimestamp(rewardTransaction.dateModified)}
          />
          <RewardStat
            label="Reservation reference"
            value={
              rewardTransaction.transactionId ? (
                <span className={MONO}>{rewardTransaction.transactionId}</span>
              ) : (
                EMPTY_VALUE
              )
            }
            note="Issued by the reward provider, not the payout provider"
          />
          <RewardStat
            label="Failure reason"
            value={
              rewardTransaction.errorReason ? (
                <span className="text-xs break-words">
                  {rewardTransaction.errorReason}
                </span>
              ) : (
                EMPTY_VALUE
              )
            }
          />
        </RewardStatGroup>
      ) : (
        /* An absence worth showing: for a ZLTO cash out it means the reservation could not be
           recorded, which is exactly the kind of thing this surface exists to surface. */
        <FormMessage messageType={FormMessageType.Info}>
          No ZLTO reservation is linked to this payout.{" "}
          {transaction.type === PayoutType.PayoutRewards
            ? "For a ZLTO cash out that is unexpected — the reservation failed or could not be recorded."
            : "Expected for a direct payout, which has no ZLTO behind it."}
        </FormMessage>
      )}
    </div>
  );
};

export default PayoutTransactionDetail;
