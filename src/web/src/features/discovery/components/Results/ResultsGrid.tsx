import React from "react";
import type { OpportunityInfo } from "~/api/models/opportunity";
import { CARD_GRID_CLASS } from "~/lib/card";
import { IncentiveDivider } from "./IncentiveDivider";
import { OpportunityCard } from "./OpportunityCard";

/**
 * Grid rendering of an unchanged result set — `<OpportunityCard>` per item, in the shared card
 * grid (`CARD_GRID_CLASS`, 2026-10-20). Under a Paid filter the incentive divider spans every
 * column before item `incentiveSplitAt`.
 */
export const ResultsGrid: React.FC<{
  items: OpportunityInfo[];
  now: Date;
  incentiveSplitAt?: number | null;
}> = ({ items, now, incentiveSplitAt = null }) => (
  <div className={CARD_GRID_CLASS}>
    {items.map((item, index) => (
      <React.Fragment key={item.id}>
        {index === incentiveSplitAt && (
          <IncentiveDivider className="col-span-full" />
        )}
        <OpportunityCard opportunity={item} now={now} />
      </React.Fragment>
    ))}
  </div>
);
