namespace Yoma.Core.Domain.Payout.Models
{
  public sealed class PayoutTransaction
  {
    public Guid Id { get; set; }

    public Guid UserId { get; set; }

    public string Username { get; set; } = null!;

    public string? UserEmail { get; set; }

    public string? UserPhoneNumber { get; set; }

    public string UserDisplayName { get; set; } = null!;

    public string Type { get; set; } = null!;

    public string Provider { get; set; } = null!;

    public Guid StatusId { get; set; }

    public PayoutTransactionStatus Status { get; set; }

    public decimal Amount { get; set; }

    public string Currency { get; set; } = null!;

    /// <summary>
    /// Transaction identifier assigned by the payout provider.
    /// </summary>
    public string? TransactionId { get; set; }

    public string? ErrorReason { get; set; }

    /// <summary>
    /// Expiration of the payout provider's hosted payout session. This does not by itself confirm a terminal payout outcome.
    /// </summary>
    public DateTimeOffset? ExpiresAt { get; set; }

    /// <summary>
    /// Expiration of the reward-provider reservation funding this payout. Retained on the payout for recovery when the reward transaction could not be recorded.
    /// </summary>
    public DateTimeOffset? RewardReservationExpiresAt { get; set; }

    /// <summary>
    /// Date of the most recent deliberate payout-provider status check, including checks that did not change the payout status.
    /// </summary>
    public DateTimeOffset? DateLastReconciled { get; set; }

    /// <summary>
    /// Number of reconciliation retries attempted after the initial processing attempt.
    /// </summary>
    public byte? RetryCount { get; set; }

    public DateTimeOffset DateCreated { get; set; }

    public DateTimeOffset DateModified { get; set; }
  }
}
