
namespace Yoma.Core.Domain.Treasury.Extensions
{
  public static class TreasuryExtension
  {
    public static Models.TreasuryInfo ToInfo(this Models.Treasury value)
    {
      ArgumentNullException.ThrowIfNull(value, nameof(value));

      return new Models.TreasuryInfo
      {
        ZltoRewardPool = value.ZltoRewardPool,
        ZltoRewardCumulative = value.ZltoRewardCumulative,
        ChimoneyPoolInUSD = value.ChimoneyPoolInUSD,
        ChimoneyCumulativeInUSD = value.ChimoneyCumulativeInUSD,
        ConversionRateZltoUsd = value.ConversionRateZltoUsd
      };
    }
  }
}
