namespace Yoma.Core.Domain.Entity.Models
{
  public sealed class OrganizationInfoAdmin : OrganizationInfo
  {
    public decimal? ZltoRewardPoolCurrentFinancialYear { get; set; }

    public decimal? ZltoRewardCumulative { get; set; }

    public decimal? ZltoRewardCumulativeCurrentFinancialYear { get; set; }

    public decimal? ZltoRewardBalanceCurrentFinancialYear { get; set; }

    public decimal? YomaRewardPoolCurrentFinancialYear { get; set; }

    public decimal? YomaRewardCumulative { get; set; }

    public decimal? YomaRewardCumulativeCurrentFinancialYear { get; set; }

    public decimal? YomaRewardBalanceCurrentFinancialYear { get; set; }
  }
}
