import Image from "next/image";
import iconZlto from "public/images/icon-zlto.svg";
import type { OrganizationRewardFigures } from "~/api/models/organisation";
import {
  balanceStatTone,
  RewardStat,
  RewardStatGroup,
} from "~/components/Rewards/RewardStat";
import { formatZlto, rewardBalanceTone } from "~/lib/format/rewards";

/**
 * An organisation's reward capacity, read-only: this financial year's ZLTO pool, what has been
 * awarded, what is left, and the all-time total.
 *
 * ⚠️ Built to render in **three homes** — the organisation edit page's Reward step, the organisation
 * info page, and the Treasury Organisations tab. It therefore takes its figures as a prop and reads
 * nothing from the router, the session or a query. Keep it that way (see the working plan's
 * "`/admin/treasury` IS THE AGGREGATION POINT").
 *
 * ZLTO is the only reward asset — the Yoma reward capability was removed server-side (API
 * `f051dfd8`), which is why this is a single group rather than two.
 *
 * The balance comes from the API (`Organization.cs:83`) — `null` when no pool is set, never computed
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
  /**
   * stat columns — 4 side by side on wide layouts, 2 (a 2×2 block) when the group sits in a narrow
   * slot. The four stats divide evenly either way, so neither setting strands one on its own row.
   */
  columns?: 2 | 4;
}> = ({ figures, columns = 4 }) => {
  const zltoTone = rewardBalanceTone(
    figures.zltoRewardBalanceCurrentFinancialYear,
    figures.zltoRewardPoolCurrentFinancialYear,
  );

  return (
    <RewardStatGroup title="ZLTO rewards" icon={<ZltoIcon />} columns={columns}>
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
  );
};

export default OrganizationRewardStats;
