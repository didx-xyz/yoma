import Image from "next/image";
import iconZlto from "public/images/icon-zlto.svg";
import {
  balanceStatTone,
  RewardStat,
  RewardStatGroup,
} from "~/components/Rewards/RewardStat";
import { formatZlto, rewardBalanceTone } from "~/lib/format/rewards";

/**
 * The Treasury's ZLTO reward capacity for this financial year — the top of the reward hierarchy.
 *
 * ⚠️ Built for **two homes** and prop-driven: the Treasury Overview tab, and the referral surfaces,
 * where a program's rewards are capped by this pool and the admin needs both figures on one screen.
 * Extracted from `TreasuryOverview` when the referral surfaces needed it, precisely so the same four
 * figures cannot be labelled two ways.
 *
 * All four values are **current financial year** and are zeroed on rollover, except the all-time
 * cumulative. The balance is server-derived (pool − cumulative), `null` when no pool is set.
 */

const BALANCE_TOOLTIP =
  "The balance is the pool minus what has been awarded so far this financial year. It is calculated by the server.";

/**
 * ⚠️ A pool of `null` is **not** a block — the server only applies a level's cap when that level has
 * a pool, so no pool means rewards are paid in full and uncapped. Saying "no ZLTO can be awarded"
 * here would be the exact inverse of what happens.
 */
const POOL_UNSET_NOTE = "Not set — ZLTO rewards are not capped by the Treasury";

export interface TreasuryZltoRewardFigures {
  zltoRewardPoolCurrentFinancialYear: number | null;
  zltoRewardCumulativeCurrentFinancialYear: number | null;
  zltoRewardCumulative: number | null;
  zltoRewardBalanceCurrentFinancialYear: number | null;
}

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

export const TreasuryZltoRewardStats: React.FC<{
  figures: TreasuryZltoRewardFigures;
  /** the four stats divide evenly by both 2 and 4, so neither setting strands one on its own row */
  columns?: 2 | 4;
}> = ({ figures, columns = 4 }) => {
  const tone = rewardBalanceTone(
    figures.zltoRewardBalanceCurrentFinancialYear,
    figures.zltoRewardPoolCurrentFinancialYear,
  );

  return (
    <RewardStatGroup title="ZLTO rewards" icon={<ZltoIcon />} columns={columns}>
      <RewardStat
        label="Reward pool"
        scope="financialYear"
        value={formatZlto(figures.zltoRewardPoolCurrentFinancialYear)}
        tooltip="The total ZLTO the Treasury has allocated for this financial year. Organisations draw from it, and opportunities and referrals draw from them."
        note={
          figures.zltoRewardPoolCurrentFinancialYear === null
            ? POOL_UNSET_NOTE
            : undefined
        }
      />
      <RewardStat
        label="Awarded"
        scope="financialYear"
        value={formatZlto(figures.zltoRewardCumulativeCurrentFinancialYear)}
        tooltip="ZLTO awarded since the start of this financial year. Resets to zero on rollover."
      />
      <RewardStat
        label="Remaining balance"
        scope="financialYear"
        value={formatZlto(figures.zltoRewardBalanceCurrentFinancialYear)}
        tooltip={BALANCE_TOOLTIP}
        tone={balanceStatTone(tone)}
      />
      <RewardStat
        label="Awarded"
        scope="lifetime"
        value={formatZlto(figures.zltoRewardCumulative)}
        tooltip="ZLTO awarded across all financial years. Never reset."
      />
    </RewardStatGroup>
  );
};

export default TreasuryZltoRewardStats;
