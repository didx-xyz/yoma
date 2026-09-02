import Link from "next/link";
import React from "react";
import { IoChevronForward } from "react-icons/io5";
import type { OpportunityInfo } from "~/api/models/opportunity";
import { closingInfo } from "../../lib/dates";
import { formatNumber } from "../../lib/format";
import { LIST_COLUMNS } from "./listColumns";
import { typeBadgeClass } from "./typeBadge";

/**
 * The compact-list row — one line of aligned columns on desktop, a three-line stack on mobile
 * (no room for real columns at 390px, so pay always occupies the same position instead).
 * Deliberately dropped: the image entirely, the summary, skill chips, the accessibility flag —
 * those live on the detail page. Kept: type, title, organisation, commitment, pay, closing date
 * with urgency colour, ZLTO.
 */
export const OpportunityRow: React.FC<{
  opportunity: OpportunityInfo;
  now: Date;
}> = ({ opportunity, now }) => {
  const closing = closingInfo(opportunity.dateEnd, now);
  const closesClass = closing.urgent
    ? "font-semibold text-pink"
    : "text-gray-dark";
  // Pay (salary / partner incentive / is-paid) is pending YOM-1264 fields — see lib/money.ts.
  // Until then the pay slot is honestly empty; ZLTO stays in its own reward slot.
  const pay = "—";

  return (
    <Link
      href={`/opportunities/${opportunity.id}`}
      className="shadow-custom block rounded-lg bg-white px-3 py-2 hover:shadow-lg"
    >
      {/* Desktop: one aligned line, widths from LIST_COLUMNS */}
      <div className="hidden items-center gap-3 text-sm md:flex">
        <span
          className={`${LIST_COLUMNS.tile} bg-beige text-gray-dark flex h-10 items-center justify-center rounded text-xs font-bold`}
        >
          {opportunity.organizationName.slice(0, 2).toUpperCase()}
        </span>
        <span className={LIST_COLUMNS.badge}>
          <span
            className={`rounded px-1.5 py-0.5 text-[10px] font-bold tracking-wide uppercase ${typeBadgeClass(opportunity.type)}`}
          >
            {opportunity.type}
          </span>
        </span>
        <span className={LIST_COLUMNS.title}>
          {/* Same title size as the grid card */}
          <span className="block truncate text-sm font-semibold md:text-base">
            {opportunity.title}
          </span>
          <span className="text-gray-dark block truncate text-xs">
            {opportunity.organizationName}
          </span>
        </span>
        <span className={`${LIST_COLUMNS.commitment} text-gray-dark truncate`}>
          {opportunity.commitmentIntervalDescription ?? "—"}
        </span>
        <span className={`${LIST_COLUMNS.pay} truncate font-semibold`}>
          {pay}
        </span>
        <span className={`${LIST_COLUMNS.closes} truncate ${closesClass}`}>
          {closing.label}
        </span>
        <span className={`${LIST_COLUMNS.reward} text-green font-bold`}>
          {opportunity.zltoReward
            ? `${formatNumber(opportunity.zltoReward)} ZLTO`
            : ""}
        </span>
        <IoChevronForward className="text-gray-dark h-4 w-4 shrink-0" />
      </div>

      {/* Mobile: three lines — badge row with the closing date, title, pay · commitment + reward */}
      <div className="flex flex-col gap-1 md:hidden">
        <div className="flex items-center justify-between">
          <span
            className={`rounded px-1.5 py-0.5 text-[10px] font-bold tracking-wide uppercase ${typeBadgeClass(opportunity.type)}`}
          >
            {opportunity.type}
          </span>
          <span className={`text-xs ${closesClass}`}>{closing.label}</span>
        </div>
        <span className="line-clamp-1 text-sm font-semibold">
          {opportunity.title}
        </span>
        <div className="flex items-center justify-between text-xs">
          <span>
            {opportunity.commitmentIntervalDescription && (
              <span className="text-gray-dark">
                {opportunity.commitmentIntervalDescription}
              </span>
            )}
          </span>
          {opportunity.zltoReward && (
            <span className="text-green font-bold">
              {formatNumber(opportunity.zltoReward)} ZLTO
            </span>
          )}
        </div>
        <span className="text-gray-dark truncate text-xs">
          {opportunity.organizationName}
        </span>
      </div>
    </Link>
  );
};
