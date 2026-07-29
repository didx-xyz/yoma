import type {
  CustomFieldDefinition,
  CustomFieldFilter,
  OpportunitySearchFilterAdmin,
} from "~/api/models/opportunity";
import FilterBadges from "~/components/FilterBadges";
import { utcToDateInput } from "~/lib/utils";
import { useCustomFieldFilterLabeler } from "../CustomFieldFilters";
import { OPPORTUNITY_ADMIN_BADGE_EXCLUDE_KEYS } from "./opportunityAdminFilter";

/**
 * Applied-filter badges for the admin opportunity search pages. Values in the display
 * filter are already human-readable (names), so only dates, the search term and the
 * custom-field clauses need resolving.
 */
export const OpportunityAdminFilterBadges: React.FC<{
  searchFilter: OpportunitySearchFilterAdmin;
  lookups_customFieldDefinitions?: CustomFieldDefinition[];
  onSubmit: (filter: OpportunitySearchFilterAdmin) => void;
  className?: string;
}> = ({
  searchFilter,
  lookups_customFieldDefinitions,
  onSubmit,
  className,
}) => {
  // resolves a custom-field clause to its display value (option / lookup names)
  const describeCustomFieldFilter = useCustomFieldFilterLabeler(
    lookups_customFieldDefinitions,
  );

  return (
    <FilterBadges
      searchFilter={searchFilter}
      excludeKeys={OPPORTUNITY_ADMIN_BADGE_EXCLUDE_KEYS}
      className={className}
      resolveValue={(key, value) => {
        if (key === "startDate")
          return `From ${utcToDateInput(value as string) || value}`;
        if (key === "endDate")
          return `To ${utcToDateInput(value as string) || value}`;
        if (key === "customFields")
          // one badge per clause, showing its value(s) only
          return describeCustomFieldFilter(value as CustomFieldFilter);
        return value;
      }}
      onSubmit={(filter) => onSubmit(filter as OpportunitySearchFilterAdmin)}
    />
  );
};

export default OpportunityAdminFilterBadges;
