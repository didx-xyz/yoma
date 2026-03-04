namespace Yoma.Core.Domain.Treasury.Models
{
  public sealed class TreasuryInfo
  {
    public decimal? ZltoRewardPool { get; set; }

    public decimal? ZltoRewardCumulative { get; set; }

    public decimal? ZltoRewardBalance => ZltoRewardPool.HasValue ? ZltoRewardPool - (ZltoRewardCumulative ?? default) : null;

    public decimal? ChimoneyPoolInUSD { get; set; }

    public decimal? ChimoneyCumulativeInUSD { get; set; }

    public decimal? ChimoneyBalanceInUSD => ChimoneyPoolInUSD.HasValue ? ChimoneyPoolInUSD - (ChimoneyCumulativeInUSD ?? default) : null;

    public decimal ConversionRateZltoUsd { get; set; }
  }
}
