namespace Yoma.Core.Domain.Reward.Interfaces.Lookups
{
  public interface IRewardTransactionStatusService
  {
    Models.Lookups.RewardTransactionStatus GetByName(string name);

    Models.Lookups.RewardTransactionStatus? GetByNameOrNull(string name);

    Models.Lookups.RewardTransactionStatus GetById(Guid id);

    Models.Lookups.RewardTransactionStatus? GetByIdOrNull(Guid id);

    List<Models.Lookups.RewardTransactionStatus> List();
  }
}
