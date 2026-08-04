import Image from "next/image";
import iconZlto from "public/images/icon-zlto.svg";
import type { OrganizationRewardFigures } from "~/api/models/organisation";
import {
  balanceStatTone,
  RewardStat,
  RewardStatGroup,
} from "~/components/Rewards/RewardStat";
import {
  formatYoma,
  formatZlto,
  rewardBalanceTone,
} from "~/lib/format/rewards";

/**
 * An organisation's reward capacity, read-only: ZLTO and Yoma, each with this financial year's pool,
 * what has been awarded, what is left, and the all-time total.
 *
 * ⚠️ Built to render in **three homes** — the organisation edit page's Reward step, the organisation
 * info page, and the Treasury Organisations tab. It therefore takes its figures as a prop and reads
 * nothing from the router, the session or a query. Keep it that way (see the working plan's
 * "`/admin/treasury` IS THE AGGREGATION POINT").
 *
 * Balances come from the API (`Organization.cs:83,91`) — `null` when no pool is set, never computed
 * here.
 */

const BALANCE_TOOLTIP =
  "The balance is the pool minus what has been awarded so far this financial year. It is calculated by the server.";

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

export const OrganizationRewardStats: React.FC<{
  figures: OrganizationRewardFigures;
  /** stat columns per group — 4 side by side on wide layouts, 2 when the group is in a narrow slot */
  columns?: 2 | 4;
  className?: string;
}> = ({ figures, columns = 4, className = "flex flex-col gap-4" }) => {
  const zltoTone = rewardBalanceTone(
    figures.zltoRewardBalanceCurrentFinancialYear,
    figures.zltoRewardPoolCurrentFinancialYear,
  );
  const yomaTone = rewardBalanceTone(
    figures.yomaRewardBalanceCurrentFinancialYear,
    figures.yomaRewardPoolCurrentFinancialYear,
  );

  return (
    <div className={className}>
      <RewardStatGroup
        title="ZLTO rewards"
        icon={<ZltoIcon />}
        columns={columns}
      >
        <RewardStat
          label="Reward pool"
          scope="financialYear"
          value={formatZlto(figures.zltoRewardPoolCurrentFinancialYear)}
          tooltip="The ZLTO this organisation can award this financial year. It draws from the Treasury pool, and its opportunities draw from it."
          note={
            figures.zltoRewardPoolCurrentFinancialYear === null
              ? "Not set — no ZLTO can be awarded"
              : undefined
          }
        />
        <RewardStat
          label="Awarded"
          scope="financialYear"
          value={formatZlto(figures.zltoRewardCumulativeCurrentFinancialYear)}
          tooltip="ZLTO this organisation has awarded since the start of this financial year. Resets to zero on rollover."
        />
        <RewardStat
          label="Remaining balance"
          scope="financialYear"
          value={formatZlto(figures.zltoRewardBalanceCurrentFinancialYear)}
          tooltip={BALANCE_TOOLTIP}
          tone={balanceStatTone(zltoTone)}
        />
        <RewardStat
          label="Awarded"
          scope="lifetime"
          value={formatZlto(figures.zltoRewardCumulative)}
          tooltip="ZLTO this organisation has awarded across all financial years. Never reset."
        />
      </RewardStatGroup>

      <RewardStatGroup title="Yoma rewards" columns={columns}>
        <RewardStat
          label="Reward pool"
          scope="financialYear"
          value={formatYoma(figures.yomaRewardPoolCurrentFinancialYear)}
          tooltip="The Yoma rewards this organisation can award this financial year."
          note={
            figures.yomaRewardPoolCurrentFinancialYear === null
              ? "Not set — no Yoma rewards can be awarded"
              : undefined
          }
        />
        <RewardStat
          label="Awarded"
          scope="financialYear"
          value={formatYoma(figures.yomaRewardCumulativeCurrentFinancialYear)}
          tooltip="Yoma rewards awarded since the start of this financial year. Resets to zero on rollover."
        />
        <RewardStat
          label="Remaining balance"
          scope="financialYear"
          value={formatYoma(figures.yomaRewardBalanceCurrentFinancialYear)}
          tooltip={BALANCE_TOOLTIP}
          tone={balanceStatTone(yomaTone)}
        />
        <RewardStat
          label="Awarded"
          scope="lifetime"
          value={formatYoma(figures.yomaRewardCumulative)}
          tooltip="Yoma rewards awarded across all financial years. Never reset."
        />
      </RewardStatGroup>
    </div>
  );
};

export default OrganizationRewardStats;
