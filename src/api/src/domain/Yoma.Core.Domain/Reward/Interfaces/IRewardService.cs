using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Reward.Models;

namespace Yoma.Core.Domain.Reward.Interfaces
{
  public interface IRewardService
  {
    Task ScheduleTransaction(Guid userId, RewardTransactionEntityType entityType, Guid entityId, decimal amount);

    RewardTransaction? GetByEntity(Guid userId, RewardTransactionEntityType entityType, Guid entityId, LockMode? lockMode = null);

    Task<RewardTransaction> RecordTransaction(Guid userId, RewardTransactionEntityType entityType, Guid entityId,
      RewardTransactionStatus status, decimal amount, string transactionId, DateTimeOffset? reservationExpiresAt = null);

    List<RewardTransaction> ListPendingTransactionSchedule(Guid userId);

    List<RewardTransaction> ListPendingTransactionSchedule(int batchSize, List<Guid> idsToSkip);

    Task UpdateTransaction(RewardTransaction item);

    Task UpdateTransactions(List<RewardTransaction> items);
  }
}
