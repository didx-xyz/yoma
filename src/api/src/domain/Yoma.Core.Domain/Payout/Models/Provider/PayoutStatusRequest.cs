namespace Yoma.Core.Domain.Payout.Models.Provider
{
  public sealed class PayoutStatusRequest
  {
    /// <summary>
    /// Yoma payout transaction identifier used as the provider idempotency key and external reference.
    /// </summary>
    public Guid Id { get; set; }

    /// <summary>
    /// Transaction identifier assigned by the payout provider, when known.
    /// </summary>
    public string? TransactionId { get; set; }
  }
}
