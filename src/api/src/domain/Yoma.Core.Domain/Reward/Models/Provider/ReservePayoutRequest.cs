namespace Yoma.Core.Domain.Reward.Models.Provider
{
  public sealed class ReservePayoutRequest
  {
    public Guid TransactionId { get; set; }

    public string WalletId { get; set; } = null!;

    public decimal Amount { get; set; }

    public DateTimeOffset ExpiresAt { get; set; }
  }
}
