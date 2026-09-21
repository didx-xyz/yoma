namespace Yoma.Core.Domain.Payout.Models.Provider
{
  public sealed class PayoutCancellationRequest
  {
    public Guid Id { get; set; }

    public string TransactionId { get; set; } = null!;
  }
}
