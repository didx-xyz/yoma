namespace Yoma.Core.Domain.Treasury.Models
{
  public sealed class TreasuryRequestUpdate
  {
    public decimal? ZltoRewardPool { get; set; }

    public decimal? ChimoneyPoolInUSD { get; set; }

    public decimal ConversionRateZltoUsd { get; set; }
  }
}
