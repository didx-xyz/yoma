import React from "react";
import { Message } from "../shared/Message";
import type { OpportunityInfo } from "~/api/models/opportunity";
import { LIST_COLUMNS } from "./listColumns";
import { OpportunityRow } from "./OpportunityRow";

/**
 * Compact-list rendering of the same unchanged result set — `<OpportunityRow>` per item under a
 * desktop column-header row that shares `LIST_COLUMNS` with the row bodies. Mobile carries the
 * one in-product line explaining that images and summaries are hidden in this view.
 */
export const ResultsList: React.FC<{
  items: OpportunityInfo[];
  now: Date;
}> = ({ items, now }) => (
  <div className="flex flex-col gap-2">
    <Message className="md:hidden">
      Compact list. Values line up so you can compare. Images and summaries are
      hidden — tap through for those.
    </Message>
    <div className="text-gray-dark hidden items-center gap-3 px-3 text-[10px] font-bold tracking-wide uppercase md:flex">
      <span className={LIST_COLUMNS.tile} />
      <span className={LIST_COLUMNS.badge}>Type</span>
      <span className={LIST_COLUMNS.title}>Opportunity</span>
      <span className={LIST_COLUMNS.commitment}>Commitment</span>
      <span className={LIST_COLUMNS.pay}>Pay</span>
      <span className={LIST_COLUMNS.closes}>Closes</span>
      <span className={LIST_COLUMNS.reward}>Reward</span>
      <span className="w-4" />
    </div>
    {items.map((item) => (
      <OpportunityRow key={item.id} opportunity={item} now={now} />
    ))}
  </div>
);
