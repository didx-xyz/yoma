/**
 * The compact list's column widths — ONE constant shared by the header row and the row bodies.
 * The alignment is the entire reason the view exists; two width lists that agree by luck drift
 * on the first change.
 *
 * Round 7 (2026-09-30, artboard 9a): the card's field priority as columns — type, the
 * opportunity (title + its highlight badge, org · summary), money, where, the first priority
 * fact, status, places, and the type button (outline). Where and places join from `lg`, the key
 * fact from `xl`, so the title keeps room at every desktop width.
 */
export const LIST_COLUMNS = {
  tile: "w-10 shrink-0",
  // fits the longest type chip, "ENTREPRENEURSHIP" (123px; w-24 let it run into the title)
  badge: "w-32 shrink-0",
  title: "min-w-0 flex-1",
  money: "w-[140px] shrink-0",
  where: "hidden w-[130px] shrink-0 lg:block",
  fact: "hidden w-[130px] shrink-0 xl:block",
  status: "w-[100px] shrink-0",
  places: "hidden w-[90px] shrink-0 lg:block",
  action: "w-[130px] shrink-0",
} as const;
