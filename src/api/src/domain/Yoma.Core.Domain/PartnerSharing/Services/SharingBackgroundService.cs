using Microsoft.Extensions.Logging;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.Opportunity.Interfaces;
using Yoma.Core.Domain.PartnerSharing.Interfaces;
using Microsoft.Extensions.Options;
using Hangfire;
using Hangfire.Storage;
using Yoma.Core.Domain.PartnerSharing.Interfaces.Provider;

namespace Yoma.Core.Domain.PartnerSharing.Services
{
  public class SharingBackgroundService : ISharingBackgroundService
  {
    #region Class Variables
    private readonly ILogger<SharingBackgroundService> _logger;
    private readonly AppSettings _appSettings;
    private readonly ScheduleJobOptions _scheduleJobOptions;
    private readonly ISharingService _sharingService;
    private readonly IOpportunityService _opportunityService;
    private readonly ISharingProviderClientFactoryPartner _sharingProviderClientFactoryPartner;
    private readonly IDistributedLockService _distributedLockService;
    #endregion

    #region Constructor
    public SharingBackgroundService(ILogger<SharingBackgroundService> logger,
        IOptions<AppSettings> appSettings,
        IOptions<ScheduleJobOptions> scheduleJobOptions,
        ISharingService sharingService,
        IOpportunityService opportunityService,
        ISharingProviderClientFactoryPartner sharingProviderClientFactoryPartner,
        IDistributedLockService distributedLockService)
    {
      _logger = logger;
      _appSettings = appSettings.Value;
      _scheduleJobOptions = scheduleJobOptions.Value;
      _sharingService = sharingService;
      _opportunityService = opportunityService;
      _sharingProviderClientFactoryPartner = sharingProviderClientFactoryPartner;
      _distributedLockService = distributedLockService;
    }
    #endregion

    #region Public Members
    public async Task ProcessSharing()
    {
      const string lockIdentifier = "partner_sharing_process";
      var dateTimeNow = DateTimeOffset.UtcNow;
      var executeUntil = dateTimeNow.AddHours(2); //TODO: ScheduleJobOptions
      var lockDuration = executeUntil - dateTimeNow + TimeSpan.FromMinutes(_scheduleJobOptions.DistributedLockDurationBufferInMinutes);

      if (!await _distributedLockService.TryAcquireLockAsync(lockIdentifier, lockDuration))
      {
        _logger.LogInformation("{Process} is already running. Skipping execution attempt at {dateStamp}", nameof(ProcessSharing), DateTimeOffset.UtcNow);
        return;
      }

      try
      {
        using (JobStorage.Current.GetConnection().AcquireDistributedLock(lockIdentifier, lockDuration))
        {
          _logger.LogInformation("Lock '{lockIdentifier}' acquired by {hostName} at {dateStamp}. Lock duration set to {lockDurationInMinutes} minutes",
            lockIdentifier, Environment.MachineName, DateTimeOffset.UtcNow, lockDuration.TotalMinutes);

          _logger.LogInformation("Processing partner sharing");

          var itemIdsToSkip = new List<Guid>();
          while (executeUntil > DateTimeOffset.UtcNow)
          {
            var items = _sharingService.ListPendingSchedule(1000, itemIdsToSkip); //TODO: ScheduleJobOptions
            if (items.Count == 0) break;

            foreach (var item in items)
            {
              try
              {
                _logger.LogInformation("Processing sharing for '{entityType}' and item with id '{id}'", item.EntityType, item.Id);

                var sharingProviderClient = _sharingProviderClientFactoryPartner.CreateClient(item.Partner);

                var entityType = Enum.Parse<EntityType>(item.EntityType, true);

                switch (entityType)
                {
                  case EntityType.Opportunity:
                    var opportunity = _opportunityService.GetById(item.Id, true, true, false);
                    var action = Enum.Parse<ProcessingAction>(item.Action, true);

                    switch (action)
                    {
                      case ProcessingAction.Create:
                        //scheduled for execution upon explicit opportunity creation (see ISharingServiceEventListener)
                        //organization must be active in order to create an opportunity
                        //trigger points (TODO: MediatR):
                        // - IOpportunityService.Create (explicit)

                        //scheduling failsafe
                        if (!SharingService.Statuses_Opportunity_Creatable.Contains(opportunity.Status))
                          throw new InvalidOperationException($"Action '{action}': Opportunity status of '{string.Join(',', SharingService.Statuses_Opportunity_Creatable)}' expected. Current status '{opportunity.Status}'");

                        item.EntityExternalId = await sharingProviderClient.CreateOpportunity(opportunity);
                        break;

                      case ProcessingAction.Update:
                        if (string.IsNullOrEmpty(item.EntityExternalId))
                          throw new ArgumentNullException(nameof(item), "External id required");

                        //scheduled for execution upon opportunity update and explicit and implicit activation or deactivation (see ISharingServiceEventListener)
                        //trigger points (TODO: MediatR):
                        // - IOpportunityService.Update (explicit)
                        // - IOpportunityService.UpdateStatus (explicit)
                        // - IOrganizationService.UpdateStatus (implicit)
                        // - IOrganizationBackgroundService.ProcessDeclination (implicit)

                        //implicit alignment for sharing processing
                        //if organization is activated, opportunity is activated provided current status of active 
                        //if organization is inactivated, opportunity is inactivated provided active
                        if (opportunity.OrganizationStatus == Entity.OrganizationStatus.Inactive && opportunity.Status == Opportunity.Status.Active)
                          opportunity.Status = Opportunity.Status.Inactive;

                        //scheduling failsafe post implicit adjustment
                        if (!SharingService.Statuses_Opportunity_Updatable.Contains(opportunity.Status))
                          throw new InvalidOperationException($"Action '{action}': Opportunity status of '{string.Join(',', SharingService.Statuses_Opportunity_Updatable)}' expected. Current status '{opportunity.Status}'");

                        await sharingProviderClient.UpdateOpportunity(item.EntityExternalId, opportunity);
                        break;

                      case ProcessingAction.Delete:
                        if (string.IsNullOrEmpty(item.EntityExternalId))
                          throw new ArgumentNullException(nameof(item), "External id required");

                        //scheduled for execution upon explicit and implicit opportunity deletion (see ISharingServiceEventListener)
                        //once an opportunity or organization are deleted, it cannot be reinstated
                        //trigger points (TODO: MediatR):
                        // - IOpportunityService.UpdateStatus (explicit)
                        // - IOpportunityService.ProcessDeletion (explicit)
                        // - IOrganizationService.UpdateStatus (implicit)
                        // - IOrganizationBackgroundService.ProcessDeletion (implicit)

                        //scheduling failsafe
                        if (!SharingService.Statuses_Opportunity_CanDelete.Contains(opportunity.Status))
                          throw new InvalidOperationException($"Action '{action}': Opportunity status of '{string.Join(',', SharingService.Statuses_Opportunity_CanDelete)}' expected. Current status '{opportunity.Status}'");

                        await sharingProviderClient.DeleteOpportunity(item.EntityExternalId);
                        break;

                      default:
                        throw new InvalidOperationException($"Processing action of '{action}' not supported");
                    }
                    break;

                  default:
                    throw new InvalidOperationException($"Entity type of '{entityType}' not supported");
                }

                item.Status = ProcessingStatus.Processed;
                await _sharingService.UpdateSchedule(item);

                _logger.LogInformation("Processed sharing for '{entityType}' and item with id '{id}'", item.EntityType, item.Id);
              }
              catch (Exception ex)
              {
                _logger.LogError(ex, "Failed to process sharing for '{entityType}'and item with id '{id}''", item.EntityType, item.Id);

                item.Status = ProcessingStatus.Error;
                item.ErrorReason = ex.Message;
                await _sharingService.UpdateSchedule(item);

                itemIdsToSkip.Add(item.Id);
              }

              if (executeUntil <= DateTimeOffset.UtcNow) break;
            }
          }

          _logger.LogInformation("Processed SSI tenant creation");
        }
      }
      catch (DistributedLockTimeoutException ex)
      {
        _logger.LogError(ex, "Could not acquire distributed lock for {process}", nameof(ProcessSharing));
      }
      catch (Exception ex)
      {
        _logger.LogError(ex, "Failed to execute {process}", nameof(ProcessSharing));
      }
      finally
      {
        await _distributedLockService.ReleaseLockAsync(lockIdentifier);
      }
    }
    #endregion
  }
}
