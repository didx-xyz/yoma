namespace Yoma.Core.Domain.Treasury.Models
{
  public sealed class TreasuryRequestUpdate
  {
    public byte FinancialYearStartMonth { get; set; }

    public byte FinancialYearStartDay { get; set; }

    public decimal? ZltoRewardPoolCurrentFinancialYear { get; set; }

    public decimal? ChimoneyPoolCurrentFinancialYearInUSD { get; set; }

    /// <summary>
    /// Number of ZLTO equivalent to 1 USD (e.g. 45 = 45 ZLTO = 1 USD).
    /// Used to derive the stored raw conversion rate.
    /// </summary>
    public decimal ConversionRateZltoPerUsd { get; set; }
  }
}
