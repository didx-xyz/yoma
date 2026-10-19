using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Yoma.Core.Domain.ActionLink.Interfaces;
using Yoma.Core.Domain.ActionLink.Interfaces.Lookups;
using Yoma.Core.Domain.ActionLink.Models;
using Yoma.Core.Domain.Core.Helpers;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;
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
    private readonly IRepositoryBatchedValueContainsWithUnnested<Link> _linkRepository;
    private readonly IDistributedLockService _distributedLockService;
    private readonly IHostApplicationLifetime _applicationLifetime;

    internal static readonly ActionLinkStatus[] Statuses_Expirable = [ActionLinkStatus.Active];
    internal static readonly ActionLinkStatus[] Statuses_Deletion = [ActionLinkStatus.Inactive];
    #endregion

    #region Constructor
    public LinkServiceBackgroundService(ILogger<LinkServiceBackgroundService> logger,
        IOptions<ScheduleJobOptions> scheduleJobOptions,
        ILinkStatusService linkStatusService,
        IUserService userService,
        IRepositoryBatchedValueContainsWithUnnested<Link> linkRepository,
        IDistributedLockService distributedLockService,
        IHostApplicationLifetime applicationLifetime)
    {
      _logger = logger;
      _scheduleJobOptions = scheduleJobOptions.Value;
      _linkStatusService = linkStatusService;
      _userService = userService;
      _linkRepository = linkRepository;
      _distributedLockService = distributedLockService;
      _applicationLifetime = applicationLifetime ?? throw new ArgumentNullException(nameof(applicationLifetime));
    }
    #endregion

    #region Public Members
    public async Task ProcessExpiration()
    {
      const string lockIdentifier = "action_link_process_expiration";

      var dateTimeNow = DateTimeOffset.UtcNow;
      var executeUntil = dateTimeNow.AddHours(_scheduleJobOptions.DefaultScheduleMaxIntervalInHours);
      var lockDuration = executeUntil - dateTimeNow + TimeSpan.FromMinutes(_scheduleJobOptions.DistributedLockDurationBufferInMinutes);

      await using var job = BackgroundJobExecutionScope.CreateWithLock(_applicationLifetime, _distributedLockService, _logger);

      try
      {
        if (!await job.TryAcquireLockAsync(lockIdentifier, lockDuration)) return;

        if (_logger.IsEnabled(LogLevel.Information)) _logger.LogInformation("Processing action link expiration");

        var statusExpiredId = _linkStatusService.GetByName(ActionLinkStatus.Expired.ToString()).Id;
        var statusExpirableIds = Statuses_Expirable.Select(o => _linkStatusService.GetByName(o.ToString()).Id).ToList();

        while (executeUntil > DateTimeOffset.UtcNow)
        {
          job.ThrowIfStopping();
          var now = DateTimeOffset.UtcNow;

          var items = _linkRepository.Query().Where(o => statusExpirableIds.Contains(o.StatusId) &&
              o.DateEnd.HasValue && o.DateEnd.Value <= now).OrderBy(o => o.DateEnd).Take(_scheduleJobOptions.ActionLinkExpirationScheduleBatchSize).ToList();
          if (items.Count == 0) break;

          var user = _userService.GetByUsername(HttpContextAccessorHelper.GetUsernameSystem, false, false);

          foreach (var item in items)
          {
            item.StatusId = statusExpiredId;
            item.Status = ActionLinkStatus.Expired;
            item.ModifiedByUserId = user.Id;
            if (_logger.IsEnabled(LogLevel.Information)) _logger.LogInformation("Action link with id '{id}' flagged for expiration", item.Id);
          }

          items = await _linkRepository.Update(items);

          if (executeUntil <= DateTimeOffset.UtcNow) break;
        }

        if (_logger.IsEnabled(LogLevel.Information)) _logger.LogInformation("Processed action link expiration");
      }
      catch (Exception ex)
      {
        job.ThrowIfStopping(ex);

        if (_logger.IsEnabled(LogLevel.Error)) _logger.LogError(ex, "Failed to execute {process}: {errorMessage}", nameof(ProcessExpiration), ex.Message);
      }
    }

    public async Task ProcessDeletion()
    {
      const string lockIdentifier = "action_link_process_deletion";
      var dateTimeNow = DateTimeOffset.UtcNow;
      var executeUntil = dateTimeNow.AddHours(_scheduleJobOptions.DefaultScheduleMaxIntervalInHours);
      var lockDuration = executeUntil - dateTimeNow + TimeSpan.FromMinutes(_scheduleJobOptions.DistributedLockDurationBufferInMinutes);

      await using var job = BackgroundJobExecutionScope.CreateWithLock(_applicationLifetime, _distributedLockService, _logger);

      try
      {
        if (!await job.TryAcquireLockAsync(lockIdentifier, lockDuration)) return;

        var statusDeletionIds = Statuses_Deletion.Select(o => _linkStatusService.GetByName(o.ToString()).Id).ToList();
        var statusDeletedId = _linkStatusService.GetByName(ActionLinkStatus.Deleted.ToString()).Id;

        if (_logger.IsEnabled(LogLevel.Information)) _logger.LogInformation("Processing action link deletion");

        while (executeUntil > DateTimeOffset.UtcNow)
        {
          job.ThrowIfStopping();
          var now = DateTimeOffset.UtcNow;

          var items = _linkRepository.Query().Where(o => statusDeletionIds.Contains(o.StatusId) &&
              o.DateModified <= now.AddDays(-_scheduleJobOptions.ActionLinkDeletionScheduleIntervalInDays))
              .OrderBy(o => o.DateModified).Take(_scheduleJobOptions.ActionLinkDeletionScheduleBatchSize).ToList();
          if (items.Count == 0) break;

          var user = _userService.GetByUsername(HttpContextAccessorHelper.GetUsernameSystem, false, false);

          foreach (var item in items)
          {
            item.StatusId = statusDeletedId;
            item.Status = ActionLinkStatus.Deleted;
            item.ModifiedByUserId = user.Id;
            if (_logger.IsEnabled(LogLevel.Information)) _logger.LogInformation("Action link with id '{id}' flagged for deletion", item.Id);
          }

          await _linkRepository.Update(items);

          if (executeUntil <= DateTimeOffset.UtcNow) break;
        }

        if (_logger.IsEnabled(LogLevel.Information)) _logger.LogInformation("Processed action link deletion");
      }
      catch (Exception ex)
      {
        job.ThrowIfStopping(ex);

        if (_logger.IsEnabled(LogLevel.Error)) _logger.LogError(ex, "Failed to execute {process}: {errorMessage}", nameof(ProcessDeletion), ex.Message);
      }
    }
    #endregion
  }
}
