import Link from "next/link";
import { Status } from "~/api/models/opportunity";
import CustomSlider from "~/components/Carousel/CustomSlider";
import { OPPORTUNITY_ADMIN_STATUS_TABS } from "./opportunityAdminFilter";

/**
 * Status tab bar shared by the admin (all organisations) and org-admin opportunity
 * search pages. Tabs preserve the other filters by appending to `baseParams`.
 */
export const OpportunityAdminStatusTabs: React.FC<{
  basePath: string;
  /** current filters (excluding status & page), preserved when switching tabs */
  baseParams?: URLSearchParams | null;
  status: Status | null;
  /** count per tab, keyed on the tab's status (`all` for the "All" tab) */
  counts: Partial<Record<Status | "all", number | undefined>>;
}> = ({ basePath, baseParams, status, counts }) => {
  const hrefFor = (tabStatus: Status | null) => {
    const params = new URLSearchParams(baseParams?.toString() ?? "");
    params.delete("status");
    params.delete("page"); // paging is meaningless across tabs
    if (tabStatus !== null) params.append("status", Status[tabStatus]);

    return params.size > 0 ? `${basePath}?${params.toString()}` : basePath;
  };

  return (
    <CustomSlider sliderClassName="!gap-6">
      {OPPORTUNITY_ADMIN_STATUS_TABS.map((tab) => {
        const count = counts[tab.status ?? "all"];
        const selected = status === tab.status;

        return (
          <Link
            key={`opportunity_status_tab_${tab.label}`}
            href={hrefFor(tab.status)}
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

export default OpportunityAdminStatusTabs;
