namespace Yoma.Core.Domain.Treasury.Models
{
  public sealed class Treasury
  {
    public Guid Id { get; set; }

    public byte FinancialYearStartMonth { get; set; }

    public byte FinancialYearStartDay { get; set; }

    public DateOnly FinancialYearStartDate
    {
      get
      {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var yearStart = new DateOnly(today.Year, FinancialYearStartMonth, FinancialYearStartDay);

        return today >= yearStart ? yearStart : yearStart.AddYears(-1);
      }
    }

    public decimal? ZltoRewardPoolCurrentFinancialYear { get; set; }

    public decimal? ZltoRewardCumulative { get; set; }

    public decimal? ZltoRewardCumulativeCurrentFinancialYear { get; set; }

    public decimal? ZltoRewardBalanceCurrentFinancialYear =>
      ZltoRewardPoolCurrentFinancialYear.HasValue
        ? ZltoRewardPoolCurrentFinancialYear - (ZltoRewardCumulativeCurrentFinancialYear ?? default)
        : null;

    public decimal? ChimoneyPoolCurrentFinancialYearInUSD { get; set; }

    public decimal? ChimoneyCumulativeInUSD { get; set; }

    public decimal? ChimoneyCumulativeCurrentFinancialYearInUSD { get; set; }

    public decimal? ChimoneyBalanceCurrentFinancialYearInUSD =>
      ChimoneyPoolCurrentFinancialYearInUSD.HasValue
        ? ChimoneyPoolCurrentFinancialYearInUSD - (ChimoneyCumulativeCurrentFinancialYearInUSD ?? default)
        : null;

    public decimal ConversionRateZltoUsd { get; set; }

    public DateTimeOffset DateCreated { get; set; }

    public Guid CreatedByUserId { get; set; }

    public DateTimeOffset DateModified { get; set; }

    public Guid ModifiedByUserId { get; set; }
  }
}
