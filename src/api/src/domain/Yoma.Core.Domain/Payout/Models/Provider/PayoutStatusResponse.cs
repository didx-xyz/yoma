using PayoutProvider = Yoma.Core.Domain.Payout.Provider;

namespace Yoma.Core.Domain.Payout.Models.Provider
{
  public sealed class PayoutStatusResponse
  {
    public PayoutProvider Provider { get; set; }

    public string TransactionId { get; set; } = null!;

    public PayoutTransactionStatus Status { get; set; }

    public string? ErrorReason { get; set; }
  }
}
