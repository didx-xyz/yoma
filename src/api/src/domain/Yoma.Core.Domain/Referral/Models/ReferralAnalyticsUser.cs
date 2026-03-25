namespace Yoma.Core.Domain.Referral.Models
{
  /// <summary>
  /// Full analytics row for a user, including their identifier.
  /// ZLTO reward totals are included and no longer obfuscated based on designs.
  /// </summary>
  public sealed class ReferralAnalyticsUser : ReferralAnalyticsUserInfo
  {
    public Guid UserId { get; set; }
  }

  /// <summary>
  /// Obfuscated analytics view used for non-admin, system-wide searches (leaderboards).
  /// </summary>
  public class ReferralAnalyticsUserInfo
  {
    /// <summary>
    /// Display name for the user:
    /// - Redacted for non-admin, multi-user analytics searches
    /// - Returned as-is for "my analytics" and admin analytics
    /// </summary>
    public string UserDisplayName { get; set; } = null!;

    #region Referrer Link Metrics

    /// <summary>
    /// Count of links created (referrer role only).
    /// </summary>
    public int? LinkCount { get; set; }

    /// <summary>
    /// Count of active links (referrer role only).
    /// </summary>
    public int? LinkCountActive { get; set; }

    #endregion

    #region Claim Lifecycle

    /// <summary>
    /// Total usages / claims count:
    /// - As referrer: usages / claims created by your referees
    /// - As referee: your own usages / claims
    ///
    /// Includes only actual claims that reached the Pending lifecycle.
    /// </summary>
    public int UsageCountTotal => UsageCountCompleted + UsageCountPending + UsageCountExpired;

    /// <summary>
    /// Completed usages / claims count:
    /// - As referrer: completed usages / claims by your referees
    /// - As referee: your completed usages / claims
    /// </summary>
    public int UsageCountCompleted { get; set; }

    /// <summary>
    /// Pending usages / claims count:
    /// - As referrer: pending usages / claims by your referees
    /// - As referee: your pending usages / claims
    /// </summary>
    public int UsageCountPending { get; set; }

    /// <summary>
    /// Expired usages / claims count:
    /// - As referrer: expired usages / claims by your referees
    /// - As referee: your expired usages / claims
    /// </summary>
    public int UsageCountExpired { get; set; }

    #endregion

    #region Intent Lifecycle

    /// <summary>
    /// Total referral intents captured:
    /// - As referrer: intents initiated by your referees
    /// - As referee: your own captured referral intents
    ///
    /// Includes initiated, abandoned and actual claims.
    /// </summary>
    public int UsageCountIntentTotal =>
      UsageCountInitiated + UsageCountPending + UsageCountCompleted + UsageCountExpired + UsageCountAbandoned;

    /// <summary>
    /// Initiated usages / claims count:
    /// - As referrer: initiated intents by your referees
    /// - As referee: your initiated intents
    /// </summary>
    public int UsageCountInitiated { get; set; }

    /// <summary>
    /// Abandoned usages / claims count:
    /// - As referrer: abandoned intents by your referees
    /// - As referee: your abandoned intents
    /// </summary>
    public int UsageCountAbandoned { get; set; }

    #endregion

    /// <summary>
    /// Total ZLTO reward accrued for this user:
    /// - As referrer: ZLTO earned from your referees’ completed usages / claims
    /// - As referee: ZLTO earned from your own completed usages / claims
    /// </summary>
    public decimal ZltoRewardTotal { get; set; }
  }
}
