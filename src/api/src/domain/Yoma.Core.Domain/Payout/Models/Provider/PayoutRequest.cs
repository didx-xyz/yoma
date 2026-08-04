namespace Yoma.Core.Domain.Payout.Models.Provider
{
  public sealed class PayoutRequest
  {
    public Guid TransactionId { get; set; }

    public string? Email { get; set; }

    public string? PhoneNumber { get; set; }

    public decimal AmountInUSD { get; set; }
  }
}