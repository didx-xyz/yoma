namespace Yoma.Core.Domain.Payout.Models.Provider
{
  public sealed class PayoutSessionRequest
  {
    /// <summary>
    /// Yoma payout transaction identifier used as the provider external reference.
    /// </summary>
    public Guid Id { get; set; }

    /// <summary>
    /// Transaction identifier assigned by the payout provider.
    /// </summary>
    public string TransactionId { get; set; } = null!;
  }
}
