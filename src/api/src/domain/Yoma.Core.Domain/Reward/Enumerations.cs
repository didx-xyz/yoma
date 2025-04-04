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
    MyOpportunity
  }

  public enum RewardTransactionStatus
  {
    Pending,
    Processed,
    ProcessedInitialBalance,
    Error
  }

  public enum VoucherStatus
  {
    New,
    Viewed
  }
}
