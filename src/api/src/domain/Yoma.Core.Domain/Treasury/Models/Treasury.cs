namespace Yoma.Core.Domain.Treasury.Models
{
  /// <summary>
  /// The current flat Treasury model intentionally represents ZLTO rewards and USD payouts.
  /// ZLTO has been embedded throughout the domain, API and UI since the platform's original design.
  /// USD was deliberately fixed for the current payout delivery to keep the implementation within time
  /// constraints and avoid a premature multi-asset and multi-currency redesign.
  /// Supporting additional reward assets or payout currencies requires asset/currency-based pool and
  /// conversion tables, seeded from these existing columns, with the API and UI migrated together.
  /// </summary>
  public sealed class Treasury
  {
    public Guid Id { get; set; }

    public byte FinancialYearStartMonth { get; set; }

    public byte FinancialYearStartDay { get; set; }

    public DateOnly FinancialYearStartDate { get; set; }

    public decimal? ZltoRewardPoolCurrentFinancialYear { get; set; }

    public decimal? ZltoRewardCumulative { get; set; }

    public decimal? ZltoRewardCumulativeCurrentFinancialYear { get; set; }

    public decimal? ZltoRewardBalanceCurrentFinancialYear =>
      ZltoRewardPoolCurrentFinancialYear.HasValue
        ? ZltoRewardPoolCurrentFinancialYear - (ZltoRewardCumulativeCurrentFinancialYear ?? default)
        : null;

    public decimal? PayoutPoolCurrentFinancialYearInUsd { get; set; }

    public decimal? PayoutCumulativeInUsd { get; set; }

    public decimal? PayoutCumulativeCurrentFinancialYearInUsd { get; set; }

    public decimal? PayoutBalanceCurrentFinancialYearInUsd =>
      PayoutPoolCurrentFinancialYearInUsd.HasValue
        ? PayoutPoolCurrentFinancialYearInUsd - (PayoutCumulativeCurrentFinancialYearInUsd ?? default)
        : null;

    /// <summary>
    /// Raw conversion rate representing the USD value of one ZLTO (e.g. 0.0222222 = 45 ZLTO = 1 USD).
    /// Used internally for calculations.
    /// </summary>
    public decimal ConversionRateZltoUsd { get; set; }

    public DateTimeOffset DateCreated { get; set; }

    public Guid CreatedByUserId { get; set; }

    public DateTimeOffset DateModified { get; set; }

    public Guid ModifiedByUserId { get; set; }
  }
}
