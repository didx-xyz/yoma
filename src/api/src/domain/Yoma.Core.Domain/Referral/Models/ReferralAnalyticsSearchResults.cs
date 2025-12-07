namespace Yoma.Core.Domain.Referral.Models
{
  public sealed class ReferralAnalyticsSearchResults : ReferralAnalyticsSearchResultsInfo<ReferralAnalyticsUser> { }

  public class ReferralAnalyticsSearchResultsInfo<TItem>
    where TItem : ReferralAnalyticsUserInfo
  {
    public int TotalCount { get; set; }

    /// <summary>
    /// Role context in which analytics were calculated:
    /// - Referrer: metrics are based on users acting as referrers
    /// - Referee: metrics are based on users acting as referees
    /// </summary>
    public ReferralParticipationRole Role { get; set; }

    /// <summary>
    /// Per-user analytics rows returned for this search (current page).
    /// </summary>
    public List<TItem> Items { get; set; } = null!;

    /// <summary>
    /// Total number of links created across all users (referrer role only).
    /// Sum of LinkCount for all items.
    /// </summary>
    public int? LinkCount => Items.Sum(i => i.LinkCount ?? 0);

    /// <summary>
    /// Total number of active links across all users (referrer role only).
    /// Sum of LinkCountActive for all items.
    /// </summary>
    public int? LinkCountActive => Items.Sum(i => i.LinkCountActive ?? 0);

    /// <summary>
    /// Total usages / claims across all users in the current role context.
    /// Sum of UsageCountTotal for all items.
    /// </summary>
    public int UsageCountTotal => Items.Sum(i => i.UsageCountTotal);

    /// <summary>
    /// Total completed usages / claims across all users in the current role context.
    /// Sum of UsageCountCompleted for all items.
    /// </summary>
    public int UsageCountCompleted => Items.Sum(i => i.UsageCountCompleted);

    /// <summary>
    /// Total pending usages / claims across all users in the current role context.
    /// Sum of UsageCountPending for all items.
    /// </summary>
    public int UsageCountPending => Items.Sum(i => i.UsageCountPending);

    /// <summary>
    /// Total expired usages / claims across all users in the current role context.
    /// Sum of UsageCountExpired for all items.
    /// </summary>
    public int UsageCountExpired => Items.Sum(i => i.UsageCountExpired);

    /// <summary>
    /// Total ZLTO reward accrued across all users in the current role context:
    /// - As referrer: sum of all referrer-side ZLTO totals across items
    /// - As referee: sum of all referee-side ZLTO totals across items
    /// </summary>
    public decimal ZltoRewardTotal => Items.Sum(i => i.ZltoRewardTotal);
  }
}
