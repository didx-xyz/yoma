using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.Marketplace.Interfaces;
using Yoma.Core.Domain.Marketplace.Interfaces.Lookups;
using Yoma.Core.Domain.Marketplace.Models;

namespace Yoma.Core.Domain.Marketplace.Services
{
  public class StoreAccessControlRuleBackgroundService : IStoreAccessControlRuleBackgroundService
  {
    #region Class Variables
    private readonly ILogger<StoreAccessControlRuleBackgroundService> _logger;
    private readonly ScheduleJobOptions _scheduleJobOptions;
    private readonly IStoreAccessControlRuleStatusService _storeAccessControlRuleStatusService;
    private readonly IDistributedLockService _distributedLockService;
    private readonly IRepositoryBatchedValueContainsWithNavigation<StoreAccessControlRule> _storeAccessControlRuleRepistory;

    private static readonly StoreAccessControlRuleStatus[] Statuses_Deletion = [StoreAccessControlRuleStatus.Inactive];
    #endregion

    #region Constructor
    public StoreAccessControlRuleBackgroundService(
      ILogger<StoreAccessControlRuleBackgroundService> logger,
      IOptions<ScheduleJobOptions> scheduleJobOptions,
      IStoreAccessControlRuleStatusService storeAccessControlRuleStatusService,
      IDistributedLockService distributedLockService,
      IRepositoryBatchedValueContainsWithNavigation<StoreAccessControlRule> storeAccessControlRuleRepistory)
    {
      _logger = logger;
      _scheduleJobOptions = scheduleJobOptions.Value;
      _storeAccessControlRuleStatusService = storeAccessControlRuleStatusService;
      _distributedLockService = distributedLockService;
      _storeAccessControlRuleRepistory = storeAccessControlRuleRepistory;
    }
    #endregion

    #region Public Members
    public async Task ProcessDeletion()
    {
      const string lockIdentifier = "action_link_process_deletion";
      var dateTimeNow = DateTimeOffset.UtcNow;
      var executeUntil = dateTimeNow.AddHours(_scheduleJobOptions.DefaultScheduleMaxIntervalInHours);
      var lockDuration = executeUntil - dateTimeNow + TimeSpan.FromMinutes(_scheduleJobOptions.DistributedLockDurationBufferInMinutes);
      var lockAcquired = false;

      try
      {
        lockAcquired = await _distributedLockService.TryAcquireLockAsync(lockIdentifier, lockDuration);
        if (!lockAcquired) return;

        var statusDeletionIds = Statuses_Deletion.Select(o => _storeAccessControlRuleStatusService.GetByName(o.ToString()).Id).ToList();
        var statusDeletedId = _storeAccessControlRuleStatusService.GetByName(StoreAccessControlRuleStatus.Deleted.ToString()).Id;

        _logger.LogInformation("Processing store access control rule deletion");

        while (executeUntil > DateTimeOffset.UtcNow)
        {
          var items = _storeAccessControlRuleRepistory.Query().Where(o => statusDeletionIds.Contains(o.StatusId) &&
              o.DateModified <= DateTimeOffset.UtcNow.AddDays(-_scheduleJobOptions.StoreAccessControlRuleDeletionScheduleIntervalInDays))
              .OrderBy(o => o.DateModified).Take(_scheduleJobOptions.StoreAccessControlRuleDeletionScheduleBatchSize).ToList();
          if (items.Count == 0) break;

          foreach (var item in items)
          {
            item.StatusId = statusDeletedId;
            item.Status = StoreAccessControlRuleStatus.Deleted;
            _logger.LogInformation("Store access control rule with id '{id}' flagged for deletion", item.Id);
          }

          await _storeAccessControlRuleRepistory.Update(items);

          if (executeUntil <= DateTimeOffset.UtcNow) break;
        }

        _logger.LogInformation("Processed store access control rule deletion");
      }
      catch (Exception ex)
      {
        _logger.LogError(ex, "Failed to execute {process}: {errorMessage}", nameof(ProcessDeletion), ex.Message);
      }
      finally
      {
        if (lockAcquired) await _distributedLockService.ReleaseLockAsync(lockIdentifier);
      }
    }
    #endregion
  }
}
