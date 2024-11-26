using Hangfire;
using Hangfire.Storage;
using MediatR;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Yoma.Core.Domain.Core.Extensions;
using Yoma.Core.Domain.Core.Helpers;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.Notification;
using Yoma.Core.Domain.Notification.Interfaces;
using Yoma.Core.Domain.Notification.Models;
using Yoma.Core.Domain.Entity;
using Yoma.Core.Domain.Entity.Interfaces;
using Yoma.Core.Domain.Entity.Interfaces.Lookups;
using Yoma.Core.Domain.Entity.Models;
using Yoma.Core.Domain.Lookups.Interfaces;
using Yoma.Core.Domain.Opportunity.Events;
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
    private readonly IOrganizationStatusService _organizationStatusService;
    private readonly INotificationDeliveryService _notificationDeliveryService;
    private readonly IUserService _userService;
    private readonly ICountryService _countryService;
    private readonly INotificationURLFactory _notificationURLFactory;
    private readonly IRepositoryBatchedValueContainsWithNavigation<Models.Opportunity> _opportunityRepository;
    private readonly IDistributedLockService _distributedLockService;
    private readonly IMediator _mediator;
    private static readonly Status[] Statuses_Expirable = [Status.Active];
    private static readonly Status[] Statuses_Deletion = [Status.Inactive, Status.Expired];
    #endregion

    #region Constructor
    public OpportunityBackgroundService(ILogger<OpportunityBackgroundService> logger,
        IOptions<ScheduleJobOptions> scheduleJobOptions,
        IOpportunityStatusService opportunityStatusService,
        IOrganizationService organizationService,
        IOrganizationStatusService organizationStatusService,
        INotificationDeliveryService notificationDeliveryService,
        IUserService userService,
        ICountryService countryService,
        INotificationURLFactory notificationURLFactory,
        IRepositoryBatchedValueContainsWithNavigation<Models.Opportunity> opportunityRepository,
        IDistributedLockService distributedLockService,
        IMediator mediator)
    {
      _logger = logger;
      _scheduleJobOptions = scheduleJobOptions.Value;
      _opportunityStatusService = opportunityStatusService;
      _organizationService = organizationService;
      _organizationStatusService = organizationStatusService;
      _notificationDeliveryService = notificationDeliveryService;
      _userService = userService;
      _countryService = countryService;
      _notificationURLFactory = notificationURLFactory;
      _opportunityRepository = opportunityRepository;
      _distributedLockService = distributedLockService;
      _mediator = mediator;
    }
    #endregion

    #region Public Members
    public async Task ProcessPublishedNotifications()
    {
      const string lockIdentifier = "opportunity_process_published_notifications";
      var dateTimeNow = DateTimeOffset.UtcNow;
      var executeUntil = dateTimeNow.AddHours(_scheduleJobOptions.DefaultScheduleMaxIntervalInHours);
      var lockDuration = executeUntil - dateTimeNow + TimeSpan.FromMinutes(_scheduleJobOptions.DistributedLockDurationBufferInMinutes);

      if (!await _distributedLockService.TryAcquireLockAsync(lockIdentifier, lockDuration))
      {
        _logger.LogInformation("{Process} is already running. Skipping execution attempt at {dateStamp}", nameof(ProcessPublishedNotifications), DateTimeOffset.UtcNow);
        return;
      }

      try
      {
        using (JobStorage.Current.GetConnection().AcquireDistributedLock(lockIdentifier, lockDuration))
        {
          _logger.LogInformation("Lock '{lockIdentifier}' acquired by {hostName} at {dateStamp}. Lock duration set to {lockDurationInMinutes} minutes",
            lockIdentifier, Environment.MachineName, DateTimeOffset.UtcNow, lockDuration.TotalMinutes);

          _logger.LogInformation("Processing opportunity published notifications");

          var datetimeFrom = new DateTimeOffset(DateTime.Today).AddDays(-_scheduleJobOptions.OpportunityPublishedNotificationIntervalInDays).RemoveTime();
          var datetimeTo = datetimeFrom.ToEndOfDay();

          var statusActiveId = _opportunityStatusService.GetByName(Status.Active.ToString()).Id;
          var organizationStatusActiveId = _organizationStatusService.GetByName(OrganizationStatus.Active.ToString()).Id;

          var items = _opportunityRepository.Query(true).Where(o => o.OrganizationStatusId == organizationStatusActiveId //include children / countries
             && o.StatusId == statusActiveId && (!o.Hidden.HasValue || o.Hidden == false) && o.DateStart >= datetimeFrom && o.DateStart <= datetimeTo)
            .OrderBy(o => o.DateStart).ThenBy(o => o.Title).ThenBy(o => o.Id).ToList();
          if (items.Count == 0) return;

          await SendNotificationPublished(items, executeUntil);

          _logger.LogInformation("Processed opportunity published notifications");
        }
      }
      catch (DistributedLockTimeoutException ex)
      {
        _logger.LogError(ex, "Could not acquire distributed lock for {process}", nameof(ProcessPublishedNotifications));
      }
      catch (Exception ex)
      {
        _logger.LogError(ex, "Failed to execute {process}", nameof(ProcessPublishedNotifications));
      }
      finally
      {
        await _distributedLockService.ReleaseLockAsync(lockIdentifier);
      }
    }

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

            var user = _userService.GetByUsername(HttpContextAccessorHelper.GetUsernameSystem, false, false);

            foreach (var item in items)
            {
              item.StatusId = statusExpiredId;
              item.Status = Status.Expired;
              item.ModifiedByUserId = user.Id;
              _logger.LogInformation("Opportunity with id '{id}' flagged for expiration", item.Id);
            }

            items = await _opportunityRepository.Update(items);

            await SendNotificationExpiration(items, NotificationType.Opportunity_Expiration_Expired);

            foreach (var item in items)
              await _mediator.Publish(new OpportunityEvent(Core.EventType.Update, item));

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

          await SendNotificationExpiration(items, NotificationType.Opportunity_Expiration_WithinNextDays);

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

              var user = _userService.GetByUsername(HttpContextAccessorHelper.GetUsernameSystem, false, false);

              foreach (var item in items)
              {
                item.StatusId = statusDeletedId;
                item.Status = Status.Deleted;
                item.ModifiedByUserId = user.Id;
                _logger.LogInformation("Opportunity with id '{id}' flagged for deletion", item.Id);
              }

              await _opportunityRepository.Update(items);

              foreach (var item in items)
                await _mediator.Publish(new OpportunityEvent(Core.EventType.Delete, item));

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
    private async Task SendNotificationPublished(List<Models.Opportunity> items, DateTimeOffset executeUntil)
    {
      var notificationType = NotificationType.Opportunity_Published;
      var countryWorldWideId = _countryService.GetByCodeAplha2(Core.Country.Worldwide.ToDescription()).Id;

      try
      {
        var processedUserIds = new HashSet<Guid>();
        int pageNumber = 1;
        int pageSize = 1000;
        while (executeUntil > DateTimeOffset.UtcNow)
        {
          var recipientDataGroups = new List<(List<NotificationRecipient> Recipients, NotificationOpportunityAnnounced Data)>();

          var searchResult = _userService.Search(
              new UserSearchFilter // implicitly includes only users with a confirmed notification
              {
                YoIDOnboarded = true,
                PageNumber = pageNumber,
                PageSize = pageSize
              });
          if (searchResult.Items.Count == 0) break;

          var users = searchResult.Items
              .Where(o => !processedUserIds.Contains(o.Id))
              .ToList();
          users.ForEach(o => processedUserIds.Add(o.Id));
          if (users.Count == 0) break;

          // group users by country, defaulting to worldwide if not set
          var usersByCountry = users
              .GroupBy(u => u.CountryId ?? countryWorldWideId)
              .ToDictionary(group => group.Key, group => group.ToList());

          foreach (var userGroup in usersByCountry)
          {
            var countryId = userGroup.Key;

            // filter opportunities based on the user's country or worldwide, defaulting to worldwide if no countries are set
            var countryOpportunities = items
                .Where(opportunity => opportunity.Countries == null ||
                                      opportunity.Countries.Any(c => c.Id == countryId) ||
                                      opportunity.Countries.Any(c => c.Id == countryWorldWideId))
                .ToList();
            if (countryOpportunities.Count == 0) continue;

            var data = new NotificationOpportunityAnnounced
            {
              Opportunities = countryOpportunities.Select(item => new NotificationOpportunityAnnouncedItem
              {
                Id = item.Id,
                Title = item.Title,
                DateStart = item.DateStart,
                DateEnd = item.DateEnd,
                URL = _notificationURLFactory.OpportunityAnnouncedItemURL(notificationType, item.Id, item.OrganizationId),
                ZltoReward = item.ZltoReward,
                YomaReward = item.YomaReward
              }).ToList()
            };

            // check if an existing group with the same opportunity already exists
            var existingGroup = recipientDataGroups.FirstOrDefault(group =>
                new HashSet<Guid>(group.Data.Opportunities.Select(o => o.Id)).SetEquals(new HashSet<Guid>(countryOpportunities.Select(o => o.Id))));

            if (existingGroup.Equals(default((List<NotificationRecipient> Recipients, NotificationOpportunityAnnounced Data))))
            {
              // create a new recipient list
              var recipients = userGroup.Value.Select(u => new NotificationRecipient
              {
                Username = u.Username,
                PhoneNumber = u.PhoneNumber,
                Email = u.Email,
                DisplayName = u.DisplayName
              }).ToList();

              recipientDataGroups.Add((recipients, data));
            }
            else
            {
              // add recipients to the existing group
              existingGroup.Recipients.AddRange(userGroup.Value.Select(u => new NotificationRecipient
              {
                Username = u.Username,
                PhoneNumber = u.PhoneNumber,
                Email = u.Email,
                DisplayName = u.DisplayName
              }).ToList());
            }
          }

          // send notifications in one go for the paged results
          if (recipientDataGroups.Count > 0)
            await _notificationDeliveryService.Send(notificationType, recipientDataGroups);

          pageNumber++;

          if (executeUntil <= DateTimeOffset.UtcNow) break;
        }
      }
      catch (Exception ex)
      {
        _logger.LogError(ex, "Failed to send notification");
      }
    }

    private async Task SendNotificationExpiration(List<Models.Opportunity> items, NotificationType type)
    {
      var groupedOpportunities = items
        .SelectMany(op => _organizationService.ListAdmins(op.OrganizationId, false, false), (op, admin) => new { Administrator = admin, Opportunity = op })
        .GroupBy(item => item.Administrator, item => item.Opportunity);

      foreach (var group in groupedOpportunities)
      {
        try
        {
          var recipients = new List<NotificationRecipient>
                        {
                            new() { Username = group.Key.Username, PhoneNumber = group.Key.PhoneNumber, Email = group.Key.Email, DisplayName = group.Key.DisplayName }
                        };

          var data = new NotificationOpportunityExpiration
          {
            WithinNextDays = _scheduleJobOptions.OpportunityExpirationNotificationIntervalInDays,
            Opportunities = []
          };

          foreach (var op in group)
          {
            data.Opportunities.Add(new NotificationOpportunityExpirationItem
            {
              Title = op.Title,
              DateStart = op.DateStart,
              DateEnd = op.DateEnd,
              URL = _notificationURLFactory.OpportunityExpirationItemURL(type, op.Id, op.OrganizationId)
            });
          }

          await _notificationDeliveryService.Send(type, recipients, data);

          _logger.LogInformation("Successfully send notification");
        }
        catch (Exception ex)
        {
          _logger.LogError(ex, "Failed to send notification");
        }
      }
    }
    #endregion
  }
}
