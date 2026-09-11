/**
 * Shared button styling for dialogs & forms, so every "confirm / dismiss" pair looks the
 * same wherever it appears (confirmation dialog, filter popup, import & export dialogs).
 *
 * Colour follows the page theme — blue on admin pages, green on org-admin pages — via
 * the `bg-theme` / `text-theme` / `border-theme` rules in globals.css.
 *
 * Width is deliberately NOT included: callers add `w-28`, `w-64`, `w-full` etc. to suit
 * their layout, while height, shape, colour and hover stay identical.
 * NB: hover uses `brightness`, which works on any background — `hover:bg-theme` cannot
 * work, as `bg-theme` is hand-written CSS rather than a Tailwind utility.
 */

/** Filled, theme-coloured primary action (Apply, OK, Download, Import…). */
export const BTN_PRIMARY =
  "btn btn-sm bg-theme border-theme min-w-28 rounded-full px-6 normal-case brightness-[1.12] hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60";

/** Outlined, theme-coloured secondary action (Close, Cancel…). */
// export const BTN_SECONDARY =
//   "btn btn-sm border-theme text-theme min-w-28 rounded-full border bg-white px-6 normal-case hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60";
export const BTN_SECONDARY =
  "btn btn-sm border text-gray-dark min-w-28 rounded-full border bg-gray-light px-6 normal-case hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60";

/**
 * Outlined destructive action (Decline, Reject…). Same geometry as BTN_SECONDARY so it lines
 * up beside it; red rather than themed, because "this one is destructive" has to survive the
 * page theme.
 */
export const BTN_DANGER =
  "btn btn-sm min-w-28 rounded-full border border-red-500 bg-white px-6 text-red-500 normal-case hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60";

/** Circular icon button that dismisses a dialog (the ✕ in the corner). */
// export const BTN_DIALOG_CLOSE =
//   "btn btn-sm btn-circle text-gray-dark hover:bg-gray-light border-none bg-transparent";

export const BTN_DIALOG_CLOSE =
  "btn btn-sm btn-circle text-gray-dark hover:bg-gray-light border bg-transparent";
