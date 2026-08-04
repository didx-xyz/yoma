import type { ReactNode } from "react";
import { IoIosInformationCircleOutline } from "react-icons/io";
import FormTooltip from "~/components/Common/FormTooltip";
import {
  LABEL_SUFFIX_FY,
  LABEL_SUFFIX_LIFETIME,
  type RewardBalanceTone,
} from "~/lib/format/rewards";

/**
 * The one way a reward figure is displayed, anywhere: label, value, optional tooltip, and the
 * financial-year / lifetime scope as a suffix on the label.
 *
 * Treasury, Organisation, Opportunity and Referral all show pools, cumulatives and balances side
 * by side; rendering them through this primitive is what stops the four surfaces from drifting
 * apart. Values must already be formatted through `lib/format/rewards` — this component does not
 * format, so the number rules stay in one place.
 */

export type RewardStatScope = "financialYear" | "lifetime";

/**
 * `prominent` is for the figure that answers "how much is left" — the balance. `warning` and
 * `danger` come off `rewardBalanceTone`, so "running low" and "exhausted" read the same
 * everywhere.
 */
export type RewardStatTone = "default" | "prominent" | "warning" | "danger";

const SCOPE_SUFFIX: Record<RewardStatScope, string> = {
  financialYear: LABEL_SUFFIX_FY,
  lifetime: LABEL_SUFFIX_LIFETIME,
};

const TONE_CLASSES: Record<RewardStatTone, string> = {
  default: "font-semibold text-gray-dark",
  prominent: "text-base font-bold text-blue-700",
  warning: "text-base font-bold text-amber-700",
  danger: "text-base font-bold text-red-600",
};

/** Maps the shared balance tone onto the display tone, so callers don't re-decide it. */
export const balanceStatTone = (tone: RewardBalanceTone): RewardStatTone => {
  switch (tone) {
    case "depleted":
      return "danger";
    case "low":
      return "warning";
    case "unset":
      return "default";
    default:
      return "prominent";
  }
};

export const RewardStat: React.FC<{
  label: string;
  /** appends the canonical "(this financial year)" / "(lifetime)" wording to the label */
  scope?: RewardStatScope;
  /** pre-formatted value (formatZlto / formatYoma / formatUsd) */
  value: ReactNode;
  tooltip?: string;
  tone?: RewardStatTone;
  /** short line under the value — e.g. why it is empty, or what it is capped at */
  note?: ReactNode;
  className?: string;
}> = ({
  label,
  scope,
  value,
  tooltip,
  tone = "default",
  note,
  className = "",
}) => (
  <div className={`flex flex-col gap-1 bg-white px-4 py-3 ${className}`}>
    <div className="flex flex-row items-start gap-1 text-xs font-medium text-gray-500">
      <span>
        {label}
        {scope && (
          <>
            {" "}
            <span className="whitespace-nowrap italic">
              {SCOPE_SUFFIX[scope]}
            </span>
          </>
        )}
      </span>

      {tooltip && (
        <FormTooltip label={tooltip} className="tooltip-top cursor-help">
          <IoIosInformationCircleOutline className="h-4 w-4 shrink-0 text-gray-400" />
        </FormTooltip>
      )}
    </div>

    <div className={`text-sm ${TONE_CLASSES[tone]}`}>{value}</div>

    {note && <div className="text-xs text-gray-500 italic">{note}</div>}
  </div>
);

/**
 * A titled card of RewardStats. The hairlines between cells come from a 1px gap over a grey
 * background, so they survive every breakpoint without per-cell border juggling.
 */
export const RewardStatGroup: React.FC<{
  title: string;
  icon?: ReactNode;
  /** right-aligned content on the group header — e.g. a status badge */
  action?: ReactNode;
  columns?: 2 | 3 | 4;
  children: ReactNode;
}> = ({ title, icon, action, columns = 4, children }) => {
  const columnClasses = {
    2: "sm:grid-cols-2",
    3: "sm:grid-cols-2 lg:grid-cols-3",
    4: "sm:grid-cols-2 lg:grid-cols-4",
  }[columns];

  return (
    <div className="border-gray-light overflow-hidden rounded-lg border">
      <div className="border-gray-light flex flex-row items-center gap-2 border-b bg-gray-50 px-4 py-2">
        {icon}
        <h6 className="grow text-xs font-semibold text-gray-700">{title}</h6>
        {action}
      </div>

      <div className={`grid grid-cols-1 gap-px bg-gray-200 ${columnClasses}`}>
        {children}
      </div>
    </div>
  );
};

export default RewardStat;
