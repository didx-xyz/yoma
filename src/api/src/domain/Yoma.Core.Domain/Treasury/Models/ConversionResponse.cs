using Yoma.Core.Domain.Payout;

namespace Yoma.Core.Domain.Treasury.Models
{
  public sealed class ConversionResponse
  {
    public decimal Amount { get; set; }

    public Currency Currency { get; } = Currency.USD;

    /// <summary>
    /// Indicates whether the Treasury currently has sufficient uncommitted funds for the converted payout amount.
    /// The payout operation validates this again while holding the Treasury lock.
    /// </summary>
    public bool TreasuryFundsAvailable { get; set; }
  }
}
