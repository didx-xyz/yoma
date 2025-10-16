namespace Yoma.Core.Domain.Reward.Models
{
  public class Wallet
  {
    public string Id { get; set; } = null!;

    public string OwnerId { get; set; } = null!;

    public decimal Balance { get; set; }

    public DateTimeOffset DateCreated { get; set; }

    public DateTimeOffset DateModified { get; set; }
  }
}
