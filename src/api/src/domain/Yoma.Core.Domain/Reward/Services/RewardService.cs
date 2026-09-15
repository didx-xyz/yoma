using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Core.Exceptions;
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
    public async Task ScheduleTransaction(Guid userId, RewardTransactionEntityType entityType, Guid entityId, decimal amount)
    {
      if (userId == Guid.Empty) //used internally by other services which validates the user id prior to invocation
        throw new ArgumentNullException(nameof(userId));

      if (entityId == Guid.Empty) //used internally by other services which validates the entity id prior to invocation
        throw new ArgumentNullException(nameof(entityId));

      ArgumentOutOfRangeException.ThrowIfLessThanOrEqual(amount, default, nameof(amount));

      ValidateScheduledEntityType(entityType);

      var existingItem = GetByEntity(userId, entityType, entityId);
      if (existingItem != null)
      {
        if (_logger.IsEnabled(LogLevel.Information)) _logger.LogInformation("Scheduling of reward transaction skipped: Already '{status}' for user id '{userId}' entity type '{entityType}' and entity id '{entityId}'",
          existingItem.Status, userId, entityType, entityId);
        return;
      }

      var item = new RewardTransaction
      {
        UserId = userId,
        Provider = Provider.ZLTO.ToString(),
        StatusId = _rewardTransactionStatusService.GetByName(RewardTransactionStatus.Pending.ToString()).Id,
        Status = RewardTransactionStatus.Pending,
        SourceEntityType = entityType.ToString(),
        Amount = amount
      };
      SetEntity(item, entityType, entityId);

      await _rewardTransactionRepository.Create(item);
    }

    public RewardTransaction? GetByEntity(Guid userId, RewardTransactionEntityType entityType, Guid entityId, LockMode? lockMode = null)
    {
      if (userId == Guid.Empty)
        throw new ArgumentNullException(nameof(userId));

      if (entityId == Guid.Empty)
        throw new ArgumentNullException(nameof(entityId));

      var query = lockMode.HasValue ? _rewardTransactionRepository.Query(lockMode.Value) : _rewardTransactionRepository.Query();

#pragma warning disable CA1862 // Use the 'StringComparison' method overloads to perform case-insensitive string comparisons
      query = query.Where(o => o.UserId == userId && o.SourceEntityType.ToLower() == entityType.ToString().ToLower());
#pragma warning restore CA1862 // Use the 'StringComparison' method overloads to perform case-insensitive string comparisons

      return entityType switch
      {
        RewardTransactionEntityType.MyOpportunity => query.SingleOrDefault(o => o.MyOpportunityId == entityId),
        RewardTransactionEntityType.ReferralLinkUsage => query.SingleOrDefault(o => o.ReferralLinkUsageId == entityId),
        RewardTransactionEntityType.Payout => query.SingleOrDefault(o => o.PayoutTransactionId == entityId),
        _ => throw new InvalidOperationException($"Entity type of '{entityType}' not supported")
      };
    }

    public async Task<RewardTransaction> RecordTransaction(Guid userId, RewardTransactionEntityType entityType, Guid entityId,
      RewardTransactionStatus status, decimal amount, string transactionId, DateTimeOffset? reservationExpiresAt = null)
    {
      if (userId == Guid.Empty)
        throw new ArgumentNullException(nameof(userId));

      if (entityId == Guid.Empty)
        throw new ArgumentNullException(nameof(entityId));

      ArgumentOutOfRangeException.ThrowIfLessThanOrEqual(amount, default, nameof(amount));

      ArgumentException.ThrowIfNullOrWhiteSpace(transactionId, nameof(transactionId));
      transactionId = transactionId.Trim();

      switch (status)
      {
        case RewardTransactionStatus.Processed:
          if (reservationExpiresAt.HasValue)
            throw new ArgumentOutOfRangeException(nameof(reservationExpiresAt), "Reservation expiration not expected for a processed transaction");
          break;

        case RewardTransactionStatus.Reserved:
          if (entityType != RewardTransactionEntityType.Payout)
            throw new InvalidOperationException($"Status of '{status}' is only supported for reward payout transactions");
          if (!reservationExpiresAt.HasValue || reservationExpiresAt.Value == default)
            throw new ArgumentNullException(nameof(reservationExpiresAt));
          if (decimal.Truncate(amount) != amount)
            throw new ArgumentException("Payout amount must be a whole number", nameof(amount));
          break;

        default:
          throw new InvalidOperationException($"Status of '{status}' not supported when recording a reward transaction");
      }

      var result = GetByEntity(userId, entityType, entityId);
      if (result != null)
      {
        if (result.Amount != amount || !string.Equals(result.TransactionId, transactionId, StringComparison.Ordinal))
          throw new DataInconsistencyException($"Reward transaction mismatch detected for user id '{userId}' entity type '{entityType}' and entity id '{entityId}'");

        return result;
      }

      result = new RewardTransaction
      {
        Provider = Provider.ZLTO.ToString(),
        UserId = userId,
        StatusId = _rewardTransactionStatusService.GetByName(status.ToString()).Id,
        Status = status,
        SourceEntityType = entityType.ToString(),
        Amount = amount,
        TransactionId = transactionId,
        ReservationExpiresAt = reservationExpiresAt
      };
      SetEntity(result, entityType, entityId);

      return await _rewardTransactionRepository.Create(result);
    }

    public List<RewardTransaction> ListPendingTransactionSchedule(Guid userId)
    {
      if (userId == Guid.Empty) //used internally by other services which validates the user id prior to invocation
        throw new ArgumentNullException(nameof(userId));

      var results = QueryPendingTransactionSchedule().Where(o => o.UserId == userId).OrderBy(o => o.DateModified).ToList();

      return results;
    }

    public List<RewardTransaction> ListPendingTransactionSchedule(int batchSize, List<Guid> idsToSkip)
    {
      ArgumentOutOfRangeException.ThrowIfLessThanOrEqual(batchSize, default, nameof(batchSize));

      var query = QueryPendingTransactionSchedule();

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
    private IQueryable<RewardTransaction> QueryPendingTransactionSchedule()
    {
      var statusPendingId = _rewardTransactionStatusService.GetByName(RewardTransactionStatus.Pending.ToString()).Id;
      var sourceEntityTypeMyOpportunity = RewardTransactionEntityType.MyOpportunity.ToString();
      var sourceEntityTypeReferralLinkUsage = RewardTransactionEntityType.ReferralLinkUsage.ToString();

      return _rewardTransactionRepository.Query().Where(o =>
        o.StatusId == statusPendingId &&
        (o.SourceEntityType == sourceEntityTypeMyOpportunity || o.SourceEntityType == sourceEntityTypeReferralLinkUsage));
    }

    private static void ValidateScheduledEntityType(RewardTransactionEntityType entityType)
    {
      switch (entityType)
      {
        case RewardTransactionEntityType.MyOpportunity:
        case RewardTransactionEntityType.ReferralLinkUsage:
          break;

        default:
          throw new InvalidOperationException($"Entity type of '{entityType}' not supported when scheduling a reward transaction");
      }
    }
    private static void SetEntity(RewardTransaction item, RewardTransactionEntityType entityType, Guid entityId)
    {
      switch (entityType)
      {
        case RewardTransactionEntityType.MyOpportunity:
          item.MyOpportunityId = entityId;
          break;

        case RewardTransactionEntityType.ReferralLinkUsage:
          item.ReferralLinkUsageId = entityId;
          break;

        case RewardTransactionEntityType.Payout:
          item.PayoutTransactionId = entityId;
          break;

        default:
          throw new InvalidOperationException($"Entity type of '{entityType}' not supported");
      }
    }

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

        case RewardTransactionStatus.Reserved:
        case RewardTransactionStatus.Released:
          if (!string.Equals(item.SourceEntityType, RewardTransactionEntityType.Payout.ToString(), StringComparison.OrdinalIgnoreCase))
            throw new InvalidOperationException($"Status of '{item.Status}' is only supported for reward payout transactions");
          if (!item.PayoutTransactionId.HasValue)
            throw new ArgumentNullException(nameof(item), "Payout transaction id required");
          if (string.IsNullOrEmpty(item.TransactionId))
            throw new ArgumentNullException(nameof(item), "Reservation transaction id required");
          item.RetryCount = null;
          break;

        case RewardTransactionStatus.Error:
          ValidateScheduledEntityType(Enum.Parse<RewardTransactionEntityType>(item.SourceEntityType, true));

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
