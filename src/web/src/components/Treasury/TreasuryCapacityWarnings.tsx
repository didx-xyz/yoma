import type { TreasuryInfo } from "~/api/models/treasury";
import FormMessage, { FormMessageType } from "~/components/Common/FormMessage";
import {
  formatUsd,
  formatZlto,
  rewardBalanceTone,
  type RewardBalanceTone,
} from "~/lib/format/rewards";

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
}> = ({ tone, label, balance, pool, percent, exhaustedConsequence }) => {
  if (tone === "depleted")
    return (
      <FormMessage messageType={FormMessageType.Error}>
        <strong>{label} is exhausted.</strong> {exhaustedConsequence} Increase
        the pool under Manage to restore capacity for the rest of this financial
        year.
      </FormMessage>
    );

  if (tone === "low")
    return (
      <FormMessage messageType={FormMessageType.Warning}>
        <strong>{label} is running low.</strong> {balance} of {pool} left
        {percent ? ` (${percent})` : ""} for this financial year.
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
  const cashOutTone = rewardBalanceTone(
    treasury.cashOutBalanceCurrentFinancialYearInUsd,
    treasury.cashOutPoolCurrentFinancialYearInUsd,
  );

  const needsAttention = (tone: RewardBalanceTone) =>
    tone === "low" || tone === "depleted";

  if (!needsAttention(zltoTone) && !needsAttention(cashOutTone)) return null;

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
        tone={cashOutTone}
        label="The cash-out pool"
        balance={formatUsd(treasury.cashOutBalanceCurrentFinancialYearInUsd)}
        pool={formatUsd(treasury.cashOutPoolCurrentFinancialYearInUsd)}
        percent={percentRemaining(
          treasury.cashOutBalanceCurrentFinancialYearInUsd,
          treasury.cashOutPoolCurrentFinancialYearInUsd,
        )}
        exhaustedConsequence="No further cash-outs can be completed."
      />
    </div>
  );
};

export default TreasuryCapacityWarnings;
