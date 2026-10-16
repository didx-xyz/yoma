import React from "react";
import type { OpportunityInfo } from "~/api/models/opportunity";
import { IncentiveDivider } from "./IncentiveDivider";
import { OpportunityCard } from "./OpportunityCard";

/**
 * Grid rendering of an unchanged result set — `<OpportunityCard>` per item, 4-across on lg. Under
 * a Paid filter the incentive divider spans every column before item `incentiveSplitAt`.
 */
export const ResultsGrid: React.FC<{
  items: OpportunityInfo[];
  now: Date;
  incentiveSplitAt?: number | null;
}> = ({ items, now, incentiveSplitAt = null }) => (
  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
