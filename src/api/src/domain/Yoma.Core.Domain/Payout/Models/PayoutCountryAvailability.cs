namespace Yoma.Core.Domain.Payout.Models
{
  /// <summary>
  /// Represents whether a user's country is currently supported for payout and whether the provider's
  /// live country availability could be determined, with country limits for new payouts.
  /// </summary>
  public sealed class PayoutCountryAvailability
  {
    public bool Supported { get; set; }

    public bool Offline { get; set; }

    /// <summary>
    /// Country minimum for new payouts, in Currency. Null when the country is unspecified,
    /// unsupported, provider availability cannot be determined, or no minimum is supplied.
    /// Null disables only the minimum check; all other initiation gates still apply.
    /// The hosted provider remains authoritative for channel-specific limits.
    /// </summary>
    public decimal? MinimumAmount { get; set; }

    /// <summary>
    /// Minimum amount currency, independent of an active payout. Null for unsupported,
    /// unspecified countries or when provider availability cannot be determined.
    /// May be supplied even when MinimumAmount is null. Changing country does not relabel an active payout.
    /// Currently USD only; keeping this separate does not add multi-currency processing.
    /// </summary>
    public Currency? Currency { get; set; }
  }
}
