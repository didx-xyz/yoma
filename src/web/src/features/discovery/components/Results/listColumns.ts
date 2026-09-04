/**
 * The compact list's column widths — ONE constant shared by the header row and the row bodies.
 * The alignment is the entire reason the view exists; two width lists that agree by luck drift
 * on the first change.
 */
export const LIST_COLUMNS = {
  tile: "w-10 shrink-0",
  badge: "w-[100px] shrink-0",
  title: "min-w-0 flex-1",
  commitment: "w-[150px] shrink-0",
  pay: "w-[170px] shrink-0",
  closes: "w-[130px] shrink-0",
  reward: "w-24 shrink-0 text-right",
} as const;
