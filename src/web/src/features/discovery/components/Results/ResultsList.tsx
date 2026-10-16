import React from "react";
import type { OpportunityInfo } from "~/api/models/opportunity";
import { IncentiveDivider } from "./IncentiveDivider";
import { LIST_COLUMNS } from "./listColumns";
import { OpportunityRow } from "./OpportunityRow";

/**
 * Compact-list rendering of the same unchanged result set — `<OpportunityRow>` per item under a
 * desktop column-header row that shares `LIST_COLUMNS` with the row bodies (round 7 columns,
 * 2026-09-30). The mobile "compact list" explainer line was removed on 2026-10-01 (Jason). Under
 * a Paid filter the incentive divider is a full-width row, outside the columns, before item
 * `incentiveSplitAt`.
 */
export const ResultsList: React.FC<{
  items: OpportunityInfo[];
  now: Date;
  incentiveSplitAt?: number | null;
}> = ({ items, now, incentiveSplitAt = null }) => (
  <div className="flex flex-col gap-2">
    <div className="text-gray-dark hidden items-center gap-3 px-3 text-[10px] font-bold tracking-wide uppercase md:flex">
      <span className={LIST_COLUMNS.tile} />
      <span className={LIST_COLUMNS.badge}>Type</span>
      <span className={LIST_COLUMNS.title}>Opportunity</span>
      <span className={LIST_COLUMNS.money}>Money</span>
      <span className={LIST_COLUMNS.where}>Where</span>
      <span className={LIST_COLUMNS.fact}>Key fact</span>
      <span className={LIST_COLUMNS.status}>Status</span>
      <span className={LIST_COLUMNS.places}>Places</span>
      <span className={LIST_COLUMNS.action} />
    </div>
    {items.map((item, index) => (
      <React.Fragment key={item.id}>
        {index === incentiveSplitAt && <IncentiveDivider />}
        <OpportunityRow opportunity={item} now={now} />
      </React.Fragment>
    ))}
  </div>
);
