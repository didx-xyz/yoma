namespace Yoma.Core.Domain.Entity.Models
{
  public sealed class OrganizationInfoAdmin : OrganizationInfo
  {
    public decimal? ZltoRewardPool { get; set; }

    public decimal? ZltoRewardCumulative { get; set; }

    public decimal? ZltoRewardBalance { get; set; }

    public decimal? YomaRewardPool { get; set; }

    public decimal? YomaRewardCumulative { get; set; }

    public decimal? YomaRewardBalance { get; set; }
  }
}
