namespace Yoma.Core.Domain.Reward
{
    public enum WalletCreationStatus
    {
        Unscheduled,
        Pending,
        Created,
        Error
    }

    public enum RewardAwardingStatus
    {
        Pending,
        Awarded,
        Error
    }   
}
