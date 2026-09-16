import type { TreasuryInfo } from "~/api/models/treasury";
import FormMessage, { FormMessageType } from "~/components/Common/FormMessage";
import {
  formatUsd,
  formatZlto,
  rewardBalanceTone,
  type RewardBalanceTone,
} from "~/lib/format/rewards";
import { derivePayoutTotalPending } from "~/lib/treasury/payoutCommitment";

/**
 * "You are about to run out" — the one thing on this page that an admin must not miss, so it renders
 * above the tab content on **both** tabs: on Overview because that is where capacity is read, and on
 * Manage because that is where it gets fixed.
 *
 * Renders nothing while both pools are healthy or unset.
 */

const percentRemaining = (
  balance: number | null,
  pool: number | null,
): string => {
  if (!pool || pool <= 0 || balance === null) return "";
  const percent = Math.max(0, Math.round((balance / pool) * 100));
  return `${percent}%`;
};

const CapacityWarning: React.FC<{
  tone: RewardBalanceTone;
  label: string;
  balance: string;
  pool: string;
  percent: string;
  exhaustedConsequence: string;
  /** extra sentence explaining the figure — e.g. that payouts in flight are holding funds */
  detail?: string;
}> = ({
  tone,
  label,
  balance,
  pool,
  percent,
  exhaustedConsequence,
  detail,
}) => {
  if (tone === "depleted")
    return (
      <FormMessage messageType={FormMessageType.Error}>
        <strong>{label} is exhausted.</strong> {exhaustedConsequence}
        {detail ? ` ${detail}` : ""} Increase the pool under Manage to restore
        capacity for the rest of this financial year.
      </FormMessage>
    );

  if (tone === "low")
    return (
      <FormMessage messageType={FormMessageType.Warning}>
        <strong>{label} is running low.</strong> {balance} of {pool} left
        {percent ? ` (${percent})` : ""} for this financial year.
        {detail ? ` ${detail}` : ""}
      </FormMessage>
    );

  return null;
};

export const TreasuryCapacityWarnings: React.FC<{
  treasury: TreasuryInfo;
}> = ({ treasury }) => {
  const zltoTone = rewardBalanceTone(
    treasury.zltoRewardBalanceCurrentFinancialYear,
    treasury.zltoRewardPoolCurrentFinancialYear,
  );
  /**
   * ⚠️ The **available** balance, not the completed-only one. Payouts in flight are already
   * committed, so warning off the completed-only balance let this banner stay silent while new
   * payouts were being refused for lack of funds.
   */
  const payoutTone = rewardBalanceTone(
    treasury.payoutBalanceAvailableCurrentFinancialYearInUsd,
    treasury.payoutPoolCurrentFinancialYearInUsd,
  );

  /**
   * Without this, an admin comparing the banner against the "Remaining balance" stat sees two
   * different numbers and no reason for the gap.
   */
  const payoutTotalPending = derivePayoutTotalPending(treasury);
  const payoutDetail =
    payoutTotalPending && payoutTotalPending > 0
      ? `${formatUsd(payoutTotalPending)} is held by payouts already in flight.`
      : undefined;

  const needsAttention = (tone: RewardBalanceTone) =>
    tone === "low" || tone === "depleted";

  if (!needsAttention(zltoTone) && !needsAttention(payoutTone)) return null;

  return (
    <div className="flex flex-col gap-2">
      <CapacityWarning
        tone={zltoTone}
        label="The ZLTO reward pool"
        balance={formatZlto(treasury.zltoRewardBalanceCurrentFinancialYear)}
        pool={formatZlto(treasury.zltoRewardPoolCurrentFinancialYear)}
        percent={percentRemaining(
          treasury.zltoRewardBalanceCurrentFinancialYear,
          treasury.zltoRewardPoolCurrentFinancialYear,
        )}
        exhaustedConsequence="No further ZLTO rewards can be awarded for any organisation, opportunity or referral."
      />

      <CapacityWarning
        tone={payoutTone}
        label="The payout pool"
        balance={formatUsd(
          treasury.payoutBalanceAvailableCurrentFinancialYearInUsd,
        )}
        pool={formatUsd(treasury.payoutPoolCurrentFinancialYearInUsd)}
        percent={percentRemaining(
          treasury.payoutBalanceAvailableCurrentFinancialYearInUsd,
          treasury.payoutPoolCurrentFinancialYearInUsd,
        )}
        exhaustedConsequence="No further payouts can be started."
        detail={payoutDetail}
      />
    </div>
  );
};

export default TreasuryCapacityWarnings;
