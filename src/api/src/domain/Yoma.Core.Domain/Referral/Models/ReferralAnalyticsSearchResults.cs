namespace Yoma.Core.Domain.Referral.Models
{
  public sealed class ReferralAnalyticsSearchResults : ReferralAnalyticsSearchResultsInfo<ReferralAnalyticsUser> { }

  public class ReferralAnalyticsSearchResultsInfo<TItem>
    where TItem : ReferralAnalyticsUserInfo
  {
    public int TotalCount { get; set; }

    public ReferralParticipationRole Role { get; set; }

    public List<TItem> Items { get; set; } = null!;

    public int? LinkCount => Items.Sum(i => i.LinkCount ?? 0);

    public int? LinkCountActive => Items.Sum(i => i.LinkCountActive ?? 0);

    public int UsageCountTotal => Items.Sum(i => i.UsageCountTotal);

    public int UsageCountCompleted => Items.Sum(i => i.UsageCountCompleted);

    public int UsageCountPending => Items.Sum(i => i.UsageCountPending);

    public int UsageCountExpired => Items.Sum(i => i.UsageCountExpired);

    public decimal ZltoRewardTotal => Items.Sum(i => i.ZltoRewardTotal);
  }
}
