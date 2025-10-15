namespace Yoma.Core.Domain.Referral.Models
{
  public class ReferralLinkUsageSearchResults
  {
    public int? TotalCount { get; set; }

    public List<ReferralLinkUsageInfo> Items { get; set; }
  }
}
