using Hangfire;
using Hangfire.Storage;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Yoma.Core.Domain.Core.Helpers;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.EmailProvider;
using Yoma.Core.Domain.EmailProvider.Interfaces;
using Yoma.Core.Domain.EmailProvider.Models;
using Yoma.Core.Domain.Entity.Interfaces;
using Yoma.Core.Domain.Opportunity.Interfaces;
using Yoma.Core.Domain.Opportunity.Interfaces.Lookups;

namespace Yoma.Core.Domain.Opportunity.Services
{
  public class OpportunityBackgroundService : IOpportunityBackgroundService
  {
    #region Class Variables
    private readonly ILogger<OpportunityBackgroundService> _logger;
    private readonly ScheduleJobOptions _scheduleJobOptions;
    private readonly IOpportunityStatusService _opportunityStatusService;
    private readonly IOrganizationService _organizationService;
    private readonly IEmailProviderClient _emailProviderClient;
    private readonly IUserService _userService;
    private readonly IEmailURLFactory _emailURLFactory;
    private readonly IEmailPreferenceFilterService _emailPreferenceFilterService;
    private readonly IRepositoryBatchedValueContainsWithNavigation<Models.Opportunity> _opportunityRepository;
    private readonly IDistributedLockService _distributedLockService;
    private static readonly Status[] Statuses_Expirable = [Status.Active];
    private static readonly Status[] Statuses_Deletion = [Status.Inactive, Status.Expired];
    #endregion

    #region Constructor
    public OpportunityBackgroundService(ILogger<OpportunityBackgroundService> logger,
        IOptions<ScheduleJobOptions> scheduleJobOptions,
        IOpportunityStatusService opportunityStatusService,
        IOrganizationService organizationService,
        IEmailProviderClientFactory emailProviderClientFactory,
        IUserService userService,
        IEmailURLFactory emailURLFactory,
        IEmailPreferenceFilterService emailPreferenceFilterService,
        IRepositoryBatchedValueContainsWithNavigation<Models.Opportunity> opportunityRepository,
        IDistributedLockService distributedLockService)
    {
      _logger = logger;
      _scheduleJobOptions = scheduleJobOptions.Value;
      _opportunityStatusService = opportunityStatusService;
      _organizationService = organizationService;
      _emailProviderClient = emailProviderClientFactory.CreateClient();
      _userService = userService;
      _emailURLFactory = emailURLFactory;
      _emailPreferenceFilterService = emailPreferenceFilterService;
      _opportunityRepository = opportunityRepository;
      _distributedLockService = distributedLockService;
    }
    #endregion

    #region Public Members
    public async Task ProcessExpiration()
    {
      const string lockIdentifier = "opportunity_process_expiration";
      var dateTimeNow = DateTimeOffset.UtcNow;
      var executeUntil = dateTimeNow.AddHours(_scheduleJobOptions.DefaultScheduleMaxIntervalInHours);
      var lockDuration = executeUntil - dateTimeNow + TimeSpan.FromMinutes(_scheduleJobOptions.DistributedLockDurationBufferInMinutes);

      if (!await _distributedLockService.TryAcquireLockAsync(lockIdentifier, lockDuration))
      {
        _logger.LogInformation("{Process} is already running. Skipping execution attempt at {dateStamp}", nameof(ProcessExpiration), DateTimeOffset.UtcNow);
        return;
      }

      try
      {
        using (JobStorage.Current.GetConnection().AcquireDistributedLock(lockIdentifier, lockDuration))
        {
          _logger.LogInformation("Lock '{lockIdentifier}' acquired by {hostName} at {dateStamp}. Lock duration set to {lockDurationInMinutes} minutes",
            lockIdentifier, Environment.MachineName, DateTimeOffset.UtcNow, lockDuration.TotalMinutes);

          _logger.LogInformation("Processing opportunity expiration");

          var statusExpiredId = _opportunityStatusService.GetByName(Status.Expired.ToString()).Id;
          var statusExpirableIds = Statuses_Expirable.Select(o => _opportunityStatusService.GetByName(o.ToString()).Id).ToList();

          while (executeUntil > DateTimeOffset.UtcNow)
          {
            var items = _opportunityRepository.Query().Where(o => statusExpirableIds.Contains(o.StatusId) &&
                o.DateEnd.HasValue && o.DateEnd.Value <= DateTimeOffset.UtcNow).OrderBy(o => o.DateEnd).Take(_scheduleJobOptions.OpportunityExpirationBatchSize).ToList();
            if (items.Count == 0) break;

            var user = _userService.GetByEmail(HttpContextAccessorHelper.GetUsernameSystem, false, false);

            foreach (var item in items)
            {
              item.StatusId = statusExpiredId;
              item.ModifiedByUserId = user.Id;
              _logger.LogInformation("Opportunity with id '{id}' flagged for expiration", item.Id);
            }

            items = await _opportunityRepository.Update(items);

            await SendEmail(items, EmailType.Opportunity_Expiration_Expired);

            if (executeUntil <= DateTimeOffset.UtcNow) break;
          }

          _logger.LogInformation("Processed opportunity expiration");
        }
      }
      catch (DistributedLockTimeoutException ex)
      {
        _logger.LogError(ex, "Could not acquire distributed lock for {process}", nameof(ProcessExpiration));
      }
      catch (Exception ex)
      {
        _logger.LogError(ex, "Failed to execute {process}", nameof(ProcessExpiration));
      }
      finally
      {
        await _distributedLockService.ReleaseLockAsync(lockIdentifier);
      }
    }

    public async Task ProcessExpirationNotifications()
    {
      const string lockIdentifier = "opportunity_process_expiration_notifications";
      var lockDuration = TimeSpan.FromHours(_scheduleJobOptions.DefaultScheduleMaxIntervalInHours) + TimeSpan.FromMinutes(_scheduleJobOptions.DistributedLockDurationBufferInMinutes);

      if (!await _distributedLockService.TryAcquireLockAsync(lockIdentifier, lockDuration))
      {
        _logger.LogInformation("{Process} is already running. Skipping execution attempt at {dateStamp}", nameof(ProcessExpirationNotifications), DateTimeOffset.UtcNow);
        return;
      }

      try
      {
        using (JobStorage.Current.GetConnection().AcquireDistributedLock(lockIdentifier, lockDuration))
        {
          _logger.LogInformation("Lock '{lockIdentifier}' acquired by {hostName} at {dateStamp}. Lock duration set to {lockDurationInMinutes} minutes",
            lockIdentifier, Environment.MachineName, DateTimeOffset.UtcNow, lockDuration.TotalMinutes);

          _logger.LogInformation("Processing opportunity expiration notifications");

          var datetimeFrom = new DateTimeOffset(DateTime.Today).ToUniversalTime();
          var datetimeTo = datetimeFrom.AddDays(_scheduleJobOptions.OpportunityExpirationNotificationIntervalInDays);
          var statusExpirableIds = Statuses_Expirable.Select(o => _opportunityStatusService.GetByName(o.ToString()).Id).ToList();

          var items = _opportunityRepository.Query().Where(o => statusExpirableIds.Contains(o.StatusId) &&
              o.DateEnd.HasValue && o.DateEnd.Value >= datetimeFrom && o.DateEnd.Value <= datetimeTo)
              .OrderBy(o => o.DateEnd).Take(_scheduleJobOptions.OpportunityExpirationBatchSize).ToList();
          if (items.Count == 0) return;

          await SendEmail(items, EmailType.Opportunity_Expiration_WithinNextDays);

          _logger.LogInformation("Processed opportunity expiration notifications");
        }
      }
      catch (DistributedLockTimeoutException ex)
      {
        _logger.LogError(ex, "Could not acquire distributed lock for {process}", nameof(ProcessExpirationNotifications));
      }
      catch (Exception ex)
      {
        _logger.LogError(ex, "Failed to execute {process}", nameof(ProcessExpirationNotifications));
      }
      finally
      {
        await _distributedLockService.ReleaseLockAsync(lockIdentifier);
      }
    }

    public async Task ProcessDeletion()
    {
      const string lockIdentifier = "opportunity_process_deletion";
      var dateTimeNow = DateTimeOffset.UtcNow;
      var executeUntil = dateTimeNow.AddHours(_scheduleJobOptions.DefaultScheduleMaxIntervalInHours);
      var lockDuration = executeUntil - dateTimeNow + TimeSpan.FromMinutes(_scheduleJobOptions.DistributedLockDurationBufferInMinutes);

      if (!await _distributedLockService.TryAcquireLockAsync(lockIdentifier, lockDuration))
      {
        _logger.LogInformation("{Process} is already running. Skipping execution attempt at {dateStamp}", nameof(ProcessDeletion), DateTimeOffset.UtcNow);
        return;
      }

      try
      {
        using (JobStorage.Current.GetConnection().AcquireDistributedLock(lockIdentifier, lockDuration))
        {
          _logger.LogInformation("Lock '{lockIdentifier}' acquired by {hostName} at {dateStamp}. Lock duration set to {lockDurationInMinutes} minutes",
            lockIdentifier, Environment.MachineName, DateTimeOffset.UtcNow, lockDuration.TotalMinutes);

          _logger.LogInformation("Processing opportunity deletion");

          var statusDeletionIds = Statuses_Deletion.Select(o => _opportunityStatusService.GetByName(o.ToString()).Id).ToList();
          var statusDeletedId = _opportunityStatusService.GetByName(Status.Deleted.ToString()).Id;

          while (executeUntil > DateTimeOffset.UtcNow)
          {
            {
              var items = _opportunityRepository.Query().Where(o => statusDeletionIds.Contains(o.StatusId) &&
                  o.DateModified <= DateTimeOffset.UtcNow.AddDays(-_scheduleJobOptions.OpportunityDeletionIntervalInDays))
                  .OrderBy(o => o.DateModified).Take(_scheduleJobOptions.OpportunityDeletionBatchSize).ToList();
              if (items.Count == 0) break;

              var user = _userService.GetByEmail(HttpContextAccessorHelper.GetUsernameSystem, false, false);

              foreach (var item in items)
              {
                item.StatusId = statusDeletedId;
                item.ModifiedByUserId = user.Id;
                _logger.LogInformation("Opportunity with id '{id}' flagged for deletion", item.Id);
              }

              await _opportunityRepository.Update(items);

              if (executeUntil <= DateTimeOffset.UtcNow) break;
            }
          }

          _logger.LogInformation("Processed opportunity deletion");
        }
      }
      catch (DistributedLockTimeoutException ex)
      {
        _logger.LogError(ex, "Could not acquire distributed lock for {process}", nameof(ProcessDeletion));
      }
      catch (Exception ex)
      {
        _logger.LogError(ex, "Failed to execute {process}", nameof(ProcessDeletion));
      }
      finally
      {
        await _distributedLockService.ReleaseLockAsync(lockIdentifier);
      }
    }
    #endregion

    #region Private Members
    private async Task SendEmail(List<Models.Opportunity> items, EmailType type)
    {
      var groupedOpportunities = items
          .SelectMany(op => _organizationService.ListAdmins(op.OrganizationId, false, false), (op, admin) => new { Administrator = admin, Opportunity = op })
          .GroupBy(item => item.Administrator, item => item.Opportunity);

      foreach (var group in groupedOpportunities)
      {
        try
        {
          var recipients = new List<EmailRecipient>
                        {
                            new() { Email = group.Key.Email, DisplayName = group.Key.DisplayName }
                        };

          recipients = _emailPreferenceFilterService.FilterRecipients(type, recipients);
          if (recipients == null || recipients.Count == 0) continue;

          var data = new EmailOpportunityExpiration
          {
            WithinNextDays = _scheduleJobOptions.OpportunityExpirationNotificationIntervalInDays,
            Opportunities = []
          };

          foreach (var op in group)
          {
            data.Opportunities.Add(new EmailOpportunityExpirationItem
            {
              Title = op.Title,
              DateStart = op.DateStart,
              DateEnd = op.DateEnd,
              URL = _emailURLFactory.OpportunityExpirationItemURL(type, op.Id, op.OrganizationId)
            });
          }

          await _emailProviderClient.Send(type, recipients, data);

          _logger.LogInformation("Successfully send '{emailType}' email", type);
        }
        catch (Exception ex)
        {
          _logger.LogError(ex, "Failed to send '{emailType}' email", type);
        }
      }
    }
    #endregion
  }
}
