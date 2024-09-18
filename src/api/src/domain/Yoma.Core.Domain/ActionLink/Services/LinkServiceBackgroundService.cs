using Hangfire;
using Hangfire.Storage;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Yoma.Core.Domain.ActionLink.Interfaces;
using Yoma.Core.Domain.ActionLink.Interfaces.Lookups;
using Yoma.Core.Domain.ActionLink.Models;
using Yoma.Core.Domain.Core.Helpers;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.EmailProvider;
using Yoma.Core.Domain.EmailProvider.Interfaces;
using Yoma.Core.Domain.EmailProvider.Models;
using Yoma.Core.Domain.Entity.Interfaces;

namespace Yoma.Core.Domain.ActionLink.Services
{
  public class LinkServiceBackgroundService : ILinkServiceBackgroundService
  {
    #region Class Variables
    private readonly ILogger<LinkServiceBackgroundService> _logger;
    private readonly ScheduleJobOptions _scheduleJobOptions;
    private readonly ILinkStatusService _linkStatusService;
    private readonly IUserService _userService;
    private readonly IOrganizationService _organizationService;
    private readonly IEmailProviderClient _emailProviderClient;
    private readonly IEmailURLFactory _emailURLFactory;
    private readonly IEmailPreferenceFilterService _emailPreferenceFilterService;
    private readonly IRepositoryBatched<Link> _linkRepository;
    private readonly IDistributedLockService _distributedLockService;

    private static readonly LinkStatus[] Statuses_Expirable = [LinkStatus.Active];
    private static readonly LinkStatus[] Statuses_Declination = [LinkStatus.Inactive];
    private static readonly LinkStatus[] Statuses_Deletion = [LinkStatus.Declined];
    #endregion

    #region Constructor
    public LinkServiceBackgroundService(ILogger<LinkServiceBackgroundService> logger,
        IOptions<ScheduleJobOptions> scheduleJobOptions,
        ILinkStatusService linkStatusService,
        IUserService userService,
        IOrganizationService organizationService,
        IEmailProviderClientFactory emailProviderClientFactory,
        IEmailURLFactory emailURLFactory,
        IEmailPreferenceFilterService emailPreferenceFilterService,
        IRepositoryBatched<Link> linkRepository,
        IDistributedLockService distributedLockService)
    {
      _logger = logger;
      _scheduleJobOptions = scheduleJobOptions.Value;
      _linkStatusService = linkStatusService;
      _userService = userService;
      _organizationService = organizationService;
      _emailProviderClient = emailProviderClientFactory.CreateClient();
      _emailURLFactory = emailURLFactory;
      _emailPreferenceFilterService = emailPreferenceFilterService;
      _linkRepository = linkRepository;
      _distributedLockService = distributedLockService;
    }
    #endregion

    #region Public Members
    public async Task ProcessExpiration()
    {
      const string lockIdentifier = "action_link_process_expiration";

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

          _logger.LogInformation("Processing action link expiration");

          var statusExpiredId = _linkStatusService.GetByName(LinkStatus.Expired.ToString()).Id;
          var statusExpirableIds = Statuses_Expirable.Select(o => _linkStatusService.GetByName(o.ToString()).Id).ToList();

          while (executeUntil > DateTimeOffset.UtcNow)
          {
            var items = _linkRepository.Query().Where(o => statusExpirableIds.Contains(o.StatusId) &&
                o.DateEnd.HasValue && o.DateEnd.Value <= DateTimeOffset.UtcNow).OrderBy(o => o.DateEnd).Take(_scheduleJobOptions.ActionLinkExpirationScheduleBatchSize).ToList();
            if (items.Count == 0) break;

            var user = _userService.GetByEmail(HttpContextAccessorHelper.GetUsernameSystem, false, false);

            foreach (var item in items)
            {
              item.StatusId = statusExpiredId;
              item.Status = LinkStatus.Expired;
              item.ModifiedByUserId = user.Id;
              _logger.LogInformation("Action link with id '{id}' flagged for expiration", item.Id);
            }

            items = await _linkRepository.Update(items);

            if (executeUntil <= DateTimeOffset.UtcNow) break;
          }

          _logger.LogInformation("Processed action link expiration");
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

    public async Task ProcessDeclination()
    {
      const string lockIdentifier = "action_link_process_declination";
      var dateTimeNow = DateTimeOffset.UtcNow;
      var executeUntil = dateTimeNow.AddHours(_scheduleJobOptions.DefaultScheduleMaxIntervalInHours);
      var lockDuration = executeUntil - dateTimeNow + TimeSpan.FromMinutes(_scheduleJobOptions.DistributedLockDurationBufferInMinutes);

      if (!await _distributedLockService.TryAcquireLockAsync(lockIdentifier, lockDuration))
      {
        _logger.LogInformation("{Process} is already running. Skipping execution attempt at {dateStamp}", nameof(ProcessDeclination), DateTimeOffset.UtcNow);
        return;
      }

      try
      {
        using (JobStorage.Current.GetConnection().AcquireDistributedLock(lockIdentifier, lockDuration))
        {
          _logger.LogInformation("Lock '{lockIdentifier}' acquired by {hostName} at {dateStamp}. Lock duration set to {lockDurationInMinutes} minutes",
            lockIdentifier, Environment.MachineName, DateTimeOffset.UtcNow, lockDuration.TotalMinutes);

          _logger.LogInformation("Processing action link declination");

          var statusDeclinationIds = Statuses_Declination.Select(o => _linkStatusService.GetByName(o.ToString()).Id).ToList();
          var statusDeclinedId = _linkStatusService.GetByName(LinkStatus.Declined.ToString()).Id;

          while (executeUntil > DateTimeOffset.UtcNow)
          {
            var items = _linkRepository.Query().Where(o => statusDeclinationIds.Contains(o.StatusId) &&
             o.DateModified <= DateTimeOffset.UtcNow.AddDays(-_scheduleJobOptions.ActionLinkDeclinationScheduleIntervalInDays))
             .OrderBy(o => o.DateModified).Take(_scheduleJobOptions.ActionLinkDeclinationScheduleBatchSize).ToList();
            if (items.Count == 0) break;

            var user = _userService.GetByEmail(HttpContextAccessorHelper.GetUsernameSystem, false, false);

            foreach (var item in items)
            {
              item.CommentApproval = $"Auto-Declined due to being {string.Join("/", Statuses_Declination).ToLower()} for more than {_scheduleJobOptions.ActionLinkDeclinationScheduleIntervalInDays} days";
              item.StatusId = statusDeclinedId;
              item.Status = LinkStatus.Declined;
              item.ModifiedByUserId = user.Id;
              _logger.LogInformation("Verify link with id '{id}' flagged for declination", item.Id);
            }

            items = await _linkRepository.Update(items);

            var emailType = EmailType.ActionLink_Verify_Approval_Declined;
            List<EmailRecipient>? recipients = null;
            foreach (var item in items)
            {
              try
              {
                var dataLink = new EmailActionLinkVerifyApprovalItem { Name = item.Name, EntityType = item.EntityType };

                var entityType = Enum.Parse<LinkEntityType>(item.EntityType, true);
                switch (entityType)
                {
                  case LinkEntityType.Opportunity:
                    if (!item.OpportunityOrganizationId.HasValue)
                      throw new InvalidOperationException("Opportunity organization details expected");

                    //send email to organization administrators
                    var organization = _organizationService.GetById(item.OpportunityOrganizationId.Value, true, false, false);

                    recipients = organization.Administrators?.Select(o => new EmailRecipient { Email = o.Email, DisplayName = o.DisplayName }).ToList();

                    recipients = _emailPreferenceFilterService.FilterRecipients(emailType, recipients);
                    if (recipients == null || recipients.Count == 0) continue;

                    dataLink.Comment = item.CommentApproval;
                    dataLink.URL = _emailURLFactory.ActionLinkVerifyApprovalItemUrl(emailType, organization.Id);

                    break;

                  default:
                    throw new InvalidOperationException($"Invalid / unsupported entity type of '{entityType}'");
                }

                var data = new EmailActionLinkVerifyApproval
                {
                  Links = [dataLink]
                };

                await _emailProviderClient.Send(emailType, recipients, data);

                _logger.LogInformation("Successfully send email");
              }
              catch (Exception ex)
              {
                _logger.LogError(ex, "Failed to send email");
              }
            }

            if (executeUntil <= DateTimeOffset.UtcNow) break;
          }

          _logger.LogInformation("Processed action link declination");
        }
      }
      catch (DistributedLockTimeoutException ex)
      {
        _logger.LogError(ex, "Could not acquire distributed lock for {process}", nameof(ProcessDeclination));
      }
      catch (Exception ex)
      {
        _logger.LogError(ex, "Failed to execute {process}", nameof(ProcessDeclination));
      }
      finally
      {
        await _distributedLockService.ReleaseLockAsync(lockIdentifier);
      }
    }

    public async Task ProcessDeletion()
    {
      const string lockIdentifier = "action_link_process_deletion";
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

          var statusDeletionIds = Statuses_Deletion.Select(o => _linkStatusService.GetByName(o.ToString()).Id).ToList();
          var statusDeletedId = _linkStatusService.GetByName(LinkStatus.Deleted.ToString()).Id;

          _logger.LogInformation("Processing action link deletion");

          while (executeUntil > DateTimeOffset.UtcNow)
          {
            var items = _linkRepository.Query().Where(o => statusDeletionIds.Contains(o.StatusId) &&
                o.DateModified <= DateTimeOffset.UtcNow.AddDays(-_scheduleJobOptions.ActionLinkDeletionScheduleIntervalInDays))
                .OrderBy(o => o.DateModified).Take(_scheduleJobOptions.ActionLinkDeletionScheduleBatchSize).ToList();
            if (items.Count == 0) break;

            var user = _userService.GetByEmail(HttpContextAccessorHelper.GetUsernameSystem, false, false);

            foreach (var item in items)
            {
              item.StatusId = statusDeletedId;
              item.Status = LinkStatus.Deleted;
              item.ModifiedByUserId = user.Id;
              _logger.LogInformation("Action link with id '{id}' flagged for deletion", item.Id);
            }

            await _linkRepository.Update(items);

            if (executeUntil <= DateTimeOffset.UtcNow) break;
          }

          _logger.LogInformation("Processed action link deletion");
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
  }
}
