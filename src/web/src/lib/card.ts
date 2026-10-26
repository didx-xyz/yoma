/**
 * The discovery card's language, shared by the discovery result card, the YoID opportunity card
 * and the passport credential card (YOM-1283), so the three read as one family. Colours come from
 * `lib/typeColours.ts`; each card adds its own layout (`shrink-0`, `grow`, widths) to these.
 */

/**
 * The grid for discovery-style cards outside a carousel (discovery results, YoID opportunities,
 * passport sections, wallet products, skills). Columns switch where each one stays 272–425 px
 * wide; below 600 a card takes the full width (Jason, 2026-10-20). Rows stretch to the tallest
 * card.
 */
export const CARD_GRID_CLASS =
  "grid grid-cols-1 gap-4 min-[600px]:grid-cols-2 min-[900px]:grid-cols-3 min-[1200px]:grid-cols-4";

/** The band across the card's top, tinted by `typeBandClass`, that centres the logo. */
export const CARD_BAND_CLASS =
  "flex h-12 shrink-0 items-center justify-center md:h-20";

/** The logo `<Image>` (48 × 48) on the band. */
export const CARD_LOGO_CLASS =
  "h-9 w-9 rounded-full bg-white object-contain md:h-12 md:w-12";

/** The type chip, coloured by `typeBadgeClass`. */
export const CARD_CHIP_CLASS =
  "shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold tracking-wide uppercase";

/** The title `h3`: two lines, always reserved. */
export const CARD_TITLE_CLASS =
  "line-clamp-2 h-10 shrink-0 text-sm leading-5 font-semibold tracking-normal md:h-11 md:text-base md:leading-5.5";

/** The action at the card's foot, in the chip's colour (`typeBadgeClass`). */
export const CARD_ACTION_CLASS =
  "flex h-10 items-center justify-center rounded-lg px-4 text-sm font-semibold whitespace-nowrap transition hover:brightness-110 motion-reduce:transition-none";
