namespace Yoma.Core.Domain.Referral.Models
{
  public sealed class ReferralAnalyticsSearchResults : ReferralAnalyticsSearchResultsInfo
  {
    public decimal ZltoRewardTotal => Items?.Sum(i => i.ZltoRewardTotal) ?? 0;

    public new List<ReferralAnalyticsUser> Items { get; set; } = null!;
  }

  public class ReferralAnalyticsSearchResultsInfo
  {
    public int TotalCount { get; set; }

    public ReferralParticipationRole Role { get; set; }

    public int? LinkCount => Items?.Sum(i => i.LinkCount ?? 0) ?? 0;

    public int? LinkCountActive => Items?.Sum(i => i.LinkCountActive ?? 0) ?? 0;

    public int UsageCountTotal => Items?.Sum(i => i.UsageCountTotal) ?? 0;

    public int UsageCountCompleted => Items?.Sum(i => i.UsageCountCompleted) ?? 0;

    public List<ReferralAnalyticsUserInfo> Items { get; set; } = null!;
  }
}
