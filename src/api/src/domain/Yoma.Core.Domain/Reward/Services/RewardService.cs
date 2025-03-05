using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.Reward.Interfaces;
using Yoma.Core.Domain.Reward.Interfaces.Lookups;
using Yoma.Core.Domain.Reward.Models;

namespace Yoma.Core.Domain.Reward.Services
{
  public class RewardService : IRewardService
  {
    #region Class Variables
    private readonly ILogger<RewardService> _logger;
    private readonly AppSettings _appSettings;
    private readonly IRewardTransactionStatusService _rewardTransactionStatusService;
    private readonly IRepositoryBatched<RewardTransaction> _rewardTransactionRepository;
    #endregion

    #region Constructor
    public RewardService(ILogger<RewardService> logger,
        IOptions<AppSettings> appSettings,
        IRewardTransactionStatusService rewardTransactionStatusService,
        IRepositoryBatched<RewardTransaction> rewardTransactionRepository)
    {
      _logger = logger;
      _appSettings = appSettings.Value;
      _rewardTransactionStatusService = rewardTransactionStatusService;
      _rewardTransactionRepository = rewardTransactionRepository;
    }
    #endregion

    #region Public Members
    public async Task ScheduleRewardTransaction(Guid userId, RewardTransactionEntityType entityType, Guid entityId, decimal amount)
    {
      if (userId == Guid.Empty) //used internally by other services which validates the user id prior to invocation
        throw new ArgumentNullException(nameof(userId));

      if (entityId == Guid.Empty) //used internally by other services which validates the entity id prior to invocation
        throw new ArgumentNullException(nameof(entityId));

      ArgumentOutOfRangeException.ThrowIfLessThanOrEqual(amount, default, nameof(amount));

      var statusPendingId = _rewardTransactionStatusService.GetByName(RewardTransactionStatus.Pending.ToString()).Id;

      RewardTransaction? existingItem = null;
      var item = new RewardTransaction { UserId = userId, StatusId = statusPendingId, SourceEntityType = entityType.ToString(), Amount = amount };

      switch (entityType)
      {
        case RewardTransactionEntityType.MyOpportunity:
#pragma warning disable CA1862 // Use the 'StringComparison' method overloads to perform case-insensitive string comparisons
          existingItem = _rewardTransactionRepository.Query().SingleOrDefault(o => o.SourceEntityType.ToLower() == entityType.ToString().ToLower() && o.MyOpportunityId == entityId);
#pragma warning restore CA1862 // Use the 'StringComparison' method overloads to perform case-insensitive string comparisons
          item.MyOpportunityId = entityId;
          break;

        default:
          throw new InvalidOperationException($"Entity type of '{entityType}' not supported");
      }

      if (existingItem != null)
      {
        _logger.LogInformation("Scheduling of reward transaction skipped: Already '{status}' for entity type '{entityType}' and entity id '{entityId}'", existingItem.Status, entityType, entityId);
        return;
      }

      await _rewardTransactionRepository.Create(item);
    }

    public List<RewardTransaction> ListPendingTransactionSchedule(Guid userId)
    {
      if (userId == Guid.Empty) //used internally by other services which validates the user id prior to invocation
        throw new ArgumentNullException(nameof(userId));

      var statusPendingId = _rewardTransactionStatusService.GetByName(RewardTransactionStatus.Pending.ToString()).Id;

      var results = _rewardTransactionRepository.Query().Where(o => o.UserId == userId && o.StatusId == statusPendingId).OrderBy(o => o.DateModified).ToList();

      return results;
    }

    public List<RewardTransaction> ListPendingTransactionSchedule(int batchSize, List<Guid> idsToSkip)
    {
      ArgumentOutOfRangeException.ThrowIfLessThanOrEqual(batchSize, default, nameof(batchSize));

      var statusPendingId = _rewardTransactionStatusService.GetByName(RewardTransactionStatus.Pending.ToString()).Id;

      var query = _rewardTransactionRepository.Query().Where(o => o.StatusId == statusPendingId);

      // skipped if wallets were not created (see RewardsBackgroundService)
      if (idsToSkip != null && idsToSkip.Count != 0)
        query = query.Where(o => !idsToSkip.Contains(o.Id));

      var results = query.OrderBy(o => o.DateModified).Take(batchSize).ToList();

      return results;
    }

    public async Task UpdateTransaction(RewardTransaction item)
    {
      ArgumentNullException.ThrowIfNull(item, nameof(item));

      UpdateTransactionProcess(item);

      await _rewardTransactionRepository.Update(item);
    }

    public async Task UpdateTransactions(List<RewardTransaction> items)
    {
      if (items == null || items.Count == 0) return;

      items.ForEach(o => UpdateTransactionProcess(o));

      await _rewardTransactionRepository.Update(items);
    }
    #endregion

    #region Private Members
    private void UpdateTransactionProcess(RewardTransaction item)
    {
      item.TransactionId = item.TransactionId?.Trim();

      var statusId = _rewardTransactionStatusService.GetByName(item.Status.ToString()).Id;
      item.StatusId = statusId;

      switch (item.Status)
      {
        case RewardTransactionStatus.ProcessedInitialBalance:
          if (!string.IsNullOrEmpty(item.TransactionId))
            throw new ArgumentOutOfRangeException(nameof(item), "Transaction id specified but not expected");
          item.ErrorReason = null;
          item.RetryCount = null;
          break;

        case RewardTransactionStatus.Processed:
          if (string.IsNullOrEmpty(item.TransactionId))
            throw new ArgumentNullException(nameof(item), "Transaction id required");
          item.ErrorReason = null;
          item.RetryCount = null;
          break;

        case RewardTransactionStatus.Error:
          if (string.IsNullOrEmpty(item.ErrorReason))
            throw new ArgumentNullException(nameof(item), "Error reason required");

          item.ErrorReason = item.ErrorReason?.Trim();
          item.RetryCount = (byte?)(item.RetryCount + 1) ?? 0; //1st attempt not counted as a retry

          //retry attempts specified and exceeded (-1: infinite retries)
          if (_appSettings.RewardMaximumRetryAttempts == 0 ||
            _appSettings.RewardMaximumRetryAttempts > 0 && item.RetryCount > _appSettings.RewardMaximumRetryAttempts) break;

          item.StatusId = _rewardTransactionStatusService.GetByName(RewardTransactionStatus.Pending.ToString()).Id;
          item.Status = RewardTransactionStatus.Pending;
          break;

        default:
          throw new InvalidOperationException($"Status of '{item.Status}' not supported");
      }
    }
    #endregion
  }
}
