namespace Yoma.Core.Domain.Payout.Models
{
  public sealed class PayoutInfo
  {
    public decimal Amount { get; set; }

    public Currency Currency { get; } = Currency.USD;

    public string? PaymentUrl { get; set; }
  }
}
