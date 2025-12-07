namespace Yoma.Core.Domain.Referral.Models
{
  public class ReferralLinkUsageAggregate
  {
    /// <summary>
    /// Per-status usage counts for this referral link.
    /// Represents the number of usages / claims grouped by their current status.
    /// </summary>
    public List<ReferralLinkUsageAggregateItem> UsageCountsByStatus { get; set; } = null!;

    /// <summary>
    /// Total ZLTO awarded to the referrer across all completed usages of this link.
    /// </summary>
    public decimal ZltoRewardReferrerTotal { get; set; }

    /// <summary>
    /// Total ZLTO awarded to all referees across all completed usages of this link.
    /// </summary>
    public decimal ZltoRewardRefereeTotal { get; set; }
  }

  public class ReferralLinkUsageAggregateItem
  {
    public Guid StatusId { get; set; }

    public int Count { get; set; }
  }
}
