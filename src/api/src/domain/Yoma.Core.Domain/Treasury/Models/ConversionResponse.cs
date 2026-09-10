using Yoma.Core.Domain.Payout;

namespace Yoma.Core.Domain.Treasury.Models
{
  public sealed class ConversionResponse
  {
    public decimal Amount { get; set; }

    public Currency Currency { get; } = Currency.USD;

    /// <summary>
    /// Number of ZLTO equivalent to 1 USD, using the same display precision as Treasury administration.
    /// Do not infer this rate from Amount, which has already been rounded to two USD decimal places.
    /// The payout operation recalculates using the current Treasury rate at initiation.
    /// </summary>
    public decimal ConversionRateZltoPerUsd { get; set; }

    /// <summary>
    /// Indicates whether the Treasury currently has sufficient uncommitted funds for the converted payout amount.
    /// The payout operation validates this again while holding the Treasury lock.
    /// </summary>
    public bool TreasuryFundsAvailable { get; set; }
  }
}
