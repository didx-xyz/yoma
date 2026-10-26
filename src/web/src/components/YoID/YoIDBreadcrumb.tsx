import type { TabItem } from "~/api/models/common";
import Breadcrumb from "~/components/Breadcrumb";
import { formatNumber } from "~/features/discovery/lib/format";
import { YOID_TABS } from "./yoidTabs";

/**
 * The trail at the top of a Yo-ID subpage, "Yo-ID › …" (kept by Jason, 2026-10-20). It doubles as
 * the page's title: a heading under it would only repeat its last crumb. `count` follows the trail
 * in the rail-count style (the skills page's total).
 */
export const YoIDBreadcrumb: React.FC<{ trail: TabItem[]; count?: number }> = ({
  trail,
  count,
}) => (
  <div className="flex min-w-0 items-center gap-2 text-xs font-bold tracking-wider text-black md:text-base">
    <Breadcrumb
      className="min-w-0"
      items={[{ title: "Yo-ID", url: YOID_TABS.overview.url }, ...trail]}
    />
    {count !== undefined && (
      <span className="text-gray-dark text-sm font-semibold tracking-normal">
        {formatNumber(count)}
      </span>
    )}
  </div>
);
