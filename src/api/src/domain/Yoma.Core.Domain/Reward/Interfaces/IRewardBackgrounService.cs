namespace Yoma.Core.Domain.Reward.Interfaces
{
  public interface IRewardBackgrounService
  {
    Task ProcessWalletCreation();

    Task ProcessRewardTransactions();
  }
}
