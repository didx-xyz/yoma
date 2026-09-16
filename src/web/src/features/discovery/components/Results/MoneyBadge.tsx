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
        <span className="bg-green-light text-green rounded-full px-2 py-0.5 font-bold">
          Z {formatNumber(model.zlto)}
        </span>
      )}
    </span>
  );
};
