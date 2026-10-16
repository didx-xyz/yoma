import Image from "next/image";
import iconZlto from "public/images/icon-zlto.svg";
import React from "react";
import { formatNumber } from "../../lib/format";
import type { MoneyFacts } from "../../lib/money";
import { resolveMoneyBadge } from "../../lib/money";

/**
 * The card/row money slot. Renders exactly what `resolveMoneyBadge` decides — the precedence
 * lives there, nowhere else. ZLTO keeps its own pill; a partner incentive is labelled
 * partner-paid so it never reads as a Yoma-backed payment.
 */
export const MoneyBadge: React.FC<{ facts: MoneyFacts; compact?: boolean }> = ({
  facts,
  compact = false,
}) => {
  const model = resolveMoneyBadge(facts);
  if (model.zlto === null && model.payLine === null) return null;

  return (
    <span
      className={`flex items-center gap-2 ${compact ? "text-xs" : "text-sm"}`}
    >
      {model.payLine && (
        <span className="text-purple font-semibold">
          {model.payLine}
          {model.partnerPaid && (
            <span className="text-gray-dark pl-1 font-normal">
              partner-paid
            </span>
          )}
        </span>
      )}
      {model.zlto !== null && (
        // The ZLTO icon and the reward's orange, as the rest of the app shows a ZLTO reward
        // (`ZltoRewardBadge`), rather than a "Z" on green (2026-10-07).
        <span
          title="ZLTO reward"
          className="bg-orange-light text-orange flex items-center gap-1 rounded-full py-0.5 pr-2 pl-1 font-bold"
        >
          <Image
            src={iconZlto}
            alt="ZLTO"
            width={14}
            height={14}
            className="h-3.5 w-3.5 shrink-0"
          />
          {formatNumber(model.zlto)}
        </span>
      )}
    </span>
  );
};
