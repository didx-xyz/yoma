using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Yoma.Core.Domain.Core.Exceptions;
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
    /// Records a partner sync pull processing entry.
    /// Pull processing is logged as processed immediately after the corresponding create, update or delete
    /// has been executed in the background job. If processing later fails, the existing entry is updated
    /// to error state via UpdateSchedulePull.
    /// If a create is requested for an entity already synchronized, it is recorded as an update.
    /// If an update is requested for an entity not previously synchronized, it is recorded as a create.
    /// Delete requires a previously synchronized entity and remains terminal once deleted.
    /// </summary>
    public async Task<ProcessingLog> SchedulePull(SyncAction action, Guid partnerId, EntityType entityType, string entityExternalId, Guid? entityId)
    {
      if (string.IsNullOrWhiteSpace(entityExternalId))
        throw new ArgumentNullException(nameof(entityExternalId));
      entityExternalId = entityExternalId.Trim();

      var partner = _partnerService.GetById(partnerId);

      var itemExisting = _processingLogHelperService.GetByEntityLatest(SyncType.Pull, partnerId, entityType, entityExternalId);

      var entityIdInfo = entityId.HasValue ? $"entity id '{entityId}'" : $"entity external id '{entityExternalId}'";

      SyncAction? actionExisting = null;
      if (itemExisting != null)
      {
        if (itemExisting.Status != ProcessingStatus.Processed && itemExisting.Status != ProcessingStatus.Error)
          throw new DataInconsistencyException($"Existing pull schedule in unexpected status: Partner id '{partnerId}', entity type '{entityType}', {entityIdInfo}, action '{itemExisting.Action}', status '{itemExisting.Status}'");

        actionExisting = Enum.Parse<SyncAction>(itemExisting.Action, true);
      }

      switch (action)
      {
        case SyncAction.Create:
          if (itemExisting == null) break;

          action = actionExisting!.Value switch
          {
            SyncAction.Create or SyncAction.Update => SyncAction.Update, //create already processed, schedule update to capture any changes during creation
            SyncAction.Delete => throw new InvalidOperationException($"Scheduling of partner sync pull creation requested for entity already deleted: Partner id '{partnerId}', entity type '{entityType}', {entityIdInfo}"),
            _ => throw new InvalidOperationException($"Action of '{actionExisting}' not supported"),
          };

          break;

        case SyncAction.Update:
          if (!entityId.HasValue)
            throw new ArgumentNullException(nameof(entityId));

          if (itemExisting == null)
          {
            action = SyncAction.Create; //if no existing schedule, schedule creation to ensure entity exists before update
            break;
          }

          action = actionExisting!.Value switch
          {
            SyncAction.Create or SyncAction.Update => SyncAction.Update, //update already processed or scheduled, schedule another update to capture any changes
            SyncAction.Delete => throw new InvalidOperationException($"Scheduling of partner sync pull update requested for entity already deleted: Partner id '{partnerId}', entity type '{entityType}', {entityIdInfo}"),
            _ => throw new InvalidOperationException($"Action of '{actionExisting}' not supported"),
          };

          break;

        case SyncAction.Delete:
          if (!entityId.HasValue)
            throw new ArgumentNullException(nameof(entityId));

          if (actionExisting == null)
            throw new InvalidOperationException($"Scheduling of partner sync pull deletion requested for entity not previously synchronized: Partner id '{partnerId}', entity type '{entityType}', {entityIdInfo}");

          action = actionExisting!.Value switch
          {
            SyncAction.Create or SyncAction.Update => SyncAction.Delete, //if previously created or updated, can be deleted
            SyncAction.Delete => throw new InvalidOperationException($"Scheduling of partner sync pull deletion requested for entity already deleted: Partner id '{partnerId}', entity type '{entityType}', {entityIdInfo}"),
            _ => throw new InvalidOperationException($"Action of '{actionExisting}' not supported"),
          };

          break;

        default:
          throw new InvalidOperationException($"Action of '{action}' not supported");
      }

      if (!partner.ActionEnabledParsed.Contains(action))
        throw new InvalidOperationException($"Action of '{action}' not enabled for partner '{partner.Name}'");

      partner.SyncTypesEnabledParsed.TryGetValue(SyncType.Pull, out var entityTypes);
      if (entityTypes == null || !entityTypes.Contains(entityType))
        throw new InvalidOperationException($"Entity type of '{entityType}' not enabled for partner '{partner.Name}' and sync type '{SyncType.Pull}'");

      var item = new ProcessingLog
      {
        EntityType = entityType.ToString(),
        PartnerId = partner.Id,
        SyncType = SyncType.Pull.ToString(),
        Action = action.ToString(),
        StatusId = _processingStatusService.GetByName(ProcessingStatus.Processed.ToString()).Id,
        Status = ProcessingStatus.Processed,
        OpportunityId = entityType switch
        {
          EntityType.Opportunity => entityId,
          _ => throw new InvalidOperationException($"Entity type of '{entityType}' not supported"),
        },
        EntityExternalId = entityExternalId
      };

      await _processingLogRepository.Create(item);

      return item;
    }

    public ProcessingLog? GetSchedulePull(Guid partnerId, EntityType entityType, string entityExternalId)
    {
      return _processingLogHelperService.GetByEntityLatest(SyncType.Pull, partnerId, entityType, entityExternalId);
    }

    public async Task UpdateSchedulePull(ProcessingLog item)
    {
      ArgumentNullException.ThrowIfNull(item, nameof(item));

      if (item.SyncType != SyncType.Pull.ToString())
        throw new InvalidOperationException($"Only '{SyncType.Pull}' sync type supported");

      if (string.IsNullOrWhiteSpace(item.EntityExternalId))
        throw new ArgumentNullException(nameof(item), "Entity external id required");

      item.EntityExternalId = item.EntityExternalId.Trim();

      switch (item.Status)
      {
        case ProcessingStatus.Error:
          if (string.IsNullOrWhiteSpace(item.ErrorReason))
            throw new ArgumentNullException(nameof(item), "Error reason required");

          item.ErrorReason = item.ErrorReason.Trim();
          item.RetryCount = (byte?)(item.RetryCount + 1) ?? 0; //1st attempt not counted as a retry

          // retry attempts specified and exceeded (-1: infinite retries)
          if (_appSettings.PartnerSyncMaximumRetryAttempts != 0 &&
            !(_appSettings.PartnerSyncMaximumRetryAttempts > 0 && item.RetryCount > _appSettings.PartnerSyncMaximumRetryAttempts))
          {
            // remains in processed state until retries are exceeded; once in error state, entity is skipped and requires manual intervention
            item.Status = ProcessingStatus.Processed;
          }

          break;

        default:
          throw new InvalidOperationException($"Status of '{item.Status}' not supported");
      }

      item.StatusId = _processingStatusService.GetByName(item.Status.ToString()).Id;

      await _processingLogRepository.Update(item);
    }

    /// <summary>
    /// Schedules the creation of a partner sync push entity.
    /// An entity can only be scheduled for creation once; if it is already scheduled (any status), it will be skipped (idempotent).
    /// If scheduled for update or delete an error will be thrown (logical invocation error).
    /// Once an entity, such as an opportunity, is deleted, it cannot be reinstated.
    /// Error status requires manual intervention and the entity will eventually be consistent with the latest scheduled action.
    /// </summary>
    public async Task ScheduleCreatePush(EntityType entityType, Guid entityId)
    {
      var existingItem = _processingLogHelperService.GetByEntityLatest(SyncType.Push, entityType, entityId);
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
      var existingItem = _processingLogHelperService.GetByEntityLatest(SyncType.Push, entityType, entityId);
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
      var existingItem = _processingLogHelperService.GetByEntityLatest(SyncType.Push, entityType, entityId);
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
          if (_appSettings.PartnerSyncMaximumRetryAttempts == 0 || //no retries
            (_appSettings.PartnerSyncMaximumRetryAttempts > 0 && item.RetryCount > _appSettings.PartnerSyncMaximumRetryAttempts)) break;

          item.StatusId = _processingStatusService.GetByName(ProcessingStatus.Pending.ToString()).Id;
          item.Status = ProcessingStatus.Pending;
          break;

        default:
          throw new InvalidOperationException($"Status of '{item.Status}' not supported");
      }

      await _processingLogRepository.Update(item);
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
