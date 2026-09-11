import React from "react";
import type { IconType } from "react-icons";
import { IoChevronDown } from "react-icons/io5";

/**
 * The ONE header row every block in the filter surface renders — universal sections, the type
 * row, the per-type custom-field sections and the "More filters" disclosure. One place decides
 * icon size, label scale, the value column, badge placement, chevron size and the divider, so
 * the four cannot drift apart again (they had: three icon sizes, two label scales, and the type
 * row was the only header with no value column at all).
 *
 * `expanded === null` means the block has no collapse chrome (the always-open type row): no
 * chevron, and the row renders as a heading instead of a button.
 */
export const SectionHeader: React.FC<{
  icon: IconType;
  label: string;
  /** Live summary of the current selection — every header carries one ("Any", "2 selected"). */
  value?: string | null;
  /** 13px muted helper under the row. Boxed callouts are reserved for null-rule warnings. */
  subtitle?: string | null;
  badges?: React.ReactNode;
  expanded: boolean | null;
  onToggle?: () => void;
}> = ({
  icon: Icon,
  label,
  value = null,
  subtitle = null,
  badges,
  expanded,
  onToggle,
}) => {
  const row = (
    <>
      <Icon className="text-gray-dark h-5 w-5 shrink-0" />
      <span className="shrink-0 text-[15px] font-semibold whitespace-nowrap">
        {label}
      </span>
      {value !== null && (
        <span className="text-gray-dark hidden min-w-0 flex-1 truncate text-xs sm:block">
          {value}
        </span>
      )}
      <span className="ml-auto flex shrink-0 items-center gap-2">
        {badges}
        {expanded !== null && (
          <IoChevronDown
            className={`h-5 w-5 transition-transform motion-reduce:transition-none ${
              expanded ? "rotate-180" : ""
            }`}
          />
        )}
      </span>
    </>
  );

  return (
    <>
      {expanded === null ? (
        <div className="flex min-h-11 w-full items-center gap-3 py-2">
          {row}
        </div>
      ) : (
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={expanded}
          className="flex min-h-11 w-full items-center gap-3 py-2 text-left"
        >
          {row}
        </button>
      )}
      {subtitle && (
        <p className="text-gray-dark pb-2 text-[13px] leading-snug">
          {subtitle}
        </p>
      )}
    </>
  );
};
