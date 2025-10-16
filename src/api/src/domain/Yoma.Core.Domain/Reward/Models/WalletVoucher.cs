namespace Yoma.Core.Domain.Reward.Models
{
  public class WalletVoucher
  {
    public string Id { get; set; } = null!;

    public string Category { get; set; } = null!;

    public string Name { get; set; } = null!;

    public string Code { get; set; } = null!;

    public string Instructions { get; set; } = null!;

    public decimal Amount { get; set; }

    public VoucherStatus Status { get; set; }

    public DateTimeOffset? DateStamp { get; set; }
  }
}
