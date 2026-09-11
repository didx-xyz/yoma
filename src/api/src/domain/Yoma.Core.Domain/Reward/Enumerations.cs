namespace Yoma.Core.Domain.Reward
{
  public enum WalletCreationStatus
  {
    Unscheduled,
    Pending,
    PendingUsernameUpdate,
    Created,
    Error
  }

  public enum RewardTransactionEntityType
  {
    MyOpportunity,
    ReferralLinkUsage,
    Payout
  }

  public enum RewardTransactionStatus
  {
    /// <summary>
    /// A reward award has been scheduled and is awaiting processing by the reward background service.
    /// </summary>
    Pending,

    /// <summary>
    /// The provider transaction completed successfully. The reward was awarded or the reserved payout amount was burned.
    /// </summary>
    Processed,

    /// <summary>
    /// The reward was included in the balance assigned when the user's provider wallet was created and requires no separate provider transaction.
    /// </summary>
    ProcessedInitialBalance,

    /// <summary>
    /// Processing of a scheduled reward award failed. The transaction may be returned to Pending according to the configured retry policy.
    /// </summary>
    Error,

    /// <summary>
    /// The reward amount is reserved by the provider for payout and is unavailable, but has not yet been burned.
    /// </summary>
    Reserved,

    /// <summary>
    /// The payout reservation was released without burning the reward amount.
    /// </summary>
    Released
  }

  public enum VoucherStatus
  {
    New,
    Viewed
  }

  public enum Provider
  {
    ZLTO
  }
}
