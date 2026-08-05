namespace Yoma.Core.Domain.Payout.Models.Provider
{
  public sealed class PayoutSessionResponse
  {
    public string PaymentUrl { get; set; } = null!;

    public DateTimeOffset ExpiresAt { get; set; }
  }
}
