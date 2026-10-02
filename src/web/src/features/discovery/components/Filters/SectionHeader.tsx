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
 *
 * Round 10 (2026-10-02): below `sm` the value is a second line under the label instead of hidden,
 * for every block alike, so only density changes between the containers. A `disabled` block (a
 * section the search cannot filter on yet) is a greyed row that never opens: no chevron, no
 * toggle, and its value ("Coming soon") as plain grey text at the right — never a pill
 * (2026-09-22). Its subtitle stays visible and undimmed.
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
  disabled?: boolean;
}> = ({
  icon: Icon,
  label,
  value = null,
  subtitle = null,
  badges,
  expanded,
  onToggle,
  disabled = false,
}) => {
  const row = (
    <>
      <Icon className="text-gray-dark h-5 w-5 shrink-0" />
      <span className="flex min-w-0 flex-1 flex-col sm:flex-row sm:items-center sm:gap-3">
        {/* Truncates below `sm` only, so a long label beside a badge ("Entrepreneurship filters"
            · FROM THIS TYPE at 360px) never runs under it; from `sm` the value gives way. */}
        <span className="truncate text-[15px] font-semibold sm:shrink-0">
          {label}
        </span>
        {value !== null && !disabled && (
          <span className="text-gray-dark min-w-0 truncate text-[13px] sm:flex-1 sm:text-xs">
            {value}
          </span>
        )}
      </span>
      <span className="ml-auto flex shrink-0 items-center gap-2">
        {badges}
        {disabled
          ? value !== null && (
              <span className="text-gray-dark text-xs">{value}</span>
            )
          : expanded !== null && (
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
      {disabled ? (
        // `role="group"` so assistive tech honours `aria-disabled` (a bare div's is ignored).
        <div
          role="group"
          aria-label={label}
          aria-disabled="true"
          className="flex min-h-11 w-full items-center gap-3 py-2 opacity-50"
        >
          {row}
        </div>
      ) : expanded === null ? (
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
