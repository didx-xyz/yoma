
namespace Yoma.Core.Domain.Reward.Models.Provider
{
  public sealed class RewardCashOutResponse
  {
    /// <summary>
    /// Provider's transaction id / reference (e.g. Chimoney issueID)
    /// </summary>
    public string TransactionReference { get; set; } = null!;

    public string? PaymentLink { get; set; }
  }
}
