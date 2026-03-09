namespace Yoma.Core.Domain.Treasury.Models
{
  public sealed class TreasuryRequestUpdate
  {
    public byte FinancialYearStartMonth { get; set; }

    public byte FinancialYearStartDay { get; set; }

    public decimal? ZltoRewardPoolCurrentFinancialYear { get; set; }

    public decimal? ChimoneyPoolCurrentFinancialYearInUSD { get; set; }

    public decimal ConversionRateZltoUsd { get; set; }
  }
}
