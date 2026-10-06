import React, { useState } from "react";
import { IoChevronForward } from "react-icons/io5";

// ─────────────────────────────────────────────────────────────────────────────
// Tabbed detail layout (round 7, artboards 11a–11e, 2026-09-30; cards round 10,
// 2026-10-02) — the disclosure pieces. Each section is its own card. CLOSED by
// default: a tinted icon square, the title, a count and a one-line preview. OPEN,
// it shows chips (first 6 on desktop, 4 on mobile, then "Show all N") or a short
// note; a chip section's preview slot then says what the list means. A static
// section (Age range) is the row alone, with nothing to open, and its note under
// the title (2026-10-05).
// ─────────────────────────────────────────────────────────────────────────────

export const DetailDisclosure: React.FC<{
  id: string;
  icon: React.ReactNode;
  /** The icon square's tint: its background and icon colour (one per group). */
  toneClass: string;
  title: string;
  /** List sections: how many items. */
  count?: number | null;
  /** Value sections (e.g. an age range): the value itself, beside the title. */
  valueHint?: string | null;
  /** The closed row's one-line preview. */
  preview?: string | null;
  /**
   * The open row's line in the same slot: what the chips mean for the youth (round 10
   * follow-ups). It wraps, never truncates, and fades in with the body. A static row shows it
   * always, under the title and without the fade (2026-10-05).
   */
  note?: string | null;
  /** A value row with nothing to open: no button, no chevron, no body. */
  static?: boolean;
  open: boolean;
  onToggle: () => void;
  /** The section a tab tap just opened — marked with the green edge. */
  focused?: boolean;
  children?: React.ReactNode;
}> = ({
  id,
  icon,
  toneClass,
  title,
  count,
  valueHint,
  preview,
  note,
  static: isStatic = false,
  open,
  onToggle,
  focused = false,
  children,
}) => {
  // The content mounts on the first open and then stays: an unopened section costs nothing
  // (Additional details' `CustomFieldsView` runs lookup queries when it mounts), while a
  // section opened once keeps its state ("Show all") and eases shut. Updated during render —
  // React's pattern for state derived from a prop's history — so it mounts in the same commit
  // that turns the row 0fr → 1fr, and the first open eases too.
  const [everOpened, setEverOpened] = useState(open);
  if (open && !everOpened) setEverOpened(true);

  // Top-aligned with no minimum height, so opening never moves the title: the one-line
  // preview simply gives way to the content below it (centring inside a min-height made
  // the title jump ~6px whenever a preview line disappeared).
  const row = "flex w-full items-start gap-3.5 px-5 py-[18px] text-left";
  const heading = (
    <>
      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${toneClass}`}
      >
        {icon}
      </span>
      <span className="min-w-0 grow">
        <span className="block text-[15px] font-extrabold text-black">
          {title}
          {count != null && (
            <span className="text-gray-dark font-normal">{` · ${count}`}</span>
          )}
          {valueHint && (
            <span className="text-gray-dark font-normal">{` · ${valueHint}`}</span>
          )}
        </span>
        {!open && preview && (
          <span className="text-gray-dark block truncate text-sm">
            {preview}
          </span>
        )}
        {(open || isStatic) && note && (
          <span
            className={`text-gray-dark mt-0.5 block text-[13px] leading-snug ${
              // a static row's note is always there, so it has nothing to fade in with
              isStatic
                ? ""
                : "motion-safe:animate-[fade-in_220ms_ease-out_both]"
            }`}
          >
            {note}
          </span>
        )}
      </span>
    </>
  );

  return (
    <div
      className={`border-gray rounded-[18px] border bg-white ${
        // a static row has nothing to open, so it does not answer the pointer
        isStatic
          ? ""
          : "hover:border-gray-dark/30 transition-colors duration-120 motion-reduce:transition-none"
      } ${
        // an inset edge, not a border: a border would push the row's content 4px sideways
        focused ? "shadow-[inset_4px_0_0_var(--color-green)]" : ""
      }`}
    >
      {isStatic ? (
        <div className={row}>{heading}</div>
      ) : (
        <>
          <button
            type="button"
            aria-expanded={open}
            aria-controls={`section-${id}-body`}
            onClick={onToggle}
            className={row}
          >
            {heading}
            <IoChevronForward
              className={`text-gray-dark mt-3 h-4 w-4 shrink-0 transition-transform duration-220 motion-reduce:transition-none ${
                open ? "rotate-90" : ""
              }`}
            />
          </button>
          {/* The frame always exists, so opening and closing can ease the height (0fr ↔
              1fr); inert while closed, so its links and buttons are out of the tab order. */}
          <div
            id={`section-${id}-body`}
            inert={!open}
            className={`grid transition-[grid-template-rows] duration-220 ease-out motion-reduce:transition-none ${
              open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
            }`}
          >
            <div className="overflow-hidden">
              {(open || everOpened) && (
                <div className="px-5 pb-5 md:pl-[74px]">{children}</div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

/** Soft chips: solid green is kept for the call to action. */
const CHIP =
  "bg-green-light text-green items-center rounded-full px-3 py-[5px] text-[13px] font-bold";

/** Chips: the first 4 (mobile) / 6 (desktop), then "Show all N". */
export const ChipList: React.FC<{
  items: { id: string; label: string }[];
}> = ({ items }) => {
  const [all, setAll] = useState(false);
  const MOBILE = 4;
  const DESKTOP = 6;
  return (
    <div className="flex flex-wrap items-center gap-2">
      {items.map((item, index) => {
        // the display class is chosen whole: `hidden` beside an `inline-flex` would conflict
        let display = "inline-flex";
        if (!all && index >= DESKTOP) display = "hidden";
        else if (!all && index >= MOBILE) display = "hidden md:inline-flex";
        return (
          <span key={item.id} className={`${CHIP} ${display}`}>
            {item.label}
          </span>
        );
      })}
      {!all && items.length > MOBILE && (
        <button
          type="button"
          onClick={() => setAll(true)}
          className={`text-green text-xs font-semibold ${
            items.length > DESKTOP ? "" : "md:hidden"
          }`}
        >
          {`Show all ${items.length}`}
        </button>
      )}
    </div>
  );
};
