namespace Yoma.Core.Domain.Payout.Models.Provider
{
  public sealed class PayoutResponse
  {
    /// <summary>
    /// Transaction identifier assigned by the payout provider.
    /// </summary>
    public string TransactionId { get; set; } = null!;

    /// <summary>
    /// URL of the provider's hosted payout experience.
    /// </summary>
    public string PaymentUrl { get; set; } = null!;

    /// <summary>
    /// Expiration reported by the provider for the hosted payout session.
    /// </summary>
    public DateTimeOffset ExpiresAt { get; set; }
  }
}
