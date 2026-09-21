using Yoma.Core.Domain.Lookups.Models;

namespace Yoma.Core.Domain.Payout.Models
{
  public sealed class PayoutCountry : Country
  {
    /// <summary>
    /// Country minimum in Currency for new payouts. Null means no minimum enforced by Yoma.
    /// The hosted provider remains authoritative for channel-specific limits.
    /// </summary>
    public decimal? MinimumAmount { get; set; }

    /// <summary>
    /// Currency of MinimumAmount, currently fixed to USD by the payout integration.
    /// This labels the monetary value; it is not a user-selectable payout currency.
    /// Multi-currency support requires coordinated provider, Treasury, validation and UI changes.
    /// </summary>
    public Currency Currency { get; set; } = Currency.USD;
  }
}
