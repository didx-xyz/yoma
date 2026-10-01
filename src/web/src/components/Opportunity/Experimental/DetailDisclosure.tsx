import React, { useState } from "react";
import { IoChevronDown, IoChevronForward } from "react-icons/io5";

// ─────────────────────────────────────────────────────────────────────────────
// Experimental detail layout (round 7, artboards 11a–11e, 2026-09-30) — the
// disclosure pieces. A section is CLOSED by default: its title, a count and a
// one-line preview. OPEN, it shows chips (first 6 on desktop, 4 on mobile, then
// "Show all N") or key–value rows with a short note.
// ─────────────────────────────────────────────────────────────────────────────

export const DetailDisclosure: React.FC<{
  id: string;
  icon: React.ReactNode;
  title: string;
  /** List sections: how many items. */
  count?: number | null;
  /** Value sections (e.g. an age range): the value itself, beside the title. */
  valueHint?: string | null;
  /** The closed row's one-line preview. */
  preview?: string | null;
  open: boolean;
  onToggle: () => void;
  /** The section a tab tap just opened — marked with the green edge. */
  focused?: boolean;
  children: React.ReactNode;
}> = ({
  id,
  icon,
  title,
  count,
  valueHint,
  preview,
  open,
  onToggle,
  focused = false,
  children,
}) => (
  <div
    className={`border-gray-light border-b last:border-b-0 ${
      // an inset edge, not a border: a border would push the row's content 4px sideways
      focused ? "shadow-[inset_4px_0_0_var(--color-green)]" : ""
    }`}
  >
    <button
      type="button"
      aria-expanded={open}
      aria-controls={`section-${id}-body`}
      onClick={onToggle}
      // Top-aligned with no minimum height, so opening never moves the title: the one-line
      // preview simply gives way to the content below it (centring inside a min-height made
      // the title jump ~6px whenever a preview line disappeared).
      className="flex w-full items-start gap-3 px-4 py-3.5 text-left md:px-5"
    >
      <span className="text-gray-dark flex h-5 w-5 shrink-0 items-center justify-center">
        {icon}
      </span>
      <span className="min-w-0 grow">
        <span className="block text-sm font-semibold text-black">
          {title}
          {count != null && (
            <span className="text-gray-dark font-normal">{` · ${count}`}</span>
          )}
          {valueHint && (
            <span className="text-gray-dark font-normal">{` · ${valueHint}`}</span>
          )}
        </span>
        {!open && preview && (
          <span className="text-gray-dark block truncate text-xs">
            {preview}
          </span>
        )}
      </span>
      {open ? (
        <IoChevronDown className="text-gray-dark mt-0.5 h-4 w-4 shrink-0" />
      ) : (
        <IoChevronForward className="text-gray-dark mt-0.5 h-4 w-4 shrink-0" />
      )}
    </button>
    {open && (
      <div id={`section-${id}-body`} className="px-4 pb-4 md:pr-5 md:pl-13">
        {children}
      </div>
    )}
  </div>
);

const CHIP =
  "badge bg-green h-full min-h-6 rounded-md border-0 py-1 text-xs font-semibold text-white";

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
        let visibility = "";
        if (!all && index >= DESKTOP) visibility = "hidden";
        else if (!all && index >= MOBILE) visibility = "hidden md:inline-flex";
        return (
          <span key={item.id} className={`${CHIP} ${visibility}`}>
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

/** Key–value rows, with an optional short note underneath. */
export const KeyValueRows: React.FC<{
  rows: { label: string; value: string }[];
  note?: string | null;
}> = ({ rows, note }) => (
  <div className="flex flex-col">
    {rows.map((row) => (
      <div
        key={row.label}
        className="border-gray-light flex justify-between gap-4 border-b py-2 text-sm last:border-b-0"
      >
        <span className="text-gray-dark">{row.label}</span>
        <span className="text-right font-semibold">{row.value}</span>
      </div>
    ))}
    {note && <p className="text-gray-dark pt-2 text-xs">{note}</p>}
  </div>
);
