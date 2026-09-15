namespace Yoma.Core.Domain.Payout.Models
{
  /// <summary>
  /// Represents whether a user's country is currently supported for payout and whether the provider's
  /// live country availability could be determined.
  /// </summary>
  public sealed class PayoutCountryAvailability
  {
    public bool Supported { get; set; }

    public bool Offline { get; set; }
  }
}
