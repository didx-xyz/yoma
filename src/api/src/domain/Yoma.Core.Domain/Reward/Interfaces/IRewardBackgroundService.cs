namespace Yoma.Core.Domain.Reward.Interfaces
{
  public interface IRewardBackgroundService
  {
    Task ProcessWalletCreation();

    Task ProcessRewardTransactions();
  }
}
