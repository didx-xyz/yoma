namespace Yoma.Core.Domain.Payout.Models
{
  public sealed class PayoutSession
  {
    /// <summary>
    /// The Yoma payout transaction ID associated with this session.
    /// </summary>
    public Guid PayoutId { get; set; }

    /// <summary>
    /// Provider eligibility snapshot from this session response. Provider cancellation rechecks atomically;
    /// a concurrent hosted submission may still win. Not derived from Yoma's Processing status.
    /// </summary>
    public bool CanCancel { get; set; }

    public decimal Amount { get; set; }

    public Currency Currency { get; } = Currency.USD;

    public string PaymentUrl { get; set; } = null!;

    public DateTimeOffset ExpiresAt { get; set; }
  }
}
