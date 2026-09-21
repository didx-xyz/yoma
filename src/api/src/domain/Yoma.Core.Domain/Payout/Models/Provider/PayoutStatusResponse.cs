using PayoutProvider = Yoma.Core.Domain.Payout.Provider;

namespace Yoma.Core.Domain.Payout.Models.Provider
{
  public sealed class PayoutStatusResponse
  {
    /// <summary>
    /// Yoma payout transaction identifier supplied to the provider as its idempotency key and external reference.
    /// </summary>
    public Guid Id { get; set; }

    public PayoutProvider Provider { get; set; }

    public string TransactionId { get; set; } = null!;

    public PayoutTransactionStatus Status { get; set; }

    /// <summary>
    /// Provider cancellation eligibility when supplied by a status lookup. Null when unknown;
    /// the normalized Processing status alone does not distinguish initiated from submitted.
    /// </summary>
    public bool? CanCancel { get; set; }

    public string? ErrorReason { get; set; }
  }
}
