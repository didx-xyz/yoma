import {
  statusTabHref,
  type ListPageParamSpec,
} from "~/components/Common/ListPage/listPageFilter";
import ListPageTabs, {
  type ListPageTab,
} from "~/components/Common/ListPage/ListPageTabs";

/**
 * Status tab bar shared by the admin list pages. The tabs own the status filter: they
 * preserve every other filter by appending to `baseParams`, and drop paging.
 *
 * The chrome itself lives in ListPageTabs, which the plain view tabs use too.
 */
export const ListPageStatusTabs: React.FC<{
  basePath: string;
  /** current filters (excluding status & paging), preserved when switching tabs */
  baseParams?: URLSearchParams | null;
  /** the spec entry of kind "status" — supplies the param name and the tabs */
  statusSpec: ListPageParamSpec;
  /** querystring token of the selected tab, null for "All" */
  status: string | null;
  /** count per tab, keyed on the tab's querystring token (`all` for the "All" tab) */
  counts: Record<string, number | undefined>;
  pageParam?: string;
  /** disambiguates the react keys when a page renders more than one tab bar */
  idPrefix?: string;
}> = ({
  basePath,
  baseParams,
  statusSpec,
  status,
  counts,
  pageParam = "page",
  idPrefix = "list_page",
}) => {
  const tabs: ListPageTab[] = (statusSpec.tabs ?? []).map((tab) => ({
    key: `${idPrefix}_status_tab_${tab.label}`,
    label: tab.label,
    href: statusTabHref(basePath, baseParams, statusSpec, tab.value, pageParam),
    selected: status === tab.value,
    count: counts[tab.value ?? "all"],
  }));

  return <ListPageTabs tabs={tabs} ariaLabel="Filter by status" />;
};

export default ListPageStatusTabs;
