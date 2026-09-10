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
    /// Indicates an existing non-terminal payout. Do not create a second payout. Offer Continue cash-out when
    /// CanResume is true; otherwise show setup/recovery pending and allow a later refresh.
    /// </summary>
    public bool Active => Status is PayoutTransactionStatus.Initiated or PayoutTransactionStatus.Processing
      or PayoutTransactionStatus.ReconciliationRequired;

    /// <summary>
    /// Active payout status, or the latest terminal outcome when none is active. Null before the first payout.
    /// Processing starts at hosted-payout creation and does not prove youth confirmation or bank delivery.
    /// </summary>
    public PayoutTransactionStatus? Status { get; set; }

    /// <summary>
    /// An active payout has a provider reference so a hosted session can be requested. Not a live provider
    /// availability guarantee or proof that confirmation is still required. Terminal payouts cannot resume.
    /// </summary>
    public bool CanResume { get; set; }

    /// <summary>
    /// Active or latest terminal payout amount in Currency (currently USD). Null before the first payout.
    /// Separate from the ZLTO reservation and wallet accounting in UserProfileZlto. Amount alone does not imply Active.
    /// </summary>
    public decimal? Amount { get; set; }

    public Currency? Currency { get; set; }

    /// <summary>
    /// Initiation time of the active or latest payout, for display in the cash-out journey.
    /// </summary>
    public DateTimeOffset? DateCreated { get; set; }
  }
}
