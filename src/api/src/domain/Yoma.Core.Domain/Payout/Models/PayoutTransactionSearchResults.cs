namespace Yoma.Core.Domain.Payout.Models
{
  public sealed class PayoutTransactionSearchResults
  {
    public int? TotalCount { get; set; }

    public List<PayoutTransaction>? Items { get; set; }
  }
}
