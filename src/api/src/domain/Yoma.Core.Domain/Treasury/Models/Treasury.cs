namespace Yoma.Core.Domain.Treasury.Models
{
  public sealed class Treasury
  {
    public Guid Id { get; set; }

    public decimal? ZltoRewardPool { get; set; }

    public decimal? ZltoRewardCumulative { get; set; }

    public decimal? ZltoRewardBalance => ZltoRewardPool.HasValue ? ZltoRewardPool - (ZltoRewardCumulative ?? default) : null;

    public decimal? ChimoneyPoolInUSD { get; set; }

    public decimal? ChimoneyCumulativeInUSD { get; set; }

    public decimal? ChimoneyBalanceInUSD => ChimoneyPoolInUSD.HasValue ? ChimoneyPoolInUSD - (ChimoneyCumulativeInUSD ?? default) : null;

    public decimal ConversionRateZltoUsd { get; set; }

    public DateTimeOffset DateCreated { get; set; }

    public Guid CreatedByUserId { get; set; }

    public DateTimeOffset DateModified { get; set; }

    public Guid ModifiedByUserId { get; set; }
  }
}
