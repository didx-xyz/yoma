import Link from "next/link";
import CustomSlider from "~/components/Carousel/CustomSlider";
import {
  statusTabHref,
  type ListPageParamSpec,
} from "~/components/Common/ListPage/listPageFilter";

/**
 * Status tab bar shared by the admin list pages. The tabs own the status filter: they
 * preserve every other filter by appending to `baseParams`, and drop paging.
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
  return (
    <CustomSlider sliderClassName="!gap-6">
      {(statusSpec.tabs ?? []).map((tab) => {
        const count = counts[tab.value ?? "all"];
        const selected = status === tab.value;

        return (
          <Link
            key={`${idPrefix}_status_tab_${tab.label}`}
            href={statusTabHref(
              basePath,
              baseParams,
              statusSpec,
              tab.value,
              pageParam,
            )}
            scroll={false} // don't yank the viewport when switching tabs
            role="tab"
            className={`border-b-4 py-2 whitespace-nowrap text-white ${
              selected ? "border-orange" : "hover:border-orange hover:text-gray"
            }`}
          >
            {tab.label}
            {(count ?? 0) > 0 && (
              <div className="badge bg-warning my-auto ml-2 p-1 text-[12px] font-semibold text-white">
                {count}
              </div>
            )}
          </Link>
        );
      })}
    </CustomSlider>
  );
};

export default ListPageStatusTabs;
