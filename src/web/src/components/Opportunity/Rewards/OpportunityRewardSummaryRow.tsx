import type { ReactNode } from "react";
import { RewardStat, RewardStatGroup } from "~/components/Rewards/RewardStat";
import { formatYoma, formatZlto } from "~/lib/format/rewards";
import type { OpportunityOwnRewardFigures } from "./OpportunityRewardContext";

/**
 * One opportunity's reward figures compressed to a single row — the list counterpart to
 * `OpportunityRewardContext`, built for the Treasury Opportunities tab which renders it N times
 * under its organisation.
 *
 * Every figure here is **lifetime**: an opportunity's rewards are not reset by a financial-year
 * rollover. The organisation heading above these rows carries the financial-year figures, so the
 * scope suffixes are what keep the two readable side by side.
 *
 * Prop-driven: no router, no session, no query.
 */

export const OpportunityRewardSummaryRow: React.FC<{
  title: string;
  figures: OpportunityOwnRewardFigures;
  /** right-aligned on the row header — e.g. a link to the opportunity */
  action?: ReactNode;
}> = ({ title, figures, action }) => (
  <RewardStatGroup
    title={
      <span className="block overflow-hidden text-sm text-ellipsis whitespace-nowrap">
        {title}
      </span>
    }
    action={action}
    columns={4}
  >
    <RewardStat
      label="ZLTO per completion"
      value={formatZlto(figures.zltoReward)}
    />
    <RewardStat
      label="ZLTO awarded"
      scope="lifetime"
      value={formatZlto(figures.zltoRewardCumulative)}
    />
    <RewardStat
      label="Yoma per completion"
      value={formatYoma(figures.yomaReward)}
    />
    <RewardStat
      label="Yoma awarded"
      scope="lifetime"
      value={formatYoma(figures.yomaRewardCumulative)}
    />
  </RewardStatGroup>
);

export default OpportunityRewardSummaryRow;
