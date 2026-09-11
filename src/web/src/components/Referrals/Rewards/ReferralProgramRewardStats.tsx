import Image from "next/image";
import iconZlto from "public/images/icon-zlto.svg";
import type { ProgramRewardEstimate } from "~/api/models/referrals";
import {
  balanceStatTone,
  RewardStat,
  RewardStatGroup,
  type RewardStatTone,
} from "~/components/Rewards/RewardStat";
import TreasuryZltoRewardStats, {
  type TreasuryZltoRewardFigures,
} from "~/components/Treasury/TreasuryZltoRewardStats";
import {
  formatZlto,
  formatZltoRange,
  rewardBalanceTone,
} from "~/lib/format/rewards";
import {
  rewardEstimateMeta,
  type ProgramZltoCapacity,
  type RewardEstimateTone,
} from "~/lib/referral/rewardCapacity";

/**
 * A referral program's ZLTO reward figures, next to the Treasury capacity they are capped by.
 *
 * The scope distinction is the whole point of the layout, exactly as on the opportunity block:
 * **a program's own figures are lifetime** and never reset, while the **Treasury's pools are
 * current-financial-year** and are zeroed on rollover. Two groups, each label carrying its scope
 * through `RewardStat`.
 *
 * The Treasury half is `TreasuryZltoRewardStats` verbatim — the same component the Treasury Overview
 * uses — so a figure shown here cannot drift from the same figure shown there.
 *
 * ⚠️ Prop-driven, no router / session / query: it renders on the program info page and in the
 * Treasury Referrals tab's detail view. See the working plan's "`/admin/treasury` IS THE AGGREGATION
 * POINT".
 *
 * ⚠️ Referral rewards are **ZLTO, capped by the Treasury's ZLTO reward pool** — never by the USD
 * payout pool. The payout figures have no business on this surface.
 */

export interface ReferralProgramRewardFigures extends ProgramZltoCapacity {
  zltoRewardCumulative: number | null;
  zltoRewardEstimate: ProgramRewardEstimate | null;
}

/**
 * The estimate tones are a strict subset of the stat tones — the estimate is never the "prominent"
 * headline figure, that is the balance.
 */
const ESTIMATE_STAT_TONE: Record<RewardEstimateTone, RewardStatTone> = {
  default: "default",
  warning: "warning",
  danger: "danger",
};

const ZltoIcon = () => (
  <Image
    src={iconZlto}
    alt=""
    aria-hidden={true}
    width={16}
    height={16}
    className="h-auto"
  />
);

export const ReferralProgramRewardStats: React.FC<{
  figures: ReferralProgramRewardFigures;
  /** the Treasury pools this program draws from; omit when they are unavailable to the caller */
  treasury?: TreasuryZltoRewardFigures | null;
  className?: string;
}> = ({ figures, treasury, className = "flex flex-col gap-4" }) => {
  const balanceTone = rewardBalanceTone(
    figures.zltoRewardBalance,
    figures.zltoRewardPool,
  );

  const estimate = figures.zltoRewardEstimate;

  const referrerMeta = rewardEstimateMeta(
    figures.zltoRewardReferrer,
    estimate?.referrer,
  );
  const refereeMeta = rewardEstimateMeta(
    figures.zltoRewardReferee,
    estimate?.referee,
  );

  /** The pathway range is only meaningful when the program actually has a pathway with rewards. */
  const hasPathwayEstimate =
    estimate != null &&
    (estimate.refereePathwayMinimum != null ||
      estimate.refereePathwayMaximum != null ||
      estimate.refereeTotalMinimum != null ||
      estimate.refereeTotalMaximum != null);

  return (
    <div className={className}>
      {/* Five stats, so a 3-column grid: the configured amounts read as a row, the pool figures
          below them. */}
      <RewardStatGroup
        title="This referral programme"
        icon={<ZltoIcon />}
        columns={3}
      >
        <RewardStat
          label="Ambassador reward"
          value={formatZlto(figures.zltoRewardReferrer)}
          tooltip="What one ambassador receives when a referee they referred completes the programme. Not a total."
          note={
            figures.zltoRewardReferrer === null
              ? "No ambassador reward"
              : undefined
          }
        />
        <RewardStat
          label="Referee reward"
          value={formatZlto(figures.zltoRewardReferee)}
          tooltip="What one referee receives for completing the programme. Paid before the ambassador when the pool cannot cover both."
          note={
            figures.zltoRewardReferee === null ? "No referee reward" : undefined
          }
        />
        <RewardStat
          label="Reward pool"
          scope="lifetime"
          value={formatZlto(figures.zltoRewardPool)}
          tooltip="A cap on the total ZLTO this programme may award, for its whole lifetime. Not reset by a financial-year rollover."
          note={
            figures.zltoRewardPool === null
              ? "Not set — this programme has no pool of its own"
              : undefined
          }
        />
        <RewardStat
          label="Awarded"
          scope="lifetime"
          value={formatZlto(figures.zltoRewardCumulative)}
          tooltip="Total ZLTO this programme has awarded to ambassadors and referees combined, across all financial years. Never reset."
        />
        <RewardStat
          label="Remaining balance"
          scope="lifetime"
          value={formatZlto(figures.zltoRewardBalance)}
          tooltip="The programme's own pool minus what it has awarded, all-time. Calculated by the server."
          tone={balanceStatTone(balanceTone)}
        />
      </RewardStatGroup>

      {/* What the API says it would pay right now, after both pools are applied. */}
      <RewardStatGroup
        title="Payable now"
        icon={<ZltoIcon />}
        columns={hasPathwayEstimate ? 4 : 2}
      >
        <RewardStat
          label="Ambassador"
          value={formatZlto(estimate?.referrer)}
          tooltip="What the ambassador would receive if a referral completed right now, after the Treasury and programme pools are applied. The referee is funded first."
          tone={ESTIMATE_STAT_TONE[referrerMeta.tone]}
          note={referrerMeta.note}
        />
        <RewardStat
          label="Referee"
          value={formatZlto(estimate?.referee)}
          tooltip="What the referee would receive if a referral completed right now, after the Treasury and programme pools are applied. The referee has priority over the ambassador."
          tone={ESTIMATE_STAT_TONE[refereeMeta.tone]}
          note={refereeMeta.note}
        />

        {hasPathwayEstimate && (
          <>
            <RewardStat
              label="Referee pathway"
              value={formatZltoRange(
                estimate?.refereePathwayMinimum,
                estimate?.refereePathwayMaximum,
              )}
              tooltip="Estimated ZLTO from completing the pathway's opportunities. Separate from the programme-level referee reward, and shown as a range from the shortest to the longest completion route."
            />
            <RewardStat
              label="Referee total"
              value={formatZltoRange(
                estimate?.refereeTotalMinimum,
                estimate?.refereeTotalMaximum,
              )}
              tooltip="The referee's programme reward plus the pathway estimate, as a minimum-to-maximum range."
            />
          </>
        )}
      </RewardStatGroup>

      {/* The level above: a referral completion draws from the Treasury's ZLTO pool first, then this
          programme's own. Omitted rather than faked when the caller has no Treasury. */}
      {!!treasury && (
        <div className="flex flex-col gap-2">
          <p className="text-gray-dark text-xs">
            What the Treasury can award this financial year. Every referral
            completion draws from this pool first, then from the
            programme&apos;s own.
          </p>

          <TreasuryZltoRewardStats figures={treasury} />
        </div>
      )}
    </div>
  );
};

export default ReferralProgramRewardStats;
