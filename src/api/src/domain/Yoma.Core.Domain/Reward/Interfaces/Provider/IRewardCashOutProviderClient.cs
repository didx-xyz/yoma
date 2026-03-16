using Yoma.Core.Domain.Reward.Models.Provider;

namespace Yoma.Core.Domain.Reward.Interfaces.Provider
{
  public interface IRewardCashOutProviderClient
  {
    Task<RewardCashOutResponse> CashOutAsync(RewardCashOutRequest request);
  }
}
