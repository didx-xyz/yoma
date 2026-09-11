import Image from "next/image";
import iconZltoColor from "public/images/icon-zlto-rounded-color.webp";
import type { ReactNode } from "react";
import { formatZlto } from "~/lib/format/rewards";

/**
 * The label/figure row the review step and the active-payout panel both use, so the same amount is
 * laid out and formatted identically before and after initiation. Figures are `tabular-nums` for
 * the same reason as the ledger: a column of proportional digits looks bent.
 */
export const CashOutSummaryRow: React.FC<{
  label: string;
  children: ReactNode;
  /** rows read as a list of facts, so only the ones after the first carry a rule */
  divided?: boolean;
}> = ({ label, children, divided = true }) => (
  <div
    className={`flex flex-row items-center justify-between gap-4 py-3 ${
      divided ? "border-gray border-t" : ""
    }`}
  >
    <span className="text-sm">{label}</span>
    <span className="flex flex-row items-center gap-2 text-sm font-bold tabular-nums">
      {children}
    </span>
  </div>
);

/** A ZLTO figure with its coin: the image is decorative, the unit is carried in text. */
export const CashOutZltoAmount: React.FC<{ amount: number | null }> = ({
  amount,
}) => (
  <>
    <Image src={iconZltoColor} alt="" width={16} className="h-auto" />
    {`${formatZlto(amount)} ZLTO`}
  </>
);
