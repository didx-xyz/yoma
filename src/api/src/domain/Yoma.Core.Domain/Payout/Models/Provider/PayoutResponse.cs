namespace Yoma.Core.Domain.Payout.Models.Provider
{
  public sealed class PayoutResponse
  {
    /// <summary>
    /// Payout provider's transaction id / reference
    /// </summary>
    public string TransactionReference { get; set; } = null!;

    public string? PaymentLink { get; set; }
  }
}