using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Yoma.Core.Domain.Core.Extensions;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.Entity;
using Yoma.Core.Domain.Entity.Helpers;
using Yoma.Core.Domain.Entity.Interfaces;
using Yoma.Core.Domain.Opportunity;
using Yoma.Core.Domain.Opportunity.Interfaces;
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
    private readonly ISyncService _syncService;
    private readonly IPartnerService _partnerService;
    private readonly IOpportunityService _opportunityService;
    private readonly IOrganizationService _organizationService;
    private readonly ISyncProviderClientFactoryResolver _providerClientFactoryResolver;
    private readonly IDistributedLockService _distributedLockService;
    #endregion

    #region Constructor
    public SyncBackgroundService(ILogger<SyncBackgroundService> logger,
        IOptions<AppSettings> appSettings,
        IOptions<ScheduleJobOptions> scheduleJobOptions,
        ISyncService syncService,
        IPartnerService partnerService,
        IOpportunityService opportunityService,
        IOrganizationService organizationService,
        ISyncProviderClientFactoryResolver providerClientFactoryResolver,
        IDistributedLockService distributedLockService)
    {
      _logger = logger;
      _appSettings = appSettings.Value;
      _scheduleJobOptions = scheduleJobOptions.Value;
      _syncService = syncService;
      _partnerService = partnerService;
      _opportunityService = opportunityService;
      _organizationService = organizationService;
      _providerClientFactoryResolver = providerClientFactoryResolver;
      _distributedLockService = distributedLockService;
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
          var items = _syncService.ListSchedulePendingPush(_scheduleJobOptions.PartnerSyncPushScheduleBatchSize, itemIdsToSkip);
          if (items.Count == 0)
          {
            if (_logger.IsEnabled(LogLevel.Information)) _logger.LogInformation("No sync push items found to process");
            break;
          }

          foreach (var item in items)
          {
            try
            {
              if (_logger.IsEnabled(LogLevel.Information)) _logger.LogInformation("Processing sync push for '{entityType}' and item with id '{id}'", item.EntityType, item.Id);

              var entityType = Enum.Parse<EntityType>(item.EntityType, true);

              switch (entityType)
              {
                case EntityType.Opportunity:
                  if (!item.OpportunityId.HasValue)
                    throw new InvalidOperationException($"Entity type '{entityType}': Opportunity id is null");

                  var pushProviderClient = _providerClientFactoryResolver.CreateClient<ISyncProviderClientPush<Opportunity.Models.Opportunity>>(item.Partner);

                  var opportunity = _opportunityService.GetById(item.OpportunityId.Value, true, true, false);
                  var organization = _organizationService.GetById(opportunity.OrganizationId, false, true, false);

                  var request = new SyncRequestItem<Opportunity.Models.Opportunity>
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
                      if (opportunity.OrganizationStatus != OrganizationStatus.Active || !SyncService.Statuses_Opportunity_Creatable.Contains(opportunity.Status))
                      {
                        var reason = opportunity.OrganizationStatus != OrganizationStatus.Active
                          ? $"Associated organization is no longer '{OrganizationStatus.Active}'"
                          : $"Opportunity status of '{SyncService.Statuses_Opportunity_Creatable.JoinNames()}' expected. Current status '{opportunity.Status.ToDescription()}'";

                        if (_logger.IsEnabled(LogLevel.Information)) _logger.LogInformation("Action '{action}': Aborting sync push for '{entityType}' and item with id '{id}'. {reason}", action, item.EntityType, item.Id, reason);

                        item.Status = ProcessingStatus.Aborted;
                        await _syncService.UpdateSchedulePush(item);
                        continue;
                      }

                      item.EntityExternalId = await pushProviderClient.Create(request);
                      break;

                    case SyncAction.Update:
                      if (string.IsNullOrEmpty(item.EntityExternalId))
                        throw new ArgumentNullException(nameof(item), "External id required");

                      //scheduled for execution upon opportunity update and explicit and implicit activation or deactivation
                      //trigger points:
                      // - IOpportunityService: (explicit)
                      //    Update | AllocateRewards | UpdateFeatured | UpdateStatus | AssignCategories | RemoveCategories | AssignCountries | RemoveCountries
                      //    AssignLanguages | RemoveLanguages | AssignSkills | RemoveSkills | AssignVerificationTypes | RemoveVerificationTypes
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
                      if (!SyncService.Statuses_Opportunity_Updatable.Contains(opportunity.Status))
                        throw new InvalidOperationException($"Action '{action}': Opportunity status of '{SyncService.Statuses_Opportunity_Updatable.JoinNames()}' expected. Current status '{opportunity.Status.ToDescription()}'");

                      request.ExternalId = item.EntityExternalId;
                      await pushProviderClient.Update(request);
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
                      if (!SyncService.Statuses_Opportunity_CanDelete.Contains(opportunity.Status))
                        throw new InvalidOperationException($"Action '{action}': Opportunity status of '{SyncService.Statuses_Opportunity_CanDelete.JoinNames()}' expected. Current status '{opportunity.Status.ToDescription()}'");

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
                  break;

                default:
                  throw new InvalidOperationException($"Entity type of '{entityType}' not supported");
              }

              item.Status = ProcessingStatus.Processed;
              await _syncService.UpdateSchedulePush(item);

              if (_logger.IsEnabled(LogLevel.Information)) _logger.LogInformation("Processed sync push for '{entityType}' and item with id '{id}'", item.EntityType, item.Id);
            }
            catch (Exception ex)
            {
              if (_logger.IsEnabled(LogLevel.Error)) _logger.LogError(ex, "Failed to process sync push for '{entityType}' and item with id '{id}': {errorMessage}", item.EntityType, item.Id, ex.Message);

              item.Status = ProcessingStatus.Error;
              item.ErrorReason = ex.Message;
              await _syncService.UpdateSchedulePush(item);

              itemIdsToSkip.Add(item.Id);
            }

            if (executeUntil <= DateTimeOffset.UtcNow) break;
          }
        }

        if (_logger.IsEnabled(LogLevel.Information)) _logger.LogInformation("Processed partner sync push");
      }
      catch (Exception ex)
      {
        if (_logger.IsEnabled(LogLevel.Error)) _logger.LogError(ex, "Failed to execute {process}: {errorMessage}", nameof(ProcessSyncPush), ex.Message);
      }
      finally
      {
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

        var partners = _partnerService.ListPull();
        if (partners.Count == 0)
        {
          if (_logger.IsEnabled(LogLevel.Information)) _logger.LogInformation("No sync pull partners found to process");
          return;
        }

        foreach (var partnerModel in partners)
        {
          if (executeUntil <= DateTimeOffset.UtcNow) break;

          try
          {
            var partner = Enum.Parse<Partner>(partnerModel.Name, true);

            if (!partnerModel.SyncTypesEnabledParsed.TryGetValue(SyncType.Pull, out var entityTypes) || entityTypes.Count == 0)
              continue;

            foreach (var entityType in entityTypes.Distinct())
            {
              if (executeUntil <= DateTimeOffset.UtcNow) break;

              switch (entityType)
              {
                case EntityType.Opportunity:
                  var pullProviderClient = _providerClientFactoryResolver.CreateClient<ISyncProviderClientPull<Opportunity.Models.Opportunity>>(partner);

                  var pageNumber = 1;
                  var pageSize = _scheduleJobOptions.PartnerSyncPullScheduleBatchSize;
                  SyncResultPull<Opportunity.Models.Opportunity>? result = null;

                  while (executeUntil > DateTimeOffset.UtcNow)
                  {
                    if (result == null)
                    {
                      var filter = new SyncFilterPull
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

                        break;
                      }
                    }

                    // If the provider ignores paging and returns the full result set, page it locally
                    var pagedByProvider = result.Items.Count <= pageSize;
                    var items = pagedByProvider
                      ? result.Items
                      : [.. result.Items.Skip((pageNumber - 1) * pageSize).Take(pageSize)];

                    if (items.Count == 0) break;

                    foreach (var item in items)
                    {
                      if (string.IsNullOrWhiteSpace(item.ExternalId))
                        throw new InvalidOperationException("External id expected");

                      var action = SyncAction.Create;
                      try
                      {
                        var opportunity = item.Item;

                        //TODO: Get latest pull processing log by sync type, partner, entity type and external id

                        //TODO: Determine pull action from latest log, local DB state and provider payload

                        //TODO: Skip item if partner does not support the determined action

                        //TODO: Create provider-managed opportunity
                        //TODO: Update provider-managed opportunity
                        //TODO: Delete or deactivate provider-managed opportunity

                        //TODO: Mark pull processing log as processed

                        //TODO: Log pull failure, increment retry count and enforce permanent skip rules
                      }
                      catch (Exception ex)
                      {
                        if (_logger.IsEnabled(LogLevel.Error))
                          _logger.LogError(ex, "Failed to process sync pull item for partner '{partner}' and entity type '{entityType}': {errorMessage}", partner, entityType, ex.Message);

                        await _syncService.LogPull(partnerModel.Id, action, entityType, null, item.ExternalId, ex.Message);
                      }

                      if (executeUntil <= DateTimeOffset.UtcNow) break;
                    }

                    if (executeUntil <= DateTimeOffset.UtcNow) break;

                    var totalCountReached = pageNumber * pageSize >= result.TotalCount!.Value;
                    if (totalCountReached) break;

                    if (pagedByProvider) result = null;

                    pageNumber++;
                  }
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
    #endregion
  }
}



