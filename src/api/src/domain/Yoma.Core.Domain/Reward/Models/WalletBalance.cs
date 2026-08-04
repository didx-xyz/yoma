namespace Yoma.Core.Domain.Reward.Models
{
  public class WalletBalance
  {
    public string? WalletId { get; set; }

    public string? WalletUsername { get; set; }

    public decimal Available { get; set; }

    public decimal Pending { get; set; }

    public decimal PendingPayout { get; set; }

    /// <summary>
    /// Effective balance after pending rewards are added. Pending payout is not deducted here
    /// because it has already been removed from the available wallet balance by the provider.
    /// </summary>
    public decimal Total => Available + Pending;

    public bool? ZltoOffline { get; set; }
  }
}
