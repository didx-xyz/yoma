import React from "react";
import type { OpportunityInfo } from "~/api/models/opportunity";
import { OpportunityCard } from "./OpportunityCard";

/** Grid rendering of an unchanged result set — `<OpportunityCard>` per item, 4-across on lg. */
export const ResultsGrid: React.FC<{
  items: OpportunityInfo[];
  now: Date;
}> = ({ items, now }) => (
  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
    {items.map((item) => (
      <OpportunityCard key={item.id} opportunity={item} now={now} />
    ))}
  </div>
);
