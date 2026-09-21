using Yoma.Core.Domain.Payout;
using Yoma.Core.Domain.Payout.Models;

namespace Yoma.Core.Domain.Entity.Models
{
  /// <summary>
  /// Profile payout summary and country availability. CanCancel is intentionally excluded:
  /// local status cannot distinguish provider initiation from submission, and checking the
  /// provider on every profile load would add latency while still returning a snapshot.
  /// Obtain cancellation eligibility on demand from PayoutSession or PayoutTransactionInfo;
  /// the provider rechecks it atomically when cancellation is requested.
  /// </summary>
  public sealed class UserProfilePayout
  {
    /// <summary>
    /// New payouts are enabled in this environment. Independent of country/provider availability.
    /// When false, existing active payouts may still resume and settle.
    /// </summary>
    public bool Enabled { get; set; }

    /// <summary>
    /// Indicates whether the user's profile country is currently supported and whether the provider's
    /// live country availability could be determined. This controls new payout initiation only; an active
    /// payout remains resumable regardless of country availability.
    /// </summary>
    public PayoutCountryAvailability CountryAvailability { get; set; } = new();

    /// <summary>
    /// Indicates an existing non-terminal payout. Do not create a second payout. Offer Continue cash-out when
    /// CanResume is true; otherwise show setup/recovery pending and allow a later refresh.
    /// </summary>
    public bool Active => Status is PayoutTransactionStatus.Initiated or PayoutTransactionStatus.Processing
      or PayoutTransactionStatus.ReconciliationRequired;

    /// <summary>
    /// Active payout status only. Null when no payout is in flight; terminal outcomes are queried separately.
    /// Processing starts at hosted-payout creation and does not prove youth confirmation or bank delivery.
    /// </summary>
    public PayoutTransactionStatus? Status { get; set; }

    /// <summary>
    /// An active payout has a provider reference so a hosted session can be requested. Not a live provider
    /// availability guarantee or proof that confirmation is still required. Terminal payouts cannot resume.
    /// </summary>
    public bool CanResume { get; set; }

    /// <summary>
    /// Active payout amount in Currency (currently USD). Null when no payout is in flight.
    /// Separate from the ZLTO reservation and wallet accounting in UserProfileZlto. Amount alone does not imply Active.
    /// </summary>
    public decimal? Amount { get; set; }

    /// <summary>
    /// Currency of the active payout Amount (currently USD). Null when no payout is in flight.
    /// Independent of the current profile country's CountryAvailability.Currency.
    /// </summary>
    public Currency? Currency { get; set; }

    /// <summary>
    /// Initiation time of the active payout. Null when no payout is in flight.
    /// </summary>
    public DateTimeOffset? DateCreated { get; set; }
  }
}
