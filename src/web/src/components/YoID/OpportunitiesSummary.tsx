import Link from "next/link";
import type { MouseEventHandler } from "react";
import type { IconType } from "react-icons";
import { IoArrowForward } from "react-icons/io5";
import type { TimeIntervalSummary } from "~/api/models/organizationDashboard";
import { OPPORTUNITIES_SEARCH_URL } from "~/lib/constants";
import { YOID_OPPORTUNITY_TABS } from "./yoidTabs";

interface MenuItem {
  href: string;
  background: string;
  count: number;
  label: string;
  icon: IconType;
}

/** The circle's orange ring: the share of the three verified states this one holds. */
const ring = (percentage: number): string =>
  `conic-gradient(from 180deg, var(--color-orange) ${percentage}%, var(--color-green) 0)`;

const [completedTab, pendingTab, declinedTab, savedTab] = YOID_OPPORTUNITY_TABS;

export const OpportunitiesSummary: React.FC<{
  data: TimeIntervalSummary | undefined;
  showSaved?: boolean;
  /** Called when a circle or the prompt's link is followed (the drawer closes on a plain click). */
  onClick?: MouseEventHandler<HTMLAnchorElement>;
}> = ({ data, showSaved, onClick }) => {
  const [completed = 0, pending = 0, rejected = 0, saved = 0] =
    data?.count || [];

  const total = completed + pending + rejected;
  const calculatePercentage = (count: number) =>
    total ? (count / total) * 100 : 0;

  const completedPercentage = calculatePercentage(completed);
  const pendingPercentage = calculatePercentage(pending);
  const rejectedPercentage = calculatePercentage(rejected);

  const menuItems: MenuItem[] = [
    {
      href: completedTab.url,
      background: ring(completedPercentage),
      count: completed,
      label: completedTab.label,
      icon: completedTab.icon,
    },
    {
      href: pendingTab.url,
      background: ring(pendingPercentage),
      count: pending,
      label: pendingTab.label,
      icon: pendingTab.icon,
    },
    {
      href: declinedTab.url,
      background: ring(rejectedPercentage),
      count: rejected,
      label: declinedTab.label,
      icon: declinedTab.icon,
    },
  ];

  if (showSaved) {
    menuItems.push({
      href: savedTab.url,
      background: "",
      count: saved,
      label: savedTab.label,
      icon: savedTab.icon,
    });
  }

  // Nothing yet: the circles still show their zeros (the youth sees what will fill them), and a
  // prompt leads to the search (Jason, 2026-10-21).
  const nothingYet = menuItems.every((item) => item.count === 0);

  return (
    <div className="flex w-full flex-col items-center gap-4">
      {/* Four (with Saved) sit 2 × 2 on a phone and in one row from `sm`; three always fit one row.
          From `sm` the band is capped so the circles cluster rather than spread across a wide card. */}
      <div
        className={`mx-auto grid w-full justify-items-center gap-3 sm:max-w-lg ${
          menuItems.length > 3 ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-3"
        }`}
      >
        {menuItems.map((item, index) => (
          <Link
            key={index}
            href={item.href}
            style={{ background: item.background }}
            className="border-orange bg-green shadow-custom flex aspect-square w-full max-w-24 flex-col items-center justify-center rounded-full border-2 p-2 text-center text-white"
            onClick={onClick}
          >
            <div className="bg-green flex h-full w-full flex-col items-center justify-center rounded-full">
              <div className="flex items-center gap-1 text-sm font-semibold whitespace-nowrap">
                <item.icon aria-hidden className="h-4 w-4 shrink-0" />
                {item.count}
              </div>
              <span className="text-[11px] leading-tight">{item.label}</span>
            </div>
          </Link>
        ))}
      </div>
      {nothingYet && (
        <div className="flex flex-col items-center gap-2 text-center">
          <p className="text-gray-dark text-xs md:text-sm">
            Complete an opportunity and get it verified, or save one for later —
            it shows up here.
          </p>
          <Link
            href={OPPORTUNITIES_SEARCH_URL}
            onClick={onClick}
            className="text-green inline-flex items-center gap-1 text-xs font-semibold underline md:text-sm"
          >
            Find opportunities
            <IoArrowForward aria-hidden className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}
    </div>
  );
};
