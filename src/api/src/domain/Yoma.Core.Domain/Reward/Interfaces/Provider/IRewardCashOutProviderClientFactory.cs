namespace Yoma.Core.Domain.Reward.Interfaces.Provider
{
  public interface IRewardCashOutProviderClientFactory
  {
    IRewardCashOutProviderClient CreateClient();
  }
}
