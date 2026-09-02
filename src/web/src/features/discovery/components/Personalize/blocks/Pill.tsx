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
    className={`rounded-full border px-2.5 py-1 text-[11px] md:text-xs ${
      active
        ? "border-green bg-green font-semibold text-white"
        : "border-gray hover:border-green bg-white"
    }`}
  >
    {label}
  </button>
);
