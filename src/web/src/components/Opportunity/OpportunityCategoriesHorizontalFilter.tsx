import React from "react";
import type { OpportunityCategory } from "~/api/models/opportunity";
import CustomSlider from "../Carousel/CustomSlider";
import { OpportunityCategoryHorizontalCard } from "./OpportunityCategoryHorizontalCard";

const OpportunityCategoriesHorizontalFilter: React.FC<{
  lookups_categories: OpportunityCategory[];
  selected_categories: string[] | null | undefined;
  onClick?: (item: OpportunityCategory) => void;
}> = ({ lookups_categories, selected_categories, onClick }) => {
  return (
    <CustomSlider>
      {lookups_categories.map((category, index) => (
        <OpportunityCategoryHorizontalCard
          key={category.id}
          data={category}
          selected={selected_categories?.includes(category.id) ?? false}
          onClick={onClick}
        />
      ))}
    </CustomSlider>
  );
};

export default OpportunityCategoriesHorizontalFilter;
