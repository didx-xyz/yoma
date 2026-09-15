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

    /// <summary>
    /// Current financial year reward pool less the current financial year reward cumulative.
    /// Pending or error wallet awards are already included in the cumulative when scheduled.
    /// </summary>
    public decimal? ZltoRewardBalanceCurrentFinancialYear { get; set; }

    public decimal? PayoutPoolCurrentFinancialYearInUsd { get; set; }

    public decimal? PayoutCumulativeInUsd { get; set; }

    public decimal? PayoutCumulativeCurrentFinancialYearInUsd { get; set; }

    /// <summary>
    /// Current financial year payout pool less the current financial year payout cumulative.
    /// Only paid-out amounts are included; pending payouts are excluded until completed.
    /// </summary>
    public decimal? PayoutBalanceCurrentFinancialYearInUsd { get; set; }

    /// <summary>
    /// Current payout balance less the total pending payouts. Pending payouts include all non-terminal statuses,
    /// are not limited to the current financial year and remain deducted until completed or closed unsuccessfully.
    /// </summary>
    public decimal? PayoutBalanceAvailableCurrentFinancialYearInUsd { get; set; }

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
    public decimal ConversionRateUsdAmount { get; private set; } = Constants.ConversionRateUsdAmount;
  }
}
