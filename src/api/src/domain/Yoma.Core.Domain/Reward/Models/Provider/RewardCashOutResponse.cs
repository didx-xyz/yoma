
namespace Yoma.Core.Domain.Reward.Models.Provider
{
  public sealed class RewardCashOutResponse
  {
    /// <summary>
    /// Payout provider's transaction id / reference
    /// </summary>
    public string TransactionReference { get; set; } = null!;

    public string? PaymentLink { get; set; }
  }
}
