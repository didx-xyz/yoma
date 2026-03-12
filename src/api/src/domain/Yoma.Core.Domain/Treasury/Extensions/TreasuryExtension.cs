namespace Yoma.Core.Domain.Treasury.Extensions
{
  public static class TreasuryExtension
  {
    public static Models.TreasuryInfo ToInfo(this Models.Treasury value)
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
        ChimoneyPoolCurrentFinancialYearInUSD = value.ChimoneyPoolCurrentFinancialYearInUSD,
        ChimoneyCumulativeInUSD = value.ChimoneyCumulativeInUSD,
        ChimoneyCumulativeCurrentFinancialYearInUSD = value.ChimoneyCumulativeCurrentFinancialYearInUSD,
        ChimoneyBalanceCurrentFinancialYearInUSD = value.ChimoneyBalanceCurrentFinancialYearInUSD,
        ConversionRateZltoUsd = value.ConversionRateZltoUsd
      };
    }
  }
}
