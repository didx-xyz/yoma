namespace Yoma.Core.Domain.Reward.Interfaces.Provider
{
  public interface IRewardProviderClientFactory
  {
    IRewardProviderClient CreateClient();
  }
}
