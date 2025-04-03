using Microsoft.Extensions.Logging;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.Opportunity.Interfaces;
using Yoma.Core.Domain.PartnerSharing.Interfaces;
using Microsoft.Extensions.Options;
using Yoma.Core.Domain.PartnerSharing.Interfaces.Provider;
using Yoma.Core.Domain.Opportunity;
using Yoma.Core.Domain.Entity.Interfaces;
using Yoma.Core.Domain.Entity.Helpers;
using Yoma.Core.Domain.Entity;
using Yoma.Core.Domain.PartnerSharing.Models;

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
    private readonly IOrganizationService _organizationService;
    private readonly ISharingProviderClientFactoryPartner _sharingProviderClientFactoryPartner;
    private readonly IDistributedLockService _distributedLockService;
    #endregion

    #region Constructor
    public SharingBackgroundService(ILogger<SharingBackgroundService> logger,
        IOptions<AppSettings> appSettings,
        IOptions<ScheduleJobOptions> scheduleJobOptions,
        ISharingService sharingService,
        IOpportunityService opportunityService,
        IOrganizationService organizationService,
        ISharingProviderClientFactoryPartner sharingProviderClientFactoryPartner,
        IDistributedLockService distributedLockService)
    {
      _logger = logger;
      _appSettings = appSettings.Value;
      _scheduleJobOptions = scheduleJobOptions.Value;
      _sharingService = sharingService;
      _opportunityService = opportunityService;
      _organizationService = organizationService;
      _sharingProviderClientFactoryPartner = sharingProviderClientFactoryPartner;
      _distributedLockService = distributedLockService;
    }
    #endregion

    #region Public Members
    public async Task ProcessSharing()
    {
      const string lockIdentifier = "partner_sharing_process";
      var dateTimeNow = DateTimeOffset.UtcNow;
      var executeUntil = dateTimeNow.AddHours(_scheduleJobOptions.PartnerSharingScheduleMaxIntervalInHours);
      var lockDuration = executeUntil - dateTimeNow + TimeSpan.FromMinutes(_scheduleJobOptions.DistributedLockDurationBufferInMinutes);
      var lockAcquired = false;

      try
      {
        lockAcquired = await _distributedLockService.TryAcquireLockAsync(lockIdentifier, lockDuration);
        if (!lockAcquired) return;

        var organizationYoma = _organizationService.GetByNameOrNull(_appSettings.YomaOrganizationName, true, true);
        if (organizationYoma == null)
        {
          _logger.LogInformation("{Process} will be aborted/skipped as the '{orgName}' organization could not be found", nameof(ProcessSharing), _appSettings.YomaOrganizationName);
          return;
        }

        _logger.LogInformation("Processing partner sharing");

        var itemIdsToSkip = new List<Guid>();
        while (executeUntil > DateTimeOffset.UtcNow)
        {
          var items = _sharingService.ListPendingSchedule(_scheduleJobOptions.PartnerSharingScheduleBatchSize, itemIdsToSkip);
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
                  if (!item.OpportunityId.HasValue)
                    throw new InvalidOperationException($"Entity type '{entityType}': Opportunity id is null");

                  var opportunity = _opportunityService.GetById(item.OpportunityId.Value, true, true, false);
                  var organization = _organizationService.GetById(opportunity.OrganizationId, false, true, false);

                  var request = new OpportunityRequestUpsert
                  {
                    Opportunity = opportunity,
                    Organization = organization,
                    OrganizationYoma = organizationYoma,
                    ShareContactInfo = SettingsHelper.GetValue<bool>(organization.Settings, Setting.Organization_Share_Contact_Info_With_Partners.ToString()) == true,
                    ShareAddressInfo = SettingsHelper.GetValue<bool>(organization.Settings, Setting.Organization_Share_Address_Details_With_Partners.ToString()) == true,
                  };

                  var action = Enum.Parse<ProcessingAction>(item.Action, true);

                  switch (action)
                  {
                    case ProcessingAction.Create:
                      //scheduled for execution upon explicit opportunity creation (active only)
                      //organization must be active in order to create an opportunity
                      //trigger points:
                      // - IOpportunityService.Create (explicit)

                      //with ScheduleUpdate (where the opportunity isn't loaded and logic is kept lightweight), a pending create is left untouched.
                      //during processing, we re-evaluate whether the opportunity is still valid for creation.
                      //if it’s no longer creatable (e.g., due to status or organization state), we abort the create here to prevent invalid partner data.
                      if (opportunity.OrganizationStatus != OrganizationStatus.Active || !SharingService.Statuses_Opportunity_Creatable.Contains(opportunity.Status))
                      {
                        var reason = opportunity.OrganizationStatus != OrganizationStatus.Active
                          ? $"Associated organization is no longer '{OrganizationStatus.Active}'"
                          : $"Opportunity status of '{string.Join(", ", SharingService.Statuses_Opportunity_Creatable)}' expected. Current status '{opportunity.Status}'";

                        _logger.LogInformation("Action '{action}': Aborting for '{entityType}' and item with id '{id}'. {reason}", action, item.EntityType, item.Id, reason);

                        item.Status = ProcessingStatus.Aborted;
                        await _sharingService.UpdateSchedule(item);
                        continue;
                      }

                      item.EntityExternalId = await sharingProviderClient.CreateOpportunity(request);
                      break;

                    case ProcessingAction.Update:
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

                      //implicit alignment for sharing processing
                      //if organization is activated, opportunity is activated provided current status of active 
                      //if organization is inactivated, opportunity is inactivated provided active
                      if (opportunity.OrganizationStatus == OrganizationStatus.Inactive && opportunity.Status == Status.Active)
                        opportunity.Status = Status.Inactive;

                      //scheduling failsafe post implicit adjustment
                      if (!SharingService.Statuses_Opportunity_Updatable.Contains(opportunity.Status))
                        throw new InvalidOperationException($"Action '{action}': Opportunity status of '{string.Join(',', SharingService.Statuses_Opportunity_Updatable)}' expected. Current status '{opportunity.Status}'");

                      request.ExternalId = item.EntityExternalId;
                      await sharingProviderClient.UpdateOpportunity(request);
                      break;

                    case ProcessingAction.Delete:
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
                      if (!SharingService.Statuses_Opportunity_CanDelete.Contains(opportunity.Status))
                        throw new InvalidOperationException($"Action '{action}': Opportunity status of '{string.Join(',', SharingService.Statuses_Opportunity_CanDelete)}' expected. Current status '{opportunity.Status}'");

                      //switch (opportunity.Status)
                      //{
                      //  case Status.Active:
                      //  case Status.Inactive:
                      //  case Status.Expired:
                      //    if (opportunity.OrganizationStatus != OrganizationStatus.Deleted)
                      //      throw new InvalidOperationException($"Processing action {action}: Opportunity with status {opportunity.Status} must be associated with a deleted organization");
                      //    break;

                      //  case Status.Deleted:
                      //    break;

                      //  default:
                      //    throw new InvalidOperationException($"Opportunity status of '{opportunity.Status}' not supported");
                      //}

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
              _logger.LogError(ex, "Failed to process sharing for '{entityType}'and item with id '{id}': {errorMessage}", item.EntityType, item.Id, ex.Message);

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
      catch (Exception ex)
      {
        _logger.LogError(ex, "Failed to execute {process}: {errorMessage}", nameof(ProcessSharing), ex.Message);
      }
      finally
      {
        if (lockAcquired) await _distributedLockService.ReleaseLockAsync(lockIdentifier);
      }
    }
    #endregion
  }
}
