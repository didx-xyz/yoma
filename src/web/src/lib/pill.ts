/**
 * Discovery's pill language (the quick-search and category pills) for the YoID tabs, the
 * opportunity sub-tabs and the passport type chips. A pill sits in a `PillRow`.
 */
export const PILL_CLASS =
  "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 text-xs font-semibold whitespace-nowrap";

/** 44 px below `md` (the touch-target rule), 36 px from `md`: a page's own controls. */
export const PILL_TOUCH_CLASS = "min-h-11 md:min-h-9";

export const PILL_IDLE_CLASS =
  "border-gray hover:border-green bg-white text-black";

/** The current place, for navigation pills (`aria-current="page"`). */
export const PILL_CURRENT_CLASS = "border-green bg-green text-white";

/** A picked filter (`aria-pressed`), outlined inside its edge as discovery's category pill. */
export const PILL_PRESSED_CLASS =
  "border-green inset-ring inset-ring-green bg-white text-green";

/** The count after a pill's label. */
export const PILL_COUNT_CLASS = "font-normal opacity-70";
