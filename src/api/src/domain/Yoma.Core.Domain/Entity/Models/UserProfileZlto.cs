using Yoma.Core.Domain.Reward;

namespace Yoma.Core.Domain.Entity.Models
{
  public class UserProfileZlto
  {
    public WalletCreationStatus WalletCreationStatus { get; set; }

    /// <summary>
    /// Wallet balance before the pending payout is excluded. Derived from ZLTO's available
    /// balance plus Yoma's recorded payout reservation so the user-facing ledger uses Yoma's
    /// payout state consistently.
    /// Null while ZLTO is offline because the provider balance cannot be confirmed.
    /// </summary>
    public decimal? Balance { get; set; }

    /// <summary>
    /// ZLTO balance currently available to the user. Pending payout reservations have already
    /// been excluded by ZLTO, which remains the source of truth for this value. Null while
    /// ZLTO is offline because the provider balance cannot be confirmed.
    /// </summary>
    public decimal? Available { get; set; }

    /// <summary>
    /// Yoma rewards awaiting transfer to the user's ZLTO wallet.
    /// </summary>
    public decimal PendingRewards { get; set; }

    /// <summary>
    /// Yoma rewards reserved for the active payout. This is returned as a positive value and may
    /// be presented as a deduction by the UI. It remains available while ZLTO is offline because
    /// Yoma's recorded reward reservation is the source of truth.
    /// </summary>
    public decimal PendingPayout { get; set; }

    /// <summary>
    /// Projected available balance after pending rewards are credited. The pending payout is not
    /// deducted again because ZLTO has already excluded it from <see cref="Available"/>.
    /// Null while ZLTO is offline because the provider balance cannot be confirmed.
    /// </summary>
    public decimal? Total { get; set; }

    public bool? ZltoOffline { get; set; }
  }
}
