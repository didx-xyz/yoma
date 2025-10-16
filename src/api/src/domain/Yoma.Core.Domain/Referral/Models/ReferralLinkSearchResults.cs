namespace Yoma.Core.Domain.Referral.Models
{
  public class ReferralLinkSearchResults
  {
    public int? TotalCount { get; set; }

    public List<ReferralLinkInfo> Items { get; set; } = null!;
  }
}
