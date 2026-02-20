namespace Yoma.Core.Domain.Referral.Models
{
  public class ReferralLinkSearchResults
  {
    public int? TotalCount { get; set; }

    public List<ReferralLink>? Items { get; set; }
  }
}
