namespace Yoma.Core.Domain.Payout.Models.Provider
{
  public sealed class PayoutSessionResponse
  {
    public bool CanCancel { get; set; }

    public string PaymentUrl { get; set; } = null!;

    public DateTimeOffset ExpiresAt { get; set; }
  }
}
