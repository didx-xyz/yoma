namespace Yoma.Core.Domain.Referral.Models
{
  /// <summary>
  /// Full analytics row for a user, including their identifier
  ///<summary>
  public sealed class ReferralAnalyticsUser : ReferralAnalyticsUserInfo
  {
    public Guid UserId { get; set; }

    public decimal ZltoRewardTotal { get; set; }
  }

  /// <summary>
  /// Obfuscated analytics view used for non-admin, system-wide searches (leaderboards)
  /// </summary>
  public class ReferralAnalyticsUserInfo
  {
    /// <summary>
    /// Display name for the user:
    /// - Redacted for non-admin, multi-user analytics searches
    /// - Returned as-is for "my analytics" and admin analytics
    /// </summary>
    public string UserDisplayName { get; set; } = null!;

    /// <summary>
    /// Count of links created (referrer role only)
    /// </summary>
    public int? LinkCount { get; set; }

    /// <summary>
    /// Count of active links (referrer role only)
    /// </summary>
    public int? LinkCountActive { get; set; }

    /// <summary>
    /// Total usages / claims count:
    /// - As referrer: usages / claims created by your referees
    /// - As referee: your own usages / claims
    /// </summary>
    public int UsageCountTotal => UsageCountCompleted + UsageCountPending + UsageCountExpired;

    /// <summary>
    /// Completed usages / claims count:
    /// - As referrer: completed usages / claims by your referees
    /// - As referee: your completed usages / claims
    /// </summary>
    public int UsageCountCompleted { get; set; }

    /// Pending usages / claims count:
    /// - As referrer: pending usages / claims by your referees
    /// - As referee: your pending usages / claim
    /// </summary>
    public int UsageCountPending { get; set; }

    /// <summary>
    /// Expired usages / claims count:
    /// - As referrer: expired usages / claims by your referee
    /// - As referee: your expired usages / claims
    /// </summary>
    public int UsageCountExpired { get; set; }
  }
}
