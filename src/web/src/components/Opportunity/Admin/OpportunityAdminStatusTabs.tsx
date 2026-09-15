import { Status } from "~/api/models/opportunity";
import ListPageStatusTabs from "~/components/Common/ListPage/ListPageStatusTabs";
import {
  OPPORTUNITY_ADMIN_STATUS_PARAM,
  OPPORTUNITY_ADMIN_STATUS_TABS,
} from "./opportunityAdminFilter";

/**
 * Status tab bar for the admin (all organisations) and org-admin opportunity search pages.
 * A thin wrapper over the shared list-page tab bar that speaks the numeric `Status` enum,
 * which is what the two pages hold; the querystring carries the enum name.
 */
export const OpportunityAdminStatusTabs: React.FC<{
  basePath: string;
  /** current filters (excluding status & page), preserved when switching tabs */
  baseParams?: URLSearchParams | null;
  status: Status | null;
  /** count per tab, keyed on the tab's status (`all` for the "All" tab) */
  counts: Partial<Record<Status | "all", number | undefined>>;
}> = ({ basePath, baseParams, status, counts }) => {
  // the shared component keys counts on the querystring token (the enum name)
  const countsByName: Record<string, number | undefined> = { all: counts.all };
  for (const tab of OPPORTUNITY_ADMIN_STATUS_TABS) {
    if (tab.value === null) continue;
    countsByName[tab.value] = counts[Status[tab.value as keyof typeof Status]];
  }

  return (
    <ListPageStatusTabs
      basePath={basePath}
      baseParams={baseParams}
      statusSpec={OPPORTUNITY_ADMIN_STATUS_PARAM}
      status={status !== null ? Status[status] : null}
      counts={countsByName}
      idPrefix="opportunity"
    />
  );
};

export default OpportunityAdminStatusTabs;
