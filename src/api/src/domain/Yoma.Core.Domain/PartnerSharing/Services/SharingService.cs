using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.Opportunity;
using Yoma.Core.Domain.PartnerSharing.Interfaces;
using Yoma.Core.Domain.PartnerSharing.Interfaces.Lookups;
using Yoma.Core.Domain.PartnerSharing.Models;

namespace Yoma.Core.Domain.PartnerSharing.Services
{
  public class SharingService : ISharingService
  {
    #region Class Variables
    private readonly ILogger<SharingService> _logger;
    private readonly AppSettings _appSettings;
    private readonly IPartnerService _partnerService;
    private readonly IProcessingStatusService _processingStatusService;
    private readonly IRepositoryBatched<ProcessingLog> _processingLogRepository;

    public static readonly Status[] Statuses_Opportunity_Creatable = [Status.Active]; //only active opportunities scheduled for creation
    public static readonly Status[] Statuses_Opportunity_Updatable = [Status.Active, Status.Inactive, Status.Expired]; //expired: might be updated with end date in the past
    public static readonly Status[] Statuses_Opportunity_CanDelete = [Status.Active, Status.Inactive, Status.Expired, Status.Deleted]; //active, inactive and expired: implicit deletion due to organization deletion
    #endregion

    #region Constructor
    public SharingService(ILogger<SharingService> logger,
       IOptions<AppSettings> appSettings,
       IPartnerService partnerService,
       IProcessingStatusService processingStatusService,
       IRepositoryBatched<ProcessingLog> processingLogRepository)
    {
      _logger = logger;
      _appSettings = appSettings.Value;
      _partnerService = partnerService;
      _processingStatusService = processingStatusService;
      _processingLogRepository = processingLogRepository;
    }
    #endregion

    #region Public Members
    /// <summary>
    /// Schedules the creation of a partner sharing entity.
    /// An entity can only be scheduled for creation once; if it is already scheduled (any status), it will be skipped (independency).
    /// If scheduled for update or delete an error will be thrown (logical invocation error).
    /// Once an entity, such as an opportunity, is deleted, it cannot be reinstated.
    /// Error status requires manual intervention and the entity will eventually be consistent with the latest scheduled action.
    /// </summary>
    public async Task ScheduleCreate(EntityType entityType, Guid entityId)
    {
      var existingItem = GetByEntity(entityType, entityId);
      if (existingItem != null)
      {
        var action = Enum.Parse<ProcessingAction>(existingItem.Action, true);

        switch (action)
        {
          case ProcessingAction.Create:
            _logger.LogInformation("Scheduling of partner sharing creation skipped: Currently scheduled with action '{action}' and status '{status}' for entity type '{entityType}' and entity id '{entityId}'",
              existingItem.Action, existingItem.Status, entityType, entityId);
            return;

          case ProcessingAction.Update:
          case ProcessingAction.Delete:
            throw new InvalidOperationException($"Scheduling of partner sharing created requested for entity already in a subsequent status: Current status of '{existingItem.Status}' for entity type '{existingItem.EntityType}' and entity id '{existingItem.Id}'");

          default:
            throw new InvalidOperationException($"Action of '{action}' not supported");
        }
      }

      await Schedule(ProcessingAction.Create, entityType, entityId, null);
      _logger.LogInformation("Scheduling of partner sharing creation initiated: Entity type '{entityType}' and entity id '{entityId}'", entityType, entityId);
    }

    /// <summary>
    /// Schedules an update for a partner sharing entity.
    /// An entity can only be scheduled for update if it has been created and processed, and is not already scheduled for update (status pending or error) (independency).
    /// If the entity does not exist, it will be scheduled for creation else an update.
    /// If a creation if pending, the entity will eventually be created with the latest info, thus no update needed.
    /// If an update is pending, the entity will eventually be updated with the latest info, thus another update not needed.
    /// Once an entity, such as an opportunity, is deleted, it cannot be reinstated. If scheduled for deletion an error will be thrown (logical invocation error).
    /// Error status requires manual intervention and the entity will eventually be consistent with the latest scheduled action
    /// </summary>
    public async Task ScheduleUpdate(EntityType entityType, Guid entityId, bool canCreate)
    {
      var actionSchedule = ProcessingAction.Update;
      var existingItem = GetByEntity(entityType, entityId);
      if (existingItem != null)
      {
        var action = Enum.Parse<ProcessingAction>(existingItem.Action, true);

        var skipScheduling = action switch
        {
          ProcessingAction.Create or ProcessingAction.Update => existingItem.Status != ProcessingStatus.Processed,
          ProcessingAction.Delete => throw new InvalidOperationException($"Scheduling of partner sharing update requested for entity already deleted: Current status of '{existingItem.Status}' for entity type '{existingItem.EntityType}' and entity id '{existingItem.Id}'"),
          _ => throw new InvalidOperationException($"Action of '{action}' not supported"),
        };

        if (skipScheduling)
        {
          _logger.LogInformation("Scheduling of partner sharing update skipped: Currently scheduled with action '{action}' and status '{status}' for entity type '{entityType}' and entity id '{entityId}'",
            existingItem.Action, existingItem.Status, entityType, entityId);
          return;
        }
      }
      else
      {
        if (!canCreate)
        {
          _logger.LogInformation("Scheduling of partner sharing create skipped: Entity type '{entityType}' and entity id '{entityId}' not creatable (active)", entityType, entityId);
          return;
        }
        actionSchedule = ProcessingAction.Create;
      }

      await Schedule(actionSchedule, entityType, entityId, existingItem?.EntityExternalId);
      _logger.LogInformation("Scheduling of partner sharing update initiated: Entity type '{entityType}' and entity id '{entityId}'", entityType, entityId);
    }

    /// <summary>
    /// Schedules the deletion of a partner sharing entity.
    /// An entity can only be scheduled for deletion if it has been created.
    /// If scheduled for creation and not processed, it will be aborted and no further action will be taken.
    /// If scheduled for update and not processed, it will be aborted and then scheduled for deletion.
    /// If already scheduled for deletion, it will be skipped (independency).
    /// If the entity does not exist, it will be skipped.
    /// Once an entity, such as an opportunity, is deleted, it cannot be reinstated.
    /// </summary>
    public async Task ScheduleDelete(EntityType entityType, Guid entityId)
    {
      var existingItem = GetByEntity(entityType, entityId);
      if (existingItem != null)
      {
        var action = Enum.Parse<ProcessingAction>(existingItem.Action, true);

        switch (action)
        {
          case ProcessingAction.Create:
            if (existingItem.Status == ProcessingStatus.Processed) break;
            existingItem.StatusId = _processingStatusService.GetByName(ProcessingStatus.Aborted.ToString()).Id;
            existingItem.Status = ProcessingStatus.Aborted;
            await _processingLogRepository.Update(existingItem);
            return;

          case ProcessingAction.Update:
            if (existingItem.Status == ProcessingStatus.Processed) break;
            existingItem.StatusId = _processingStatusService.GetByName(ProcessingStatus.Aborted.ToString()).Id;
            existingItem.Status = ProcessingStatus.Aborted;
            await _processingLogRepository.Update(existingItem);
            break;

          case ProcessingAction.Delete:
            _logger.LogInformation("Scheduling of partner sharing deletion skipped: Already scheduled for '{action}'. Current status '{status}' for entity type '{entityType}' and entity id '{entityId}'",
            existingItem.Action, existingItem.Status, entityType, entityId);
            return;

          default:
            throw new InvalidOperationException($"Action of '{action}' not supported");
        }
      }
      else
      {
        _logger.LogInformation("Scheduling of partner sharing deletion skipped: Entity type '{entityType}' and entity id '{entityId}' not shared", entityType, entityId);
        return;
      }

      await Schedule(ProcessingAction.Delete, entityType, entityId, existingItem?.EntityExternalId);
      _logger.LogInformation("Scheduling of partner sharing deletion initiated: Entity type '{entityType}' and entity id '{entityId}'", entityType, entityId);
    }

    public List<ProcessingLog> ListPendingSchedule(int batchSize, List<Guid> idsToSkip)
    {
      ArgumentOutOfRangeException.ThrowIfLessThanOrEqual(batchSize, default, nameof(batchSize));

      var statusPendingId = _processingStatusService.GetByName(ProcessingStatus.Pending.ToString()).Id;

      var query = _processingLogRepository.Query().Where(o => o.StatusId == statusPendingId);

      if (idsToSkip != null && idsToSkip.Count != 0)
        query = query.Where(o => !idsToSkip.Contains(o.Id));

      var results = query.OrderBy(o => o.DateModified).Take(batchSize).ToList();

      return results;
    }

    public async Task UpdateSchedule(ProcessingLog item)
    {
      ArgumentNullException.ThrowIfNull(item, nameof(item));

      item.EntityExternalId = item.EntityExternalId?.Trim();

      var statusId = _processingStatusService.GetByName(item.Status.ToString()).Id;
      item.StatusId = statusId;

      switch (item.Status)
      {
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

          //retry attempts specified and exceeded
          if (_appSettings.SSIMaximumRetryAttempts > 0 && item.RetryCount > _appSettings.SSIMaximumRetryAttempts) break;

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
    private ProcessingLog? GetByEntity(EntityType entityType, Guid entityId)
    {
      var statusAbortedId = _processingStatusService.GetByName(ProcessingStatus.Aborted.ToString()).Id;
      var query = _processingLogRepository.Query().Where(o => o.EntityType == entityType.ToString() && o.StatusId != statusAbortedId); //ignore status aborted; historical; no effect on scheduling logic

      query = entityType switch
      {
        EntityType.Opportunity => query.Where(o => o.OpportunityId == entityId),
        _ => throw new InvalidOperationException($"Entity type of '{entityType}' not supported"),
      };

      query = query.OrderByDescending(o => o.DateModified);
      return query.FirstOrDefault();
    }

    private async Task Schedule(ProcessingAction action, EntityType entityType, Guid entityId, string? entityExternalId)
    {

      var items = new List<ProcessingLog>();
      var partners = _partnerService.ListForScheduling(action, entityType, entityId);

      foreach (var partner in partners)
      {
        items.Add(new ProcessingLog
        {
          EntityType = entityType.ToString(),
          PartnerId = partner.Id,
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
