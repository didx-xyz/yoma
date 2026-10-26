// ─────────────────────────────────────────────────────────────────────────────
// The completion dialogs' chrome (Jason, 2026-10-21), shared by the completion form and the
// submitted / pending dialogs so the three read as one: a plain white sheet rising in
// (`CustomModal animationStyle="rise"` — the sheet itself moves; a transform on the body
// inside the scrolling sheet gave it 8px of overflow, a scrollbar for the animation's length
// and a reflow when it went, 2026-10-22), a ghost circle close, the type's tint behind an io5
// icon, a Nunito heading, then solid + outline `rounded-full` buttons.
// ─────────────────────────────────────────────────────────────────────────────

export const DIALOG_BODY = "flex h-full flex-col overflow-y-auto";
export const DIALOG_CLOSE =
  "btn btn-circle btn-ghost btn-sm text-gray-dark hover:bg-gray";
export const DIALOG_ICON_CIRCLE =
  "flex h-20 w-20 shrink-0 items-center justify-center rounded-full";
export const DIALOG_HEADING =
  "font-nunito text-2xl leading-tight font-black text-black md:text-[28px]";
export const DIALOG_EYEBROW =
  "text-gray-dark text-[11px] font-semibold tracking-wide uppercase";
export const DIALOG_PRIMARY =
  "btn bg-green hover:bg-green-dark w-full rounded-full text-white normal-case";
export const DIALOG_SECONDARY =
  "btn border-green text-green hover:bg-green-dark w-full rounded-full bg-white normal-case hover:text-white";
