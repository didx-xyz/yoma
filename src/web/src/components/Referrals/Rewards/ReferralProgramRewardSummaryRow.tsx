import Image from "next/image";
import type { ReactNode } from "react";
import { NoImage } from "~/components/Common/NoImage";
import {
  balanceStatTone,
  RewardStat,
  RewardStatGroup,
  type RewardStatTone,
} from "~/components/Rewards/RewardStat";
import { formatZlto, rewardBalanceTone } from "~/lib/format/rewards";
import {
  deriveReferralCapacity,
  type ReferralCapacityStatus,
  type TreasuryZltoCapacity,
} from "~/lib/referral/rewardCapacity";
import type { ReferralProgramRewardFigures } from "./ReferralProgramRewardStats";

/**
 * One referral program's reward capacity compressed to a single row — the list counterpart to
 * `ReferralProgramRewardStats`, built for the Treasury Referrals tab which renders it N times.
 *
 * The programme's own pool and balance are **lifetime**; the "payable now" figure folds in the
 * Treasury's **current-financial-year** balance, because that is what actually caps the next
 * completion. Both scopes are on the labels — do not tidy them into one, they genuinely differ.
 *
 * Prop-driven: no router, no session, no query.
 */

/**
 * The row badge answers "is this programme paying out?" at a glance. It is driven by the **effective**
 * capacity, not the programme's own balance alone — a programme with a healthy pool of its own still
 * pays nothing when the Treasury is exhausted, and the row has to say so.
 */
const STATUS_BADGE: Record<
  ReferralCapacityStatus,
  { label: string; className: string } | null
> = {
  depleted: {
    label: "Awarding 0",
    className: "border border-red-200 bg-red-100 text-red-800",
  },
  constrained: {
    label: "Partial payouts",
    className: "border border-amber-200 bg-amber-100 text-amber-800",
  },
  unenforced: {
    label: "Uncapped",
    className: "border border-gray-300 bg-gray-100 text-gray-700",
  },
  healthy: null,
};

const STATUS_STAT_TONE: Record<ReferralCapacityStatus, RewardStatTone> = {
  depleted: "danger",
  constrained: "warning",
  unenforced: "default",
  healthy: "prominent",
};

export const ReferralProgramRewardSummaryRow: React.FC<{
  name: string;
  /** the programme image; falls back to the shared no-image placeholder */
  imageURL?: string | null;
  figures: ReferralProgramRewardFigures;
  /** the Treasury pools this programme draws from; omit to show the programme's figures alone */
  treasury?: TreasuryZltoCapacity | null;
  /** right-aligned on the row header — e.g. a status badge and a link to the programme */
  action?: ReactNode;
}> = ({ name, imageURL, figures, treasury, action }) => {
  const capacity = deriveReferralCapacity(figures, treasury);
  const badge = STATUS_BADGE[capacity.status];

  /** Only show the effective figure when a Treasury was supplied — never invent one. */
  const showPayableNow = !!treasury;

  return (
    <RewardStatGroup
      columns={showPayableNow ? 3 : 2}
      // the header identifies the programme, so the leading visual is its image
      icon={
        imageURL ? (
          <Image
            src={imageURL}
            alt={name ?? "Programme image"}
            width={30}
            height={30}
            className="shrink-0 rounded-lg object-cover shadow-md"
            style={{
              width: "30px",
              height: "30px",
              minWidth: "30px",
              minHeight: "30px",
            }}
          />
        ) : (
          // matches the image's 30px exactly, like the organisation row
          <div
            className="shrink-0 overflow-hidden rounded-lg shadow-md"
            style={{ width: "30px", height: "30px" }}
          >
            <NoImage iconOnly />
          </div>
        )
      }
      title={
        <span className="block overflow-hidden text-sm text-ellipsis whitespace-nowrap">
          {name}
        </span>
      }
      action={
        <div className="flex flex-row items-center gap-2">
          {badge && (
            <span
              className={`badge badge-sm !text-[11px] font-medium whitespace-nowrap ${badge.className}`}
            >
              {badge.label}
            </span>
          )}
          {action}
        </div>
      }
    >
      <RewardStat
        label="ZLTO pool"
        scope="lifetime"
        value={formatZlto(figures.zltoRewardPool)}
      />
      <RewardStat
        label="ZLTO remaining"
        scope="lifetime"
        value={formatZlto(figures.zltoRewardBalance)}
        // the programme's own balance keeps the shared reward tone, so it reads like every other
        // balance on the platform; the badge above carries the *effective* capacity instead
        tone={balanceStatTone(
          rewardBalanceTone(figures.zltoRewardBalance, figures.zltoRewardPool),
        )}
      />

      {showPayableNow && (
        <RewardStat
          label="Payable per completion"
          value={
            capacity.available === null
              ? "Uncapped"
              : formatZlto(capacity.available)
          }
          tooltip="The lower of the Treasury's remaining balance for this financial year and this programme's own remaining balance — what a single completion may draw right now. 'Uncapped' means neither level has a pool, so the configured rewards are paid in full."
          tone={STATUS_STAT_TONE[capacity.status]}
          note={
            capacity.target !== null && capacity.status !== "unenforced"
              ? `${formatZlto(capacity.target)} configured`
              : undefined
          }
        />
      )}
    </RewardStatGroup>
  );
};

export default ReferralProgramRewardSummaryRow;
