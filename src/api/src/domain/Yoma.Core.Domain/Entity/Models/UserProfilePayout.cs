using Yoma.Core.Domain.Payout;
using Yoma.Core.Domain.Payout.Models;

namespace Yoma.Core.Domain.Entity.Models
{
  public sealed class UserProfilePayout
  {
    /// <summary>
    /// Indicates whether the user's profile country is currently supported and whether the provider's
    /// live country availability could be determined. This controls new payout initiation only; an active
    /// payout remains resumable regardless of country availability.
    /// </summary>
    public PayoutCountryAvailability CountryAvailability { get; set; } = new();

    /// <summary>
    /// Indicates that the user has an existing non-terminal payout that can be resumed. The UI must display
    /// Continue cash-out and use the payout session endpoint rather than creating a second payout.
    /// </summary>
    public bool Active => Amount.HasValue;

    public decimal? Amount { get; set; }

    public Currency? Currency { get; set; }
  }
}
