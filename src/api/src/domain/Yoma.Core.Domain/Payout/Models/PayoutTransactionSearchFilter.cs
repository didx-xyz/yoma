using Yoma.Core.Domain.Core.Models;

namespace Yoma.Core.Domain.Payout.Models
{
  public sealed class PayoutTransactionSearchFilter : PaginationFilter
  {
    public Guid? Id { get; set; }

    public Guid? UserId { get; set; }

    public List<PayoutType>? Types { get; set; }

    public List<Payout.Provider>? Providers { get; set; }

    public List<PayoutTransactionStatus>? Statuses { get; set; }

    public decimal? AmountFrom { get; set; }

    public decimal? AmountTo { get; set; }

    public DateTimeOffset? DateStart { get; set; }

    public DateTimeOffset? DateEnd { get; set; }

    /// <summary>
    /// Case-insensitive search across user identity, Yoma transaction id, provider transaction id and error reason.
    /// </summary>
    public string? ValueContains { get; set; }

  }
}
