using Yoma.Core.Domain.Payout;

namespace Yoma.Core.Domain.Entity.Models
{
  public sealed class UserProfilePayout
  {
    /// <summary>
    /// Indicates that the user has an existing non-terminal payout that can be resumed. The UI must display
    /// Continue cash-out and use the payout session endpoint rather than creating a second payout.
    /// </summary>
    public bool Active => Amount.HasValue;

    public decimal? Amount { get; set; }

    public Currency? Currency { get; set; }
  }
}
