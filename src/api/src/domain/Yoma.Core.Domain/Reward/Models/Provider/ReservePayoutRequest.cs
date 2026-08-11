namespace Yoma.Core.Domain.Reward.Models.Provider
{
  public sealed class ReservePayoutRequest
  {
    public Guid TransactionId { get; set; }

    public string WalletId { get; set; } = null!;

    public decimal Amount { get; set; }

    /// <summary>
    /// ZLTO reservation expiry threshold. The payout domain must set this after the provider payout expiry plus
    /// a processing buffer; ZLTO may release the reservation after, rather than exactly at, this timestamp.
    /// </summary>
    public DateTimeOffset ExpiresAt { get; set; }
  }
}
