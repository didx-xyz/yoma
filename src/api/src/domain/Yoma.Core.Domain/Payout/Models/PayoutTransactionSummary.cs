namespace Yoma.Core.Domain.Payout.Models
{
  /// <summary>
  /// On-demand youth payout state. Excludes raw errors, provider references and reward accounting;
  /// ZLTO balances and reservations remain in the wallet section of the user profile.
  /// </summary>
  public sealed class PayoutTransactionSummary
  {
    /// <summary>
    /// Recorded Yoma status. Processing starts at hosted-payout creation, not necessarily youth confirmation.
    /// </summary>
    public PayoutTransactionStatus Status { get; set; }

    /// <summary>
    /// Payout amount in Currency (currently USD), not ZLTO.
    /// </summary>
    public decimal Amount { get; set; }

    public Currency Currency { get; set; }

    public DateTimeOffset DateCreated { get; set; }

    /// <summary>
    /// An active payout has a provider reference and a session may be requested. Not a live availability
    /// guarantee. Always false for terminal payouts.
    /// </summary>
    public bool CanResume { get; set; }
  }
}
