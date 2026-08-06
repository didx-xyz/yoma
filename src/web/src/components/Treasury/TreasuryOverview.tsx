import Image from "next/image";
import iconZlto from "public/images/icon-zlto.svg";
import { IoMdCalendar, IoMdSwap, IoMdWallet } from "react-icons/io";
import type { TreasuryInfo } from "~/api/models/treasury";
import DetailSection from "~/components/Common/DetailSection";
import FormMessage, { FormMessageType } from "~/components/Common/FormMessage";
import {
  balanceStatTone,
  RewardStat,
  RewardStatGroup,
} from "~/components/Rewards/RewardStat";
import {
  formatConversionRate,
  formatUsd,
  formatZlto,
  LABEL_PAYOUT_BALANCE_AVAILABLE,
  LABEL_PAYOUT_BALANCE_COMPLETED,
  rewardBalanceTone,
  TOOLTIP_PAYOUT_BALANCE_AVAILABLE,
  TOOLTIP_PAYOUT_BALANCE_COMPLETED,
} from "~/lib/format/rewards";
import { derivePayoutTotalPending } from "~/lib/treasury/payoutCommitment";
import {
  CONVERSION_EXAMPLE_ZLTO,
  previewZltoToUsd,
} from "~/lib/treasury/conversion";
import {
  formatFinancialYearConfig,
  formatFinancialYearStartDate,
} from "~/lib/treasury/financialYear";

/**
 * Treasury at a glance — the Overview tab: how much capacity is left for this financial year, and how
 * much has ever been given out.
 *
 * Every figure comes straight from `GET /treasury` — including the balances, which the API derives
 * (pool − cumulative for the current financial year). Nothing here is calculated from other fields
 * except the balance tone and the indicative conversion example.
 *
 * The "running low / exhausted" banners are NOT here: they render above the tabs
 * (TreasuryCapacityWarnings) so they are seen on the Manage tab too.
 */

const BALANCE_TOOLTIP =
  "The balance is the pool minus what has been awarded so far this financial year. It is calculated by the server.";

export const TreasuryOverview: React.FC<{ treasury: TreasuryInfo }> = ({
  treasury,
}) => {
  const zltoTone = rewardBalanceTone(
    treasury.zltoRewardBalanceCurrentFinancialYear,
    treasury.zltoRewardPoolCurrentFinancialYear,
  );
  /**
   * ⚠️ Capacity comes from the **available** balance, never the completed-only one. The completed-only
   * balance ignores payouts already in flight, so toning off it made this surface report "healthy"
   * while payouts were being refused.
   */
  const payoutTone = rewardBalanceTone(
    treasury.payoutBalanceAvailableCurrentFinancialYearInUsd,
    treasury.payoutPoolCurrentFinancialYearInUsd,
  );

  /** Says why the two balances differ, so the gap does not look like an error. */
  const payoutTotalPending = derivePayoutTotalPending(treasury);
  const pendingNote =
    payoutTotalPending && payoutTotalPending > 0
      ? `${formatUsd(payoutTotalPending)} in flight`
      : undefined;

  const rateConfigured = treasury.conversionRateZltoPerUsd > 0;
  const exampleUsd = rateConfigured
    ? previewZltoToUsd(
        CONVERSION_EXAMPLE_ZLTO,
        treasury.conversionRateZltoPerUsd,
      )
    : null;

  return (
    <div className="shadow-custom divide-gray-light flex flex-col divide-y rounded-lg bg-white p-4">
      {/* FINANCIAL YEAR */}
      <DetailSection
        title="Financial year"
        icon={<IoMdCalendar className="text-blue h-4 w-4" />}
      >
        <div className="mt-2 flex flex-col gap-1 text-sm">
          <div className="flex flex-row flex-wrap items-baseline gap-x-2">
            <span className="text-gray-dark">Started on</span>
            <span className="font-semibold">
              {formatFinancialYearStartDate(treasury.financialYearStartDate)}
            </span>
            <span className="text-xs text-gray-500">
              (starts{" "}
              {formatFinancialYearConfig(
                treasury.financialYearStartMonth,
                treasury.financialYearStartDay,
              )}{" "}
              each year)
            </span>
          </div>

          <p className="text-xs text-gray-500">
            Rollover happens automatically. When a new financial year begins,
            the Treasury&apos;s and every organisation&apos;s totals for the
            financial year reset to zero — all-time totals are kept.
          </p>
        </div>
      </DetailSection>

      {/* REWARD CAPACITY */}
      <DetailSection
        title="Reward capacity"
        icon={<IoMdWallet className="text-blue h-4 w-4" />}
      >
        <div className="mt-3 flex flex-col gap-4">
          <RewardStatGroup
            title="ZLTO rewards"
            icon={
              <Image
                src={iconZlto}
                alt=""
                aria-hidden={true}
                width={16}
                height={16}
                className="h-auto"
              />
            }
          >
            <RewardStat
              label="Reward pool"
              scope="financialYear"
              value={formatZlto(treasury.zltoRewardPoolCurrentFinancialYear)}
              tooltip="The total ZLTO the Treasury has allocated for this financial year. Organisations draw from it, and opportunities and referrals draw from them."
              note={
                treasury.zltoRewardPoolCurrentFinancialYear === null
                  ? "Not set — no ZLTO can be awarded"
                  : undefined
              }
            />
            <RewardStat
              label="Awarded"
              scope="financialYear"
              value={formatZlto(
                treasury.zltoRewardCumulativeCurrentFinancialYear,
              )}
              tooltip="ZLTO awarded since the start of this financial year. Resets to zero on rollover."
            />
            <RewardStat
              label="Remaining balance"
              scope="financialYear"
              value={formatZlto(treasury.zltoRewardBalanceCurrentFinancialYear)}
              tooltip={BALANCE_TOOLTIP}
              tone={balanceStatTone(zltoTone)}
            />
            <RewardStat
              label="Awarded"
              scope="lifetime"
              value={formatZlto(treasury.zltoRewardCumulative)}
              tooltip="ZLTO awarded across all financial years. Never reset."
            />
          </RewardStatGroup>

          {/* Five stats, because the two balances mean different things and both have to be
              readable. `columns={3}` keeps them from being squeezed to a single line each. */}
          <RewardStatGroup title="Payout (USD)" columns={3}>
            <RewardStat
              label="Payout pool"
              scope="financialYear"
              value={formatUsd(treasury.payoutPoolCurrentFinancialYearInUsd)}
              tooltip="The total value the Treasury has allocated to payouts for this financial year."
              note={
                treasury.payoutPoolCurrentFinancialYearInUsd === null
                  ? "Not set — no payouts can be completed"
                  : undefined
              }
            />
            <RewardStat
              label="Paid out"
              scope="financialYear"
              value={formatUsd(
                treasury.payoutCumulativeCurrentFinancialYearInUsd,
              )}
              tooltip="Payouts completed since the start of this financial year. Resets to zero on rollover."
            />
            <RewardStat
              label="Paid out"
              scope="lifetime"
              value={formatUsd(treasury.payoutCumulativeInUsd)}
              tooltip="Payouts completed across all financial years. Never reset."
            />

            {/* Demoted to a completed view: still visible, but plain-toned and explicitly not
                capacity, so it cannot be read as headroom. */}
            <RewardStat
              label={LABEL_PAYOUT_BALANCE_COMPLETED}
              scope="financialYear"
              value={formatUsd(treasury.payoutBalanceCurrentFinancialYearInUsd)}
              tooltip={TOOLTIP_PAYOUT_BALANCE_COMPLETED}
              note="Completed payouts only"
            />

            {/* The capacity figure — the one that carries the tone. */}
            <RewardStat
              label={LABEL_PAYOUT_BALANCE_AVAILABLE}
              value={formatUsd(
                treasury.payoutBalanceAvailableCurrentFinancialYearInUsd,
              )}
              tooltip={TOOLTIP_PAYOUT_BALANCE_AVAILABLE}
              tone={balanceStatTone(payoutTone)}
              note={pendingNote}
            />
          </RewardStatGroup>
        </div>
      </DetailSection>

      {/* CONVERSION RATE */}
      <DetailSection
        title="Conversion rate"
        icon={<IoMdSwap className="text-blue h-4 w-4" />}
      >
        <div className="mt-2 flex flex-col gap-1 text-sm">
          {rateConfigured ? (
            <>
              <span className="font-semibold">
                {formatConversionRate(treasury.conversionRateZltoPerUsd)} ZLTO ={" "}
                {formatUsd(treasury.conversionRateUsdAmount)}
              </span>
              <span className="text-xs text-gray-500">
                For example, {formatZlto(CONVERSION_EXAMPLE_ZLTO)} ZLTO is worth
                approximately {formatUsd(exampleUsd)}. Payout values are
                indicative — the final value is determined at payout.
              </span>
            </>
          ) : (
            <FormMessage messageType={FormMessageType.Warning}>
              No conversion rate is configured, so ZLTO cannot be valued for
              payout. Set one under Manage.
            </FormMessage>
          )}
        </div>
      </DetailSection>
    </div>
  );
};

export default TreasuryOverview;
