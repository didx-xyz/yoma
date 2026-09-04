import Image from "next/image";
import type { ReactNode } from "react";
import type { OrganizationRewardFigures } from "~/api/models/organisation";
import { NoImage } from "~/components/Common/NoImage";
import {
  balanceStatTone,
  RewardStat,
  RewardStatGroup,
} from "~/components/Rewards/RewardStat";
import {
  formatZlto,
  rewardBalanceTone,
  type RewardBalanceTone,
} from "~/lib/format/rewards";

/**
 * One organisation's reward capacity, compressed to a single row: what the pool holds and what is
 * left of it. The list counterpart to `OrganizationRewardStats` (which shows all four figures and is
 * used where there is room — the org page and the edit dialog).
 *
 * Built for the Treasury Organisations tab, which renders it N times. Prop-driven: no router, no
 * session, no query.
 */

const TONE_BADGE: Record<
  RewardBalanceTone,
  { label: string; className: string } | null
> = {
  depleted: {
    label: "Exhausted",
    className: "border border-red-200 bg-red-100 text-red-800",
  },
  low: {
    label: "Running low",
    className: "border border-amber-200 bg-amber-100 text-amber-800",
  },
  unset: {
    label: "No pool set",
    className: "border border-gray-300 bg-gray-100 text-gray-700",
  },
  healthy: null,
};

/**
 * One badge per organisation, so a row reads at a glance. ZLTO is the only pool, so this is simply
 * its tone — it used to be the worst of two.
 */
const summaryTone = (figures: OrganizationRewardFigures): RewardBalanceTone =>
  rewardBalanceTone(
    figures.zltoRewardBalanceCurrentFinancialYear,
    figures.zltoRewardPoolCurrentFinancialYear,
  );

export const OrganizationRewardSummaryRow: React.FC<{
  name: string;
  /** the organisation's logo; falls back to the shared no-image placeholder */
  logoURL?: string | null;
  figures: OrganizationRewardFigures;
  /** right-aligned on the row header — e.g. an "Edit pools" button */
  action?: ReactNode;
}> = ({ name, logoURL, figures, action }) => {
  const tone = summaryTone(figures);
  const badge = TONE_BADGE[tone];

  return (
    <RewardStatGroup
      // two stats, so a 2-column grid — the default 4 would leave half the row empty
      columns={2}
      // the header identifies the organisation, so the leading visual is its logo
      icon={
        logoURL ? (
          <Image
            src={logoURL}
            alt={name ?? "Organisation logo"}
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
          // matches the logo's 30px exactly — at 60px a logo-less organisation rendered a
          // placeholder twice the size of every real logo in the list
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
        scope="financialYear"
        value={formatZlto(figures.zltoRewardPoolCurrentFinancialYear)}
      />
      <RewardStat
        label="ZLTO remaining"
        scope="financialYear"
        value={formatZlto(figures.zltoRewardBalanceCurrentFinancialYear)}
        // the badge and the stat now read the same pool, so they share one tone
        tone={balanceStatTone(tone)}
      />
    </RewardStatGroup>
  );
};

export default OrganizationRewardSummaryRow;
