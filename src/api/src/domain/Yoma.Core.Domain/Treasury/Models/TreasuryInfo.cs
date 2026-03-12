

using Newtonsoft.Json;

namespace Yoma.Core.Domain.Treasury.Models
{
  public sealed class TreasuryInfo
  {
    public byte FinancialYearStartMonth { get; set; }

    public byte FinancialYearStartDay { get; set; }

    public DateOnly FinancialYearStartDate { get; set; }

    public decimal? ZltoRewardPoolCurrentFinancialYear { get; set; }

    public decimal? ZltoRewardCumulative { get; set; }

    public decimal? ZltoRewardCumulativeCurrentFinancialYear { get; set; }

    public decimal? ZltoRewardBalanceCurrentFinancialYear { get; set; }

    public decimal? ChimoneyPoolCurrentFinancialYearInUSD { get; set; }

    public decimal? ChimoneyCumulativeInUSD { get; set; }

    public decimal? ChimoneyCumulativeCurrentFinancialYearInUSD { get; set; }

    public decimal? ChimoneyBalanceCurrentFinancialYearInUSD { get; set; }

    [JsonIgnore]
    /// <summary>
    /// Raw conversion rate representing the USD value of one ZLTO 
    /// (e.g. 0.0222222 = 45 ZLTO = 1 USD).
    /// Used internally for calculations and to derive display values.
    /// </summary>
    internal decimal ConversionRateZltoUsd { get; set; }

    /// <summary>
    /// Number of ZLTO equivalent to 1 USD, derived from the stored conversion rate.
    /// Used for display and editing in the admin UI.
    /// </summary>
    public decimal ConversionRateZltoPerUsd =>
      ConversionRateZltoUsd == 0 ? 0 : Math.Round(1m / ConversionRateZltoUsd, 4);

    /// <summary>
    /// USD amount used for the normalized admin display/edit ratio.
    /// </summary>
    public static decimal ConversionRateUsdAmount => Constants.ConversionRateUsdAmount;
  }
}
