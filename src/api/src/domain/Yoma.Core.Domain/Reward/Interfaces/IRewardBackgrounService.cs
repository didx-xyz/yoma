namespace Yoma.Core.Domain.Reward.Interfaces
{
  public interface IRewardBackgrounService
  {
    void ProcessWalletCreation();

    void ProcessRewardTransactions();
  }
}
