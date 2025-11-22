namespace Yoma.Core.Domain.Referral.Models
{
  public sealed class ReferralAnalyticsUser : ReferralAnalyticsUserInfo
  {
    public Guid UserId { get; set; }

    public decimal ZltoRewardTotal { get; set; }
  }

  public class ReferralAnalyticsUserInfo
  {
    /// <summary>
    /// Redact when applicable
    /// </summary>
    public string UserDisplayName { get; set; } = null!;

    /// <summary>
    /// Count of links created (as referrer)
    /// </summary>
    public int? LinkCount { get; set; }

    /// <summary>
    /// Count of active links (as referrer)
    /// </summary>
    public int? LinkCountActive { get; set; } 

    /// <summary>
    /// Total usages / claims count (as referrer > usages / claims by referees; as referee >> your usages / claims)
    /// </summary>
    public int UsageCountTotal => UsageCountCompleted + UsageCountPending + UsageCountExpired;

    /// <summary>
    /// Completed usages / claims count (as referrer > usages / claims by referees; as referee >> your usages / claims)
    /// </summary>
    public int UsageCountCompleted { get; set; }


    /// <summary>
    /// Pending usages / claims count (as referrer > usages / claims by referees; as referee >> your usages / claims)
    /// </summary>
    public int UsageCountPending { get; set; }


    /// <summary>
    /// Expired usages / claims count (as referrer > usages / claims by referees; as referee >> your usages / claims)
    /// </summary>
    public int UsageCountExpired { get; set; }
  }
}
