using Hangfire;
using Hangfire.Storage;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System.Transactions;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.MyOpportunity.Interfaces;
using Yoma.Core.Domain.Opportunity.Extensions;
using Yoma.Core.Domain.Opportunity.Interfaces;
using Yoma.Core.Domain.Reward.Interfaces;
using Yoma.Core.Domain.Reward.Interfaces.Provider;
using Yoma.Core.Domain.Reward.Models;
using Yoma.Core.Domain.Reward.Models.Provider;
using Yoma.Core.Domain.SSI.Services;

namespace Yoma.Core.Domain.Reward.Services
{
  public class RewardBackgroundService : IRewardBackgroundService
  {
    #region Class Variables
    private readonly ILogger<SSIBackgroundService> _logger;
    private readonly ScheduleJobOptions _scheduleJobOptions;
    private readonly IWalletService _walletService;
    private readonly IRewardService _rewardService;
    private readonly IMyOpportunityService _myOpportunityService;
    private readonly IOpportunityService _opportunityService;
    private readonly IRewardProviderClient _rewardProviderClient;
    private readonly IExecutionStrategyService _executionStrategyService;
    private readonly IDistributedLockService _distributedLockService;
    #endregion

    #region Constructor
    public RewardBackgroundService(ILogger<SSIBackgroundService> logger,
        IOptions<ScheduleJobOptions> scheduleJobOptions,
        IWalletService walletService,
        IRewardService rewardService,
        IMyOpportunityService myOpportunityService,
        IOpportunityService opportunityService,
        IRewardProviderClientFactory rewardProviderClientFactory,
        IExecutionStrategyService executionStrategyService,
        IDistributedLockService distributedLockService)
    {
      _logger = logger;
      _scheduleJobOptions = scheduleJobOptions.Value;
      _walletService = walletService;
      _rewardService = rewardService;
      _myOpportunityService = myOpportunityService;
      _opportunityService = opportunityService;
      _rewardProviderClient = rewardProviderClientFactory.CreateClient();
      _executionStrategyService = executionStrategyService;
      _distributedLockService = distributedLockService;
    }
    #endregion

    #region Public Members
    public async Task ProcessWalletCreation()
    {
      const string lockIdentifier = "reward_process_wallet_creation";
      var dateTimeNow = DateTimeOffset.UtcNow;
      var executeUntil = dateTimeNow.AddHours(_scheduleJobOptions.RewardWalletCreationScheduleMaxIntervalInHours);
      var lockDuration = executeUntil - dateTimeNow + TimeSpan.FromMinutes(_scheduleJobOptions.DistributedLockDurationBufferInMinutes);

      if (!await _distributedLockService.TryAcquireLockAsync(lockIdentifier, lockDuration))
      {
        _logger.LogInformation("{Process} is already running. Skipping execution attempt at {dateStamp}", nameof(ProcessWalletCreation), DateTimeOffset.UtcNow);
        return;
      }

      try
      {
        using (JobStorage.Current.GetConnection().AcquireDistributedLock(lockIdentifier, lockDuration))
        {
          _logger.LogInformation("Lock '{lockIdentifier}' acquired by {hostName} at {dateStamp}. Lock duration set to {lockDurationInMinutes} minutes",
            lockIdentifier, Environment.MachineName, DateTimeOffset.UtcNow, lockDuration.TotalMinutes);

          _logger.LogInformation("Processing reward wallet creation");

          var itemIdsToSkip = new List<Guid>();
          while (executeUntil > DateTimeOffset.UtcNow)
          {
            var items = _walletService.ListPendingCreationSchedule(_scheduleJobOptions.RewardWalletCreationScheduleBatchSize, itemIdsToSkip);
            if (items.Count == 0) break;

            foreach (var item in items)
            {
              var pendingStatus = item.Status;
              try
              {
                _logger.LogInformation("Processing reward wallet creation for item with id '{id}'", item.Id);

                switch (pendingStatus)
                {
                  case WalletCreationStatus.Pending:
                    _logger.LogInformation("Creating reward wallet");

                    await _executionStrategyService.ExecuteInExecutionStrategyAsync(async () =>
                    {
                      using var scope = new TransactionScope(TransactionScopeOption.RequiresNew, TransactionScopeAsyncFlowOption.Enabled);

                      var (username, wallet) = await _walletService.CreateWallet(item.UserId);

                      item.Username = username;
                      item.WalletId = wallet.Id;
                      item.Balance = wallet.Balance; //track initial balance upon creation, if any
                      item.Status = WalletCreationStatus.Created;
                      await _walletService.UpdateScheduleCreation(item, pendingStatus);

                      scope.Complete();
                    });

                    _logger.LogInformation("Created reward wallet");
                    break;

                  case WalletCreationStatus.PendingUsernameUpdate:
                    _logger.LogInformation("Updating reward wallet username");

                    var username = await _walletService.UpdateWalletUsername(item.UserId);

                    item.Username = username;
                    item.Status = WalletCreationStatus.Created;
                    await _walletService.UpdateScheduleCreation(item, pendingStatus);

                    _logger.LogInformation("Updated reward wallet username");
                    break;

                  default:
                    throw new InvalidOperationException($"Pending status of '{pendingStatus}' not supported");
                }

                _logger.LogInformation("Processed reward wallet creation for item with id '{id}'", item.Id);
              }
              catch (Exception ex)
              {
                _logger.LogError(ex, "Failed to proceess reward wallet creation for item with id '{id}': {errorMessage}", item.Id, ex.Message);

                item.Status = WalletCreationStatus.Error;
                item.ErrorReason = ex.Message;
                await _walletService.UpdateScheduleCreation(item, pendingStatus);

                itemIdsToSkip.Add(item.Id);
              }

              if (executeUntil <= DateTimeOffset.UtcNow) break;
            }
          }

          _logger.LogInformation("Processed reward wallet creation");
        }
      }
      catch (DistributedLockTimeoutException ex)
      {
        _logger.LogError(ex, "Could not acquire distributed lock for {process}: {errorMessage}", nameof(ProcessWalletCreation), ex.Message);
      }
      catch (Exception ex)
      {
        _logger.LogError(ex, "Failed to execute {process}: {errorMessage}", nameof(ProcessWalletCreation), ex.Message);
      }
      finally
      {
        await _distributedLockService.ReleaseLockAsync(lockIdentifier);
      }
    }

    public async Task ProcessRewardTransactions()
    {
      const string lockIdentifier = "reward_process_transactions";
      var dateTimeNow = DateTimeOffset.UtcNow;
      var executeUntil = dateTimeNow.AddHours(_scheduleJobOptions.RewardTransactionScheduleMaxIntervalInHours);
      var lockDuration = executeUntil - dateTimeNow + TimeSpan.FromMinutes(_scheduleJobOptions.DistributedLockDurationBufferInMinutes);

      if (!await _distributedLockService.TryAcquireLockAsync(lockIdentifier, lockDuration))
      {
        _logger.LogInformation("{Process} is already running. Skipping execution attempt at {dateStamp}", nameof(ProcessRewardTransactions), DateTimeOffset.UtcNow);
        return;
      }

      try
      {
        using (JobStorage.Current.GetConnection().AcquireDistributedLock(lockIdentifier, lockDuration))
        {
          _logger.LogInformation("Lock '{lockIdentifier}' acquired by {hostName} at {dateStamp}. Lock duration set to {lockDurationInMinutes} minutes",
            lockIdentifier, Environment.MachineName, DateTimeOffset.UtcNow, lockDuration.TotalMinutes);

          _logger.LogInformation("Processing reward transactions");

          var itemIdsToSkip = new List<Guid>();
          while (executeUntil > DateTimeOffset.UtcNow)
          {
            var items = _rewardService.ListPendingTransactionSchedule(_scheduleJobOptions.RewardTransactionScheduleBatchSize, itemIdsToSkip);
            if (items.Count == 0) break;

            foreach (var item in items)
            {
              try
              {
                _logger.LogInformation("Processing reward transaction for item with id '{id}'", item.Id);

                var (proceed, userEmail, walletId) = GetWalletId(item, item.UserId);
                if (!proceed)
                {
                  itemIdsToSkip.Add(item.Id);
                  continue;
                }

                var sourceEntityType = Enum.Parse<RewardTransactionEntityType>(item.SourceEntityType, true);

                var request = new RewardAwardRequest
                {
                  Type = sourceEntityType,
                  Username = userEmail!,
                  UserWalletId = walletId!,
                  Amount = item.Amount
                };

                switch (sourceEntityType)
                {
                  case RewardTransactionEntityType.MyOpportunity:
                    if (!item.MyOpportunityId.HasValue)
                      throw new InvalidOperationException($"Source entity type '{item.SourceEntityType}': 'My' opportunity id is null");

                    var myOpportunity = _myOpportunityService.GetById(item.MyOpportunityId.Value, false, false, false);
                    var opportunity = _opportunityService.GetById(myOpportunity.OpportunityId, true, false, false);

                    request.Id = myOpportunity.Id;
                    request.Title = opportunity.Title;
                    request.Description = opportunity.Description;
                    request.Instructions = opportunity.Instructions;
                    request.Skills = opportunity.Skills;
                    request.Countries = opportunity.Countries;
                    request.Languages = opportunity.Languages;
                    request.TimeInvestedInHours = opportunity.TimeIntervalToHours();
                    request.ExternalURL = opportunity.URL;
                    request.StartDate = myOpportunity.DateStart;
                    request.EndDate = myOpportunity.DateEnd;

                    break;

                  default:
                    throw new InvalidOperationException($"Source entity type of '{sourceEntityType}' not supported");
                }

                item.TransactionId = await _rewardProviderClient.RewardEarn(request);
                item.Status = RewardTransactionStatus.Processed;
                await _rewardService.UpdateTransaction(item);

                _logger.LogInformation("Processed reward transaction for item with id '{id}'", item.Id);
              }
              catch (Exception ex)
              {
                _logger.LogError(ex, "Failed to process reward transaction for item with id '{id}': {errorMessage}", item.Id, ex.Message);

                item.Status = RewardTransactionStatus.Error;
                item.ErrorReason = ex.Message;
                await _rewardService.UpdateTransaction(item);

                itemIdsToSkip.Add(item.Id);
              }

              if (executeUntil <= DateTimeOffset.UtcNow) break;
            }
          }

          _logger.LogInformation("Processed reward transactions");
        }
      }
      catch (DistributedLockTimeoutException ex)
      {
        _logger.LogError(ex, "Could not acquire distributed lock for {process}: {errorMessage}", nameof(ProcessRewardTransactions), ex.Message);
      }
      catch (Exception ex)
      {
        _logger.LogError(ex, "Failed to execute {process}: {errorMessage}", nameof(ProcessRewardTransactions), ex.Message);
      }
      finally
      {
        await _distributedLockService.ReleaseLockAsync(lockIdentifier);
      }
    }
    #endregion

    #region Private Members
    private (bool proceed, string? username, string? walletId) GetWalletId(RewardTransaction item, Guid userId)
    {
      var (username, walletId) = _walletService.GetWalletIdOrNull(userId);
      if (string.IsNullOrEmpty(walletId))
      {
        _logger.LogInformation(
            "Processing of reward transaction for item with id '{itemId}' " +
            "was skipped as the wallet creation for user with id '{userId}' has not been completed", item.Id, userId);
        return (false, null, null);
      }
      return (true, username, walletId);
    }
    #endregion
  }
}
