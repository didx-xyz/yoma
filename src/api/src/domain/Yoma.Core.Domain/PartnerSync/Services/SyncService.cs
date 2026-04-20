using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.Opportunity;
using Yoma.Core.Domain.PartnerSync.Interfaces;
using Yoma.Core.Domain.PartnerSync.Interfaces.Lookups;
using Yoma.Core.Domain.PartnerSync.Models;

namespace Yoma.Core.Domain.PartnerSync.Services
{
  public class SyncService : ISyncService
  {
    #region Class Variables
    private readonly ILogger<SyncService> _logger;
    private readonly AppSettings _appSettings;
    private readonly IPartnerService _partnerService;
    private readonly IProcessingStatusService _processingStatusService;
    private readonly IProcessingLogHelperService _processingLogHelperService;
    private readonly IRepositoryBatched<ProcessingLog> _processingLogRepository;

    public static readonly Status[] Statuses_Opportunity_Creatable = [Status.Active]; //only active opportunities scheduled for creation
    public static readonly Status[] Statuses_Opportunity_Updatable = [Status.Active, Status.Inactive, Status.Expired]; //expired: might be updated with end date in the past
    public static readonly Status[] Statuses_Opportunity_CanDelete = [Status.Active, Status.Inactive, Status.Expired, Status.Deleted]; //active, inactive and expired: implicit deletion due to organization deletion
    #endregion

    #region Constructor
    public SyncService(ILogger<SyncService> logger,
       IOptions<AppSettings> appSettings,
       IPartnerService partnerService,
       IProcessingStatusService processingStatusService,
       IProcessingLogHelperService processingLogHelperService,
       IRepositoryBatched<ProcessingLog> processingLogRepository)
    {
      _logger = logger;
      _appSettings = appSettings.Value;
      _partnerService = partnerService;
      _processingStatusService = processingStatusService;
      _processingLogHelperService = processingLogHelperService;
      _processingLogRepository = processingLogRepository;
    }
    #endregion

    #region Public Members
    /// <summary>
    /// Schedules the creation of a partner sync push entity.
    /// An entity can only be scheduled for creation once; if it is already scheduled (any status), it will be skipped (idempotent).
    /// If scheduled for update or delete an error will be thrown (logical invocation error).
    /// Once an entity, such as an opportunity, is deleted, it cannot be reinstated.
    /// Error status requires manual intervention and the entity will eventually be consistent with the latest scheduled action.
    /// </summary>
    public async Task ScheduleCreatePush(EntityType entityType, Guid entityId)
    {
      var existingItem = _processingLogHelperService.GetByEntity(SyncType.Push, entityType, entityId);
      if (existingItem != null)
      {
        var action = Enum.Parse<SyncAction>(existingItem.Action, true);

        switch (action)
        {
          case SyncAction.Create:
            if (_logger.IsEnabled(LogLevel.Information)) _logger.LogInformation("Scheduling of partner sync push creation skipped: Currently scheduled with action '{action}' and status '{status}' for entity type '{entityType}' and entity id '{entityId}'",
              existingItem.Action, existingItem.Status, entityType, entityId);
            return;

          case SyncAction.Update:
          case SyncAction.Delete:
            throw new InvalidOperationException($"Scheduling of partner sync push created requested for entity already in a subsequent status: Current status of '{existingItem.Status}' for entity type '{existingItem.EntityType}' and entity id '{existingItem.Id}'");

          default:
            throw new InvalidOperationException($"Action of '{action}' not supported");
        }
      }

      await SchedulePush(SyncAction.Create, entityType, entityId, null);
      if (_logger.IsEnabled(LogLevel.Information)) _logger.LogInformation("Scheduling of partner sync push creation initiated: Entity type '{entityType}' and entity id '{entityId}'", entityType, entityId);
    }

    /// <summary>
    /// Schedules an update for a partner sync push entity.
    /// An entity can only be scheduled for update if it has been created and processed, and is not already scheduled for update (status pending or error) (idempotent).
    /// If the entity does not exist, it will be scheduled for creation else an update.
    /// If a creation if pending, the entity will eventually be created with the latest info, thus no update needed (see ISyncBackgroundService.ProcessSyncPush re-evaluation of creatable status).
    /// If an update is pending, the entity will eventually be updated with the latest info, thus another update not needed.
    /// Once an entity, such as an opportunity, is deleted, it cannot be reinstated. If scheduled for deletion an error will be thrown (logical invocation error).
    /// Error status requires manual intervention and the entity will eventually be consistent with the latest scheduled action
    /// </summary>
    public async Task ScheduleUpdatePush(EntityType entityType, Guid entityId, bool canCreate)
    {
      var actionSchedule = SyncAction.Update;
      var existingItem = _processingLogHelperService.GetByEntity(SyncType.Push, entityType, entityId);
      if (existingItem != null)
      {
        var action = Enum.Parse<SyncAction>(existingItem.Action, true);

        var skipScheduling = action switch
        {
          SyncAction.Create or SyncAction.Update => existingItem.Status != ProcessingStatus.Processed,
          SyncAction.Delete => throw new InvalidOperationException($"Scheduling of partner sync push update requested for entity already deleted: Current status of '{existingItem.Status}' for entity type '{existingItem.EntityType}' and entity id '{existingItem.Id}'"),
          _ => throw new InvalidOperationException($"Action of '{action}' not supported"),
        };

        if (skipScheduling)
        {
          if (_logger.IsEnabled(LogLevel.Information)) _logger.LogInformation("Scheduling of partner sync push update skipped: Currently scheduled with action '{action}' and status '{status}' for entity type '{entityType}' and entity id '{entityId}'",
            existingItem.Action, existingItem.Status, entityType, entityId);
          return;
        }
      }
      else
      {
        if (!canCreate)
        {
          if (_logger.IsEnabled(LogLevel.Information)) _logger.LogInformation("Scheduling of partner sync push create skipped: Entity type '{entityType}' and entity id '{entityId}' not creatable (active)", entityType, entityId);
          return;
        }
        actionSchedule = SyncAction.Create;
      }

      await SchedulePush(actionSchedule, entityType, entityId, existingItem?.EntityExternalId);
      if (_logger.IsEnabled(LogLevel.Information)) _logger.LogInformation("Scheduling of partner sync push update initiated: Entity type '{entityType}' and entity id '{entityId}'", entityType, entityId);
    }

    /// <summary>
    /// Schedules the deletion of a partner sync push entity.
    /// An entity can only be scheduled for deletion if it has been created.
    /// If scheduled for creation and not processed, it will be aborted and no further action will be taken.
    /// If scheduled for update and not processed, it will be aborted and then scheduled for deletion.
    /// If already scheduled for deletion, it will be skipped (idempotent).
    /// If the entity does not exist, it will be skipped.
    /// Once an entity, such as an opportunity, is deleted, it cannot be reinstated.
    /// </summary>
    public async Task ScheduleDeletePush(EntityType entityType, Guid entityId)
    {
      var existingItem = _processingLogHelperService.GetByEntity(SyncType.Push, entityType, entityId);
      if (existingItem != null)
      {
        var action = Enum.Parse<SyncAction>(existingItem.Action, true);

        switch (action)
        {
          case SyncAction.Create:
            if (existingItem.Status == ProcessingStatus.Processed) break;
            existingItem.StatusId = _processingStatusService.GetByName(ProcessingStatus.Aborted.ToString()).Id;
            existingItem.Status = ProcessingStatus.Aborted;
            await _processingLogRepository.Update(existingItem);
            return;

          case SyncAction.Update:
            if (existingItem.Status == ProcessingStatus.Processed) break;
            existingItem.StatusId = _processingStatusService.GetByName(ProcessingStatus.Aborted.ToString()).Id;
            existingItem.Status = ProcessingStatus.Aborted;
            await _processingLogRepository.Update(existingItem);
            break;

          case SyncAction.Delete:
            if (_logger.IsEnabled(LogLevel.Information)) _logger.LogInformation("Scheduling of partner sync push deletion skipped: Already scheduled for '{action}'. Current status '{status}' for entity type '{entityType}' and entity id '{entityId}'",
            existingItem.Action, existingItem.Status, entityType, entityId);
            return;

          default:
            throw new InvalidOperationException($"Action of '{action}' not supported");
        }
      }
      else
      {
        if (_logger.IsEnabled(LogLevel.Information)) _logger.LogInformation("Scheduling of partner sync push deletion skipped: Entity type '{entityType}' and entity id '{entityId}' not shared", entityType, entityId);
        return;
      }

      await SchedulePush(SyncAction.Delete, entityType, entityId, existingItem?.EntityExternalId);
      if (_logger.IsEnabled(LogLevel.Information)) _logger.LogInformation("Scheduling of partner sync push deletion initiated: Entity type '{entityType}' and entity id '{entityId}'", entityType, entityId);
    }

    public List<ProcessingLog> ListSchedulePendingPush(int batchSize, List<Guid> idsToSkip)
    {
      ArgumentOutOfRangeException.ThrowIfLessThanOrEqual(batchSize, default, nameof(batchSize));

      var statusPendingId = _processingStatusService.GetByName(ProcessingStatus.Pending.ToString()).Id;

      var query = _processingLogRepository.Query().Where(o => o.SyncType == SyncType.Push.ToString() && o.StatusId == statusPendingId);

      if (idsToSkip != null && idsToSkip.Count != 0)
        query = query.Where(o => !idsToSkip.Contains(o.Id));

      var results = query.OrderBy(o => o.DateModified).Take(batchSize).ToList();

      return results;
    }

    public async Task UpdateSchedulePush(ProcessingLog item)
    {
      ArgumentNullException.ThrowIfNull(item, nameof(item));

      if (item.SyncType != SyncType.Push.ToString())
        throw new InvalidOperationException($"Only '{SyncType.Push}' sync type supported");

      item.EntityExternalId = item.EntityExternalId?.Trim();

      var statusId = _processingStatusService.GetByName(item.Status.ToString()).Id;
      item.StatusId = statusId;

      switch (item.Status)
      {
        case ProcessingStatus.Aborted:
          // invoked during sync push background processing (ProcessSyncPush) when a scheduled 'Create'
          // is no longer valid to execute — e.g., opportunity is no longer in a creatable state
          // or the associated organization is inactive. Aborting prevents unnecessary errors or retries.
          var action = Enum.Parse<SyncAction>(item.Action, true);
          if (action != SyncAction.Create)
            throw new InvalidOperationException($"Action of '{action}' not supported for status '{item.Status}'");
          item.ErrorReason = null;
          item.RetryCount = null;
          break;

        case ProcessingStatus.Processed:
          if (string.IsNullOrEmpty(item.EntityExternalId))
            throw new ArgumentNullException(nameof(item), "External id required");
          item.ErrorReason = null;
          item.RetryCount = null;
          break;

        case ProcessingStatus.Error:
          if (string.IsNullOrEmpty(item.ErrorReason))
            throw new ArgumentNullException(nameof(item), "Error reason required");

          item.ErrorReason = item.ErrorReason?.Trim();
          item.RetryCount = (byte?)(item.RetryCount + 1) ?? 0; //1st attempt not counted as a retry

          //retry attempts specified and exceeded (-1: infinite retries)
          if (_appSettings.PartnerSyncPushMaximumRetryAttempts == 0 || //no retries
            (_appSettings.PartnerSyncPushMaximumRetryAttempts > 0 && item.RetryCount > _appSettings.PartnerSyncPushMaximumRetryAttempts)) break;

          item.StatusId = _processingStatusService.GetByName(ProcessingStatus.Pending.ToString()).Id;
          item.Status = ProcessingStatus.Pending;
          break;

        default:
          throw new InvalidOperationException($"Status of '{item.Status}' not supported");
      }

      await _processingLogRepository.Update(item);
    }

    public Task LogPull(Guid partnerId, SyncAction action, EntityType entityType, Guid? entityId, string entityExternalId, string? errorReason = null)
    {
      throw new NotImplementedException();

      //TODO: Get latest pull processing log by partner, entity type and external id
      //TODO: Determine required pull action from latest log state and local entity state
      //TODO: Create or update the pull processing log accordingly
      //TODO: Respect retry and permanent skip rules for pull
    }
    #endregion

    #region Private Members
    private async Task SchedulePush(SyncAction action, EntityType entityType, Guid entityId, string? entityExternalId)
    {
      var items = new List<ProcessingLog>();
      var partners = _partnerService.ListPush(action, entityType, entityId);

      foreach (var partner in partners)
      {
        items.Add(new ProcessingLog
        {
          EntityType = entityType.ToString(),
          PartnerId = partner.Id,
          SyncType = SyncType.Push.ToString(),
          Action = action.ToString(),
          StatusId = _processingStatusService.GetByName(ProcessingStatus.Pending.ToString()).Id,
          OpportunityId = entityType switch
          {
            EntityType.Opportunity => (Guid?)entityId,
            _ => throw new InvalidOperationException($"Entity type of '{entityType}' not supported"),
          },
          EntityExternalId = entityExternalId
        });
      }

      if (items.Count != 0)
        await _processingLogRepository.Create(items);
    }
    #endregion
  }
}
