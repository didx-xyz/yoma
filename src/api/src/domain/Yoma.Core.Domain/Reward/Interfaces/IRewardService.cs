using Yoma.Core.Domain.Reward.Models;

namespace Yoma.Core.Domain.Reward.Interfaces
{
    public interface IRewardService
    {
        Task ScheduleRewardTransaction(Guid userId, RewardTransactionEntityType entityType, Guid entityId, decimal amount);

        List<RewardTransaction> ListPendingTransactionSchedule(Guid userId);

        List<RewardTransaction> ListPendingTransactionSchedule(int batchSize);

        Task UpdateTransaction(RewardTransaction item);

        Task UpdateTransactions(List<RewardTransaction> items);
    }
}
