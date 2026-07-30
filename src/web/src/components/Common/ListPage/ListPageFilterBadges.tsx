import FilterBadges from "~/components/FilterBadges";
import type { ListPageFilterSpec } from "~/components/Common/ListPage/listPageFilter";

/**
 * Applied-filter badges for the admin list pages. Click a badge to drop that value, or
 * "Clear All" to drop the lot; the status tab and paging are excluded via the spec.
 *
 * Values in the display filter are usually already human-readable (names), so
 * `resolveValue` is only needed for the ones that are not — dates, and any filter that
 * stays id-based because it is backed by an async search.
 */
export function ListPageFilterBadges<T extends object>({
  searchFilter,
  spec,
  resolveValue,
  onSubmit,
  className,
}: {
  searchFilter: T;
  spec: ListPageFilterSpec;
  resolveValue?: (key: string, value: unknown) => unknown;
  onSubmit: (filter: T) => void;
  className?: string;
}) {
  return (
    <FilterBadges
      searchFilter={searchFilter}
      excludeKeys={spec.badgeExcludeKeys}
      className={className}
      resolveValue={(key, value) =>
        resolveValue ? resolveValue(key, value) : value
      }
      onSubmit={(filter) => onSubmit(filter as T)}
    />
  );
}

export default ListPageFilterBadges;
