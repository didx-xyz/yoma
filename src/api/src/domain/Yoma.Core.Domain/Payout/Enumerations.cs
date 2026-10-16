namespace Yoma.Core.Domain.Payout
{
  public enum Provider
  {
    YellowCard
  }

  public enum PayoutType
  {
    Payout,
    PayoutRewards
  }

  /// <summary>
  /// Represents the provider-neutral lifecycle of a payout transaction within Yoma.
  /// </summary>
  public enum PayoutTransactionStatus
  {
    /// <summary>
    /// Yoma has recorded the confirmed payout request, but acceptance by the payout provider has not yet been confirmed.
    /// </summary>
    Initiated,

    /// <summary>
    /// The payout provider has accepted the transaction and the payout is awaiting a terminal outcome.
    /// </summary>
    Processing,

    /// <summary>
    /// The expected processing window elapsed or an automatic status check could not establish a terminal outcome.
    /// The payout remains active and reserved funding must not be released while reconciliation continues.
    /// </summary>
    ReconciliationRequired,

    /// <summary>
    /// The payout provider confirmed that the payout completed successfully. This is a terminal status.
    /// </summary>
    Completed,

    /// <summary>
    /// The payout could not be initiated or the provider confirmed an unsuccessful outcome. This is a terminal status.
    /// </summary>
    Failed,

    /// <summary>
    /// The payout was intentionally stopped before completion by the user, Yoma or the provider. This is a terminal status.
    /// </summary>
    Cancelled,

    /// <summary>
    /// The payout provider confirmed that the permitted processing window elapsed before completion. This is a terminal status.
    /// </summary>
    Expired
  }
}
