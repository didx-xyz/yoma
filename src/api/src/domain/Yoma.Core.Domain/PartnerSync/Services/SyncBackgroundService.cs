using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System.Transactions;
using Yoma.Core.Domain.Core.Extensions;
using Yoma.Core.Domain.Core.Helpers;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.Entity;
using Yoma.Core.Domain.Entity.Helpers;
using Yoma.Core.Domain.Entity.Interfaces;
using Yoma.Core.Domain.Lookups.Interfaces;
using Yoma.Core.Domain.Opportunity;
using Yoma.Core.Domain.Opportunity.Extensions;
using Yoma.Core.Domain.Opportunity.Interfaces;
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
    private readonly ICountryService _countryService;
    private readonly ISyncService _syncService;
    private readonly IPartnerService _partnerService;
    private readonly IOpportunityService _opportunityService;
    private readonly IOrganizationService _organizationService;
    private readonly ISyncProviderClientFactoryResolver _providerClientFactoryResolver;
    private readonly IDistributedLockService _distributedLockService;
    private readonly IExecutionStrategyService _executionStrategyService;
    #endregion

    #region Constructor
    public SyncBackgroundService(ILogger<SyncBackgroundService> logger,
        IOptions<AppSettings> appSettings,
        IOptions<ScheduleJobOptions> scheduleJobOptions,
        ICountryService countryService,
        ISyncService syncService,
        IPartnerService partnerService,
        IOpportunityService opportunityService,
        IOrganizationService organizationService,
        ISyncProviderClientFactoryResolver providerClientFactoryResolver,
        IDistributedLockService distributedLockService,
        IExecutionStrategyService executionStrategyService)
    {
      _logger = logger;
      _appSettings = appSettings.Value ?? throw new ArgumentNullException(nameof(appSettings));
      _scheduleJobOptions = scheduleJobOptions.Value ?? throw new ArgumentNullException(nameof(scheduleJobOptions));
      _countryService = countryService ?? throw new ArgumentNullException(nameof(countryService));
      _syncService = syncService ?? throw new ArgumentNullException(nameof(syncService));
      _partnerService = partnerService ?? throw new ArgumentNullException(nameof(partnerService));
      _opportunityService = opportunityService ?? throw new ArgumentNullException(nameof(opportunityService));
      _organizationService = organizationService ?? throw new ArgumentNullException(nameof(organizationService));
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

                  var request = new SyncRequestPush<Opportunity.Models.Opportunity>
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
    #endregion

    #region Private Members
    private async Task ProcessSyncPullPartner(Models.Lookups.Partner partnerModel, DateTimeOffset executeUntil)
    {
      try
      {
        await ProcessSyncPull(partnerModel, executeUntil);
      }
      catch (Exception ex)
      {
        if (_logger.IsEnabled(LogLevel.Error))
          _logger.LogError(ex, "Failed to process sync pull for partner '{partnerName}': {errorMessage}", partnerModel.Name, ex.Message);
      }
    }

    private async Task ProcessSyncPull(Models.Lookups.Partner partnerModel, DateTimeOffset executeUntil)
    {
      var partner = Enum.Parse<Core.SyncPartner>(partnerModel.Name, true);

      if (!partnerModel.SyncTypesEnabledParsed.TryGetValue(SyncType.Pull, out var entityTypes) || entityTypes.Count == 0)
        return;

      foreach (var entityType in entityTypes.Distinct())
      {
        if (executeUntil <= DateTimeOffset.UtcNow) break;

        await ProcessSyncPull(partnerModel, partner, entityType, executeUntil);
      }
    }

    private async Task ProcessSyncPull(Models.Lookups.Partner partnerModel, Core.SyncPartner partner, EntityType entityType, DateTimeOffset executeUntil)
    {
      switch (entityType)
      {
        case EntityType.Opportunity:
          await ProcessSyncPullOpportunity(partnerModel, partner, executeUntil);
          break;

        default:
          throw new InvalidOperationException($"Entity type '{entityType}' not supported");
      }
    }

    private async Task ProcessSyncPullOpportunity(Models.Lookups.Partner partnerModel, Core.SyncPartner partner, DateTimeOffset executeUntil)
    {
      var entityType = EntityType.Opportunity;
      var pullProviderClient = _providerClientFactoryResolver.CreateClient<ISyncProviderClientPull<SyncItemOpportunity>>(partner);

      var pageNumber = 1;
      var pageSize = _scheduleJobOptions.PartnerSyncPullScheduleBatchSize;
      SyncResultPull<SyncItemOpportunity>? result = null;

      while (executeUntil > DateTimeOffset.UtcNow)
      {
        var (Result, Items, PagedByProvider) = await ListSyncPullItems(partner, entityType, pullProviderClient, pageNumber, pageSize, result);
        result = Result;

        if (Items.Count == 0) break;

        foreach (var item in Items)
        {
          if (executeUntil <= DateTimeOffset.UtcNow) break;

          await ProcessSyncPullOpportunityItem(partnerModel, partner, item);
        }

        if (executeUntil <= DateTimeOffset.UtcNow) break;
        if (result.ReachedTotalCount(pageNumber, pageSize)) break;

        if (PagedByProvider) result = null;

        pageNumber++;
      }
    }

    private async Task<(SyncResultPull<SyncItemOpportunity> Result, List<SyncItem<SyncItemOpportunity>> Items, bool PagedByProvider)> ListSyncPullItems(
      Core.SyncPartner partner,
      EntityType entityType,
      ISyncProviderClientPull<SyncItemOpportunity> pullProviderClient,
      int pageNumber,
      int pageSize,
      SyncResultPull<SyncItemOpportunity>? result)
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

    private async Task ProcessSyncPullOpportunityItem(Models.Lookups.Partner partnerModel, Core.SyncPartner partner, SyncItem<SyncItemOpportunity> item)
    {
      if (string.IsNullOrWhiteSpace(item.ExternalId))
        throw new InvalidOperationException("External id expected");

      var entityType = EntityType.Opportunity;
      var action = SyncAction.Create;
      Guid? entityId = null;

      try
      {
        var opportunityItem = item.Item;
        var scheduleItemExisting = _syncService.GetSchedulePull(partnerModel.Id, entityType, item.ExternalId);

        Opportunity.Models.Opportunity? opportunityExisting = null;
        if (scheduleItemExisting?.OpportunityId.HasValue == true)
        {
          entityId = scheduleItemExisting.OpportunityId.Value;
          opportunityExisting = _opportunityService.GetById(entityId.Value, false, false, false);
        }

        if (opportunityExisting?.Status == Status.Deleted)
        {
          if (_logger.IsEnabled(LogLevel.Information))
            _logger.LogInformation("Processing of partner sync pull item skipped: Entity already deleted in Yoma for partner '{partner}', entity type '{entityType}', entity id '{entityId}'", partner, entityType, entityId);

          return;
        }

        if (scheduleItemExisting != null && Enum.Parse<SyncAction>(scheduleItemExisting.Action, true) == SyncAction.Delete)
        {
          if (_logger.IsEnabled(LogLevel.Information))
            _logger.LogInformation("Processing of partner sync pull item skipped: Entity already deleted via sync for partner '{partner}', entity type '{entityType}', entity external id '{entityExternalId}'", partner, entityType, item.ExternalId);

          return;
        }

        action = opportunityItem.ResolveSyncAction(scheduleItemExisting);

        if (!partnerModel.ActionEnabledParsed.Contains(action))
        {
          if (_logger.IsEnabled(LogLevel.Information))
            _logger.LogInformation("Processing of partner sync pull item skipped: Action '{action}' not enabled for partner '{partner}', entity type '{entityType}', entity external id '{entityExternalId}'", action, partner, entityType, item.ExternalId);

          return;
        }

        opportunityItem.MapCountries(code => _countryService.GetByCodeAlpha2(code).Id);

        await ExecuteSyncPullOpportunityItem(partnerModel, partner, entityType, item, opportunityItem, action, entityId);
      }
      catch (Exception ex)
      {
        if (_logger.IsEnabled(LogLevel.Error))
          _logger.LogError(ex, "Failed to process sync pull item for partner '{partner}' and entity type '{entityType}': {errorMessage}", partner, entityType, ex.Message);

        if (action == SyncAction.Create) entityId = null;

        await UpdateSyncPullOpportunityItemErrorState(partnerModel, partner, entityType, item, action, entityId, ex);
      }
    }

    private async Task ExecuteSyncPullOpportunityItem(
      Models.Lookups.Partner partnerModel,
      Core.SyncPartner partner,
      EntityType entityType,
      SyncItem<SyncItemOpportunity> item,
      SyncItemOpportunity opportunityItem,
      SyncAction action,
      Guid? entityId)
    {
      await _executionStrategyService.ExecuteInExecutionStrategyAsync(async () =>
      {
        using var scope = TransactionScopeHelper.CreateReadCommitted(TransactionScopeOption.RequiresNew);

        switch (action)
        {
          case SyncAction.Create:
            {
              var request = opportunityItem.ToRequestCreate();
              var opportunity = await _opportunityService.Create(request, false, false, false);
              entityId = opportunity.Id;
              break;
            }

          case SyncAction.Update:
            {
              if (!entityId.HasValue)
                throw new InvalidOperationException($"Entity id expected for pull update: Partner '{partner}', entity type '{entityType}', entity external id '{item.ExternalId}'");

              var request = opportunityItem.ToRequestUpdate(entityId.Value);
              await _opportunityService.Update(request, false, false);
              break;
            }

          case SyncAction.Delete:
            {
              if (!entityId.HasValue)
                throw new InvalidOperationException($"Entity id expected for pull deletion: Partner '{partner}', entity type '{entityType}', entity external id '{item.ExternalId}'");

              await _opportunityService.UpdateStatus(entityId.Value, Status.Deleted, false);
              break;
            }

          default:
            throw new InvalidOperationException($"Action of '{action}' not supported");
        }

        await _syncService.SchedulePull(action, partnerModel.Id, entityType, item.ExternalId, entityId);

        scope.Complete();
      });
    }

    private async Task UpdateSyncPullOpportunityItemErrorState(
      Models.Lookups.Partner partnerModel,
      Core.SyncPartner partner,
      EntityType entityType,
      SyncItem<SyncItemOpportunity> item,
      SyncAction action,
      Guid? entityId,
      Exception ex)
    {
      try
      {
        await _executionStrategyService.ExecuteInExecutionStrategyAsync(async () =>
        {
          using var scope = TransactionScopeHelper.CreateReadCommitted(TransactionScopeOption.RequiresNew);

          var scheduleItem = await _syncService.SchedulePull(action, partnerModel.Id, entityType, item.ExternalId, entityId);

          scheduleItem.Status = ProcessingStatus.Error;
          scheduleItem.ErrorReason = ex.Message;

          await _syncService.UpdateSchedulePull(scheduleItem);

          scope.Complete();
        });
      }
      catch (Exception innerEx)
      {
        if (_logger.IsEnabled(LogLevel.Error))
          _logger.LogError(innerEx, "Failed to update sync pull error state for partner '{partner}' and entity type '{entityType}': {errorMessage}", partner, entityType, innerEx.Message);
      }
    }
    #endregion
  }
}



