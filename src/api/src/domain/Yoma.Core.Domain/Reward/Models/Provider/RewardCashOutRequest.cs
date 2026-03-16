namespace Yoma.Core.Domain.Reward.Models.Provider
{
  public sealed class RewardCashOutRequest
  {
    public Guid TransactionId { get; set; }

    public string? Email { get; set; }

    public string? PhoneNumber { get; set; }

    public decimal AmountInUSD { get; set; }
  }
}
