namespace Yoma.Core.Domain.Reward.Models
{
  public class RewardTransaction
  {
    public Guid Id { get; set; }

    public string Provider { get; set; } = null!;

    public Guid UserId { get; set; }

    public Guid StatusId { get; set; }

    public RewardTransactionStatus Status { get; set; }

    public string SourceEntityType { get; set; } = null!;

    public Guid? MyOpportunityId { get; set; }

    public Guid? ReferralLinkUsageId { get; set; }

    /// <summary>
    /// Payout transaction funded by this reward transaction, when the source entity is Payout.
    /// </summary>
    public Guid? PayoutTransactionId { get; set; }

    public decimal Amount { get; set; }

    /// <summary>
    /// Provider transaction identifier. For a payout transaction, this identifies the reward reservation.
    /// </summary>
    public string? TransactionId { get; set; }

    public string? ErrorReason { get; set; }

    public byte? RetryCount { get; set; }

    /// <summary>
    /// Expiration reported for the reward-provider reservation while the payout transaction is Reserved.
    /// </summary>
    public DateTimeOffset? ReservationExpiresAt { get; set; }

    public DateTimeOffset DateCreated { get; set; }

    public DateTimeOffset DateModified { get; set; }
  }
}
