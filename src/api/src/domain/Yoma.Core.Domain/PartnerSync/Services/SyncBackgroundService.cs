using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System.Transactions;
using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Core.Extensions;
using Yoma.Core.Domain.Core.Helpers;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.Entity;
using Yoma.Core.Domain.Entity.Helpers;
using Yoma.Core.Domain.Entity.Interfaces;
using Yoma.Core.Domain.MyOpportunity.Interfaces;
using Yoma.Core.Domain.MyOpportunity.Models;
using Yoma.Core.Domain.Opportunity;
using Yoma.Core.Domain.Opportunity.Extensions;
using Yoma.Core.Domain.Opportunity.Interfaces;
using Yoma.Core.Domain.Opportunity.Models;
using Yoma.Core.Domain.PartnerSync.Extensions;
using Yoma.Core.Domain.PartnerSync.Interfaces;
using Yoma.Core.Domain.PartnerSync.Interfaces.Lookups;
using Yoma.Core.Domain.PartnerSync.Interfaces.Provider;
using Yoma.Core.Domain.PartnerSync.Models;

namespace Yoma.Core.Domain.PartnerSync.Services
{
  public class SyncBackgroundService : ISyncBackgroundService
  {
    #region Class Variables
    private readonly ILogger<SyncBackgroundService> _logger;
    private readonly AppSettings _appSettings;
    private readonly ScheduleJobOptions _scheduleJobOptions;
    private readonly IProcessingService _processingService;
    private readonly IPartnerService _partnerService;
    private readonly IOpportunityService _opportunityService;
    private readonly IOrganizationService _organizationService;
    private readonly IMyOpportunityService _myOpportunityService;
    private readonly ISyncProviderClientFactoryResolver _providerClientFactoryResolver;
    private readonly IDistributedLockService _distributedLockService;
    private readonly IExecutionStrategyService _executionStrategyService;
    #endregion

    #region Constructor
    public SyncBackgroundService(ILogger<SyncBackgroundService> logger,
        IOptions<AppSettings> appSettings,
        IOptions<ScheduleJobOptions> scheduleJobOptions,
        IProcessingService processingService,
        IPartnerService partnerService,
        IOpportunityService opportunityService,
        IOrganizationService organizationService,
        IMyOpportunityService myOpportunityService,
        ISyncProviderClientFactoryResolver providerClientFactoryResolver,
        IDistributedLockService distributedLockService,
        IExecutionStrategyService executionStrategyService)
    {
      _logger = logger;
      _appSettings = appSettings.Value ?? throw new ArgumentNullException(nameof(appSettings));
      _scheduleJobOptions = scheduleJobOptions.Value ?? throw new ArgumentNullException(nameof(scheduleJobOptions));
      _processingService = processingService ?? throw new ArgumentNullException(nameof(processingService));
      _partnerService = partnerService ?? throw new ArgumentNullException(nameof(partnerService));
      _opportunityService = opportunityService ?? throw new ArgumentNullException(nameof(opportunityService));
      _organizationService = organizationService ?? throw new ArgumentNullException(nameof(organizationService));
      _myOpportunityService = myOpportunityService ?? throw new ArgumentNullException(nameof(myOpportunityService));
      _providerClientFactoryResolver = providerClientFactoryResolver ?? throw new ArgumentNullException(nameof(providerClientFactoryResolver));
      _distributedLockService = distributedLockService ?? throw new ArgumentNullException(nameof(distributedLockService));
      _executionStrategyService = executionStrategyService ?? throw new ArgumentNullException(nameof(executionStrategyService));
    }
    #endregion

    #region Public Members
    public async Task ProcessSyncPush()
    {
      const string lockIdentifier = "partner_sync_process_push";
      var dateTimeNow = DateTimeOffset.UtcNow;
      var executeUntil = dateTimeNow.AddHours(_scheduleJobOptions.PartnerSyncPushScheduleMaxIntervalInHours);
      var lockDuration = executeUntil - dateTimeNow + TimeSpan.FromMinutes(_scheduleJobOptions.DistributedLockDurationBufferInMinutes);
      var lockAcquired = false;

      var tracking = new Dictionary<(Guid PartnerId, EntityType EntityType), PartnerSyncTrackingRequest>();

      try
      {
        lockAcquired = await _distributedLockService.TryAcquireLockAsync(lockIdentifier, lockDuration);
        if (!lockAcquired) return;

        var organizationYoma = _organizationService.GetByNameOrNull(_appSettings.YomaOrganizationName, true, true);
        if (organizationYoma == null)
        {
          if (_logger.IsEnabled(LogLevel.Information)) _logger.LogInformation("{Process} will be aborted/skipped as the '{orgName}' organization could not be found", nameof(ProcessSyncPush), _appSettings.YomaOrganizationName);
          return;
        }

        if (_logger.IsEnabled(LogLevel.Information)) _logger.LogInformation("Processing partner sync push");

        var itemIdsToSkip = new List<Guid>();
        while (executeUntil > DateTimeOffset.UtcNow)
        {
          List<(Guid PartnerId, EntityType EntityType, List<ProcessingLog> Items)> pendingGroups = _processingService.ListPendingPush(_scheduleJobOptions.PartnerSyncPushScheduleBatchSize, itemIdsToSkip);
          if (pendingGroups.Count == 0)
          {
            if (_logger.IsEnabled(LogLevel.Information)) _logger.LogInformation("No sync push items found to process");
            break;
          }

          foreach (var pendingGroup in pendingGroups)
          {
            if (executeUntil <= DateTimeOffset.UtcNow) break;

            var trackingKey = (pendingGroup.PartnerId, pendingGroup.EntityType);
            tracking.TryAdd(trackingKey, new PartnerSyncTrackingRequest
            {
              PartnerId = pendingGroup.PartnerId,
              SyncType = SyncType.Push,
              EntityType = pendingGroup.EntityType,
              SyncScope = SyncScope.Entity,
              DateStamp = dateTimeNow,
              ItemsProcessed = 0,
              ItemsSucceeded = 0,
              ItemsSkipped = 0,
              ItemsFailed = 0,
              ItemsCreated = 0,
              ItemsUpdated = 0,
              ItemsDeleted = 0
            });

            var trackingItem = tracking[trackingKey];

            try
            {
              foreach (var item in pendingGroup.Items)
              {
                if (executeUntil <= DateTimeOffset.UtcNow) break;

                try
                {
                  if (_logger.IsEnabled(LogLevel.Information)) _logger.LogInformation("Processing sync push for '{entityType}' and item with id '{id}'", item.EntityType, item.Id);

                  SyncAction? actionSucceeded = null;

                  switch (pendingGroup.EntityType)
                  {
                    case EntityType.Opportunity:
                      if (!item.OpportunityId.HasValue)
                        throw new InvalidOperationException($"Entity type '{pendingGroup.EntityType}': Opportunity id is null");

                      var pushProviderClient = _providerClientFactoryResolver.CreateClient<ISyncProviderClientPushEntity<Opportunity.Models.Opportunity>>(item.Partner);

                      var opportunity = _opportunityService.GetById(item.OpportunityId.Value, true, true, false);
                      var organization = _organizationService.GetById(opportunity.OrganizationId, false, true, false);

                      var request = new SyncRequestPushEntity<Opportunity.Models.Opportunity>
                      {
                        Item = opportunity,
                        Organization = organization,
                        OrganizationYoma = organizationYoma,
                        ShareContactInfo = SettingsHelper.GetValue<bool>(organization.Settings, Setting.Organization_Share_Contact_Info_With_Partners.ToString()) == true,
                        ShareAddressInfo = SettingsHelper.GetValue<bool>(organization.Settings, Setting.Organization_Share_Address_Details_With_Partners.ToString()) == true,
                      };

                      var action = Enum.Parse<SyncAction>(item.Action, true);

                      switch (action)
                      {
                        case SyncAction.Create:
                          //scheduled for execution upon explicit opportunity creation (active only)
                          //organization must be active in order to create an opportunity
                          //trigger points:
                          // - IOpportunityService.Create (explicit)

                          //with ScheduleUpdate (where the opportunity isn't loaded and logic is kept lightweight), a pending create is left untouched
                          //during processing, we re-evaluate whether the opportunity is still valid for creation
                          //if it's no longer creatable (e.g., due to status or organization state), we abort the create here to prevent invalid partner data
                          if (opportunity.OrganizationStatus != OrganizationStatus.Active || !ProcessingService.Statuses_Opportunity_Creatable.Contains(opportunity.Status))
                          {
                            var reason = opportunity.OrganizationStatus != OrganizationStatus.Active
                              ? $"Associated organization is no longer '{OrganizationStatus.Active}'"
                              : $"Opportunity status of '{ProcessingService.Statuses_Opportunity_Creatable.JoinNames()}' expected. Current status '{opportunity.Status.ToDescription()}'";

                            if (_logger.IsEnabled(LogLevel.Information))
                              _logger.LogInformation("Action '{action}': Aborting sync push for '{entityType}' and item with id '{id}'. {reason}", action, item.EntityType, item.Id, reason);

                            item.Status = ProcessingStatus.Aborted;
                            await _processingService.UpdatePush(item);

                            IncrementTrackingSkipped(trackingItem);

                            continue;
                          }

                          // Store the provider-computed update hash after create so future push updates compare against the same update-shaped payload.
                          // The provider client computes the effective update payload hash because it owns the final outbound payload/action.
                          item.EntityExternalId = await pushProviderClient.Create(request);
                          request.ExternalId = item.EntityExternalId;
                          item.PayloadHash = pushProviderClient.ComputeUpdatePayloadHash(request);
                          break;

                        case SyncAction.Update:
                          if (string.IsNullOrEmpty(item.EntityExternalId))
                            throw new ArgumentNullException(nameof(item), "External id required");

                          //scheduled for execution upon opportunity update and explicit and implicit activation or deactivation
                          //trigger points:
                          // - IOpportunityService: (explicit)
                          //    Update | AllocateRewards | UpdateFeatured | UpdateStatus | AssignCategories | RemoveCategories | AssignCountries | RemoveCountries
                          //    AssignLanguages | RemoveLanguages | AssignSkills | AssignVerificationTypes | RemoveVerificationTypes
                          // - IOpportunityBackgroundService.ProcessExpiration (explicit)
                          // - IOrganizationService.UpdateStatus (implicit)
                          // - IOrganizationService.SendForReapproval (implicit)
                          // - IOrganizationBackgroundService.ProcessDeclination (implicit)

                          //implicit alignment for sync push processing
                          //if organization is activated, opportunity is activated provided current status of active
                          //if organization is inactivated, opportunity is inactivated provided active
                          if (opportunity.OrganizationStatus == OrganizationStatus.Inactive && opportunity.Status == Status.Active)
                            opportunity.Status = Status.Inactive;

                          //scheduling failsafe post implicit adjustment
                          if (!ProcessingService.Statuses_Opportunity_Updatable.Contains(opportunity.Status))
                            throw new InvalidOperationException($"Action '{action}': Opportunity status of '{ProcessingService.Statuses_Opportunity_Updatable.JoinNames()}' expected. Current status '{opportunity.Status.ToDescription()}'");

                          request.ExternalId = item.EntityExternalId;

                          // The provider client computes the effective update payload hash because it owns the final outbound payload/action.
                          var payloadHash = pushProviderClient.ComputeUpdatePayloadHash(request);

                          var retryingPreviousError = !string.IsNullOrWhiteSpace(item.ErrorReason);

                          // Only skip when the previous provider update completed successfully and the effective payload is unchanged.
                          // If the previous attempt failed, retry even when the hash matches.
                          if (retryingPreviousError || !string.Equals(item.PayloadHash, payloadHash, StringComparison.Ordinal))
                          {
                            await pushProviderClient.Update(request);
                          }
                          else if (_logger.IsEnabled(LogLevel.Information))
                          {
                            _logger.LogInformation("Skipping sync push provider update for '{entityType}' and item with id '{id}' because the effective provider update payload hash has not changed", item.EntityType, item.Id);
                          }

                          item.PayloadHash = payloadHash;
                          break;

                        case SyncAction.Delete:
                          if (string.IsNullOrEmpty(item.EntityExternalId))
                            throw new ArgumentNullException(nameof(item), "External id required");

                          //scheduled for execution upon explicit and implicit opportunity deletion
                          //once an opportunity or organization are deleted, it cannot be reinstated
                          //trigger points:
                          // - IOpportunityService.UpdateStatus (explicit)
                          // - IOpportunityBackgroundService.ProcessDeletion (explicit)
                          // - IOrganizationService.UpdateStatus (implicit)
                          // - IOrganizationBackgroundService.ProcessDeletion (implicit)

                          //scheduling failsafe
                          if (!ProcessingService.Statuses_Opportunity_CanDelete.Contains(opportunity.Status))
                            throw new InvalidOperationException($"Action '{action}': Opportunity status of '{ProcessingService.Statuses_Opportunity_CanDelete.JoinNames()}' expected. Current status '{opportunity.Status.ToDescription()}'");

                          switch (opportunity.Status)
                          {
                            case Status.Active:
                            case Status.Inactive:
                            case Status.Expired:
                              if (opportunity.OrganizationStatus != OrganizationStatus.Deleted)
                                throw new InvalidOperationException($"Processing action {action}: Opportunity with status {opportunity.Status.ToDescription()} must be associated with a deleted organization");
                              break;

                            case Status.Deleted:
                              break;

                            default:
                              throw new InvalidOperationException($"Opportunity status of '{opportunity.Status.ToDescription()}' not supported");
                          }

                          await pushProviderClient.Delete(item.EntityExternalId);
                          break;

                        default:
                          throw new InvalidOperationException($"Processing action of '{action}' not supported");
                      }

                      actionSucceeded = action;
                      break;

                    default:
                      throw new InvalidOperationException($"Entity type of '{pendingGroup.EntityType}' not supported");
                  }

                  if (!actionSucceeded.HasValue)
                    throw new InvalidOperationException("Successful sync push action expected");

                  item.Status = ProcessingStatus.Processed;
                  await _processingService.UpdatePush(item);

                  IncrementTrackingSucceeded(trackingItem, actionSucceeded.Value);

                  if (_logger.IsEnabled(LogLevel.Information)) _logger.LogInformation("Processed sync push for '{entityType}' and item with id '{id}'", item.EntityType, item.Id);
                }
                catch (Exception ex)
                {
                  if (_logger.IsEnabled(LogLevel.Error)) _logger.LogError(ex, "Failed to process sync push for '{entityType}' and item with id '{id}': {errorMessage}", item.EntityType, item.Id, ex.Message);

                  item.Status = ProcessingStatus.Error;
                  item.ErrorReason = ex.Message;
                  await _processingService.UpdatePush(item);

                  IncrementTrackingFailed(trackingItem);

                  itemIdsToSkip.Add(item.Id);
                }
              }
            }
            catch (Exception ex)
            {
              if (_logger.IsEnabled(LogLevel.Error))
                _logger.LogError(ex, "Failed to process sync push for partner id '{partnerId}' and entity type '{entityType}': {errorMessage}", pendingGroup.PartnerId, pendingGroup.EntityType, ex.Message);

              trackingItem.RunFailureReason = ex.Message;

              itemIdsToSkip.AddRange(pendingGroup.Items.Select(o => o.Id));
            }
          }
        }

        if (_logger.IsEnabled(LogLevel.Information)) _logger.LogInformation("Processed partner sync push");
      }
      catch (Exception ex)
      {
        if (_logger.IsEnabled(LogLevel.Error)) _logger.LogError(ex, "Failed to execute {process}: {errorMessage}", nameof(ProcessSyncPush), ex.Message);

        // Tracking represents the full push run, not individual pages or batches.
        // If the run fails after one or more partner/entity groups started, mark those groups as failed
        // so their tracking outcome does not incorrectly appear successful or partial.
        foreach (var item in tracking.Values)
        {
          if (string.IsNullOrWhiteSpace(item.RunFailureReason))
            item.RunFailureReason = ex.Message;
        }
      }
      finally
      {
        foreach (var item in tracking.Values)
        {
          var itemsProcessed = item.ItemsProcessed ?? 0;

          // Avoid recording a false run if tracking was initialized but no item was actually handled.
          if (itemsProcessed == 0 && string.IsNullOrWhiteSpace(item.RunFailureReason)) continue;

          if (itemsProcessed == 0 && !string.IsNullOrWhiteSpace(item.RunFailureReason))
          {
            await _processingService.RecordTracking(new PartnerSyncTrackingRequest
            {
              PartnerId = item.PartnerId,
              SyncType = item.SyncType,
              EntityType = item.EntityType,
              SyncScope = item.SyncScope,
              DateStamp = item.DateStamp,
              RunFailureReason = item.RunFailureReason
            });

            continue;
          }

          await _processingService.RecordTracking(item);
        }

        if (lockAcquired) await _distributedLockService.ReleaseLockAsync(lockIdentifier);
      }
    }

    public async Task ProcessSyncPull()
    {
      const string lockIdentifier = "partner_sync_process_pull";
      var dateTimeNow = DateTimeOffset.UtcNow;
      var executeUntil = dateTimeNow.AddHours(_scheduleJobOptions.PartnerSyncPullScheduleMaxIntervalInHours);
      var lockDuration = executeUntil - dateTimeNow + TimeSpan.FromMinutes(_scheduleJobOptions.DistributedLockDurationBufferInMinutes);
      var lockAcquired = false;

      try
      {
        lockAcquired = await _distributedLockService.TryAcquireLockAsync(lockIdentifier, lockDuration);
        if (!lockAcquired) return;

        if (_logger.IsEnabled(LogLevel.Information)) _logger.LogInformation("Processing partner sync pull");

        var partners = _partnerService.ListPull(SyncScope.Entity);
        if (partners.Count == 0)
        {
          if (_logger.IsEnabled(LogLevel.Information)) _logger.LogInformation("No sync pull partners found to process");
          return;
        }

        foreach (var partnerModel in partners)
        {
          if (executeUntil <= DateTimeOffset.UtcNow) break;

          await ProcessSyncPullPartner(partnerModel, executeUntil);
        }

        if (_logger.IsEnabled(LogLevel.Information)) _logger.LogInformation("Processed partner sync pull");
      }
      catch (Exception ex)
      {
        if (_logger.IsEnabled(LogLevel.Error))
          _logger.LogError(ex, "Failed to execute {process}: {errorMessage}", nameof(ProcessSyncPull), ex.Message);
      }
      finally
      {
        if (lockAcquired) await _distributedLockService.ReleaseLockAsync(lockIdentifier);
      }
    }

    public async Task ProcessSyncPullVerification()
    {
      const string lockIdentifier = "partner_sync_process_pull_verification";
      var dateTimeNow = DateTimeOffset.UtcNow;
      var executeUntil = dateTimeNow.AddHours(_scheduleJobOptions.PartnerSyncPullVerificationScheduleMaxIntervalInHours);
      var lockDuration = executeUntil - dateTimeNow + TimeSpan.FromMinutes(_scheduleJobOptions.DistributedLockDurationBufferInMinutes);
      var lockAcquired = false;

      try
      {
        lockAcquired = await _distributedLockService.TryAcquireLockAsync(lockIdentifier, lockDuration);
        if (!lockAcquired) return;

        if (_logger.IsEnabled(LogLevel.Information)) _logger.LogInformation("Processing partner sync pull verification");

        var partners = _partnerService.ListPull(SyncScope.Verification, entityType: EntityType.Opportunity);
        if (partners.Count == 0)
        {
          if (_logger.IsEnabled(LogLevel.Information)) _logger.LogInformation("No sync pull verification partners found to process");
          return;
        }

        foreach (var partnerModel in partners)
        {
          if (executeUntil <= DateTimeOffset.UtcNow) break;

          await ProcessSyncPullVerificationPartner(partnerModel, executeUntil);
        }

        if (_logger.IsEnabled(LogLevel.Information)) _logger.LogInformation("Processed partner sync pull verification");
      }
      catch (Exception ex)
      {
        if (_logger.IsEnabled(LogLevel.Error))
          _logger.LogError(ex, "Failed to execute {process}: {errorMessage}", nameof(ProcessSyncPullVerification), ex.Message);
      }
      finally
      {
        if (lockAcquired) await _distributedLockService.ReleaseLockAsync(lockIdentifier);
      }
    }
    #endregion

    #region Private Members
    private async Task ProcessSyncPullPartner(Models.Lookups.Partner partnerModel, DateTimeOffset executeUntil)
    {
      try
      {
        var partner = Enum.Parse<SyncPartner>(partnerModel.Name, true);

        if (!partnerModel.SyncCapabilitiesParsed.TryGetValue(SyncType.Pull, out var entityCapabilities) || entityCapabilities.Count == 0)
          return;

        var entityTypes = entityCapabilities
          .Where(o => o.Value.Contains(SyncScope.Entity))
          .Select(o => o.Key)
          .Distinct()
          .ToList();

        if (entityTypes.Count == 0)
          return;

        foreach (var entityType in entityTypes)
        {
          if (executeUntil <= DateTimeOffset.UtcNow) break;

          switch (entityType)
          {
            case EntityType.Opportunity:
              await ProcessSyncPullOpportunity(partnerModel, partner, executeUntil);
              break;

            default:
              throw new InvalidOperationException($"Entity type '{entityType}' not supported");
          }
        }
      }
      catch (Exception ex)
      {
        if (_logger.IsEnabled(LogLevel.Error))
          _logger.LogError(ex, "Failed to process sync pull for partner '{partnerName}': {errorMessage}", partnerModel.Name, ex.Message);
      }
    }

    private async Task ProcessSyncPullOpportunity(Models.Lookups.Partner partnerModel, SyncPartner partner, DateTimeOffset executeUntil)
    {
      var entityType = EntityType.Opportunity;
      var dateStamp = DateTimeOffset.UtcNow;
      var tracking = new PartnerSyncTrackingRequest
      {
        PartnerId = partnerModel.Id,
        SyncType = SyncType.Pull,
        EntityType = entityType,
        SyncScope = SyncScope.Entity,
        DateStamp = dateStamp,
        ItemsProcessed = 0,
        ItemsSucceeded = 0,
        ItemsSkipped = 0,
        ItemsFailed = 0,
        ItemsCreated = 0,
        ItemsUpdated = 0,
        ItemsDeleted = 0
      };
      var completedPull = false;

      try
      {
        var pullProviderClient = _providerClientFactoryResolver.CreateClient<ISyncProviderClientPullEntity<OpportunityRequestCreate>>(partner);

        var pageNumber = 1;
        var pageSize = _scheduleJobOptions.PartnerSyncPullScheduleBatchSize;
        SyncResultPullEntity<OpportunityRequestCreate>? result = null;

        while (executeUntil > DateTimeOffset.UtcNow)
        {
          var (Result, Items, PagedByProvider) = await ListSyncPullItems(partner, entityType, pullProviderClient, pageNumber, pageSize, result);
          result = Result;

          if (Items.Count == 0)
          {
            completedPull = true;
            break;
          }

          foreach (var item in Items)
          {
            if (executeUntil <= DateTimeOffset.UtcNow) break;

            var action = SyncAction.Create;
            Guid? entityId = null;

            try
            {
              if (string.IsNullOrWhiteSpace(item.ExternalId))
                throw new InvalidOperationException("External id expected");

              if (_logger.IsEnabled(LogLevel.Information))
                _logger.LogInformation("Processing sync pull item for partner '{partner}', entity type '{entityType}', entity external id '{entityExternalId}'", partner, entityType, item.ExternalId);

              var opportunityRequest = item.Item;

              opportunityRequest.ExternalId = opportunityRequest.ExternalId?.Trim();
              if (!string.IsNullOrEmpty(opportunityRequest.ExternalId))
                throw new InvalidOperationException(
                  $"Pull-synced opportunity item must not set '{nameof(OpportunityRequestBase.ExternalId)}'. Use '{nameof(SyncItemEntity<>.ExternalId)}' / processing '{nameof(ProcessingLog.EntityExternalId)}' for partner sync identity");

              var processingItemExisting = _processingService.GetPull(partnerModel.Id, entityType, item.ExternalId);
              var processingItemExistingHasSynchronizedEntity = processingItemExisting.HasSynchronizedEntity(entityType);

              if (processingItemExisting?.Status == ProcessingStatus.Error)
              {
                if (_logger.IsEnabled(LogLevel.Information))
                  _logger.LogInformation(
                    "Processing of partner sync pull item skipped: Existing pull item is in permanent error state for partner '{partner}', entity type '{entityType}', entity external id '{entityExternalId}'. Retry count '{retryCount}'. Error: {errorReason}",
                    partner, entityType, item.ExternalId, processingItemExisting.RetryCount, processingItemExisting.ErrorReason);

                IncrementTrackingSkipped(tracking);
                continue;
              }

              Opportunity.Models.Opportunity? opportunityExisting = null;
              if (processingItemExistingHasSynchronizedEntity)
              {
                entityId = processingItemExisting!.OpportunityId!.Value;
                opportunityExisting = _opportunityService.GetById(entityId.Value, false, false, false);
              }

              if (item.Deleted == true && !processingItemExistingHasSynchronizedEntity)
              {
                if (_logger.IsEnabled(LogLevel.Information))
                  _logger.LogInformation(
                    "Processing of partner sync pull item skipped: Entity is marked deleted by provider but has no existing Yoma mapping for partner '{partner}', entity type '{entityType}', entity external id '{entityExternalId}'",
                    partner, entityType, item.ExternalId);

                IncrementTrackingSkipped(tracking);
                continue;
              }

              if (opportunityExisting?.Status == Status.Deleted)
              {
                if (_logger.IsEnabled(LogLevel.Information))
                  _logger.LogInformation("Processing of partner sync pull item skipped: Entity already deleted in Yoma for partner '{partner}', entity type '{entityType}', entity id '{entityId}'", partner, entityType, entityId);

                IncrementTrackingSkipped(tracking);
                continue;
              }

              if (processingItemExistingHasSynchronizedEntity &&
                  Enum.Parse<SyncAction>(processingItemExisting!.Action, true) == SyncAction.Delete &&
                  string.IsNullOrWhiteSpace(processingItemExisting.ErrorReason))
              {
                if (_logger.IsEnabled(LogLevel.Information))
                  _logger.LogInformation("Processing of partner sync pull item skipped: Entity already deleted via sync for partner '{partner}', entity type '{entityType}', entity external id '{entityExternalId}'", partner, entityType, item.ExternalId);

                IncrementTrackingSkipped(tracking);
                continue;
              }

              action = item.ResolveSyncAction(entityType, processingItemExisting);

              if (!partnerModel.ActionsEnabledParsed.Contains(action))
              {
                if (_logger.IsEnabled(LogLevel.Information))
                  _logger.LogInformation("Processing of partner sync pull item skipped: Action '{action}' not enabled for partner '{partner}', entity type '{entityType}', entity external id '{entityExternalId}'", action, partner, entityType, item.ExternalId);

                IncrementTrackingSkipped(tracking);
                continue;
              }

              string? payloadHash = null;
              var itemSkipped = false;

              await _executionStrategyService.ExecuteInExecutionStrategyAsync(async () =>
              {
                using var scope = TransactionScopeHelper.CreateReadCommitted(TransactionScopeOption.RequiresNew);

                switch (action)
                {
                  case SyncAction.Create:
                    {
                      var request = ObjectHelper.DeepCopy(opportunityRequest);

                      // Stamp pulled opportunities with a stable human-readable CSV reference; partner sync still uses EntityExternalId.
                      request.ExternalId = $"{partner.ToString().ToUpperInvariant()}_{item.ExternalId.Trim()}";

                      var opportunity = await _opportunityService.Create(request, new OpportunityUpsertOptions
                      {
                        EnsureOrganizationAuthorization = false,
                        RaiseEvents = false,
                        SendNotifications = false,
                        SyncTypeActionedBy = SyncType.Pull,
                        SyncExternalId = item.ExternalId,
                        CustomFieldUpsertMode = CustomFieldUpsertMode.ProcessAllowMissingRequired
                      });
                      entityId = opportunity.Id;

                      // Hash the equivalent update payload so the created item can be compared consistently against future pull updates.
                      var requestUpdate = opportunityRequest.ToRequestUpdate(entityId.Value, applyHidden: false);
                      payloadHash = HashHelper.ComputeSHA256Hash(requestUpdate);

                      break;
                    }

                  case SyncAction.Update:
                    {
                      if (processingItemExisting == null)
                        throw new InvalidOperationException($"Existing processing item expected for update action: Partner '{partner}', entity type '{entityType}', entity external id '{item.ExternalId}'");

                      if (!entityId.HasValue)
                        throw new InvalidOperationException($"Entity id expected for pull update: Partner '{partner}', entity type '{entityType}', entity external id '{item.ExternalId}'");

                      var request = opportunityRequest.ToRequestUpdate(entityId.Value, applyHidden: false);
                      payloadHash = HashHelper.ComputeSHA256Hash(request);

                      var retryingPreviousError = !string.IsNullOrWhiteSpace(processingItemExisting.ErrorReason);

                      // Only skip when the previous processing was successful and the effective payload is unchanged.
                      // If the previous attempt failed, retry even when the hash matches.
                      if (!retryingPreviousError &&
                          string.Equals(processingItemExisting.PayloadHash, payloadHash, StringComparison.Ordinal))
                      {
                        if (_logger.IsEnabled(LogLevel.Information))
                          _logger.LogInformation(
                            "Processing of partner sync pull item skipped: Effective payload unchanged; no domain update required for partner '{partner}', entity type '{entityType}', entity external id '{entityExternalId}'",
                            partner, entityType, item.ExternalId);

                        itemSkipped = true;

                        scope.Complete();
                        return;
                      }

                      await _opportunityService.Update(request, new OpportunityUpsertOptions
                      {
                        EnsureOrganizationAuthorization = false,
                        RaiseEvents = false,
                        SendNotifications = false,
                        SyncTypeActionedBy = SyncType.Pull,
                        SyncExternalId = item.ExternalId,
                        CustomFieldUpsertMode = CustomFieldUpsertMode.ProcessAllowMissingRequired
                      });
                      break;
                    }

                  case SyncAction.Delete:
                    {
                      if (!entityId.HasValue)
                        throw new InvalidOperationException($"Entity id expected for pull deletion: Partner '{partner}', entity type '{entityType}', entity external id '{item.ExternalId}'");

                      await _opportunityService.DeleteFromPartnerSyncPull(entityId.Value);
                      break;
                    }

                  default:
                    throw new InvalidOperationException($"Action of '{action}' not supported");
                }

                await _processingService.RecordPull(action, partnerModel.Id, entityType, item.ExternalId, entityId, payloadHash);

                scope.Complete();
              });

              if (itemSkipped)
              {
                IncrementTrackingSkipped(tracking);
                continue;
              }

              IncrementTrackingSucceeded(tracking, action);

              if (_logger.IsEnabled(LogLevel.Information))
                _logger.LogInformation("Processed sync pull item for partner '{partner}', entity type '{entityType}', entity external id '{entityExternalId}'", partner, entityType, item.ExternalId);
            }
            catch (Exception ex)
            {
              // Item-level failures are counted against the completed pull run.
              // The run will be recorded as partial, preventing checkpoint-based syncs from advancing.
              IncrementTrackingFailed(tracking);

              if (_logger.IsEnabled(LogLevel.Error))
                _logger.LogError(ex, "Failed to process sync pull item for partner '{partner}' and entity type '{entityType}': {errorMessage}", partner, entityType, ex.Message);

              if (action == SyncAction.Create) entityId = null;

              try
              {
                await _processingService.RecordPullError(action, partnerModel.Id, entityType, item.ExternalId, entityId, ex.Message);
              }
              catch (Exception innerEx)
              {
                if (_logger.IsEnabled(LogLevel.Error))
                  _logger.LogError(innerEx, "Failed to record sync pull error state for partner '{partner}' and entity type '{entityType}': {errorMessage}", partner, entityType, innerEx.Message);
              }
            }
          }

          if (executeUntil <= DateTimeOffset.UtcNow) break;

          if (result.ReachedTotalCount(pageNumber, pageSize))
          {
            completedPull = true;
            break;
          }

          if (PagedByProvider) result = null;

          pageNumber++;
        }

        if (!completedPull)
          tracking.RunFailureReason = "Execution window elapsed before pull completed";
      }
      catch (Exception ex)
      {
        tracking.RunFailureReason = ex.Message;

        if (_logger.IsEnabled(LogLevel.Error))
          _logger.LogError(ex, "Failed to process sync pull for partner '{partner}' and entity type '{entityType}': {errorMessage}", partner, entityType, ex.Message);
      }
      finally
      {
        if (tracking.ItemsProcessed == 0 && !string.IsNullOrWhiteSpace(tracking.RunFailureReason))
        {
          await _processingService.RecordTracking(new PartnerSyncTrackingRequest
          {
            PartnerId = tracking.PartnerId,
            SyncType = tracking.SyncType,
            EntityType = tracking.EntityType,
            SyncScope = tracking.SyncScope,
            DateStamp = tracking.DateStamp,
            RunFailureReason = tracking.RunFailureReason
          });
        }
        else
        {
          await _processingService.RecordTracking(tracking);
        }
      }
    }

    private async Task<(SyncResultPullEntity<OpportunityRequestCreate> Result, List<SyncItemEntity<OpportunityRequestCreate>> Items, bool PagedByProvider)> ListSyncPullItems(
      SyncPartner partner,
      EntityType entityType,
      ISyncProviderClientPullEntity<OpportunityRequestCreate> pullProviderClient,
      int pageNumber,
      int pageSize,
      SyncResultPullEntity<OpportunityRequestCreate>? result)
    {
      if (result == null)
      {
        var filter = new SyncFilterPullEntity
        {
          PageNumber = pageNumber,
          PageSize = pageSize
        };

        if (_logger.IsEnabled(LogLevel.Information))
          _logger.LogInformation("Processing sync pull for partner '{partner}', entity type '{entityType}', on page '{pageNumber}' with batch size '{batchSize}'", partner, entityType, filter.PageNumber, filter.PageSize);

        result = await pullProviderClient.List(filter);

        if (!result.TotalCount.HasValue)
          throw new InvalidOperationException("Paginated filter: Total count expected but is null");

        if (result.Items.Count == 0)
        {
          if (_logger.IsEnabled(LogLevel.Information))
            _logger.LogInformation("No sync pull items found to process for partner '{partner}', entity type '{entityType}', on page '{pageNumber}'", partner, entityType, filter.PageNumber);

          return (result, [], true);
        }
      }

      // If the provider ignores paging and returns the full result set, page it locally
      var pagedByProvider = result.Items.Count <= pageSize;
      var items = pagedByProvider
        ? result.Items
        : [.. result.Items.Skip((pageNumber - 1) * pageSize).Take(pageSize)];

      return (result, items, pagedByProvider);
    }

    private async Task ProcessSyncPullVerificationPartner(Models.Lookups.Partner partnerModel, DateTimeOffset executeUntil)
    {
      try
      {
        var partner = Enum.Parse<SyncPartner>(partnerModel.Name, true);

        if (!partnerModel.SyncCapabilitiesParsed.TryGetValue(SyncType.Pull, out var entityCapabilities) || entityCapabilities.Count == 0)
          return;

        var entityTypes = entityCapabilities
          .Where(o => o.Value.Contains(SyncScope.Verification))
          .Select(o => o.Key)
          .Distinct()
          .ToList();

        if (entityTypes.Count == 0)
          return;

        foreach (var entityType in entityTypes)
        {
          if (executeUntil <= DateTimeOffset.UtcNow) break;

          switch (entityType)
          {
            case EntityType.Opportunity:
              await ProcessSyncPullVerificationOpportunity(partnerModel, partner, executeUntil);
              break;

            default:
              throw new InvalidOperationException($"Entity type '{entityType}' not supported");
          }
        }
      }
      catch (Exception ex)
      {
        if (_logger.IsEnabled(LogLevel.Error))
          _logger.LogError(ex, "Failed to process sync pull verification for partner '{partnerName}': {errorMessage}", partnerModel.Name, ex.Message);
      }
    }

    private async Task ProcessSyncPullVerificationOpportunity(Models.Lookups.Partner partnerModel, SyncPartner partner, DateTimeOffset executeUntil)
    {
      var entityType = EntityType.Opportunity;
      var myOpportunityEntityType = EntityType.MyOpportunity;
      var dateEnd = DateTimeOffset.UtcNow;
      var tracking = new PartnerSyncTrackingRequest
      {
        PartnerId = partnerModel.Id,
        SyncType = SyncType.Pull,
        EntityType = entityType,
        SyncScope = SyncScope.Verification,
        DateStamp = dateEnd,
        ItemsProcessed = 0,
        ItemsSucceeded = 0,
        ItemsSkipped = 0,
        ItemsFailed = 0,
        ItemsCreated = 0,
        ItemsUpdated = 0,
        ItemsDeleted = 0
      };
      var completedPull = false;

      try
      {
        var trackingLatest = _processingService.GetTrackingLatest(SyncType.Pull, partnerModel.Id, entityType, SyncScope.Verification);
        var dateStart = trackingLatest?.DateStamp.AddMinutes(-_scheduleJobOptions.PartnerSyncPullVerificationCheckpointOverlapMinutes)
          ?? dateEnd.AddHours(-_scheduleJobOptions.PartnerSyncPullVerificationInitialLookbackHours);

        var pullProviderClient = _providerClientFactoryResolver.CreateClient<ISyncProviderClientPullVerification>(partner);

        var pageNumber = 1;
        var pageSize = _scheduleJobOptions.PartnerSyncPullVerificationScheduleBatchSize;
        SyncResultPullVerification? result = null;

        while (executeUntil > DateTimeOffset.UtcNow)
        {
          var (Result, Items, PagedByProvider) = await ListSyncPullVerificationItems(partner, entityType, pullProviderClient, pageNumber, pageSize, dateStart, dateEnd, result);
          result = Result;

          if (Items.Count == 0)
          {
            completedPull = true;
            break;
          }

          foreach (var item in Items)
          {
            if (executeUntil <= DateTimeOffset.UtcNow) break;

            var action = SyncAction.Create;
            Guid? myOpportunityId = null;

            try
            {
              if (string.IsNullOrWhiteSpace(item.EntityExternalId))
                throw new InvalidOperationException("Entity external id expected");

              if (string.IsNullOrWhiteSpace(item.UserExternalId))
                throw new InvalidOperationException("User external id expected");

              if (string.IsNullOrWhiteSpace(item.ExternalId))
                throw new InvalidOperationException("Verification external id expected");

              if (string.IsNullOrWhiteSpace(item.Username))
                throw new InvalidOperationException("Username expected");

              if (_logger.IsEnabled(LogLevel.Information))
                _logger.LogInformation("Processing sync pull verification item for partner '{partner}', entity type '{entityType}', entity external id '{entityExternalId}', user external id '{userExternalId}'",
                  partner, entityType, item.EntityExternalId, item.UserExternalId);

              var processingItemExistingOpportunity = _processingService.GetPull(partnerModel.Id, entityType, item.EntityExternalId);
              if (!processingItemExistingOpportunity.HasSynchronizedEntity(entityType) || !processingItemExistingOpportunity!.OpportunityId.HasValue)
                throw new InvalidOperationException($"Synchronized opportunity mapping expected for partner '{partner}', entity type '{entityType}', entity external id '{item.EntityExternalId}'");

              var processingItemExistingMyOpportunity = _processingService.GetPull(partnerModel.Id, myOpportunityEntityType, item.ExternalId);
              var processingItemExistingMyOpportunityAction = processingItemExistingMyOpportunity == null ? default(SyncAction?) : Enum.Parse<SyncAction>(processingItemExistingMyOpportunity.Action, true);
              myOpportunityId = processingItemExistingMyOpportunity?.MyOpportunityId;

              if (processingItemExistingMyOpportunity?.Status == ProcessingStatus.Error)
              {
                if (_logger.IsEnabled(LogLevel.Information))
                  _logger.LogInformation(
                    "Processing of partner sync pull verification item skipped: Existing pull item is in permanent error state for partner '{partner}', entity type '{entityType}', entity external id '{entityExternalId}'. Retry count '{retryCount}'. Error: {errorReason}",
                    partner, myOpportunityEntityType, item.ExternalId, processingItemExistingMyOpportunity.RetryCount, processingItemExistingMyOpportunity.ErrorReason);

                IncrementTrackingSkipped(tracking);
                continue;
              }

              action = item.Status switch
              {
                SyncItemVerificationStatus.Cancelled => SyncAction.Delete,
                _ => processingItemExistingMyOpportunity.HasSynchronizedEntity(myOpportunityEntityType) && processingItemExistingMyOpportunityAction != SyncAction.Delete
                  ? SyncAction.Update : SyncAction.Create
              };

              if (!partnerModel.ActionsEnabledParsed.Contains(action))
              {
                if (_logger.IsEnabled(LogLevel.Information))
                  _logger.LogInformation("Processing of partner sync pull verification item skipped: Action '{action}' not enabled for partner '{partner}', entity type '{entityType}', entity external id '{entityExternalId}'",
                    action, partner, myOpportunityEntityType, item.ExternalId);

                IncrementTrackingSkipped(tracking);
                continue;
              }

              if (item.Status == SyncItemVerificationStatus.Cancelled)
              {
                if (!processingItemExistingMyOpportunity.HasSynchronizedEntity(myOpportunityEntityType) ||
                    !processingItemExistingMyOpportunity!.MyOpportunityId.HasValue ||
                    processingItemExistingMyOpportunityAction == SyncAction.Delete)
                {
                  IncrementTrackingSkipped(tracking);
                  continue;
                }

                // Delete action records its own successful pull state; error state is handled by this sync flow.
                await _myOpportunityService.PerformActionDeleteVerificationFromPartnerSyncPull(processingItemExistingMyOpportunity.MyOpportunityId.Value, false);

                IncrementTrackingSucceeded(tracking, SyncAction.Delete);
                continue;
              }

              var request = new MyOpportunityRequestVerifyImportPartnerSync
              {
                OpportunityId = processingItemExistingOpportunity.OpportunityId.Value,
                UserEmail = item.UserEmail,
                UserPhoneNumber = item.UserPhoneNumber,
                DateStart = item.DateStart,
                DateEnd = item.DateEnd,
                CommitmentInterval = item.CommitmentInterval == null ? null : new MyOpportunityRequestVerifyCommitmentInterval
                {
                  Id = item.CommitmentInterval.Id,
                  Count = item.CommitmentInterval.Count
                },
                Completed = item.Status == SyncItemVerificationStatus.Completed,
                PercentComplete = item.PercentComplete,
                DateCompleted = item.DateCompleted,
                CustomFields = item.CustomFields
              };

              var payloadHash = HashHelper.ComputeSHA256Hash(request);
              var retryingPreviousError = !string.IsNullOrWhiteSpace(processingItemExistingMyOpportunity?.ErrorReason);

              if (processingItemExistingMyOpportunityAction != SyncAction.Delete && !retryingPreviousError &&
                  string.Equals(processingItemExistingMyOpportunity?.PayloadHash, payloadHash, StringComparison.Ordinal))
              {
                if (_logger.IsEnabled(LogLevel.Information))
                  _logger.LogInformation(
                    "Processing of partner sync pull verification item skipped: Effective payload unchanged; no domain update required for partner '{partner}', entity type '{entityType}', entity external id '{entityExternalId}'",
                    partner, myOpportunityEntityType, item.ExternalId);

                IncrementTrackingSkipped(tracking);
                continue;
              }

              var importResult = await _myOpportunityService.PerformActionImportVerificationFromPartnerSync(request);
              myOpportunityId = importResult.MyOpportunityId;

              if (importResult.Skipped)
              {
                // A skipped result with an id is an existing terminal verification. Record the accepted payload hash
                // even though no domain mutation is required; missing-user retries return without an id.
                if (importResult.MyOpportunityId.HasValue)
                  await _processingService.RecordPull(action, partnerModel.Id, myOpportunityEntityType, item.ExternalId, importResult.MyOpportunityId.Value, payloadHash);

                if (_logger.IsEnabled(LogLevel.Information))
                  _logger.LogInformation("Processing of partner sync pull verification item skipped: {skipReason}", importResult.SkipReason);

                IncrementTrackingSkipped(tracking);
                continue;
              }

              if (!myOpportunityId.HasValue)
                throw new InvalidOperationException($"MyOpportunity id expected after partner sync verification import for partner '{partner}', entity type '{myOpportunityEntityType}', entity external id '{item.ExternalId}'");

              await _processingService.RecordPull(action, partnerModel.Id, myOpportunityEntityType, item.ExternalId, myOpportunityId.Value, payloadHash);

              IncrementTrackingSucceeded(tracking, action);

              if (_logger.IsEnabled(LogLevel.Information))
                _logger.LogInformation("Processed sync pull verification item for partner '{partner}', entity type '{entityType}', entity external id '{entityExternalId}', user external id '{userExternalId}'",
                  partner, entityType, item.EntityExternalId, item.UserExternalId);
            }
            catch (Exception ex)
            {
              IncrementTrackingFailed(tracking);

              if (_logger.IsEnabled(LogLevel.Error))
                _logger.LogError(ex, "Failed to process sync pull verification item for partner '{partner}' and entity type '{entityType}': {errorMessage}", partner, entityType, ex.Message);

              if (action == SyncAction.Create) myOpportunityId = null;

              try
              {
                if (!string.IsNullOrWhiteSpace(item.ExternalId))
                  await _processingService.RecordPullError(action, partnerModel.Id, myOpportunityEntityType, item.ExternalId, myOpportunityId, ex.Message);
              }
              catch (Exception innerEx)
              {
                if (_logger.IsEnabled(LogLevel.Error))
                  _logger.LogError(innerEx, "Failed to record sync pull verification error state for partner '{partner}' and entity type '{entityType}': {errorMessage}", partner, myOpportunityEntityType, innerEx.Message);
              }
            }
          }

          if (executeUntil <= DateTimeOffset.UtcNow) break;

          if (result.ReachedTotalCount(pageNumber, pageSize))
          {
            completedPull = true;
            break;
          }

          if (PagedByProvider) result = null;

          pageNumber++;
        }

        if (!completedPull)
          tracking.RunFailureReason = "Execution window elapsed before verification pull completed";
      }
      catch (Exception ex)
      {
        tracking.RunFailureReason = ex.Message;

        if (_logger.IsEnabled(LogLevel.Error))
          _logger.LogError(ex, "Failed to process sync pull verification for partner '{partner}' and entity type '{entityType}': {errorMessage}", partner, entityType, ex.Message);
      }
      finally
      {
        if (tracking.ItemsProcessed == 0 && !string.IsNullOrWhiteSpace(tracking.RunFailureReason))
        {
          await _processingService.RecordTracking(new PartnerSyncTrackingRequest
          {
            PartnerId = tracking.PartnerId,
            SyncType = tracking.SyncType,
            EntityType = tracking.EntityType,
            SyncScope = tracking.SyncScope,
            DateStamp = tracking.DateStamp,
            RunFailureReason = tracking.RunFailureReason
          });
        }
        else
        {
          await _processingService.RecordTracking(tracking);
        }
      }
    }

    private async Task<(SyncResultPullVerification Result, List<SyncItemVerification> Items, bool PagedByProvider)> ListSyncPullVerificationItems(
      SyncPartner partner,
      EntityType entityType,
      ISyncProviderClientPullVerification pullProviderClient,
      int pageNumber,
      int pageSize,
      DateTimeOffset dateStart,
      DateTimeOffset dateEnd,
      SyncResultPullVerification? result)
    {
      if (result == null)
      {
        var filter = new SyncFilterPullVerification
        {
          PageNumber = pageNumber,
          PageSize = pageSize,
          DateStart = dateStart,
          DateEnd = dateEnd
        };

        if (_logger.IsEnabled(LogLevel.Information))
          _logger.LogInformation("Processing sync pull verification for partner '{partner}', entity type '{entityType}', from '{dateStart}' to '{dateEnd}', on page '{pageNumber}' with batch size '{batchSize}'",
            partner, entityType, filter.DateStart, filter.DateEnd, filter.PageNumber, filter.PageSize);

        result = await pullProviderClient.List(filter);

        if (!result.TotalCount.HasValue)
          throw new InvalidOperationException("Paginated filter: Total count expected but is null");

        if (result.Items.Count == 0)
        {
          if (_logger.IsEnabled(LogLevel.Information))
            _logger.LogInformation("No sync pull verification items found to process for partner '{partner}', entity type '{entityType}', from '{dateStart}' to '{dateEnd}', on page '{pageNumber}'",
              partner, entityType, filter.DateStart, filter.DateEnd, filter.PageNumber);

          return (result, [], true);
        }
      }

      // If the provider ignores paging and returns the full result set, page it locally
      var pagedByProvider = result.Items.Count <= pageSize;
      var items = pagedByProvider
        ? result.Items
        : [.. result.Items.Skip((pageNumber - 1) * pageSize).Take(pageSize)];

      return (result, items, pagedByProvider);
    }

    private static void IncrementTrackingSucceeded(PartnerSyncTrackingRequest tracking, SyncAction? action = null)
    {
      ArgumentNullException.ThrowIfNull(tracking, nameof(tracking));

      tracking.ItemsProcessed = tracking.ItemsProcessed.GetValueOrDefault() + 1;
      tracking.ItemsSucceeded = tracking.ItemsSucceeded.GetValueOrDefault() + 1;

      if (!action.HasValue) return;

      switch (action.Value)
      {
        case SyncAction.Create:
          tracking.ItemsCreated = tracking.ItemsCreated.GetValueOrDefault() + 1;
          break;

        case SyncAction.Update:
          tracking.ItemsUpdated = tracking.ItemsUpdated.GetValueOrDefault() + 1;
          break;

        case SyncAction.Delete:
          tracking.ItemsDeleted = tracking.ItemsDeleted.GetValueOrDefault() + 1;
          break;

        default:
          throw new InvalidOperationException($"Sync action '{action}' not supported for tracking");
      }
    }

    private static void IncrementTrackingSkipped(PartnerSyncTrackingRequest tracking)
    {
      ArgumentNullException.ThrowIfNull(tracking, nameof(tracking));

      tracking.ItemsProcessed = tracking.ItemsProcessed.GetValueOrDefault() + 1;
      tracking.ItemsSkipped = tracking.ItemsSkipped.GetValueOrDefault() + 1;
    }

    private static void IncrementTrackingFailed(PartnerSyncTrackingRequest tracking)
    {
      ArgumentNullException.ThrowIfNull(tracking, nameof(tracking));

      tracking.ItemsProcessed = tracking.ItemsProcessed.GetValueOrDefault() + 1;
      tracking.ItemsFailed = tracking.ItemsFailed.GetValueOrDefault() + 1;
    }
    #endregion
  }
}



