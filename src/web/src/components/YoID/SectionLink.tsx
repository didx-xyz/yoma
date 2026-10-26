import Link from "next/link";
import type { MouseEvent } from "react";
import type { YoIDSectionId } from "./yoidSections";
import { YOID_TABS } from "./yoidTabs";

/**
 * The text links that close a section body ("What is ZLTO?", "See graph", "Open … →"): one tight
 * stack, a 32 px row each below `md` and a 24 px line from it, with no margin between them
 * (Jason, 2026-10-22: no white space between the drawer's links).
 */
export const SECTION_LINK_CLASS =
  "text-green inline-flex min-h-8 items-center self-start text-xs font-semibold md:min-h-6 md:text-sm";

/** The Skills section's "Open Skills →": a little room under the dense chips. */
export const SKILLS_LINK_CLASS = "mt-2";

/**
 * A plain left click, the one that navigates in this tab. A middle, ctrl, cmd or shift click
 * opens a new tab or window: the drawer must not close under it, and nothing may call
 * `preventDefault` on it.
 */
export const isPlainClick = (e: MouseEvent): boolean =>
  e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey;

/**
 * The "Open … →" line that closes every section body on the overview and in the user-menu
 * drawer: the way to the section's own page, as a real link (new-tab clicks work). The drawer
 * passes `onFollow` to close itself on a plain click and a `tabIndex` that follows its open
 * state.
 */
export const SectionLink: React.FC<{
  id: YoIDSectionId;
  onFollow?: () => void;
  tabIndex?: number;
  className?: string;
}> = ({ id, onFollow, tabIndex, className = "" }) => (
  <Link
    href={YOID_TABS[id].url}
    onClick={onFollow && ((e) => isPlainClick(e) && onFollow())}
    tabIndex={tabIndex}
    className={`${SECTION_LINK_CLASS} ${className}`}
  >
    Open {YOID_TABS[id].label} →
  </Link>
);
