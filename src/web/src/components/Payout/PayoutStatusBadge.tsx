import type { PayoutTransactionStatus } from "~/api/models/payout";
import {
  PAYOUT_STATUS_META,
  payoutStatusBadgeClasses,
} from "~/lib/payout/adminTransactions";

/**
 * A payout's recorded status, as one pill. The admin's view of it — the real status name, not the
 * youth flow's softened "in progress" (see `lib/payout/adminTransactions.ts` for why the two
 * vocabularies are separate).
 *
 * Shared by the summary row and the detail dialog so a status can never read one way in a list and
 * another way when opened. Prop-driven: no router, no query.
 */
export const PayoutStatusBadge: React.FC<{
  status: PayoutTransactionStatus;
  className?: string;
}> = ({ status, className = "" }) => {
  const meta = PAYOUT_STATUS_META[status];

  return (
    <span
      className={`badge badge-sm !text-[11px] font-medium whitespace-nowrap ${payoutStatusBadgeClasses(
        meta?.tone ?? "closed",
      )} ${className}`}
    >
      {meta?.label ?? status}
    </span>
  );
};

export default PayoutStatusBadge;
