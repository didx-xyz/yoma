using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System.Transactions;
using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Core.Exceptions;
using Yoma.Core.Domain.Core.Helpers;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.Opportunity;
using Yoma.Core.Domain.Opportunity.Interfaces;
using Yoma.Core.Domain.PartnerSync.Extensions;
using Yoma.Core.Domain.PartnerSync.Interfaces;
using Yoma.Core.Domain.PartnerSync.Interfaces.Lookups;
using Yoma.Core.Domain.PartnerSync.Models;
using Yoma.Core.Domain.PartnerSync.Models.Lookups;
using Yoma.Core.Domain.PartnerSync.Services.Lookups;

namespace Yoma.Core.Domain.PartnerSync.Services
{
  public class ProcessingService : IProcessingService
  {
    #region Class Variables
    private readonly ILogger<ProcessingService> _logger;
    private readonly AppSettings _appSettings;
    private readonly IPartnerService _partnerService;
    private readonly IProcessingStatusService _processingStatusService;
    private readonly IProcessingHelperService _processingHelperService;
    private readonly IOpportunityService _opportunityService;
    private readonly IRepositoryBatched<ProcessingLog> _processingLogRepository;
    private readonly IExecutionStrategyService _executionStrategyService;
    private readonly IRepository<PartnerSyncTracking> _partnerSyncTrackingRepository;

    public static readonly Status[] Statuses_Opportunity_Creatable = [Status.Active]; //only active opportunities scheduled for creation
    public static readonly Status[] Statuses_Opportunity_Updatable = [Status.Active, Status.Inactive, Status.Expired]; //expired: might be updated with end date in the past
    public static readonly Status[] Statuses_Opportunity_CanDelete = [Status.Active, Status.Inactive, Status.Expired, Status.Deleted]; //active, inactive and expired: implicit deletion due to organization deletion
    #endregion

    #region Constructor
    public ProcessingService(ILogger<ProcessingService> logger,
       IOptions<AppSettings> appSettings,
       IPartnerService partnerService,
       IProcessingStatusService processingStatusService,
       IProcessingHelperService processingHelperService,
       IOpportunityService opportunityService,
       IRepositoryBatched<ProcessingLog> processingLogRepository,
       IRepository<PartnerSyncTracking> partnerSyncTrackingRepository,
       IExecutionStrategyService executionStrategyService)
    {
      _logger = logger ?? throw new ArgumentNullException(nameof(logger));
      _appSettings = appSettings.Value ?? throw new ArgumentNullException(nameof(appSettings));
      _partnerService = partnerService ?? throw new ArgumentNullException(nameof(partnerService));
      _processingStatusService = processingStatusService ?? throw new ArgumentNullException(nameof(processingStatusService));
      _processingHelperService = processingHelperService ?? throw new ArgumentNullException(nameof(processingHelperService));
      _opportunityService = opportunityService ?? throw new ArgumentNullException(nameof(opportunityService));
      _processingLogRepository = processingLogRepository ?? throw new ArgumentNullException(nameof(processingLogRepository));
      _partnerSyncTrackingRepository = partnerSyncTrackingRepository ?? throw new ArgumentNullException(nameof(partnerSyncTrackingRepository));
      _executionStrategyService = executionStrategyService ?? throw new ArgumentNullException(nameof(executionStrategyService));
    }
    #endregion

    #region Public Members
    /// <summary>
    /// Records a partner sync pull processing entry.
    /// Pull processing is logged as processed immediately after the corresponding create, update or delete
    /// has been executed in the background job. If processing later fails, the error is recorded
    /// via RecordPullError.
    /// If a create is recorded for an entity already synchronized, it is recorded as an update.
    /// If an update is recorded for an entity not previously synchronized, it is recorded as a create.
    /// Delete requires a previously synchronized entity and remains terminal once deleted.
    /// </summary>
    public async Task<ProcessingLog> RecordPull(SyncAction action, Guid partnerId, EntityType entityType, string entityExternalId, Guid? entityId, string? payloadHash)
    {
      payloadHash = payloadHash?.Trim();

      switch (action)
      {
        case SyncAction.Create:
        case SyncAction.Update:
          ArgumentException.ThrowIfNullOrEmpty(payloadHash, nameof(payloadHash));

          break;
        case SyncAction.Delete:
          break;

        default:
          throw new InvalidOperationException($"Action of '{action}' not supported");
      }

      return await RecordPullInternal(action, partnerId, entityType, entityExternalId, entityId, payloadHash);
    }

    /// <summary>
    /// Returns the latest pull processing entry for the partner entity.
    /// Pull synchronization is identified by the partner and the partner's external id.
    /// </summary>
    public ProcessingLog? GetPull(Guid partnerId, EntityType entityType, string entityExternalId)
    {
      return _processingHelperService.GetByEntityLatest(SyncType.Pull, partnerId, entityType, entityExternalId);
    }

    public async Task RecordPullError(
      SyncAction action,
      Guid partnerId,
      EntityType entityType,
      string entityExternalId,
      Guid? entityId,
      string errorReason)
    {
      if (string.IsNullOrWhiteSpace(entityExternalId))
        throw new ArgumentNullException(nameof(entityExternalId));

      if (string.IsNullOrWhiteSpace(errorReason))
        throw new ArgumentNullException(nameof(errorReason));

      entityExternalId = entityExternalId.Trim();

      await _executionStrategyService.ExecuteInExecutionStrategyAsync(async () =>
      {
        using var scope = TransactionScopeHelper.CreateReadCommitted(TransactionScopeOption.RequiresNew);

        // Reuse an existing retryable pull record where applicable so RetryCount can accumulate.
        var item = await RecordPullInternal(action, partnerId, entityType, entityExternalId, entityId, null, false);

        item.Status = ProcessingStatus.Error;
        item.ErrorReason = errorReason.Trim();
        item.RetryCount = (byte?)(item.RetryCount + 1) ?? 0; // 1st attempt not counted as a retry

        // Retry attempts specified and exceeded (-1: infinite retries)
        if (_appSettings.PartnerSyncMaximumRetryAttempts != 0 &&
            !(_appSettings.PartnerSyncMaximumRetryAttempts > 0 &&
              item.RetryCount > _appSettings.PartnerSyncMaximumRetryAttempts))
        {
          // Remains in processed state until retries are exceeded.
          item.Status = ProcessingStatus.Processed;
        }

        item.StatusId = _processingStatusService.GetByName(item.Status.ToString()).Id;

        await _processingLogRepository.Update(item);

        scope.Complete();
      });
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
      var existingItem = _processingHelperService.GetByEntityLatest(SyncType.Push, entityType, entityId);

      if (!ValidateOrSkipEntitySyncType(SyncType.Push, entityType, entityId, false)) return;

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

      await SchedulePush(SyncAction.Create, entityType, entityId, null, null);
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
      var existingItem = _processingHelperService.GetByEntityLatest(SyncType.Push, entityType, entityId);

      if (!ValidateOrSkipEntitySyncType(SyncType.Push, entityType, entityId, false)) return;

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

      await SchedulePush(actionSchedule, entityType, entityId, existingItem?.EntityExternalId, existingItem?.PayloadHash);
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
      var existingItem = _processingHelperService.GetByEntityLatest(SyncType.Push, entityType, entityId);

      if (!ValidateOrSkipEntitySyncType(SyncType.Push, entityType, entityId, false)) return;

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

      await SchedulePush(SyncAction.Delete, entityType, entityId, existingItem?.EntityExternalId, null);
      if (_logger.IsEnabled(LogLevel.Information)) _logger.LogInformation("Scheduling of partner sync push deletion initiated: Entity type '{entityType}' and entity id '{entityId}'", entityType, entityId);
    }

    /// <summary>
    /// Returns pending partner sync push items grouped by partner and entity type.
    /// Items are selected globally by oldest modified date first, limited by the requested batch size,
    /// and then grouped in memory so the background process can record one tracking outcome per partner/entity execution.
    /// </summary>
    public List<(Guid PartnerId, EntityType EntityType, List<ProcessingLog> Items)> ListPendingPush(int batchSize, List<Guid> idsToSkip)
    {
      ArgumentOutOfRangeException.ThrowIfLessThanOrEqual(batchSize, default, nameof(batchSize));

      var statusPendingId = _processingStatusService.GetByName(ProcessingStatus.Pending.ToString()).Id;

      var query = _processingLogRepository.Query().Where(o => o.SyncType == SyncType.Push.ToString() && o.StatusId == statusPendingId);

      if (idsToSkip != null && idsToSkip.Count != 0)
        query = query.Where(o => !idsToSkip.Contains(o.Id));

      var items = query.OrderBy(o => o.DateModified).Take(batchSize).ToList();

      return [.. items
        .GroupBy(o => new { o.PartnerId, o.EntityType })
        .Select(o => (o.Key.PartnerId, Enum.Parse<EntityType>(o.Key.EntityType, true), o.ToList()))];
    }

    public async Task UpdatePush(ProcessingLog item)
    {
      ArgumentNullException.ThrowIfNull(item, nameof(item));

      if (item.SyncType != SyncType.Push.ToString())
        throw new InvalidOperationException($"Only '{SyncType.Push}' sync type supported");

      item.EntityExternalId = item.EntityExternalId?.Trim();
      item.PayloadHash = item.PayloadHash?.Trim();

      var statusId = _processingStatusService.GetByName(item.Status.ToString()).Id;
      item.StatusId = statusId;

      var action = Enum.Parse<SyncAction>(item.Action, true);
      switch (item.Status)
      {
        case ProcessingStatus.Aborted:
          // invoked during sync push background processing (ProcessSyncPush) when a scheduled 'Create'
          // is no longer valid to execute — e.g., opportunity is no longer in a creatable state
          // or the associated organization is inactive. Aborting prevents unnecessary errors or retries.
          if (action != SyncAction.Create)
            throw new InvalidOperationException($"Action of '{action}' not supported for status '{item.Status}'");
          item.ErrorReason = null;
          item.RetryCount = null;
          break;

        case ProcessingStatus.Processed:
          if (string.IsNullOrEmpty(item.EntityExternalId))
            throw new ArgumentNullException(nameof(item), "External id required");

          switch (action)
          {
            case SyncAction.Create:
            case SyncAction.Update:
              if (string.IsNullOrEmpty(item.PayloadHash))
                throw new ArgumentNullException(nameof(item), "Payload hash required");

              break;

            case SyncAction.Delete:
              item.PayloadHash = null;
              break;

            default:
              throw new InvalidOperationException($"Action of '{action}' not supported");
          }

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

    /// <summary>
    /// Returns the latest successful partner sync tracking entry for the requested partner capability.
    /// For checkpoint-based syncs, the returned DateStamp represents the last safely completed checkpoint.
    /// Failed and partial tracking entries are intentionally excluded.
    /// </summary>
    public PartnerSyncTracking? GetTrackingLatest(
      SyncType syncType,
      Guid partnerId,
      EntityType entityType,
      SyncScope syncScope)
    {
      var partner = _partnerService.GetById(partnerId);

      return _partnerSyncTrackingRepository.Query()
        .Where(o =>
          o.SyncType == syncType.ToString() &&
          o.PartnerId == partner.Id &&
          o.EntityType == entityType.ToString() &&
          o.SyncScope == syncScope.ToString() &&
          o.Status == TrackingStatus.Successful.ToString())
        .OrderByDescending(o => o.DateStamp)
        .FirstOrDefault();
    }

    /// <summary>
    /// Records a partner sync run.
    /// Counts are optional to support hard run failures where normal item processing did not complete.
    /// ItemsProcessed represents all handled items, including succeeded, skipped and failed items.
    /// ItemsCreated, ItemsUpdated and ItemsDeleted represent successful item-level actions only.
    /// If no item failures occurred and no run failure reason is supplied, the run is recorded as successful,
    /// even when all items were skipped or no items were returned.
    /// If one or more item-level failures occurred, the run is recorded as partial.
    /// If a run failure reason is supplied, the run is recorded as failed because the run itself did not complete successfully.
    /// Tracking is best-effort and will not fail the sync process if recording fails.
    /// </summary>
    public async Task RecordTracking(PartnerSyncTrackingRequest request)
    {
      try
      {
        ArgumentNullException.ThrowIfNull(request, nameof(request));

        if (request.PartnerId == Guid.Empty)
          throw new ArgumentNullException(nameof(request), "PartnerId cannot be empty");

        if (request.DateStamp == default)
          throw new ArgumentNullException(nameof(request), "DateStamp cannot be default");

        request.RunFailureReason = request.RunFailureReason?.Trim();
        if (string.IsNullOrEmpty(request.RunFailureReason)) request.RunFailureReason = null;

        if (request.ItemsProcessed.HasValue) ArgumentOutOfRangeException.ThrowIfNegative(request.ItemsProcessed.Value, nameof(request.ItemsProcessed));
        if (request.ItemsSucceeded.HasValue) ArgumentOutOfRangeException.ThrowIfNegative(request.ItemsSucceeded.Value, nameof(request.ItemsSucceeded));
        if (request.ItemsSkipped.HasValue) ArgumentOutOfRangeException.ThrowIfNegative(request.ItemsSkipped.Value, nameof(request.ItemsSkipped));
        if (request.ItemsFailed.HasValue) ArgumentOutOfRangeException.ThrowIfNegative(request.ItemsFailed.Value, nameof(request.ItemsFailed));

        if (request.ItemsCreated.HasValue) ArgumentOutOfRangeException.ThrowIfNegative(request.ItemsCreated.Value, nameof(request.ItemsCreated));
        if (request.ItemsUpdated.HasValue) ArgumentOutOfRangeException.ThrowIfNegative(request.ItemsUpdated.Value, nameof(request.ItemsUpdated));
        if (request.ItemsDeleted.HasValue) ArgumentOutOfRangeException.ThrowIfNegative(request.ItemsDeleted.Value, nameof(request.ItemsDeleted));

        var hasAnyItemCounts =
          request.ItemsProcessed.HasValue ||
          request.ItemsSucceeded.HasValue ||
          request.ItemsSkipped.HasValue ||
          request.ItemsFailed.HasValue;

        var hasAllItemCounts =
          request.ItemsProcessed.HasValue &&
          request.ItemsSucceeded.HasValue &&
          request.ItemsSkipped.HasValue &&
          request.ItemsFailed.HasValue;

        if (hasAnyItemCounts && !hasAllItemCounts)
          throw new InvalidOperationException("Either all item counts must be supplied, or none of them must be supplied");

        if (!hasAnyItemCounts && string.IsNullOrEmpty(request.RunFailureReason))
          throw new InvalidOperationException($"{nameof(request.RunFailureReason)} is required when item counts are not supplied");

        if (hasAllItemCounts &&
            request.ItemsProcessed!.Value != request.ItemsSucceeded!.Value + request.ItemsSkipped!.Value + request.ItemsFailed!.Value)
          throw new InvalidOperationException($"{nameof(request.ItemsProcessed)} must equal the sum of {nameof(request.ItemsSucceeded)}, {nameof(request.ItemsSkipped)} and {nameof(request.ItemsFailed)}");

        var actionCountsProvided =
          request.ItemsCreated.HasValue ||
          request.ItemsUpdated.HasValue ||
          request.ItemsDeleted.HasValue;

        if (actionCountsProvided && !request.ItemsSucceeded.HasValue)
          throw new InvalidOperationException($"Action counts can only be supplied when {nameof(request.ItemsSucceeded)} is supplied");

        if (actionCountsProvided)
        {
          var itemsSucceededByAction =
            (request.ItemsCreated ?? 0) +
            (request.ItemsUpdated ?? 0) +
            (request.ItemsDeleted ?? 0);

          if (itemsSucceededByAction > request.ItemsSucceeded!.Value)
            throw new InvalidOperationException($"The sum of {nameof(request.ItemsCreated)}, {nameof(request.ItemsUpdated)} and {nameof(request.ItemsDeleted)} cannot exceed {nameof(request.ItemsSucceeded)}");
        }

        var partner = _partnerService.GetById(request.PartnerId);

        var status = TrackingStatus.Successful;
        if (!string.IsNullOrEmpty(request.RunFailureReason))
          status = TrackingStatus.Failed;
        else if ((request.ItemsFailed ?? 0) > 0)
          status = TrackingStatus.Partial;

        var item = new PartnerSyncTracking
        {
          PartnerId = partner.Id,
          SyncType = request.SyncType.ToString(),
          EntityType = request.EntityType.ToString(),
          SyncScope = request.SyncScope.ToString(),
          Status = status.ToString(),
          ItemsProcessed = request.ItemsProcessed,
          ItemsSucceeded = request.ItemsSucceeded,
          ItemsSkipped = request.ItemsSkipped,
          ItemsFailed = request.ItemsFailed,
          ItemsCreated = request.ItemsCreated,
          ItemsUpdated = request.ItemsUpdated,
          ItemsDeleted = request.ItemsDeleted,
          RunFailureReason = request.RunFailureReason,
          DateStamp = request.DateStamp
        };

        await _partnerSyncTrackingRepository.Create(item);
      }
      catch (Exception ex)
      {
        if (_logger.IsEnabled(LogLevel.Error))
          _logger.LogError(ex,
            "Failed to record partner sync tracking for sync type '{syncType}', partner id '{partnerId}', entity type '{entityType}', sync scope '{syncScope}': {errorMessage}",
            request?.SyncType, request?.PartnerId, request?.EntityType, request?.SyncScope, ex.Message);
      }
    }
    #endregion

    #region Private Members
    private async Task<ProcessingLog> RecordPullInternal(SyncAction action,
      Guid partnerId,
      EntityType entityType,
      string entityExternalId,
      Guid? entityId,
      string? payloadHash,
      bool clearErrorState = true)
    {
      if (string.IsNullOrWhiteSpace(entityExternalId))
        throw new ArgumentNullException(nameof(entityExternalId));

      entityExternalId = entityExternalId.Trim();
      payloadHash = payloadHash?.Trim();

      if (entityId.HasValue)
        ValidateOrSkipEntitySyncType(SyncType.Pull, entityType, entityId.Value, true);

      var partner = _partnerService.GetById(partnerId);

      var itemExisting = _processingHelperService.GetByEntityLatest(SyncType.Pull, partnerId, entityType, entityExternalId);
      var itemExistingHasSynchronizedEntity = itemExisting.HasSynchronizedEntity(entityType);
      var itemExistingIsRetryableError = itemExisting?.Status == ProcessingStatus.Processed && !string.IsNullOrWhiteSpace(itemExisting.ErrorReason);

      var entityIdInfo = entityId.HasValue ? $"entity id '{entityId}'" : $"entity external id '{entityExternalId}'";

      SyncAction? actionExisting = null;
      if (itemExisting != null)
      {
        if (itemExisting.Status != ProcessingStatus.Processed && itemExisting.Status != ProcessingStatus.Error)
          throw new DataInconsistencyException($"Existing pull record in unexpected status: Partner id '{partnerId}', entity type '{entityType}', {entityIdInfo}, action '{itemExisting.Action}', status '{itemExisting.Status}'");

        actionExisting = Enum.Parse<SyncAction>(itemExisting.Action, true);
      }

      switch (action)
      {
        case SyncAction.Create:
          // Existing pull log without an entity mapping means a previous create failed before the Yoma entity was created.
          // Treat this as a create again, not an update.
          if (!itemExistingHasSynchronizedEntity) break;

          action = actionExisting!.Value switch
          {
            SyncAction.Create or SyncAction.Update => SyncAction.Update,
            SyncAction.Delete when entityType == EntityType.MyOpportunity => SyncAction.Create,
            SyncAction.Delete => throw new InvalidOperationException($"Recording of partner sync pull creation requested for entity already deleted: Partner id '{partnerId}', entity type '{entityType}', {entityIdInfo}"),
            _ => throw new InvalidOperationException($"Action of '{actionExisting}' not supported"),
          };

          break;

        case SyncAction.Update:
          if (!entityId.HasValue)
            throw new ArgumentNullException(nameof(entityId));

          // If there is no previously synchronized entity, record this as a create.
          // This protects retry paths where a previous create errored and only an error log exists.
          if (!itemExistingHasSynchronizedEntity)
          {
            action = SyncAction.Create;
            break;
          }

          action = actionExisting!.Value switch
          {
            SyncAction.Create or SyncAction.Update => SyncAction.Update,
            SyncAction.Delete when entityType == EntityType.MyOpportunity => SyncAction.Create,
            SyncAction.Delete => throw new InvalidOperationException($"Recording of partner sync pull update requested for entity already deleted: Partner id '{partnerId}', entity type '{entityType}', {entityIdInfo}"),
            _ => throw new InvalidOperationException($"Action of '{actionExisting}' not supported"),
          };

          break;

        case SyncAction.Delete:
          if (!entityId.HasValue)
            throw new ArgumentNullException(nameof(entityId));

          if (!itemExistingHasSynchronizedEntity)
            throw new InvalidOperationException($"Recording of partner sync pull deletion requested for entity not previously synchronized: Partner id '{partnerId}', entity type '{entityType}', {entityIdInfo}");

          action = actionExisting!.Value switch
          {
            SyncAction.Create or SyncAction.Update => SyncAction.Delete,
            SyncAction.Delete when itemExistingIsRetryableError => SyncAction.Delete,
            SyncAction.Delete => throw new InvalidOperationException($"Recording of partner sync pull deletion requested for entity already deleted: Partner id '{partnerId}', entity type '{entityType}', {entityIdInfo}"),
            _ => throw new InvalidOperationException($"Action of '{actionExisting}' not supported"),
          };

          break;

        default:
          throw new InvalidOperationException($"Action of '{action}' not supported");
      }

      if (!partner.ActionsEnabledParsed.Contains(action))
        throw new InvalidOperationException($"Action of '{action}' not enabled for partner '{partner.Name}'");

      // MyOpportunity pull records are internal tracking records for partner-provided
      // opportunity verification/progress submissions. The partner capability remains
      // configured as Opportunity + Verification because the provider payload is scoped
      // to a synced opportunity; MyOpportunity only identifies the resulting Yoma
      // completion submission in ProcessingLog.
      var syncScope = entityType == EntityType.MyOpportunity ? SyncScope.Verification : SyncScope.Entity;
      var capabilityEntityType = entityType == EntityType.MyOpportunity ? EntityType.Opportunity : entityType;

      if (!partner.SyncCapabilitiesParsed.TryGetValue(SyncType.Pull, out var entityCapabilities)
          || !entityCapabilities.TryGetValue(capabilityEntityType, out var syncScopes)
          || !syncScopes.Contains(syncScope))
        throw new InvalidOperationException($"Entity type of '{capabilityEntityType}' and sync scope '{syncScope}' not enabled for partner '{partner.Name}' and sync type '{SyncType.Pull}'");

      var reuseExistingItem = itemExisting != null && (itemExistingIsRetryableError || (actionExisting != SyncAction.Delete && !itemExistingHasSynchronizedEntity));

      var item = reuseExistingItem
        ? itemExisting!
        : new ProcessingLog
        {
          EntityType = entityType.ToString(),
          PartnerId = partner.Id,
          SyncType = SyncType.Pull.ToString(),
          EntityExternalId = entityExternalId
        };

      item.Action = action.ToString();
      item.StatusId = _processingStatusService.GetByName(ProcessingStatus.Processed.ToString()).Id;
      item.Status = ProcessingStatus.Processed;
      item.OpportunityId = entityType == EntityType.Opportunity ? entityId : null;
      // MyOpportunity pull logs keep their external id as the durable partner key.
      // If the MyOpportunity is later hard-deleted by partner cancellation/pending purge,
      // the FK is set null by the database while the log row remains for audit
      item.MyOpportunityId = entityType == EntityType.MyOpportunity ? entityId : null;
      item.PayloadHash = payloadHash;

      if (clearErrorState)
      {
        item.ErrorReason = null;
        item.RetryCount = null;
      }

      if (reuseExistingItem)
        await _processingLogRepository.Update(item);
      else
        await _processingLogRepository.Create(item);

      return item;
    }

    private async Task SchedulePush(SyncAction action, EntityType entityType, Guid entityId, string? entityExternalId, string? payloadHash)
    {
      var items = new List<ProcessingLog>();
      var partners = ListPush(action, entityType, entityId);

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
          EntityExternalId = entityExternalId,
          PayloadHash = payloadHash
        });
      }

      if (items.Count != 0)
        await _processingLogRepository.Create(items);
    }

    private List<Partner> ListPush(SyncAction action, EntityType entityType, Guid entityId)
    {
      //active partners that support push for the specified entity type and action
      var partners = _partnerService.ListPush(SyncScope.Entity, action, entityType);
      var results = new List<Partner>();

      switch (entityType)
      {
        case EntityType.Opportunity:
          var opportunity = _opportunityService.GetById(entityId, true, true, false);

          foreach (var item in partners)
          {
            var partner = Enum.Parse<SyncPartner>(item.Name, true);

            //once shared, flag can not be disabled
            if (opportunity.ShareWithPartners != true)
            {
              if (_logger.IsEnabled(LogLevel.Information)) _logger.LogInformation("Partner sync filtering: Entity '{entityType}' with id '{entityId}' not flagged for partner sync and will be skipped", EntityType.Opportunity, entityId);
              continue;
            }

            //pull-synchronized opportunity: managed by an external partner; sharing via push-synchronization not allowed
            if (opportunity.SyncedInfo?.Locked == true)
            {
              if (_logger.IsEnabled(LogLevel.Information)) _logger.LogInformation("Partner sync filtering: {EntityType} '{EntityId}' is externally managed (pull-synced); skipping push sync", EntityType.Opportunity, entityId);
              continue;
            }

            if (opportunity.Hidden == true)
              throw new InvalidOperationException($"Invalid state detected: Entity {EntityType.Opportunity} with id {entityId} is hidden but has partner sync enabled");

            switch (partner)
            {
              case SyncPartner.SAYouth:
                //only include opportunities of type learning, associated with South Africa and with an end date
                //once shared, the type can not be changed
                if (opportunity.Type != Opportunity.Type.Learning)
                {
                  if (_logger.IsEnabled(LogLevel.Information)) _logger.LogInformation("Partner sync filtering: Entity '{entityType}' with id '{entityId}' for partner '{partner}' is not a learning type and will be skipped",
                    EntityType.Opportunity, entityId, partner);
                  continue;
                }

                //once shared, end date can be changed but not removed
                if (!opportunity.DateEnd.HasValue)
                {
                  if (_logger.IsEnabled(LogLevel.Information)) _logger.LogInformation("Partner sync filtering: Entity '{entityType}' with id '{entityId}' for partner '{partner}' does not have an end date and will be skipped",
                    EntityType.Opportunity, entityId, partner);
                  continue;
                }

                // SAYouth creates must be South Africa-only.
                // Once shared, required countries cannot be removed but can be added, allowing legacy records to update/delete.
                var requiredCountry = PartnerService.RequiredCountry_SAYouth;

                var opportunityCountryCodes = opportunity.Countries?
                  .Select(c => c.CodeAlpha2)
                  .ToHashSet(StringComparer.OrdinalIgnoreCase);

                var containsRequiredCountry = opportunityCountryCodes?.Contains(requiredCountry.CodeAlpha2) == true;

                var countryMappingValid = action switch
                {
                  SyncAction.Create => opportunityCountryCodes is { Count: 1 } && containsRequiredCountry,
                  SyncAction.Update or SyncAction.Delete => containsRequiredCountry,
                  _ => throw new InvalidOperationException($"Action of '{action}' not supported")
                };

                if (!countryMappingValid)
                {
                  if (_logger.IsEnabled(LogLevel.Information))
                    _logger.LogInformation(
                      "Partner sync filtering: Entity '{entityType}' with id '{entityId}' for partner '{partner}' does not satisfy the required country rule '{requiredCountry}' for action '{action}' and will be skipped",
                      EntityType.Opportunity, entityId, partner, requiredCountry.Country, action);

                  continue;
                }

                results.Add(item);
                break;

              default:
                throw new InvalidOperationException($"Partner of '{partner}' not supported");
            }
          }
          break;

        default:
          throw new InvalidOperationException($"Entity type of '{entityType}' not supported");
      }

      return results;
    }

    private bool ValidateOrSkipEntitySyncType(SyncType syncType, EntityType entityType, Guid entityId, bool throwOnInvalid)
    {
      var statusAbortedId = _processingStatusService.GetByName(ProcessingStatus.Aborted.ToString()).Id;

      var query = _processingLogRepository.Query()
        .Where(o =>
          o.EntityType == entityType.ToString() &&
          o.StatusId != statusAbortedId &&
          o.SyncType != syncType.ToString());

      query = entityType switch
      {
        EntityType.Opportunity => query.Where(o => o.OpportunityId == entityId),
        EntityType.MyOpportunity => query.Where(o => o.MyOpportunityId == entityId),
        _ => throw new InvalidOperationException($"Entity type '{entityType}' not supported")
      };

      if (!query.Any()) return true;

      var message = $"Entity '{entityId}' of type '{entityType}' already has processing logs for another synchronization type and cannot be recorded or scheduled as '{syncType}'";

      if (throwOnInvalid)
        throw new DataInconsistencyException(message);

      if (_logger.IsEnabled(LogLevel.Information))
        _logger.LogInformation("Partner sync processing skipped: {message}", message);

      return false;
    }
    #endregion
  }
}
