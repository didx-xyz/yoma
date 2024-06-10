import React from "react";
import type { OpportunityCategory } from "~/api/models/opportunity";
import { OpportunityCategoryHorizontalCard } from "./OpportunityCategoryHorizontalCard";

const OpportunityCategoriesHorizontalFilter: React.FC<{
  lookups_categories: OpportunityCategory[];
  selected_categories: string[] | null | undefined;
  onClick?: (item: OpportunityCategory) => void;
}> = ({ lookups_categories, selected_categories, onClick }) => {
  return (
    <div className="flex justify-center gap-4 md:w-full">
      {lookups_categories.map((item) => (
        <OpportunityCategoryHorizontalCard
          key={`categories_${item.id}`}
          data={item}
          selected={selected_categories?.includes(item.name)}
          onClick={onClick}
        />
      ))}
    </div>
  );
};

export default OpportunityCategoriesHorizontalFilter;
