namespace Yoma.Core.Domain.Treasury.Extensions
{
  public static class TreasuryExtension
  {
    public static Models.TreasuryInfo ToInfo(this Models.Treasury value, decimal payoutTotalPending)
    {
      ArgumentNullException.ThrowIfNull(value, nameof(value));

      return new Models.TreasuryInfo
      {
        FinancialYearStartMonth = value.FinancialYearStartMonth,
        FinancialYearStartDay = value.FinancialYearStartDay,
        FinancialYearStartDate = value.FinancialYearStartDate,
        ZltoRewardPoolCurrentFinancialYear = value.ZltoRewardPoolCurrentFinancialYear,
        ZltoRewardCumulative = value.ZltoRewardCumulative,
        ZltoRewardCumulativeCurrentFinancialYear = value.ZltoRewardCumulativeCurrentFinancialYear,
        ZltoRewardBalanceCurrentFinancialYear = value.ZltoRewardBalanceCurrentFinancialYear,
        PayoutPoolCurrentFinancialYearInUsd = value.PayoutPoolCurrentFinancialYearInUsd,
        PayoutCumulativeInUsd = value.PayoutCumulativeInUsd,
        PayoutCumulativeCurrentFinancialYearInUsd = value.PayoutCumulativeCurrentFinancialYearInUsd,
        PayoutBalanceCurrentFinancialYearInUsd = value.PayoutBalanceCurrentFinancialYearInUsd,
        PayoutBalanceAvailableCurrentFinancialYearInUsd = value.CalculatePayoutBalanceAvailableCurrentFinancialYearInUsd(payoutTotalPending),
        ConversionRateZltoUsd = value.ConversionRateZltoUsd
      };
    }

    /// <summary>
    /// Calculates the payout balance available: current payout balance less the total pending payouts.
    /// Rewards need no equivalent because their cumulative increases when scheduled and Yoma controls their processing retries.
    /// </summary>
    public static decimal? CalculatePayoutBalanceAvailableCurrentFinancialYearInUsd(this Models.Treasury value, decimal payoutTotalPending)
    {
      ArgumentNullException.ThrowIfNull(value, nameof(value));

      if (payoutTotalPending < 0m)
        throw new ArgumentOutOfRangeException(nameof(payoutTotalPending));

      return value.PayoutBalanceCurrentFinancialYearInUsd.HasValue
        ? value.PayoutBalanceCurrentFinancialYearInUsd.Value - payoutTotalPending
        : null;
    }
  }
}
