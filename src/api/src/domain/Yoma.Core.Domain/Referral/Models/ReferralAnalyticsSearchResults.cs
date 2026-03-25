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

    #region Referrer Link Metrics

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

    #endregion

    #region Claim Lifecycle

    /// <summary>
    /// Total usages / claims across all users in the current role context.
    /// Sum of UsageCountTotal for all items.
    ///
    /// Includes only actual claims that reached the Pending lifecycle.
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

    #endregion

    #region Intent Lifecycle

    /// <summary>
    /// Total referral intents captured across all users in the current role context.
    /// Sum of UsageCountIntentTotal for all items.
    /// </summary>
    public int UsageCountIntentTotal => Items.Sum(i => i.UsageCountIntentTotal);

    /// <summary>
    /// Total initiated usages / claims across all users in the current role context.
    /// Sum of UsageCountInitiated for all items.
    /// </summary>
    public int UsageCountInitiated => Items.Sum(i => i.UsageCountInitiated);

    /// <summary>
    /// Total abandoned usages / claims across all users in the current role context.
    /// Sum of UsageCountAbandoned for all items.
    /// </summary>
    public int UsageCountAbandoned => Items.Sum(i => i.UsageCountAbandoned);

    #endregion

    /// <summary>
    /// Total ZLTO reward accrued across all users in the current role context:
    /// - As referrer: sum of all referrer-side ZLTO totals across items
    /// - As referee: sum of all referee-side ZLTO totals across items
    /// </summary>
    public decimal ZltoRewardTotal => Items.Sum(i => i.ZltoRewardTotal);
  }
}
