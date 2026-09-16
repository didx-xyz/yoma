import React from "react";

/** The wizard's toggleable pill — one look for chips, rows and pills block kinds. */
export const Pill: React.FC<{
  label: string;
  active: boolean;
  onToggle: () => void;
}> = ({ label, active, onToggle }) => (
  <button
    type="button"
    onClick={onToggle}
    // 44px on touch, compact from md up — the same rule as the filter panel's option pills.
    className={`flex min-h-11 items-center rounded-full border px-2.5 text-[11px] md:min-h-9 md:text-xs ${
      active
        ? "border-green bg-green font-semibold text-white"
        : "border-gray hover:border-green bg-white"
    }`}
  >
    {label}
  </button>
);
