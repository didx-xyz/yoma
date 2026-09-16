import type { LinkSearchFilter } from "~/api/models/actionLinks";
import type { SelectOption } from "~/api/models/lookups";
import ListPageFilterBadges from "~/components/Common/ListPage/ListPageFilterBadges";
import type { ListPageFilterSpec } from "~/components/Common/ListPage/listPageFilter";

/**
 * Applied-filter badges for the action-link list pages. Organisations are already names; the
 * opportunity filter is id-based (its picker is an async search), so those id's are resolved
 * to titles via `entityOptions`.
 */
export const LinkAdminFilterBadges: React.FC<{
  searchFilter: LinkSearchFilter;
  spec: ListPageFilterSpec;
  /** {id, title} for the applied opportunity id's */
  entityOptions?: SelectOption[];
  onSubmit: (filter: LinkSearchFilter) => void;
  className?: string;
}> = ({ searchFilter, spec, entityOptions, onSubmit, className }) => (
  <ListPageFilterBadges<LinkSearchFilter>
    searchFilter={searchFilter}
    spec={spec}
    className={className}
    resolveValue={(key, value) => {
      if (key === "entities")
        return (
          entityOptions?.find((option) => option.value === value)?.label ??
          value
        );
      return value;
    }}
    onSubmit={onSubmit}
  />
);

export default LinkAdminFilterBadges;
