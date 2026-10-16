import Image from "next/image";
import React from "react";

/** The wizard's toggleable pill — one look for chips, rows and pills block kinds. */
export const Pill: React.FC<{
  label: string;
  active: boolean;
  onToggle: () => void;
  /** A leading icon — the categories' own, as on Browse by category. */
  imageURL?: string;
}> = ({ label, active, onToggle, imageURL }) => (
  <button
    type="button"
    aria-pressed={active}
    onClick={onToggle}
    // 44px on touch, compact from md up — the same rule as the filter panel's option pills.
    // Selected with an icon: outlined, never filled — the green fill hid the icons (2026-10-07).
    className={`flex min-h-11 items-center gap-1.5 rounded-full border px-2.5 text-left text-[11px] md:min-h-9 md:text-xs ${
      !active
        ? "border-gray hover:border-green bg-white"
        : imageURL
          ? "border-green ring-green text-green bg-white font-semibold ring-1"
          : "border-green bg-green font-semibold text-white"
    }`}
  >
    {imageURL && (
      // Self-contained badges (glyph on their own circle): drawn as they are, never tinted.
      <Image
        src={imageURL}
        alt=""
        width={18}
        height={18}
        className="h-4.5 w-4.5 shrink-0"
      />
    )}
    {label}
  </button>
);
