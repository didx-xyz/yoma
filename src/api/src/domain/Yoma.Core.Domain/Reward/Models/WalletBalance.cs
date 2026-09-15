namespace Yoma.Core.Domain.Reward.Models
{
  public class WalletBalance
  {
    public string? WalletId { get; set; }

    public string? WalletUsername { get; set; }

    public decimal Available { get; set; }

    public decimal Pending { get; set; }

    /// <summary>
    /// Balance reported as reserved by ZLTO. This is retained only as a cross-system
    /// consistency check against Yoma's recorded payout reservation. It is not used to
    /// construct the user-facing ledger.
    /// </summary>
    public decimal ReservedBalance { get; set; }

    /// <summary>
    /// Effective balance after pending rewards are added. Pending payout is not deducted here
    /// because it has already been removed from the available wallet balance by the provider.
    /// Unavailable while ZLTO is offline because the provider balance cannot be confirmed.
    /// </summary>
    public decimal? Total => ZltoOffline == true ? null : Available + Pending;

    public bool? ZltoOffline { get; set; }
  }
}
