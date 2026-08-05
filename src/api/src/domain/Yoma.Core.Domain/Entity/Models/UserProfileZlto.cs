using Yoma.Core.Domain.Reward;

namespace Yoma.Core.Domain.Entity.Models
{
  public class UserProfileZlto
  {
    public WalletCreationStatus WalletCreationStatus { get; set; }

    /// <summary>
    /// ZLTO wallet balance before pending payout reservations are excluded.
    /// </summary>
    public decimal Balance { get; set; }

    /// <summary>
    /// ZLTO balance currently available to the user. Pending payout reservations have already
    /// been excluded by ZLTO, which remains the source of truth for this value.
    /// </summary>
    public decimal Available { get; set; }

    /// <summary>
    /// Yoma rewards awaiting transfer to the user's ZLTO wallet.
    /// </summary>
    public decimal PendingRewards { get; set; }

    /// <summary>
    /// ZLTO balance reserved for active payouts. This is returned as a positive value and may
    /// be presented as a deduction by the UI.
    /// </summary>
    public decimal PendingPayout { get; set; }

    /// <summary>
    /// Projected available balance after pending rewards are credited. The pending payout is not
    /// deducted again because ZLTO has already excluded it from <see cref="Available"/>.
    /// </summary>
    public decimal Total { get; set; }

    public bool? ZltoOffline { get; set; }
  }
}
