namespace Yoma.Core.Domain.Payout.Models.Lookups
{
  public sealed class PayoutTransactionStatus
  {
    public Guid Id { get; set; }

    public string Name { get; set; } = null!;
  }
}
