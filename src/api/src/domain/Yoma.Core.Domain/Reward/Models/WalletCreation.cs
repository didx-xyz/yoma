namespace Yoma.Core.Domain.Reward.Models
{
  public class WalletCreation
  {
    public Guid Id { get; set; }

    public Guid StatusId { get; set; }

    public WalletCreationStatus Status { get; set; }

    public Guid UserId { get; set; }

    public string? WalletId { get; set; }

    public decimal? Balance { get; set; }

    public string? ErrorReason { get; set; }

    public byte? RetryCount { get; set; }

    public DateTimeOffset DateCreated { get; set; }

    public DateTimeOffset DateModified { get; set; }
  }
}
