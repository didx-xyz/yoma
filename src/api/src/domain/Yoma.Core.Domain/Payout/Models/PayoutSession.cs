namespace Yoma.Core.Domain.Payout.Models
{
  public sealed class PayoutSession
  {
    public decimal Amount { get; set; }

    public Currency Currency { get; } = Currency.USD;

    public string PaymentUrl { get; set; } = null!;

    public DateTimeOffset ExpiresAt { get; set; }
  }
}
