namespace Yoma.Core.Domain.Reward.Models
{
  public class WalletBalance
  {
    public string? WalletId { get; set; }

    public decimal Available { get; set; }

    public decimal Pending { get; set; }

    public decimal Total { get; set; }

    public bool? ZltoOffline { get; set; }
  }
}
