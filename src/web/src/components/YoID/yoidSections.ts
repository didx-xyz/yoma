import { createContext } from "react";
import type { YOID_TABS } from "./yoidTabs";

/** The overview's section ids: the tabs other than the overview itself. */
export type YoIDSectionId = Exclude<keyof typeof YOID_TABS, "overview">;

/**
 * Joins the Yo-ID hero / sticky chips to the overview's expandable sections (Jason, 2026-10-21):
 * on the overview a chip opens its section and scrolls to it, as the opportunity page's tabs do,
 * instead of leaving the page. Only the overview registers sections (through
 * `YoIDSectionsRegistrar`), so on a subpage `jump` is null and the chips stay links.
 */
export interface YoIDSectionsState {
  /** The section under the sticky bar (scroll-spy), or null above them all. */
  active: YoIDSectionId | null;
  /** Null when the current page has no sections (every subpage). */
  jump: ((id: YoIDSectionId | "overview") => void) | null;
}

/** The overview's side: it publishes the active section and the jump handler. */
export const YoIDSectionsRegistrar = createContext<
  (state: YoIDSectionsState) => void
>(() => undefined);
