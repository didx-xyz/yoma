import Image from "next/image";
import iconZlto from "public/images/icon-zlto.svg";
import type { OrganizationRewardFigures } from "~/api/models/organisation";
import OrganizationRewardStats from "~/components/Organisation/Rewards/OrganizationRewardStats";
import { RewardStat, RewardStatGroup } from "~/components/Rewards/RewardStat";
import { formatYoma, formatZlto } from "~/lib/format/rewards";

/**
 * An opportunity's reward figures next to the capacity of the organisation that owns it.
 *
 * The whole point of this block is the scope distinction, which is the easiest thing to get wrong on
 * this surface: **an opportunity's own figures are lifetime** and never reset, while the
 * **organisation's pools are current-financial-year** and are zeroed on rollover. They are therefore
 * rendered as two separate groups, each label carrying its scope through `RewardStat`.
 *
 * The organisation half is `OrganizationRewardStats` verbatim — the same component the organisation
 * page and the Treasury Organisations tab use — so a figure shown here cannot drift from the same
 * figure shown there.
 *
 * ⚠️ Prop-driven, no router / session / query, because it renders in more than one home (the
 * opportunity admin detail page and, in compact form, the Treasury Opportunities tab). See the
 * working plan's "`/admin/treasury` IS THE AGGREGATION POINT".
 */

/**
 * An opportunity's own reward figures, all **lifetime**.
 *
 * `pool` and `balance` are only present on the admin detail payload (`Opportunity`); the info
 * payload (`OpportunityInfo`, which most surfaces fetch) carries the per-completion reward and the
 * cumulative but not the pool — hence optional. Undefined renders as "—", never as 0.
 */
export interface OpportunityOwnRewardFigures {
  /** ZLTO a youth receives for completing this opportunity, once */
  zltoReward: number | null;
  /** total ZLTO this opportunity has awarded, all-time */
  zltoRewardCumulative: number | null;
  zltoRewardPool?: number | null;
  zltoRewardBalance?: number | null;
  yomaReward: number | null;
  yomaRewardCumulative: number | null;
  yomaRewardPool?: number | null;
  yomaRewardBalance?: number | null;
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

export const OpportunityRewardContext: React.FC<{
  own: OpportunityOwnRewardFigures;
  /** the owning organisation's current-financial-year capacity */
  organisation: OrganizationRewardFigures;
  organisationName?: string | null;
  columns?: 2 | 4;
  className?: string;
}> = ({
  own,
  organisation,
  organisationName,
  columns = 4,
  className = "flex flex-col gap-4",
}) => {
  /** The pool is opportunity-level and optional, so only offer it when the payload has it. */
  const hasOwnPool =
    own.zltoRewardPool !== undefined || own.yomaRewardPool !== undefined;

  return (
    <div className={className}>
      <RewardStatGroup
        title="This opportunity"
        icon={<ZltoIcon />}
        columns={columns}
      >
        <RewardStat
          label="ZLTO per completion"
          value={formatZlto(own.zltoReward)}
          tooltip="What one youth receives for completing this opportunity. Not a total."
          note={own.zltoReward === null ? "No ZLTO reward" : undefined}
        />
        <RewardStat
          label="ZLTO awarded"
          scope="lifetime"
          value={formatZlto(own.zltoRewardCumulative)}
          tooltip="Total ZLTO this opportunity has awarded across all financial years. Never reset."
        />
        <RewardStat
          label="Yoma per completion"
          value={formatYoma(own.yomaReward)}
          tooltip="What one youth receives for completing this opportunity. Not a total."
          note={own.yomaReward === null ? "No Yoma reward" : undefined}
        />
        <RewardStat
          label="Yoma awarded"
          scope="lifetime"
          value={formatYoma(own.yomaRewardCumulative)}
          tooltip="Total Yoma rewards this opportunity has awarded across all financial years. Never reset."
        />

        {/* Only on the admin detail payload. Deliberately labelled lifetime: unlike the
            organisation's pools, an opportunity's own pool is not reset by a financial-year
            rollover. */}
        {hasOwnPool && (
          <>
            <RewardStat
              label="ZLTO reward pool"
              scope="lifetime"
              value={formatZlto(own.zltoRewardPool)}
              tooltip="A cap on the total ZLTO this opportunity may award, for its whole lifetime. Not reset by a financial-year rollover."
              note={
                own.zltoRewardPool === null ? "No cap — unlimited" : undefined
              }
            />
            <RewardStat
              label="ZLTO remaining"
              scope="lifetime"
              value={formatZlto(own.zltoRewardBalance)}
              tooltip="The opportunity's own pool minus what it has awarded, all-time."
            />
            <RewardStat
              label="Yoma reward pool"
              scope="lifetime"
              value={formatYoma(own.yomaRewardPool)}
              tooltip="A cap on the total Yoma rewards this opportunity may award, for its whole lifetime. Not reset by a financial-year rollover."
              note={
                own.yomaRewardPool === null ? "No cap — unlimited" : undefined
              }
            />
            <RewardStat
              label="Yoma remaining"
              scope="lifetime"
              value={formatYoma(own.yomaRewardBalance)}
              tooltip="The opportunity's own pool minus what it has awarded, all-time."
            />
          </>
        )}
      </RewardStatGroup>

      <div className="flex flex-col gap-2">
        <p className="text-gray-dark text-xs">
          {organisationName
            ? `What ${organisationName} can award this financial year. This opportunity draws from these pools.`
            : "What the owning organisation can award this financial year. This opportunity draws from these pools."}
        </p>

        <OrganizationRewardStats figures={organisation} columns={columns} />
      </div>
    </div>
  );
};

export default OpportunityRewardContext;
