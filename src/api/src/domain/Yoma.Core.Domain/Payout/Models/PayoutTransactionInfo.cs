using Yoma.Core.Domain.Entity.Models;
using Yoma.Core.Domain.Reward.Models;

namespace Yoma.Core.Domain.Payout.Models
{
  /// <summary>
  /// Administrative payout view combining Yoma's payout audit record with the user and its funding transaction.
  /// The payout transaction remains authoritative for payout processing; the reward transaction records the
  /// corresponding reward reservation, release or commit.
  /// </summary>
  public sealed class PayoutTransactionInfo
  {
    public PayoutTransaction Transaction { get; set; } = null!;

    public UserInfo User { get; set; } = null!;

    public RewardTransaction? RewardTransaction { get; set; }
  }
}
