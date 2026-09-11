import Link from "next/link";
import type { ReactNode } from "react";
import sliderStyles from "~/components/Carousel/CustomSlider.module.css";

/**
 * The tab bar that sits on the themed banner of the admin pages.
 *
 * This is the presentation only — link, label, optional count badge, selected state. The status
 * filter tabs (ListPageStatusTabs) and plain view tabs (e.g. Treasury's Overview / Manage) both
 * render through it, so the two cannot drift apart visually.
 */

export interface ListPageTab {
  /** react key, and the disambiguator when a page renders more than one tab bar */
  key: string;
  label: ReactNode;
  href: string;
  selected: boolean;
  /** shown as a badge after the label when greater than zero */
  count?: number;
}

export const ListPageTabs: React.FC<{
  tabs: ListPageTab[];
  /** names the tab bar for screen readers when a page has more than one */
  ariaLabel?: string;
}> = ({ tabs, ariaLabel }) => (
  <div
    role="tablist"
    aria-label={ariaLabel}
    // daisyUI's .tabs wraps by default; on narrow screens these scroll sideways instead,
    // so the lifted tab keeps sitting on the results below it
    className={`tabs tabs-lift flex-nowrap overflow-x-auto overflow-y-hidden ${sliderStyles.noscrollbar}`}
  >
    {tabs.map((tab) => (
      <Link
        key={tab.key}
        href={tab.href}
        scroll={false} // don't yank the viewport when switching tabs
        role="tab"
        aria-selected={tab.selected}
        className={
          // shrink-0 + nowrap so two-word labels ("Limit Reached") stay on one line and
          // the row scrolls rather than squashing.
          // the selected tab lifts in the page background colour, so it reads as joined
          // to the results below it — hence dark text on it, white on the rest
          `tab shrink-0 whitespace-nowrap ${
            tab.selected
              ? "tab-active text-gray-dark [--tab-bg:var(--color-gray-light)] [--tab-border-color:var(--color-gray-light)]"
              : "border-0 text-white"
          }`
        }
      >
        {tab.label}
        {(tab.count ?? 0) > 0 && (
          <div className="badge bg-warning my-auto ml-2 p-1 text-[12px] font-semibold text-white">
            {tab.count}
          </div>
        )}
      </Link>
    ))}
  </div>
);

export default ListPageTabs;
