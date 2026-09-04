using Yoma.Core.Domain.Lookups.Models;

namespace Yoma.Core.Domain.Payout.Models.Provider
{
  /// <summary>
  /// Represents the payout provider's current country availability. Countries is null when the
  /// provider is offline and its live availability cannot be determined.
  /// </summary>
  public sealed class PayoutCountries
  {
    public List<Country>? Countries { get; set; }

    public bool Offline { get; set; }
  }
}
